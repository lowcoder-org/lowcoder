package org.lowcoder.sdk.models;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

/**
 * The {@code queryCode} of a REST API result is {@code "HTTP"} plus the name of the response's status, and apps compare it.
 * Spring 7 renamed the constants of three status codes; the code stays what it was.
 */
class QueryExecutionResultHttpCodeTest {

    private static String queryCodeOf(HttpStatus status) {
        QueryExecutionResult result = QueryExecutionResult.ofRestApiResult(status, null, null);
        System.out.println("[QueryExecutionResultHttpCodeTest] " + status.value() + " " + status.name() + " -> " + result.getQueryCode());
        return result.getQueryCode();
    }

    /** Catches the renamed constants leaking into the code: 413, 421 and 422 keep their earlier names. */
    @Test
    void renamedStatusesKeepTheirEarlierCodes() {
        assertThat(queryCodeOf(HttpStatus.resolve(413))).as("413 as resolved by HttpStatus").isEqualTo("HTTPPAYLOAD_TOO_LARGE");
        assertThat(queryCodeOf(HttpStatus.resolve(421))).as("421 as resolved by HttpStatus").isEqualTo("HTTPDESTINATION_LOCKED");
        assertThat(queryCodeOf(HttpStatus.resolve(422))).as("422 as resolved by HttpStatus").isEqualTo("HTTPUNPROCESSABLE_ENTITY");
    }

    /** Catches the mapping touching statuses whose names did not change. */
    @Test
    void otherStatusesUseTheirConstantName() {
        assertThat(queryCodeOf(HttpStatus.NOT_FOUND)).as("404").isEqualTo("HTTPNOT_FOUND");
        assertThat(queryCodeOf(HttpStatus.INTERNAL_SERVER_ERROR)).as("500").isEqualTo("HTTPINTERNAL_SERVER_ERROR");
        assertThat(queryCodeOf(HttpStatus.URI_TOO_LONG)).as("414").isEqualTo("HTTPURI_TOO_LONG");
    }

    /** Catches a success status carrying a code: the code stays OK. */
    @Test
    void successStatusKeepsTheOkCode() {
        assertThat(queryCodeOf(HttpStatus.OK)).as("200").isEqualTo("OK");
    }
}
