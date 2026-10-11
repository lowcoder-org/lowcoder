package org.lowcoder.domain.query;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import org.lowcoder.domain.query.model.LibraryQuery;
import org.lowcoder.domain.query.model.LibraryQueryRecord;
import org.lowcoder.domain.query.repository.LibraryQueryRecordRepository;
import org.lowcoder.domain.query.service.LibraryQueryRecordService;
import org.lowcoder.domain.query.service.LibraryQueryService;
import org.lowcoder.sdk.util.IDUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import org.lowcoder.api.ServerApplication;

/**
 * Shared helpers of the library query tests on the MongoDB test container (task L3-11d). Every test works under ids, org ids
 * and names it generates, so the shared database needs no cleanup.
 */
@SpringBootTest(classes = ServerApplication.class)
@ActiveProfiles("test")
abstract class LibraryQueryMongoTestBase {

    protected static final Duration TIMEOUT = Duration.ofSeconds(30);
    protected static final String COMP_TYPE = "js";

    @Autowired
    protected LibraryQueryService libraryQueryService;
    @Autowired
    protected LibraryQueryRecordService libraryQueryRecordService;
    @Autowired
    protected LibraryQueryRecordRepository libraryQueryRecordRepository;

    protected static String newId() {
        return IDUtils.generate();
    }

    /** A DSL whose "query" is read as a BaseQuery (LibraryQuery.java:33): the compType identifies which DSL was returned. */
    protected static Map<String, Object> dsl(String compType) {
        Map<String, Object> query = new HashMap<>();
        query.put("compType", compType);
        query.put("datasourceId", "ds-" + newId());
        Map<String, Object> dsl = new HashMap<>();
        dsl.put("query", query);
        return dsl;
    }

    protected LibraryQuery insertQuery(String orgId, String name, String compType) {
        LibraryQuery query = LibraryQuery.builder().organizationId(orgId).name(name).libraryQueryDSL(dsl(compType)).build();
        return libraryQueryService.insert(query).block(TIMEOUT);
    }

    protected LibraryQuery insertQuery(String orgId) {
        return insertQuery(orgId, "lq-" + newId(), COMP_TYPE);
    }

    /** A record with an explicit id and creation time (an id makes it not-new, so auditing keeps the given createdAt). */
    protected LibraryQueryRecord insertRecord(String libraryQueryId, String tag, String compType, Instant createdAt) {
        LibraryQueryRecord record = LibraryQueryRecord.builder().libraryQueryId(libraryQueryId).tag(tag)
                .commitMessage("commit " + tag).libraryQueryDSL(dsl(compType)).build();
        record.setId(newId());
        record.setCreatedAt(createdAt);
        return libraryQueryRecordService.insert(record).block(TIMEOUT);
    }
}
