package org.lowcoder.runner.migrations;

import com.github.f4b6a3.uuid.UuidCreator;
import com.mongodb.MongoNamespace;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.result.DeleteResult;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationHistorySnapshot;
import org.lowcoder.domain.application.model.ApplicationHistorySnapshotTS;
import org.lowcoder.domain.application.model.ApplicationVersion;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceStructureDO;
import org.lowcoder.domain.datasource.model.TokenBasedConnection;
import org.lowcoder.domain.folder.model.Folder;
import org.lowcoder.domain.group.model.Group;
import org.lowcoder.domain.group.model.QGroup;
import org.lowcoder.domain.material.model.MaterialMeta;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.query.model.LibraryQuery;
import org.lowcoder.domain.query.model.LibraryQueryRecord;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.infra.birelation.BiRelation;
import org.lowcoder.infra.config.model.ServerConfig;
import org.lowcoder.infra.eventlog.EventLog;
import org.lowcoder.infra.serverlog.ServerLog;
import org.lowcoder.runner.migrations.job.AddPtmFieldsJob;
import org.lowcoder.runner.migrations.job.AddSuperAdminUser;
import org.lowcoder.runner.migrations.job.CompleteAuthType;
import org.lowcoder.runner.migrations.job.EmailNormalizationBackfill;
import org.lowcoder.runner.migrations.job.MigrateAuthConfigJob;
import org.lowcoder.sdk.config.CommonConfig;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.UncategorizedMongoDbException;
import org.springframework.data.mongodb.core.CollectionOptions;
import org.springframework.data.mongodb.core.DocumentCallbackHandler;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.lowcoder.api.authentication.util.AdvancedMapUtils.documentToMap;
import static org.lowcoder.domain.util.QueryDslUtils.fieldName;
import static org.lowcoder.sdk.util.IDUtils.generate;

/**
 * The data migrations. {@link MigrationRunner} runs them in the order {@link DatabaseChangelogRegistry} lists, once per
 * database: the {@code id} and {@code author} of each entry there are the keys of the migration history. A change set
 * body is never edited after release in a way that changes what a database that ran it holds.
 */
@SuppressWarnings("all")
@Slf4j
public class DatabaseChangelog {

    public void addInitialIndexes(MongoTemplate mongoTemplate) {
        Index updatedAtIndex = makeIndex("updateAt");

        ensureIndexes(mongoTemplate, Application.class,
                updatedAtIndex,
                makeIndex("publishedApplicationDSL.queries.id"),
                makeIndex("publishedApplicationDSL.queries.datasourceId"),
                makeIndex("editingApplicationDSL.queries.id"),
                makeIndex("editingApplicationDSL.queries.datasourceId"),
                makeIndex("orgId")
        );
        ensureIndexes(mongoTemplate, BiRelation.class,
                makeIndex("bizType", "sourceId", "targetId").unique().named("biztype_sourceid_targetid_uniq"),
                makeIndex("bizType", "targetId")
        );

        ensureIndexes(mongoTemplate, Datasource.class,
                updatedAtIndex,
                makeIndex("organizationId", "name").unique()
                        .named("organization_datasource_compound_index")
        );

        ensureIndexes(mongoTemplate, Group.class,
                makeIndex(fieldName(QGroup.group.organizationId))
        );

        ensureIndexes(mongoTemplate, ServerConfig.class,
                makeIndex("key").unique()
        );


        ensureIndexes(mongoTemplate, User.class,
                updatedAtIndex,
                makeIndex("connections.source", "connections.rawId").unique()
        );

        ensureIndexes(mongoTemplate, DatasourceStructureDO.class,
                updatedAtIndex,
                makeIndex("datasourceId").unique()
        );
    }

    public void addOrganizationIndexes(MongoTemplate mongoTemplate) {
        ensureIndexes(mongoTemplate, Organization.class,
                makeIndex("source", "tpCompanyId").unique().sparse()
        );
    }

    public void addServerLogIndexes(MongoTemplate mongoTemplate) {
        ensureIndexes(mongoTemplate, ServerLog.class,
                makeIndex("userId"),
                makeIndex("createTime")
        );
    }

    public void addDatasourceConnectionIndexes(MongoTemplate mongoTemplate) {
        ensureIndexes(mongoTemplate, TokenBasedConnection.class,
                makeIndex("datasourceId").unique()
        );
    }

    public void addOrgDomainIndexes(MongoTemplate mongoTemplate) {
        ensureIndexes(mongoTemplate, Organization.class,
                makeIndex("organizationDomain.domain").unique().sparse()
        );
    }

    public void generateInstanceId(MongoTemplate mongoTemplate) {
        mongoTemplate.insert(ServerConfig.builder()
                .key("deployment.id")
                .value(generate())
                .build());
    }

    public void addGroupTypeIndex(MongoTemplate mongoTemplate) {
        ensureIndexes(mongoTemplate, Group.class, makeIndex("organizationId", "type"));
    }

    public void addEventLogIndex(MongoTemplate mongoTemplate) {
        ensureIndexes(mongoTemplate, EventLog.class,
                makeIndex("deploymentId", "eventType", "log.applicationId").sparse(),
                makeIndex("deploymentId", "eventType", "log.userId").sparse()
        );
    }

    public void addLibraryQueryIndex(MongoTemplate mongoTemplate) {
        ensureIndexes(mongoTemplate, LibraryQuery.class,
                makeIndex("organizationId").sparse());

        ensureIndexes(mongoTemplate, LibraryQueryRecord.class,
                makeIndex("libraryQueryId").sparse());
    }

    public void updateDatasourceIndex(MongoTemplate mongoTemplate) {
        dropIndexIfExists(mongoTemplate, Datasource.class, "organization_datasource_compound_index");
        ensureIndexes(mongoTemplate, Datasource.class,
                makeIndex("organizationId", "name").named("organization_datasource_index"));
    }


    public void addMaterialMetaIndex(MongoTemplate mongoTemplate) {
        ensureIndexes(mongoTemplate, MaterialMeta.class,
                makeIndex("orgId", "type", "filename").unique());
    }

    public void addBiRelationIndex(MongoTemplate mongoTemplate) {
        ensureIndexes(mongoTemplate, BiRelation.class,
                makeIndex("bizType", "sourceId", "relation"));
    }

    public void updateUserConnectionsIndex(MongoTemplate mongoTemplate) {
        dropIndexIfExists(mongoTemplate, User.class, "connections.source_1_connections.rawId_1");
        ensureIndexes(mongoTemplate, User.class, makeIndex("connections.source", "connections.rawId").unique().sparse());
    }

    public void migrateAuthConfigs(MigrateAuthConfigJob migrateAuthConfigJob) {
        migrateAuthConfigJob.migrateAuthConfig();
    }

    public void completeAuthType(CompleteAuthType completeAuthType) {
        completeAuthType.complete();
    }

    public void addOrgIdIndexOnServerLog(MongoTemplate mongoTemplate) {
        ensureIndexes(mongoTemplate, ServerLog.class,
                makeIndex("orgId")
        );
    }

    /**
     * Waits for every step of the super-admin job (BF-037), as the other job changesets do with {@code block()}: a failing
     * step fails the changeset, which {@link MigrationRunner} (an ApplicationRunner) records as {@code FAILED}, never as
     * {@code EXECUTED}, so it runs again at the next start. No timeout of its own: a step that never completes holds the
     * startup.
     */
    public void addSuperAdminUser(AddSuperAdminUser addSuperAdminUser) {
        addSuperAdminUser.addOrUpdateSuperAdmin().block();
    }

    public void addPtmFieldsToApplicatgions(AddPtmFieldsJob addPtmFieldsJob) {
        addPtmFieldsJob.migrateApplicationsToInitPtmFields();
    }

    public void addGidToDBObjects(MongoTemplate mongoTemplate) {
        // Define an array of collection names
        String[] collectionNames = {"application", "bundle", "datasource", "libraryQuery", "folder"};

        // Get the list of existing collections
        Set<String> existingCollections = mongoTemplate.getCollectionNames();

        for (String collectionName : collectionNames) {
            if (existingCollections.contains(collectionName)) {
                addGidField(mongoTemplate, collectionName);
            } else {
                System.out.println("Collection " + collectionName + " does not exist.");
            }
        }
    }

    public void addEmailField(MongoTemplate mongoTemplate) {
        // Create a query to match all documents
        Query query = new Query();

        // Use a DocumentCallbackHandler to iterate through each document
        mongoTemplate.executeQuery(query, "user", new DocumentCallbackHandler() {
            @Override
            public void processDocument(Document document) {
                // Generate a random UUID and ensure it is unique within the collection
                String username = document.getString("name");
                // Create an update object to add the 'gid' field
                Update update = new Update();
                update.set("email", username);

                // Create a query to match the current document by its _id
                Query idQuery = new Query(Criteria.where("_id").is(document.getObjectId("_id")));

                // Update the document with the new 'gid' field
                mongoTemplate.updateFirst(idQuery, update, "user");
            }
        });
    }

    public void fillCreateAt(MongoTemplate mongoTemplate) {
        // Create a query to match all documents
        Query query = new Query();

        // Use a DocumentCallbackHandler to iterate through each document
        mongoTemplate.executeQuery(query, "folder", new DocumentCallbackHandler() {
            @Override
            public void processDocument(Document document) {
                Object object = document.get("createdAt");
                if (object != null) return;
                // Create an update object to add the 'gid' field
                Update update = new Update();
                update.set("createdAt", Instant.now());

                // Create a query to match the current document by its _id
                Query idQuery = new Query(Criteria.where("_id").is(document.getObjectId("_id")));

                // Update the document with the new 'gid' field
                mongoTemplate.updateFirst(idQuery, update, "folder");
            }
        });
    }
  
    public void addGidIndexesUnique(MongoTemplate mongoTemplate) {
        // collections to add gid
        String[] collectionNames = {"group", "organization", "application", "bundle", "datasource", "libraryQuery", "folder"};

        // Get the list of existing collections
        Set<String> existingCollections = mongoTemplate.getCollectionNames();

        for (String collectionName : collectionNames) {
            if (existingCollections.contains(collectionName)) {
                addGidField(mongoTemplate, collectionName);
            } else {
                System.out.println("Collection " + collectionName + " does not exist.");
            }
        }

        ensureIndexes(mongoTemplate, Application.class, makeIndex("gid").unique());
        ensureIndexes(mongoTemplate, Datasource.class, makeIndex("gid").unique());
        ensureIndexes(mongoTemplate, Bundle.class, makeIndex("gid").unique());
        ensureIndexes(mongoTemplate, Folder.class, makeIndex("gid").unique());
        ensureIndexes(mongoTemplate, Group.class, makeIndex("gid").unique());
        ensureIndexes(mongoTemplate, Organization.class, makeIndex("gid").unique());
        ensureIndexes(mongoTemplate, LibraryQuery.class, makeIndex("gid").unique());
    }

    private int getMongoDBVersion(MongoTemplate mongoTemplate) {
        Document buildInfo = mongoTemplate.executeCommand(new Document("buildInfo", 1));
        String versionString = buildInfo.getString("version");
        if(versionString == null) return -1;
        String[] versionParts = versionString.split("\\.");
        int majorVersion = Integer.parseInt(versionParts[0]);
        return majorVersion;
    }

    public void addTimeSeriesSnapshotHistory(MongoTemplate mongoTemplate, CommonConfig commonConfig) {
        int mongoVersion = getMongoDBVersion(mongoTemplate);

        Instant thresholdDate = Instant.now().minus(commonConfig.getQuery().getAppSnapshotKeepDuration(), ChronoUnit.DAYS);

        if (mongoVersion >= 5) {
            // MongoDB version >= 5: Use manual insert query
            if (!mongoTemplate.collectionExists(ApplicationHistorySnapshotTS.class)) {
                mongoTemplate.createCollection(ApplicationHistorySnapshotTS.class,
                        CollectionOptions.empty().timeSeries("createdAt"));
            }

            // Aggregation pipeline to fetch the records
            List<Document> aggregationPipeline = Arrays.asList(
                    new Document("$match", new Document("createdAt", new Document("$lte", thresholdDate))),
                    new Document("$project", new Document()
                            .append("applicationId", 1)
                            .append("dsl", 1)
                            .append("context", 1)
                            .append("createdAt", 1)
                            .append("createdBy", 1)
                            .append("modifiedBy", 1)
                            .append("updatedAt", 1)
                            .append("id", "$_id")) // Map `_id` to `id` if needed
            );

            MongoCollection<Document> sourceCollection = mongoTemplate.getDb().getCollection("applicationHistorySnapshot");
            MongoCollection<Document> targetCollection = mongoTemplate.getDb().getCollection("applicationHistorySnapshotTS");

            // Fetch results and insert them into the time-series collection
            try (MongoCursor<Document> cursor = sourceCollection.aggregate(aggregationPipeline).iterator()) {
                while (cursor.hasNext()) {
                    Document document = cursor.next();
                    targetCollection.insertOne(document); // Insert into the time-series collection
                }
            }

            // Delete the migrated records
            Query deleteQuery = new Query(Criteria.where("createdAt").lte(thresholdDate));
            DeleteResult deleteResult = mongoTemplate.remove(deleteQuery, ApplicationHistorySnapshot.class);

            log.info("Deleted {} records from the source collection.", deleteResult.getDeletedCount());
        } else {
            // MongoDB version < 5: Use aggregation with $out
            if (!mongoTemplate.collectionExists(ApplicationHistorySnapshotTS.class)) {
                mongoTemplate.createCollection(ApplicationHistorySnapshotTS.class); // Create a regular collection
            }

            // Aggregation pipeline with $out
            List<Document> aggregationPipeline = Arrays.asList(
                    new Document("$match", new Document("createdAt", new Document("$lte", thresholdDate))),
                    new Document("$project", new Document()
                            .append("applicationId", 1)
                            .append("dsl", 1)
                            .append("context", 1)
                            .append("createdAt", 1)
                            .append("createdBy", 1)
                            .append("modifiedBy", 1)
                            .append("updatedAt", 1)
                            .append("id", "$_id")), // Map `_id` to `id` if needed
                    new Document("$out", "applicationHistorySnapshotTS") // Write directly to the target collection
            );

            mongoTemplate.getDb()
                    .getCollection("applicationHistorySnapshot")
                    .aggregate(aggregationPipeline)
                    .toCollection();

            // Delete the migrated records
            Query deleteQuery = new Query(Criteria.where("createdAt").lte(thresholdDate));
            DeleteResult deleteResult = mongoTemplate.remove(deleteQuery, ApplicationHistorySnapshot.class);

            log.info("Deleted {} records from the source collection.", deleteResult.getDeletedCount());
        }

        // Ensure indexes on the new collection
        ensureIndexes(mongoTemplate, ApplicationHistorySnapshotTS.class,
                makeIndex("applicationId"),
                makeIndex("createdAt"));
    }

    public void populateEmailInUserConnections(MongoTemplate mongoTemplate, CommonConfig commonConfig) {
        Query query = new Query(Criteria.where("connections.authId").is("EMAIL")
                .and("connections.email").is(null));

        // Get the collection directly and use a cursor for manual iteration
        MongoCursor<Document> cursor = mongoTemplate.getCollection("user").find(query.getQueryObject()).iterator();

        while (cursor.hasNext()) {
            Document document = cursor.next();

            // Retrieve connections array
            List<Document> connections = (List<Document>) document.get("connections");
            for (Document connection : connections) {
                if ("EMAIL".equals(connection.getString("authId")) && !connection.containsKey("email")) {
                    // Set the email field with the value of the name field
                    connection.put("email", connection.getString("name"));
                }
            }

            // Save the updated document back to the collection
            mongoTemplate.getCollection("user").replaceOne(new Document("_id", document.get("_id")), document);
        }

    }

    public void publishedToRecord(MongoTemplate mongoTemplate, CommonConfig commonConfig) {
        Query query = new Query(Criteria.where("publishedApplicationDSL").exists(true));

        MongoCursor<Document> cursor = mongoTemplate.getCollection("application").find(query.getQueryObject()).iterator();

        while (cursor.hasNext()) {
            Document document = cursor.next();
            Document dsl = (Document) document.get("publishedApplicationDSL");
            ObjectId id = document.getObjectId("_id");
            String createdBy = document.getString("createdBy");
            Map<String, Object> dslMap = documentToMap(dsl);
            ApplicationVersion record = ApplicationVersion.builder()
                    .applicationId(id.toHexString())
                    .applicationDSL(dslMap)
                    .commitMessage("")
                    .tag("1.0.0")
                    .createdBy(createdBy)
                    .modifiedBy(createdBy)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
            mongoTemplate.insert(record);
        }
    }
    public void addTagIndexToRecord(MongoTemplate mongoTemplate, CommonConfig commonConfig) {
        ensureIndexes(mongoTemplate, ApplicationVersion.class, makeIndex("applicationId", "tag").unique());
    }

    public void renameApplicationRecordCollection(MongoTemplate mongoTemplate, MongoDatabase mongoDatabase) {
        String oldCollectionName = "applicationRecord";
        String newCollectionName = "applicationVersion";

        // Check if the old collection exists
        boolean collectionExists = mongoDatabase.listCollectionNames()
                .into(new java.util.ArrayList<>())
                .contains(oldCollectionName);

        if (collectionExists) {
            // Rename the collection
            mongoDatabase.getCollection(oldCollectionName)
                    .renameCollection(new MongoNamespace(mongoDatabase.getName(), newCollectionName));
            System.out.println("Collection renamed from " + oldCollectionName + " to " + newCollectionName);
        } else {
            System.out.println("Collection " + oldCollectionName + " does not exist, skipping rename.");
        }

    }

    public void deleteOldSuperAdmin(MongoTemplate mongoTemplate, MongoDatabase mongoDatabase) {
        List<User> users = mongoTemplate.find(
                Query.query(Criteria.where("superAdmin").is(true))
                        .with(Sort.by(Sort.Direction.DESC, "createdAt")),
                User.class
        );

        // Ensure there's more than one superAdmin user
        if (users.size() > 1) {
            // Keep the most recent one (first in the sorted list), delete the rest
            List<ObjectId> userIdsToDelete = users.subList(1, users.size())
                    .stream()
                    .map(User::getId)
                    .map(ObjectId::new)
                    .collect(Collectors.toList());

            Query deleteQuery = Query.query(Criteria.where("_id").in(userIdsToDelete));
            mongoTemplate.remove(deleteQuery, User.class);
        }
    }

    /**
     * Backfills existing email addresses to the canonical form every write path has used since the
     * sanitization change. Accounts that would collide are left as they are and reported; see
     * {@link EmailNormalizationBackfill} and EMAIL-SANITIZATION.md.
     */
    public void normalizeEmailBackfill(MongoDatabase mongoDatabase) {
        EmailNormalizationBackfill.run(mongoDatabase);
    }

    private void addGidField(MongoTemplate mongoTemplate, String collectionName) {
        // Create a query to match all documents
        Query query = new Query();

        // Use a DocumentCallbackHandler to iterate through each document
        mongoTemplate.executeQuery(query, collectionName, new DocumentCallbackHandler() {
            @Override
            public void processDocument(Document document) {
                // Generate a random UUID and ensure it is unique within the collection
                String uniqueGid;
                do {
                    uniqueGid = UuidCreator.getTimeOrderedEpoch().toString();
                } while (isGidPresent(mongoTemplate, collectionName, uniqueGid));

                // Create an update object to add the 'gid' field
                Update update = new Update();
                update.set("gid", uniqueGid);

                // Create a query to match the current document by its _id
                Query idQuery = new Query(Criteria.where("_id").is(document.getObjectId("_id")).andOperator(Criteria.where("gid").isNull()));

                // Update the document with the new 'gid' field
                mongoTemplate.updateFirst(idQuery, update, collectionName);
            }
        });
    }

    private boolean isGidPresent(MongoTemplate mongoTemplate, String collectionName, String gid) {
        Query query = new Query(Criteria.where("gid").is(gid));
        return mongoTemplate.exists(query, collectionName);
    }

    public static Index makeIndex(String... fields) {
        if (fields.length == 1) {
            return new Index(fields[0], Sort.Direction.ASC).named(fields[0]);
        } else {
            org.bson.Document doc = new org.bson.Document();
            for (String field : fields) {
                doc.put(field, 1);
            }
            return new CompoundIndexDefinition(doc);
        }
    }

    public static void ensureIndexes(MongoTemplate mongoTemplate, Class<?> entityClass, Index... indexes) {
        IndexOperations indexOps = mongoTemplate.indexOps(entityClass);
        for (Index index : indexes) {
            indexOps.createIndex(index);
        }
    }

    public static void dropIndexIfExists(MongoTemplate mongoTemplate, Class<?> entityClass, String name) {
        try {
            mongoTemplate.indexOps(entityClass).dropIndex(name);
        } catch (UncategorizedMongoDbException ignored) {
        }
    }

}
