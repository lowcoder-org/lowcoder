package org.lowcoder.runner.migrations;

import com.github.cloudyrock.mongock.ChangeLog;
import com.github.cloudyrock.mongock.ChangeSet;
import com.github.cloudyrock.mongock.driver.mongodb.springdata.v4.decorator.impl.MongockTemplate;
import com.github.f4b6a3.uuid.UuidCreator;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.lowcoder.domain.application.model.Application;
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
import org.lowcoder.runner.migrations.job.MigrateAuthConfigJob;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.UncategorizedMongoDbException;
import org.springframework.data.mongodb.core.DocumentCallbackHandler;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.time.Instant;
import java.util.Set;

import static org.lowcoder.domain.util.QueryDslUtils.fieldName;
import static org.lowcoder.sdk.util.IDUtils.generate;

@SuppressWarnings("all")
@Slf4j
@ChangeLog(order = "001")
@Profile("!test")
public class DatabaseChangelog {

    @ChangeSet(order = "001", id = "init-indexes", author = "")
    public void addInitialIndexes(MongockTemplate mongoTemplate) {
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

    @ChangeSet(order = "002", id = "add-organization-indexes-v2", author = "")
    public void addOrganizationIndexes(MongockTemplate mongoTemplate) {
        ensureIndexes(mongoTemplate, Organization.class,
                makeIndex("source", "tpCompanyId").unique().sparse()
        );
    }

    @ChangeSet(order = "003", id = "add-serverlog-indexes", author = "")
    public void addServerLogIndexes(MongockTemplate mongoTemplate) {
        ensureIndexes(mongoTemplate, ServerLog.class,
                makeIndex("userId"),
                makeIndex("createTime")
        );
    }

    @ChangeSet(order = "004", id = "add-token-based-connection-indexes", author = "")
    public void addDatasourceConnectionIndexes(MongockTemplate mongoTemplate) {
        ensureIndexes(mongoTemplate, TokenBasedConnection.class,
                makeIndex("datasourceId").unique()
        );
    }

    @ChangeSet(order = "006", id = "add-org-domain-indexes", author = "")
    public void addOrgDomainIndexes(MongockTemplate mongoTemplate) {
        ensureIndexes(mongoTemplate, Organization.class,
                makeIndex("organizationDomain.domain").unique().sparse()
        );
    }

    @ChangeSet(order = "008", id = "generate-deployment-id", author = "")
    public void generateInstanceId(MongockTemplate mongoTemplate) {
        mongoTemplate.insert(ServerConfig.builder()
                .key("deployment.id")
                .value(generate())
                .build());
    }

    @ChangeSet(order = "009", id = "add-group-type-indexes", author = "")
    public void addGroupTypeIndex(MongockTemplate mongoTemplate) {
        ensureIndexes(mongoTemplate, Group.class, makeIndex("organizationId", "type"));
    }

    @ChangeSet(order = "010", id = "add-event-log-indexes", author = "")
    public void addEventLogIndex(MongockTemplate mongoTemplate) {
        ensureIndexes(mongoTemplate, EventLog.class,
                makeIndex("deploymentId", "eventType", "log.applicationId").sparse(),
                makeIndex("deploymentId", "eventType", "log.userId").sparse()
        );
    }

    @ChangeSet(order = "012", id = "add-library-query-indexes", author = "")
    public void addLibraryQueryIndex(MongockTemplate mongoTemplate) {
        ensureIndexes(mongoTemplate, LibraryQuery.class,
                makeIndex("organizationId").sparse());

        ensureIndexes(mongoTemplate, LibraryQueryRecord.class,
                makeIndex("libraryQueryId").sparse());
    }

    @ChangeSet(order = "013", id = "update-datasource-idnexes", author = "")
    public void updateDatasourceIndex(MongockTemplate mongoTemplate) {
        dropIndexIfExists(mongoTemplate, Datasource.class, "organization_datasource_compound_index");
        ensureIndexes(mongoTemplate, Datasource.class,
                makeIndex("organizationId", "name").named("organization_datasource_index"));
    }


    @ChangeSet(order = "014", id = "add-material-meta-indexes", author = "")
    public void addMaterialMetaIndex(MongockTemplate mongoTemplate) {
        ensureIndexes(mongoTemplate, MaterialMeta.class,
                makeIndex("orgId", "type", "filename").unique());
    }

    @ChangeSet(order = "015", id = "add-bi-relation-indexes", author = "")
    public void addBiRelationIndex(MongockTemplate mongoTemplate) {
        ensureIndexes(mongoTemplate, BiRelation.class,
                makeIndex("bizType", "sourceId", "relation"));
    }

    @ChangeSet(order = "016", id = "update-user-connections-index", author = "")
    public void updateUserConnectionsIndex(MongockTemplate mongoTemplate) {
        dropIndexIfExists(mongoTemplate, User.class, "connections.source_1_connections.rawId_1");
        ensureIndexes(mongoTemplate, User.class, makeIndex("connections.source", "connections.rawId").unique().sparse());
    }

    @ChangeSet(order = "017", id = "migrate-auth-configs", author = "")
    public void migrateAuthConfigs(MigrateAuthConfigJob migrateAuthConfigJob) {
        migrateAuthConfigJob.migrateAuthConfig();
    }

    @ChangeSet(order = "018", id = "complete-auth-type", author = "")
    public void completeAuthType(CompleteAuthType completeAuthType) {
        completeAuthType.complete();
    }

    @ChangeSet(order = "019", id = "add-org-id-index-on-server-log", author = "")
    public void addOrgIdIndexOnServerLog(MongockTemplate mongoTemplate) {
        ensureIndexes(mongoTemplate, ServerLog.class,
                makeIndex("orgId")
        );
    }

    @ChangeSet(order = "020", id = "add-super-admin-user", author = "")
    public void addSuperAdminUser(AddSuperAdminUser addSuperAdminUser) {
        addSuperAdminUser.addOrUpdateSuperAdmin();
    }

    @ChangeSet(order = "021", id = "add-ptm-fields-to-applications", author = "")
    public void addPtmFieldsToApplicatgions(AddPtmFieldsJob addPtmFieldsJob) {
        addPtmFieldsJob.migrateApplicationsToInitPtmFields();
    }

    @ChangeSet(order = "022", id = "add-gid", author = "")
    public void addGidToDBObjects(MongockTemplate mongoTemplate) {
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

    @ChangeSet(order = "023", id = "add-email", author = "")
    public void addEmailField(MongockTemplate mongoTemplate) {
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

    @ChangeSet(order = "024", id = "fill-create-at", author = "")
    public void fillCreateAt(MongockTemplate mongoTemplate) {
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
  
    @ChangeSet(order = "025", id = "add-gid-indexes-unique", author = "")
    public void addGidIndexesUnique(MongockTemplate mongoTemplate) {
        // collections to add gid
        String[] collectionNames = {"group", "organization"};

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

    private void addGidField(MongockTemplate mongoTemplate, String collectionName) {
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

    private boolean isGidPresent(MongockTemplate mongoTemplate, String collectionName, String gid) {
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

    public static void ensureIndexes(MongockTemplate mongoTemplate, Class<?> entityClass, Index... indexes) {
        IndexOperations indexOps = mongoTemplate.indexOps(entityClass);
        for (Index index : indexes) {
            indexOps.ensureIndex(index);
        }
    }

    public static void dropIndexIfExists(MongockTemplate mongoTemplate, Class<?> entityClass, String name) {
        try {
            mongoTemplate.indexOps(entityClass).dropIndex(name);
        } catch (UncategorizedMongoDbException ignored) {
        }
    }

}
