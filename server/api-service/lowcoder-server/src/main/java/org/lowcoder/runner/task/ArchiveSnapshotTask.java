package org.lowcoder.runner.task;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lowcoder.sdk.config.CommonConfig;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.concurrent.TimeUnit;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.model.Filters;
import org.bson.Document;

@Slf4j
@RequiredArgsConstructor
@Component
public class ArchiveSnapshotTask {

    private final CommonConfig commonConfig;
    private final MongoTemplate mongoTemplate;

    @Scheduled(initialDelay = 0, fixedRate = 1, timeUnit = TimeUnit.DAYS)
    public void archive() {
        int mongoVersion = getMongoDBVersion();
        Instant thresholdDate = Instant.now().minus(commonConfig.getQuery().getAppSnapshotKeepDuration(), ChronoUnit.DAYS);

        if (mongoVersion >= 5) {
            archiveForVersion5AndAbove(thresholdDate);
        } else {
            archiveForVersionBelow5(thresholdDate);
        }
    }

    private int getMongoDBVersion() {
        Document buildInfo = mongoTemplate.getDb().runCommand(new Document("buildInfo", 1));
        String version = buildInfo.getString("version");
        return Integer.parseInt(version.split("\\.")[0]); // Parse major version
    }

    private void archiveForVersion5AndAbove(Instant thresholdDate) {
        log.info("Running archival for MongoDB version >= 5");

        MongoCollection<Document> sourceCollection = mongoTemplate.getDb().getCollection("applicationHistorySnapshot");
        MongoCollection<Document> targetCollection = mongoTemplate.getDb().getCollection("applicationHistorySnapshotTS");

        long totalDocuments = sourceCollection.countDocuments(Filters.lte("createdAt", thresholdDate));
        log.info("Total documents to archive: {}", totalDocuments);

        long processedCount = 0;

        try (MongoCursor<Document> cursor = sourceCollection.find(Filters.lte("createdAt", thresholdDate)).iterator()) {
            while (cursor.hasNext()) {
                Document document = cursor.next();

                // Transform the document for the target collection
                document.put("id", document.getObjectId("_id")); // Map `_id` to `id`
                document.remove("_id");

                // Insert the document into the target collection
                try {
                    targetCollection.insertOne(document);
                } catch (Exception e) {
                    log.error("Failed to insert document with ID {}. Error: {}", document.getObjectId("id"), e.getMessage());
                    continue;
                }

                // Remove the document from the source collection
                try {
                    sourceCollection.deleteOne(Filters.eq("_id", document.getObjectId("id")));
                } catch (Exception e) {
                    log.error("Failed to delete document with ID {}. Error: {}", document.getObjectId("id"), e.getMessage());
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

    private void archiveForVersionBelow5(Instant thresholdDate) {
        log.info("Running archival for MongoDB version < 5");

        MongoCollection<Document> sourceCollection = mongoTemplate.getDb().getCollection("applicationHistorySnapshot");

        long totalDocuments = sourceCollection.countDocuments(Filters.lte("createdAt", thresholdDate));
        log.info("Total documents to archive: {}", totalDocuments);

        long processedCount = 0;

        try (MongoCursor<Document> cursor = sourceCollection.find(Filters.lte("createdAt", thresholdDate)).iterator()) {
            while (cursor.hasNext()) {
                Document document = cursor.next();

                // Transform the document for the target collection
                document.put("id", document.getObjectId("_id")); // Map `_id` to `id`
                document.remove("_id");

                // Use aggregation with $out for the single document
                try {
                    sourceCollection.aggregate(List.of(
                            Filters.eq("_id", document.getObjectId("id")),
                            new Document("$project", new Document()
                                    .append("applicationId", document.get("applicationId"))
                                    .append("dsl", document.get("dsl"))
                                    .append("context", document.get("context"))
                                    .append("createdAt", document.get("createdAt"))
                                    .append("createdBy", document.get("createdBy"))
                                    .append("modifiedBy", document.get("modifiedBy"))
                                    .append("updatedAt", document.get("updatedAt"))
                                    .append("id", document.get("id"))),
                            new Document("$out", "applicationHistorySnapshotTS")
                    )).first();
                } catch (Exception e) {
                    log.error("Failed to aggregate and insert document with ID {}. Error: {}", document.getObjectId("id"), e.getMessage());
                    continue;
                }

                // Remove the document from the source collection
                try {
                    sourceCollection.deleteOne(Filters.eq("_id", document.getObjectId("id")));
                } catch (Exception e) {
                    log.error("Failed to delete document with ID {}. Error: {}", document.getObjectId("id"), e.getMessage());
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
