package org.lowcoder.infra.mongo;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;
import org.lowcoder.infra.InfraMongoTestConfiguration;
import org.lowcoder.infra.InfraMongoTestConfiguration.BeforeSaveRecorder;
import org.lowcoder.infra.birelation.BiRelation;
import org.lowcoder.infra.birelation.BiRelationBizType;
import org.lowcoder.infra.birelation.BiRelationRepository;
import org.lowcoder.infra.mongo.MongoUpsertHelper.PartialResourceWithId;
import org.lowcoder.sdk.constants.GlobalContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.test.context.ActiveProfiles;
import reactor.core.publisher.Mono;
import reactor.util.context.Context;

/**
 * {@link MongoUpsertHelper} against a real MongoDB (the shared container, a database of this context's own). Every
 * test writes only rows whose source id carries a random run prefix, so nothing depends on other rows.
 *
 * <p>The "modified" flag of {@code update} is deterministic here in both directions: true for a row that exists and
 * false for a query that matches no row. (Which of the two the server's other tests happen to hit in a given build is
 * what made the helper's branch counter vary between builds, docs/COVERAGE_GATE_PLAN.md 2.3.) {@code update} always
 * stamps a new {@code updatedAt}, so a matched-but-unchanged result is only reachable through {@code updatePurely},
 * {@code upsert} and {@code bulkUpdate}, which are tested for it.
 */
@SpringBootTest(classes = InfraMongoTestConfiguration.class)
@ActiveProfiles(InfraMongoTestConfiguration.PROFILE)
class MongoUpsertHelperTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(20);
    private static final BiRelationBizType BIZ_TYPE = BiRelationBizType.RESOURCE;
    private static final String SOURCE_ID = "sourceId";

    @Autowired
    private MongoUpsertHelper helper;
    @Autowired
    private BiRelationRepository repository;
    @Autowired
    private ReactiveMongoTemplate template;
    @Autowired
    private BeforeSaveRecorder recorder;

    private final String run = UUID.randomUUID().toString();

    private String source(String name) {
        return run + "-" + name;
    }

    private BiRelation relation(String source, String relation) {
        return BiRelation.builder().bizType(BIZ_TYPE).sourceId(source).targetId("target").relation(relation).state("state")
                .extParam1("").extParam2("").extParam3("").build();
    }

    private BiRelation save(String source, String relation) {
        return repository.save(relation(source, relation)).block(TIMEOUT);
    }

    private BiRelation reload(String id) {
        return repository.findById(id).block(TIMEOUT);
    }

    private long count(String source) {
        return template.count(new Query(Criteria.where(SOURCE_ID).is(source)), BiRelation.class).block(TIMEOUT);
    }

    private static Query bySource(String source) {
        return new Query(Criteria.where(SOURCE_ID).is(source));
    }

    private static BiRelation partial(String relation) {
        return BiRelation.builder().relation(relation).build();
    }

    @Test
    void theContextHasADatabaseOfItsOwn() {
        String database = template.getMongoDatabase().map(d -> d.getName()).block(TIMEOUT);

        System.out.println("[MongoUpsertHelperTest] database " + database);
        assertThat(database).matches("lowcoder_test_\\d+");
    }

    @Test
    void updateReturnsTrueAndStampsTheAuditFieldsWhenARowMatches() {
        BiRelation saved = save(source("a"), "old");
        int eventsBefore = recorder.events().size();
        BiRelation partial = partial("new");

        Boolean modified = helper.update(partial, bySource(source("a"))).block(TIMEOUT);

        BiRelation reloaded = reload(saved.getId());
        assertThat(modified).isTrue();
        assertThat(reloaded.getRelation()).isEqualTo("new");
        assertThat(reloaded.getState()).as("fields the partial does not carry are kept").isEqualTo("state");
        assertThat(partial.getUpdatedAt()).as("the helper stamps the partial before writing it").isNotNull();
        assertThat(reloaded.getUpdatedAt()).isEqualTo(partial.getUpdatedAt().truncatedTo(java.time.temporal.ChronoUnit.MILLIS));
        assertThat(reloaded.getModifiedBy()).isEqualTo(GlobalContext.SYSTEM_USER_ID);
        assertThat(recorder.events().subList(eventsBefore, recorder.events().size()))
                .hasSize(1).allSatisfy(event -> assertThat(event.source()).isSameAs(partial));
    }

    @Test
    void updateStampsTheVisitorFromTheReactorContext() {
        BiRelation saved = save(source("a"), "old");

        Boolean modified = helper.update(partial("new"), bySource(source("a")))
                .contextWrite(Context.of(GlobalContext.VISITOR_ID, "visitor-1")).block(TIMEOUT);

        assertThat(modified).isTrue();
        assertThat(reload(saved.getId()).getModifiedBy()).isEqualTo("visitor-1");
    }

    @Test
    void updateReturnsFalseAndChangesNothingWhenNoRowMatches() {
        BiRelation saved = save(source("a"), "old");

        Boolean modified = helper.update(partial("new"), bySource(source("missing"))).block(TIMEOUT);

        assertThat(modified).isFalse();
        assertThat(reload(saved.getId()).getRelation()).isEqualTo("old");
    }

    @Test
    void updateByKeyAndValueFollowsTheSameTrueAndFalseRule() {
        BiRelation saved = save(source("a"), "old");

        assertThat(helper.update(partial("new"), SOURCE_ID, source("a")).block(TIMEOUT)).isTrue();
        assertThat(helper.update(partial("newer"), SOURCE_ID, source("missing")).block(TIMEOUT)).isFalse();
        assertThat(reload(saved.getId()).getRelation()).isEqualTo("new");
    }

    @Test
    void updateByIdMatchesAnObjectIdAndTreatsAnIdWithADashAsAGidThatNoRowHas() {
        BiRelation saved = save(source("a"), "old");

        assertThat(helper.updateById(partial("new"), saved.getId()).block(TIMEOUT)).isTrue();
        assertThat(helper.updateById(partial("other"), "no-such-gid").block(TIMEOUT)).isFalse();
        assertThat(reload(saved.getId()).getRelation()).isEqualTo("new");
    }

    @Test
    void updatePurelyWritesOnlyThePartialAndReportsWhetherARowChanged() {
        BiRelation saved = save(source("a"), "old");
        BiRelation before = reload(saved.getId());

        Boolean first = helper.updatePurely(partial("new"), saved.getId()).block(TIMEOUT);
        Boolean sameAgain = helper.updatePurely(partial("new"), saved.getId()).block(TIMEOUT);
        Boolean noMatch = helper.updatePurely(partial("new"), bySource(source("missing"))).block(TIMEOUT);
        Boolean byQuery = helper.updatePurely(partial("newest"), bySource(source("a"))).block(TIMEOUT);

        BiRelation after = reload(saved.getId());
        System.out.println("[MongoUpsertHelperTest] updatePurely " + first + ", " + sameAgain + ", " + noMatch + ", " + byQuery);
        assertThat(List.of(first, sameAgain, noMatch, byQuery)).containsExactly(true, false, false, true);
        assertThat(after.getRelation()).isEqualTo("newest");
        assertThat(after.getUpdatedAt()).as("no audit field is stamped").isEqualTo(before.getUpdatedAt());
    }

    @Test
    void removeReportsWhetherARowWasDeleted() {
        save(source("a"), "old");

        assertThat(helper.remove(bySource(source("a")), BiRelation.class).block(TIMEOUT)).isTrue();
        assertThat(helper.remove(bySource(source("a")), BiRelation.class).block(TIMEOUT)).isFalse();
        assertThat(count(source("a"))).isZero();
    }

    @Test
    void upsertWithAuditingParamsKeepsTheIdAndCreatedFieldsOfAnExistingRow() {
        BiRelation existing = reload(save(source("a"), "old").getId());

        BiRelation byKey = helper.upsertWithAuditingParams(relation(source("a"), "by-key"), SOURCE_ID, source("a")).block(TIMEOUT);
        BiRelation byCriteria = helper.upsertWithAuditingParams(relation(source("a"), "by-criteria"), Criteria.where(SOURCE_ID).is(source("a")))
                .block(TIMEOUT);

        assertThat(byKey.getId()).isEqualTo(existing.getId());
        assertThat(byCriteria.getId()).isEqualTo(existing.getId());
        BiRelation reloaded = reload(existing.getId());
        assertThat(reloaded.getRelation()).isEqualTo("by-criteria");
        assertThat(reloaded.getCreatedAt()).isEqualTo(existing.getCreatedAt());
        assertThat(reloaded.getCreatedBy()).isEqualTo(existing.getCreatedBy()).isEqualTo(InfraMongoTestConfiguration.AUDITOR);
        assertThat(count(source("a"))).isEqualTo(1);
    }

    @Test
    void upsertWithAuditingParamsInsertsWhenNoRowMatches() {
        BiRelation byKey = helper.upsertWithAuditingParams(relation(source("a"), "new"), SOURCE_ID, source("a")).block(TIMEOUT);
        BiRelation byCriteria = helper.upsertWithAuditingParams(relation(source("b"), "new"), Criteria.where(SOURCE_ID).is(source("b")))
                .block(TIMEOUT);

        assertThat(byKey.getId()).isNotNull();
        assertThat(byCriteria.getId()).isNotNull();
        assertThat(count(source("a"))).isEqualTo(1);
        assertThat(count(source("b"))).isEqualTo(1);
    }

    @Test
    void upsertOfAResourceInsertsThenReportsModifiedOnlyWhenARowChanged() {
        Boolean inserted = helper.upsert(relation(source("a"), "v1"), SOURCE_ID, source("a")).block(TIMEOUT);
        Boolean unchanged = helper.upsert(relation(source("a"), "v1"), SOURCE_ID, source("a")).block(TIMEOUT);
        Boolean changed = helper.upsert(relation(source("a"), "v2"), Criteria.where(SOURCE_ID).is(source("a"))).block(TIMEOUT);

        System.out.println("[MongoUpsertHelperTest] upsert resource " + inserted + ", " + unchanged + ", " + changed);
        assertThat(List.of(inserted, unchanged, changed)).containsExactly(false, false, true);
        assertThat(count(source("a"))).isEqualTo(1);
    }

    @Test
    void upsertOfAnUpdateInsertsThenReportsModifiedOnlyWhenARowChanged() {
        Boolean inserted = helper.upsert(new Update().set("relation", "v1"), SOURCE_ID, source("a"), BiRelation.class).block(TIMEOUT);
        Boolean unchanged = helper.upsert(new Update().set("relation", "v1"), Criteria.where(SOURCE_ID).is(source("a")), BiRelation.class)
                .block(TIMEOUT);
        Boolean changed = helper.upsert(new Update().set("relation", "v2"), SOURCE_ID, source("a"), BiRelation.class).block(TIMEOUT);

        System.out.println("[MongoUpsertHelperTest] upsert update " + inserted + ", " + unchanged + ", " + changed);
        assertThat(List.of(inserted, unchanged, changed)).containsExactly(false, false, true);
        assertThat(count(source("a"))).isEqualTo(1);
    }

    @Test
    void bulkUpdateReportsWhetherAnyRowChangedAndAnEmptyCollectionGivesAnEmptyMono() {
        BiRelation first = save(source("a"), "old");
        BiRelation second = save(source("b"), "old");

        Boolean changed = helper.bulkUpdate(List.of(new PartialResourceWithId<>(partial("new"), first.getId()),
                new PartialResourceWithId<>(partial("new"), second.getId()))).block(TIMEOUT);
        Boolean unchanged = helper.bulkUpdate(List.of(new PartialResourceWithId<>(partial("new"), first.getId()))).block(TIMEOUT);
        Boolean unknown = helper.bulkUpdate(List.of(new PartialResourceWithId<>(partial("new"), new ObjectId().toHexString()))).block(TIMEOUT);

        assertThat(List.of(changed, unchanged, unknown)).containsExactly(true, false, false);
        assertThat(reload(first.getId()).getRelation()).isEqualTo("new");
        assertThat(reload(second.getId()).getRelation()).isEqualTo("new");
        assertThat(helper.<BiRelation>bulkUpdate(List.of()).blockOptional(TIMEOUT)).isEmpty();
        assertThat(helper.<BiRelation>bulkUpdate(null).blockOptional(TIMEOUT)).isEmpty();
    }
}
