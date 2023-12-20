package org.lowcoder.api.usermanagement;

import static org.lowcoder.sdk.exception.BizError.LAST_ADMIN_CANNOT_LEAVE_ORG;
import static org.lowcoder.sdk.exception.BizError.UNSUPPORTED_OPERATION;
import static org.lowcoder.sdk.util.ExceptionUtils.deferredError;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;
import static org.lowcoder.sdk.util.StreamUtils.collectSet;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import org.apache.commons.collections4.SetUtils;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.api.authentication.dto.OrganizationDomainCheckResult;
import org.lowcoder.api.bizthreshold.AbstractBizThresholdChecker;
import org.lowcoder.api.config.ConfigView;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.usermanagement.view.OrgMemberListView;
import org.lowcoder.api.usermanagement.view.OrgView;
import org.lowcoder.api.usermanagement.view.UpdateOrgRequest;
import org.lowcoder.api.usermanagement.view.UpdateRoleRequest;
import org.lowcoder.api.usermanagement.view.OrgMemberListView.OrgMemberView;
import org.lowcoder.domain.authentication.AuthenticationService;
import org.lowcoder.domain.authentication.FindAuthConfig;
import org.lowcoder.domain.group.service.GroupService;
import org.lowcoder.domain.organization.event.OrgMemberLeftEvent;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.OrganizationDomain;
import org.lowcoder.domain.organization.model.Organization.OrganizationCommonSettings;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.user.model.Connection;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.infra.serverlog.ServerLogService;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.CommonConfig.Workspace;
import org.lowcoder.sdk.constants.WorkspaceMode;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.util.UriUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.http.codec.multipart.Part;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Slf4j
@Service
public class OrgApiServiceImpl implements OrgApiService {

    @Autowired
    private SessionUserService sessionUserService;
    @Autowired
    private OrgMemberService orgMemberService;
    @Autowired
    private UserService userService;
    @Autowired
    private OrganizationService organizationService;
    @Autowired
    private AbstractBizThresholdChecker bizThresholdChecker;
    @Autowired
    private ApplicationContext applicationContext;
    @Autowired
    private CommonConfig commonConfig;
    @Autowired
    private GroupService groupService;
    @Autowired
    private AuthenticationService authenticationService;

    @Autowired
    private ServerLogService serverLogService;

    @Override
    public Mono<OrgMemberListView> getOrganizationMembers(String orgId, int page, int count) {
        return sessionUserService.getVisitorId()
                .flatMap(visitorId -> orgMemberService.getOrgMember(orgId, visitorId))
                .switchIfEmpty(deferredError(BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED"))
                .then(getOrgMemberListView(orgId, page, count));
    }

    private Mono<OrgMemberListView> getOrgMemberListView(String orgId, int page, int count) {
        return orgMemberService.getOrganizationMembers(orgId, page, count)
                .collectList()
                .flatMap(orgMembers -> {
                    List<String> userIds = orgMembers.stream()
                            .map(OrgMember::getUserId)
                            .collect(Collectors.toList());
                    Mono<Map<String, User>> users = userService.getByIds(userIds);

                    return users.map(map -> orgMembers.stream()
                            .map(orgMember -> {
                                User user = map.get(orgMember.getUserId());
                                if (user == null) {
                                    log.warn("user {} not exist and will be removed from the result.", orgMember.getUserId());
                                    return null;
                                }
                                return build(user, orgMember);
                            })
                            .filter(Objects::nonNull)
                            .collect(Collectors.toList())
                    );
                })
                .zipWith(sessionUserService.getVisitorOrgMemberCache())
                .map(tuple -> {
                    List<OrgMemberView> orgMemberViews = tuple.getT1();
                    OrgMember orgMember = tuple.getT2();
                    return OrgMemberListView.builder()
                            .members(orgMemberViews)
                            .visitorRole(orgMember.getRole().getValue())
                            .build();
                });
    }

    protected OrgMemberView build(User user, OrgMember orgMember) {
        String orgId = orgMember.getOrgId();
        return OrgMemberView.builder()
                .name(user.getName())
                .userId(user.getId())
                .role(orgMember.getRole().getValue())
                .avatarUrl(user.getAvatarUrl())
                .joinTime(orgMember.getJoinTime())
                .rawUserInfos(findRawUserInfos(user, orgId))
                .build();
    }

    protected Map<String, Map<String, Object>> findRawUserInfos(User user, String orgId) {
        return SetUtils.emptyIfNull(user.getConnections())
                .stream()
                .filter(connection -> {
                    if (commonConfig.isCloud()) {
                        return connection.containOrg(orgId);
                    }
                    return true;
                })
                .collect(Collectors.toMap(Connection::getSource, Connection::getRawUserInfo, (map, map2) -> map));
    }

    @Override
    public Mono<Boolean> updateRoleForMember(String orgId, UpdateRoleRequest updateRoleRequest) {
        return checkVisitorAdminRole(orgId)
                .then(checkDeveloperCount(orgId, updateRoleRequest.getRole(), updateRoleRequest.getUserId()))
                .then(orgMemberService.updateMemberRole(orgId,
                        updateRoleRequest.getUserId(),
                        MemberRole.fromValue(updateRoleRequest.getRole())));
    }

    private Mono<OrgMember> checkVisitorAdminRole(String orgId) {
        return sessionUserService.getVisitorId()
                .flatMap(visitor -> orgMemberService.getOrgMember(orgId, visitor))
                .filter(it -> it.getRole() == MemberRole.ADMIN)
                .switchIfEmpty(deferredError(BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED"));
    }

    private Mono<Void> checkDeveloperCount(String orgId, String role, String userId) {
        if (!MemberRole.isAdmin(role)) {
            return Mono.empty();
        }
        return groupService.getDevGroup(orgId)
                .flatMap(group -> bizThresholdChecker.checkMaxDeveloperCount(orgId, group.getId(), userId));
    }


    @Override
    public Mono<Boolean> switchCurrentOrganizationTo(String nextCurrentOrgId) {
        return sessionUserService.getVisitorId()
                .flatMap(it -> orgMemberService.getAllActiveOrgs(it).collectList())
                .defaultIfEmpty(Collections.emptyList())
                .flatMap(orgMembers -> {
                    if (!collectSet(orgMembers, OrgMember::getOrgId).contains(nextCurrentOrgId)) {
                        return Mono.error(new BizException(BizError.INVALID_ORG_ID, "INVALID_ORG_ID"));
                    }

                    String userId = orgMembers.get(0).getUserId();

                    Optional<OrgMember> previousCurrentOrgMember = orgMembers.stream()
                            .filter(OrgMember::isCurrentOrg)
                            .findFirst();
                    if (previousCurrentOrgMember.isPresent()) {
                        OrgMember orgMember = previousCurrentOrgMember.get();
                        String previousCurrentOrgId = orgMember.getOrgId();
                        if (StringUtils.equals(previousCurrentOrgId, nextCurrentOrgId)) {
                            return Mono.just(true);
                        }
                        return orgMemberService.removeCurrentOrgMark(previousCurrentOrgId, userId)
                                .flatMap(removeResult -> {
                                    if (removeResult) {
                                        return orgMemberService.markAsUserCurrentOrgId(nextCurrentOrgId, userId);
                                    }
                                    return Mono.error(new BizException(BizError.SWITCH_CURRENT_ORG_ERROR, "SWITCH_CURRENT_ORG_ERROR"));
                                });
                    }
                    return orgMemberService.markAsUserCurrentOrgId(nextCurrentOrgId, userId);
                });
    }

    @Override
    public Mono<Boolean> leaveOrganization(String orgId) {
        return Mono.zip(sessionUserService.getVisitorId(), orgMemberService.getAllOrgAdmins(orgId))
                .flatMap(tuple -> {
                    String visitorId = tuple.getT1();
                    List<OrgMember> orgAdmins = tuple.getT2();
                    if (orgAdmins.size() == 1 && orgAdmins.get(0).getUserId().equals(visitorId)) {
                        return ofError(LAST_ADMIN_CANNOT_LEAVE_ORG, "LAST_ADMIN_CANNOT_LEAVE_ORG");
                    }
                    return orgMemberService.removeMember(orgId, visitorId)
                            .handle((result, sink) -> {
                                if (result) {
                                    applicationContext.publishEvent(new OrgMemberLeftEvent(orgId, visitorId));
                                    sink.next(true);
                                    return;
                                }
                                sink.next(false);
                            });
                });
    }

    @Override
    public Mono<Boolean> deleteLogo(String orgId) {
        return checkVisitorAdminRole(orgId)
                .then(organizationService.deleteLogo(orgId));
    }

    @Override
    public Mono<Boolean> uploadLogo(String orgId, Mono<Part> fileMono) {
        return checkVisitorAdminRole(orgId)
                .then(fileMono)
                .flatMap(file -> organizationService.uploadLogo(orgId, file));
    }

    /**
     * Remove the specified user from the organization, and if in enterprise mode, mark the user deleted.
     */
    @Override
    public Mono<Boolean> removeUserFromOrg(String orgId, String userId) {
        return checkVisitorAdminRole(orgId)
                .then(orgMemberService.removeMember(orgId, userId))
                .doOnNext(result -> {
                    if (result) {
                        applicationContext.publishEvent(new OrgMemberLeftEvent(orgId, userId));
                    }
                })
                .delayUntil(__ -> userService.markUserDeletedAndInvalidConnectionsAtEnterpriseMode(userId));
    }

    @Override
    public Mono<Boolean> removeOrg(String orgId) {
        return checkVisitorAdminRole(orgId)
                .then(Mono.defer(() -> {
                    Workspace workspace = commonConfig.getWorkspace();
                    if (workspace.getMode() == WorkspaceMode.ENTERPRISE && orgId.equals(workspace.getEnterpriseOrgId())) {
                        return Mono.error(new BizException(UNSUPPORTED_OPERATION, "BAD_REQUEST"));
                    }
                    return Mono.empty();
                }))
                .then(organizationService.delete(orgId));
    }

    @Override
    public Mono<OrgView> create(Organization organization) {
        return sessionUserService.getVisitorId()
                .delayUntil(userId -> bizThresholdChecker.checkMaxOrgCount(userId))
                .delayUntil(__ -> checkIfSaasMode())
                .flatMap(userId -> organizationService.create(organization, userId))
                .map(OrgView::new);
    }

    @Override
    public Mono<Boolean> update(String orgId, UpdateOrgRequest updateOrgRequest) {
        return checkVisitorAdminRole(orgId)
                .flatMap(orgMember -> {
                    Organization updateOrg = new Organization();
                    updateOrg.setName(updateOrgRequest.getOrgName());
                    updateOrg.setContactEmail(updateOrgRequest.getContactEmail());
                    updateOrg.setContactPhoneNumber(updateOrgRequest.getContactPhoneNumber());
                    updateOrg.setContactName(updateOrgRequest.getContactName());
                    return organizationService.update(orgId, updateOrg);
                });
    }

    @Override
    public Mono<OrganizationDomainCheckResult> checkOrganizationDomain() {
        if (!commonConfig.isCloud()) {
            return Mono.just(OrganizationDomainCheckResult.success());
        }
        return sessionUserService.getVisitor()
                .flatMap(this::doCheckOrganizationDomain);

    }

    private Mono<OrganizationDomainCheckResult> doCheckOrganizationDomain(User user) {
        if (user.isAnonymous()) {
            return Mono.just(OrganizationDomainCheckResult.success());
        }

        return sessionUserService.getVisitorOrgMemberCache()
                .zipWhen(orgMember -> organizationService.getById(orgMember.getOrgId()))
                .zipWith(UriUtils.getRefererDomainFromContext())
                .flatMap(tuple -> {
                    String userId = tuple.getT1().getT1().getUserId();
                    Organization userCurrentOrg = tuple.getT1().getT2();
                    String currentRequestDomain = tuple.getT2();
                    String currentOrgDomain = Optional.ofNullable(userCurrentOrg.getOrganizationDomain())
                            .map(OrganizationDomain::getDomain)
                            .orElse(commonConfig.getDomain().getDefaultValue());
                    if (currentOrgDomain.equals("skipCheck")) {
                        return Mono.just(OrganizationDomainCheckResult.success());
                    }
                    // domain matches with org
                    if (currentRequestDomain.equalsIgnoreCase(currentOrgDomain)) {
                        return Mono.just(OrganizationDomainCheckResult.success());
                    }
                    // domain do not match with org
                    return dealWithMismatchDomain(currentRequestDomain, userId, currentOrgDomain);
                })
                .defaultIfEmpty(OrganizationDomainCheckResult.success());
    }

    private Mono<OrganizationDomainCheckResult> dealWithMismatchDomain(String requestDomain, String userId, String currentOrgDomain) {
        return organizationService.getByDomain()
                .flatMap(requestDomainOrg -> dealWithOrganizationDomain(userId, currentOrgDomain, requestDomainOrg))
                .defaultIfEmpty(OrganizationDomainCheckResult.redirect(currentOrgDomain));
    }

    private Mono<OrganizationDomainCheckResult> dealWithOrganizationDomain(String userId, String currentOrgDomain, Organization requestDomainOrg) {
        return orgMemberService.getOrgMember(requestDomainOrg.getId(), userId)
                .flatMap(orgMember -> Mono.just(OrganizationDomainCheckResult.redirect(currentOrgDomain)))
                .defaultIfEmpty(OrganizationDomainCheckResult.bind());
    }

    @Override
    public Mono<OrganizationCommonSettings> getOrgCommonSettings(String orgId) {
        return sessionUserService.getVisitorId()
                .flatMap(visitor -> orgMemberService.getOrgMember(orgId, visitor))
                .switchIfEmpty(deferredError(BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED"))
                .flatMap(it -> organizationService.getById(orgId))
                .map(Organization::getCommonSettings);
    }

    @Override
    public Mono<Boolean> updateOrgCommonSettings(String orgId, String key, Object value) {
        return checkVisitorAdminRole(orgId)
                .flatMap(__ -> organizationService.updateCommonSettings(orgId, key, value));
    }

    @Override
    public Mono<Boolean> tryAddUserToOrgAndSwitchOrg(String orgId, String userId) {
        return orgMemberService.tryAddOrgMember(orgId, userId, MemberRole.MEMBER)
                .then(switchCurrentOrganizationTo(orgId));
    }

    @Override
    public Mono<ConfigView> getOrganizationConfigs(String orgId) {
        return authenticationService.findAllAuthConfigs(orgId,true)
                .map(FindAuthConfig::authConfig)
                .collectList()
                .zipWith(organizationService.getByDomain().hasElement())
                .map(tuple -> {
                    List<AbstractAuthConfig> authConfigs = tuple.getT1();
                    Boolean hasSelfDomain = tuple.getT2();
                    return ConfigView.builder()
                            .authConfigs(authConfigs)
                            .isCloudHosting(commonConfig.isCloud())
                            .workspaceMode(commonConfig.getWorkspace().getMode())
                            .selfDomain(hasSelfDomain)
                            .cookieName(commonConfig.getCookieName())
                            .build();
                });
    }

    @Override
    public Mono<Long> getApiUsageCount(String orgId, Boolean lastMonthOnly) {
        return checkVisitorAdminRole(orgId)
                .flatMap(orgMember -> serverLogService.getApiUsageCount(orgId, lastMonthOnly));
    }

    private Mono<Void> checkIfSaasMode() {
        return Mono.defer(() -> {
            if (commonConfig.getWorkspace().getMode() == WorkspaceMode.ENTERPRISE) {
                return Mono.error(new BizException(UNSUPPORTED_OPERATION, "BAD_REQUEST"));
            }
            return Mono.empty();
        });
    }
}