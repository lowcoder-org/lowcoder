package org.lowcoder.api.contract.support;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.lowcoder.api.contract.support.ContractRegistry.Row;
import org.lowcoder.api.contract.support.PayloadTypeWalker.Endpoint;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.sdk.contract.CanonicalJson;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.reactive.function.BodyInserters;

import java.lang.reflect.Method;
import java.nio.file.Files;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The per-endpoint part of the codec-level tests (docs/API_PAYLOAD_TEST_PLAN.md §5.2), shared by the
 * {@code <Declaration>ContractTest} classes of {@value ContractRegistry#TEST_PACKAGE}:
 *
 * <ul>
 *   <li><b>Request:</b> {@link #exchange} sends the real HTTP method of a declaration method to its {@code /api}
 *       path, with the JSON body as given (a D1 golden, {@link #d1}) or a multipart body ({@link #exchangeMultipart}),
 *       and with a header or cookie added where the controller reads one ({@link #exchangeWith}),
 *       through a {@link ContractTestClient}, and records the endpoint as exercised. A captured request argument is compared with D1's rules,
 *       {@link PayloadAssertions#assertBindsTo}.</li>
 *   <li><b>Response:</b> the expected body is an envelope golden of {@code envelope/} with its {@code data} replaced
 *       by the S1 golden text of the payload ({@link #s1}) and its paging fields set ({@link #success}, {@link #page},
 *       {@link #error}, {@link #redirect}). The data is spliced in as text, so its number lexemes and duplicate keys
 *       stay as pinned. {@link #assertResponse} checks the status, a JSON {@code Content-Type}, and the body
 *       canonically; {@link #assertBizError} the answer to a {@code BizException}, and {@link #assertEmptyResponse} the
 *       answer to an empty {@code Mono}.</li>
 *   <li><b>Completeness:</b> {@link #assertComplete} fails unless every registry row planned for the test class was
 *       exercised, has its stubbing group, and every response-branch name of its {@code branches} column is a test
 *       method of the class. Branch names are therefore test method names.</li>
 * </ul>
 *
 * <p>Routes come from the declaration's mapping annotations: the HTTP method of the method's mapping, and the shortest
 * class-level path (a declaration mapped to both {@code /api/v1/...} and {@code /api/...} is called on the latter).
 * Limits: an overloaded method name must be addressed by the walker's endpoint key ({@link #key}); "exercised" means
 * a request was sent, not that its assertions passed (the test's own failure reports that); and a branch's test method
 * is matched by name only, so that the test drives the branch its name says is the reviewer's check, not this one's.
 */
public final class EndpointContract {

    /** The locale of a request without a {@code lang} parameter (the production {@code localeContextResolver}). */
    public static final Locale REQUEST_LOCALE = Locale.US;
    public static final String ENVELOPE_SUCCESS = "envelope/ResponseView.success.json";
    public static final String ENVELOPE_PAGE = "envelope/PageResponseView.success.json";
    public static final String ENVELOPE_ERROR = "envelope/ResponseView.error.json";
    public static final String ENVELOPE_ERROR_WITH_DATA = "envelope/ResponseView.error-with-data.json";
    public static final String ENVELOPE_REDIRECT = "envelope/ResponseView.redirect.json";
    public static final String ENVELOPE_GROUP_LIST = "envelope/GroupListResponseView.success.json";
    /** The {@code message} of {@code ResponseView.success(code, data)}. */
    public static final String NO_MESSAGE = "";
    public static final String DATA = "data";
    public static final String SUCCESS = "success";
    public static final String CODE = "code";
    public static final String MESSAGE = "message";
    public static final String PAGE_NUM = "pageNum";
    public static final String PAGE_SIZE = "pageSize";
    public static final String TOTAL = "total";
    public static final String TOTAL_ADMINS = "totalAdmins";
    public static final String TOTAL_ADMINS_AND_DEVELOPERS = "totalAdminsAndDevelopers";
    public static final String TOTAL_DEVELOPERS_ONLY = "totalDevelopersOnly";
    public static final String TOTAL_OTHER_MEMBERS = "totalOtherMembers";
    public static final String S1 = "S1";
    public static final String D1 = "D1";
    private static final String TYPES = "types/";
    /** Stands for the payload while the envelope is written; replaced, quotes included, by the payload's text. */
    private static final String PATH_SEPARATOR = "/";
    private static final String DATA_PLACEHOLDER = "@@endpoint-contract-data@@";
    /** {@link #exchange}'s request: sent as built. */
    private static final Consumer<WebTestClient.RequestBodySpec> NO_CHANGE = request -> {
    };

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    private final Class<?> declaration;
    /** The walker's endpoints of the declaration, by key. */
    private final Map<String, Endpoint> endpoints;
    private final Set<String> exercised = ConcurrentHashMap.newKeySet();

    /** The endpoints of {@code declaration} as the walker lists them. */
    public EndpointContract(Class<?> declaration) {
        this.declaration = declaration;
        this.endpoints = ClosureHolder.CLOSURE.endpoints().stream().filter(endpoint -> endpoint.declaration() == declaration)
                .collect(Collectors.toMap(Endpoint::key, endpoint -> endpoint));
    }

    /**
     * The walker's key of the endpoint {@code method}: a method name, or for an overloaded name the key itself
     * ({@code <Declaration>#<method>(<parameter types>)}).
     */
    public String key(String method) {
        return endpoint(method).key();
    }

    /**
     * Sends a request to the endpoint named {@code method}: its HTTP method, its path with {@code uriVariables} and
     * {@code query} as query parameters, and {@code jsonBody} (none when {@code null}) as {@code application/json}.
     */
    public EntityExchangeResult<byte[]> exchange(ContractTestClient client, String method, Map<String, ?> query, String jsonBody,
            Object... uriVariables) {
        return exchangeWith(client, method, NO_CHANGE, query, jsonBody, uriVariables);
    }

    /**
     * {@link #exchange} with the request changed by {@code requestChange} before it is sent: a header (a forwarded
     * client address) or a cookie (a session), for controllers that read them. A cookie must be set with
     * {@code cookie(name, value)}: the harness request takes its cookies from there, not from a {@code Cookie} header.
     */
    public EntityExchangeResult<byte[]> exchangeWith(ContractTestClient client, String method, Consumer<WebTestClient.RequestBodySpec> requestChange,
            Map<String, ?> query, String jsonBody, Object... uriVariables) {
        WebTestClient.RequestBodySpec request = request(client, method, query, uriVariables);
        requestChange.accept(request);
        WebTestClient.RequestHeadersSpec<?> withBody = jsonBody == null ? request
                : request.contentType(MediaType.APPLICATION_JSON).bodyValue(jsonBody.getBytes(StandardCharsets.UTF_8));
        return send(withBody, jsonBody == null ? "" : " body " + jsonBody.length() + " chars");
    }

    /**
     * {@link #exchange} with a {@code multipart/form-data} body of {@code parts} (§5.2: a real multipart body, so that
     * the controller receives the {@code Part} the production multipart reader builds).
     */
    public EntityExchangeResult<byte[]> exchangeMultipart(ContractTestClient client, String method, Map<String, ?> query,
            MultiValueMap<String, HttpEntity<?>> parts, Object... uriVariables) {
        WebTestClient.RequestBodySpec request = request(client, method, query, uriVariables);
        return send(request.contentType(MediaType.MULTIPART_FORM_DATA).body(BodyInserters.fromMultipartData(parts)),
                " multipart " + parts.keySet());
    }

    /** {@link #exchange} without a body, with the cookie {@code cookieName} set to {@code cookieValue} (a session cookie). */
    public EntityExchangeResult<byte[]> exchangeWithCookie(ContractTestClient client, String method, Map<String, ?> query, String cookieName,
            String cookieValue, Object... uriVariables) {
        return send(request(client, method, query, uriVariables).cookie(cookieName, cookieValue), " cookie " + cookieName);
    }

    private WebTestClient.RequestBodySpec request(ContractTestClient client, String method, Map<String, ?> query, Object... uriVariables) {
        Endpoint endpoint = endpoint(method);
        RequestMapping mapping = AnnotatedElementUtils.findMergedAnnotation(endpoint.method(), RequestMapping.class);
        HttpMethod httpMethod = HttpMethod.valueOf(mapping.method()[0].name());
        String path = basePath() + (mapping.path().length == 0 ? "" : withLeadingSlash(mapping.path()[0]));
        exercised.add(endpoint.key());
        return client.web().method(httpMethod).uri(builder -> {
            builder.path(path);
            query.forEach((name, value) -> builder.queryParam(name, value));
            return builder.build(uriVariables);
        });
    }

    private static EntityExchangeResult<byte[]> send(WebTestClient.RequestHeadersSpec<?> request, String bodyNote) {
        EntityExchangeResult<byte[]> result = request.exchange().expectBody().returnResult();
        System.out.println("[EndpointContract] " + result.getMethod() + " " + result.getUrl() + bodyNote
                + " -> " + result.getStatus().value() + " " + new String(bodyOf(result), StandardCharsets.UTF_8));
        return result;
    }

    /**
     * Status, {@code Content-Type} and body bytes of an answer that is not JSON: text, an image, a proxied file. The
     * body is compared byte for byte.
     */
    public static void assertBytes(EntityExchangeResult<byte[]> result, HttpStatus status, MediaType contentType, byte[] body) {
        assertThat(result.getStatus().value()).as("status of " + result.getUrl()).isEqualTo(status.value());
        assertThat(result.getResponseHeaders().getContentType()).as("Content-Type of " + result.getUrl()).isEqualTo(contentType);
        assertThat(bodyOf(result)).as("body of " + result.getUrl()).isEqualTo(body);
    }

    /** Status, a JSON {@code Content-Type}, and the body equal to {@code expectedJson} by the §1.2 contract. */
    public static void assertResponse(EntityExchangeResult<byte[]> result, HttpStatus status, String expectedJson) {
        assertResponse(result, status, expectedJson, List.of());
    }

    /**
     * {@link #assertResponse(EntityExchangeResult, HttpStatus, String)} with the arrays at {@code unorderedPointers}
     * sorted in the body first ({@link PayloadAssertions#sortUnorderedArrays}, whose limits apply), for a payload with
     * {@link PayloadAssertions#UNORDERED_ARRAYS} ({@link #unorderedData}).
     */
    public static void assertResponse(EntityExchangeResult<byte[]> result, HttpStatus status, String expectedJson,
            List<String> unorderedPointers) {
        assertThat(result.getStatus().value()).as("status of " + result.getUrl()).isEqualTo(status.value());
        assertThat(result.getResponseHeaders().getContentType()).as("Content-Type of " + result.getUrl())
                .satisfies(type -> assertThat(type.isCompatibleWith(MediaType.APPLICATION_JSON)).isTrue());
        String body = PayloadAssertions.sortUnorderedArrays(new String(bodyOf(result), StandardCharsets.UTF_8), unorderedPointers);
        CanonicalJson.assertEquivalent(expectedJson, body);
    }

    /** The {@link PayloadAssertions#UNORDERED_ARRAYS} of {@code type} as the {@code data} of an envelope. */
    public static List<String> unorderedData(Class<?> type) {
        return PayloadAssertions.UNORDERED_ARRAYS.getOrDefault(type.getName(), List.of()).stream().map(pointer -> "/" + DATA + pointer).toList();
    }

    /** The {@code ResponseView} success envelope around {@code dataJson}. */
    public static String success(String dataJson) {
        return envelope(ENVELOPE_SUCCESS, Map.of(), dataJson);
    }

    /** The {@code PageResponseView} success envelope around {@code dataJson}, with its paging fields. */
    public static String page(String dataJson, int pageNum, int pageSize, int total) {
        return envelope(ENVELOPE_PAGE, Map.of(PAGE_NUM, pageNum, PAGE_SIZE, pageSize, TOTAL, total), dataJson);
    }

    /**
     * The {@code GroupListResponseView} success envelope around {@code dataJson}, with its counts and paging fields in the
     * order of its constructor.
     */
    public static String groupList(String dataJson, int totalAdmins, int totalAdminsAndDevelopers, int totalDevelopersOnly,
            int totalOtherMembers, int total, int pageNum, int pageSize) {
        Map<String, Integer> fields = new LinkedHashMap<>();
        fields.put(TOTAL_ADMINS, totalAdmins);
        fields.put(TOTAL_ADMINS_AND_DEVELOPERS, totalAdminsAndDevelopers);
        fields.put(TOTAL_DEVELOPERS_ONLY, totalDevelopersOnly);
        fields.put(TOTAL_OTHER_MEMBERS, totalOtherMembers);
        fields.put(TOTAL, total);
        fields.put(PAGE_NUM, pageNum);
        fields.put(PAGE_SIZE, pageSize);
        return envelope(ENVELOPE_GROUP_LIST, fields, dataJson);
    }

    /**
     * Status, {@code Content-Type} ({@code null}: none) and an empty body: what WebFlux answers when the controller's
     * {@code Mono} completes empty (with the JSON type its body would have had), a {@code Mono<Void>} endpoint answers
     * (no {@code Content-Type}), or the controller only sets a status.
     */
    public static void assertEmptyResponse(EntityExchangeResult<byte[]> result, HttpStatus status, MediaType contentType) {
        System.out.println("[EndpointContract] empty response of " + result.getUrl() + ": headers " + result.getResponseHeaders());
        assertThat(result.getStatus().value()).as("status of " + result.getUrl()).isEqualTo(status.value());
        assertThat(result.getResponseHeaders().getContentType()).as("Content-Type of " + result.getUrl()).isEqualTo(contentType);
        assertThat(bodyOf(result)).as("body of " + result.getUrl()).isEmpty();
    }

    /** The {@code ResponseView.success(BizError.REDIRECT code, data)} envelope around {@code dataJson}. */
    public static String redirect(String dataJson) {
        return envelope(ENVELOPE_REDIRECT, Map.of(MESSAGE, NO_MESSAGE), dataJson);
    }

    /**
     * The {@code ResponseView.error(code, message, data)} envelope of {@code error} around {@code dataJson}: an answer
     * the controller returns (HTTP 200), not an exception the global handler writes.
     */
    public static String errorWithData(BizError error, String message, String dataJson) {
        return envelope(ENVELOPE_ERROR_WITH_DATA, Map.of(CODE, error.getBizErrorCode(), MESSAGE, message), dataJson);
    }

    /** The {@code ResponseView} error envelope of {@code error} with {@code message}. */
    public static String error(BizError error, String message) {
        return error(error.getBizErrorCode(), message);
    }

    /**
     * The {@code ResponseView.error(code, message)} envelope, as a controller builds it (an answer it returns, not a
     * {@code BizError}). Its {@code success} is computed from the code as {@code ResponseView#isSuccess} does: true for
     * {@code ResponseView.SUCCESS} ({@code IndexController#index}) and for {@code BizError.REDIRECT}'s code, false otherwise.
     */
    public static String error(int code, String message) {
        boolean success = code == ResponseView.SUCCESS || code == BizError.REDIRECT.getBizErrorCode();
        return envelope(ENVELOPE_ERROR, Map.of(CODE, code, MESSAGE, message, SUCCESS, success), null);
    }

    /**
     * Status and body of {@code ExceptionUtils.ofError(INVALID_PARAMETER, "INVALID_PARAMETER", argument)} as the global
     * handler writes it: the error envelope with the message formatted for {@link #REQUEST_LOCALE}.
     */
    public static void assertInvalidParameter(EntityExchangeResult<byte[]> result, Object argument) {
        assertBizError(result, BizError.INVALID_PARAMETER, BizError.INVALID_PARAMETER.name(), argument);
    }

    /**
     * Status and body of {@code ExceptionUtils.ofError(error, messageKey, arguments)} as the global handler writes it:
     * the error's HTTP status, and the error envelope with the message formatted for {@link #REQUEST_LOCALE}.
     */
    public static void assertBizError(EntityExchangeResult<byte[]> result, BizError error, String messageKey, Object... arguments) {
        String message = new BizException(error, messageKey, arguments).getMessage(REQUEST_LOCALE);
        assertResponse(result, HttpStatus.valueOf(error.getHttpErrorCode()), error(error, message));
    }

    /** A JSON array of the given element texts, kept as they are. */
    public static String array(String... elements) {
        return "[" + String.join(",", elements) + "]";
    }

    /** The S1 golden of {@code type}. */
    public static String s1(Class<?> type) {
        return fixture(type, S1);
    }

    /**
     * What the production mapper writes for the S1 sample of {@code type} under {@code view} ({@code JsonViews.Public}
     * or {@code JsonViews.Internal}): its {@code S1Public} or {@code S1Internal} golden, or the S1 golden where
     * {@code ResponsePayloadGoldensTest} found the view's output equal to S1 and so no such golden exists.
     */
    public static String s1(Class<?> type, Class<?> view) {
        String viewCase = S1 + view.getSimpleName();
        return Files.exists(GOLDEN.resolve(TYPES + type.getName() + "." + viewCase + ".json")) ? fixture(type, viewCase) : s1(type);
    }

    /** The D1 golden of {@code type}. */
    public static String d1(Class<?> type) {
        return fixture(type, D1);
    }

    /** The golden {@code types/<type>.<fixtureCase>.json} as text. */
    public static String fixture(Class<?> type, String fixtureCase) {
        return GOLDEN.read(TYPES + type.getName() + "." + fixtureCase + ".json");
    }

    /**
     * Fails unless every registry row planned for {@code testClass} was exercised through this instance, names a
     * stubbing group, and has only branch names that are test methods of {@code testClass}.
     */
    public void assertComplete(Class<?> testClass) {
        List<String> problems = new ArrayList<>();
        List<Row> rows = ContractRegistry.read(JsonBoundaryClassification.apiServiceRoot(), problems).stream()
                .filter(row -> row.test().equals(testClass.getName())).toList();
        Set<String> testMethods = Arrays.stream(testClass.getDeclaredMethods())
                .filter(m -> m.isAnnotationPresent(Test.class) || m.isAnnotationPresent(ParameterizedTest.class))
                .map(Method::getName).collect(Collectors.toCollection(TreeSet::new));
        for (Row row : rows) {
            if (!exercised.contains(row.endpoint())) {
                problems.add(row.endpoint() + ": not exercised");
            }
            if (!ContractRegistry.GROUPS.contains(row.group())) {
                problems.add(row.endpoint() + ": no stubbing group");
            }
            new TreeSet<>(row.branches().values()).stream().filter(branch -> !testMethods.contains(branch))
                    .forEach(branch -> problems.add(row.endpoint() + ": branch '" + branch + "' has no test method of that name"));
        }
        System.out.println("[EndpointContract] " + testClass.getSimpleName() + ": " + rows.size() + " registry rows, "
                + exercised.size() + " endpoints exercised, test methods " + testMethods);
        assertThat(rows).as("registry rows planned for " + testClass.getName()).isNotEmpty();
        assertThat(problems).as(declaration.getSimpleName() + " endpoint contract").isEmpty();
    }

    /** The endpoint {@code method}: a key, or a method name that only one endpoint of the declaration has. */
    private Endpoint endpoint(String method) {
        if (endpoints.containsKey(method)) {
            return endpoints.get(method);
        }
        List<Endpoint> named = endpoints.values().stream().filter(endpoint -> endpoint.method().getName().equals(method)).toList();
        if (named.size() != 1) {
            throw new IllegalArgumentException(declaration.getSimpleName() + " has " + named.size() + " endpoints named " + method
                    + (named.isEmpty() ? "" : "; address one by its key: " + named.stream().map(Endpoint::key).sorted().toList()));
        }
        return named.get(0);
    }

    /** Spring prefixes a mapping path without a leading {@code /} (as {@code OrganizationEndpoints#update}'s) with one. */
    private static String withLeadingSlash(String path) {
        return path.isEmpty() || path.startsWith(PATH_SEPARATOR) ? path : PATH_SEPARATOR + path;
    }

    /** The shortest class-level path; none for a controller mapped at method level only ({@code IndexController}). */
    private String basePath() {
        RequestMapping mapping = AnnotatedElementUtils.findMergedAnnotation(declaration, RequestMapping.class);
        return mapping == null ? "" : Arrays.stream(mapping.path()).min(Comparator.comparingInt(String::length)).orElse("");
    }

    private static byte[] bodyOf(EntityExchangeResult<byte[]> result) {
        return result.getResponseBody() == null ? new byte[0] : result.getResponseBody();
    }

    /** The envelope golden with {@code fields} set and {@code data} replaced by {@code dataJson} (removed when null). */
    private static String envelope(String golden, Map<String, ?> fields, String dataJson) {
        try {
            ObjectNode envelope = (ObjectNode) PayloadAssertions.FIXTURE_EDITOR.readTree(GOLDEN.read(golden));
            fields.forEach((name, value) -> envelope.set(name, PayloadAssertions.FIXTURE_EDITOR.valueToTree(value)));
            if (dataJson == null) {
                envelope.remove(DATA);
                return PayloadAssertions.FIXTURE_EDITOR.writeValueAsString(envelope);
            }
            envelope.put(DATA, DATA_PLACEHOLDER);
            return PayloadAssertions.FIXTURE_EDITOR.writeValueAsString(envelope).replace("\"" + DATA_PLACEHOLDER + "\"", dataJson);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("cannot build the envelope from " + golden, e);
        }
    }

    /** The walker's closure, computed once, on first use, for all endpoint tests. */
    private static final class ClosureHolder {
        static final PayloadTypeWalker.Closure CLOSURE = PayloadTypeWalker.walkCompiledApi();
    }
}
