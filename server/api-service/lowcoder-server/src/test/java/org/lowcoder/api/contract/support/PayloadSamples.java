package org.lowcoder.api.contract.support;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JavaType;
import org.lowcoder.api.application.ApplicationEndpoints.ApplicationAsAgencyProfileRequest;
import org.lowcoder.api.application.ApplicationEndpoints.ApplicationPublicToAllRequest;
import org.lowcoder.api.application.ApplicationEndpoints.ApplicationPublicToMarketplaceRequest;
import org.lowcoder.api.application.ApplicationEndpoints.BatchAddPermissionRequest;
import org.lowcoder.api.application.ApplicationEndpoints.CreateApplicationRequest;
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
import org.lowcoder.api.authentication.AuthenticationEndpoints.FormLoginRequest;
import org.lowcoder.api.authentication.dto.APIKeyRequest;
import org.lowcoder.api.authentication.dto.AuthConfigRequest;
import org.lowcoder.api.authentication.dto.RedirectView;
import org.lowcoder.api.bundle.BundleEndpoints;
import org.lowcoder.api.bundle.BundleEndpoints.BundleAsAgencyProfileRequest;
import org.lowcoder.api.bundle.BundleEndpoints.BundlePublicToAllRequest;
import org.lowcoder.api.bundle.BundleEndpoints.BundlePublicToMarketplaceRequest;
import org.lowcoder.api.bundle.BundleEndpoints.CreateBundleRequest;
import org.lowcoder.api.bundle.view.BundleInfoView;
import org.lowcoder.api.bundle.view.BundlePermissionView;
import org.lowcoder.api.bundle.view.MarketplaceBundleInfoView;
import org.lowcoder.api.config.ConfigEndpoints.UpdateConfigRequest;
import org.lowcoder.api.config.ConfigView;
import org.lowcoder.api.contract.support.PayloadTypeWalker.Direction;
import org.lowcoder.api.datasource.DatasourceEndpoints;
import org.lowcoder.api.datasource.DatasourceView;
import org.lowcoder.api.datasource.UpsertDatasourceRequest;
import org.lowcoder.api.home.FolderEndpoints;
import org.lowcoder.api.home.FolderInfoView;
import org.lowcoder.api.home.UserHomepageView;
import org.lowcoder.api.material.MaterialEndpoints.MaterialView;
import org.lowcoder.api.material.MaterialEndpoints.UploadMaterialRequestDTO;
import org.lowcoder.api.meta.MetaEndpoints.GetMetaDataRequest;
import org.lowcoder.api.meta.view.ApplicationMetaView;
import org.lowcoder.api.meta.view.BundleMetaView;
import org.lowcoder.api.meta.view.DatasourceMetaView;
import org.lowcoder.api.meta.view.FolderMetaView;
import org.lowcoder.api.meta.view.GroupMetaView;
import org.lowcoder.api.meta.view.MetaView;
import org.lowcoder.api.meta.view.OrgMetaView;
import org.lowcoder.api.meta.view.UserMetaView;
import org.lowcoder.api.misc.ApiFlowEndpoints.FlowRequest;
import org.lowcoder.api.misc.JsLibraryController.JsLibraryMeta;
import org.lowcoder.api.permission.view.CommonPermissionView;
import org.lowcoder.api.permission.view.PermissionItemView;
import org.lowcoder.api.query.view.LibraryQueryAggregateView;
import org.lowcoder.api.query.view.LibraryQueryMetaView;
import org.lowcoder.api.query.view.LibraryQueryPublishRequest;
import org.lowcoder.api.query.view.LibraryQueryRecordMetaView;
import org.lowcoder.api.query.view.LibraryQueryRequestFromJs;
import org.lowcoder.api.query.view.LibraryQueryView;
import org.lowcoder.api.query.view.QueryExecutionRequest;
import org.lowcoder.api.query.view.QueryResultView;
import org.lowcoder.api.query.view.UpsertLibraryQueryRequest;
import org.lowcoder.api.usermanagement.InvitationEndpoints.InviteEmailRequest;
import org.lowcoder.api.usermanagement.OrganizationEndpoints.UpdateOrgCommonSettingsRequest;
import org.lowcoder.api.usermanagement.UserEndpoints.CreateUserRequest;
import org.lowcoder.api.usermanagement.UserEndpoints.LostPasswordRequest;
import org.lowcoder.api.usermanagement.UserEndpoints.MarkUserStatusRequest;
import org.lowcoder.api.usermanagement.UserEndpoints.ResetLostPasswordRequest;
import org.lowcoder.api.usermanagement.UserEndpoints.ResetPasswordRequest;
import org.lowcoder.api.usermanagement.UserEndpoints.UpdatePasswordRequest;
import org.lowcoder.api.usermanagement.view.APIKeyVO;
import org.lowcoder.api.usermanagement.view.AddMemberRequest;
import org.lowcoder.api.usermanagement.view.CreateGroupRequest;
import org.lowcoder.api.usermanagement.view.GroupMemberAggregateView;
import org.lowcoder.api.usermanagement.view.GroupMemberView;
import org.lowcoder.api.usermanagement.view.GroupView;
import org.lowcoder.api.usermanagement.view.InvitationVO;
import org.lowcoder.api.usermanagement.view.OrgAndVisitorRoleView;
import org.lowcoder.api.usermanagement.view.OrgMemberListView;
import org.lowcoder.api.usermanagement.view.OrgMemberListView.OrgMemberView;
import org.lowcoder.api.usermanagement.view.OrgView;
import org.lowcoder.api.usermanagement.view.UpdateGroupRequest;
import org.lowcoder.api.usermanagement.view.UpdateOrgRequest;
import org.lowcoder.api.usermanagement.view.UpdateRoleRequest;
import org.lowcoder.api.usermanagement.view.UpdateUserRequest;
import org.lowcoder.api.usermanagement.view.UserProfileView;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.bundle.model.BundleApplication;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.folder.model.Folder;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.Organization.OrganizationCommonSettings;
import org.lowcoder.domain.organization.model.OrganizationDomain;
import org.lowcoder.domain.plugin.DatasourceMetaInfo;
import org.lowcoder.domain.plugin.client.dto.GetPluginDynamicConfigRequestDTO;
import org.lowcoder.domain.query.model.ApplicationQuery;
import org.lowcoder.domain.query.model.BaseQuery;
import org.lowcoder.domain.query.model.LibraryQuery;
import org.lowcoder.domain.query.model.LibraryQueryCombineId;
import org.lowcoder.domain.user.model.APIKey;
import org.lowcoder.domain.user.model.Connection;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.model.UserDetail;
import org.lowcoder.domain.user.model.User.TransformedUserInfo;
import org.lowcoder.infra.config.model.ServerConfig;
import org.lowcoder.sdk.auth.EmailAuthConfig;
import org.lowcoder.sdk.auth.Oauth2GenericAuthConfig;
import org.lowcoder.sdk.auth.Oauth2KeycloakAuthConfig;
import org.lowcoder.sdk.auth.Oauth2OryAuthConfig;
import org.lowcoder.sdk.auth.Oauth2SimpleAuthConfig;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.lowcoder.sdk.models.DatasourceStructure.Column;
import org.lowcoder.sdk.models.DatasourceStructure.Table;
import org.lowcoder.sdk.models.Param;
import org.lowcoder.sdk.util.JsonUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * The hand-written payload samples of docs/API_PAYLOAD_TEST_PLAN.md §3.3: one factory per type, built without
 * Jackson, with values that are deterministic and unique per property ({@code "Folder.name"}) and numbers that tell
 * {@code int}, {@code long} and decimals apart. A sample of a request type is the object its {@code D1} fixture must
 * bind to; a sample of a response type is what its {@code S1} fixture is written from.
 *
 * <p>{@link #all()} lists every sample with its fixture name and the directions it serves; the goldens and
 * {@code PayloadSamplesAdequacyTest} iterate it, so a WP adds a type by adding a factory and an entry. Which WP owns a
 * sample is the gate's business ({@link ContractRegistry#typeOwners}, and the registry row naming an extra root).
 *
 * <p>A property declared {@code Object} or {@code JsonNode} holds {@link #representative(JavaType)}, the §4.6
 * representative input (adequacy check 3). The values inside a map property such as
 * {@link #editingApplicationDsl()} are realistic content instead (§3.3: computed properties get realistic source data);
 * the representative input's binding into {@code Map<String,Object>} is pinned by
 * {@code RepresentativeInputContractTest}.
 */
public final class PayloadSamples {

    /** Above {@code Short.MAX_VALUE}, so an {@code int}/{@code Integer} property cannot pass for a {@code short}. */
    public static final int APPLICATION_TYPE = 40_001;
    /** Above {@code Integer.MAX_VALUE}, so JSON binding must produce a {@code Long} inside {@code Object} values. */
    public static final long DSL_LONG = 3_000_000_001L;
    public static final int DSL_INT = 40_002;
    /** Written as {@code 1.50} in the fixture: an {@code Object} value binds it to {@code Double} and drops the zero. */
    public static final double DSL_DECIMAL = 1.5;

    /** The string-valued keys of a generic auth config, in the order {@code AuthConfigFactoryImpl} reads them. */
    public static final List<String> AUTH_CONFIG_STRING_KEYS = List.of("source", "sourceName", "sourceDescription", "sourceIcon",
            "sourceCategory", "clientId", "clientSecret", "issuerUri", "authorizationEndpoint", "tokenEndpoint", "userInfoEndpoint",
            "scope");

    /** §4.5: the value of a property that must never appear in {@code Public} output. */
    public static final String SECRET_MARKER = "SECRET-";
    /** §4.5: the value of a property that {@code Public} output exposes today, pending owner decision O1. */
    public static final String KNOWN_EXPOSURE_MARKER = "KNOWN-EXPOSURE-";

    /** The §4.6 representative input (task T1.3), relative to the module's fixture directory. */
    public static final String REPRESENTATIVE_INPUT = "dynamic/representative.input.json";
    /** What the production mapper writes for {@link #REPRESENTATIVE_INPUT} bound to any dynamic type (task T1.3). */
    public static final String REPRESENTATIVE_OUTPUT = "dynamic/representative.output.json";

    private PayloadSamples() {
    }

    /** The text of {@link #REPRESENTATIVE_INPUT}, read through {@link GoldenJson}, so a fixture overlay applies. */
    public static String representativeInputText() {
        return GoldenJson.forModule().read(REPRESENTATIVE_INPUT);
    }

    /** The representative input bound by the production mapper to {@code type}; a new value on every call. */
    public static Object representative(JavaType type) {
        try {
            return JsonUtils.getObjectMapper().readValue(representativeInputText(), type);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("the representative input does not bind to " + type, e);
        }
    }

    /** {@link #representative(JavaType)} for a property declared {@code Object}. */
    public static Object representativeObject() {
        return representative(JsonUtils.getObjectMapper().constructType(Object.class));
    }

    /** One sample: its fixture base name ({@code types/<name>.<case>.json}), Java type, value and directions. */
    public record Sample(String name, JavaType type, Object value, Set<Direction> directions) {

        public String fixture(String fixtureCase) {
            return "types/" + name + "." + fixtureCase + ".json";
        }
    }

    private static final Set<Direction> REQUEST = Set.of(Direction.REQUEST);
    private static final Set<Direction> RESPONSE = Set.of(Direction.RESPONSE);
    private static final Set<Direction> BOTH = Set.of(Direction.REQUEST, Direction.RESPONSE);

    /** Every sample, in WP order; a new value on every call, so a test may change the one it gets. */
    public static List<Sample> all() {
        return List.of(
                sample(Folder.class, folder(), REQUEST),
                sample(CreateApplicationRequest.class, createApplicationRequest(), REQUEST),
                sample(AuthConfigRequest.class, authConfigRequest(), REQUEST),
                // WP2, ApplicationEndpoints (T2.1)
                sample(ApplicationAsAgencyProfileRequest.class, ApplicationSamples.applicationAsAgencyProfileRequest(), REQUEST),
                sample(ApplicationPublicToAllRequest.class, ApplicationSamples.applicationPublicToAllRequest(), REQUEST),
                sample(ApplicationPublicToMarketplaceRequest.class, ApplicationSamples.applicationPublicToMarketplaceRequest(), REQUEST),
                sample(BatchAddPermissionRequest.class, ApplicationSamples.batchAddPermissionRequest(), REQUEST),
                sample(UpdateEditStateRequest.class, ApplicationSamples.updateEditStateRequest(), REQUEST),
                sample(UpdatePermissionRequest.class, ApplicationSamples.updatePermissionRequest(), REQUEST),
                sample(ApplicationPublishRequest.class, ApplicationSamples.applicationPublishRequest(), REQUEST),
                sample(ApplicationInfoView.class, ApplicationSamples.applicationInfoView(), RESPONSE),
                sample(ApplicationPermissionView.class, ApplicationSamples.applicationPermissionView(), RESPONSE),
                sample(ApplicationView.class, ApplicationSamples.applicationView(), RESPONSE),
                sample(MarketplaceApplicationInfoView.class, ApplicationSamples.marketplaceApplicationInfoView(), RESPONSE),
                sample(FolderInfoView.class, ApplicationSamples.folderInfoView(), RESPONSE),
                sample(UserHomepageView.class, ApplicationSamples.userHomepageView(), RESPONSE),
                sample(PermissionItemView.class, ApplicationSamples.permissionItemView(), RESPONSE),
                sample(Application.class, ApplicationSamples.application(), BOTH),
                sample(ApplicationQuery.class, ApplicationSamples.applicationQuery(), RESPONSE),
                sample(BaseQuery.class, ApplicationSamples.baseQuery(), RESPONSE),
                sample(LibraryQueryCombineId.class, ApplicationSamples.libraryQueryCombineId(), RESPONSE),
                sample(Organization.class, OrganizationSamples.organization(), BOTH),
                sample(EmailAuthConfig.class, OrganizationSamples.emailAuthConfig(), BOTH),
                sample(Oauth2SimpleAuthConfig.class, OrganizationSamples.oauth2SimpleAuthConfig(), BOTH),
                sample(Oauth2GenericAuthConfig.class, OrganizationSamples.oauth2GenericAuthConfig(), BOTH),
                sample(Oauth2KeycloakAuthConfig.class, OrganizationSamples.oauth2KeycloakAuthConfig(), BOTH),
                sample(Oauth2OryAuthConfig.class, OrganizationSamples.oauth2OryAuthConfig(), BOTH),
                sample(User.class, UserSamples.user(), RESPONSE),
                sample(Connection.class, UserSamples.connection(), RESPONSE),
                sample(APIKey.class, UserSamples.apiKey(), RESPONSE),
                sample(TransformedUserInfo.class, UserSamples.transformedUserInfo(), RESPONSE),
                // WP2, ApplicationHistorySnapshotEndpoints (T2.2); the brief info is the concrete type of an untyped root
                sample(ApplicationHistorySnapshotRequest.class, ApplicationSamples.applicationHistorySnapshotRequest(), REQUEST),
                sample(HistorySnapshotDslView.class, ApplicationSamples.historySnapshotDslView(), RESPONSE),
                sample(ApplicationHistorySnapshotBriefInfo.class, ApplicationSamples.applicationHistorySnapshotBriefInfo(), RESPONSE),
                // WP2, ApplicationRecordEndpoints (T2.3)
                sample(ApplicationRecordMetaView.class, ApplicationSamples.applicationRecordMetaView(), RESPONSE),
                // WP4 types, written by T2.1 as the concrete payloads of getGroupsOrMembersWithoutPermissions
                sample(GroupView.class, UserManagementSamples.groupView(), RESPONSE),
                sample(OrgMemberView.class, UserManagementSamples.orgMemberView(), RESPONSE),
                // WP3, BundleEndpoints (T3.1)
                sample(CreateBundleRequest.class, BundleSamples.createBundleRequest(), REQUEST),
                sample(BundleEndpoints.BatchAddPermissionRequest.class, BundleSamples.batchAddPermissionRequest(), REQUEST),
                sample(BundleEndpoints.UpdatePermissionRequest.class, BundleSamples.updatePermissionRequest(), REQUEST),
                sample(BundlePublicToAllRequest.class, BundleSamples.bundlePublicToAllRequest(), REQUEST),
                sample(BundlePublicToMarketplaceRequest.class, BundleSamples.bundlePublicToMarketplaceRequest(), REQUEST),
                sample(BundleAsAgencyProfileRequest.class, BundleSamples.bundleAsAgencyProfileRequest(), REQUEST),
                sample(Bundle.class, BundleSamples.bundle(), REQUEST),
                sample(BundleInfoView.class, BundleSamples.bundleInfoView(), RESPONSE),
                sample(BundlePermissionView.class, BundleSamples.bundlePermissionView(), RESPONSE),
                sample(MarketplaceBundleInfoView.class, BundleSamples.marketplaceBundleInfoView(), RESPONSE),
                sample(BundleApplication.class, BundleSamples.bundleApplication(), RESPONSE),
                // WP4, UserEndpoints (T4.1)
                sample(CreateUserRequest.class, UserManagementSamples.createUserRequest(), REQUEST),
                sample(LostPasswordRequest.class, UserManagementSamples.lostPasswordRequest(), REQUEST),
                sample(MarkUserStatusRequest.class, UserManagementSamples.markUserStatusRequest(), REQUEST),
                sample(ResetLostPasswordRequest.class, UserManagementSamples.resetLostPasswordRequest(), REQUEST),
                sample(ResetPasswordRequest.class, UserManagementSamples.resetPasswordRequest(), REQUEST),
                sample(UpdatePasswordRequest.class, UserManagementSamples.updatePasswordRequest(), REQUEST),
                sample(UpdateUserRequest.class, UserManagementSamples.updateUserRequest(), REQUEST),
                sample(UserProfileView.class, UserManagementSamples.userProfileView(), RESPONSE),
                sample(OrgAndVisitorRoleView.class, UserManagementSamples.orgAndVisitorRoleView(), RESPONSE),
                sample(UserDetail.class, UserManagementSamples.userDetail(), RESPONSE),
                sample(OrgView.class, UserManagementSamples.orgView(), RESPONSE),
                sample(RedirectView.class, UserManagementSamples.redirectView(), RESPONSE),
                // WP4, OrganizationEndpoints (T4.2)
                sample(UpdateOrgRequest.class, UserManagementSamples.updateOrgRequest(), REQUEST),
                sample(UpdateRoleRequest.class, UserManagementSamples.updateRoleRequest(), REQUEST),
                sample(UpdateOrgCommonSettingsRequest.class, UserManagementSamples.updateOrgCommonSettingsRequest(), REQUEST),
                sample(OrganizationDomain.class, UserManagementSamples.organizationDomain(), REQUEST),
                sample(OrgMemberListView.class, UserManagementSamples.orgMemberListView(), RESPONSE),
                sample(DatasourceMetaInfo.class, UserManagementSamples.datasourceMetaInfo(), RESPONSE),
                sample(OrganizationCommonSettings.class, UserManagementSamples.organizationCommonSettings(), RESPONSE),
                // WP4, GroupEndpoints (T4.3)
                sample(CreateGroupRequest.class, UserManagementSamples.createGroupRequest(), REQUEST),
                sample(UpdateGroupRequest.class, UserManagementSamples.updateGroupRequest(), REQUEST),
                sample(AddMemberRequest.class, UserManagementSamples.addMemberRequest(), REQUEST),
                sample(GroupMemberAggregateView.class, UserManagementSamples.groupMemberAggregateView(), RESPONSE),
                sample(GroupMemberView.class, UserManagementSamples.groupMemberView(), RESPONSE),
                // WP4, InvitationEndpoints (T4.4)
                sample(InviteEmailRequest.class, UserManagementSamples.inviteEmailRequest(), REQUEST),
                sample(InvitationVO.class, UserManagementSamples.invitationVO(), RESPONSE),
                // WP6, FolderEndpoints (T6.1)
                sample(FolderEndpoints.BatchAddPermissionRequest.class, FolderSamples.batchAddPermissionRequest(), REQUEST),
                sample(FolderEndpoints.UpdatePermissionRequest.class, FolderSamples.updatePermissionRequest(), REQUEST),
                // WP6, LibraryQueryEndpoints and LibraryQueryRecordEndpoints (T6.2)
                sample(LibraryQuery.class, LibraryQuerySamples.libraryQuery(), REQUEST),
                sample(UpsertLibraryQueryRequest.class, LibraryQuerySamples.upsertLibraryQueryRequest(), REQUEST),
                sample(LibraryQueryPublishRequest.class, LibraryQuerySamples.libraryQueryPublishRequest(), REQUEST),
                sample(LibraryQueryView.class, LibraryQuerySamples.libraryQueryView(), RESPONSE),
                sample(LibraryQueryMetaView.class, LibraryQuerySamples.libraryQueryMetaView(), RESPONSE),
                sample(LibraryQueryRecordMetaView.class, LibraryQuerySamples.libraryQueryRecordMetaView(), RESPONSE),
                sample(LibraryQueryAggregateView.class, LibraryQuerySamples.libraryQueryAggregateView(), RESPONSE),
                // WP7, AuthenticationEndpoints (T7.1); APIKeyRequest is the concrete type of an untyped root
                sample(FormLoginRequest.class, AuthenticationSamples.formLoginRequest(), REQUEST),
                sample(APIKeyRequest.class, AuthenticationSamples.apiKeyRequest(), REQUEST),
                sample(APIKeyVO.class, AuthenticationSamples.apiKeyVO(), RESPONSE),
                // WP7, ConfigEndpoints (T7.1)
                sample(UpdateConfigRequest.class, ConfigSamples.updateConfigRequest(), REQUEST),
                sample(ConfigView.class, ConfigSamples.configView(), RESPONSE),
                sample(ServerConfig.class, ConfigSamples.serverConfig(), RESPONSE),
                // WP7, MaterialEndpoints (T7.1)
                sample(UploadMaterialRequestDTO.class, MaterialSamples.uploadMaterialRequestDTO(), REQUEST),
                sample(MaterialView.class, MaterialSamples.materialView(), RESPONSE),
                // WP7, MetaEndpoints (T7.1)
                sample(GetMetaDataRequest.class, MetaSamples.getMetaDataRequest(), REQUEST),
                sample(MetaView.class, MetaSamples.metaView(), RESPONSE),
                sample(ApplicationMetaView.class, MetaSamples.applicationMetaView(), RESPONSE),
                sample(UserMetaView.class, MetaSamples.userMetaView(), RESPONSE),
                sample(OrgMetaView.class, MetaSamples.orgMetaView(), RESPONSE),
                sample(FolderMetaView.class, MetaSamples.folderMetaView(), RESPONSE),
                sample(DatasourceMetaView.class, MetaSamples.datasourceMetaView(), RESPONSE),
                sample(BundleMetaView.class, MetaSamples.bundleMetaView(), RESPONSE),
                sample(GroupMetaView.class, MetaSamples.groupMetaView(), RESPONSE),
                sample(org.lowcoder.api.meta.view.LibraryQueryMetaView.class, MetaSamples.libraryQueryMetaView(), RESPONSE),
                // WP7, JsLibraryEndpoints (T7.2)
                sample(JsLibraryMeta.class, MiscSamples.jsLibraryMeta(), RESPONSE),
                // WP7, ApiFlowEndpoints (T7.3)
                sample(FlowRequest.class, MiscSamples.flowRequest(), REQUEST),
                // WP5, DatasourceEndpoints (T5.1); DatasourceView is the concrete element of two untyped list roots
                sample(UpsertDatasourceRequest.class, DatasourceSamples.upsertDatasourceRequest(), REQUEST),
                sample(DatasourceEndpoints.BatchAddPermissionRequest.class, DatasourceSamples.batchAddPermissionRequest(), REQUEST),
                sample(DatasourceEndpoints.UpdatePermissionRequest.class, DatasourceSamples.updatePermissionRequest(), REQUEST),
                sample(GetPluginDynamicConfigRequestDTO.class, DatasourceSamples.getPluginDynamicConfigRequestDTO(), REQUEST),
                sample(Datasource.class, DatasourceSamples.datasource(), RESPONSE),
                sample(DatasourceView.class, DatasourceSamples.datasourceView(), RESPONSE),
                sample(CommonPermissionView.class, DatasourceSamples.commonPermissionView(), RESPONSE),
                sample(DatasourceStructure.class, DatasourceSamples.datasourceStructure(), RESPONSE),
                sample(Table.class, DatasourceSamples.table(), RESPONSE),
                sample(Column.class, DatasourceSamples.column(), RESPONSE),
                // WP5, QueryEndpoints (T5.2)
                sample(QueryExecutionRequest.class, QuerySamples.queryExecutionRequest(), REQUEST),
                sample(LibraryQueryRequestFromJs.class, QuerySamples.libraryQueryRequestFromJs(), REQUEST),
                sample(Param.class, QuerySamples.param(), REQUEST),
                sample(QueryResultView.class, QuerySamples.queryResultView(), RESPONSE));
    }

    /** The sample of {@code type} from {@link #all()}, a new value. */
    public static Sample of(Class<?> type) {
        return all().stream().filter(sample -> sample.name().equals(type.getName())).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("no sample of " + type.getName()));
    }

    private static Sample sample(Class<?> type, Object value, Set<Direction> directions) {
        return new Sample(type.getName(), JsonUtils.getObjectMapper().constructType(type), value, directions);
    }

    /** {@code FolderEndpoints#create} and {@code #update}; a setter-bound POJO (§5.3 representative). */
    public static Folder folder() {
        Folder folder = new Folder();
        folder.setId("Folder.id");
        folder.setCreatedBy("Folder.createdBy");
        folder.setOrganizationId("Folder.organizationId");
        folder.setGid("Folder.gid");
        folder.setParentFolderId("Folder.parentFolderId");
        folder.setParentFolderGid("Folder.parentFolderGid");
        folder.setName("Folder.name");
        folder.setTitle("Folder.title");
        folder.setDescription("Folder.description");
        folder.setCategory("Folder.category");
        folder.setType("Folder.type");
        folder.setImage("Folder.image");
        return folder;
    }

    /** {@code ApplicationEndpoints#create}; a record bound through its canonical constructor (§5.3 representative). */
    public static CreateApplicationRequest createApplicationRequest() {
        return new CreateApplicationRequest("CreateApplicationRequest.orgId", "CreateApplicationRequest.gid",
                "CreateApplicationRequest.name", APPLICATION_TYPE, editingApplicationDsl(),
                "CreateApplicationRequest.folderId", Boolean.TRUE, Boolean.FALSE);
    }

    /**
     * An application DSL as Jackson binds JSON into {@code Map<String, Object>}: {@code LinkedHashMap} objects,
     * {@code ArrayList} arrays, {@code Integer} or {@code Long} by magnitude, {@code Double} decimals.
     */
    public static Map<String, Object> editingApplicationDsl() {
        Map<String, Object> comp = new LinkedHashMap<>();
        comp.put("text", "editingApplicationDSL.ui.comp.text");
        comp.put("hidden", Boolean.FALSE);
        Map<String, Object> ui = new LinkedHashMap<>();
        ui.put("compType", "editingApplicationDSL.ui.compType");
        ui.put("comp", comp);
        List<Object> queries = new ArrayList<>();
        queries.add(query("editingApplicationDSL.queries[0]", DSL_INT));
        queries.add(query("editingApplicationDSL.queries[1]", DSL_LONG));
        Map<String, Object> dsl = new LinkedHashMap<>();
        dsl.put("ui", ui);
        dsl.put("queries", queries);
        dsl.put("ratio", DSL_DECIMAL);
        dsl.put("removed", null);
        return dsl;
    }

    private static Map<String, Object> query(String id, Object timeout) {
        Map<String, Object> query = new LinkedHashMap<>();
        query.put("id", id);
        query.put("timeout", timeout);
        return query;
    }

    /**
     * {@code AuthenticationEndpoints#enableAuthConfig}; a {@code HashMap} subclass (§5.3 map representative): a
     * {@link AuthTypeConstants#GENERIC} config with every key {@code AuthConfigFactoryImpl#buildOauth2GenericAuthConfig}
     * reads, its four booleans opposite to the factory's defaults so that a lost value shows. String values are unique
     * per key; {@code authType} is the real type id, since it selects the factory branch.
     */
    public static AuthConfigRequest authConfigRequest() {
        AuthConfigRequest request = new AuthConfigRequest();
        request.put("id", "AuthConfigRequest.id");
        request.put("authType", AuthTypeConstants.GENERIC);
        for (String key : AUTH_CONFIG_STRING_KEYS) {
            request.put(key, "AuthConfigRequest." + key);
        }
        request.put("enableRegister", Boolean.FALSE);
        request.put("userInfoIntrospection", Boolean.TRUE);
        request.put("userCanSelectAccounts", Boolean.FALSE);
        request.put("postForUserEndpoint", Boolean.TRUE);
        Map<String, Object> sourceMappings = new LinkedHashMap<>();
        sourceMappings.put("uid", "AuthConfigRequest.sourceMappings.uid");
        sourceMappings.put("email", "AuthConfigRequest.sourceMappings.email");
        request.put("sourceMappings", sourceMappings);
        return request;
    }
}
