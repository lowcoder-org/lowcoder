package org.lowcoder.api.contract.payload;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.contract.support.QuerySamples;
import org.lowcoder.api.query.ApplicationQueryApiService;
import org.lowcoder.api.query.QueryController;
import org.lowcoder.api.query.QueryEndpoints;
import org.lowcoder.api.query.view.QueryExecutionRequest;
import org.lowcoder.api.query.view.QueryResultView;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.util.JsonUtils;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.TimeZone;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;

/**
 * The server-side codec test of {@link QueryResultView} with the mixed sample of docs/API_PAYLOAD_TEST_PLAN.md §4.6
 * (task T5.3): {@link QuerySamples#mixedQueryExecutionResult()}, whose {@code data} holds the value kinds of every §4.6
 * producer, among them a JDBC row built by the production {@code ResultSetParser}. Its output is pinned in
 * {@value #MIXED_OUTPUT}, once as the production server codec writes it through {@code POST /api/query/execute}
 * ({@link QueryController} in the {@link ContractTestClient} harness), once as the production mapper writes it, and
 * once more with the sample built and written in another default time zone, so the golden holds no local time.
 *
 * <p>Limits: the plugins' own producers (their drivers, their response parsers, the JDBC interfaces {@code Clob},
 * {@code Blob}, {@code Array}, ...) are WP8's; here the values they produce are built by hand where the producer is
 * not on the server's classpath (Postgres arrays and JSON, REST bodies, the node service's map).
 */
class QueryResultViewContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(QueryEndpoints.class);
    static final String EXECUTE = "execute";
    static final String MIXED_OUTPUT = "dynamic/QueryResultView.mixed.output.json";
    /** A zone whose offset differs from UTC and from the build machine's in both winter and summer. */
    static final TimeZone OTHER_ZONE = TimeZone.getTimeZone("Pacific/Kiritimati");
    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @Test
    void mixedResultThroughTheServerCodec() {
        ContractTestClient.Builder builder = ContractTestClient.builder();
        ApplicationQueryApiService service = builder.mock(ApplicationQueryApiService.class);
        // built first: the sample's mocked ResultSet must not be stubbed inside this stubbing
        QueryExecutionResult mixed = QuerySamples.mixedQueryExecutionResult();
        Mockito.when(service.executeApplicationQuery(any(), any())).thenReturn(Mono.just(mixed));
        try (ContractTestClient client = builder.controllerWithMockedDependencies(QueryController.class).build()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, EXECUTE, Map.of(), EndpointContract.d1(QueryExecutionRequest.class));
            assertThat(result.getStatus().value()).as("status").isEqualTo(HttpStatus.OK.value());
            assertThat(result.getResponseHeaders().getContentType()).as("Content-Type")
                    .satisfies(type -> assertThat(type.isCompatibleWith(MediaType.APPLICATION_JSON)).isTrue());
            GOLDEN.assertJson(MIXED_OUTPUT, new String(result.getResponseBodyContent(), StandardCharsets.UTF_8));
        }
    }

    @Test
    void mixedResultThroughTheProductionMapper() {
        String written = write(QuerySamples.mixedQueryExecutionResult());
        System.out.println("[QueryResultViewContractTest] production mapper: " + written);
        GOLDEN.assertJson(MIXED_OUTPUT, written);
    }

    @Test
    void mixedResultIsTheSameInAnotherTimeZone() {
        TimeZone original = TimeZone.getDefault();
        assertThat(OTHER_ZONE.getID()).as("the zone is known to the JDK").isNotEqualTo("GMT");
        TimeZone.setDefault(OTHER_ZONE);
        try {
            String written = write(QuerySamples.mixedQueryExecutionResult());
            System.out.println("[QueryResultViewContractTest] in " + OTHER_ZONE.getID() + ": " + written);
            GOLDEN.assertJson(MIXED_OUTPUT, written);
        } finally {
            TimeZone.setDefault(original);
        }
    }

    /** The view of {@code result} in the request's locale, as {@code QueryController} builds it, by the production mapper. */
    private static String write(QueryExecutionResult result) {
        try {
            return JsonUtils.toJsonThrows(new QueryResultView(result, QuerySamples.RESULT_LOCALE));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("the production mapper cannot write the mixed result", e);
        }
    }
}
