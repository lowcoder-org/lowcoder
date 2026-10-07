package org.lowcoder.runner.task;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lowcoder.sdk.config.CommonConfig;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.TimeUnit;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.model.Filters;
import org.bson.Document;

@Slf4j
@RequiredArgsConstructor
@Component
public class ArchiveSnapshotTask {

    /** The collection application snapshots are kept in until they are older than the keep duration. */
    static final String SNAPSHOT_COLLECTION = "applicationHistorySnapshot";

    /**
     * The archive collection: a time-series collection on MongoDB 5 and later and a regular one below
     * ({@code DatabaseChangelog.addTimeSeriesSnapshotHistory}).
     */
    static final String ARCHIVE_COLLECTION = "applicationHistorySnapshotTS";

    private static final String CREATED_AT = "createdAt";
    private static final String MONGO_ID = "_id";
    private static final String ARCHIVED_ID = "id";

    private final CommonConfig commonConfig;
    private final MongoTemplate mongoTemplate;

    /**
     * Moves the snapshots older than the keep duration into the archive collection, one at a time: each is inserted there,
     * with its {@code _id} kept as the field {@code id}, and then deleted from the snapshot collection.
     * <p>
     * BF-065: on MongoDB below 5 each snapshot went through an aggregate whose first element was a filter, not a stage, so
     * the server rejected it (error 40324) and nothing was archived. Plain inserts work on the time-series archive and on
     * the regular one, so every server version takes this path. {@code $out} is not used: it replaces the whole target
     * collection, which would drop what was archived before.
     * <p>
     * Limits: a snapshot whose insert succeeded but whose delete failed is in both collections, and the next run inserts it
     * into the archive again.
     */
    @Scheduled(initialDelay = 0, fixedRate = 1, timeUnit = TimeUnit.DAYS)
    public void archive() {
        Instant thresholdDate = Instant.now().minus(commonConfig.getQuery().getAppSnapshotKeepDuration(), ChronoUnit.DAYS);
        log.info("Running archival of application snapshots");

        MongoCollection<Document> sourceCollection = mongoTemplate.getDb().getCollection(SNAPSHOT_COLLECTION);
        MongoCollection<Document> targetCollection = mongoTemplate.getDb().getCollection(ARCHIVE_COLLECTION);

        long totalDocuments = sourceCollection.countDocuments(Filters.lte(CREATED_AT, thresholdDate));
        log.info("Total documents to archive: {}", totalDocuments);

        long processedCount = 0;

        try (MongoCursor<Document> cursor = sourceCollection.find(Filters.lte(CREATED_AT, thresholdDate)).iterator()) {
            while (cursor.hasNext()) {
                Document document = cursor.next();

                // Transform the document for the target collection
                document.put(ARCHIVED_ID, document.getObjectId(MONGO_ID)); // Map `_id` to `id`
                document.remove(MONGO_ID);

                // Insert the document into the target collection
                try {
                    targetCollection.insertOne(document);
                } catch (Exception e) {
                    log.error("Failed to insert document with ID {}. Error: {}", document.getObjectId(ARCHIVED_ID), e.getMessage());
                    continue;
                }

                // Remove the document from the source collection
                try {
                    sourceCollection.deleteOne(Filters.eq(MONGO_ID, document.getObjectId(ARCHIVED_ID)));
                } catch (Exception e) {
                    log.error("Failed to delete document with ID {}. Error: {}", document.getObjectId(ARCHIVED_ID), e.getMessage());
                    continue;
                }

                processedCount++;
                log.info("Processed document {} / {}", processedCount, totalDocuments);
            }
        } catch (Exception e) {
            log.error("Failed during archival process. Error: {}", e.getMessage());
        }

        log.info("Archival process completed. Total documents archived: {}", processedCount);
    }
}
