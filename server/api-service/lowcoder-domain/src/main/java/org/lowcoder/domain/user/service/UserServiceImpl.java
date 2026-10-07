package org.lowcoder.domain.user.service;


import jakarta.annotation.Nonnull;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.RandomStringUtils;
import org.apache.commons.lang3.StringUtils;
import org.jetbrains.annotations.NotNull;
import org.lowcoder.domain.asset.model.Asset;
import org.lowcoder.domain.asset.service.AssetService;
import org.lowcoder.domain.authentication.AuthenticationService;
import org.lowcoder.domain.authentication.context.FormAuthRequestContext;
import org.lowcoder.domain.encryption.EncryptionService;
import org.lowcoder.domain.group.model.Group;
import org.lowcoder.domain.group.service.GroupMemberService;
import org.lowcoder.domain.group.service.GroupService;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.organization.model.Organization.OrganizationCommonSettings;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.user.model.*;
import org.lowcoder.domain.user.model.User.TransformedUserInfo;
import org.lowcoder.domain.user.repository.UserRepository;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.lowcoder.infra.mongo.MongoUpsertHelper.PartialResourceWithId;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.dynamic.Conf;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.constants.AuthSourceConstants;
import org.lowcoder.sdk.constants.FieldName;
import org.lowcoder.sdk.constants.WorkspaceMode;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.util.EmailUtils;
import org.lowcoder.sdk.util.HashUtils;
import org.lowcoder.sdk.util.LocaleUtils;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Pageable;
import org.springframework.http.codec.multipart.Part;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Comparator;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.google.common.collect.Sets.newHashSet;
import static org.lowcoder.domain.organization.service.OrganizationServiceImpl.PASSWORD_RESET_EMAIL_TEMPLATE_DEFAULT;
import static org.lowcoder.domain.user.model.UserDetail.ANONYMOUS_CURRENT_USER;
import static org.lowcoder.sdk.constants.GlobalContext.CLIENT_IP;
import static org.lowcoder.sdk.util.ExceptionUtils.deferredError;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;
import static org.lowcoder.sdk.util.ExceptionUtils.ofException;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final AssetService assetService;
    private final ConfigCenter configCenter;
    private final EncryptionService encryptionService;
    private final MongoUpsertHelper mongoUpsertHelper;
    private final UserRepository repository;
    private final GroupMemberService groupMemberService;
    private final OrgMemberService orgMemberService;
    private final OrganizationService organizationService;
    private final GroupService groupService;
    private final CommonConfig commonConfig;
    private final AuthenticationService authenticationService;
    private final EmailCommunicationService emailCommunicationService;
    private Conf<Integer> avatarMaxSizeInKb;

    @PostConstruct
    public void init() {
        avatarMaxSizeInKb = configCenter.asset().ofInteger("avatarMaxSizeInKb", 300);
    }

    @Override
    public Mono<User> create(User user) {
        return repository.save(user);
    }

    @Override
    public Mono<User> findById(String id) {
        if (id == null) {
            return Mono.error(new BizException(BizError.INVALID_PARAMETER, "INVALID_PARAMETER", FieldName.ID));
        }

        return repository.findById(id);
    }

    @Override
    public Mono<Map<String, User>> getByIds(Collection<String> ids) {
        Set<String> idSet = newHashSet(ids);
        return repository.findByIdIn(idSet)
                .collectList()
                .map(it -> it.stream()
                        .collect(Collectors.toMap(User::getId, Function.identity()))
                );
    }

    /**
     * Resolves a connection by source and subject, tolerating the case in which it was stored.
     *
     * <p>Two byte-exact probes rather than one normalized probe. Both are served by the existing
     * {@code (connections.source, connections.rawId)} index, and between them they cover the two shapes that
     * coexist while data is being cleaned up: rows written before normalization, which hold whatever casing
     * the user typed, and rows written after it, which hold the normalized form.
     *
     * <p>A single normalized probe would be simpler and is what a fully migrated database wants -- but on an
     * un-migrated one it silently stops finding every account whose stored {@code rawId} contains an
     * uppercase letter, i.e. it locks those users out. This form has no such failure mode and needs no
     * migration.
     *
     * <p><b>Known limitation.</b> The second probe only helps when the STORED value is normalized. An account
     * stored as {@code JoHn@DoE.com} is still not found by the input {@code john@doe.com}, because finding it
     * would need a case-insensitive query, which MongoDB cannot serve from this index. So this closes
     * duplicate creation going forward, and does not retroactively unify addresses that already differ in
     * case. Converging those requires the backfill migration.
     */
    @Override
    public Mono<User> findBySourceAndId(String source, String sourceUuid) {
        // normalizeIfEmailSource, never normalize: for a non-EMAIL source this value is the opaque IdP
        // subject and must be matched byte-for-byte.
        String normalized = EmailUtils.normalizeIfEmailSource(source, sourceUuid);
        Mono<User> asStored = repository.findByConnections_SourceAndConnections_RawId(source, sourceUuid);
        if (StringUtils.equals(normalized, sourceUuid)) {
            return asStored;
        }
        return asStored.switchIfEmpty(
                repository.findByConnections_SourceAndConnections_RawId(source, normalized));
    }

    public Mono<User> findByName(String rawUuid) {
        return repository.findByName(rawUuid);
    }

    /** Same two-probe reasoning as {@link #findBySourceAndId}, including the same known limitation. */
    @Override
    public Mono<User> findByEmailDeep(String email) {
        if(StringUtils.isEmpty(email)) return Mono.empty();
        String normalized = EmailUtils.normalize(email);
        Mono<User> asStored = probeByEmail(email);
        if (StringUtils.equals(normalized, email)) {
            return asStored;
        }
        return asStored.switchIfEmpty(probeByEmail(normalized));
    }

    /**
     * Whether password recovery may act on this account.
     *
     * <p>Resolving by address rather than by {@code user.name} reaches strictly more rows: any casing, and
     * anything matched through {@code connections[].email}. Soft-deleted accounts keep their {@code email}
     * -- {@code markAsDeleted} only changes the state, the enabled flag and the connection sources -- so
     * without this they become reachable targets for a reset. They cannot log in afterwards, so this is
     * tidiness rather than a hole, but widening what an unauthenticated endpoint can mutate is not
     * something to do by accident.
     */
    private static boolean canRecoverPassword(User user) {
        return user.getState() != UserState.DELETED;
    }

    /**
     * One probe of the email keyspace, resolved deterministically.
     *
     * <p>This used to be {@code .next()} on the repository's {@link Flux}, which returns whichever document
     * storage happened to yield first. That was tolerable while only SSO linking and SCIM used this lookup,
     * and is not now that password recovery does: the backfill deliberately leaves conflicting accounts in
     * place, so two accounts matching one address is a state the system is designed to keep, and picking
     * between them at random would make the reset target a coin flip.
     */
    private Mono<User> probeByEmail(String value) {
        return repository.findByEmailOrConnections_Email(value, value)
                .collectList()
                .flatMap(candidates -> Mono.justOrEmpty(pickDeterministically(candidates, value)));
    }

    /**
     * An account whose own {@code email} matches wins over one reached only through a connection -- that is
     * the account a human means by the address -- and identity breaks any remaining tie.
     */
    static User pickDeterministically(List<User> candidates, String value) {
        return candidates.stream()
                .min(Comparator
                        .comparingInt((User user) -> StringUtils.equals(user.getEmail(), value) ? 0 : 1)
                        .thenComparing(user -> StringUtils.defaultString(user.getId())))
                .orElse(null);
    }

    @Override
    public Mono<Boolean> saveProfilePhoto(Part filePart, User user) {
        String prevAvatar = ObjectUtils.defaultIfNull(user.getAvatar(), "");
        Mono<Asset> newAvatarMono = assetService.upload(filePart, avatarMaxSizeInKb.get(), true);
        return newAvatarMono
                .flatMap(newAvatar -> {
                    Mono<Boolean> updateUserAvatarMono = updateUserAvatar(newAvatar, user.getId());
                    if (StringUtils.isEmpty(prevAvatar)) {
                        return updateUserAvatarMono;
                    }

                    return assetService.remove(prevAvatar).then(updateUserAvatarMono);
                });
    }

    private Mono<Boolean> updateUserAvatar(Asset newAvatar, String userId) {
        User user = User.builder()
                .avatar(newAvatar.getId())
                .build();
        return mongoUpsertHelper.updateById(user, userId);
    }

    public Mono<User> update(String id, User updatedUser) {
        return mongoUpsertHelper.updateById(updatedUser, id)
                .flatMap(updated -> {
                    if (!updated) {
                        return ofError(BizError.NO_RESOURCE_FOUND, "NO_USER_FOUND", id);
                    }
                    return findById(id);
                });
    }

    @Override
    public Mono<User> findByAuthUserSourceAndRawId(AuthUser authUser) {
        return findBySourceAndId(authUser.getSource(), authUser.getUid());
    }

    @Override
    public Mono<User> findByAuthUserRawId(AuthUser authUser) {
        return findByEmailDeep(authUser.getEmail());
    }

    @Override
    public Mono<User> createNewUserByAuthUser(AuthUser authUser, boolean isSuperAdmin) {
         User.UserBuilder userBuilder = User.builder()
                .name(authUser.getUsername())
                // Normalized on write, null-preserving: an SSO provider that returns no email claim must
                // leave this null rather than "". user.name is left alone -- it is a display name, and for
                // SSO users it is a handle rather than an address.
                .email(authUser.getEmail() == null ? null : EmailUtils.normalize(authUser.getEmail()))
                .state(UserState.ACTIVATED)
                .superAdmin(isSuperAdmin)
                .isEnabled(true)
                .tpAvatarLink(authUser.getAvatar());

        if (AuthSourceConstants.EMAIL.equals(authUser.getSource())
                && authUser.getAuthContext() instanceof FormAuthRequestContext formAuthRequestContext) {
            userBuilder.password(encryptionService.encryptPassword(formAuthRequestContext.getPassword()));
        }
        User newUser = userBuilder.build();

        Set<Connection> connections = newHashSet();
        Connection connection = authUser.toAuthConnection();
        connections.add(connection);
        newUser.setConnections(connections);
        newUser.setActiveAuthId(connection.getAuthId());
        newUser.setIsNewUser(true);
        if(isSuperAdmin) {
            return repository.findBySuperAdminIsTrue()
                    .flatMap(user -> update(user.getId(), newUser))
                    .switchIfEmpty(create(newUser));
        }
        return create(newUser);
    }

    @Override
    public Mono<Void> getUserAvatar(ServerWebExchange exchange, String userId) {
        return findById(userId)
                .flatMap(user -> assetService.makeImageResponse(exchange, user.getAvatar()));
    }

    /**
     * Attaches an email address to an account that authenticated some other way.
     *
     * <p>Two guards, both of which the original had no equivalent for.
     *
     * <p><b>Shape.</b> The endpoint takes a bare {@code @RequestParam} and validated nothing, so without
     * this an empty string or a display name is stored as an address -- in {@code user.email} AND as a
     * connection {@code rawId} the form login then resolves against. Registration validates shape; binding
     * must too.
     *
     * <p><b>Ownership.</b> The unique index on {@code (connections.source, connections.rawId)} used to be
     * what stopped two accounts holding one address: a second bind of the same value collided and surfaced
     * as {@link BizError#ALREADY_BIND}. Normalizing the value is exactly what stops that index from
     * catching it -- binding {@code Legacy@Example.COM} now writes {@code legacy@example.com}, a different
     * key, so an account already stored under the typed casing no longer collides. Without the probe
     * below, adding normalization would therefore have <i>removed</i> a guarantee that existed before it.
     * The probe restores it: fed the RAW value, the two-probe lookup reaches both the pre-normalization
     * casing and the canonical one.
     *
     * <p>What it does <b>not</b> cover, for the same reason no lookup on this branch does: an address
     * stored in mixed case is not reachable from lowercase input, so binding {@code legacy@example.com}
     * while another account holds {@code Legacy@Example.COM} still writes a second row. That hole is
     * unchanged from before this commit -- the byte-exact index never caught that pairing either. Changeset
     * {@code 032} converges such rows, so what is left is the owner the backfill deliberately froze as part
     * of a reported conflict, or an install where it has not run yet. It is pinned by
     * {@code EmailSanitizationEndpointsTest#bindEmailStillMissesALegacyMixedCaseOwnerFromLowercaseInput}.
     */
    @Override
    public Mono<Boolean> bindEmail(User user, String email) {
        String normalized = EmailUtils.normalize(email);
        if (!EmailUtils.looksLikeEmail(normalized)) {
            return Mono.error(new BizException(BizError.INVALID_EMAIL_FORMAT, "INVALID_EMAIL_FORMAT"));
        }
        return findBySourceAndId(AuthSourceConstants.EMAIL, email)
                .flatMap(owner -> {
                    if (StringUtils.equals(owner.getId(), user.getId())) {
                        // Already this user's address. Writing again would append a second EMAIL connection
                        // differing from the first only in case, which is the very state this change exists
                        // to prevent, so the bind is idempotent instead.
                        return Mono.just(true);
                    }
                    return Mono.<Boolean>error(
                            new BizException(BizError.ALREADY_BIND, "ALREADY_BIND", normalized, ""));
                })
                .switchIfEmpty(Mono.defer(() -> doBindEmail(user, normalized)));
    }

    /** The write half of {@link #bindEmail}, deferred so it does not run while the ownership probe is still pending. */
    private Mono<Boolean> doBindEmail(User user, String normalized) {
        Connection connection = Connection.builder()
                .source(AuthSourceConstants.EMAIL)
                .name(normalized)
                .rawId(normalized)
                .email(normalized)
                .build();
        user.getConnections().add(connection);
        user.setEmail(normalized);
        return repository.save(user)
                .then(Mono.just(true))
                // Still needed: the probe above is not atomic with the save, so a concurrent bind of the
                // same address can still land between the two and be caught only by the index.
                .onErrorResume(throwable -> {
                    if (throwable instanceof DuplicateKeyException) {
                        return Mono.error(new BizException(BizError.ALREADY_BIND, "ALREADY_BIND", normalized, ""));
                    }
                    return Mono.error(throwable);
                });
    }

    @Override
    public Mono<User> addNewConnectionAndReturnUser(String userId, AuthUser authUser) {
        Connection connection = authUser.toAuthConnection();
        return findById(userId)
                .doOnNext(user -> {
                    user.getConnections().add(connection);
                    if(StringUtils.isEmpty(user.getEmail())) user.setEmail(connection.getEmail());
                    user.setActiveAuthId(connection.getAuthId());

                    if (AuthSourceConstants.EMAIL.equals(authUser.getSource())
                            && authUser.getAuthContext() instanceof FormAuthRequestContext formAuthRequestContext) {
                        user.setPassword(encryptionService.encryptPassword(formAuthRequestContext.getPassword()));
                    }
                })
                .flatMap(repository::save);
    }

    @Override
    public Mono<User> saveUser(User user) {
        return repository.save(user);
    }

    @Override
    public Mono<Void> deleteProfilePhoto(User visitor) {
        String userAvatar = visitor.getAvatar();
        if (StringUtils.isBlank(userAvatar)) {
            // BF-098: no photo to delete (blank, as User#getAvatarUrl reads it); thenReturn(null) below used to throw a NullPointerException
            return Mono.empty();
        }
        visitor.setAvatar(null);
        return repository.save(visitor).thenReturn(userAvatar)
                .flatMap(assetService::remove);
    }

    @Override
    public Mono<Boolean> updatePassword(String userId, String oldPassword, String newPassword) {
        return findExistingById(userId)
                .<User> handle((user, sink) -> {
                    String password = user.getPassword();
                    if (StringUtils.isBlank(password)) {
                        sink.error(ofException(BizError.INVALID_PASSWORD, "INVALID_PASSWORD"));
                        return;
                    }
                    String originalEncryptPassword = user.getPassword();
                    if (!encryptionService.matchPassword(oldPassword, originalEncryptPassword)) {
                        sink.error(ofException(BizError.INVALID_PASSWORD, "INVALID_PASSWORD"));
                        return;
                    }
                    user.setPassword(encryptionService.encryptPassword(newPassword));
                    sink.next(user);
                })
                .flatMap(repository::save)
                .thenReturn(true);
    }

    @Override
    public Mono<String> resetPassword(String userId) {
        return findById(userId)
                .flatMap(user -> {
                    String password = user.getPassword();
                    if (StringUtils.isBlank(password)) {
                        return ofError(BizError.INVALID_PASSWORD, "PASSWORD_NOT_SET_YET");
                    }

                    String randomStr = generateNewRandomPwd();
                    user.setPassword(encryptionService.encryptPassword(randomStr));
                    return repository.save(user)
                            .thenReturn(randomStr);
                });
    }

    @Override
    public Mono<Boolean> lostPassword(String userEmail) {
        return findByEmailDeep(userEmail)
                .switchIfEmpty(Mono.defer(() -> findByName(userEmail)))
                .filter(UserServiceImpl::canRecoverPassword)
                .zipWhen(user -> orgMemberService.getCurrentOrgMember(user.getId())
                .flatMap(orgMember -> organizationService.getById(orgMember.getOrgId()))
                .map(organization -> passwordResetEmailTemplate(organization.getCommonSettings())))
                .flatMap(tuple -> {
                    User user = tuple.getT1();
                    String emailTemplate = tuple.getT2();

                    String token = generateNewRandomPwd();
                    Instant tokenExpiry = Instant.now().plus(12, ChronoUnit.HOURS);
                    if (!emailCommunicationService.sendPasswordResetEmail(userEmail, token, emailTemplate)) {
                        return Mono.empty();
                    }
                    user.setPasswordResetToken(HashUtils.hash(token.getBytes()));
                    user.setPasswordResetTokenExpiry(tokenExpiry);
                    return repository.save(user).then(Mono.empty());
                });
    }

    /**
     * The org's password-reset mail template, stored under {@link OrganizationCommonSettings#PASSWORD_RESET_EMAIL_TEMPLATE}
     * (BF-041: it was looked up with the default template's text as the key, so a custom template was never used). Common
     * settings take any JSON value, so anything but a non-blank text falls back to the default template.
     */
    private static String passwordResetEmailTemplate(OrganizationCommonSettings settings) {
        return settings.get(OrganizationCommonSettings.PASSWORD_RESET_EMAIL_TEMPLATE) instanceof String template && StringUtils.isNotBlank(template)
                ? template
                : PASSWORD_RESET_EMAIL_TEMPLATE_DEFAULT;
    }

    @Override
    public Mono<Boolean> resetLostPassword(String userEmail, String token, String newPassword) {
        return findByEmailDeep(userEmail)
                .switchIfEmpty(Mono.defer(() -> findByName(userEmail)))
                .filter(UserServiceImpl::canRecoverPassword)
                .flatMap(user -> {
                    // Null when this account never requested a reset. Previously an NPE -- and a 500 on an
                    // unauthenticated endpoint -- reachable for any account resolvable by name; resolving by
                    // address reaches strictly more accounts, so guard it rather than widen the hole.
                    if (user.getPasswordResetTokenExpiry() == null
                            || Instant.now().until(user.getPasswordResetTokenExpiry(), ChronoUnit.MINUTES) <= 0) {
                        return ofError(BizError.INVALID_PARAMETER, "TOKEN_EXPIRED");
                    }

                    if (!StringUtils.equals(HashUtils.hash(token.getBytes()), user.getPasswordResetToken())) {
                        return ofError(BizError.INVALID_PARAMETER, "INVALID_TOKEN");
                    }

                    user.setPassword(encryptionService.encryptPassword(newPassword));
                    user.setPasswordResetToken(StringUtils.EMPTY);
                    user.setPasswordResetTokenExpiry(Instant.now());
                    return repository.save(user)
                            .thenReturn(true);
                });
    }

    @SuppressWarnings("SpellCheckingInspection")
    @Nonnull
    private static String generateNewRandomPwd() {
        char[] possibleCharacters = ("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~`!@#$%^&*()-_=+[{]}<>?")
                .toCharArray();
        return RandomStringUtils.random(12, 0, possibleCharacters.length - 1,
                false, false, possibleCharacters, new SecureRandom());
    }

    @Override
    public Mono<Boolean> setPassword(String userId, String password) {
        return findExistingById(userId)
                .map(user -> {
                    user.setPassword(encryptionService.encryptPassword(password));
                    return user;
                })
                .flatMap(repository::save)
                .thenReturn(true);
    }

    @Override
    public Mono<Boolean> markAsSuperAdmin(String userId) {
        return findExistingById(userId)
                .map(user -> {
                    user.setSuperAdmin(true);
                    return user;
                })
                .flatMap(repository::save)
                .thenReturn(true);
    }

    /**
     * The user, or USER_NOT_EXIST when there is none (BF-100: updatePassword, setPassword and markAsSuperAdmin answered
     * true for an unknown id, as {@code thenReturn(true)} follows an empty upstream, though nothing was saved).
     */
    private Mono<User> findExistingById(String userId) {
        return findById(userId)
                .switchIfEmpty(deferredError(BizError.USER_NOT_EXIST, "USER_NOT_EXIST"));
    }

    @Override
    public Mono<UserDetail> buildUserDetail(User user, boolean withoutDynamicGroups) {
        if (user.isAnonymous()) {
            return Mono.just(ANONYMOUS_CURRENT_USER);
        }
        return Mono.deferContextual(contextView -> {
            String ip = contextView.getOrDefault(CLIENT_IP, "");
            Locale locale = LocaleUtils.getLocale(contextView);
            return orgMemberService.getCurrentOrgMember(user.getId())
                    .zipWhen(orgMember -> buildUserDetailGroups(user.getId(), orgMember, withoutDynamicGroups, locale))
                    .map(tuple2 -> {
                        OrgMember orgMember = tuple2.getT1();
                        List<Map<String, String>> groups = tuple2.getT2();
                        String activeAuthId = user.getActiveAuthId();
                        Optional<Connection> connection = user.getConnections().stream().filter(con -> con.hasAuthId(activeAuthId)).findFirst();
                        HashMap<String, Object> userAuth = connectionToUserAuthDetail(connection);
                        return UserDetail.builder()
                                .id(user.getId())
                                .name(StringUtils.isEmpty(user.getName())?user.getId():user.getName())
                                .avatarUrl(user.getAvatarUrl())
                                .uiLanguage(user.getUiLanguage())
                                .email(user.getEmail())
                                .ip(ip)
                                .groups(groups)
                                .extra(getUserDetailExtra(user, orgMember.getOrgId()))
                                .userAuth(userAuth)
                                .build();
                    });
        });
    }

    private static @NotNull HashMap<String, Object> connectionToUserAuthDetail(Optional<Connection> connection) {
        HashMap<String, Object> userAuth = new HashMap<String, Object>();
        if(connection.isPresent()) {
            if(connection.get().getSource().equals(AuthSourceConstants.EMAIL)) {
                userAuth.put("jwt", "");
                userAuth.put("provider", AuthSourceConstants.EMAIL);
            } else if(connection.get().getAuthConnectionAuthToken() != null) {
                userAuth.put("jwt", connection.get().getAuthConnectionAuthToken().getAccessToken());
                userAuth.put("provider", connection.get().getSource());
            } else {
                userAuth.put("jwt", "");
                userAuth.put("provider", connection.get().getSource());
            }
        }
        return userAuth;
    }

    /**
     * In enterprise mode, user can be deleted and then related connections should be released here by appending a timestamp after the source field.
     */
    @Override
    public Mono<Boolean> markUserDeletedAndInvalidConnectionsAtEnterpriseMode(String userId) {
        if (commonConfig.getWorkspace().getMode() == WorkspaceMode.SAAS) {
            return Mono.just(false);
        }
        return repository.findById(userId)
                .flatMap(user -> {
                    user.markAsDeleted();
                    return mongoUpsertHelper.updateById(user, userId);
                });
    }

    protected Map<String, Object> getUserDetailExtra(User user, String orgId) {
        return Optional.ofNullable(user.getOrgTransformedUserInfo())
                .map(orgTransformedUserInfo -> orgTransformedUserInfo.get(orgId))
                .map(TransformedUserInfo::extra)
                .orElse(convertConnections(user.getConnections().stream().filter(c -> c.hasAuthId(user.getActiveAuthId())).collect(Collectors.toSet())));
    }

    protected Mono<List<Map<String, String>>> buildUserDetailGroups(String userId, OrgMember orgMember, boolean withoutDynamicGroups,
            Locale locale) {
        String orgId = orgMember.getOrgId();
        Flux<Group> groups;
        if (orgMember.isAdmin() || orgMember.isSuperAdmin()) {
            groups = groupService.getByOrgId(orgId).sort();
        } else {
            if (withoutDynamicGroups) {
                groups = groupMemberService.getNonDynamicUserGroupIdsInOrg(orgId, userId).flatMapMany(l -> groupService.getByIds(l));
            } else {
                groups = groupMemberService.getUserGroupIdsInOrg(orgId, userId).flatMapMany(l -> groupService.getByIds(l));
            }
        }
        return groups.filter(group -> !group.isAllUsersGroup())
                .map(group -> Map.of("groupId", Objects.toString(group.getId(), ""), "groupName", group.getName(locale)))
                .collectList();
    }

    protected Map<String, Object> convertConnections(Set<Connection> connections) {
        return connections.stream()
                .filter(connection -> !AuthSourceConstants.EMAIL.equals(connection.getSource()) &&
                        !AuthSourceConstants.PHONE.equals(connection.getSource()))
                .collect(Collectors.toMap(Connection::getSource, Connection::getRawUserInfo));
    }

    protected String convertEmail(Set<Connection> connections) {
        return connections.stream().filter(connection -> AuthSourceConstants.EMAIL.equals(connection.getSource()))
                .findFirst()
                .map(Connection::getName)
                .orElse("");
    }

    @Override
    public Flux<User> bulkCreateUser(Collection<User> users) {
        return repository.saveAll(users);
    }

    @Override
    public Mono<Void> bulkUpdateUser(Collection<PartialResourceWithId<User>> partialResourceWithIds) {
        return mongoUpsertHelper.bulkUpdate(partialResourceWithIds).then();
    }

    @Override
    public Flux<User> findBySourceAndIds(String connectionSource, Collection<String> connectionSourceUuids) {
        return repository.findByConnections_SourceAndConnections_RawIdIn(connectionSource, connectionSourceUuids);
    }

    @Override
    public Flux<User> findUsersByIdsAndSearchNameForPagination(Collection<String> ids, String state, boolean isEnabled, String searchRegex, Pageable pageable) {
        return repository.findUsersByIdsAndSearchNameForPagination(ids, state, isEnabled, searchRegex, pageable);
    }

    @Override
    public Mono<Long> countUsersByIdsAndSearchName(Collection<String> ids, String state, boolean isEnabled, String searchRegex) {
        return repository.countUsersByIdsAndSearchName(ids, state, isEnabled, searchRegex);
    }
}
