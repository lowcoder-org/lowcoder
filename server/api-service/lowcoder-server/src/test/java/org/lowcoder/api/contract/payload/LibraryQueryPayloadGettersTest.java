package org.lowcoder.api.contract.payload;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.LibraryQuerySamples;
import org.lowcoder.api.contract.support.PayloadSamples;
import org.lowcoder.api.contract.support.StoredValues;
import org.lowcoder.domain.query.model.BaseQuery;
import org.lowcoder.domain.query.model.LibraryQuery;
import org.lowcoder.domain.query.model.LibraryQueryRecord;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.CanonicalJson;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.util.JsonUtils;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The {@code payload-getters} group for {@link LibraryQuery} and {@link LibraryQueryRecord} (docs/API_PAYLOAD_TEST_PLAN.md
 * §4.10, R12; task T6.2): {@code getQuery()} of both converts the DSL's {@value LibraryQuerySamples#QUERY} with Jackson,
 * {@code JsonUtils.toJson} and then {@code JsonUtils.fromJson} into a {@link BaseQuery} ({@code LibraryQuery.java:31-37},
 * {@code LibraryQueryRecord.java:35-41}). The views read the query type from it ({@code LibraryQueryMetaView},
 * {@code LibraryQueryRecordMetaView}), and query execution reads the whole query.
 *
 * <p>The DSL is {@link LibraryQuerySamples#libraryQueryDsl} with the §4.6 representative input, bound to
 * {@code Map<String, Object>}, added to the query's {@code comp} under {@value #REPRESENTATIVE}, and the whole DSL as
 * the store gives it back ({@link StoredValues#dsl}, O19): the getters convert stored DSLs. The {@link BaseQuery} is
 * written by the production mapper and compared with a golden under {@value #GOLDEN_DIRECTORY}; its {@code comp} must
 * come out with the same Java values and classes it went in with ({@link CanonicalJson#assertSameJava}), which a change
 * in how Jackson binds numbers breaks even where the JSON stays the same; and its other properties are the DSL's
 * strings. Limit: only the properties {@link BaseQuery} declares are read; the DSL's other keys ({@code id},
 * {@code name}, {@code triggerType}) are dropped by the conversion, which the golden pins.
 */
class LibraryQueryPayloadGettersTest {

    static final String GOLDEN_DIRECTORY = "boundary/payload-getters/";
    static final String LIBRARY_QUERY_GOLDEN = GOLDEN_DIRECTORY + "LibraryQuery.query.json";
    static final String RECORD_GOLDEN = GOLDEN_DIRECTORY + "LibraryQueryRecord.query.json";
    static final String LIBRARY_QUERY_PREFIX = "LibraryQueryPayloadGettersTest.libraryQuery";
    static final String RECORD_PREFIX = "LibraryQueryPayloadGettersTest.record";
    static final String COMP = "comp";
    static final String DATASOURCE_ID = "datasourceId";
    static final String COMP_TYPE = "compType";
    static final String TIMEOUT = "timeout";
    static final String REPRESENTATIVE = "representative";
    /** A timeout stored as a JSON number: {@code BaseQuery} declares the property a {@code String}. */
    static final int NUMBER_TIMEOUT = 40_102;

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @Test
    @BoundarySites({"lowcoder-domain/src/main/java/org/lowcoder/domain/query/model/LibraryQuery.java#LibraryQuery.baseQuerySupplier#toJson#1",
            "lowcoder-domain/src/main/java/org/lowcoder/domain/query/model/LibraryQuery.java#LibraryQuery.baseQuerySupplier#fromJson#1"})
    void libraryQueryQuery() throws JsonProcessingException {
        Map<String, Object> dsl = dsl(LIBRARY_QUERY_PREFIX);
        BaseQuery query = LibraryQuery.builder().libraryQueryDSL(dsl).build().getQuery();
        assertConverted("LibraryQuery#getQuery", dsl, query, LIBRARY_QUERY_GOLDEN);
    }

    @Test
    @BoundarySites({"lowcoder-domain/src/main/java/org/lowcoder/domain/query/model/LibraryQueryRecord.java#LibraryQueryRecord.baseQuerySupplier#toJson#1",
            "lowcoder-domain/src/main/java/org/lowcoder/domain/query/model/LibraryQueryRecord.java#LibraryQueryRecord.baseQuerySupplier#fromJson#1"})
    void libraryQueryRecordQuery() throws JsonProcessingException {
        Map<String, Object> dsl = dsl(RECORD_PREFIX);
        BaseQuery query = LibraryQueryRecord.builder().libraryQueryDSL(dsl).build().getQuery();
        assertConverted("LibraryQueryRecord#getQuery", dsl, query, RECORD_GOLDEN);
    }

    /** A number where {@code BaseQuery} declares a {@code String} is read as its text, not rejected. */
    @Test
    @BoundarySites({"lowcoder-domain/src/main/java/org/lowcoder/domain/query/model/LibraryQuery.java#LibraryQuery.baseQuerySupplier#toJson#1",
            "lowcoder-domain/src/main/java/org/lowcoder/domain/query/model/LibraryQuery.java#LibraryQuery.baseQuerySupplier#fromJson#1"})
    void numberTimeoutIsReadAsText() {
        Map<String, Object> dsl = LibraryQuerySamples.libraryQueryDsl(LIBRARY_QUERY_PREFIX);
        query(dsl).put(TIMEOUT, NUMBER_TIMEOUT);
        BaseQuery query = LibraryQuery.builder().libraryQueryDSL(StoredValues.dsl(dsl)).build().getQuery();
        System.out.println("[LibraryQueryPayloadGettersTest] timeout " + NUMBER_TIMEOUT + " read as " + query.getTimeoutStr());
        assertThat(query.getTimeoutStr()).isEqualTo(Integer.toString(NUMBER_TIMEOUT));
    }

    /** {@link LibraryQuerySamples#libraryQueryDsl} with the representative input in the query's {@code comp}, as stored. */
    static Map<String, Object> dsl(String prefix) {
        Map<String, Object> dsl = LibraryQuerySamples.libraryQueryDsl(prefix);
        @SuppressWarnings("unchecked")
        Map<String, Object> comp = new LinkedHashMap<>((Map<String, Object>) query(dsl).get(COMP));
        comp.put(REPRESENTATIVE, PayloadSamples.representative(JsonUtils.getObjectMapper().getTypeFactory()
                .constructMapType(Map.class, String.class, Object.class)));
        query(dsl).put(COMP, comp);
        return StoredValues.dsl(dsl);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> query(Map<String, Object> dsl) {
        return (Map<String, Object>) dsl.get(LibraryQuerySamples.QUERY);
    }

    private static void assertConverted(String getter, Map<String, Object> dsl, BaseQuery converted, String golden)
            throws JsonProcessingException {
        String written = JsonUtils.getObjectMapper().writeValueAsString(converted);
        System.out.println("[LibraryQueryPayloadGettersTest] " + getter + ": written " + written.length() + " chars");
        GOLDEN.assertJson(golden, written);
        Map<String, Object> query = query(dsl);
        CanonicalJson.assertSameJava(query.get(COMP), converted.getQueryConfig());
        assertThat(converted.getDatasourceId()).isEqualTo(query.get(DATASOURCE_ID));
        assertThat(converted.getCompType()).isEqualTo(query.get(COMP_TYPE));
        assertThat(converted.getTimeoutStr()).isEqualTo(query.get(TIMEOUT));
    }
}
