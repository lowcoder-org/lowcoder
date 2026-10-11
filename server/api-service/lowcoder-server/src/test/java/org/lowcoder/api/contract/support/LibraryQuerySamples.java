package org.lowcoder.api.contract.support;

import org.lowcoder.api.query.view.LibraryQueryAggregateView;
import org.lowcoder.api.query.view.LibraryQueryMetaView;
import org.lowcoder.api.query.view.LibraryQueryPublishRequest;
import org.lowcoder.api.query.view.LibraryQueryRecordMetaView;
import org.lowcoder.api.query.view.LibraryQueryView;
import org.lowcoder.api.query.view.UpsertLibraryQueryRequest;
import org.lowcoder.domain.query.model.LibraryQuery;
import org.lowcoder.domain.query.model.LibraryQueryRecord;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Samples of the library query types (docs/API_PAYLOAD_TEST_PLAN.md §3.3, task T6.2), with the conventions of
 * {@link PayloadSamples}. A library query's DSL holds the query under {@value #QUERY}, the key {@code LibraryQuery} and
 * {@code LibraryQueryRecord} read their {@code BaseQuery} from (§3.3: {@code LibraryQuery} gets a DSL containing
 * {@code query}); its {@code comp} has an {@code int}, a {@code long} and a decimal.
 */
public final class LibraryQuerySamples {

    /** The DSL key of the query ({@code LibraryQuery.java:33}, {@code LibraryQueryRecord.java:37}). */
    public static final String QUERY = "query";
    /** A real query type, so that {@code LibraryQueryMetaView#datasourceType} carries a realistic value. */
    public static final String REST_API_COMP_TYPE = "restApi";
    /** When the library query of every view sample was created. */
    public static final Instant LIBRARY_QUERY_CREATED_AT = ApplicationSamples.instant(100);
    /** When the record of every record-meta sample was created. */
    public static final Instant LIBRARY_QUERY_RECORD_CREATED_AT = ApplicationSamples.instant(110);

    private LibraryQuerySamples() {
    }

    /**
     * A library query DSL as Jackson binds JSON into {@code Map<String, Object>} ({@code LinkedHashMap} objects,
     * {@code Integer} or {@code Long} by magnitude, {@code Double} decimals): the {@value #QUERY} a library query
     * stores, in the shape {@code BaseQuery} reads, with one key it does not read ({@code triggerType}).
     */
    public static Map<String, Object> libraryQueryDsl(String prefix) {
        Map<String, Object> comp = new LinkedHashMap<>();
        comp.put("method", prefix + ".query.comp.method");
        comp.put("path", prefix + ".query.comp.path");
        comp.put("bodyLimit", 40_100);
        comp.put("maxBytes", PayloadSamples.DSL_LONG);
        comp.put("ratio", PayloadSamples.DSL_DECIMAL);
        Map<String, Object> query = new LinkedHashMap<>();
        query.put("id", prefix + ".query.id");
        query.put("name", prefix + ".query.name");
        query.put("datasourceId", prefix + ".query.datasourceId");
        query.put("compType", REST_API_COMP_TYPE);
        query.put("comp", comp);
        query.put("triggerType", prefix + ".query.triggerType");
        query.put("timeout", prefix + ".query.timeout");
        Map<String, Object> dsl = new LinkedHashMap<>();
        dsl.put(QUERY, query);
        dsl.put("version", 40_101);
        return dsl;
    }

    /** {@code LibraryQueryEndpoints#create}; a {@code @Jacksonized @SuperBuilder} class. */
    public static LibraryQuery libraryQuery() {
        return LibraryQuery.builder()
                .id("LibraryQuery.id")
                .createdBy("LibraryQuery.createdBy")
                .gid("LibraryQuery.gid")
                .organizationId("LibraryQuery.organizationId")
                .name("LibraryQuery.name")
                .libraryQueryDSL(libraryQueryDsl("LibraryQuery.libraryQueryDSL"))
                .build();
    }

    /** A stored library query as the services hand it over, with its creation time (read by the views' factories). */
    public static LibraryQuery storedLibraryQuery(String prefix) {
        return LibraryQuery.builder()
                .id(prefix + ".id")
                .createdBy(prefix + ".createdBy")
                .createdAt(LIBRARY_QUERY_CREATED_AT)
                .gid(prefix + ".gid")
                .organizationId(prefix + ".organizationId")
                .name(prefix + ".name")
                .libraryQueryDSL(libraryQueryDsl(prefix + ".libraryQueryDSL"))
                .build();
    }

    /** A published version of a library query, as the record service hands it over. */
    public static LibraryQueryRecord libraryQueryRecord(String prefix) {
        return LibraryQueryRecord.builder()
                .id(prefix + ".id")
                .createdBy(prefix + ".createdBy")
                .createdAt(LIBRARY_QUERY_RECORD_CREATED_AT)
                .libraryQueryId(prefix + ".libraryQueryId")
                .tag(prefix + ".tag")
                .commitMessage(prefix + ".commitMessage")
                .libraryQueryDSL(libraryQueryDsl(prefix + ".libraryQueryDSL"))
                .build();
    }

    /** {@code LibraryQueryEndpoints#update}; a setter-bound POJO. */
    public static UpsertLibraryQueryRequest upsertLibraryQueryRequest() {
        UpsertLibraryQueryRequest request = new UpsertLibraryQueryRequest();
        request.setName("UpsertLibraryQueryRequest.name");
        request.setLibraryQueryDSL(libraryQueryDsl("UpsertLibraryQueryRequest.libraryQueryDSL"));
        return request;
    }

    public static LibraryQueryPublishRequest libraryQueryPublishRequest() {
        return new LibraryQueryPublishRequest("LibraryQueryPublishRequest.commitMessage", "LibraryQueryPublishRequest.tag");
    }

    public static LibraryQueryView libraryQueryView() {
        return libraryQueryView("LibraryQueryView");
    }

    static LibraryQueryView libraryQueryView(String prefix) {
        return new LibraryQueryView(prefix + ".id", prefix + ".gid", prefix + ".organizationId", prefix + ".name",
                libraryQueryDsl(prefix + ".libraryQueryDSL"), LIBRARY_QUERY_CREATED_AT.toEpochMilli(), prefix + ".creatorName");
    }

    public static LibraryQueryMetaView libraryQueryMetaView() {
        return libraryQueryMetaView("LibraryQueryMetaView");
    }

    static LibraryQueryMetaView libraryQueryMetaView(String prefix) {
        return new LibraryQueryMetaView(prefix + ".id", prefix + ".gid", REST_API_COMP_TYPE, prefix + ".organizationId", prefix + ".name",
                LIBRARY_QUERY_CREATED_AT.toEpochMilli(), prefix + ".creatorName");
    }

    public static LibraryQueryRecordMetaView libraryQueryRecordMetaView() {
        return libraryQueryRecordMetaView("LibraryQueryRecordMetaView");
    }

    static LibraryQueryRecordMetaView libraryQueryRecordMetaView(String prefix) {
        return new LibraryQueryRecordMetaView(prefix + ".id", prefix + ".libraryQueryId", REST_API_COMP_TYPE, prefix + ".tag",
                prefix + ".commitMessage", LIBRARY_QUERY_RECORD_CREATED_AT.toEpochMilli(), prefix + ".creatorName");
    }

    /** {@code dropDownList}'s element: a library query's meta view and the meta views of two of its records. */
    public static LibraryQueryAggregateView libraryQueryAggregateView() {
        return new LibraryQueryAggregateView(libraryQueryMetaView("LibraryQueryAggregateView.libraryQueryMetaView"),
                new ArrayList<>(List.of(libraryQueryRecordMetaView("LibraryQueryAggregateView.recordMetaViewList[0]"),
                        libraryQueryRecordMetaView("LibraryQueryAggregateView.recordMetaViewList[1]"))));
    }
}
