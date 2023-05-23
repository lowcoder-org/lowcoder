package org.lowcoder.api.usermanagement;

import static org.lowcoder.sdk.exception.BizError.INVALID_USER_STATUS;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;

import org.apache.commons.lang3.StringUtils;
import org.lowcoder.api.authentication.dto.OrganizationDomainCheckResult;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.home.UserHomeApiService;
import org.lowcoder.api.usermanagement.view.UpdateUserRequest;
import org.lowcoder.api.usermanagement.view.UserProfileView;
import org.lowcoder.domain.user.constant.UserStatusType;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.model.UserDetail;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.domain.user.service.UserStatusService;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.infra.constant.Url;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.exception.BizError;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Slf4j
@RestController
@RequestMapping(value = {Url.USER_URL, NewUrl.USER_URL})
public class UserController {

    @Autowired
    private SessionUserService sessionUserService;

    @Autowired
    private UserService userService;

    @Autowired
    private UserHomeApiService userHomeApiService;

    @Autowired
    private OrgApiService orgApiService;

    @Autowired
    private UserStatusService userStatusService;

    @Autowired
    private UserApiService userApiService;

    @Autowired
    private CommonConfig commonConfig;

    @GetMapping("/me")
    public Mono<ResponseView<?>> getUserProfile(ServerWebExchange exchange) {
        return sessionUserService.getVisitor()
                .flatMap(user -> userHomeApiService.buildUserProfileView(user, exchange))
                .flatMap(view -> orgApiService.checkOrganizationDomain()
                        .flatMap(OrganizationDomainCheckResult::buildOrganizationDomainCheckView)
                        .switchIfEmpty(Mono.just(ResponseView.success(view))));
    }

    @PutMapping("/newUserGuidanceShown")
    public Mono<ResponseView<Boolean>> newUserGuidanceShown() {
        return sessionUserService.getVisitorId()
                .flatMap(userHomeApiService::markNewUserGuidanceShown)
                .map(ResponseView::success);
    }

    @PutMapping("/mark-status")
    public Mono<ResponseView<Boolean>> markStatus(@RequestBody MarkUserStatusRequest request) {
        UserStatusType userStatusType = UserStatusType.fromValue(request.type());
        if (userStatusType == null) {
            return ofError(INVALID_USER_STATUS, "INVALID_USER_STATUS", request.type());
        }

        return sessionUserService.getVisitorId()
                .flatMap(visitorId -> userStatusService.mark(visitorId, userStatusType, request.value()))
                .map(ResponseView::success);
    }

    @PutMapping
    public Mono<ResponseView<UserProfileView>> update(@RequestBody UpdateUserRequest updateUserRequest, ServerWebExchange exchange) {
        return sessionUserService.getVisitorId()
                .flatMap(uid -> {
                    User updateUser = new User();
                    if (StringUtils.isNotBlank(updateUserRequest.getName())) {
                        updateUser.setName(updateUserRequest.getName());
                        updateUser.setHasSetNickname(true);
                    }
                    return userService.update(uid, updateUser);
                })
                .flatMap(user -> userHomeApiService.buildUserProfileView(user, exchange))
                .map(ResponseView::success);
    }

    @PostMapping(value = "/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseView<Boolean>> uploadProfilePhoto(@RequestPart("file") Mono<Part> fileMono) {
        return fileMono.zipWith(sessionUserService.getVisitor())
                .flatMap(tuple -> userService.saveProfilePhoto(tuple.getT1(), tuple.getT2()))
                .map(ResponseView::success);
    }

    @DeleteMapping("/photo")
    public Mono<ResponseView<Void>> deleteProfilePhoto() {
        return sessionUserService.getVisitor()
                .flatMap(visitor -> userService.deleteProfilePhoto(visitor)
                        .map(ResponseView::success));
    }

    @GetMapping("/photo")
    public Mono<Void> getProfilePhoto(ServerWebExchange exchange) {
        return sessionUserService.getVisitorId()
                .flatMap(userId -> getProfilePhoto(exchange, userId));
    }

    @GetMapping("/photo/{userId}")
    public Mono<Void> getProfilePhoto(ServerWebExchange exchange, @PathVariable String userId) {
        return userService.getUserAvatar(exchange, userId)
                .switchIfEmpty(Mono.fromRunnable(() -> exchange.getResponse().setStatusCode(HttpStatus.NOT_FOUND)));
    }

    @PutMapping("/password")
    public Mono<ResponseView<Boolean>> updatePassword(@RequestBody UpdatePasswordRequest request) {
        if (StringUtils.isBlank(request.oldPassword()) || StringUtils.isBlank(request.newPassword())) {
            return ofError(BizError.INVALID_PARAMETER, "PASSWORD_EMPTY");
        }
        return sessionUserService.getVisitorId()
                .flatMap(user -> userService.updatePassword(user, request.oldPassword(), request.newPassword()))
                .map(ResponseView::success);
    }

    @PostMapping("/reset-password")
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

    @PostMapping("/password")
    public Mono<ResponseView<Boolean>> setPassword(@RequestParam String password) {
        if (StringUtils.isBlank(password)) {
            return ofError(BizError.INVALID_PARAMETER, "PASSWORD_EMPTY");
        }
        return sessionUserService.getVisitorId()
                .flatMap(user -> userService.setPassword(user, password))
                .map(ResponseView::success);
    }

    @GetMapping("/currentUser")
    public Mono<ResponseView<UserDetail>> getCurrentUser(ServerWebExchange exchange) {
        return sessionUserService.getVisitor()
                .flatMap(user -> userService.buildUserDetail(user, false))
                .map(ResponseView::success);
    }

    @GetMapping("/userDetail/{id}")
    public Mono<ResponseView<?>> getUserDetail(@PathVariable("id") String userId) {
        return userApiService.getUserDetailById(userId)
                .map(ResponseView::success);
    }

    public record ResetPasswordRequest(String userId) {
    }

    public record UpdatePasswordRequest(String oldPassword, String newPassword) {
    }

    private record MarkUserStatusRequest(String type, Object value) {
    }
}
