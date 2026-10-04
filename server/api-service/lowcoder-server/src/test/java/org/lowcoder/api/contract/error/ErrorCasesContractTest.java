package org.lowcoder.api.contract.error;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.api.application.ApplicationController;
import org.lowcoder.api.application.ApplicationApiService;
import org.lowcoder.api.authentication.AuthenticationController;
import org.lowcoder.api.authentication.service.AuthenticationApiService;
import org.lowcoder.api.bundle.BundleApiService;
import org.lowcoder.api.bundle.BundleController;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.PayloadTypeWalker;
import org.lowcoder.api.contract.support.PayloadTypeWalker.Direction;
import org.lowcoder.api.contract.support.PayloadTypeWalker.PayloadType;
import org.lowcoder.api.datasource.DatasourceApiService;
import org.lowcoder.api.datasource.DatasourceController;
import org.lowcoder.api.framework.exception.ApiPerfHelper;
import org.lowcoder.api.framework.service.GlobalContextService;
import org.lowcoder.api.home.FolderApiService;
import org.lowcoder.api.home.FolderController;
import org.lowcoder.api.material.MaterialApiService;
import org.lowcoder.api.material.MaterialController;
import org.lowcoder.api.usermanagement.OrgApiService;
import org.lowcoder.api.usermanagement.OrganizationController;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.bundle.model.BundleStatus;
import org.lowcoder.domain.datasource.model.DatasourceStatus;
import org.lowcoder.domain.material.model.MaterialType;
import org.lowcoder.domain.organization.model.OrganizationState;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.util.ExceptionUtils;
import org.lowcoder.sdk.util.JsonUtils;
import org.lowcoder.sdk.util.LocaleUtils;
import org.mockito.Mockito;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.RequestPath;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.WebFilter;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The error cases X1–X7 of docs/API_PAYLOAD_TEST_PLAN.md §5.3, through the production codecs and exception handling
 * of the harness (§5.1), against the real controllers with mocked collaborators.
 *
 * <ul>
 *   <li><b>X1, X2</b> (malformed JSON, a JSON array for an object body) for the three decode representatives: a POJO
 *       ({@code FolderEndpoints#create}), a record ({@code ApplicationEndpoints#create}) and a map type
 *       ({@code AuthenticationEndpoints#enableAuthConfig}).</li>
 *   <li><b>X3</b> (unknown enum constant): one endpoint per enum type that a request body can carry;
 *       {@link #everyRequestEnumHasAnX3Endpoint} fails when the walker finds one without.</li>
 *   <li><b>X4</b>: a {@code BizException} from the service mock.</li>
 *   <li><b>X5–X7</b>: an unmapped path, a web filter failing with a {@code RuntimeException}, and one failing with
 *       {@code ResponseStatusException(403)}; their full bodies are pinned in {@code json-contract/errors/}.</li>
 * </ul>
 *
 * <p>X1–X4 assert the status, the {@code code}, {@code success: false} and the {@code message}; X1–X3 also that the
 * controller's service was never called, so the failure is the decoding. A body that cannot be decoded is answered with
 * {@code INVALID_PARAMETER}'s declared HTTP 500 and code 5002, not 400 (pinned, plan §9 O12).
 *
 * <p>Which handler wrote each case is observed through the harness's mocks, not assumed: {@code GlobalExceptionHandler}
 * calls {@code ApiPerfHelper#perf} and never {@code GlobalContextService#getClientLocale}; the
 * {@code CustomErrorWebExceptionHandler} 5xx branch calls both; its 4xx branch calls neither. X1–X3 are further told
 * apart from {@code catchWebExchangeBindException}, which also answers {@code INVALID_PARAMETER}, by the message: it
 * must be the {@code INVALID_PARAMETER_PLZ_CHECK} text of {@code catchServerWebInputException}, naming the controller.
 * Limits: the reason inside that text (Spring's parameter and method names) is not pinned.
 */
class ErrorCasesContractTest {

    static final String CODE = "code";
    static final String MESSAGE = "message";
    static final String SUCCESS = "success";
    static final String MALFORMED_JSON = "{\"name\": ";
    static final String WRONG_JSON_TYPE = "[]";
    static final String UNKNOWN_CONSTANT = "X3_UNKNOWN_CONSTANT";
    static final String UNMAPPED_PATH = "/api/x5-no-such-endpoint";
    static final String FAILING_FILTER_PATH = "/api/x6-failing-filter";
    static final String REJECTING_FILTER_PATH = "/api/x7-rejecting-filter";
    static final String ERRORS = "errors/";
    /** {@code GlobalExceptionHandler}'s locale in the harness: the request's, {@code en_US} by default (§5.1). */
    static final Locale REQUEST_LOCALE = Locale.US;
    static final String DECODE_MESSAGE_KEY = "INVALID_PARAMETER_PLZ_CHECK";
    static final String REASON_PLACEHOLDER = "<X1-X3 reason>";
    /** {@code catchServerWebInputException}'s reason: {@code <parameter>' : <Controller>.<method>}. */
    static final String REASON_CONTROLLER_SEPARATOR = "' : ";

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    /** An endpoint with a request body: its controller, method, path and the service that must not be reached. */
    record BodyEndpoint(String name, Class<?> controller, HttpMethod method, String path, Class<?> service) {
        @Override
        public String toString() {
            return name;
        }
    }

    /** An X3 endpoint: the enum, and a body that sets one property of that enum type to an unknown constant. */
    record EnumEndpoint(Class<? extends Enum<?>> enumType, BodyEndpoint endpoint, String property) {
        @Override
        public String toString() {
            return enumType.getSimpleName() + " via " + endpoint.name();
        }
    }

    static Stream<BodyEndpoint> representatives() {
        return Stream.of(
                new BodyEndpoint("POJO FolderEndpoints#create", FolderController.class, HttpMethod.POST, NewUrl.FOLDER_URL, FolderApiService.class),
                new BodyEndpoint("record ApplicationEndpoints#create", ApplicationController.class, HttpMethod.POST, NewUrl.APPLICATION_URL,
                        ApplicationApiService.class),
                new BodyEndpoint("map AuthenticationEndpoints#enableAuthConfig", AuthenticationController.class, HttpMethod.POST,
                        NewUrl.CUSTOM_AUTH + "/config", AuthenticationApiService.class));
    }

    static Stream<EnumEndpoint> enumEndpoints() {
        return Stream.of(
                new EnumEndpoint(ApplicationStatus.class, new BodyEndpoint("ApplicationEndpoints#update", ApplicationController.class,
                        HttpMethod.PUT, NewUrl.APPLICATION_URL + "/X3.applicationId", ApplicationApiService.class), "applicationStatus"),
                new EnumEndpoint(BundleStatus.class, new BodyEndpoint("BundleEndpoints#update", BundleController.class, HttpMethod.PUT,
                        NewUrl.BUNDLE_URL, BundleApiService.class), "bundleStatus"),
                new EnumEndpoint(DatasourceStatus.class, new BodyEndpoint("DatasourceEndpoints#create", DatasourceController.class,
                        HttpMethod.POST, NewUrl.DATASOURCE_URL, DatasourceApiService.class), "status"),
                new EnumEndpoint(MaterialType.class, new BodyEndpoint("MaterialEndpoints#upload", MaterialController.class, HttpMethod.POST,
                        NewUrl.MATERIAL_URL, MaterialApiService.class), "type"),
                new EnumEndpoint(OrganizationState.class, new BodyEndpoint("OrganizationEndpoints#create", OrganizationController.class,
                        HttpMethod.POST, NewUrl.ORGANIZATION_URL, OrgApiService.class), "state"));
    }

    @ParameterizedTest(name = "X1 {0}")
    @MethodSource("representatives")
    void x1MalformedJson(BodyEndpoint endpoint) throws IOException {
        assertDecodingRejected(endpoint, MALFORMED_JSON);
    }

    @ParameterizedTest(name = "X2 {0}")
    @MethodSource("representatives")
    void x2WrongJsonType(BodyEndpoint endpoint) throws IOException {
        assertDecodingRejected(endpoint, WRONG_JSON_TYPE);
    }

    @ParameterizedTest(name = "X3 {0}")
    @MethodSource("enumEndpoints")
    void x3UnknownEnumConstant(EnumEndpoint endpoint) throws IOException {
        assertDecodingRejected(endpoint.endpoint(), "{\"" + endpoint.property() + "\": \"" + UNKNOWN_CONSTANT + "\"}");
    }

    @Test
    void everyRequestEnumHasAnX3Endpoint() {
        Set<String> requestEnums = PayloadTypeWalker.walkCompiledApi().types().values().stream()
                .filter(type -> type.type().isEnum() && type.directions().contains(Direction.REQUEST))
                .map(PayloadType::type).map(Class::getName).collect(Collectors.toCollection(TreeSet::new));
        Set<String> covered = enumEndpoints().map(endpoint -> endpoint.enumType().getName()).collect(Collectors.toCollection(TreeSet::new));
        System.out.println("[ErrorCasesContractTest] request enums " + requestEnums);
        assertThat(covered).isEqualTo(requestEnums);
    }

    @Test
    void x4BizExceptionFromTheService() throws IOException {
        ContractTestClient.Builder builder = ContractTestClient.builder();
        Mockito.when(builder.mock(FolderApiService.class).create(Mockito.any()))
                .thenReturn(ExceptionUtils.ofError(BizError.FOLDER_NAME_CONFLICT, BizError.FOLDER_NAME_CONFLICT.name()));
        try (ContractTestClient client = builder.controllerWithMockedDependencies(FolderController.class).build()) {
            EntityExchangeResult<byte[]> result = exchange(client, HttpMethod.POST, NewUrl.FOLDER_URL, "{}");
            String message = assertError(result, HttpStatus.valueOf(BizError.FOLDER_NAME_CONFLICT.getHttpErrorCode()),
                    BizError.FOLDER_NAME_CONFLICT.getBizErrorCode());
            assertThat(message).isEqualTo(new BizException(BizError.FOLDER_NAME_CONFLICT, BizError.FOLDER_NAME_CONFLICT.name())
                    .getMessage(REQUEST_LOCALE));
            assertWrittenByGlobalExceptionHandler(client, BizError.FOLDER_NAME_CONFLICT, NewUrl.FOLDER_URL);
        }
    }

    @Test
    void x5UnmappedPathIsWrittenByTheGlobalExceptionHandler() throws IOException {
        try (ContractTestClient client = ContractTestClient.builder().build()) {
            EntityExchangeResult<byte[]> result = exchange(client, HttpMethod.GET, UNMAPPED_PATH, null);
            assertPinned("X5.unmapped-path", result, HttpStatus.INTERNAL_SERVER_ERROR);
            assertWrittenByGlobalExceptionHandler(client, BizError.INTERNAL_SERVER_ERROR, UNMAPPED_PATH);
        }
    }

    @BoundarySites("lowcoder-server/src/main/java/org/lowcoder/api/framework/exception/CustomErrorWebExceptionHandler.java#CustomErrorWebExceptionHandler.render#BodyInserters.fromValue#2")
    @Test
    void x6FilterRuntimeExceptionReachesTheErrorHandler5xxBranch() throws IOException {
        try (ContractTestClient client = ContractTestClient.builder().webFilter(failingFilter()).build()) {
            EntityExchangeResult<byte[]> result = exchange(client, HttpMethod.GET, FAILING_FILTER_PATH, null);
            assertPinned("X6.filter-runtime-exception", result, HttpStatus.INTERNAL_SERVER_ERROR);
            Mockito.verify(client.bean(GlobalContextService.class)).getClientLocale(Mockito.any(ServerRequest.class));
            // CustomErrorWebExceptionHandler#parseBizException maps an exception it does not know to INTERNAL_SERVER_ERROR
            assertPerfRecorded(client, BizError.INTERNAL_SERVER_ERROR, FAILING_FILTER_PATH);
        }
    }

    @BoundarySites("lowcoder-server/src/main/java/org/lowcoder/api/framework/exception/CustomErrorWebExceptionHandler.java#CustomErrorWebExceptionHandler.render#BodyInserters.fromValue#1")
    @Test
    void x7FilterResponseStatus403ReachesTheErrorHandler4xxBranch() throws IOException {
        try (ContractTestClient client = ContractTestClient.builder().webFilter(failingFilter()).build()) {
            EntityExchangeResult<byte[]> result = exchange(client, HttpMethod.GET, REJECTING_FILTER_PATH, null);
            assertPinned("X7.filter-response-status-403", result, HttpStatus.FORBIDDEN);
            Mockito.verify(client.bean(GlobalContextService.class), Mockito.never()).getClientLocale(Mockito.any(ServerRequest.class));
            Mockito.verifyNoInteractions(client.bean(ApiPerfHelper.class));
        }
    }

    private static WebFilter failingFilter() {
        return (exchange, chain) -> switch (exchange.getRequest().getPath().value()) {
            case FAILING_FILTER_PATH -> Mono.error(new IllegalStateException("X6 filter failure"));
            case REJECTING_FILTER_PATH -> Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN));
            default -> chain.filter(exchange);
        };
    }

    /**
     * X1–X3: the declared status of {@code INVALID_PARAMETER} (500, not 400: {@code BizError} declares it so) with its
     * code 5002, written by {@code catchServerWebInputException} for a parameter of the endpoint's controller, and the
     * service behind the controller never called.
     */
    private static void assertDecodingRejected(BodyEndpoint endpoint, String body) throws IOException {
        try (ContractTestClient client = ContractTestClient.builder().controllerWithMockedDependencies(endpoint.controller()).build()) {
            EntityExchangeResult<byte[]> result = exchange(client, endpoint.method(), endpoint.path(), body);
            String message = assertError(result, HttpStatus.valueOf(BizError.INVALID_PARAMETER.getHttpErrorCode()),
                    BizError.INVALID_PARAMETER.getBizErrorCode());
            String[] template = LocaleUtils.getMessage(REQUEST_LOCALE, DECODE_MESSAGE_KEY, REASON_PLACEHOLDER)
                    .split(Pattern.quote(REASON_PLACEHOLDER), -1);
            assertThat(message).as(DECODE_MESSAGE_KEY + " text naming " + endpoint.controller().getSimpleName())
                    .startsWith(template[0]).endsWith(template[1])
                    .contains(REASON_CONTROLLER_SEPARATOR + endpoint.controller().getSimpleName() + ".");
            assertWrittenByGlobalExceptionHandler(client, BizError.INVALID_PARAMETER, endpoint.path());
            Mockito.verifyNoInteractions(client.bean(endpoint.service()));
        }
    }

    /** {@code GlobalExceptionHandler} recorded {@code error} for {@code path}; the error handler's 5xx branch did not run. */
    private static void assertWrittenByGlobalExceptionHandler(ContractTestClient client, BizError error, String path) {
        assertPerfRecorded(client, error, path);
        Mockito.verify(client.bean(GlobalContextService.class), Mockito.never()).getClientLocale(Mockito.any(ServerRequest.class));
    }

    /** {@code ApiPerfHelper#perf} was called once, with {@code error} and the request path {@code path}. */
    private static void assertPerfRecorded(ContractTestClient client, BizError error, String path) {
        Mockito.verify(client.bean(ApiPerfHelper.class))
                .perf(Mockito.eq(error), Mockito.argThat((RequestPath requestPath) -> requestPath.value().equals(path)));
    }

    /** Asserts the error envelope and returns its {@code message}. */
    private static String assertError(EntityExchangeResult<byte[]> result, HttpStatus status, int code) throws IOException {
        JsonNode body = JsonUtils.getObjectMapper().readTree(result.getResponseBody());
        System.out.println("[ErrorCasesContractTest] " + result.getMethod() + " " + result.getUrl().getPath() + " -> "
                + result.getStatus().value() + " " + body);
        assertThat(result.getStatus().value()).isEqualTo(status.value());
        assertThat(body.path(CODE).isInt()).as("code is a JSON integer").isTrue();
        assertThat(body.path(CODE).intValue()).isEqualTo(code);
        assertThat(body.path(SUCCESS).isBoolean() && !body.path(SUCCESS).booleanValue()).as("success is false").isTrue();
        assertThat(body.path(MESSAGE).asText()).isNotBlank();
        return body.path(MESSAGE).asText();
    }

    private static void assertPinned(String errorCase, EntityExchangeResult<byte[]> result, HttpStatus status) {
        String body = new String(result.getResponseBody(), StandardCharsets.UTF_8);
        System.out.println("[ErrorCasesContractTest] " + errorCase + ": " + result.getStatus().value() + " "
                + result.getResponseHeaders().getContentType() + " " + body);
        assertThat(result.getStatus().value()).isEqualTo(status.value());
        assertThat(result.getResponseHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_JSON);
        GOLDEN.assertJson(ERRORS + errorCase + ".json", body);
    }

    private static EntityExchangeResult<byte[]> exchange(ContractTestClient client, HttpMethod method, String path, String body) {
        var request = client.web().method(method).uri(path).accept(MediaType.APPLICATION_JSON);
        var spec = body == null ? request.exchange() : request.contentType(MediaType.APPLICATION_JSON).bodyValue(body).exchange();
        return spec.expectBody().returnResult();
    }
}
