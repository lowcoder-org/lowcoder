package org.lowcoder.api.contract.endpoint;

import com.github.tomakehurst.wiremock.junit5.WireMockRuntimeInfo;
import com.github.tomakehurst.wiremock.junit5.WireMockTest;
import com.github.tomakehurst.wiremock.verification.LoggedRequest;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.npm.PrivateNpmRegistryController;
import org.lowcoder.api.npm.PrivateNpmRegistryEndpoint;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.service.ApplicationServiceImpl;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.Organization.OrganizationCommonSettings;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.infra.js.NodeServerHelper;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.GoldenJson;
import org.mockito.Mockito;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.postRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;

/**
 * Codec-level tests of the 2 {@link PrivateNpmRegistryEndpoint}s (docs/API_PAYLOAD_TEST_PLAN.md §4.9, §5.2, task T7.2),
 * through the production {@link PrivateNpmRegistryController}, and group {@code npm-outbound}: the controller posts
 * {@code {"npmRegistries": <the organization's registries>, "workspaceId": <its id>}} to the node service, encoded by
 * the client codecs of a {@code WebClientBuildHelper} client ({@code BodyInserters.fromValue}), and passes the node
 * service's answer through as bytes (§1.4, Appendix A).
 *
 * <p>The mocked {@link NodeServerHelper} answers URIs of WireMock, which records each request body and answers fixed
 * bytes with a content type. Per endpoint, two tests: the {@value #NONE} application (the visitor's organization,
 * {@code PrivateNpmRegistryController.java:53}) and an application id (the application's organization, {@code :88}).
 * The recorded body is compared with {@code boundary/npm-outbound/with-registries.json}, the organization's registry
 * list as the store gives it (maps, lists and strings); {@link #getNpmPackageMetaWithDefaultRegistries} covers the
 * default empty list ({@code :57-61}) with {@code boundary/npm-outbound/default-registries.json}. The answer's status,
 * {@code Content-Type} and bytes must reach the client unchanged.
 *
 * <p>Limits: the body map is a {@code Map.of}, whose iteration order, and so the member order of the body, is not fixed
 * (outside the §1.2 contract; reported, not failed). The node service is not run.
 *
 * <p>Stubbing groups (registry column {@code group}): {@code pass-through} for both: the answer is the node service's.
 */
@WireMockTest
class PrivateNpmRegistryEndpointContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(PrivateNpmRegistryEndpoint.class);
    /** The application id that selects the visitor's organization. */
    static final String NONE = "none";
    static final String APPLICATION_ID = "PrivateNpmRegistryEndpointContractTest.applicationId";
    /** The organization of both branches: the visitor's, and the application's; the body names it as {@code workspaceId}. */
    static final String ORG_ID = "PrivateNpmRegistryEndpointContractTest.orgId";
    static final String PACKAGE = "lowcoder-comps";
    static final String TARBALL = "lowcoder-comps-2.6.4.tgz";
    /** {@code PrivateNpmRegistryController}'s node-service path prefixes. */
    static final String METADATA_PREFIX = "npm/registry/";
    static final String ASSET_PREFIX = "npm/package/";
    static final String NODE_SERVICE_PATH = "/node-service/api/";
    static final String WITH_REGISTRIES = "boundary/npm-outbound/with-registries.json";
    static final String DEFAULT_REGISTRIES = "boundary/npm-outbound/default-registries.json";
    static final String NPM_REGISTRIES = "npmRegistries";
    static final byte[] METADATA = "{\"name\":\"lowcoder-comps\",\"dist-tags\":{\"latest\":\"2.6.4\"}}".getBytes(StandardCharsets.UTF_8);
    static final byte[] TARBALL_BYTES = {0x1f, (byte) 0x8b, 0x08, 0x00, (byte) 0xe9, 0x7f, 0x00, (byte) 0xff};
    static final MediaType TARBALL_TYPE = MediaType.APPLICATION_OCTET_STREAM;
    static final int OK = 200;

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    private ContractTestClient.Builder builder;
    private OrganizationService organizationService;
    private String nodeServiceBaseUrl;

    @BeforeEach
    void mocks(WireMockRuntimeInfo wireMock) {
        builder = ContractTestClient.builder();
        organizationService = builder.mock(OrganizationService.class);
        nodeServiceBaseUrl = wireMock.getHttpBaseUrl();
        Mockito.when(builder.mock(NodeServerHelper.class).createUri(anyString()))
                .thenAnswer(invocation -> URI.create(nodeServiceBaseUrl + NODE_SERVICE_PATH + invocation.getArgument(0)));
    }

    @AfterAll
    static void everyEndpointAndBranchHasATest() {
        CONTRACT.assertComplete(PrivateNpmRegistryEndpointContractTest.class);
    }

    @BoundarySites("lowcoder-server/src/main/java/org/lowcoder/api/npm/PrivateNpmRegistryController.java#PrivateNpmRegistryController.forwardToNodeService#BodyInserters.fromValue#1")
    @Test
    void getNpmPackageMeta(WireMockRuntimeInfo wireMock) {
        visitorOrganizationHas(settingsWithRegistries());
        EntityExchangeResult<byte[]> result = exchange(wireMock, "getNpmPackageMeta", NONE, PACKAGE, METADATA_PREFIX, METADATA, MediaType.APPLICATION_JSON);
        EndpointContract.assertBytes(result, HttpStatus.OK, MediaType.APPLICATION_JSON, METADATA);
        GOLDEN.assertJson(WITH_REGISTRIES, recordedBody(wireMock, METADATA_PREFIX + PACKAGE));
    }

    /** {@code getOrgCommonSettings} fails: the controller's default settings, with an empty registry list. */
    @BoundarySites("lowcoder-server/src/main/java/org/lowcoder/api/npm/PrivateNpmRegistryController.java#PrivateNpmRegistryController.forwardToNodeService#BodyInserters.fromValue#1")
    @Test
    void getNpmPackageMetaWithDefaultRegistries(WireMockRuntimeInfo wireMock) {
        Mockito.when(builder.mock(SessionUserService.class).getVisitorOrgMemberCache()).thenReturn(Mono.just(orgMember()));
        Mockito.when(organizationService.getOrgCommonSettings(ORG_ID))
                .thenReturn(Mono.error(new IllegalStateException("PrivateNpmRegistryEndpointContractTest: no settings")));
        EntityExchangeResult<byte[]> result = exchange(wireMock, "getNpmPackageMeta", NONE, PACKAGE, METADATA_PREFIX, METADATA, MediaType.APPLICATION_JSON);
        EndpointContract.assertBytes(result, HttpStatus.OK, MediaType.APPLICATION_JSON, METADATA);
        GOLDEN.assertJson(DEFAULT_REGISTRIES, recordedBody(wireMock, METADATA_PREFIX + PACKAGE));
    }

    @BoundarySites("lowcoder-server/src/main/java/org/lowcoder/api/npm/PrivateNpmRegistryController.java#PrivateNpmRegistryController.forwardToNodeService#BodyInserters.fromValue#2")
    @Test
    void getNpmPackageMetaForApplication(WireMockRuntimeInfo wireMock) {
        applicationOrganizationHas(settingsWithRegistries());
        EntityExchangeResult<byte[]> result = exchange(wireMock, "getNpmPackageMeta", APPLICATION_ID, PACKAGE, METADATA_PREFIX, METADATA,
                MediaType.APPLICATION_JSON);
        EndpointContract.assertBytes(result, HttpStatus.OK, MediaType.APPLICATION_JSON, METADATA);
        GOLDEN.assertJson(WITH_REGISTRIES, recordedBody(wireMock, METADATA_PREFIX + PACKAGE));
    }

    @BoundarySites("lowcoder-server/src/main/java/org/lowcoder/api/npm/PrivateNpmRegistryController.java#PrivateNpmRegistryController.forwardToNodeService#BodyInserters.fromValue#1")
    @Test
    void getNpmPackageAsset(WireMockRuntimeInfo wireMock) {
        visitorOrganizationHas(settingsWithRegistries());
        EntityExchangeResult<byte[]> result = exchange(wireMock, "getNpmPackageAsset", NONE, TARBALL, ASSET_PREFIX, TARBALL_BYTES, TARBALL_TYPE);
        EndpointContract.assertBytes(result, HttpStatus.OK, TARBALL_TYPE, TARBALL_BYTES);
        GOLDEN.assertJson(WITH_REGISTRIES, recordedBody(wireMock, ASSET_PREFIX + TARBALL));
    }

    @BoundarySites("lowcoder-server/src/main/java/org/lowcoder/api/npm/PrivateNpmRegistryController.java#PrivateNpmRegistryController.forwardToNodeService#BodyInserters.fromValue#2")
    @Test
    void getNpmPackageAssetForApplication(WireMockRuntimeInfo wireMock) {
        applicationOrganizationHas(settingsWithRegistries());
        EntityExchangeResult<byte[]> result = exchange(wireMock, "getNpmPackageAsset", APPLICATION_ID, TARBALL, ASSET_PREFIX, TARBALL_BYTES, TARBALL_TYPE);
        EndpointContract.assertBytes(result, HttpStatus.OK, TARBALL_TYPE, TARBALL_BYTES);
        GOLDEN.assertJson(WITH_REGISTRIES, recordedBody(wireMock, ASSET_PREFIX + TARBALL));
    }

    /**
     * Stubs the node service at {@code prefix + path} with {@code answer} and sends the endpoint's request; the path
     * variable is the one segment {@code path}, which Spring hands the controller with its leading {@code /}.
     */
    private EntityExchangeResult<byte[]> exchange(WireMockRuntimeInfo wireMock, String method, String applicationId, String path, String prefix,
            byte[] answer, MediaType answerType) {
        wireMock.getWireMock().register(post(urlPathEqualTo(NODE_SERVICE_PATH + prefix + path))
                .willReturn(aResponse().withStatus(OK).withHeader(HttpHeaders.CONTENT_TYPE, answerType.toString()).withBody(answer)));
        try (ContractTestClient client = builder.controllerWithMockedDependencies(PrivateNpmRegistryController.class).build()) {
            return CONTRACT.exchange(client, method, Map.of(), null, applicationId, path);
        }
    }

    /** The one body the node service received at {@code path}, after checking it was sent as JSON. */
    private static String recordedBody(WireMockRuntimeInfo wireMock, String path) {
        List<LoggedRequest> requests = wireMock.getWireMock().find(postRequestedFor(urlPathEqualTo(NODE_SERVICE_PATH + path)));
        assertThat(requests).as("requests to the node service at " + path).hasSize(1);
        LoggedRequest request = requests.get(0);
        System.out.println("[PrivateNpmRegistryEndpointContractTest] node service received " + request.getHeader(HttpHeaders.CONTENT_TYPE) + " "
                + request.getBodyAsString());
        assertThat(MediaType.parseMediaType(request.getHeader(HttpHeaders.CONTENT_TYPE)).isCompatibleWith(MediaType.APPLICATION_JSON)).isTrue();
        return request.getBodyAsString();
    }

    private void visitorOrganizationHas(OrganizationCommonSettings settings) {
        Mockito.when(builder.mock(SessionUserService.class).getVisitorOrgMemberCache()).thenReturn(Mono.just(orgMember()));
        Mockito.when(organizationService.getOrgCommonSettings(ORG_ID)).thenReturn(Mono.just(settings));
    }

    private void applicationOrganizationHas(OrganizationCommonSettings settings) {
        Mockito.when(builder.mock(ApplicationServiceImpl.class).findById(APPLICATION_ID))
                .thenReturn(Mono.just(Application.builder().id(APPLICATION_ID).organizationId(ORG_ID).build()));
        Mockito.when(organizationService.getById(ORG_ID)).thenReturn(Mono.just(Organization.builder().id(ORG_ID).build()));
        Mockito.when(organizationService.getOrgCommonSettings(ORG_ID)).thenReturn(Mono.just(settings));
    }

    private static OrgMember orgMember() {
        return OrgMember.builder().orgId(ORG_ID).build();
    }

    /**
     * Two registries in the client's shape ({@code NpmRegistryConfigEntry}: a scope and a registry with its
     * authentication), as maps and lists of strings, the classes the store gives a {@code HashMap<String, Object>}
     * setting; and another setting, which the body must not carry.
     */
    static OrganizationCommonSettings settingsWithRegistries() {
        List<Object> registries = new ArrayList<>();
        registries.add(registry("organization", "@lowcoder", "https://npm.example.com/", "bearer"));
        registries.add(registry("global", "", "https://registry.example.com/npm/", "basic"));
        OrganizationCommonSettings settings = new OrganizationCommonSettings();
        settings.put(NPM_REGISTRIES, registries);
        settings.put("themeId", "PrivateNpmRegistryEndpointContractTest.themeId");
        return settings;
    }

    private static Map<String, Object> registry(String scopeType, String pattern, String url, String authType) {
        Map<String, Object> scope = new LinkedHashMap<>();
        scope.put("type", scopeType);
        scope.put("pattern", pattern);
        Map<String, Object> auth = new LinkedHashMap<>();
        auth.put("type", authType);
        auth.put("credentials", "PrivateNpmRegistryEndpointContractTest." + authType + ".credentials");
        Map<String, Object> registry = new LinkedHashMap<>();
        registry.put("url", url);
        registry.put("auth", auth);
        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("scope", scope);
        entry.put("registry", registry);
        return entry;
    }
}
