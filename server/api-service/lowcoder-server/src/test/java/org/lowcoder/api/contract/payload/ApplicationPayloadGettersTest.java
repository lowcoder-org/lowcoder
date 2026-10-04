package org.lowcoder.api.contract.payload;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.ApplicationSamples;
import org.lowcoder.api.contract.support.PayloadSamples;
import org.lowcoder.api.contract.support.StoredValues;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationVersion;
import org.lowcoder.domain.application.service.ApplicationRecordService;
import org.lowcoder.domain.query.model.ApplicationQuery;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.CanonicalJson;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.util.JsonUtils;
import org.mockito.Mockito;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The {@code payload-getters} group for {@link Application} (docs/API_PAYLOAD_TEST_PLAN.md §4.10, R12; task T2.4): the
 * two getters that convert the queries of a DSL with Jackson, {@code JsonUtils.toJson} and then
 * {@code JsonUtils.fromJsonSet} into {@link ApplicationQuery}.
 *
 * <ul>
 *   <li>{@code getEditingQueries} converts the editing DSL's queries; the result is also a payload property, pinned in
 *       {@code Application}'s S1 golden.</li>
 *   <li>{@code getLiveQueries} converts the queries of the latest record's DSL, or of the editing DSL when the
 *       application has no record.</li>
 * </ul>
 *
 * <p>The DSL is {@link ApplicationSamples#applicationDsl} with a third query whose {@code comp} is the §4.6
 * representative input bound to {@code Map<String, Object>}, and the whole DSL as the store gives it back
 * ({@link StoredValues#dsl}): the getters convert stored DSLs, so the conversion meets every kind of JSON value in the
 * Java classes it meets in production. Each converted set, sorted by id (it is a {@code HashSet} without a stable
 * order, O14), is written by the production mapper and compared with a golden under {@value #GOLDEN_DIRECTORY}; and
 * each query's {@code comp} must come out with the same Java values and classes it went in with
 * ({@link CanonicalJson#assertSameJava}), which a change in how Jackson binds numbers breaks even where the JSON stays
 * the same.
 */
class ApplicationPayloadGettersTest {

    static final String GOLDEN_DIRECTORY = "boundary/payload-getters/";
    static final String EDITING_GOLDEN = GOLDEN_DIRECTORY + "Application.editingQueries.json";
    static final String LIVE_GOLDEN = GOLDEN_DIRECTORY + "Application.liveQueries.json";
    static final String EDITING_PREFIX = "ApplicationPayloadGettersTest.editing";
    static final String LIVE_PREFIX = "ApplicationPayloadGettersTest.live";
    static final String QUERIES = "queries";
    static final String COMP = "comp";
    static final String ID = "id";
    static final String REPRESENTATIVE_QUERY = ".queries[2]";

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @Test
    @BoundarySites({"lowcoder-domain/src/main/java/org/lowcoder/domain/application/model/Application.java#Application.editingQueries#toJson#1",
            "lowcoder-domain/src/main/java/org/lowcoder/domain/application/model/Application.java#Application.editingQueries#fromJsonSet#1"})
    void editingQueries() throws JsonProcessingException {
        Map<String, Object> dsl = dsl(EDITING_PREFIX);
        Set<ApplicationQuery> queries = application(dsl).getEditingQueries();
        assertConverted("editingQueries", dsl, queries, EDITING_GOLDEN);
    }

    @Test
    @BoundarySites({"lowcoder-domain/src/main/java/org/lowcoder/domain/application/model/Application.java#Application.getLiveQueries#toJson#1",
            "lowcoder-domain/src/main/java/org/lowcoder/domain/application/model/Application.java#Application.getLiveQueries#fromJsonSet#1"})
    void liveQueriesOfTheLatestRecord() throws JsonProcessingException {
        Map<String, Object> liveDsl = dsl(LIVE_PREFIX);
        Application application = application(dsl(EDITING_PREFIX));
        ApplicationRecordService records = Mockito.mock(ApplicationRecordService.class);
        Mockito.when(records.getLatestRecordByApplicationId(application.getId()))
                .thenReturn(Mono.just(ApplicationVersion.builder().applicationDSL(liveDsl).build()));
        assertConverted("getLiveQueries", liveDsl, application.getLiveQueries(records).block(), LIVE_GOLDEN);
    }

    @Test
    @BoundarySites({"lowcoder-domain/src/main/java/org/lowcoder/domain/application/model/Application.java#Application.getLiveQueries#toJson#1",
            "lowcoder-domain/src/main/java/org/lowcoder/domain/application/model/Application.java#Application.getLiveQueries#fromJsonSet#1"})
    void liveQueriesWithoutARecordAreTheEditingOnes() throws JsonProcessingException {
        Map<String, Object> dsl = dsl(EDITING_PREFIX);
        Application application = application(dsl);
        ApplicationRecordService records = Mockito.mock(ApplicationRecordService.class);
        Mockito.when(records.getLatestRecordByApplicationId(application.getId())).thenReturn(Mono.empty());
        assertConverted("getLiveQueries without a record", dsl, application.getLiveQueries(records).block(), EDITING_GOLDEN);
    }

    /** {@link ApplicationSamples#applicationDsl} with a third query whose {@code comp} is the representative input, as stored. */
    @SuppressWarnings("unchecked")
    static Map<String, Object> dsl(String prefix) {
        Map<String, Object> dsl = ApplicationSamples.applicationDsl(prefix);
        List<Object> queries = (List<Object>) dsl.get(QUERIES);
        Map<String, Object> query = new LinkedHashMap<>((Map<String, Object>) queries.get(0));
        query.replaceAll((key, value) -> value instanceof String text ? text.replace(".queries[0]", REPRESENTATIVE_QUERY) : value);
        query.put(COMP, PayloadSamples.representative(JsonUtils.getObjectMapper().getTypeFactory()
                .constructMapType(Map.class, String.class, Object.class)));
        queries.add(query);
        return StoredValues.dsl(dsl);
    }

    private static Application application(Map<String, Object> editingDsl) {
        Application application = ApplicationSamples.application();
        return Application.builder().id(application.getId()).editingApplicationDSL(editingDsl).build();
    }

    @SuppressWarnings("unchecked")
    private static void assertConverted(String getter, Map<String, Object> dsl, Set<ApplicationQuery> queries, String golden)
            throws JsonProcessingException {
        List<ApplicationQuery> sorted = new ArrayList<>(queries);
        sorted.sort(Comparator.comparing(ApplicationQuery::getId));
        String written = JsonUtils.getObjectMapper().writeValueAsString(sorted);
        System.out.println("[ApplicationPayloadGettersTest] " + getter + ": " + queries.size() + " queries, written " + written.length() + " chars");
        GOLDEN.assertJson(golden, written);
        List<Map<String, Object>> dslQueries = (List<Map<String, Object>>) dsl.get(QUERIES);
        assertThat(sorted).hasSameSizeAs(dslQueries);
        for (Map<String, Object> dslQuery : dslQueries) {
            ApplicationQuery converted = sorted.stream().filter(query -> query.getId().equals(dslQuery.get(ID))).findFirst().orElseThrow();
            CanonicalJson.assertSameJava(dslQuery.get(COMP), converted.getBaseQuery().getQueryConfig());
        }
    }
}
