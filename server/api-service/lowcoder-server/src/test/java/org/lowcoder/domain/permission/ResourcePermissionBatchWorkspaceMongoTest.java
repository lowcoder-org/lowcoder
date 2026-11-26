package org.lowcoder.domain.permission;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.DoubleStream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.bundle.service.BundleService;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceCreationSource;
import org.lowcoder.domain.datasource.model.DatasourceStatus;
import org.lowcoder.domain.datasource.repository.DatasourceRepository;
import org.lowcoder.domain.group.model.Group;
import org.lowcoder.domain.group.service.GroupMemberService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.OrganizationState;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.permission.model.ResourceAction;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.plugin.client.DatasourcePluginClient;
import org.lowcoder.domain.plugin.client.dto.DatasourcePluginDefinition;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.JsDatasourceConnectionConfig;
import org.lowcoder.sdk.util.IDUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import reactor.core.publisher.Mono;

/**
 * {@code ResourcePermissionService.getMaxMatchingPermission} / {@code checkResourcePermissionWithError} against the
 * MongoDB test container (D-38): every id of a batch is decided in its OWN workspace instead of the first id's. Own
 * Spring context (extra property, hence its own database), the pattern of {@code DatasourceRepositoryMongoTest}: a
 * mocked {@code DatasourceMetaInfoService} (every type is a JS data source) and a mocked {@code DatasourcePluginClient}
 * (a plugin definition without params). Every test generates its own ids; no seed data.
 */
@SpringBootTest(classes = ServerApplication.class)
@ActiveProfiles("test")
@TestPropertySource(properties = "d38.context=batch-workspace")
class ResourcePermissionBatchWorkspaceMongoTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(30);
    private static final String LOG_PREFIX = "[ResourcePermissionBatchWorkspaceMongoTest] ";

    @MockBean
    private DatasourceMetaInfoService datasourceMetaInfoService;
    @MockBean
    private DatasourcePluginClient datasourcePluginClient;
    @Autowired
    private ReactiveMongoTemplate mongo;
    @Autowired
    private OrgMemberService orgMemberService;
    @Autowired
    private GroupMemberService groupMemberService;
    @Autowired
    private ResourcePermissionService resourcePermissionService;
    @Autowired
    private ApplicationService applicationService;
    @Autowired
    private BundleService bundleService;
    @Autowired
    private DatasourceRepository datasourceRepository;

    private final String userId = "user-" + IDUtils.generate();

    private static String newId() {
        return IDUtils.generate();
    }

    private String createOrg() {
        Organization org = Organization.builder().name("org-" + newId()).gid(newId()).state(OrganizationState.ACTIVE).build();
        return mongo.save(org).block(TIMEOUT).getId();
    }

    private void addMember(String orgId, MemberRole role) {
        orgMemberService.addMember(orgId, userId, role).block(TIMEOUT);
    }

    private String createGroup(String orgId) {
        return mongo.save(Group.builder().organizationId(orgId).name("group-" + newId()).build()).block(TIMEOUT).getId();
    }

    private void addGroupMember(String orgId, String groupId) {
        groupMemberService.addMember(orgId, groupId, userId, MemberRole.MEMBER).block(TIMEOUT);
    }

    private void grantUser(String resourceId, org.lowcoder.domain.permission.model.ResourceType type, ResourceRole role) {
        resourcePermissionService.addResourcePermissionToUser(resourceId, userId, role, type).block(TIMEOUT);
    }

    private void grantGroup(String resourceId, org.lowcoder.domain.permission.model.ResourceType type, String groupId, ResourceRole role) {
        resourcePermissionService.insertBatchPermission(type, resourceId, null, Set.of(groupId), role).block(TIMEOUT);
    }

    private String createApp(String orgId) {
        Application application = Application.builder().organizationId(orgId).name("app-" + newId()).gid(UUID.randomUUID().toString())
                .editingApplicationDSL(new HashMap<>()).build();
        return mongo.save(application).block(TIMEOUT).getId();
    }

    private String createAppWithSlug(String orgId, String slug) {
        Application application = Application.builder().organizationId(orgId).name("app-" + newId()).gid(UUID.randomUUID().toString())
                .slug(slug).editingApplicationDSL(new HashMap<>()).build();
        return mongo.save(application).block(TIMEOUT).getId();
    }

    private String createBundle(String orgId) {
        Bundle bundle = Bundle.builder().organizationId(orgId).name("bundle-" + newId()).gid(UUID.randomUUID().toString()).build();
        return mongo.save(bundle).block(TIMEOUT).getId();
    }

    private String createDatasource(String orgId) {
        JsDatasourceConnectionConfig config = new JsDatasourceConnectionConfig();
        config.put("host", "db.example");
        Datasource datasource = Datasource.builder().organizationId(orgId).name("ds-" + newId()).type("someJsPlugin")
                .gid(UUID.randomUUID().toString()).creationSource(DatasourceCreationSource.USER_CREATED.getValue())
                .datasourceStatus(DatasourceStatus.NORMAL).detailConfig(config).build();
        return datasourceRepository.save(datasource).block(TIMEOUT).getId();
    }

    private Map<String, ResourceRole> maxMatching(List<String> ids, ResourceAction action) {
        Map<String, org.lowcoder.domain.permission.model.ResourcePermission> answer =
                resourcePermissionService.getMaxMatchingPermission(userId, ids, action).block(TIMEOUT);
        Map<String, ResourceRole> roles = new HashMap<>();
        answer.forEach((id, permission) -> roles.put(id, permission.getResourceRole()));
        return roles;
    }

    /** A plugin definition that declares no params: nothing is a password, so a stored config round-trips as it is. */
    private static DatasourcePluginDefinition definitionWithoutParams() {
        DatasourcePluginDefinition definition = new DatasourcePluginDefinition();
        definition.put("dataSourceConfig", Map.of("params", List.of()));
        return definition;
    }

    @org.junit.jupiter.api.BeforeEach
    void everyTypeIsAJsDatasourceWithoutParams() {
        when(datasourceMetaInfoService.isJsDatasourcePlugin(anyString())).thenReturn(true);
        when(datasourcePluginClient.getDatasourcePluginDefinition(anyString())).thenReturn(Mono.just(definitionWithoutParams()));
    }

    /** Catches a batch answer diverging from each id's own one-id answer in the same workspace. */
    @Test
    void applicationsOfOneWorkspace_batchAnswerEqualsEachOneIdAnswer() {
        String orgId = createOrg();
        addMember(orgId, MemberRole.MEMBER);
        String groupId = createGroup(orgId);
        addGroupMember(orgId, groupId);
        String a1 = createApp(orgId);
        String a2 = createApp(orgId);
        String a3 = createApp(orgId);
        grantUser(a1, org.lowcoder.domain.permission.model.ResourceType.APPLICATION, ResourceRole.EDITOR);
        grantGroup(a2, org.lowcoder.domain.permission.model.ResourceType.APPLICATION, groupId, ResourceRole.VIEWER);

        Map<String, ResourceRole> batch = maxMatching(List.of(a1, a2, a3), ResourceAction.READ_APPLICATIONS);

        assertThat(batch).containsExactlyInAnyOrderEntriesOf(Map.of(a1, ResourceRole.EDITOR, a2, ResourceRole.VIEWER));
        for (String id : List.of(a1, a2, a3)) {
            var oneId = resourcePermissionService.getMaxMatchingPermission(userId, id, ResourceAction.READ_APPLICATIONS).blockOptional(TIMEOUT);
            if (batch.containsKey(id)) {
                assertThat(oneId).isPresent();
                assertThat(oneId.get().getResourceRole()).isEqualTo(batch.get(id));
            } else {
                assertThat(oneId).isEmpty();
            }
        }
        System.out.println(LOG_PREFIX + "applications of one workspace: batch answer equals each one-id answer");
    }

    /** Data source analogue of the test above. */
    @Test
    void datasourcesOfOneWorkspace_batchAnswerEqualsEachOneIdAnswer() {
        String orgId = createOrg();
        addMember(orgId, MemberRole.MEMBER);
        String groupId = createGroup(orgId);
        addGroupMember(orgId, groupId);
        String d1 = createDatasource(orgId);
        String d2 = createDatasource(orgId);
        String d3 = createDatasource(orgId);
        grantUser(d1, org.lowcoder.domain.permission.model.ResourceType.DATASOURCE, ResourceRole.OWNER);
        grantGroup(d2, org.lowcoder.domain.permission.model.ResourceType.DATASOURCE, groupId, ResourceRole.VIEWER);

        Map<String, ResourceRole> batch = maxMatching(List.of(d1, d2, d3), ResourceAction.USE_DATASOURCES);

        assertThat(batch).containsExactlyInAnyOrderEntriesOf(Map.of(d1, ResourceRole.OWNER, d2, ResourceRole.VIEWER));
        for (String id : List.of(d1, d2, d3)) {
            var oneId = resourcePermissionService.getMaxMatchingPermission(userId, id, ResourceAction.USE_DATASOURCES).blockOptional(TIMEOUT);
            if (batch.containsKey(id)) {
                assertThat(oneId).isPresent();
                assertThat(oneId.get().getResourceRole()).isEqualTo(batch.get(id));
            } else {
                assertThat(oneId).isEmpty();
            }
        }
        System.out.println(LOG_PREFIX + "data sources of one workspace: batch answer equals each one-id answer");
    }

    static List<List<Integer>> bothOrders() {
        return List.of(List.of(0, 1, 2), List.of(2, 1, 0));
    }

    /** Catches D-38 on the bundle list: a bundle the user created in a workspace it never joined getting the first
     * bundle's workspace and admin role instead of being decided in its own. */
    @ParameterizedTest
    @MethodSource("bothOrders")
    void bundlesCreatedInThreeWorkspaces_eachIsDecidedByItsOwnMembership(List<Integer> order) {
        String w1 = createOrg();
        addMember(w1, MemberRole.ADMIN);
        String w2 = createOrg();
        addMember(w2, MemberRole.MEMBER);
        String g2 = createGroup(w2);
        addGroupMember(w2, g2);
        String w3 = createOrg();
        String b1 = createBundle(w1);
        String b2 = createBundle(w2);
        String b3 = createBundle(w3);
        grantGroup(b2, org.lowcoder.domain.permission.model.ResourceType.BUNDLE, g2, ResourceRole.VIEWER);
        grantUser(b3, org.lowcoder.domain.permission.model.ResourceType.BUNDLE, ResourceRole.OWNER);
        List<String> all = List.of(b1, b2, b3);
        List<String> ids = order.stream().map(all::get).toList();

        Map<String, ResourceRole> batch = maxMatching(ids, ResourceAction.READ_BUNDLES);

        assertThat(batch).containsExactlyInAnyOrderEntriesOf(Map.of(b1, ResourceRole.OWNER, b2, ResourceRole.VIEWER));
        assertThat(batch).as("b3: never a member of w3, its stored OWNER row from creation does not count").doesNotContainKey(b3);
        System.out.println(LOG_PREFIX + "orders " + order + ": b1 OWNER (admin of w1), b2 VIEWER (group in w2), b3 absent (never in w3)");
    }

    static List<List<Integer>> twoOrders() {
        return List.of(List.of(0, 1), List.of(1, 0));
    }

    /** Catches D-38 on the nav layout / cross-workspace sub-application case. */
    @ParameterizedTest
    @MethodSource("twoOrders")
    void subApplicationsOfTwoWorkspaces_eachIsDecidedByItsOwnMembership(List<Integer> order) {
        String w1 = createOrg();
        addMember(w1, MemberRole.ADMIN);
        String w2 = createOrg();
        addMember(w2, MemberRole.MEMBER);
        String a1 = createApp(w1);
        String x1 = createApp(w2);
        List<String> all = List.of(a1, x1);
        List<String> ids = order.stream().map(all::get).toList();

        Map<String, ResourceRole> batch = maxMatching(ids, ResourceAction.READ_APPLICATIONS);

        assertThat(batch).containsExactlyInAnyOrderEntriesOf(Map.of(a1, ResourceRole.OWNER));
        assertThat(batch).as("x1: a plain member of w2 without a grant").doesNotContainKey(x1);
        System.out.println(LOG_PREFIX + "orders " + order + ": a1 OWNER (admin of w1), x1 absent (member of w2, no grant)");
    }

    /** D-38's own repro: an admin role in one workspace must not grant USE of another workspace's data source. */
    @ParameterizedTest
    @MethodSource("twoOrders")
    void datasourcesOfTwoWorkspaces_adminRoleElsewhereGrantsNothing(List<Integer> order) {
        String w1 = createOrg();
        addMember(w1, MemberRole.ADMIN);
        String w2 = createOrg();
        addMember(w2, MemberRole.MEMBER);
        String dA = createDatasource(w1);
        String dB = createDatasource(w2);
        List<String> all = List.of(dA, dB);
        List<String> ids = order.stream().map(all::get).toList();

        Map<String, ResourceRole> batch = maxMatching(ids, ResourceAction.USE_DATASOURCES);

        assertThat(batch).containsExactlyInAnyOrderEntriesOf(Map.of(dA, ResourceRole.OWNER));
        assertThat(batch).as("dB: w1's admin role grants nothing in w2").doesNotContainKey(dB);
        System.out.println(LOG_PREFIX + "orders " + order + ": dA OWNER (admin of w1), dB absent (member of w2 only)");
    }

    /** Catches an unknown application id failing the whole batch, and pins the one-id contract is unchanged. */
    @Test
    void batchWithAnUnknownApplicationId_leavesItOut_oneUnknownIdStillFails() {
        String orgId = createOrg();
        addMember(orgId, MemberRole.ADMIN);
        String a1 = createApp(orgId);
        String unusedId = "unused-" + newId();

        for (List<String> order : List.of(List.of(a1, unusedId), List.of(unusedId, a1))) {
            Map<String, ResourceRole> batch = maxMatching(order, ResourceAction.READ_APPLICATIONS);
            assertThat(batch).containsExactlyInAnyOrderEntriesOf(Map.of(a1, ResourceRole.OWNER));
        }

        assertThatThrownBy(() -> resourcePermissionService.checkResourcePermissionWithError(userId, unusedId, ResourceAction.READ_APPLICATIONS)
                .block(TIMEOUT))
                .isInstanceOf(BizException.class)
                .extracting(error -> ((BizException) error).getError())
                .isEqualTo(BizError.NO_RESOURCE_FOUND);
        System.out.println(LOG_PREFIX + "an unknown application id in a batch is left out; a single unknown id still fails");
    }

    /** Catches an application slug two applications share failing or borrowing an answer in a batch (D-38). */
    @ParameterizedTest
    @MethodSource("sharedSlugOrders")
    void batchWithASharedApplicationSlug_leavesItOut_oneSharedSlugStillFails(List<Integer> order) {
        String w1 = createOrg();
        addMember(w1, MemberRole.ADMIN);
        String w2 = createOrg();
        String slug = "d38shared" + IDUtils.generate();
        String a1 = createApp(w1);
        String s1 = createAppWithSlug(w1, slug);
        createAppWithSlug(w2, slug);
        List<String> all = List.of(a1, s1, slug);
        List<String> ids = order.stream().map(all::get).toList();

        Map<String, ResourceRole> batch = maxMatching(ids, ResourceAction.READ_APPLICATIONS);

        assertThat(batch).containsExactlyInAnyOrderEntriesOf(Map.of(a1, ResourceRole.OWNER, s1, ResourceRole.OWNER));
        assertThatThrownBy(() -> resourcePermissionService.checkResourcePermissionWithError(userId, slug, ResourceAction.READ_APPLICATIONS)
                .block(TIMEOUT))
                .isInstanceOf(BizException.class)
                .extracting(error -> ((BizException) error).getError())
                .isEqualTo(BizError.NO_RESOURCE_FOUND);
        System.out.println(LOG_PREFIX + "orders " + order + ": a shared slug in a batch is left out, not failing the batch; alone it still fails");
    }

    static List<List<Integer>> sharedSlugOrders() {
        return List.of(List.of(0, 1, 2), List.of(2, 1, 0));
    }

    /** Batch cost of 200 applications of one workspace: median/p95 over 20 timed runs after 5 warm-ups. */
    @Test
    void twoHundredApplicationsOfOneWorkspace_answerEveryIdAndPrintTheCost() {
        String orgId = createOrg();
        addMember(orgId, MemberRole.MEMBER);
        List<String> ids = new ArrayList<>();
        for (int i = 0; i < 200; i++) {
            String id = createApp(orgId);
            grantUser(id, org.lowcoder.domain.permission.model.ResourceType.APPLICATION, ResourceRole.VIEWER);
            ids.add(id);
        }

        for (int warmup = 0; warmup < 5; warmup++) {
            maxMatching(ids, ResourceAction.READ_APPLICATIONS);
        }
        double[] millis = new double[20];
        for (int run = 0; run < 20; run++) {
            long start = System.nanoTime();
            Map<String, ResourceRole> batch = maxMatching(ids, ResourceAction.READ_APPLICATIONS);
            millis[run] = (System.nanoTime() - start) / 1_000_000.0;
            assertThat(batch).hasSize(200);
        }
        double[] sorted = DoubleStream.of(millis).sorted().toArray();
        double median = sorted[sorted.length / 2];
        double p95 = sorted[(int) Math.min(sorted.length - 1, Math.round(sorted.length * 0.95))];
        System.out.println(LOG_PREFIX + "200 applications of one workspace: median " + median + " ms, p95 " + p95 + " ms over 20 runs");
    }
}
