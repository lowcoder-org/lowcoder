package org.lowcoder.api.usermanagement;

import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.api.authentication.dto.OrganizationDomainCheckResult;
import org.lowcoder.api.authentication.service.AuthenticationApiService;
import org.lowcoder.api.framework.view.PageResponseView;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.home.UserHomeApiService;
import org.lowcoder.api.home.UserHomepageView;
import org.lowcoder.api.usermanagement.view.OrgView;
import org.lowcoder.api.usermanagement.view.UpdateUserRequest;
import org.lowcoder.api.usermanagement.view.UserProfileView;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.user.constant.UserStatusType;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.model.UserDetail;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.domain.user.service.UserStatusService;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.constants.AuthSourceConstants;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.util.EmailUtils;
import org.lowcoder.sdk.util.PasswordRule;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.codec.multipart.Part;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.HashSet;
import java.util.stream.Collectors;

import static org.lowcoder.sdk.exception.BizError.INVALID_USER_STATUS;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;

@RequiredArgsConstructor
@RestController
public class UserController implements UserEndpoints
{
    private final SessionUserService sessionUserService;
    private final UserService userService;
    private final UserHomeApiService userHomeApiService;
    private final OrgApiService orgApiService;
    private final UserStatusService userStatusService;
    private final UserApiService userApiService;
    private final CommonConfig commonConfig;
    private final AuthenticationApiService authenticationApiService;
    private final OrgMemberService orgMemberService;
    private final OrganizationService organizationService;

    @Override
    public Mono<ResponseView<?>> createUserAndAddToOrg(@PathVariable String orgId, CreateUserRequest request) {
        return orgApiService.checkVisitorAdminRole(orgId).flatMap(__ ->
                        authenticationApiService.authenticateByForm(request.email(), request.password(),
                                AuthSourceConstants.EMAIL, true, null, orgId))
                .flatMap(authUser -> userService.createNewUserByAuthUser(authUser, false))
                .delayUntil(user -> orgMemberService.tryAddOrgMember(orgId, user.getId(), MemberRole.MEMBER))
                .delayUntil(user -> orgApiService.switchCurrentOrganizationTo(user.getId(), orgId))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<?>> createSCIMUserAndAddToOrg(@PathVariable String orgId, CreateUserRequest request) {
        // The third writer of an address, and the only one that validated nothing. A blank value creates a
        // row whose email is "" -- which findByEmailDeep can never resolve, since it short-circuits on
        // empty. The lookup below is fed the value AS SUPPLIED rather than the normalized one, so the
        // two-probe lookup gets both chances: the typed casing byte-exact, then the canonical form. It
        // does NOT find a row stored in some third casing -- e.g. stored "Stored@Example.COM" is not
        // reachable from "stored@example.com". Changeset 032 converges such rows, so what is left is one
        // the backfill deliberately froze as part of a reported conflict, or an install where 032 has not
        // run yet. Only what gets written is normalized.
        //
        // Authorize first, validate second: a caller who is not an org admin must be turned away by
        // checkVisitorAdminRole regardless of what they sent, and must not be able to tell a malformed
        // payload from a well-formed one by the error they get back.
        String normalizedEmail = EmailUtils.normalize(request.email());
        return orgApiService.checkVisitorAdminRole(orgId)
                .flatMap(__ -> {
                    if (!EmailUtils.looksLikeEmail(normalizedEmail)) {
                        return ofError(BizError.INVALID_EMAIL_FORMAT, "INVALID_EMAIL_FORMAT");
                    }
                    // For SCIM provisioning: Create a minimal user without auth connection
                    // The auth connection will be added on first SSO login via JIT provisioning
                    // This allows SCIM to pre-provision users while SSO handles authentication

                    // Check if user already exists by email
                    return userService.findByEmailDeep(request.email())
                            .flatMap(existingUser -> {
                                // User already exists, just add to org if not already a member
                                return orgMemberService.tryAddOrgMember(orgId, existingUser.getId(), MemberRole.MEMBER)
                                        .thenReturn(existingUser);
                            })
                            .switchIfEmpty(
                                    // Create new user without auth connection (placeholder for SSO)
                                    Mono.defer(() -> {
                                        User newUser = User.builder()
                                                .name(normalizedEmail)
                                                .email(normalizedEmail)
                                                .isEnabled(true)
                                                .build();
                                        newUser.setConnections(new HashSet<>());
                                        newUser.setIsNewUser(true);
                                        
                                        return userService.saveUser(newUser)
                                                .delayUntil(user -> orgMemberService.tryAddOrgMember(orgId, user.getId(), MemberRole.MEMBER));
                                    })
                            );
                })
                .delayUntil(user -> orgApiService.switchCurrentOrganizationTo(user.getId(), orgId))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<?>> getUserProfile(ServerWebExchange exchange) {
        return sessionUserService.getVisitor()
                .flatMap(user -> userHomeApiService.buildUserProfileView(user, exchange))
                .flatMap(view -> orgApiService.checkOrganizationDomain()
                        .flatMap(OrganizationDomainCheckResult::buildOrganizationDomainCheckView)
                        .switchIfEmpty(Mono.just(ResponseView.success(view))));
    }

    @Override
    public Mono<ResponseView<?>> getUserOrgs(ServerWebExchange exchange,
                                             @RequestParam(required = false) String orgName,
                                             @RequestParam(required = false, defaultValue = "1") Integer pageNum,
                                             @RequestParam(required = false, defaultValue = "10") Integer pageSize) {
        return sessionUserService.getVisitor()
                .flatMap(user -> {
                    Pageable pageable = PageRequest.of(pageNum - 1, pageSize, Sort.by(Sort.Direction.DESC, "updatedAt"));
                    String filter = orgName == null ? "" : orgName;
                    Mono<String> currentOrgIdMono = sessionUserService.getVisitorOrgMemberCache()
                            .map(OrgMember::getOrgId);
                    return organizationService.findUserOrgs(user.getId(), filter, pageable)
                            .map(OrgView::new)
                            .collectList()
                            .zipWith(organizationService.countUserOrgs(user.getId(), filter))
                            .zipWith(currentOrgIdMono)
                            .map(tuple -> {
                                List<OrgView> orgViews = tuple.getT1().getT1();
                                long total = tuple.getT1().getT2();
                                String currentOrgId = tuple.getT2();

                                // Create a list of maps each containing orgView and isCurrentOrg
                                List<Map<String, Object>> resultList = orgViews.stream()
                                        .map(orgView -> {
                                            Map<String, Object> map = new HashMap<>();
                                            map.put("orgView", orgView);
                                            map.put("isCurrentOrg", orgView.getOrgId().equals(currentOrgId));
                                            return map;
                                        })
                                        .sorted((a, b) -> Boolean.compare((Boolean) b.get("isCurrentOrg"), (Boolean) a.get("isCurrentOrg")))
                                        .collect(Collectors.toList());

                                return PageResponseView.success(resultList, pageNum, pageSize, (int) total);
                            });
                })
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> newUserGuidanceShown() {
        return sessionUserService.getVisitorId()
                .flatMap(userHomeApiService::markNewUserGuidanceShown)
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> markStatus(@RequestBody MarkUserStatusRequest request) {
        UserStatusType userStatusType = UserStatusType.fromValue(request.type());
        if (userStatusType == null) {
            return ofError(INVALID_USER_STATUS, "INVALID_USER_STATUS", request.type());
        }

        return sessionUserService.getVisitorId()
                .flatMap(visitorId -> userStatusService.mark(visitorId, userStatusType, request.value()))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<UserProfileView>> update(@RequestBody UpdateUserRequest updateUserRequest, ServerWebExchange exchange) {
        return sessionUserService.getVisitorId()
                .flatMap(uid -> updateUser(uid, updateUserRequest, exchange));
    }

    @Override
    public Mono<ResponseView<UserProfileView>> update(@PathVariable String orgId, @PathVariable String userId, @RequestBody UpdateUserRequest updateUserRequest, ServerWebExchange exchange) {
        return checkVisitorManagesMember(orgId, userId)
                .flatMap(__ -> updateManagedUser(userId, updateUserRequest));
    }

    public Mono<ResponseView<UserProfileView>> updateUser(String userId, @RequestBody UpdateUserRequest updateUserRequest, ServerWebExchange exchange) {
        User updateUser = new User();
        if (StringUtils.isNotBlank(updateUserRequest.getName())) {
            updateUser.setName(updateUserRequest.getName());
            updateUser.setHasSetNickname(true);
        }
        if (StringUtils.isNotBlank(updateUserRequest.getUiLanguage())) {
            updateUser.setUiLanguage(updateUserRequest.getUiLanguage());
        }
        return userService.update(userId, updateUser)
            .flatMap(user -> userHomeApiService.buildUserProfileView(user, exchange))
            .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> uploadProfilePhoto(@RequestPart("file") Mono<Part> fileMono) {
        return fileMono.zipWith(sessionUserService.getVisitor())
                .flatMap(tuple -> userService.saveProfilePhoto(tuple.getT1(), tuple.getT2()))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> uploadProfilePhotoById(@PathVariable String orgId, @PathVariable String userId, @RequestPart("file") Mono<Part> fileMono) {
        return checkVisitorManagesMember(orgId, userId)
                .then(userService.findById(userId))
                .flatMap(user -> fileMono.flatMap(file -> userService.saveProfilePhoto(file, user)))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Void>> deleteProfilePhoto() {
        return sessionUserService.getVisitor()
                .flatMap(visitor -> userService.deleteProfilePhoto(visitor)
                        .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Void>> deleteProfilePhotoById(@PathVariable String orgId, @PathVariable String userId) {
        return checkVisitorManagesMember(orgId, userId).then(userService.findById(userId))
                .flatMap(user -> userService.deleteProfilePhoto(user)
                        .map(ResponseView::success));
    }

    @Override
    public Mono<Void> getProfilePhoto(ServerWebExchange exchange) {
        return sessionUserService.getVisitorId()
                .flatMap(userId -> getProfilePhoto(exchange, userId));
    }

    @Override
    public Mono<Void> getProfilePhoto(ServerWebExchange exchange, @PathVariable String userId) {
        return userService.getUserAvatar(exchange, userId)
                .switchIfEmpty(Mono.fromRunnable(() -> exchange.getResponse().setStatusCode(HttpStatus.NOT_FOUND)));
    }

    @Override
    public Mono<ResponseView<Boolean>> updatePassword(@RequestBody UpdatePasswordRequest request) {
        if (StringUtils.isBlank(request.oldPassword()) || StringUtils.isBlank(request.newPassword())) {
            return ofError(BizError.INVALID_PARAMETER, "PASSWORD_EMPTY");
        }
        if (!PasswordRule.isAcceptable(request.newPassword())) {
            return ofError(BizError.INVALID_PASSWORD, "PASSWORD_TOO_WEAK"); // D-48: before the old password is checked or anything is written
        }
        return sessionUserService.getVisitorId()
                .flatMap(visitorId -> userService.updatePassword(visitorId, request.oldPassword(), request.newPassword()).delayUntil(changed -> endOtherSessionsOf(visitorId))) // D-34
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<String>> resetPassword(@RequestBody ResetPasswordRequest request) {
        if (!commonConfig.isEnterpriseMode()) {
            return ofError(BizError.UNSUPPORTED_OPERATION, "BAD_REQUEST");
        }
        if (StringUtils.isBlank(request.userId())) {
            return ofError(BizError.INVALID_PARAMETER, "INVALID_USER_ID");
        }
        return userApiService.resetPassword(request.userId())
                .map(ResponseView::success);

    }

    @Override
    public Mono<ResponseView<Boolean>> lostPassword(@RequestBody LostPasswordRequest request) {
        if (StringUtils.isBlank(request.userEmail())) {
            return Mono.empty();
        }
        return userApiService.lostPassword(request.userEmail())
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> resetLostPassword(@RequestBody ResetLostPasswordRequest request) {
        if (StringUtils.isBlank(request.userEmail()) || StringUtils.isBlank(request.token())
                || StringUtils.isBlank(request.newPassword())) {
            return ofError(BizError.INVALID_PARAMETER, "INVALID_PARAMETER");
        }
        if (!PasswordRule.isAcceptable(request.newPassword())) {
            return ofError(BizError.INVALID_PASSWORD, "PASSWORD_TOO_WEAK"); // D-48: before the token is checked or used
        }

        return userApiService.resetLostPassword(request.userEmail(), request.token(), request.newPassword())
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> setPassword(@RequestParam String password) {
        if (StringUtils.isBlank(password)) {
            return ofError(BizError.INVALID_PARAMETER, "PASSWORD_EMPTY");
        }
        if (!PasswordRule.isAcceptable(password)) {
            return ofError(BizError.INVALID_PASSWORD, "PASSWORD_TOO_WEAK"); // D-48: before setPasswordIfAbsent, which decides and writes in one update
        }
        return sessionUserService.getVisitorId()
                .flatMap(visitorId -> userService.setPasswordIfAbsent(visitorId, password)) // D-49: refuses an account that has a password
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<UserDetail>> getCurrentUser(ServerWebExchange exchange) {
        return sessionUserService.getVisitor()
                .flatMap(user -> userService.buildUserDetail(user, false))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<?>> getUserDetail(@PathVariable("id") String userId) {
        return userApiService.getUserDetailById(userId)
                .map(ResponseView::success);
    }

    /**
     * The admin route's own mutation: same field mapping as {@link #updateUser}, but answers the reduced
     * {@link #managedUserView(User)} instead of {@link UserHomeApiService#buildUserProfileView}, so the target's
     * session tokens and other workspaces never go back to the admin that renamed them.
     */
    private Mono<ResponseView<UserProfileView>> updateManagedUser(String userId, UpdateUserRequest updateUserRequest) {
        User updateUser = new User();
        if (StringUtils.isNotBlank(updateUserRequest.getName())) {
            updateUser.setName(updateUserRequest.getName());
            updateUser.setHasSetNickname(true);
        }
        if (StringUtils.isNotBlank(updateUserRequest.getUiLanguage())) {
            updateUser.setUiLanguage(updateUserRequest.getUiLanguage());
        }
        return userService.update(userId, updateUser)
                .map(UserController::managedUserView)
                .map(ResponseView::success);
    }

    /**
     * The admin route's answer for a managed user: only the UI-relevant fields an admin needs to see the
     * result of a rename or photo change. {@code UserProfileView} actually serializes 19 top-level keys, not its
     * 17 fields (Jackson's duplicate aliases for {@code isAnonymous}/{@code isEnabled}, and {@code isOrgDev}
     * serializing as {@code orgDev}) -- every key this method leaves
     * unset stays at the builder's default, so the target's session tokens ({@code connections}), other
     * workspaces ({@code orgAndRoles}), current org, status, IP and creation time never reach the caller.
     */
    private static UserProfileView managedUserView(User user) {
        return UserProfileView.builder()
                .id(user.getId())
                .username(user.getName())
                .isAnonymous(user.isAnonymous())
                .uiLanguage(user.getUiLanguage())
                .avatarUrl(user.getAvatarUrl())
                .avatar(user.getAvatar())
                .hasSetNickname(user.isHasSetNickname())
                .isEnabled(org.apache.commons.lang3.BooleanUtils.isNotFalse(user.getIsEnabled()))
                .build();
    }

    /**
     * The visitor must be ADMIN or SUPER_ADMIN of {@code orgId} ({@link OrgApiService#checkVisitorAdminRole}), and
     * {@code userId} must be a member of {@code orgId} -- else {@code NOT_AUTHORIZED}, the same answer for both,
     * so "no such user" and "not in this workspace" cannot be told apart. A SUPER_ADMIN target can only be
     * managed by itself or another SUPER_ADMIN of {@code orgId}, the same rank rule
     * {@code OrgApiServiceImpl#checkSuperAdminRoleUnchanged} applies to a role change; otherwise
     * {@code UNSUPPORTED_OPERATION}. Limits: check-then-act, not fixed here -- a role or membership change between
     * this check and the caller's mutation is not caught.
     */
    private Mono<OrgMember> checkVisitorManagesMember(String orgId, String userId) {
        return orgApiService.checkVisitorAdminRole(orgId)
                .flatMap(visitor -> orgMemberService.getOrgMember(orgId, userId)
                        .switchIfEmpty(ofError(BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED"))
                        .flatMap(target -> {
                            boolean visitorIsTarget = visitor.getUserId().equals(userId);
                            boolean visitorIsSuperAdmin = visitor.getRole() == MemberRole.SUPER_ADMIN;
                            if (target.getRole() == MemberRole.SUPER_ADMIN && !visitorIsTarget && !visitorIsSuperAdmin) {
                                return ofError(BizError.UNSUPPORTED_OPERATION, "BAD_REQUEST");
                            }
                            return Mono.just(target);
                        }));
    }

    /** D-34: ends every session of the user except the one making this request (none kept for a request without a session cookie). */
    private Mono<Void> endOtherSessionsOf(String userId) {
        return sessionUserService.getVisitorToken()
                .flatMap(token -> sessionUserService.endSessionsOfUser(userId, token));
    }
}
