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
import org.lowcoder.sdk.constants.AuthSourceConstants;
import org.lowcoder.sdk.constants.WorkspaceMode;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.lowcoder.infra.util.LogUtils;
import org.lowcoder.sdk.util.CookieHelper;
import org.lowcoder.sdk.util.EmailUtils;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.*;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import static org.lowcoder.sdk.auth.constants.AuthTypeConstants.GENERIC;
import static org.lowcoder.sdk.exception.BizError.*;
import static org.lowcoder.sdk.util.ExceptionUtils.deferredError;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationApiServiceImpl implements AuthenticationApiService {

    private static final String DUPLICATE_AUTH_CONFIG_ADDITION_KEY = "DUPLICATE_AUTH_CONFIG_ADDITION";
    private static final int VISIBLE_TOKEN_CHARS = 6;
    private static final int MIN_MASKED_LENGTH = 24;
    private static final String TOKEN_MASK = "*************";

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
                    log.warn("source is deprecated and will be removed in the future, please use authId instead. {}", LogUtils.neutralize(source));
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
                // process invite: before the login joins the workspace the page names, so the invitation's own rules (its creator is
                // still a member, the workspace limits) decide the join and a visitor who joins through it is not answered
                // ALREADY_IN_ORGANIZATION
                .delayUntil(__ -> {
                    if (StringUtils.isBlank(invitationId)) {
                        return Mono.empty();
                    }
                    return invitationApiService.inviteUser(invitationId);
                })
                // after login
                .delayUntil(user -> onUserLogin(authUser.getOrgId(), user, authUser.getSource(), authUser.getGroupId()))
                // publish event
                .then(businessEventPublisher.publishUserLoginEvent(authUser.getSource()));
    }

    /**
     * Resolves the account for an authentication attempt, in order: (1) an existing connection of the same source
     * and subject -- update it; (2) an account found by e-mail address not yet connected this way -- link it ONLY
     * when {@link #linkByAddressOrRefuse} allows it, else refuse with no session opened; (3) register, or
     * {@code USER_NOT_EXIST}.
     * <p>
     * Limits: a person who already has an e-mail account and signs in with a provider
     * for the first time is refused here and must link the provider from their profile instead of being linked by
     * address automatically; the same for a SCIM-provisioned placeholder that already had a prior account. Identities
     * remain keyed by provider type plus subject for branch 1/{@code updateConnection}, unchanged by this phase.
     */
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
                    // found for the same id in some different connection, then only link it when it is safe to
                    if(findByAuthUserSecond.userExist()) {
                        return linkByAddressOrRefuse(authUser, findByAuthUserSecond.user(), isSuperAdmin);
                    }

                    if (authUser.getAuthContext().getAuthConfig().isEnableRegister()) {
                        return userService.createNewUserByAuthUser(authUser, isSuperAdmin);
                    }
                    return Mono.error(new BizException(USER_NOT_EXIST, "USER_NOT_EXIST"));
                });
    }

    /**
     * An account found only by e-mail address (not by the same source/subject
     * connection) is linked ONLY when that is safe, never merely because the address matches:
     * <ul>
     * <li>{@code isSuperAdmin}: the deployment-configured super-admin setup, unchanged;</li>
     * <li>otherwise, only for a non-EMAIL source, an account with NO connections at all (a SCIM placeholder), AND an
     * EXCLUSIVE raw membership of the provider's own workspace ({@code authUser.getOrgId()}) -- not merely "is a
     * member of it among possibly others". A plain membership check is not enough: {@code
     * UserController#createSCIMUserAndAddToOrg} lets an admin of ANY org pull an existing placeholder found by
     * e-mail into their own org as a second raw membership regardless of its connection state, which would satisfy a
     * looser check; requiring exactly one raw row defeats that, since the polluted placeholder then has two.</li>
     * </ul>
     * Every other match is refused, with no connection added and no account mutated: {@code USER_LOGIN_ID_EXIST} for
     * an EMAIL-source (form) attempt, the answer of an existing login id; {@code ALREADY_BIND} for any other source.
     * The raw memberships are read ONCE via {@link OrgMemberService#getRawOrgMemberships}, not {@code
     * countAllActiveOrgs} (which is ENTERPRISE-mode-aware and collapses multiple real memberships down to one, so it
     * would not catch a cross-org SCIM-pollution attack there) and not as two separate queries (which would reopen a
     * race window against a concurrent {@code createSCIMUserAndAddToOrg} call between them).
     */
    private Mono<User> linkByAddressOrRefuse(AuthUser authUser, User found, boolean isSuperAdmin) {
        if (isSuperAdmin) {
            return userService.addNewConnectionAndReturnUser(found.getId(), authUser);
        }
        boolean isEmailSource = AuthSourceConstants.EMAIL.equals(authUser.getSource());
        if (isEmailSource) {
            return Mono.error(new BizException(USER_LOGIN_ID_EXIST, "USER_LOGIN_ID_EXIST"));
        }
        if (CollectionUtils.isEmpty(found.getConnections())) {
            return orgMemberService.getRawOrgMemberships(found.getId())
                    .flatMap(orgMembers -> {
                        boolean isExclusiveMemberOfProviderOrg = orgMembers.size() == 1
                                && orgMembers.get(0).getOrgId().equals(authUser.getOrgId());
                        if (isExclusiveMemberOfProviderOrg) {
                            return userService.addNewConnectionAndReturnUser(found.getId(), authUser);
                        }
                        return Mono.<User>error(new BizException(ALREADY_BIND, "ALREADY_BIND"));
                    });
        }
        return Mono.error(new BizException(ALREADY_BIND, "ALREADY_BIND"));
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

    /**
     * The connection this authenticated identity corresponds to.
     *
     * <p>The subject comparison has to agree with how {@code findBySourceAndId} resolved the user, or the
     * lookup finds an account and this then fails to find its connection. That is not hypothetical: the
     * lookup now also matches a stored {@code john@doe.com} against the input {@code JoHn@DoE.com}, and a
     * byte-exact comparison here would throw on exactly those logins.
     *
     * <p>{@code normalizeIfEmailSource} on both sides, so this is case-insensitive for EMAIL connections and
     * byte-exact for every other source -- where {@code rawId} is an opaque IdP subject.
     *
     * <p>Exact match first, case-insensitive only as a fallback. {@code User.connections} is a
     * {@code HashSet}, so its iteration order is not a contract; a single case-insensitive pass would pick
     * an arbitrary one of two connections that differ only in case -- a state legacy data can be in. Trying
     * the byte-exact match first makes the choice deterministic and gives the connection the caller
     * actually authenticated with.
     */
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    protected Connection getAuthConnection(AuthUser authUser, User user) {
        String subject = EmailUtils.normalizeIfEmailSource(authUser.getSource(), authUser.getUid());
        List<Connection> sameSource = user.getConnections()
                .stream()
                .filter(connection -> authUser.getSource().equals(connection.getSource()))
                .toList();
        return sameSource.stream()
                .filter(connection -> Objects.equals(connection.getRawId(), authUser.getUid()))
                .findFirst()
                .or(() -> sameSource.stream()
                        .filter(connection -> Objects.equals(
                                EmailUtils.normalizeIfEmailSource(connection.getSource(), connection.getRawId()),
                                subject))
                        .findFirst())
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
                .flatMap(organization -> {
                    if(authConfigRequest.getId().equals("EMAIL")) {
                        organization.setIsEmailDisabled(false);
                        return Mono.just(organization);
                    }
                    AbstractAuthConfig newAuthConfig = authConfigFactory.build(authConfigRequest, true);
                    if (authConfigRequest.isNewConfig() && hasAnotherConfigOfItsType(organization, newAuthConfig)) {
                        return ofError(DUPLICATE_AUTH_CONFIG_ADDITION, DUPLICATE_AUTH_CONFIG_ADDITION_KEY);
                    }
                    addOrUpdateNewAuthConfig(organization, newAuthConfig);
                    return Mono.just(organization);
                })
                .flatMap(organization -> organizationService.update(organization.getId(), organization));
    }

    /**
     * Whether the organization already has an auth config of the type of {@code newAuthConfig}, which a new config may not
     * add (BF-087: the error was built and dropped, so a second config of a type was added silently). The client offers
     * each type once, except the generic OAuth type, of which an organization may have several, so that type is never a
     * duplicate here.
     * <p>
     * Limits: only a new config (a request without an id) is checked, so an organization that already has two configs of
     * one type can still update either; the type is compared, not the provider's issuer or client id.
     */
    private boolean hasAnotherConfigOfItsType(Organization organization, AbstractAuthConfig newAuthConfig) {
        if (GENERIC.equals(newAuthConfig.getAuthType())) {
            return false;
        }
        return organization.getAuthConfigs().stream()
                .anyMatch(config -> StringUtils.equals(config.getAuthType(), newAuthConfig.getAuthType()));
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
                .flatMapMany(orgMember -> authenticationService.findAllAuthConfigs(orgMember.getOrgId(), enableOnly));
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
        user.replaceApiKeys(apiKeys);
    }

    /**
     * The visitor's API keys with their tokens masked, as copies (NEW-135): the visitor's own keys keep their
     * tokens, so a later write of the same user object in one request cannot store a masked token. A token of
     * {@code MIN_MASKED_LENGTH} or more characters shows its first and last six; a null or shorter token is answered
     * as the mask alone, where it used to fail the listing (null, or under six characters) or show all of a token of
     * six to twelve characters and twelve characters of a longer one. Limits: the write path still encrypts the
     * caller's key objects in place ({@code User#beforeMongodbWrite}).
     */
    @Override
    public Flux<APIKey> findAPIKeys() {
        return sessionUserService.getVisitor()
                .flatMapIterable(user ->
                        new ArrayList<>(user.getApiKeysList())
                )
                .map(apiKey -> new APIKey(apiKey.getId(), apiKey.getName(), apiKey.getDescription(), masked(apiKey.getToken())));
    }

    private static String masked(String token) {
        if (token == null || token.length() < MIN_MASKED_LENGTH) {
            return TOKEN_MASK;
        }
        return token.substring(0, VISIBLE_TOKEN_CHARS) + TOKEN_MASK + token.substring(token.length() - VISIBLE_TOKEN_CHARS);
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
                // BF-089: getAuthConfigs is the domain's own list, or an empty one for an organization without a domain
                // (which has nothing to delete); the domain used to be dereferenced, which threw for the latter
                organization.getAuthConfigs().removeIf(authConfigPredicate);
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
    private void addOrUpdateNewAuthConfig(Organization organization, AbstractAuthConfig newAuthConfig) {
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
    }

    // static inner class

    protected record FindByAuthUser(boolean userExist, User user) {
    }

    protected record VisitorBindAuthConnectionResult(@Nullable String orgId, String visitorId) {
    }
}
