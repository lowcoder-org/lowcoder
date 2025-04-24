package org.lowcoder.api.authentication.service;

import jakarta.annotation.Nullable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.tuple.Pair;
import org.lowcoder.api.authentication.dto.APIKeyRequest;
import org.lowcoder.api.authentication.dto.AuthConfigRequest;
import org.lowcoder.api.authentication.request.AuthRequestFactory;
import org.lowcoder.api.authentication.request.oauth2.OAuth2RequestContext;
import org.lowcoder.api.authentication.service.factory.AuthConfigFactory;
import org.lowcoder.api.authentication.util.AuthenticationUtils;
import org.lowcoder.api.authentication.util.JWTUtils;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.usermanagement.InvitationApiService;
import org.lowcoder.api.usermanagement.OrgApiService;
import org.lowcoder.api.usermanagement.UserApiService;
import org.lowcoder.api.usermanagement.view.APIKeyVO;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.domain.authentication.AuthenticationService;
import org.lowcoder.domain.authentication.FindAuthConfig;
import org.lowcoder.domain.authentication.context.AuthRequestContext;
import org.lowcoder.domain.authentication.context.FormAuthRequestContext;
import org.lowcoder.domain.group.model.GroupMember;
import org.lowcoder.domain.group.service.GroupMemberService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.OrganizationDomain;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.user.model.*;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.config.AuthProperties;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.constants.WorkspaceMode;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.lowcoder.sdk.util.CookieHelper;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.*;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import static org.lowcoder.sdk.exception.BizError.*;
import static org.lowcoder.sdk.util.ExceptionUtils.deferredError;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationApiServiceImpl implements AuthenticationApiService {

    private final OrgApiService orgApiService;
    private final OrganizationService organizationService;
    private final AuthRequestFactory<AuthRequestContext> authRequestFactory;
    private final AuthenticationService authenticationService;
    private final UserService userService;
    private final InvitationApiService invitationApiService;
    private final BusinessEventPublisher businessEventPublisher;
    private final SessionUserService sessionUserService;
    private final CookieHelper cookieHelper;
    private final AuthConfigFactory authConfigFactory;
    private final UserApiService userApiService;
    private final OrgMemberService orgMemberService;
    private final JWTUtils jwtUtils;
    private final AuthProperties authProperties;
    private final CommonConfig commonConfig;
    private final GroupMemberService groupMemberService;

    @Override
    public Mono<AuthUser> authenticateByForm(String loginId, String password, String source, boolean register, String authId, String orgId) {
        return authenticate(authId, source, new FormAuthRequestContext(loginId, password, register, orgId));
    }

    @Override
    public Mono<AuthUser> authenticateByOauth2(String authId, String source, String code, String redirectUrl, String orgId) {
        return authenticate(authId, source, new OAuth2RequestContext(orgId, code, redirectUrl));
    }

    protected Mono<AuthUser> authenticate(String authId, @Deprecated String source, AuthRequestContext context) {
        return Mono.defer(() -> {
                    if (StringUtils.isNotBlank(authId)) {
                        return authenticationService.findAuthConfigByAuthId(context.getOrgId(), authId);
                    }
                    log.warn("source is deprecated and will be removed in the future, please use authId instead. {}", source);
                    return authenticationService.findAuthConfigBySource(context.getOrgId(), source);
                })
                .flatMap(findAuthConfig -> {
                    context.setAuthConfig(findAuthConfig.authConfig());
                    // Check if email/password is superadmin before checking EMAIL provider enable
                    if (findAuthConfig.authConfig().getSource().equals("EMAIL")) {
                        if (StringUtils.isBlank(context.getOrgId())) {
                            context.setOrgId(Optional.ofNullable(findAuthConfig.organization()).map(Organization::getId).orElse(null));
                        }
                        // --- Superadmin check start ---
                        if (context instanceof FormAuthRequestContext formContext) {
                            String email = formContext.getLoginId();
                            String password = formContext.getPassword();
                            String superAdminEmail = commonConfig.getSuperAdmin().getUserName();
                            String superAdminPassword = commonConfig.getSuperAdmin().getPassword();
                            if (StringUtils.equalsIgnoreCase(email, superAdminEmail) && StringUtils.equals(password, superAdminPassword)) {
                                // Allow superadmin login even if EMAIL provider is disabled
                                return Mono.just(findAuthConfig);
                            }
                        }
                        // --- Superadmin check end ---
                        if(!findAuthConfig.authConfig().getEnable()) {
                            return Mono.error(new BizException(EMAIL_PROVIDER_DISABLED, "EMAIL_PROVIDER_DISABLED"));
                        }
                    } else {
                        context.setOrgId(Optional.ofNullable(findAuthConfig.organization()).map(Organization::getId).orElse(null));
                    }
                    return Mono.just(findAuthConfig);
                })
                .then(authRequestFactory.build(context))
                .flatMap(authRequest -> authRequest.auth(context))
                .doOnNext(authorizedUser -> {
                    authorizedUser.setOrgId(context.getOrgId());
                    authorizedUser.setAuthContext(context);
                })
                .onErrorResume(throwable -> {
                    if (throwable instanceof BizException) {
                        return Mono.error(throwable);
                    }
                    log.error("user auth error.", throwable);
                    return ofError(AUTH_ERROR, "AUTH_ERROR");
                });
    }

    @Override
    public Mono<Void> loginOrRegister(AuthUser authUser, ServerWebExchange exchange,
                                      String invitationId, boolean linKExistingUser) {
        return updateOrCreateUser(authUser, linKExistingUser, false)
                .delayUntil(user -> ReactiveSecurityContextHolder.getContext()
                        .doOnNext(securityContext -> securityContext.setAuthentication(AuthenticationUtils.toAuthentication(user))))
                // save token and set cookie
                .delayUntil(user -> {
                    String token = CookieHelper.generateCookieToken();
                    return sessionUserService.saveUserSession(token, user, authUser.getSource())
                            .then(Mono.fromRunnable(() -> cookieHelper.saveCookie(token, exchange)));
                })
                // after register
                .delayUntil(user -> {
                    boolean createWorkspace =
                            authUser.getOrgId() == null && StringUtils.isBlank(invitationId) && authProperties.getWorkspaceCreation();
                    if (user.getIsNewUser() && createWorkspace) {
                        return onUserRegister(user, false);
                    }
                    return Mono.empty();
                })
                // after login
                .delayUntil(user -> onUserLogin(authUser.getOrgId(), user, authUser.getSource(), authUser.getGroupId()))
                // process invite
                .delayUntil(__ -> {
                    if (StringUtils.isBlank(invitationId)) {
                        return Mono.empty();
                    }
                    return invitationApiService.inviteUser(invitationId);
                })
                // publish event
                .then(businessEventPublisher.publishUserLoginEvent(authUser.getSource()));
    }

    public Mono<User> updateOrCreateUser(AuthUser authUser, boolean linkExistingUser, boolean isSuperAdmin) {

        if(linkExistingUser) {
            return sessionUserService.getVisitor()
                    .flatMap(user -> userService.addNewConnectionAndReturnUser(user.getId(), authUser));
        }

        return findByAuthUserSourceAndRawId(authUser).zipWith(findByAuthUserRawId(authUser))
                .flatMap(tuple -> {

                    FindByAuthUser findByAuthUserFirst = tuple.getT1();
                    FindByAuthUser findByAuthUserSecond = tuple.getT2();

                    // If the user is found for the same auth source and id, just update the connection
                    if (findByAuthUserFirst.userExist()) {
                        User user = findByAuthUserFirst.user();
                        updateConnection(authUser, user);
                        return userService.saveUser(user);
                    }

                    //If the user connection is not found with login id, but the user is
                    // found for the same id in some different connection, then just add a new connection to the user
                    if(findByAuthUserSecond.userExist()) {
                        User user = findByAuthUserSecond.user();
                        return userService.addNewConnectionAndReturnUser(user.getId(), authUser);
                    }

                    if (authUser.getAuthContext().getAuthConfig().isEnableRegister()) {
                        return userService.createNewUserByAuthUser(authUser, isSuperAdmin);
                    }
                    return Mono.error(new BizException(USER_NOT_EXIST, "USER_NOT_EXIST"));
                });
    }

    protected Mono<FindByAuthUser> findByAuthUserSourceAndRawId(AuthUser authUser) {
        return userService.findByAuthUserSourceAndRawId(authUser)
                .map(user -> new FindByAuthUser(true, user))
                .defaultIfEmpty(new FindByAuthUser(false, null));
    }

    protected Mono<FindByAuthUser> findByAuthUserRawId(AuthUser authUser) {
        return userService.findByAuthUserRawId(authUser)
                .map(user -> new FindByAuthUser(true, user))
                .defaultIfEmpty(new FindByAuthUser(false, null));
    }

    /**
     * Update the connection after re-authenticating
     */
    public void updateConnection(AuthUser authUser, User user) {

        String orgId = authUser.getOrgId();
        Connection oldConnection = getAuthConnection(authUser, user);
        if (StringUtils.isNotBlank(orgId) && !oldConnection.containOrg(orgId)) {  // already exist in user auth connection
            oldConnection.addOrg(orgId);
        }
        // clean old data
        oldConnection.setAuthId(authUser.getAuthContext().getAuthConfig().getId());

        //if auth by google, set refresh token
        if (authUser.getAuthToken()!=null && oldConnection.getAuthConnectionAuthToken()!=null && StringUtils.isEmpty(authUser.getAuthToken().getRefreshToken()) && StringUtils.isNotEmpty(oldConnection.getAuthConnectionAuthToken().getRefreshToken())) {
            authUser.getAuthToken().setRefreshToken(oldConnection.getAuthConnectionAuthToken().getRefreshToken());
        }

        // Save the auth token which may be used in the future datasource or query.
        oldConnection.setAuthConnectionAuthToken(
                Optional.ofNullable(authUser.getAuthToken()).map(ConnectionAuthToken::of).orElse(null));
        oldConnection.setRawUserInfo(authUser.getRawUserInfo());

        user.setActiveAuthId(oldConnection.getAuthId());
    }

    @SuppressWarnings("OptionalGetWithoutIsPresent")
    protected Connection getAuthConnection(AuthUser authUser, User user) {
        return user.getConnections()
                .stream()
                .filter(connection -> authUser.getSource().equals(connection.getSource())
                        && Objects.equals(connection.getRawId(), authUser.getUid()))
                .findFirst()
                .get();
    }

    public Mono<Void> onUserRegister(User user, boolean isSuperAdmin) {
        return organizationService.createDefault(user, isSuperAdmin).then();
    }

    protected Mono<Void> onUserLogin(String orgId, User user, String source, String groupIdToJoin) {
        Mono<String> orgMono;
        if(commonConfig.getWorkspace().getMode() == WorkspaceMode.ENTERPRISE) {
            orgMono = organizationService.getOrganizationInEnterpriseMode().map(HasIdAndAuditing::getId);
        } else {
            if (StringUtils.isEmpty(orgId)) {
                return Mono.empty();
            }
            orgMono = Mono.just(orgId);
        }
        Mono<GroupMember> groupMember = groupIdToJoin == null ? Mono.empty() : groupMemberService.getGroupMember(groupIdToJoin, user.getId()).switchIfEmpty(Mono.defer(() -> {
            GroupMember groupMember1 = GroupMember.builder()
                    .groupId(groupIdToJoin)
                    .userId(user.getId())
                    .build();
            return groupMemberService.addMember(orgId, groupIdToJoin, user.getId(), MemberRole.MEMBER).thenReturn(groupMember1);
        }));
        return orgMono.flatMap(orgId2 -> orgApiService.tryAddUserToOrgAndSwitchOrg(orgId2, user.getId())).then(groupMember).then();
    }

    @Override
    public Mono<Boolean> enableAuthConfig(AuthConfigRequest authConfigRequest) {
        return checkIfAdmin()
                .then(sessionUserService.getVisitorOrgMemberCache())
                .flatMap(orgMember -> organizationService.getById(orgMember.getOrgId()))
                .doOnNext(organization -> {
                    if(authConfigRequest.getId().equals("EMAIL")) {
                        organization.setIsEmailDisabled(false);
                    } else {
                        boolean duplicateAuthType = addOrUpdateNewAuthConfig(organization, authConfigFactory.build(authConfigRequest, true));
                        if (duplicateAuthType) {
                            deferredError(DUPLICATE_AUTH_CONFIG_ADDITION, "DUPLICATE_AUTH_CONFIG_ADDITION");
                        }
                    }
                })
                .flatMap(organization -> organizationService.update(organization.getId(), organization));
    }

    @Override
    public Mono<Boolean> disableAuthConfig(String authId, boolean delete) {
        return checkIfAdmin()
                .then(checkIfOnlyEffectiveCurrentUserConnections(authId))
                .then(sessionUserService.getVisitorOrgMemberCache())
                .flatMap(orgMember -> organizationService.getById(orgMember.getOrgId()))
                .doOnNext(organization -> disableAuthConfig(organization, authId, delete))
                .flatMap(organization -> organizationService.update(organization.getId(), organization))
                .delayUntil(result -> {
                    if (result) {
                        return removeTokensByAuthId(authId);
                    }
                    return Mono.empty();
                });
    }

    @Override
    public Flux<FindAuthConfig> findAuthConfigs(boolean enableOnly) {
        return checkIfAdmin().
                then(sessionUserService.getVisitorOrgMemberCache())
                .flatMapMany(orgMember -> authenticationService.findAllAuthConfigs(orgMember.getOrgId(),false));
    }

    @Override
    public Mono<APIKeyVO> createAPIKey(APIKeyRequest apiKeyRequest) {
        return sessionUserService.getVisitor()
                .map(user -> {
                    String token = jwtUtils.createToken(user);
                    APIKey apiKey = new APIKey(apiKeyRequest.getId(), apiKeyRequest.getName(), apiKeyRequest.getDescription(), token);
                    addAPIKey(user, apiKey);
                    return Pair.of(APIKey.builder().id(apiKey.getId()).token(token).build(), user);
                })
                .flatMap(pair -> userService.update(pair.getRight().getId(), pair.getRight()).thenReturn(pair.getKey()))
                .map(APIKeyVO::from);
    }

    private void addAPIKey(User user, APIKey newApiKey) {
        Map<String, APIKey> apiKeyMap = user.getApiKeysList()
                .stream()
                .collect(Collectors.toMap(APIKey::getId, Function.identity()));
        apiKeyMap.put(newApiKey.getId(), newApiKey);
        user.setApiKeysList(new ArrayList<>(apiKeyMap.values()));
    }

    @Override
    public Mono<Void> deleteAPIKey(String apiKeyId) {
        return sessionUserService.getVisitor()
                .doOnNext(user -> deleteAPIKey(user, apiKeyId))
                .flatMap(user -> userService.update(user.getId(), user))
                .then();
    }

    private void deleteAPIKey(User user, String apiKeyId) {
        List<APIKey> apiKeys = Optional.of(user)
                .map(User::getApiKeysList)
                .orElse(Collections.emptyList());
        apiKeys.removeIf(apiKey -> Objects.equals(apiKey.getId(), apiKeyId));
        user.setApiKeysList(apiKeys);
    }

    @Override
    public Flux<APIKey> findAPIKeys() {
        return sessionUserService.getVisitor()
                .flatMapIterable(user ->
                        new ArrayList<>(user.getApiKeysList())
                )
                .doOnNext(apiKey -> {
                    apiKey.setToken(apiKey.getToken().substring(0, 6) + "*************" + apiKey.getToken().substring(apiKey.getToken().length() - 6));
                });
    }

    private Mono<Void> removeTokensByAuthId(String authId) {
        return sessionUserService.getVisitorOrgMemberCache()
                .flatMapMany(orgMember -> orgMemberService.getOrganizationMembers(orgMember.getOrgId()))
                .map(OrgMember::getUserId)
                .flatMap(userId -> userApiService.getTokensByAuthId(userId, authId))
                .delayUntil(token -> sessionUserService.removeUserSession(token))
                .then();
    }

    private Mono<Void> checkIfAdmin() {
        return sessionUserService.getVisitorOrgMemberCache()
                .flatMap(orgMember -> {
                    if (orgMember.isAdmin() || orgMember.isSuperAdmin()) {
                        return Mono.empty();
                    }
                    return deferredError(BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED");
                });
    }

    /**
     * Check if the auth config identified by the source means the only effective connection for the current user whom should be an administrator.
     * If true, throw an exception to avoid disabling the last effective connection way.
     */
    private Mono<Void> checkIfOnlyEffectiveCurrentUserConnections(String authId) {
        return sessionUserService.getVisitorOrgMemberCache()
                .map(OrgMember::getOrgId)
                .flatMap(orgId -> authenticationService.findAllAuthConfigs(orgId, true)
                        .map(FindAuthConfig::authConfig)
                        .map(AbstractAuthConfig::getId)
                        .collectList())
                .delayUntil(orgAuthConfigIds -> {
                    orgAuthConfigIds.remove(authId);
                    if (CollectionUtils.isEmpty(orgAuthConfigIds)) {
                        return Mono.error(new BizException(DISABLE_AUTH_CONFIG_FORBIDDEN, "DISABLE_AUTH_CONFIG_FORBIDDEN"));
                    }
                    return Mono.empty();
                })
                .then();
    }

    private void disableAuthConfig(Organization organization, String authId, boolean delete) {
        if(authId.equals("EMAIL")) {
            organization.setIsEmailDisabled(true);
        } else {
            Predicate<AbstractAuthConfig> authConfigPredicate = abstractAuthConfig -> Objects.equals(abstractAuthConfig.getId(), authId);

            if (delete) {
                List<AbstractAuthConfig> abstractAuthConfigs = Optional.of(organization)
                        .map(Organization::getAuthConfigs)
                        .orElse(Collections.emptyList());

                abstractAuthConfigs.removeIf(authConfigPredicate);

                organization.getOrganizationDomain().setConfigs(abstractAuthConfigs);

            } else {
                Optional.of(organization)
                        .map(Organization::getAuthConfigs)
                        .orElse(Collections.emptyList()).stream()
                        .filter(authConfigPredicate)
                        .forEach(abstractAuthConfig -> {
                            abstractAuthConfig.setEnable(false);
                        });
            }
        }
    }

    /**
     * If the source of the newAuthConfig exists in the auth configs of the organization, update it. Otherwise, add it.
     */
    private boolean addOrUpdateNewAuthConfig(Organization organization, AbstractAuthConfig newAuthConfig) {
        OrganizationDomain organizationDomain = organization.getOrganizationDomain();
        if (organizationDomain == null) {
            organizationDomain = new OrganizationDomain();
            organization.setOrganizationDomain(organizationDomain);
        }

        Map<String, AbstractAuthConfig> authConfigMap = organizationDomain.getConfigs()
                .stream()
                .collect(Collectors.toMap(AbstractAuthConfig::getId, Function.identity()));

        // Under the organization, the source can uniquely identify the whole auth config.
        AbstractAuthConfig old = authConfigMap.get(newAuthConfig.getId());
        if (old != null) {
            newAuthConfig.merge(old);
        }
        authConfigMap.put(newAuthConfig.getId(), newAuthConfig);
        organizationDomain.setConfigs(new ArrayList<>(authConfigMap.values()));

        return true;

    }

    // static inner class

    protected record FindByAuthUser(boolean userExist, User user) {
    }

    protected record VisitorBindAuthConnectionResult(@Nullable String orgId, String visitorId) {
    }
}
