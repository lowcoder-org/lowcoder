package org.lowcoder.domain.permission.service;

import com.google.common.collect.Maps;
import com.google.common.collect.Sets;
import jakarta.annotation.Nonnull;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.collections4.ListUtils;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.domain.application.model.ApplicationRequestType;
import org.lowcoder.domain.bundle.model.BundleRequestType;
import org.lowcoder.domain.group.service.GroupMemberService;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.permission.model.*;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.constants.FieldName;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.*;
import java.util.function.Function;

import static java.util.Collections.*;
import static java.util.function.Function.identity;
import static java.util.stream.Collectors.toCollection;
import static java.util.stream.Collectors.toMap;
import static org.lowcoder.sdk.constants.Authentication.isAnonymousUser;

abstract class ResourcePermissionHandler implements ResourcePermissionHandlerService {

    /**
     * Upper bound of the lookups one batch runs at the same time: the per-id workspace lookups of a handler without a batch
     * lookup (applications) and the per-workspace membership decisions. The MongoDB driver's default pool is 100
     * connections and no pool size is configured in this repository, so one large batch cannot take the pool from other
     * requests.
     */
    static final int ORG_LOOKUP_CONCURRENCY = 16;

    @Lazy
    @Autowired
    private ResourcePermissionService resourcePermissionService;

    @Autowired
    private GroupMemberService groupMemberService;

    @Autowired
    private OrgMemberService orgMemberService;

    @Autowired
    protected CommonConfig config;

    /**
     * Matching permissions of the user on each id. One id is decided as the one-resource checks decide it, its lookup
     * errors included. Two or more ids are each decided in their own workspace (D-38: the workspace and admin role of
     * the first id were applied to all ids): blank ids and ids that name nothing get no entry, a failed lookup fails the
     * answer. Cost: the workspace lookup of the handler ({@link #getOrgIds}: for data sources and bundles one batch call,
     * which runs one query per key kind present, object ids and gids; for applications one read per id, at most
     * {@link #ORG_LOOKUP_CONCURRENCY} at once) plus one membership read per workspace, and for a member one group read
     * and one permission read per workspace. Limits: a resource stored without a workspace id fails the answer; a gid
     * stored twice is answered with the first match the lookup returns; a data source or bundle key is answered only as
     * the kind {@link FieldName#isGID} gives it, so a gid stored without a hyphen gets no entry when asked by that gid;
     * an application slug several applications share gets no entry, like an id that names nothing (the lookup answers
     * both alike).
     */
    @Override
    public Mono<Map<String, List<ResourcePermission>>> getAllMatchingPermissions(String userId,
                                                                                 Collection<String> resourceIds,
                                                                                 ResourceAction resourceAction) {

        ResourceType resourceType = resourceAction.getResourceType();

        if (CollectionUtils.isEmpty(resourceIds)) {
            return Mono.just(emptyMap());
        }

        if (isAnonymousUser(userId)) {
            return getAnonymousUserPermissions(resourceIds, resourceAction);
        }

        Set<String> distinctIds = new LinkedHashSet<>(resourceIds);
        Mono<Map<String, List<ResourcePermission>>> orgPermissionsMono;
        if (distinctIds.size() == 1) {
            orgPermissionsMono = getOrgId(distinctIds.iterator().next())
                    .flatMap(orgId -> getPermissionsInOrg(userId, orgId, resourceType, distinctIds, resourceAction));
        } else {
            Set<String> lookupIds = distinctIds.stream().filter(StringUtils::isNotBlank)
                    .collect(toCollection(LinkedHashSet::new));
            orgPermissionsMono = (lookupIds.isEmpty() ? Mono.just(Map.<String, String> of()) : getOrgIds(lookupIds))
                    .flatMap(orgIdById -> getPermissionsPerOrg(userId, resourceType, lookupIds, orgIdById, resourceAction));
        }
        return orgPermissionsMono
                .switchIfEmpty(Mono.just(Maps.newHashMap()))
                .zipWith(getAnonymousUserPermissions(resourceIds, resourceAction))
                .flatMap(tuple2 -> {
                    Map<String, List<ResourcePermission>> permissionMap = tuple2.getT1();
                    Map<String, List<ResourcePermission>> templatePermissionMap = tuple2.getT2();
                    templatePermissionMap.forEach((key, value) -> permissionMap.merge(key, value, ListUtils::union));
                    return Mono.just(permissionMap);
                });
    }

    /** Today's decision for ids of ONE workspace; empty when the user is not a member there. */
    private Mono<Map<String, List<ResourcePermission>>> getPermissionsInOrg(String userId, String orgId,
            ResourceType resourceType, Collection<String> resourceIds, ResourceAction resourceAction) {
        return orgMemberService.getOrgMember(orgId, userId)
                .flatMap(orgMember -> {
                    if (orgMember.isAdmin() || orgMember.isSuperAdmin()) {
                        return Mono.just(buildAdminPermissions(resourceType, resourceIds, userId));
                    }
                    return getAllMatchingPermissions0(userId, orgMember.getOrgId(), resourceType, resourceIds, resourceAction);
                });
    }

    private Mono<Map<String, List<ResourcePermission>>> getPermissionsPerOrg(String userId, ResourceType resourceType,
            Set<String> lookupIds, Map<String, String> orgIdById, ResourceAction resourceAction) {
        Map<String, List<String>> idsByOrgId = new LinkedHashMap<>();
        lookupIds.forEach(id -> {
            String orgId = orgIdById.get(id);
            if (orgId != null) {
                idsByOrgId.computeIfAbsent(orgId, key -> new ArrayList<>()).add(id);
            }
        });
        return Flux.fromIterable(idsByOrgId.entrySet())
                .flatMap(entry -> getPermissionsInOrg(userId, entry.getKey(), resourceType, entry.getValue(), resourceAction),
                        ORG_LOOKUP_CONCURRENCY)
                .<Map<String, List<ResourcePermission>>> collect(HashMap::new, Map::putAll);
    }

    /**
     * The workspace of each given id that names a resource, looked up one id at a time with {@link #getOrgId}, at most
     * {@link #ORG_LOOKUP_CONCURRENCY} at once. An id that names nothing (NO_RESOURCE_FOUND) is left out; any other error is
     * a failed lookup and fails the answer. Limit: the application lookup raises the same NO_RESOURCE_FOUND for a slug
     * several applications share, so such a key is left out too, like an unknown id (D-38). A handler with a batch lookup
     * overrides this. Called with non-blank ids only.
     */
    protected Mono<Map<String, String>> getOrgIds(Set<String> resourceIds) {
        return Flux.fromIterable(resourceIds)
                .flatMap(resourceId -> getOrgId(resourceId)
                                .onErrorResume(ResourcePermissionHandler::isNoResourceFound, error -> Mono.empty())
                                .map(orgId -> Map.entry(resourceId, orgId)),
                        ORG_LOOKUP_CONCURRENCY)
                .collectMap(Map.Entry::getKey, Map.Entry::getValue);
    }

    /**
     * The workspace of each asked key among {@code found}, the answer of a batch lookup by object id or gid
     * ({@code IdOrGidLookup}). Each key is told an object id or a gid by {@link FieldName#isGID} (a hyphen: gid), the rule
     * the lookup splits its queries by, and is matched only against the field of its kind: an object-id key against
     * {@code idOf}, a gid key against {@code gidOf}. A key equal to the other field of a found resource (a gid stored
     * without a hyphen, an object id with one) gets no entry from it: the lookup did not find that resource by that key,
     * and the one-id lookup of that key does not find it either. The lookup's queries are exact matches, so a
     * resource whose field of a key's kind equals the key was found by that key's own query: matching by kind gives the
     * pairs the lookup found, without tracking which query returned a resource. The first resource found for a key wins
     * (a gid stored twice). A found resource without a workspace id fails the answer, as the one-id {@link #getOrgId}
     * does.
     */
    protected static <T> Mono<Map<String, String>> orgIdsByKey(Flux<T> found, Set<String> keys, Function<T, String> idOf,
            Function<T, String> gidOf, Function<T, String> orgIdOf) {
        return found.<Map<String, String>> collect(HashMap::new, (orgIdByKey, resource) -> {
            String orgId = Objects.requireNonNull(orgIdOf.apply(resource), "organizationId");
            putIfAskedAsKind(orgIdByKey, keys, idOf.apply(resource), false, orgId);
            putIfAskedAsKind(orgIdByKey, keys, gidOf.apply(resource), true, orgId);
        });
    }

    /** Maps {@code key} to {@code orgId} when it is asked and {@link FieldName#isGID} tells it the given kind. */
    private static void putIfAskedAsKind(Map<String, String> orgIdByKey, Set<String> keys, String key, boolean gidKind,
            String orgId) {
        if (key != null && keys.contains(key) && FieldName.isGID(key) == gidKind) {
            orgIdByKey.putIfAbsent(key, orgId);
        }
    }

    private static boolean isNoResourceFound(Throwable error) {
        return error instanceof BizException bizException && bizException.getError() == BizError.NO_RESOURCE_FOUND;
    }

    @Override
    public Mono<UserPermissionOnResourceStatus> checkUserPermissionStatusOnResource(String userId,
                                                                                    String resourceId, ResourceAction resourceAction) {

        ResourceType resourceType = resourceAction.getResourceType();

        Mono<UserPermissionOnResourceStatus> publicResourcePermissionMono = getAnonymousUserPermissions(singletonList(resourceId), resourceAction)
                .map(it -> it.getOrDefault(resourceId, emptyList()))
                .map(it -> {
                    if (!it.isEmpty()) {
                        return UserPermissionOnResourceStatus.success(it.get(0));
                    }
                    return isAnonymousUser(userId) ? UserPermissionOnResourceStatus.anonymousUser() : UserPermissionOnResourceStatus.notInOrg();
                });

        if (isAnonymousUser(userId)) {
            return publicResourcePermissionMono;
        }

        Mono<UserPermissionOnResourceStatus> nonAnonymousPublicResourcePermissionMono = getNonAnonymousUserPublicResourcePermissions(singletonList(resourceId), resourceAction, userId)
                .map(it -> it.getOrDefault(resourceId, emptyList()))
                .map(it -> {
                    if (!it.isEmpty()) {
                        return UserPermissionOnResourceStatus.success(it.get(0));
                    }
                    return isAnonymousUser(userId) ? UserPermissionOnResourceStatus.anonymousUser() : UserPermissionOnResourceStatus.notInOrg();
                });


        Mono<UserPermissionOnResourceStatus> orgUserPermissionMono = getOrgId(resourceId)
                .flatMap(orgId -> orgMemberService.getOrgMember(orgId, userId))
                .flatMap(orgMember -> {
                    if (orgMember.isAdmin() || orgMember.isSuperAdmin()) {
                        return Mono.just(UserPermissionOnResourceStatus.success(buildAdminPermission(resourceType, userId, resourceId)));
                    }
                    return getAllMatchingPermissions0(userId, orgMember.getOrgId(), resourceType, Collections.singleton(resourceId), resourceAction)
                            .map(it -> it.getOrDefault(resourceId, emptyList()))
                            .map(permissions -> permissions.isEmpty() ? UserPermissionOnResourceStatus.notEnoughPermission()
                                                                      : UserPermissionOnResourceStatus.success(getMaxPermission(permissions)));
                })
                .defaultIfEmpty(UserPermissionOnResourceStatus.notInOrg());

        return Mono.zip(publicResourcePermissionMono, nonAnonymousPublicResourcePermissionMono, orgUserPermissionMono)
                .map(tuple -> {
                    UserPermissionOnResourceStatus publicResourcePermission = tuple.getT1();
                    UserPermissionOnResourceStatus nonAnonymousPublicResourcePermission = tuple.getT2();
                    UserPermissionOnResourceStatus orgUserPermission = tuple.getT3();
                    if (orgUserPermission.hasPermission()) {
                        return orgUserPermission;
                    }
                    if(nonAnonymousPublicResourcePermission.hasPermission()) {
                        return nonAnonymousPublicResourcePermission;
                    }
                    if (publicResourcePermission.hasPermission()) {
                        return publicResourcePermission;
                    }
                    return orgUserPermission;
                });
    }

    @SuppressWarnings("OptionalGetWithoutIsPresent")
    @Nonnull
    private ResourcePermission getMaxPermission(List<ResourcePermission> permissions) {
        return permissions.stream()
                .max(Comparator.comparingInt(it -> it.getResourceRole().getRoleWeight()))
                .get();
    }

    protected abstract Mono<Map<String, List<ResourcePermission>>> getAnonymousUserPermissions(Collection<String> resourceIds,
            ResourceAction resourceAction);

    protected abstract Mono<Map<String, List<ResourcePermission>>> getNonAnonymousUserPublicResourcePermissions
            (Collection<String> resourceIds, ResourceAction resourceAction, String userId);

    protected abstract Mono<Map<String, List<ResourcePermission>>> getAnonymousUserApplicationPermissions(Collection<String> resourceIds,
            ResourceAction resourceAction, ApplicationRequestType requestType);

    protected abstract Mono<Map<String, List<ResourcePermission>>> getNonAnonymousUserApplicationPublicResourcePermissions
            (Collection<String> resourceIds, ResourceAction resourceAction, ApplicationRequestType requestType, String userId);

    protected abstract Mono<Map<String, List<ResourcePermission>>> getAnonymousUserBundlePermissions(Collection<String> resourceIds,
                                                                                                          ResourceAction resourceAction, BundleRequestType requestType);

    protected abstract Mono<Map<String, List<ResourcePermission>>> getNonAnonymousUserBundlePublicResourcePermissions
            (Collection<String> resourceIds, ResourceAction resourceAction, BundleRequestType requestType, String userId);
    
    
    private Mono<Map<String, List<ResourcePermission>>> getAllMatchingPermissions0(String userId, String orgId, ResourceType resourceType,
            Collection<String> resourceIds,
            ResourceAction resourceAction) {
        Mono<Map<String, Collection<ResourcePermission>>> permissionsMapMono =
                resourcePermissionService.getByResourceTypeAndResourceIds(resourceType, resourceIds);
        Mono<Set<String>> userGroupIdsMono = getUserGroupIds(orgId, userId);

        return Mono.zip(userGroupIdsMono, permissionsMapMono)
                .map(tuple -> {
                    Set<String> userGroupIds = tuple.getT1();
                    Map<String, Collection<ResourcePermission>> permissionMap = tuple.getT2();

                    return resourceIds
                            .stream()
                            .collect(toMap(identity(),
                                    resourceId -> {
                                        var resourcePermissions = permissionMap.getOrDefault(resourceId, emptyList());
                                        return filterMatchingPermissions(userId, userGroupIds, resourcePermissions, resourceAction);
                                    }));
                });
    }

    private List<ResourcePermission> filterMatchingPermissions(String userId,
            Set<String> userGroupIds, Collection<ResourcePermission> resourcePermissions, ResourceAction resourceAction) {
        if (CollectionUtils.isEmpty(resourcePermissions)) {
            return emptyList();
        }
        return resourcePermissions.stream()
                .filter(permission -> permission.matchUser(userId, resourceAction)
                        || permission.matchGroup(userGroupIds, resourceAction))
                .toList();
    }

    private Map<String, List<ResourcePermission>> buildAdminPermissions(ResourceType resourceType,
            Collection<String> resourceIds, String userId) {
        return resourceIds.stream()
                .distinct()
                .collect(toMap(it -> it,
                        resourceId -> singletonList(buildAdminPermission(resourceType, userId, resourceId)))
                );
    }

    private ResourcePermission buildAdminPermission(ResourceType resourceType, String userId, String resourceId) {
        return ResourcePermission.builder()
                .resourceType(resourceType)
                .resourceId(resourceId)
                .resourceHolder(ResourceHolder.USER)
                .resourceHolderId(userId)
                .resourceRole(ResourceRole.OWNER)
                .build();
    }


    private Mono<Set<String>> getUserGroupIds(String orgId, String userId) {
        return groupMemberService.getUserGroupIdsInOrg(orgId, userId)
                .map(Sets::newHashSet);
    }

    protected abstract Mono<String> getOrgId(String resourceId);

	@Override
    public Mono<UserPermissionOnResourceStatus> checkUserPermissionStatusOnApplication(String userId, String resourceId,
                                                                                       ResourceAction resourceAction, ApplicationRequestType requestType)
	{
        ResourceType resourceType = resourceAction.getResourceType();

        Mono<UserPermissionOnResourceStatus> publicResourcePermissionMono = getAnonymousUserApplicationPermissions(singletonList(resourceId), resourceAction, requestType)
                .map(it -> it.getOrDefault(resourceId, emptyList()))
                .map(it -> {
                    if (!it.isEmpty()) {
                        return UserPermissionOnResourceStatus.success(it.get(0));
                    }
                    return isAnonymousUser(userId) ? UserPermissionOnResourceStatus.anonymousUser() : UserPermissionOnResourceStatus.notInOrg();
                });

        if (isAnonymousUser(userId)) {
            return publicResourcePermissionMono;
        }

        Mono<UserPermissionOnResourceStatus> nonAnonymousPublicResourcePermissionMono = getNonAnonymousUserApplicationPublicResourcePermissions(singletonList(resourceId), resourceAction, requestType, userId)
                .map(it -> it.getOrDefault(resourceId, emptyList()))
                .map(it -> {
                    if (!it.isEmpty()) {
                        return UserPermissionOnResourceStatus.success(it.get(0));
                    }
                    return isAnonymousUser(userId) ? UserPermissionOnResourceStatus.anonymousUser() : UserPermissionOnResourceStatus.notInOrg();
                });


        Mono<UserPermissionOnResourceStatus> orgUserPermissionMono = getOrgId(resourceId)
                .flatMap(orgId -> orgMemberService.getOrgMember(orgId, userId))
                .flatMap(orgMember -> {
                    if (orgMember.isAdmin() || orgMember.isSuperAdmin()) {
                        return Mono.just(UserPermissionOnResourceStatus.success(buildAdminPermission(resourceType, userId, resourceId)));
                    }
                    return getAllMatchingPermissions0(userId, orgMember.getOrgId(), resourceType, Collections.singleton(resourceId), resourceAction)
                            .map(it -> it.getOrDefault(resourceId, emptyList()))
                            .map(permissions -> permissions.isEmpty() ? UserPermissionOnResourceStatus.notEnoughPermission()
                                                                      : UserPermissionOnResourceStatus.success(getMaxPermission(permissions)));
                })
                .defaultIfEmpty(UserPermissionOnResourceStatus.notInOrg());

        return Mono.zip(publicResourcePermissionMono, nonAnonymousPublicResourcePermissionMono, orgUserPermissionMono)
                .map(tuple -> {
                    UserPermissionOnResourceStatus publicResourcePermission = tuple.getT1();
                    UserPermissionOnResourceStatus nonAnonymousPublicResourcePermission = tuple.getT2();
                    UserPermissionOnResourceStatus orgUserPermission = tuple.getT3();
                    if (orgUserPermission.hasPermission()) {
                        return orgUserPermission;
                    }
                    if(nonAnonymousPublicResourcePermission.hasPermission()) {
                        return nonAnonymousPublicResourcePermission;
                    }
                    if (publicResourcePermission.hasPermission()) {
                        return publicResourcePermission;
                    }
                    return orgUserPermission;
                });
	}
    @Override
    public Mono<UserPermissionOnResourceStatus> checkUserPermissionStatusOnBundle(String userId, String resourceId,
                                                                                       ResourceAction resourceAction, BundleRequestType requestType)
    {
        ResourceType resourceType = resourceAction.getResourceType();

        Mono<UserPermissionOnResourceStatus> publicResourcePermissionMono = getAnonymousUserBundlePermissions(singletonList(resourceId), resourceAction, requestType)
                .map(it -> it.getOrDefault(resourceId, emptyList()))
                .map(it -> {
                    if (!it.isEmpty()) {
                        return UserPermissionOnResourceStatus.success(it.get(0));
                    }
                    return isAnonymousUser(userId) ? UserPermissionOnResourceStatus.anonymousUser() : UserPermissionOnResourceStatus.notInOrg();
                });

        if (isAnonymousUser(userId)) {
            return publicResourcePermissionMono;
        }

        Mono<UserPermissionOnResourceStatus> nonAnonymousPublicResourcePermissionMono = getNonAnonymousUserBundlePublicResourcePermissions(singletonList(resourceId), resourceAction, requestType, userId)
                .map(it -> it.getOrDefault(resourceId, emptyList()))
                .map(it -> {
                    if (!it.isEmpty()) {
                        return UserPermissionOnResourceStatus.success(it.get(0));
                    }
                    return isAnonymousUser(userId) ? UserPermissionOnResourceStatus.anonymousUser() : UserPermissionOnResourceStatus.notInOrg();
                });


        Mono<UserPermissionOnResourceStatus> orgUserPermissionMono = getOrgId(resourceId)
                .flatMap(orgId -> orgMemberService.getOrgMember(orgId, userId))
                .flatMap(orgMember -> {
                    if (orgMember.isAdmin() || orgMember.isSuperAdmin()) {
                        return Mono.just(UserPermissionOnResourceStatus.success(buildAdminPermission(resourceType, userId, resourceId)));
                    }
                    return getAllMatchingPermissions0(userId, orgMember.getOrgId(), resourceType, Collections.singleton(resourceId), resourceAction)
                            .map(it -> it.getOrDefault(resourceId, emptyList()))
                            .map(permissions -> permissions.isEmpty() ? UserPermissionOnResourceStatus.notEnoughPermission()
                                    : UserPermissionOnResourceStatus.success(getMaxPermission(permissions)));
                })
                .defaultIfEmpty(UserPermissionOnResourceStatus.notInOrg());

        return Mono.zip(publicResourcePermissionMono, nonAnonymousPublicResourcePermissionMono, orgUserPermissionMono)
                .map(tuple -> {
                    UserPermissionOnResourceStatus publicResourcePermission = tuple.getT1();
                    UserPermissionOnResourceStatus nonAnonymousPublicResourcePermission = tuple.getT2();
                    UserPermissionOnResourceStatus orgUserPermission = tuple.getT3();
                    if (orgUserPermission.hasPermission()) {
                        return orgUserPermission;
                    }
                    if(nonAnonymousPublicResourcePermission.hasPermission()) {
                        return nonAnonymousPublicResourcePermission;
                    }
                    if (publicResourcePermission.hasPermission()) {
                        return publicResourcePermission;
                    }
                    return orgUserPermission;
                });
    }
}
