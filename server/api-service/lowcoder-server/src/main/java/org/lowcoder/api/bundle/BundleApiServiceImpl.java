package org.lowcoder.api.bundle;

import jakarta.annotation.Nonnull;
import jakarta.annotation.Nullable;
import lombok.RequiredArgsConstructor;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.api.application.view.ApplicationInfoView;
import org.lowcoder.api.application.view.ApplicationPermissionView;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.home.UserHomeApiService;
import org.lowcoder.api.permission.PermissionHelper;
import org.lowcoder.api.permission.view.PermissionItemView;
import org.lowcoder.api.usermanagement.OrgDevChecker;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.model.ApplicationType;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.bundle.service.BundleElementRelationService;
import org.lowcoder.domain.bundle.service.BundleNode;
import org.lowcoder.domain.bundle.service.BundleService;
import org.lowcoder.domain.bundle.model.BundleElement;
import org.lowcoder.domain.bundle.service.*;
import org.lowcoder.domain.group.service.GroupService;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.permission.model.ResourceAction;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.model.ResourceType;
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
                            return elementNode.getSelf().getLastViewTime();
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

    @Override
    public Mono<BundleInfoView> create(Bundle bundle) {
        if (StringUtils.isBlank(bundle.getName())) {
            return Mono.error(new BizException(BizError.INVALID_PARAMETER, "BUNDLE_NAME_EMPTY"));
        }
        return orgDevChecker.checkCurrentOrgDev()
                .then(sessionUserService.getVisitorOrgMemberCache())
                .delayUntil(orgMember -> checkBundleNameUnique(bundle.getName(), orgMember.getUserId()))
                .flatMap(orgMember -> {
                    bundle.setUserId(orgMember.getUserId());
                    bundle.setCreatedBy(orgMember.getUserId());
                    return bundleService.create(bundle);
                })
                .flatMap(f -> buildBundleInfoView(f, true, true));
    }

    @Override
    public Mono<Bundle> checkBundleExist(String bundleId) {
        return bundleService.findById(bundleId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new BizException(BUNDLE_NOT_EXIST, "BUNDLE_NOT_EXIST", bundleId))));
    }

    @Override
    public Mono<Void> checkBundleCurrentUser(Bundle bundle, String currentUserId) {
        if (currentUserId.equals(bundle.getUserId())) {
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
     * only org admin and bundle creator can delete a bundle, when bundle is deleted,
     * all sub bundles will be deleted, all sub files will be moved to root bundle
     */
    @Override
    public Mono<Bundle> delete(@Nonnull String bundleId) {
        return checkManagePermission(bundleId)
                .flatMap(orgMember -> buildBundleTree(orgMember.getOrgId()))
                .flatMap(tree -> {
                    BundleNode<Object, Bundle> bundleNode = tree.get(bundleId);
                    if (bundleNode == null) {
                        return Mono.error(new BizException(BUNDLE_NOT_EXIST, "BUNDLE_NOT_EXIST", bundleId));
                    }
                    @SuppressWarnings("ConstantConditions")
                    List<String> bundleIds = bundleNode.getAllBundleChildren().stream().map(Bundle::getId).toList();
                    List<String> all = new ArrayList<>(bundleIds);
                    all.add(bundleId);

                    return bundleService.deleteAllById(all)
                            .then(removePermissions(bundleId))
                            .then(bundleElementRelationService.deleteByBundleIds(all))
                            .thenReturn(bundleNode.getSelf());
                });
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
        newBundle.setType(bundle.getType());
        newBundle.setCategory(bundle.getCategory());
        newBundle.setDescription(bundle.getDescription());
        newBundle.setImage(bundle.getImage());
        return checkManagePermission(bundle.getId())
                .then(bundleService.updateById(bundle.getId(), newBundle))
                .then(bundleService.findById(bundle.getId()))
                .flatMap(f -> buildBundleInfoView(f, true, true));
    }

    /**
     * @param targetBundleId null means root bundle
     */
    @Override
    public Mono<Void> move(String applicationLikeId, @Nullable String targetBundleId) {
        return sessionUserService.getVisitorId()
                // check permissions
                .delayUntil(userId -> resourcePermissionService.checkResourcePermissionWithError(userId, applicationLikeId,
                        ResourceAction.MANAGE_APPLICATIONS))
                // remove old relations
                .then(bundleElementRelationService.deleteByElementId(applicationLikeId))
                .flatMap(b -> {
                    if (StringUtils.isBlank(targetBundleId)) {
                        return Mono.empty();
                    }
                    return bundleElementRelationService.create(targetBundleId, applicationLikeId);
                })
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

                            List<BundleInfoView> bundleInfoViews = bundleNode.getBundleChildren().stream().filter(BundleInfoView::isVisible).toList();
                            bundleInfoView.setSubBundles(bundleInfoViews);
                            bundleInfoView.setSubApplications(bundleNode.getElementChildren());
                            bundleInfoView.setVisible(devOrAdmin || isNotEmpty(bundleInfoViews) || isNotEmpty(bundleInfoView.getSubApplications()));
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
     * only org admin and bundle creator has manage permissions
     */
    private Mono<OrgMember> checkManagePermission(String bundleId) {
        return sessionUserService.getVisitorOrgMemberCache()
                .flatMap(orgMember -> {
                    if (orgMember.isAdmin() || orgMember.isSuperAdmin()) {
                        return Mono.just(orgMember);
                    }
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
    public Mono<ApplicationPermissionView> getPermissions(String bundleId) {

        Mono<List<ResourcePermission>> bundlePermissions =
                resourcePermissionService.getByResourceTypeAndResourceId(ResourceType.BUNDLE, bundleId).cache();

        Mono<List<PermissionItemView>> groupPermissionPairsMono = bundlePermissions
                .flatMap(permissionHelper::getGroupPermissions);

        Mono<List<PermissionItemView>> userPermissionPairsMono = bundlePermissions
                .flatMap(permissionHelper::getUserPermissions);

        return bundleService.findById(bundleId)
                .flatMap(bundle -> {
                    Mono<Organization> orgMono = organizationService.getById(bundle.getUserId());
                    return Mono.zip(groupPermissionPairsMono, userPermissionPairsMono, orgMono)
                            .map(tuple -> {
                                List<PermissionItemView> groupPermissionPairs = tuple.getT1();
                                List<PermissionItemView> userPermissionPairs = tuple.getT2();
                                Organization organization = tuple.getT3();
                                return ApplicationPermissionView.builder()
                                        .groupPermissions(groupPermissionPairs)
                                        .userPermissions(userPermissionPairs)
                                        .creatorId(bundle.getCreatedBy())
                                        .orgName(organization.getName())
                                        .build();
                            });
                });
    }

    @Override
    public Mono<BundleInfoView> buildBundleInfoView(Bundle bundle, boolean visible, boolean manageable) {
        return userService.findById(bundle.getCreatedBy())
                .map(user -> BundleInfoView.builder()
                        .userId(bundle.getUserId())
                        .bundleId(bundle.getId())
                        .name(bundle.getName())
                        .description(bundle.getDescription())
                        .category(bundle.getCategory())
                        .type(bundle.getType())
                        .image(bundle.getImage())
                        .createAt(bundle.getCreatedAt() == null ? 0 : bundle.getCreatedAt().toEpochMilli())
                        .createBy(user.getName())
                        .createTime(bundle.getCreatedAt())
                        .isVisible(visible)
                        .isManageable(manageable)
                        .build());
    }
}
