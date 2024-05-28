package org.lowcoder.api.bundle;

import jakarta.annotation.Nonnull;
import jakarta.annotation.Nullable;
import lombok.RequiredArgsConstructor;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.api.bundle.BundleEndpoints.CreateBundleRequest;
import org.lowcoder.api.application.view.ApplicationInfoView;
import org.lowcoder.api.application.view.ApplicationPermissionView;
import org.lowcoder.api.bundle.view.BundleInfoView;
import org.lowcoder.api.bundle.view.BundlePermissionView;
import org.lowcoder.api.home.FolderApiService;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.home.UserHomeApiService;
import org.lowcoder.api.permission.PermissionHelper;
import org.lowcoder.api.permission.view.PermissionItemView;
import org.lowcoder.api.usermanagement.OrgDevChecker;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.model.ApplicationType;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.bundle.model.BundleRequestType;
import org.lowcoder.domain.bundle.model.BundleStatus;
import org.lowcoder.domain.bundle.service.BundleElementRelationService;
import org.lowcoder.domain.bundle.service.BundleNode;
import org.lowcoder.domain.bundle.service.BundleService;
import org.lowcoder.domain.bundle.model.BundleElement;
import org.lowcoder.domain.bundle.service.*;
import org.lowcoder.domain.group.service.GroupService;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.permission.model.*;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.*;
import java.util.function.Function;
import java.util.function.ToLongFunction;

import static org.apache.commons.collections4.CollectionUtils.isNotEmpty;
import static org.lowcoder.domain.bundle.model.BundleStatus.NORMAL;
import static org.lowcoder.domain.permission.model.ResourceAction.*;
import static org.lowcoder.infra.util.MonoUtils.emptyIfNull;
import static org.lowcoder.sdk.exception.BizError.*;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;

@RequiredArgsConstructor
@Service
public class BundleApiServiceImpl implements BundleApiService {

    private static final Comparator<Node<ApplicationInfoView, BundleInfoView>> DEFAULT_COMPARATOR =
            // compare by last view time reversed.
            Comparator.comparingLong((ToLongFunction<Node<ApplicationInfoView, BundleInfoView>>) node -> {
                        if (node instanceof ElementNode<ApplicationInfoView, BundleInfoView> elementNode) {
                            return elementNode.getSelf().getBundlePosition();
                        }
                        return ((BundleNode<ApplicationInfoView, BundleInfoView>) node).getSelf().getCreateTime();
                    })
                    .reversed()
                    // compare by name.
                    .thenComparing(node -> {
                        if (node instanceof ElementNode<ApplicationInfoView, BundleInfoView> elementNode) {
                            return elementNode.getSelf().getName();
                        }
                        return ((BundleNode<ApplicationInfoView, BundleInfoView>) node).getSelf().getName();
                    });

    private final BundleService bundleService;
    private final SessionUserService sessionUserService;
    private final OrgDevChecker orgDevChecker;
    @Lazy
    private final UserHomeApiService userHomeApiService;
    private final BundleElementRelationService bundleElementRelationService;
    private final ResourcePermissionService resourcePermissionService;
    private final PermissionHelper permissionHelper;
    private final GroupService groupService;
    private final UserService userService;
    private final OrganizationService organizationService;
    private final FolderApiService folderApiService;

    @Override
    public Mono<BundleInfoView> create(CreateBundleRequest createBundleRequest) {
        Bundle bundle = Bundle.builder()
                .organizationId(createBundleRequest.organizationId())
                .name(createBundleRequest.name())
                .image(createBundleRequest.image())
                .title(createBundleRequest.title())
                .description(createBundleRequest.description())
                .category(createBundleRequest.category())
                .bundleStatus(NORMAL)
                .publicToAll(false)
                .publicToMarketplace(false)
                .agencyProfile(false)
                .build();
        if (StringUtils.isBlank(bundle.getName())) {
            return Mono.error(new BizException(BizError.INVALID_PARAMETER, "BUNDLE_NAME_EMPTY"));
        }
        return orgDevChecker.checkCurrentOrgDev()
                .then(sessionUserService.getVisitorOrgMemberCache())
                .delayUntil(orgMember -> checkBundleNameUnique(bundle.getName(), orgMember.getUserId()))
                .delayUntil(orgMember -> {
                    String folderId = createBundleRequest.folderId();
                    if (StringUtils.isBlank(folderId)) {
                        return Mono.empty();
                    }
                    return folderApiService.checkFolderExist(folderId)
                            .flatMap(folder -> folderApiService.checkFolderCurrentOrg(folder, orgMember.getOrgId()));
                })
                .flatMap(orgMember -> {
                    bundle.setCreatedBy(orgMember.getUserId());
                    return bundleService.create(bundle);
                })
                .delayUntil(created -> autoGrantPermissionsByFolderDefault(created.getId(), createBundleRequest.folderId()))
                .delayUntil(created -> folderApiService.moveBundle(created.getId(),
                        createBundleRequest.folderId()))
                .flatMap(f -> buildBundleInfoView(f, true, true, createBundleRequest.folderId()));
    }

    private Mono<Void> autoGrantPermissionsByFolderDefault(String bundleId, @Nullable String folderId) {
        if (StringUtils.isBlank(folderId)) {
            return Mono.empty();
        }
        return folderApiService.getPermissions(folderId)
                .flatMapIterable(ApplicationPermissionView::getPermissions)
                .groupBy(PermissionItemView::getRole)
                .flatMap(sameRolePermissionItemViewFlux -> {
                    String role = sameRolePermissionItemViewFlux.key();
                    Flux<PermissionItemView> permissionItemViewFlux = sameRolePermissionItemViewFlux.cache();

                    Mono<List<String>> userIdsMono = permissionItemViewFlux
                            .filter(permissionItemView -> permissionItemView.getType() == ResourceHolder.USER)
                            .map(PermissionItemView::getId)
                            .collectList();

                    Mono<List<String>> groupIdsMono = permissionItemViewFlux
                            .filter(permissionItemView -> permissionItemView.getType() == ResourceHolder.GROUP)
                            .map(PermissionItemView::getId)
                            .collectList();

                    return Mono.zip(userIdsMono, groupIdsMono)
                            .flatMap(tuple -> {
                                List<String> userIds = tuple.getT1();
                                List<String> groupIds = tuple.getT2();
                                return resourcePermissionService.insertBatchPermission(ResourceType.BUNDLE, bundleId,
                                        new HashSet<>(userIds), new HashSet<>(groupIds),
                                        ResourceRole.fromValue(role));
                            });
                })
                .then();
    }

    @Override
    public Mono<Bundle> checkBundleExist(String bundleId) {
        return bundleService.findById(bundleId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new BizException(BUNDLE_NOT_EXIST, "BUNDLE_NOT_EXIST", bundleId))));
    }

    @Override
    public Mono<Void> checkBundleCurrentUser(Bundle bundle, String currentUserId) {
        if (currentUserId.equals(bundle.getCreatedBy())) {
            return Mono.empty();
        }
        return Mono.error(new BizException(BUNDLE_NOT_EXIST, "BUNDLE_NOT_EXIST", bundle.getId()));
    }

    private Mono<Void> checkBundleNameUnique(String name, String userId) {
        return bundleService.findByUserId(userId)
                .map(Bundle::getName)
                .collectList()
                .flatMap(list -> {
                    if (list.contains(name)) {
                        return Mono.error(new BizException(BizError.BUNDLE_NAME_CONFLICT, "BUNDLE_NAME_CONFLICT"));
                    }
                    return Mono.empty();
                });
    }

    /**
     * only bundle creator can delete a bundle
     */
    @Override
    public Mono<Bundle> delete(@Nonnull String bundleId) {
        return checkBundleStatus(bundleId, BundleStatus.RECYCLED)
                .then(updateBundleStatus(bundleId, BundleStatus.DELETED))
                .then(bundleService.findById(bundleId));
    }

    @Override
    public Mono<Boolean> recycle(String bundleId) {
        return checkBundleStatus(bundleId, NORMAL)
                .then(updateBundleStatus(bundleId, BundleStatus.RECYCLED));
    }

    @Override
    public Mono<Boolean> restore(String bundleId) {
        return checkBundleStatus(bundleId, BundleStatus.RECYCLED)
                .then(updateBundleStatus(bundleId, NORMAL));
    }

    @Override
    public Flux<BundleInfoView> getRecycledBundles() {
        return userHomeApiService.getAllAuthorisedBundles4CurrentOrgMember(BundleStatus.RECYCLED);
    }

    private Mono<Void> checkBundleStatus(String bundleId, BundleStatus expected) {
        return bundleService.findById(bundleId)
                .flatMap(bundle -> checkBundleStatus(bundle, expected));
    }

    private Mono<Void> checkBundleStatus(Bundle bundle, BundleStatus expected) {
        if (expected == bundle.getBundleStatus()) {
            return Mono.empty();
        }
        return Mono.error(new BizException(BizError.UNSUPPORTED_OPERATION, "BAD_REQUEST"));
    }

    private Mono<Boolean> updateBundleStatus(String bundleId, BundleStatus bundleStatus) {
        return checkCurrentUserBundlePermission(bundleId, MANAGE_BUNDLES)
                .then(Mono.defer(() -> {
                    Bundle bundle = Bundle.builder()
                            .bundleStatus(bundleStatus)
                            .build();
                    return bundleService.updateById(bundleId, bundle);
                }));
    }

    private Mono<Void> checkCurrentUserBundlePermission(String bundleId, ResourceAction action) {
        return sessionUserService.getVisitorId()
                .flatMap(userId -> resourcePermissionService.checkResourcePermissionWithError(userId, bundleId, action));
    }

    private Mono<Void> removePermissions(String bundleId) {
        return resourcePermissionService.getByResourceTypeAndResourceId(ResourceType.BUNDLE, bundleId)
                .flatMapIterable(Function.identity())
                .flatMap(resourcePermission -> resourcePermissionService.removeById(resourcePermission.getId()))
                .then();
    }

    @Override
    public Mono<BundleInfoView> update(Bundle bundle) {
        Bundle newBundle = new Bundle();
        newBundle.setName(bundle.getName());
        newBundle.setTitle(bundle.getTitle());
        newBundle.setCategory(bundle.getCategory());
        newBundle.setDescription(bundle.getDescription());
        newBundle.setImage(bundle.getImage());
        return checkManagePermission(bundle.getId())
                .then(bundleService.updateById(bundle.getId(), newBundle))
                .then(bundleService.findById(bundle.getId()))
                .flatMap(f -> buildBundleInfoView(f, true, true, null));
    }

    /**
     * @param applicationId app id to move
     * @param fromBundleId bundle id to remove app from
     * @param toBundleId bundle id to move app to
     */
    @Override
    public Mono<Void> moveApp(String applicationId, String fromBundleId, String toBundleId) {
        return sessionUserService.getVisitorId()
                // check permissions
                .delayUntil(userId -> resourcePermissionService.checkResourcePermissionWithError(userId, applicationId,
                        ResourceAction.MANAGE_APPLICATIONS))
                // remove old relations
                .then(bundleElementRelationService.deleteByBundleIdAndElementId(fromBundleId, applicationId))
                .flatMap(b -> {
                    if (StringUtils.isBlank(toBundleId)) {
                        return Mono.empty();
                    }
                    return bundleElementRelationService.create(toBundleId, applicationId);
                })
                .then();
    }

    /**
     * @param applicationId app id to add
     * @param toBundleId bundle id to add app to
     */
    @Override
    public Mono<Void> addApp(String applicationId, String toBundleId) {
        return sessionUserService.getVisitorId()
                // check permissions
                .delayUntil(userId -> resourcePermissionService.checkResourcePermissionWithError(userId, applicationId,
                        ResourceAction.MANAGE_APPLICATIONS))
                // remove old relations
                .then(bundleElementRelationService.deleteByBundleIdAndElementId(toBundleId, applicationId))
                .flatMap(b -> {
                    if (StringUtils.isBlank(toBundleId)) {
                        return Mono.empty();
                    }
                    return bundleElementRelationService.create(toBundleId, applicationId);
                })
                .then();
    }

    /**
     * Reorder the applications in bundle based on the position
     * @param bundleId id of the bundle to sort elements
     * @param elementIds ids of the elements in the bundle to sort
     * @return nothing
     */
    @Override
    public Mono<Void> reorder(String bundleId, List<String> elementIds) {
        return sessionUserService.getVisitorId()
                // check permissions
                .delayUntil(userId -> resourcePermissionService.checkResourcePermissionWithError(userId, bundleId,
                        MANAGE_BUNDLES))
                .flatMap(b -> Flux.fromIterable(elementIds)
                        .index() // This will provide a tuple of (index, elementId)
                        .flatMap(tuple -> {
                            long index = tuple.getT1();
                            String elementId = tuple.getT2();
                            return bundleElementRelationService.updateElementPos(bundleId, elementId, index);
                        })
                        .then())
                .then();
    }

    /**
     * get the sub elements of a bundle or root.
     *
     * @return flux of {@link ApplicationInfoView} or {@link BundleInfoView}
     */
    @Override
    public Flux<?> getElements(@Nullable String bundleId, @Nullable ApplicationType applicationType) {
        return buildApplicationInfoViewTree(applicationType)
                .flatMap(tree -> {
                    BundleNode<ApplicationInfoView, BundleInfoView> bundleNode = tree.get(bundleId);
                    if (bundleNode == null) {
                        return Mono.error(new BizException(BUNDLE_NOT_EXIST, "BUNDLE_NOT_EXIST", bundleId));
                    }
                    return Mono.just(bundleNode);
                })
                .zipWith(Mono.zip(sessionUserService.getVisitorOrgMemberCache(), orgDevChecker.isCurrentOrgDev()))
                .doOnNext(tuple -> {
                    BundleNode<ApplicationInfoView, BundleInfoView> node = tuple.getT1();
                    OrgMember orgMember = tuple.getT2().getT1();
                    boolean devOrAdmin = tuple.getT2().getT2();
                    // father bundle's visibility depends on child nodes
                    node.postOrderIterate(n -> {
                        if (n instanceof BundleNode<ApplicationInfoView, BundleInfoView> bundleNode) {
                            BundleInfoView bundleInfoView = bundleNode.getSelf();
                            if (bundleInfoView == null) {
                                return;
                            }
                            bundleInfoView.setManageable(orgMember.isAdmin() || orgMember.isSuperAdmin() ||  orgMember.getUserId().equals(bundleInfoView.getCreateBy()));
                            bundleInfoView.setSubApplications(bundleNode.getElementChildren());
                            bundleInfoView.setVisible(devOrAdmin || isNotEmpty(bundleInfoView.getSubApplications()));
                        }
                    });
                })
                .flatMapIterable(tuple -> tuple.getT1().getChildren())
                .map(node -> {
                    if (node instanceof ElementNode<ApplicationInfoView, BundleInfoView> elementNode) {
                        return elementNode.getSelf();
                    }
                    return ((BundleNode<ApplicationInfoView, BundleInfoView>) node).getSelf();
                });
    }

    private Mono<Tree<Object, Bundle>> buildBundleTree(String userId) {
        return bundleService.findByUserId(userId)
                .collectList()
                .map(bundles -> new Tree<>(bundles, Bundle::getId, __ -> null, Collections.emptyList(), null, null));
    }

    @Override
    public Mono<BundleInfoView> getPublishedBundle(String bundleId, BundleRequestType requestType) {
        return checkBundlePermissionWithReadableErrorMsg(bundleId, READ_BUNDLES, requestType)
                .zipWhen(permission -> bundleService.findById(bundleId)
                        .delayUntil(bundle -> checkBundleStatus(bundle, BundleStatus.NORMAL))
                        .delayUntil(bundle -> checkBundleViewRequest(bundle, requestType)))
                .map(tuple -> {
                    Bundle bundle = tuple.getT2();
                    return BundleInfoView.builder()
                            .bundleId(bundle.getId())
                            .name(bundle.getName())
                            .title(bundle.getTitle())
                            .category(bundle.getCategory())
                            .description(bundle.getDescription())
                            .image(bundle.getImage())
                            .publicToMarketplace(bundle.getPublicToMarketplace())
                            .publicToAll(bundle.getPublicToAll())
                            .agencyProfile(bundle.getAgencyProfile())
                            .createAt(bundle.getCreatedAt().toEpochMilli())
                            .createTime(bundle.getCreatedAt())
                            .createBy(bundle.getCreatedBy())
                            .build();
                });
    }

    private Mono<Void> checkBundleViewRequest(Bundle bundle, BundleRequestType expected) {

        // TODO: check bundle.isPublicToAll() from v2.4.0
        if (expected == BundleRequestType.PUBLIC_TO_ALL) {
            return Mono.empty();
        }

        // Falk: here is to check the ENV Variable LOWCODER_MARKETPLACE_PRIVATE_MODE
        // isPublicToMarketplace & isPublicToAll must be both true
        if (expected == BundleRequestType.PUBLIC_TO_MARKETPLACE && bundle.getPublicToMarketplace() && bundle.getPublicToAll()) {
            return Mono.empty();
        }

        //
        // Falk: bundle.agencyProfile() & isPublicToAll must be both true
        if (expected == BundleRequestType.AGENCY_PROFILE && bundle.getAgencyProfile() && bundle.getPublicToAll()) {
            return Mono.empty();
        }
        return Mono.error(new BizException(BizError.UNSUPPORTED_OPERATION, "BAD_REQUEST"));
    }

    @Override
    @Nonnull
    public Mono<ResourcePermission> checkBundlePermissionWithReadableErrorMsg(String bundleId, ResourceAction action, BundleRequestType requestType) {
        return sessionUserService.getVisitorId()
                .flatMap(visitorId -> resourcePermissionService.checkUserPermissionStatusOnBundle(visitorId, bundleId, action, requestType))
                .flatMap(permissionStatus -> {
                    if (!permissionStatus.hasPermission()) {
                        if (permissionStatus.failByAnonymousUser()) {
                            return ofError(USER_NOT_SIGNED_IN, "USER_NOT_SIGNED_IN");
                        }

                        if (permissionStatus.failByNotInOrg()) {
                            return ofError(NO_PERMISSION_TO_REQUEST_APP, "INSUFFICIENT_PERMISSION");
                        }

                        String messageKey = action == EDIT_BUNDLES ? "NO_PERMISSION_TO_EDIT" : "NO_PERMISSION_TO_VIEW";
                        return ofError(NO_PERMISSION_TO_REQUEST_APP, messageKey);
                    }
                    return Mono.just(permissionStatus.getPermission());
                });
    }

    private Mono<Tree<ApplicationInfoView, BundleInfoView>> buildApplicationInfoViewTree(@Nullable ApplicationType applicationType) {

        Mono<OrgMember> orgMemberMono = sessionUserService.getVisitorOrgMemberCache()
                .cache();

        Flux<ApplicationInfoView> applicationInfoViewFlux =
                userHomeApiService.getAllAuthorisedApplications4CurrentOrgMember(applicationType, ApplicationStatus.NORMAL, false)
                        .cache();

        Mono<Map<String, String>> application2BundleMapMono = applicationInfoViewFlux
                .map(ApplicationInfoView::getApplicationId)
                .collectList()
                .flatMapMany(applicationIds -> bundleElementRelationService.getByElementIds(applicationIds))
                .collectMap(BundleElement::elementId, BundleElement::bundleId);

        Flux<Bundle> bundleFlux = orgMemberMono.flatMapMany(orgMember -> bundleService.findByUserId(orgMember.getUserId()))
                .cache();

        Mono<Map<String, User>> userMapMono = bundleFlux
                .flatMap(bundle -> emptyIfNull(bundle.getCreatedBy()))
                .collectList()
                .flatMap(list -> userService.getByIds(list))
                .cache();

        Flux<BundleInfoView> bundleInfoViewFlux = bundleFlux
                .flatMap(bundle -> Mono.zip(orgMemberMono, userMapMono)
                        .map(tuple -> {
                            OrgMember orgMember = tuple.getT1();
                            Map<String, User> userMap = tuple.getT2();
                            User creator = userMap.get(bundle.getCreatedBy());
                            return BundleInfoView.builder()
                                    .userId(orgMember.getUserId())
                                    .bundleId(bundle.getId())
                                    .name(bundle.getName())
                                    .createAt(bundle.getCreatedAt().toEpochMilli())
                                    .createBy(creator == null ? null : creator.getName())
                                    .createTime(bundle.getCreatedAt())
                                    .build();
                        }));

        return Mono.zip(applicationInfoViewFlux.collectList(),
                        application2BundleMapMono,
                        bundleInfoViewFlux.collectList())
                .map(tuple -> {
                    List<ApplicationInfoView> applicationInfoViews = tuple.getT1();
                    Map<String, String> application2BundleMap = tuple.getT2();
                    List<BundleInfoView> bundleInfoViews = tuple.getT3();
                    return new Tree<>(bundleInfoViews,
                            BundleInfoView::getBundleId,
                            __ -> null,
                            applicationInfoViews,
                            application -> application2BundleMap.get(application.getApplicationId()),
                            DEFAULT_COMPARATOR);
                });
    }

    /**
     * only bundle creator has manage permissions
     */
    private Mono<OrgMember> checkManagePermission(String bundleId) {
        return sessionUserService.getVisitorOrgMemberCache()
                .flatMap(orgMember -> {
                    return isCreator(bundleId)
                            .flatMap(isCreator -> isCreator ? Mono.just(orgMember)
                                                            : ofError(BUNDLE_OPERATE_NO_PERMISSION, "BUNDLE_OPERATE_NO_PERMISSION"));
                });
    }

    private Mono<Boolean> isCreator(String bundleId) {
        return bundleService.findById(bundleId)
                .flatMap(bundle -> sessionUserService.getVisitorId().map(s -> s.equals(bundle.getCreatedBy())));
    }

    @Override
    public Mono<Void> grantPermission(String bundleId, Set<String> userIds, Set<String> groupIds, ResourceRole role) {
        if (CollectionUtils.isEmpty(userIds) && CollectionUtils.isEmpty(groupIds)) {
            return Mono.empty();
        }
        return Mono.from(checkManagePermission(bundleId))
                .then(checkBundleExist(bundleId))
                .then(Mono.defer(() -> resourcePermissionService.insertBatchPermission(ResourceType.BUNDLE, bundleId, userIds, groupIds, role)))
                .then();
    }

    @Override
    public Mono<Void> updatePermission(String bundleId, String permissionId, ResourceRole role) {
        return Mono.from(checkManagePermission(bundleId))
                .then(checkPermissionResource(permissionId, bundleId))
                .then(resourcePermissionService.updateRoleById(permissionId, role))
                .then();
    }

    @Override
    public Mono<Void> removePermission(String bundleId, String permissionId) {
        return Mono.from(checkManagePermission(bundleId))
                .then(checkPermissionResource(permissionId, bundleId))
                .then(resourcePermissionService.removeById(permissionId))
                .then();
    }

    private Mono<Void> checkPermissionResource(String permissionId, String bundleId) {
        return resourcePermissionService.getById(permissionId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new BizException(ILLEGAL_BUNDLE_PERMISSION_ID, "PERMISSION_NOT_EXIST"))))
                .flatMap(resourcePermission -> {
                    if (!bundleId.equals(resourcePermission.getResourceId())) {
                        return Mono.error(new BizException(ILLEGAL_BUNDLE_PERMISSION_ID, "NO_PERMISSION_TO_OPERATE_BUNDLE"));
                    }
                    return Mono.empty();
                })
                .then();
    }

    @Override
    public Mono<BundlePermissionView> getPermissions(String bundleId) {

        Mono<List<ResourcePermission>> bundlePermissions =
                resourcePermissionService.getByResourceTypeAndResourceId(ResourceType.BUNDLE, bundleId).cache();

        Mono<List<PermissionItemView>> groupPermissionPairsMono = bundlePermissions
                .flatMap(permissionHelper::getGroupPermissions);

        Mono<List<PermissionItemView>> userPermissionPairsMono = bundlePermissions
                .flatMap(permissionHelper::getUserPermissions);

        return bundleService.findById(bundleId)
                .flatMap(bundle -> {
                    Mono<Organization> orgMono = organizationService.getById(bundle.getCreatedBy());
                    return Mono.zip(groupPermissionPairsMono, userPermissionPairsMono, orgMono)
                            .map(tuple -> {
                                List<PermissionItemView> groupPermissionPairs = tuple.getT1();
                                List<PermissionItemView> userPermissionPairs = tuple.getT2();
                                Organization organization = tuple.getT3();
                                return BundlePermissionView.builder()
                                        .groupPermissions(groupPermissionPairs)
                                        .userPermissions(userPermissionPairs)
                                        .creatorId(bundle.getCreatedBy())
                                        .orgName(organization.getName())
                                        .build();
                            });
                });
    }

    @Override
    public Mono<BundleInfoView> buildBundleInfoView(Bundle bundle, boolean visible, boolean manageable, String folderId) {
        return userService.findById(bundle.getCreatedBy())
                .map(user -> BundleInfoView.builder()
                        .userId(bundle.getCreatedBy())
                        .bundleId(bundle.getId())
                        .title(bundle.getTitle())
                        .name(bundle.getName())
                        .description(bundle.getDescription())
                        .category(bundle.getCategory())
                        .image(bundle.getImage())
                        .createAt(bundle.getCreatedAt() == null ? 0 : bundle.getCreatedAt().toEpochMilli())
                        .createBy(user.getName())
                        .createTime(bundle.getCreatedAt())
                        .isVisible(visible)
                        .isManageable(manageable)
                        .folderId(folderId)
                        .publicToAll(bundle.getPublicToAll())
                        .publicToMarketplace(bundle.getPublicToMarketplace())
                        .agencyProfile(bundle.getAgencyProfile())
                        .build());
    }

    @Override
    public Mono<Boolean> setBundlePublicToAll(String bundleId, boolean publicToAll) {
        return checkCurrentUserBundlePermission(bundleId, ResourceAction.SET_APPLICATIONS_PUBLIC)
                .then(checkBundleStatus(bundleId, BundleStatus.NORMAL))
                .then(bundleService.setBundlePublicToAll(bundleId, publicToAll));
    }

    @Override
    public Mono<Boolean> setBundlePublicToMarketplace(String bundleId, BundleEndpoints.BundlePublicToMarketplaceRequest request) {
        return checkCurrentUserBundlePermission(bundleId, ResourceAction.SET_APPLICATIONS_PUBLIC_TO_MARKETPLACE)
                .then(checkBundleStatus(bundleId, BundleStatus.NORMAL))
                .then(bundleService.setBundlePublicToMarketplace
                        (bundleId, request.publicToMarketplace()));
    }

    // Falk: why we have request.publicToMarketplace() - but here only agencyProfile? Not from request?
    @Override
    public Mono<Boolean> setBundleAsAgencyProfile(String bundleId, boolean agencyProfile) {
        return checkCurrentUserBundlePermission(bundleId, ResourceAction.SET_APPLICATIONS_AS_AGENCY_PROFILE)
                .then(checkBundleStatus(bundleId, BundleStatus.NORMAL))
                .then(bundleService.setBundleAsAgencyProfile
                        (bundleId, agencyProfile));
    }
}
