package org.lowcoder.infra.event;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Map;
import java.util.NoSuchElementException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.constants.GlobalContext;
import reactor.util.context.Context;

/** The audit-event details assembled by {@link AbstractEvent#populateDetails} and the builder's {@code detail}. */
class AbstractEventTest {

    private static final String ENVIRONMENT_ID = "env-1";
    private static final Map<String, String> HEADERS = Map.of("X-Request-Id", "r-1");

    @BeforeEach
    void setEnvironment() {
        AbstractEvent.setEnvironmentID(ENVIRONMENT_ID);
    }

    @AfterEach
    void resetEnvironment() {
        AbstractEvent.setEnvironmentID(null);
    }

    private static Context withHeaders() {
        return Context.of(GlobalContext.HEADERS, HEADERS);
    }

    @Test
    void populateDetailsCopiesTheFieldsOfTheConcreteClassAndSkipsNullNonNullFields() {
        ApplicationCommonEvent event = ApplicationCommonEvent.builder()
                .orgId("org-1").userId("user-1")
                .applicationId("app-1").applicationName("My app")
                .folderName("Folder")
                .build();

        event.populateDetails(withHeaders());

        Map<String, Object> details = event.details();
        System.out.println("[AbstractEventTest] details keys " + details.keySet());
        assertThat(details).containsEntry("applicationId", "app-1").containsEntry("applicationName", "My app").containsEntry("folderName", "Folder");
        assertThat(details).as("a null field without @JsonInclude(NON_NULL) is written as null")
                .containsKey("oldApplicationName").containsEntry("oldApplicationName", null);
        assertThat(details).as("a null @JsonInclude(NON_NULL) field is left out").doesNotContainKey("folderId");
        assertThat(details).as("fields declared in AbstractEvent itself are not copied").doesNotContainKeys("orgId", "userId", "sessionHash", "ipAddress");
    }

    @Test
    void populateDetailsCopiesTheDeclaredDetailFieldOfAQueryExecutionEvent() {
        QueryExecutionEvent event = QueryExecutionEvent.builder().detail(Map.of("query", "q1")).build();

        event.populateDetails(withHeaders());

        assertThat(event.details()).containsEntry("detail", Map.of("query", "q1"));
    }

    @Test
    void populateDetailsSetsTheEnvironmentIdAndTheContextHeaders() {
        ApplicationCommonEvent event = ApplicationCommonEvent.builder().applicationId("app-1").build();

        event.populateDetails(withHeaders());

        assertThat(event.details()).containsEntry("environmentId", ENVIRONMENT_ID).containsEntry("headers", HEADERS);
    }

    @Test
    void populateDetailsKeepsAnExplicitHeadersDetail() {
        ApplicationCommonEvent event = ApplicationCommonEvent.builder().applicationId("app-1").detail("headers", "explicit").build();

        event.populateDetails(withHeaders());

        assertThat(event.details()).as("the headers detail the event supplied is not overwritten by the context headers").containsEntry("headers", "explicit");
    }

    @Test
    void builderDetailCreatesTheMapLazilyAndAddsTheEnvironmentId() {
        SystemCommonEvent event = SystemCommonEvent.builder().detail("a", "1").detail("b", "2").build();

        assertThat(event.details()).containsEntry("a", "1").containsEntry("b", "2").containsEntry("environmentId", ENVIRONMENT_ID);
    }

    @Test
    void detailsReadsTheEnvironmentIdAtCallTime() {
        SystemCommonEvent event = SystemCommonEvent.builder().detail("a", "1").build();

        AbstractEvent.setEnvironmentID("env-2");

        assertThat(event.details()).containsEntry("environmentId", "env-2");
    }

    /**
     * Pins today's behaviour, not a defect row: {@code details()} dereferences a map that exists only after a
     * {@code detail(...)} call or {@code populateDetails}. Not reachable in this repository: {@code details()} has no
     * caller in the main code, every production {@code populateDetails} call (ApiEventFilter.java:74,
     * BusinessEventPublisher.java:97 and the other calls in that class) runs in a web request, and the only event
     * published without it, SystemCommonEvent (ServerLogServiceImpl.java:49), is built with a detail.
     */
    @Test
    void detailsOfAnEventWithoutAnyDetailThrowsNullPointerException() {
        SystemCommonEvent event = SystemCommonEvent.builder().apiCalls(1).build();

        assertThatThrownBy(event::details).isInstanceOf(NullPointerException.class);
    }

    /**
     * Pins today's behaviour, not a defect row: a context without {@code GlobalContext.HEADERS} makes
     * {@code populateDetails} throw. Not reachable in this repository: the headers are put into the Reactor context
     * only by GlobalContextFilter.java:116, which wraps every web request, and all production calls of
     * {@code populateDetails} (ApiEventFilter.java:74, BusinessEventPublisher.java:97 and following) run inside one;
     * no scheduled task publishes such an event.
     */
    @Test
    void populateDetailsWithoutHeadersInTheContextThrowsNoSuchElementException() {
        ApplicationCommonEvent event = ApplicationCommonEvent.builder().applicationId("app-1").build();

        assertThatThrownBy(() -> event.populateDetails(Context.empty())).isInstanceOf(NoSuchElementException.class);
    }
}
