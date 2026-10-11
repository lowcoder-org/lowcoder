package org.lowcoder.api.contract.support;

import org.lowcoder.api.application.ApplicationEndpoints.ApplicationAsAgencyProfileRequest;
import org.lowcoder.api.application.ApplicationEndpoints.ApplicationPublicToAllRequest;
import org.lowcoder.api.application.ApplicationEndpoints.ApplicationPublicToMarketplaceRequest;
import org.lowcoder.api.application.ApplicationEndpoints.BatchAddPermissionRequest;
import org.lowcoder.api.application.ApplicationEndpoints.UpdateEditStateRequest;
import org.lowcoder.api.application.ApplicationEndpoints.UpdatePermissionRequest;
import org.lowcoder.api.application.ApplicationHistorySnapshotEndpoints.ApplicationHistorySnapshotBriefInfo;
import org.lowcoder.api.application.ApplicationHistorySnapshotEndpoints.ApplicationHistorySnapshotRequest;
import org.lowcoder.api.application.view.ApplicationInfoView;
import org.lowcoder.api.application.view.ApplicationPermissionView;
import org.lowcoder.api.application.view.ApplicationPublishRequest;
import org.lowcoder.api.application.view.ApplicationRecordMetaView;
import org.lowcoder.api.application.view.ApplicationView;
import org.lowcoder.api.application.view.HistorySnapshotDslView;
import org.lowcoder.api.application.view.MarketplaceApplicationInfoView;
import org.lowcoder.api.home.FolderInfoView;
import org.lowcoder.api.home.UserHomepageView;
import org.lowcoder.api.permission.view.PermissionItemView;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.permission.model.ResourceHolder;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.query.model.ApplicationQuery;
import org.lowcoder.domain.query.model.BaseQuery;
import org.lowcoder.domain.query.model.LibraryQueryCombineId;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Samples of the application types (docs/API_PAYLOAD_TEST_PLAN.md §3.3, tasks T2.1 and T2.2), built without Jackson, with the
 * conventions of {@link PayloadSamples}: values unique per property ({@code "<Type>.<property>"}), {@code int} above
 * {@code Short.MAX_VALUE}, {@code long} above {@code Integer.MAX_VALUE}, instants with nanoseconds. Exceptions, each
 * because production reads the value: permission roles are real {@link ResourceRole} values, and the application DSL
 * uses the keys {@code ApplicationQuery} and {@code ApplicationUtil} read ({@code queries}, {@code compType},
 * {@code comp.appId}, {@code libraryQueryId}).
 */
public final class ApplicationSamples {

    /** A real role, so that {@code ResourceRole.fromValue} accepts it (the controllers reject others). */
    public static final String EDITOR_ROLE = ResourceRole.EDITOR.getValue();
    public static final String VIEWER_ROLE = ResourceRole.VIEWER.getValue();
    /** The {@code compType} whose {@code comp.appId} {@code ApplicationUtil#getDependentModulesFromDsl} collects. */
    public static final String MODULE_COMP_TYPE = "module";
    public static final String LIBRARY_QUERY_COMP_TYPE = "libraryQuery";

    /** When the brief-info sample's snapshot was created ({@link #applicationHistorySnapshotBriefInfo}). */
    public static final Instant SNAPSHOT_CREATED_AT = instant(80);

    /** When the record-meta sample's record was created ({@link #applicationRecordMetaView}). */
    public static final Instant RECORD_CREATED_AT = instant(90);

    private ApplicationSamples() {
    }

    static Instant instant(long secondsOffset) {
        return Instant.ofEpochSecond(1_767_225_600L + secondsOffset, 123_456_789L);
    }

    public static ApplicationInfoView applicationInfoView() {
        return applicationInfoView("ApplicationInfoView", 0);
    }

    /** {@code prefix} keeps the values of nested copies unique; {@code offset} varies the numbers. */
    static ApplicationInfoView applicationInfoView(String prefix, int offset) {
        return ApplicationInfoView.builder()
                .orgId(prefix + ".orgId")
                .applicationId(prefix + ".applicationId")
                .applicationGid(prefix + ".applicationGid")
                .name(prefix + ".name")
                .createAt(3_000_000_010L + offset)
                .createBy(prefix + ".createBy")
                .role(prefix + ".role")
                .applicationType(40_010 + offset)
                .applicationStatus(ApplicationStatus.RECYCLED)
                .containerSize(PayloadSamples.representativeObject())
                .folderId(prefix + ".folderId")
                .folderIdFrom(prefix + ".folderIdFrom")
                .lastViewTime(instant(10 + offset))
                .lastModifyTime(instant(11 + offset))
                .lastEditedAt(instant(12 + offset))
                .publicToAll(true)
                .publicToMarketplace(false)
                .agencyProfile(true)
                .editingUserId(prefix + ".editingUserId")
                .title(prefix + ".title")
                .description(prefix + ".description")
                .category(prefix + ".category")
                .icon(prefix + ".icon")
                .published(true)
                .publishedVersion(prefix + ".publishedVersion")
                .lastPublishedTime(instant(13 + offset))
                .build();
    }

    public static ApplicationView applicationView() {
        Map<String, Map<String, Object>> moduleDsl = new LinkedHashMap<>();
        moduleDsl.put("ApplicationView.moduleDSL.first", moduleDsl("ApplicationView.moduleDSL.first"));
        moduleDsl.put("ApplicationView.moduleDSL.second", moduleDsl("ApplicationView.moduleDSL.second"));
        Map<String, Object> orgCommonSettings = new LinkedHashMap<>();
        orgCommonSettings.put("themeId", "ApplicationView.orgCommonSettings.themeId");
        orgCommonSettings.put("maxRows", 40_020);
        return ApplicationView.builder()
                .applicationInfoView(applicationInfoView("ApplicationView.applicationInfoView", 100))
                .applicationDSL(applicationDsl("ApplicationView.applicationDSL"))
                .moduleDSL(moduleDsl)
                .orgCommonSettings(orgCommonSettings)
                .templateId("ApplicationView.templateId")
                .build();
    }

    private static Map<String, Object> moduleDsl(String prefix) {
        Map<String, Object> dsl = new LinkedHashMap<>();
        dsl.put("ui", prefix + ".ui");
        dsl.put("version", 40_021);
        return dsl;
    }

    public static MarketplaceApplicationInfoView marketplaceApplicationInfoView() {
        return marketplaceApplicationInfoView("MarketplaceApplicationInfoView", 0);
    }

    static MarketplaceApplicationInfoView marketplaceApplicationInfoView(String prefix, int offset) {
        return MarketplaceApplicationInfoView.builder()
                .title(prefix + ".title")
                .description(prefix + ".description")
                .category(prefix + ".category")
                .image(prefix + ".image")
                .orgId(prefix + ".orgId")
                .orgName(prefix + ".orgName")
                .creatorEmail(prefix + ".creatorEmail")
                .applicationId(prefix + ".applicationId")
                .name(prefix + ".name")
                .createAt(3_000_000_030L + offset)
                .createBy(prefix + ".createBy")
                .applicationType(40_030 + offset)
                .applicationStatus(ApplicationStatus.NORMAL)
                .build();
    }

    public static FolderInfoView folderInfoView() {
        FolderInfoView folder = folderInfoView("FolderInfoView", 0);
        folder.setSubFolders(new ArrayList<>(List.of(folderInfoView("FolderInfoView.subFolders[0]", 1),
                folderInfoView("FolderInfoView.subFolders[1]", 2))));
        folder.setSubApplications(new ArrayList<>(List.of(applicationInfoView("FolderInfoView.subApplications[0]", 200),
                applicationInfoView("FolderInfoView.subApplications[1]", 300))));
        return folder;
    }

    /** A folder without children; {@link #folderInfoView()} adds them to the top-level sample. */
    static FolderInfoView folderInfoView(String prefix, int offset) {
        FolderInfoView folder = FolderInfoView.builder()
                .orgId(prefix + ".orgId")
                .folderId(prefix + ".folderId")
                .folderGid(prefix + ".folderGid")
                .parentFolderId(prefix + ".parentFolderId")
                .parentFolderGid(prefix + ".parentFolderGid")
                .name(prefix + ".name")
                .title(prefix + ".title")
                .description(prefix + ".description")
                .category(prefix + ".category")
                .type(prefix + ".type")
                .image(prefix + ".image")
                .createAt(3_000_000_040L + offset)
                .createBy(prefix + ".createBy")
                .createTime(instant(40 + offset))
                .lastViewTime(instant(41 + offset))
                .build();
        folder.setVisible(true);
        folder.setManageable(false);
        return folder;
    }

    public static UserHomepageView userHomepageView() {
        UserHomepageView view = new UserHomepageView();
        view.setUser(UserSamples.user());
        view.setOrganization(OrganizationSamples.organization());
        view.setHomeApplicationViews(new ArrayList<>(List.of(applicationInfoView("UserHomepageView.homeApplicationViews[0]", 400),
                applicationInfoView("UserHomepageView.homeApplicationViews[1]", 500))));
        view.setFolderInfoViews(new ArrayList<>(List.of(folderInfoView("UserHomepageView.folderInfoViews[0]", 3),
                folderInfoView("UserHomepageView.folderInfoViews[1]", 4))));
        return view;
    }

    public static PermissionItemView permissionItemView() {
        return permissionItemView("PermissionItemView", ResourceHolder.USER);
    }

    static PermissionItemView permissionItemView(String prefix, ResourceHolder type) {
        return PermissionItemView.builder()
                .permissionId(prefix + ".permissionId")
                .type(type)
                .id(prefix + ".id")
                .avatar(prefix + ".avatar")
                .name(prefix + ".name")
                .role(prefix + ".role")
                .build();
    }

    public static ApplicationPermissionView applicationPermissionView() {
        return ApplicationPermissionView.builder()
                .orgName("ApplicationPermissionView.orgName")
                .groupPermissions(new ArrayList<>(List.of(permissionItemView("ApplicationPermissionView.groupPermissions[0]", ResourceHolder.GROUP),
                        permissionItemView("ApplicationPermissionView.groupPermissions[1]", ResourceHolder.GROUP))))
                .userPermissions(new ArrayList<>(List.of(permissionItemView("ApplicationPermissionView.userPermissions[0]", ResourceHolder.USER),
                        permissionItemView("ApplicationPermissionView.userPermissions[1]", ResourceHolder.USER))))
                .creatorId("ApplicationPermissionView.creatorId")
                .publicToAll(true)
                .publicToMarketplace(false)
                .agencyProfile(true)
                .build();
    }

    /**
     * {@code ApplicationEndpoints#update} and {@code #updateSlug}. {@code createdAt}, {@code updatedAt} and
     * {@code modifiedBy} are {@code @JsonIgnore}d in {@code HasIdAndAuditing} and stay unset.
     */
    public static Application application() {
        return Application.builder()
                .id("Application.id")
                .createdBy("Application.createdBy")
                .gid("Application.gid")
                .slug("Application.slug")
                .organizationId("Application.organizationId")
                .name("Application.name")
                .applicationType(40_050)
                .applicationStatus(ApplicationStatus.DELETED)
                .editingApplicationDSL(applicationDsl("Application.editingApplicationDSL"))
                .publicToAll(Boolean.TRUE)
                .publicToMarketplace(Boolean.FALSE)
                .agencyProfile(Boolean.TRUE)
                .editingUserId("Application.editingUserId")
                .lastEditedAt(instant(50))
                .build();
    }

    /**
     * A realistic application DSL (§3.3): a UI tree with two module components (so that
     * {@code Application#getEditingModules} has two elements) and two queries in the shape {@code ApplicationQuery}'s
     * creator reads, one of them a library query. Built as Jackson binds JSON into {@code Map<String, Object>}:
     * {@code LinkedHashMap} objects, {@code ArrayList} arrays, {@code Integer} numbers, {@code Double} decimals.
     */
    public static Map<String, Object> applicationDsl(String prefix) {
        List<Object> items = new ArrayList<>();
        items.add(component(MODULE_COMP_TYPE, map("appId", prefix + ".ui.items[0].comp.appId", "height", 40_060)));
        items.add(component(MODULE_COMP_TYPE, map("appId", prefix + ".ui.items[1].comp.appId", "height", 40_061)));
        items.add(component("text", map("text", prefix + ".ui.items[2].comp.text", "hidden", Boolean.FALSE)));
        Map<String, Object> ui = component("normal", map("title", prefix + ".ui.comp.title", "width", PayloadSamples.DSL_DECIMAL));
        ui.put("items", items);
        List<Object> queries = new ArrayList<>();
        queries.add(dslQuery(prefix + ".queries[0]", "restApi", map("method", prefix + ".queries[0].comp.method",
                "path", prefix + ".queries[0].comp.path")));
        queries.add(dslQuery(prefix + ".queries[1]", LIBRARY_QUERY_COMP_TYPE, map("libraryQueryId",
                prefix + ".queries[1].comp.libraryQueryId", "libraryQueryRecordId", prefix + ".queries[1].comp.libraryQueryRecordId")));
        Map<String, Object> dsl = new LinkedHashMap<>();
        dsl.put("ui", ui);
        dsl.put("queries", queries);
        dsl.put("settings", map("title", prefix + ".settings.title", "maxWidth", 40_062));
        return dsl;
    }

    private static Map<String, Object> component(String compType, Map<String, Object> comp) {
        return map("compType", compType, "comp", comp);
    }

    /** A two-entry {@code LinkedHashMap}, as Jackson binds a JSON object. */
    static Map<String, Object> map(String key1, Object value1, String key2, Object value2) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put(key1, value1);
        map.put(key2, value2);
        return map;
    }

    private static Map<String, Object> dslQuery(String prefix, String compType, Map<String, Object> comp) {
        Map<String, Object> query = new LinkedHashMap<>();
        query.put("id", prefix + ".id");
        query.put("gid", prefix + ".gid");
        query.put("name", prefix + ".name");
        query.put("datasourceId", prefix + ".datasourceId");
        query.put("comp", comp);
        query.put("triggerType", prefix + ".triggerType");
        query.put("timeout", prefix + ".timeout");
        query.put("compType", compType);
        return query;
    }

    public static ApplicationQuery applicationQuery() {
        Map<String, Object> comp = new LinkedHashMap<>();
        comp.put("libraryQueryId", "ApplicationQuery.comp.libraryQueryId");
        comp.put("libraryQueryRecordId", "ApplicationQuery.comp.libraryQueryRecordId");
        return new ApplicationQuery("ApplicationQuery.id", "ApplicationQuery.gid", "ApplicationQuery.name",
                "ApplicationQuery.datasourceId", comp, "ApplicationQuery.triggerType", "ApplicationQuery.timeout", LIBRARY_QUERY_COMP_TYPE);
    }

    public static BaseQuery baseQuery() {
        Map<String, Object> comp = new LinkedHashMap<>();
        comp.put("sql", "BaseQuery.comp.sql");
        comp.put("limit", 40_070);
        return BaseQuery.builder()
                .datasourceId("BaseQuery.datasourceId")
                .queryConfig(comp)
                .compType("BaseQuery.compType")
                .timeoutStr("BaseQuery.timeout")
                .build();
    }

    public static LibraryQueryCombineId libraryQueryCombineId() {
        return new LibraryQueryCombineId("LibraryQueryCombineId.libraryQueryId", "LibraryQueryCombineId.libraryQueryRecordId");
    }

    /** {@code ApplicationHistorySnapshotEndpoints#create} (task T2.2): a snapshot of a full DSL with its editing context. */
    public static ApplicationHistorySnapshotRequest applicationHistorySnapshotRequest() {
        return new ApplicationHistorySnapshotRequest("ApplicationHistorySnapshotRequest.applicationId",
                applicationDsl("ApplicationHistorySnapshotRequest.dsl"), snapshotContext("ApplicationHistorySnapshotRequest.context"));
    }

    /**
     * {@code getHistorySnapshotDsl}: the snapshot's DSL and the live DSL of each module it uses, by application id. The
     * endpoint test builds its stubs from this sample, so the view the controller assembles is this one.
     */
    public static HistorySnapshotDslView historySnapshotDslView() {
        Map<String, Map<String, Object>> moduleDsl = new LinkedHashMap<>();
        moduleDsl.put("HistorySnapshotDslView.moduleDSL.first", moduleDsl("HistorySnapshotDslView.moduleDSL.first"));
        moduleDsl.put("HistorySnapshotDslView.moduleDSL.second", moduleDsl("HistorySnapshotDslView.moduleDSL.second"));
        return HistorySnapshotDslView.builder()
                .applicationsDsl(applicationDsl("HistorySnapshotDslView.applicationsDsl"))
                .moduleDSL(moduleDsl)
                .build();
    }

    /**
     * The concrete element of {@code listAllHistorySnapshotBriefInfo}'s {@code "list"} (Appendix A). {@code createTime}
     * is epoch milliseconds, as the controller computes it from the snapshot's {@code createdAt}.
     */
    public static ApplicationHistorySnapshotBriefInfo applicationHistorySnapshotBriefInfo() {
        return new ApplicationHistorySnapshotBriefInfo("ApplicationHistorySnapshotBriefInfo.snapshotId",
                snapshotContext("ApplicationHistorySnapshotBriefInfo.context"), "ApplicationHistorySnapshotBriefInfo.userId",
                "ApplicationHistorySnapshotBriefInfo.userName", "ApplicationHistorySnapshotBriefInfo.userAvatar",
                SNAPSHOT_CREATED_AT.toEpochMilli());
    }

    /**
     * An element of {@code ApplicationRecordEndpoints#getByApplicationId} (task T2.3), with its creator's name.
     * {@code createTime} is epoch milliseconds, as {@code ApplicationRecordMetaView#from} computes it from the record's
     * {@code createdAt}.
     */
    public static ApplicationRecordMetaView applicationRecordMetaView() {
        return new ApplicationRecordMetaView("ApplicationRecordMetaView.id", "ApplicationRecordMetaView.applicationId",
                "ApplicationRecordMetaView.tag", "ApplicationRecordMetaView.commitMessage", RECORD_CREATED_AT.toEpochMilli(),
                "ApplicationRecordMetaView.creatorName");
    }

    /** The editing context the editor stores with a snapshot: the operation and the components it touched. */
    private static Map<String, Object> snapshotContext(String prefix) {
        return map("operations", new ArrayList<>(List.of(map("type", prefix + ".operations[0].type", "compName", prefix + ".operations[0].compName"),
                map("type", prefix + ".operations[1].type", "compName", prefix + ".operations[1].compName"))), "version", 40_080);
    }

    public static ApplicationPublishRequest applicationPublishRequest() {
        return new ApplicationPublishRequest("ApplicationPublishRequest.commitMessage", "ApplicationPublishRequest.tag");
    }

    public static BatchAddPermissionRequest batchAddPermissionRequest() {
        return new BatchAddPermissionRequest(EDITOR_ROLE,
                new HashSet<>(List.of("BatchAddPermissionRequest.userIds[0]", "BatchAddPermissionRequest.userIds[1]")),
                new HashSet<>(List.of("BatchAddPermissionRequest.groupIds[0]", "BatchAddPermissionRequest.groupIds[1]")));
    }

    public static UpdatePermissionRequest updatePermissionRequest() {
        return new UpdatePermissionRequest(VIEWER_ROLE);
    }

    public static ApplicationPublicToAllRequest applicationPublicToAllRequest() {
        return new ApplicationPublicToAllRequest(Boolean.TRUE);
    }

    public static ApplicationPublicToMarketplaceRequest applicationPublicToMarketplaceRequest() {
        return new ApplicationPublicToMarketplaceRequest(Boolean.FALSE);
    }

    public static ApplicationAsAgencyProfileRequest applicationAsAgencyProfileRequest() {
        return new ApplicationAsAgencyProfileRequest(Boolean.TRUE);
    }

    public static UpdateEditStateRequest updateEditStateRequest() {
        return new UpdateEditStateRequest(Boolean.FALSE);
    }
}
