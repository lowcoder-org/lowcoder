package org.lowcoder.api.contract.endpoint;

import org.junit.jupiter.api.Named;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.api.application.ApplicationApiService;
import org.lowcoder.api.application.ApplicationController;
import org.lowcoder.api.application.ApplicationEndpoints;
import org.lowcoder.api.application.ApplicationEndpoints.ApplicationAsAgencyProfileRequest;
import org.lowcoder.api.application.ApplicationEndpoints.ApplicationPublicToAllRequest;
import org.lowcoder.api.application.ApplicationEndpoints.ApplicationPublicToMarketplaceRequest;
import org.lowcoder.api.application.ApplicationEndpoints.BatchAddPermissionRequest;
import org.lowcoder.api.application.ApplicationEndpoints.UpdateEditStateRequest;
import org.lowcoder.api.application.ApplicationEndpoints.UpdatePermissionRequest;
import org.lowcoder.api.application.view.ApplicationView;
import org.lowcoder.api.bundle.BundleApiService;
import org.lowcoder.api.bundle.BundleController;
import org.lowcoder.api.bundle.BundleEndpoints;
import org.lowcoder.api.contract.support.ApplicationSamples;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.datasource.DatasourceApiService;
import org.lowcoder.api.datasource.DatasourceController;
import org.lowcoder.api.datasource.DatasourceEndpoints;
import org.lowcoder.api.util.GidService;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.repository.ApplicationRepository;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.infra.constant.Url;
import org.lowcoder.sdk.exception.BizError;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.lang.reflect.Constructor;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.isNull;

/**
 * NEW-30: every controller method that converts an application id with {@link GidService#convertApplicationIdToObjectId}
 * answers an application gid that names nothing with NO_RESOURCE_FOUND / CANT_FIND_APPLICATION (HTTP 500, code 5005)
 * before its operation runs; it used to answer HTTP 200 with an empty body. The production {@link GidService}, over a mocked
 * {@link ApplicationRepository}, and the production controllers run in the {@link ContractTestClient} harness, with every
 * other collaborator of the controller mocked.
 *
 * <p>The 22 call sites are sent on the shortest mount ({@link EndpointContract#exchange}), with the endpoint's D1 body where it
 * takes one, valid roles, bundle ids without a hyphen (passed through by the bundle converter, which runs first) and a
 * permission id, which the controller passes on as given; the second mount is sent for one application and one datasource
 * route. A known gid is the control: it reaches the operation with the
 * converted object id.
 *
 * <p>The no-interaction check covers the collaborators the controller's single constructor takes (Lombok's
 * {@code @RequiredArgsConstructor}), other than {@link GidService}: the test first asserts that shape (exactly one declared
 * constructor, no {@code @Autowired} field or method up the class hierarchy), so a controller that gains another way of
 * injecting fails here instead of being checked only in part.
 *
 * <p>Limits: the security filter chain is absent (the harness's own limit), so the answer is the controller's, for a request
 * the chain lets through; the message is checked in English only (the harness's locale); a collaborator reached through a
 * factory or a static call is not observed.
 */
class ApplicationUnknownGidAnswersTest {

    static final String TAG = "[ApplicationUnknownGidAnswersTest] ";
    /** Has a hyphen, so {@code FieldName.isGID} takes it for a gid. */
    static final String UNKNOWN_GID = "unknown-application-gid";
    static final String KNOWN_GID = "known-application-gid";
    static final String OBJECT_ID = "65a1b2c3d4e5f60718293a4c";
    static final String PERMISSION_ID = "ApplicationUnknownGidAnswersTest.permissionId";
    static final String BUNDLE_ID = "ApplicationUnknownGidAnswersTest.bundleId";
    static final String OTHER_BUNDLE_ID = "ApplicationUnknownGidAnswersTest.otherBundleId";
    static final String CANT_FIND_APPLICATION_KEY = "CANT_FIND_APPLICATION";
    static final String GID_SERVICE_BEAN_NAME = "gidService";
    static final String APP_ID_PARAM = "appId";
    static final String FROM_BUNDLE_ID_PARAM = "fromBundleId";
    static final String TO_BUNDLE_ID_PARAM = "toBundleId";
    static final int CALL_SITE_COUNT = 22;
    static final EndpointContract APPLICATIONS = new EndpointContract(ApplicationEndpoints.class);
    static final EndpointContract BUNDLES = new EndpointContract(BundleEndpoints.class);
    static final EndpointContract DATASOURCES = new EndpointContract(DatasourceEndpoints.class);
    /** The service each controller's operations call; it must be among the collaborators checked. */
    static final Map<Class<?>, Class<?>> OPERATION_SERVICES = Map.of(
            ApplicationController.class, ApplicationApiService.class,
            BundleController.class, BundleApiService.class,
            DatasourceController.class, DatasourceApiService.class);

    /** One controller method that converts an application id: how to send a request to it. */
    record CallSite(String label, Class<?> controller, EndpointContract contract, String method, Map<String, Object> query,
                    Class<?> d1Body, Object[] uriVariables) {
    }

    static Stream<Arguments> callSites() {
        return callSiteList().stream().map(callSite -> Arguments.of(Named.of(callSite.label(), callSite)));
    }

    private static List<CallSite> callSiteList() {
        Object[] gid = {UNKNOWN_GID};
        Object[] gidAndPermission = {UNKNOWN_GID, PERMISSION_ID};
        Object[] none = {};
        Map<String, Object> noQuery = Map.of();
        Map<String, Object> appIdQuery = Map.of(APP_ID_PARAM, UNKNOWN_GID);
        return List.of(
                application("recycle", null, gid),
                application("restore", null, gid),
                application("delete", null, gid),
                application("getEditingApplication", null, gid),
                application("getPublishedApplication", null, gid),
                application("getPublishedMarketPlaceApplication", null, gid),
                application("getAgencyProfileApplication", null, gid),
                application("update", Application.class, gid),
                application("publish", null, gid),
                application("updateEditState", UpdateEditStateRequest.class, gid),
                application("updatePermission", UpdatePermissionRequest.class, gidAndPermission),
                application("removePermission", null, gidAndPermission),
                application("grantPermission", BatchAddPermissionRequest.class, gid),
                application("getApplicationPermissions", null, gid),
                application("setApplicationPublicToAll", ApplicationPublicToAllRequest.class, gid),
                application("setApplicationPublicToMarketplace", ApplicationPublicToMarketplaceRequest.class, gid),
                application("setApplicationAsAgencyProfile", ApplicationAsAgencyProfileRequest.class, gid),
                application("getGroupsOrMembersWithoutPermissions", null, gid),
                new CallSite("BundleEndpoints#moveApp", BundleController.class, BUNDLES, "moveApp",
                        Map.of(FROM_BUNDLE_ID_PARAM, BUNDLE_ID, TO_BUNDLE_ID_PARAM, OTHER_BUNDLE_ID), null, gid),
                new CallSite("BundleEndpoints#addApp", BundleController.class, BUNDLES, "addApp",
                        Map.of(TO_BUNDLE_ID_PARAM, BUNDLE_ID), null, gid),
                new CallSite("DatasourceEndpoints#listJsDatasourcePlugins", DatasourceController.class, DATASOURCES,
                        "listJsDatasourcePlugins", appIdQuery, null, none),
                new CallSite("DatasourceEndpoints#listAppDataSources", DatasourceController.class, DATASOURCES,
                        "listAppDataSources", appIdQuery, null, none));
    }

    private static CallSite application(String method, Class<?> d1Body, Object[] uriVariables) {
        return new CallSite("ApplicationEndpoints#" + method, ApplicationController.class, APPLICATIONS, method, Map.of(), d1Body,
                uriVariables);
    }

    /** The table names every call site once: 22 labels and 22 controller methods, none twice. */
    @Test
    void theCallSiteTableHasEachCallSiteOnce() {
        List<CallSite> sites = callSiteList();
        Set<String> labels = sites.stream().map(CallSite::label).collect(Collectors.toSet());
        Set<String> methods = sites.stream().map(site -> site.controller().getSimpleName() + "#" + site.method()).collect(Collectors.toSet());
        System.out.println(TAG + sites.size() + " call sites: " + labels);
        assertThat(sites).hasSize(CALL_SITE_COUNT);
        assertThat(labels).hasSize(CALL_SITE_COUNT);
        assertThat(methods).hasSize(CALL_SITE_COUNT);
    }

    /** (2a) NEW-30: an unknown application gid is CANT_FIND_APPLICATION at every call site, and the operation is not reached. */
    @ParameterizedTest
    @MethodSource("callSites")
    void anUnknownApplicationGidIsNotFoundNEW30(CallSite callSite) {
        System.out.println(TAG + "call site " + callSite.label());
        ApplicationRepository applications = unknownGidRepository();
        List<Class<?>> collaborators = constructorCollaborators(callSite.controller());
        try (ContractTestClient client = client(callSite.controller(), applications)) {
            EntityExchangeResult<byte[]> result = callSite.contract().exchange(client, callSite.method(), callSite.query(),
                    callSite.d1Body() == null ? null : EndpointContract.d1(callSite.d1Body()), callSite.uriVariables());
            labelled(callSite.label(), () -> {
                assertRefused(result);
                assertConvertedOnce(applications, UNKNOWN_GID);
                assertNoInteraction(client, collaborators);
            });
            System.out.println(TAG + callSite.label() + " -> " + result.getStatus().value() + ", collaborators untouched: "
                    + collaborators.stream().map(Class::getSimpleName).toList());
        }
    }

    static Stream<Arguments> secondMounts() {
        return Stream.of(
                Arguments.of(NewUrl.APPLICATION_URL + "/" + UNKNOWN_GID, ApplicationController.class),
                Arguments.of(Url.APPLICATION_URL + "/" + UNKNOWN_GID, ApplicationController.class),
                Arguments.of(NewUrl.DATASOURCE_URL + "/listByApp?" + APP_ID_PARAM + "=" + UNKNOWN_GID, DatasourceController.class),
                Arguments.of(Url.DATASOURCE_URL + "/listByApp?" + APP_ID_PARAM + "=" + UNKNOWN_GID, DatasourceController.class));
    }

    /** (2b) The class-level mappings hold both mounts: the editing view and {@code listByApp} answer the same on each. */
    @ParameterizedTest
    @MethodSource("secondMounts")
    void bothMountsAnswerAnUnknownApplicationGidAsNotFoundNEW30(String uri, Class<?> controller) {
        ApplicationRepository applications = unknownGidRepository();
        List<Class<?>> collaborators = constructorCollaborators(controller);
        try (ContractTestClient client = client(controller, applications)) {
            EntityExchangeResult<byte[]> result = client.web().get().uri(uri).exchange().expectBody().returnResult();
            labelled(uri, () -> {
                assertRefused(result);
                assertConvertedOnce(applications, UNKNOWN_GID);
                assertNoInteraction(client, collaborators);
            });
            System.out.println(TAG + "GET " + uri + " -> " + result.getStatus().value() + " " + new String(result.getResponseBodyContent()));
        }
    }

    /** (2c) Control: a known gid is converted to the application's object id, which the operation receives. */
    @Test
    void aKnownApplicationGidReachesTheOperationWithTheObjectId() {
        ApplicationRepository applications = Mockito.mock(ApplicationRepository.class);
        Application application = new Application();
        ReflectionTestUtils.setField(application, "id", OBJECT_ID);
        Mockito.when(applications.findBySlug(KNOWN_GID)).thenReturn(Flux.empty());
        Mockito.when(applications.findByGid(KNOWN_GID)).thenReturn(Flux.just(application));
        try (ContractTestClient client = client(ApplicationController.class, applications)) {
            ApplicationApiService service = client.bean(ApplicationApiService.class);
            Mockito.when(service.getEditingApplication(Mockito.eq(OBJECT_ID), isNull())).thenReturn(Mono.just(ApplicationSamples.applicationView()));
            Mockito.when(service.updateUserApplicationLastViewTime(anyString())).thenReturn(Mono.empty());
            EntityExchangeResult<byte[]> result = APPLICATIONS.exchange(client, "getEditingApplication", Map.of(), null, KNOWN_GID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(ApplicationView.class)));
            Mockito.verify(service).getEditingApplication(Mockito.eq(OBJECT_ID), isNull());
            System.out.println(TAG + "known gid " + KNOWN_GID + " -> getEditingApplication(" + OBJECT_ID + ") -> " + result.getStatus().value());
        }
    }

    /** A repository in which {@link #UNKNOWN_GID} is neither a slug nor a gid. */
    private static ApplicationRepository unknownGidRepository() {
        ApplicationRepository applications = Mockito.mock(ApplicationRepository.class);
        Mockito.when(applications.findBySlug(UNKNOWN_GID)).thenReturn(Flux.empty());
        Mockito.when(applications.findByGid(UNKNOWN_GID)).thenReturn(Flux.empty());
        return applications;
    }

    /** The production {@link GidService} over {@code applications}, and {@code controller} with its other collaborators mocked. */
    private static ContractTestClient client(Class<?> controller, ApplicationRepository applications) {
        GidService gidService = new GidService();
        ReflectionTestUtils.setField(gidService, "applicationRepository", applications);
        return ContractTestClient.builder().singleton(GID_SERVICE_BEAN_NAME, gidService)
                .controllerWithMockedDependencies(controller).build();
    }

    /**
     * The collaborators of {@code controller} other than {@link GidService}, after asserting the shape this check relies on: one
     * declared constructor and no {@code @Autowired} field or method in the class or its superclasses.
     */
    private static List<Class<?>> constructorCollaborators(Class<?> controller) {
        Constructor<?>[] constructors = controller.getDeclaredConstructors();
        assertThat(constructors).as(controller.getSimpleName() + " declares one constructor").hasSize(1);
        for (Class<?> c = controller; c != null && c != Object.class; c = c.getSuperclass()) {
            assertThat(Arrays.stream(c.getDeclaredFields()).filter(field -> field.isAnnotationPresent(Autowired.class)).toList())
                    .as(c.getSimpleName() + " has no @Autowired field").isEmpty();
            assertThat(Arrays.stream(c.getDeclaredMethods()).filter(method -> method.isAnnotationPresent(Autowired.class)).toList())
                    .as(c.getSimpleName() + " has no @Autowired method").isEmpty();
        }
        List<Class<?>> collaborators = Arrays.stream(constructors[0].getParameterTypes())
                .filter(type -> type != GidService.class).distinct().toList();
        assertThat(collaborators).as(controller.getSimpleName() + " collaborators").contains(OPERATION_SERVICES.get(controller));
        return collaborators;
    }

    private static void assertRefused(EntityExchangeResult<byte[]> result) {
        EndpointContract.assertBizError(result, BizError.NO_RESOURCE_FOUND, CANT_FIND_APPLICATION_KEY, UNKNOWN_GID);
    }

    private static void assertConvertedOnce(ApplicationRepository applications, String gid) {
        Mockito.verify(applications).findBySlug(gid);
        Mockito.verify(applications).findByGid(gid);
    }

    private static void assertNoInteraction(ContractTestClient client, List<Class<?>> collaborators) {
        Set<Object> mocks = new HashSet<>();
        collaborators.forEach(type -> mocks.add(client.bean(type)));
        mocks.forEach(Mockito::verifyNoInteractions);
    }

    /** Runs {@code assertions}; a failure is rethrown with {@code label} first in its message, for the HEAD-red check. */
    private static void labelled(String label, Runnable assertions) {
        try {
            assertions.run();
        } catch (AssertionError failure) {
            throw new AssertionError("[" + label + "] " + failure.getMessage(), failure);
        }
    }
}
