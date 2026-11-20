package org.lowcoder.runner.migrations;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.lowcoder.runner.migrations.job.AddPtmFieldsJob;
import org.lowcoder.runner.migrations.job.AddSuperAdminUser;
import org.lowcoder.runner.migrations.job.CompleteAuthType;
import org.lowcoder.runner.migrations.job.MigrateAuthConfigJob;
import org.lowcoder.sdk.config.CommonConfig;
import org.springframework.data.mongodb.core.MongoTemplate;

import lombok.extern.slf4j.Slf4j;

/**
 * {@link MigrationRegistry} and the production list of {@link DatabaseChangelogRegistry}. No database: the production
 * registry is built over mocks, and its bodies are never run here.
 *
 * <p>The history keys are checked against the history Mongock 5.4.0 wrote ({@code migrations/mongock-5.4.0-history.jsonl}),
 * so a changed id, author, class or method name, or a changed order, fails here before it re-runs a migration on a
 * database that recorded it.
 */
@Slf4j
class MigrationRegistryTest {

    private static final String TAG = "[MigrationRegistryTest] ";
    private static final String CHANGE_LOG_CLASS = "test.Changelog";

    private static MigrationRegistry production() {
        return DatabaseChangelogRegistry.create(new DatabaseChangelog(), mock(MongoTemplate.class),
                mock(CommonConfig.class), mock(MigrateAuthConfigJob.class), mock(CompleteAuthType.class),
                mock(AddSuperAdminUser.class), mock(AddPtmFieldsJob.class));
    }

    private static MigrationStep step(String order, String id, String author) {
        return new MigrationStep(order, id, author, CHANGE_LOG_CLASS, "method" + id, () -> { });
    }

    @Test
    void steps_runInAscendingOrderComparedAsText() {
        MigrationRegistry registry = new MigrationRegistry(List.of(step("010", "ten", ""), step("002", "two", ""),
                step("009", "nine", "")));

        assertThat(registry.steps()).extracting(MigrationStep::id).containsExactly("two", "nine", "ten");
    }

    @Test
    void duplicateOrder_isRejected() {
        assertThatThrownBy(() -> new MigrationRegistry(List.of(step("001", "a", ""), step("001", "b", ""))))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("order 001");
    }

    @Test
    void duplicateIdAndAuthor_isRejected_butTheSameIdWithAnotherAuthorIsAnotherChangeSet() {
        assertThatThrownBy(() -> new MigrationRegistry(List.of(step("001", "a", "x"), step("002", "a", "x"))))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("id/author");
        assertThat(new MigrationRegistry(List.of(step("001", "a", "x"), step("002", "a", "y"))).steps()).hasSize(2);
    }

    @Test
    void step_rejectsMissingParts() {
        assertThatThrownBy(() -> new MigrationStep("001", null, "", CHANGE_LOG_CLASS, "m", () -> { }))
                .isInstanceOf(NullPointerException.class).hasMessageContaining("id");
        assertThatThrownBy(() -> new MigrationStep("001", "a", "", CHANGE_LOG_CLASS, "m", null))
                .isInstanceOf(NullPointerException.class).hasMessageContaining("body");
    }

    @Test
    void withBody_keepsTheHistoryIdentity() {
        MigrationStep original = step("001", "a", "x");
        Runnable replacement = () -> { };

        MigrationStep copy = original.withBody(replacement);

        assertThat(copy.body()).isSameAs(replacement);
        assertThat(copy).usingRecursiveComparison().ignoringFields("body").isEqualTo(original);
        assertThat(copy.key()).isEqualTo(new MigrationHistory.ChangeKey("a", "x"));
    }

    @Test
    void productionRegistry_hasTheOrderIdsAuthorsClassAndMethodsMongockRecorded() {
        List<MigrationStep> registered = production().steps();
        List<Document> mongock = MigrationTestDatabase.mongockChangeSetEntries();

        log.info("{}registered {} change sets, Mongock recorded {}", TAG, registered.size(), mongock.size());
        assertThat(registered).as("registered change sets").hasSameSizeAs(mongock).hasSize(29);
        for (int i = 0; i < mongock.size(); i++) {
            Document recorded = mongock.get(i);
            MigrationStep step = registered.get(i);
            String where = "change set #" + i + " (" + recorded.getString(MigrationHistory.CHANGE_ID) + ")";
            assertThat(step.id()).as("id of " + where).isEqualTo(recorded.getString(MigrationHistory.CHANGE_ID));
            assertThat(step.author()).as("author of " + where).isEqualTo(recorded.getString(MigrationHistory.AUTHOR));
            assertThat(step.changeLogClass()).as("class of " + where)
                    .isEqualTo(recorded.getString(MigrationHistory.CHANGE_LOG_CLASS));
            assertThat(step.changeSetMethod()).as("method of " + where)
                    .isEqualTo(recorded.getString(MigrationHistory.CHANGE_SET_METHOD));
        }
    }

    @Test
    void productionRegistry_registersExactlyThePublicChangeSetMethodsOfTheChangeLog() {
        Set<String> registered = production().steps().stream().map(MigrationStep::changeSetMethod)
                .collect(Collectors.toCollection(TreeSet::new));
        Set<String> declared = new TreeSet<>();
        for (Method method : DatabaseChangelog.class.getDeclaredMethods()) {
            if (Modifier.isPublic(method.getModifiers()) && !Modifier.isStatic(method.getModifiers())) {
                declared.add(method.getName());
            }
        }

        assertThat(registered).as("a change set method that is not registered would never run; a registered name"
                + " that is not a method would be recorded under a wrong name").isEqualTo(declared);
    }
}
