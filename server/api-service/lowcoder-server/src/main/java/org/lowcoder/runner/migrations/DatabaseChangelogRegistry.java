package org.lowcoder.runner.migrations;

import java.util.List;

import org.lowcoder.runner.migrations.job.AddPtmFieldsJob;
import org.lowcoder.runner.migrations.job.AddSuperAdminUser;
import org.lowcoder.runner.migrations.job.CompleteAuthType;
import org.lowcoder.runner.migrations.job.MigrateAuthConfigJob;
import org.lowcoder.sdk.config.CommonConfig;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.data.mongodb.core.MongoTemplate;

/**
 * Lists the change sets of {@link DatabaseChangelog} for {@link MigrationRunner}, with the beans each one is given.
 *
 * <p>The {@code order}, {@code id} and {@code author} of an entry are the keys of the migration history that databases
 * already hold (see {@link MigrationHistory}): never change or reuse them, and add a new change set with the next
 * order after the last one. The order values have gaps: 005, 007 and 011 are not in the change log.
 *
 * <p>The registry exists only outside the {@code test} profile, so the Spring contexts of the tests do not run the
 * change sets at startup; a test that wants them uses the profile of {@code DatabaseChangelogMigrationsTest}.
 */
@Configuration
@Profile("!test")
public class DatabaseChangelogRegistry {

    private static final String CHANGE_LOG_CLASS = DatabaseChangelog.class.getName();

    @Bean
    public MigrationRegistry databaseChangelogMigrations(MongoTemplate mongoTemplate, CommonConfig commonConfig,
            MigrateAuthConfigJob migrateAuthConfigJob, CompleteAuthType completeAuthType,
            AddSuperAdminUser addSuperAdminUser, AddPtmFieldsJob addPtmFieldsJob) {
        return create(new DatabaseChangelog(), mongoTemplate, commonConfig, migrateAuthConfigJob, completeAuthType,
                addSuperAdminUser, addPtmFieldsJob);
    }

    /** The registry over the given change log and beans; a test passes a change log of its own or mocked jobs. */
    public static MigrationRegistry create(DatabaseChangelog changelog, MongoTemplate mongoTemplate,
            CommonConfig commonConfig, MigrateAuthConfigJob migrateAuthConfigJob, CompleteAuthType completeAuthType,
            AddSuperAdminUser addSuperAdminUser, AddPtmFieldsJob addPtmFieldsJob) {
        return new MigrationRegistry(List.of(
                step("001", "init-indexes", "", "addInitialIndexes", () -> changelog.addInitialIndexes(mongoTemplate)),
                step("002", "add-organization-indexes-v2", "", "addOrganizationIndexes", () -> changelog.addOrganizationIndexes(mongoTemplate)),
                step("003", "add-serverlog-indexes", "", "addServerLogIndexes", () -> changelog.addServerLogIndexes(mongoTemplate)),
                step("004", "add-token-based-connection-indexes", "", "addDatasourceConnectionIndexes", () -> changelog.addDatasourceConnectionIndexes(mongoTemplate)),
                step("006", "add-org-domain-indexes", "", "addOrgDomainIndexes", () -> changelog.addOrgDomainIndexes(mongoTemplate)),
                step("008", "generate-deployment-id", "", "generateInstanceId", () -> changelog.generateInstanceId(mongoTemplate)),
                step("009", "add-group-type-indexes", "", "addGroupTypeIndex", () -> changelog.addGroupTypeIndex(mongoTemplate)),
                step("010", "add-event-log-indexes", "", "addEventLogIndex", () -> changelog.addEventLogIndex(mongoTemplate)),
                step("012", "add-library-query-indexes", "", "addLibraryQueryIndex", () -> changelog.addLibraryQueryIndex(mongoTemplate)),
                step("013", "update-datasource-idnexes", "", "updateDatasourceIndex", () -> changelog.updateDatasourceIndex(mongoTemplate)),
                step("014", "add-material-meta-indexes", "", "addMaterialMetaIndex", () -> changelog.addMaterialMetaIndex(mongoTemplate)),
                step("015", "add-bi-relation-indexes", "", "addBiRelationIndex", () -> changelog.addBiRelationIndex(mongoTemplate)),
                step("016", "update-user-connections-index", "", "updateUserConnectionsIndex", () -> changelog.updateUserConnectionsIndex(mongoTemplate)),
                step("017", "migrate-auth-configs", "", "migrateAuthConfigs", () -> changelog.migrateAuthConfigs(migrateAuthConfigJob)),
                step("018", "complete-auth-type", "", "completeAuthType", () -> changelog.completeAuthType(completeAuthType)),
                step("019", "add-org-id-index-on-server-log", "", "addOrgIdIndexOnServerLog", () -> changelog.addOrgIdIndexOnServerLog(mongoTemplate)),
                step("020", "add-super-admin-user", "", "addSuperAdminUser", () -> changelog.addSuperAdminUser(addSuperAdminUser)),
                step("021", "add-ptm-fields-to-applications", "", "addPtmFieldsToApplicatgions", () -> changelog.addPtmFieldsToApplicatgions(addPtmFieldsJob)),
                step("022", "add-gid", "", "addGidToDBObjects", () -> changelog.addGidToDBObjects(mongoTemplate)),
                step("023", "add-email", "", "addEmailField", () -> changelog.addEmailField(mongoTemplate)),
                step("024", "fill-create-at", "", "fillCreateAt", () -> changelog.fillCreateAt(mongoTemplate)),
                step("025", "add-gid-indexes-unique", "", "addGidIndexesUnique", () -> changelog.addGidIndexesUnique(mongoTemplate)),
                step("026", "add-time-series-snapshot-history", "", "addTimeSeriesSnapshotHistory", () -> changelog.addTimeSeriesSnapshotHistory(mongoTemplate, commonConfig)),
                step("027", "populate-email-in-user-connections", "Thomas", "populateEmailInUserConnections", () -> changelog.populateEmailInUserConnections(mongoTemplate, commonConfig)),
                step("028", "published-to-record", "Thomas", "publishedToRecord", () -> changelog.publishedToRecord(mongoTemplate, commonConfig)),
                step("029", "add-tag-index-to-record", "Thomas", "addTagIndexToRecord", () -> changelog.addTagIndexToRecord(mongoTemplate, commonConfig)),
                step("030", "rename-application-record-collection", "Thomas", "renameApplicationRecordCollection", () -> changelog.renameApplicationRecordCollection(mongoTemplate, mongoTemplate.getDb())),
                step("031", "delete-old-super-admin", "Thomas", "deleteOldSuperAdmin", () -> changelog.deleteOldSuperAdmin(mongoTemplate, mongoTemplate.getDb())),
                step("032", "normalize-email-backfill", "", "normalizeEmailBackfill", () -> changelog.normalizeEmailBackfill(mongoTemplate.getDb()))));
    }

    private static MigrationStep step(String order, String id, String author, String method, Runnable body) {
        return new MigrationStep(order, id, author, CHANGE_LOG_CLASS, method, body);
    }
}
