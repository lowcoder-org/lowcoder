package org.lowcoder.api.contract.support;

import org.lowcoder.api.bundle.BundleEndpoints.BatchAddPermissionRequest;
import org.lowcoder.api.bundle.BundleEndpoints.BundleAsAgencyProfileRequest;
import org.lowcoder.api.bundle.BundleEndpoints.BundlePublicToAllRequest;
import org.lowcoder.api.bundle.BundleEndpoints.BundlePublicToMarketplaceRequest;
import org.lowcoder.api.bundle.BundleEndpoints.CreateBundleRequest;
import org.lowcoder.api.bundle.BundleEndpoints.UpdatePermissionRequest;
import org.lowcoder.api.bundle.view.BundleInfoView;
import org.lowcoder.api.bundle.view.BundlePermissionView;
import org.lowcoder.api.bundle.view.MarketplaceBundleInfoView;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.bundle.model.BundleApplication;
import org.lowcoder.domain.bundle.model.BundleStatus;
import org.lowcoder.domain.permission.model.ResourceHolder;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

/**
 * Samples of the bundle types (docs/API_PAYLOAD_TEST_PLAN.md §3.3, task T3.1), with the conventions of
 * {@link PayloadSamples}. Permission roles are real {@code ResourceRole} values ({@link ApplicationSamples#EDITOR_ROLE},
 * {@link ApplicationSamples#VIEWER_ROLE}), because {@code BundleController} rejects others.
 */
public final class BundleSamples {

    /** The position of the {@link #bundleApplication()} sample: above {@code Integer.MAX_VALUE}, as the field is a {@code long}. */
    public static final long BUNDLE_APPLICATION_POSITION = 3_000_000_210L;

    private BundleSamples() {
    }

    /** {@code BundleEndpoints#create}; {@code organizationId} is named {@code orgId} in JSON. */
    public static CreateBundleRequest createBundleRequest() {
        return new CreateBundleRequest("CreateBundleRequest.organizationId", "CreateBundleRequest.gid", "CreateBundleRequest.name",
                "CreateBundleRequest.title", "CreateBundleRequest.description", "CreateBundleRequest.category",
                "CreateBundleRequest.image", "CreateBundleRequest.folderId");
    }

    public static BatchAddPermissionRequest batchAddPermissionRequest() {
        return new BatchAddPermissionRequest(ApplicationSamples.EDITOR_ROLE,
                new HashSet<>(List.of("BundleEndpoints.BatchAddPermissionRequest.userIds[0]", "BundleEndpoints.BatchAddPermissionRequest.userIds[1]")),
                new HashSet<>(List.of("BundleEndpoints.BatchAddPermissionRequest.groupIds[0]", "BundleEndpoints.BatchAddPermissionRequest.groupIds[1]")));
    }

    public static UpdatePermissionRequest updatePermissionRequest() {
        return new UpdatePermissionRequest(ApplicationSamples.VIEWER_ROLE);
    }

    public static BundlePublicToAllRequest bundlePublicToAllRequest() {
        return new BundlePublicToAllRequest(Boolean.TRUE);
    }

    public static BundlePublicToMarketplaceRequest bundlePublicToMarketplaceRequest() {
        return new BundlePublicToMarketplaceRequest(Boolean.TRUE);
    }

    public static BundleAsAgencyProfileRequest bundleAsAgencyProfileRequest() {
        return new BundleAsAgencyProfileRequest(Boolean.TRUE);
    }

    /**
     * {@code BundleEndpoints#update}. {@code createdAt}, {@code updatedAt} and {@code modifiedBy} are
     * {@code @JsonIgnore}d in {@code HasIdAndAuditing} and stay unset.
     */
    public static Bundle bundle() {
        return Bundle.builder()
                .id("Bundle.id")
                .createdBy("Bundle.createdBy")
                .gid("Bundle.gid")
                .organizationId("Bundle.organizationId")
                .name("Bundle.name")
                .title("Bundle.title")
                .description("Bundle.description")
                .category("Bundle.category")
                .image("Bundle.image")
                .bundleStatus(BundleStatus.RECYCLED)
                .publicToAll(Boolean.TRUE)
                .publicToMarketplace(Boolean.FALSE)
                .agencyProfile(Boolean.TRUE)
                .editingBundleDSL(bundleDsl("Bundle.editingBundleDSL"))
                .publishedBundleDSL(bundleDsl("Bundle.publishedBundleDSL"))
                .build();
    }

    public static BundleInfoView bundleInfoView() {
        BundleInfoView view = BundleInfoView.builder()
                .userId("BundleInfoView.userId")
                .bundleId("BundleInfoView.bundleId")
                .bundleGid("BundleInfoView.bundleGid")
                .name("BundleInfoView.name")
                .title("BundleInfoView.title")
                .description("BundleInfoView.description")
                .category("BundleInfoView.category")
                .image("BundleInfoView.image")
                .createAt(3_000_000_200L)
                .createBy("BundleInfoView.createBy")
                .folderId("BundleInfoView.folderId")
                .folderIdFrom("BundleInfoView.folderIdFrom")
                .publicToAll(Boolean.TRUE)
                .publicToMarketplace(Boolean.FALSE)
                .agencyProfile(Boolean.TRUE)
                .editingBundleDSL(bundleDsl("BundleInfoView.editingBundleDSL"))
                .publishedBundleDSL(bundleDsl("BundleInfoView.publishedBundleDSL"))
                .createTime(ApplicationSamples.instant(200))
                .build();
        view.setVisible(true);
        view.setManageable(false);
        return view;
    }

    public static BundlePermissionView bundlePermissionView() {
        return BundlePermissionView.builder()
                .orgName("BundlePermissionView.orgName")
                .groupPermissions(new ArrayList<>(List.of(ApplicationSamples.permissionItemView("BundlePermissionView.groupPermissions[0]", ResourceHolder.GROUP),
                        ApplicationSamples.permissionItemView("BundlePermissionView.groupPermissions[1]", ResourceHolder.GROUP))))
                .userPermissions(new ArrayList<>(List.of(ApplicationSamples.permissionItemView("BundlePermissionView.userPermissions[0]", ResourceHolder.USER),
                        ApplicationSamples.permissionItemView("BundlePermissionView.userPermissions[1]", ResourceHolder.USER))))
                .creatorId("BundlePermissionView.creatorId")
                .publicToAll(true)
                .publicToMarketplace(false)
                .agencyProfile(true)
                .build();
    }

    public static MarketplaceBundleInfoView marketplaceBundleInfoView() {
        return MarketplaceBundleInfoView.builder()
                .title("MarketplaceBundleInfoView.title")
                .description("MarketplaceBundleInfoView.description")
                .category("MarketplaceBundleInfoView.category")
                .image("MarketplaceBundleInfoView.image")
                .orgId("MarketplaceBundleInfoView.orgId")
                .orgName("MarketplaceBundleInfoView.orgName")
                .creatorEmail("MarketplaceBundleInfoView.creatorEmail")
                .bundleId("MarketplaceBundleInfoView.bundleId")
                .bundleGid("MarketplaceBundleInfoView.bundleGid")
                .name("MarketplaceBundleInfoView.name")
                .createAt(3_000_000_220L)
                .createBy("MarketplaceBundleInfoView.createBy")
                .bundleStatus(BundleStatus.NORMAL)
                .build();
    }

    /**
     * The concrete element of {@code getElements}' page (Appendix A): {@code BundleApiServiceImpl#getElements} pairs each
     * application with its position in the bundle.
     */
    public static BundleApplication bundleApplication() {
        return new BundleApplication(ApplicationSamples.application(), BUNDLE_APPLICATION_POSITION);
    }

    /**
     * A bundle DSL as the editor stores it: the layout of the bundle's applications, bound as Jackson binds JSON into
     * {@code Map<String, Object>} ({@code LinkedHashMap}, {@code ArrayList}, {@code Integer}, {@code Double}).
     */
    static Map<String, Object> bundleDsl(String prefix) {
        List<Object> items = new ArrayList<>(List.of(
                ApplicationSamples.map("appId", prefix + ".layout.items[0].appId", "order", 40_200),
                ApplicationSamples.map("appId", prefix + ".layout.items[1].appId", "order", 40_201)));
        Map<String, Object> layout = ApplicationSamples.map("items", items, "width", PayloadSamples.DSL_DECIMAL);
        return ApplicationSamples.map("layout", layout, "settings", ApplicationSamples.map("title", prefix + ".settings.title", "maxWidth", 40_202));
    }
}
