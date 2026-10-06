package org.lowcoder.infra.birelation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;
import org.lowcoder.infra.InfraMongoTestConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

/**
 * {@link BiRelationServiceImpl} against a real MongoDB (the context and database of {@link InfraMongoTestConfiguration}).
 * Every test writes only rows whose source, target and relation values carry a random run prefix, and counts only by
 * those values.
 */
@SpringBootTest(classes = InfraMongoTestConfiguration.class)
@ActiveProfiles(InfraMongoTestConfiguration.PROFILE)
class BiRelationServiceImplTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(20);
    private static final BiRelationBizType BIZ_TYPE = BiRelationBizType.RESOURCE;
    private static final BiRelationBizType OTHER_BIZ_TYPE = BiRelationBizType.GROUP_MEMBER;

    @Autowired
    private BiRelationService service;

    private final String run = UUID.randomUUID().toString();

    private String id(String name) {
        return run + "-" + name;
    }

    private BiRelation add(BiRelationBizType bizType, String source, String target, String relation) {
        return service.addBiRelation(bizType, id(source), id(target), id(relation), "state").block(TIMEOUT);
    }

    private static Set<String> targets(List<BiRelation> relations) {
        return relations.stream().map(BiRelation::getTargetId).collect(Collectors.toSet());
    }

    @Test
    void addBiRelationOverloadsStoreTheExtraParametersAndNullBecomesEmpty() {
        BiRelation five = service.addBiRelation(BIZ_TYPE, id("s"), id("t5"), id("r"), "state").block(TIMEOUT);
        BiRelation six = service.addBiRelation(BIZ_TYPE, id("s"), id("t6"), id("r"), "state", "e1").block(TIMEOUT);
        BiRelation seven = service.addBiRelation(BIZ_TYPE, id("s"), id("t7"), id("r"), "state", "e1", "e2").block(TIMEOUT);
        BiRelation eight = service.addBiRelation(BIZ_TYPE, id("s"), id("t8"), id("r"), "state", "e1", "e2", "e3").block(TIMEOUT);

        assertThat(List.of(five, six, seven, eight)).extracting(BiRelation::getExtParam1, BiRelation::getExtParam2, BiRelation::getExtParam3)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("", "", ""),
                        org.assertj.core.groups.Tuple.tuple("e1", "", ""),
                        org.assertj.core.groups.Tuple.tuple("e1", "e2", ""),
                        org.assertj.core.groups.Tuple.tuple("e1", "e2", "e3"));
        BiRelation stored = service.getById(eight.getId()).block(TIMEOUT);
        assertThat(stored.getBizType()).isEqualTo(BIZ_TYPE);
        assertThat(stored.getSourceId()).isEqualTo(id("s"));
        assertThat(stored.getTargetId()).isEqualTo(id("t8"));
        assertThat(stored.getRelation()).isEqualTo(id("r"));
        assertThat(stored.getState()).isEqualTo("state");
        assertThat(stored.getCreateTime()).isPositive();
    }

    @Test
    void addBiRelationOfAModelAndBatchAddStoreTheGivenRows() {
        BiRelation model = BiRelation.builder().bizType(BIZ_TYPE).sourceId(id("s")).targetId(id("t1")).relation(id("r")).state("state").build();
        BiRelation second = BiRelation.builder().bizType(BIZ_TYPE).sourceId(id("s")).targetId(id("t2")).relation(id("r")).state("state").build();
        BiRelation third = BiRelation.builder().bizType(BIZ_TYPE).sourceId(id("s")).targetId(id("t3")).relation(id("r")).state("state").build();

        BiRelation saved = service.addBiRelation(model).block(TIMEOUT);
        List<BiRelation> batch = service.batchAddBiRelation(List.of(second, third)).block(TIMEOUT);

        assertThat(saved.getId()).isNotNull();
        assertThat(batch).hasSize(2).allSatisfy(row -> assertThat(row.getId()).isNotNull());
        assertThat(service.countBySourceId(BIZ_TYPE, id("s")).block(TIMEOUT)).isEqualTo(3);
    }

    @Test
    void removeBiRelationByIdDeletesTheRow() {
        BiRelation saved = add(BIZ_TYPE, "s", "t", "r");

        assertThat(service.removeBiRelationById(saved.getId()).block(TIMEOUT)).isTrue();
        assertThat(service.getById(saved.getId()).blockOptional(TIMEOUT)).isEmpty();
    }

    @Test
    void upsertRejectsABlankSourceOrTargetOrANullBizTypeBeforeTouchingTheDatabase() {
        BiRelation noSource = BiRelation.builder().bizType(BIZ_TYPE).sourceId(" ").targetId(id("t")).build();
        BiRelation noTarget = BiRelation.builder().bizType(BIZ_TYPE).sourceId(id("s")).targetId(null).build();
        BiRelation noBizType = BiRelation.builder().sourceId(id("s")).targetId(id("t")).build();

        assertThatThrownBy(() -> service.upsert(noSource)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.upsert(noTarget)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.upsert(noBizType)).isInstanceOf(IllegalArgumentException.class);
        assertThat(service.countBySourceId(BIZ_TYPE, id("s")).block(TIMEOUT)).isZero();
    }

    @Test
    void upsertKeepsOneRowPerBizTypeSourceAndTarget() {
        BiRelation first = BiRelation.builder().bizType(BIZ_TYPE).sourceId(id("s")).targetId(id("t")).relation(id("r1")).state("state").build();
        BiRelation same = BiRelation.builder().bizType(BIZ_TYPE).sourceId(id("s")).targetId(id("t")).relation(id("r1")).state("state").build();
        BiRelation changed = BiRelation.builder().bizType(BIZ_TYPE).sourceId(id("s")).targetId(id("t")).relation(id("r2")).state("state").build();
        BiRelation otherType = BiRelation.builder().bizType(OTHER_BIZ_TYPE).sourceId(id("s")).targetId(id("t")).relation(id("r3")).state("state").build();

        Boolean inserted = service.upsert(first).block(TIMEOUT);
        Boolean unchanged = service.upsert(same).block(TIMEOUT);
        Boolean modified = service.upsert(changed).block(TIMEOUT);
        service.upsert(otherType).block(TIMEOUT);

        assertThat(List.of(inserted, unchanged, modified)).containsExactly(false, false, true);
        assertThat(service.getBySourceId(BIZ_TYPE, id("s")).collectList().block(TIMEOUT)).singleElement()
                .satisfies(row -> assertThat(row.getRelation()).isEqualTo(id("r2")));
        assertThat(service.getBySourceId(OTHER_BIZ_TYPE, id("s")).collectList().block(TIMEOUT)).hasSize(1);
    }

    @Test
    void theFindersFilterByBizTypeSourceAndTarget() {
        add(BIZ_TYPE, "s1", "t1", "r1");
        add(BIZ_TYPE, "s1", "t2", "r2");
        add(BIZ_TYPE, "s2", "t1", "r1");
        add(OTHER_BIZ_TYPE, "s1", "t3", "r1");

        assertThat(targets(service.getBySourceId(BIZ_TYPE, id("s1")).collectList().block(TIMEOUT))).containsExactlyInAnyOrder(id("t1"), id("t2"));
        assertThat(service.getBySourceId(BIZ_TYPE, id("s1"), PageRequest.of(0, 1)).collectList().block(TIMEOUT)).hasSize(1);
        assertThat(service.getBySourceId(BIZ_TYPE, id("s1"), PageRequest.of(1, 1)).collectList().block(TIMEOUT)).hasSize(1);
        assertThat(service.getBySourceId(BIZ_TYPE, id("s1"), PageRequest.of(2, 1)).collectList().block(TIMEOUT)).isEmpty();
        assertThat(service.getBySourceIds(BIZ_TYPE, List.of(id("s1"), id("s2"))).collectList().block(TIMEOUT)).hasSize(3);
        assertThat(service.getByTargetId(BIZ_TYPE, id("t1")).collectList().block(TIMEOUT)).hasSize(2);
        assertThat(service.getByTargetIds(BIZ_TYPE, List.of(id("t1"), id("t2"))).collectList().block(TIMEOUT)).hasSize(3);
        assertThat(service.getByTargetIdAndSourceIds(BIZ_TYPE, id("t1"), List.of(id("s1"))).collectList().block(TIMEOUT)).singleElement()
                .satisfies(row -> assertThat(row.getSourceId()).isEqualTo(id("s1")));
        assertThat(service.getBiRelation(BIZ_TYPE, id("s1"), id("t2")).block(TIMEOUT).getRelation()).isEqualTo(id("r2"));
        assertThat(service.getBiRelation(BIZ_TYPE, id("s1"), id("t3")).blockOptional(TIMEOUT)).isEmpty();
    }

    @Test
    void theCountsFilterByBizTypeAndTheCountedValue() {
        add(BIZ_TYPE, "s1", "t1", "r1");
        add(BIZ_TYPE, "s1", "t2", "r2");
        add(BIZ_TYPE, "s2", "t1", "r1");
        add(OTHER_BIZ_TYPE, "s1", "t3", "r1");

        assertThat(service.countByRelation(BIZ_TYPE, id("r1")).block(TIMEOUT)).isEqualTo(2);
        assertThat(service.countByRelation(OTHER_BIZ_TYPE, id("r1")).block(TIMEOUT)).isEqualTo(1);
        assertThat(service.countBySourceId(BIZ_TYPE, id("s1")).block(TIMEOUT)).isEqualTo(2);
        assertThat(service.countByTargetId(BIZ_TYPE, id("t1")).block(TIMEOUT)).isEqualTo(2);
        assertThat(service.countByTargetId(BIZ_TYPE, id("none")).block(TIMEOUT)).isZero();
    }

    @Test
    void getBySourceIdAndRelationReturnsTheRowsOfTheRelationAndAllRowsForANullOrBlankRelation() {
        add(BIZ_TYPE, "s", "t1", "r1");
        add(BIZ_TYPE, "s", "t2", "r2");
        add(BIZ_TYPE, "s", "t3", "r1");

        List<BiRelation> withRelation = service.getBySourceIdAndRelation(BIZ_TYPE, id("s"), id("r1")).collectList().block(TIMEOUT);
        List<BiRelation> nullRelation = service.getBySourceIdAndRelation(BIZ_TYPE, id("s"), null).collectList().block(TIMEOUT);
        List<BiRelation> blankRelation = service.getBySourceIdAndRelation(BIZ_TYPE, id("s"), "  ").collectList().block(TIMEOUT);
        List<BiRelation> noMatch = service.getBySourceIdAndRelation(BIZ_TYPE, id("s"), id("none")).collectList().block(TIMEOUT);

        System.out.println("[BiRelationServiceImplTest] by relation " + targets(withRelation) + ", null " + targets(nullRelation)
                + ", blank " + targets(blankRelation) + ", no match " + targets(noMatch));
        assertThat(targets(withRelation)).containsExactlyInAnyOrder(id("t1"), id("t3"));
        assertThat(targets(nullRelation)).containsExactlyInAnyOrder(id("t1"), id("t2"), id("t3"));
        assertThat(targets(blankRelation)).containsExactlyInAnyOrder(id("t1"), id("t2"), id("t3"));
        assertThat(noMatch).isEmpty();
    }

    @Test
    void updateRelationAndUpdateStateReportWhetherARowMatched() {
        BiRelation saved = add(BIZ_TYPE, "s", "t", "r");

        assertThat(service.updateRelation(BIZ_TYPE, id("s"), id("t"), id("r-new")).block(TIMEOUT)).isTrue();
        assertThat(service.updateState(BIZ_TYPE, id("s"), id("t"), "state-new").block(TIMEOUT)).isTrue();
        assertThat(service.updateRelation(BIZ_TYPE, id("s"), id("none"), id("x")).block(TIMEOUT)).isFalse();
        assertThat(service.updateState(BIZ_TYPE, id("s"), id("none"), "x").block(TIMEOUT)).isFalse();

        BiRelation stored = service.getById(saved.getId()).block(TIMEOUT);
        assertThat(stored.getRelation()).isEqualTo(id("r-new"));
        assertThat(stored.getState()).isEqualTo("state-new");
    }

    @Test
    void removeBiRelationDeletesOneRowAndReportsWhetherOneExisted() {
        add(BIZ_TYPE, "s", "t1", "r");
        add(BIZ_TYPE, "s", "t2", "r");

        assertThat(service.removeBiRelation(BIZ_TYPE, id("s"), id("t1")).block(TIMEOUT)).isTrue();
        assertThat(service.removeBiRelation(BIZ_TYPE, id("s"), id("t1")).block(TIMEOUT)).isFalse();
        assertThat(service.countBySourceId(BIZ_TYPE, id("s")).block(TIMEOUT)).isEqualTo(1);
    }

    @Test
    void theBulkRemovesSelectByBizTypeAndTheGivenKeys() {
        add(BIZ_TYPE, "s1", "t1", "r");
        add(BIZ_TYPE, "s1", "t2", "r");
        add(BIZ_TYPE, "s2", "t1", "r");
        add(BIZ_TYPE, "s3", "t1", "r");
        add(BIZ_TYPE, "s4", "t4", "r");
        add(OTHER_BIZ_TYPE, "s1", "t1", "r");

        assertThat(service.removeAllBiRelationsBySourceIdAndTargetId(BIZ_TYPE, id("s1"), id("t1")).block(TIMEOUT)).isTrue();
        assertThat(service.removeAllBiRelationsByTargetId(BIZ_TYPE, id("t1")).block(TIMEOUT)).isTrue();
        assertThat(service.removeAllBiRelations(BIZ_TYPE, List.of(id("s1"), id("s4"))).block(TIMEOUT)).isTrue();
        assertThat(service.removeAllBiRelations(BIZ_TYPE, List.of(id("s1"), id("s4"))).block(TIMEOUT)).isFalse();

        assertThat(service.countBySourceId(BIZ_TYPE, id("s1")).block(TIMEOUT)).isZero();
        assertThat(service.countBySourceId(BIZ_TYPE, id("s2")).block(TIMEOUT)).isZero();
        assertThat(service.countBySourceId(BIZ_TYPE, id("s3")).block(TIMEOUT)).isZero();
        assertThat(service.countBySourceId(BIZ_TYPE, id("s4")).block(TIMEOUT)).isZero();
        assertThat(service.countBySourceId(OTHER_BIZ_TYPE, id("s1")).block(TIMEOUT)).as("another bizType is not touched").isEqualTo(1);
    }

    /**
     * DEFECT pinned (plan section 9 row, D-6, fix deferred): {@code removeAllBiRelations(bizType, sourceId)} builds
     * {@code where(RELATION).is("super_admin").not()} (BiRelationServiceImpl.java:135), and Spring turns that into the
     * plain criterion {@code {"relation": "super_admin"}}: the negation is lost. The call therefore deletes only the
     * super_admin row of the source and keeps every other member. It runs when an organization or a group is deleted
     * (deleteOrgMembers, deleteGroupMembers, through OrgAndGroupEventListener.java:65 and :121), so a deleted org or
     * group keeps all its members except the super admin. The obvious fix is {@code where(RELATION).ne("super_admin")}
     * (delete everything except super_admin, as the code reads), which turns this test red.
     */
    @Test
    void removeAllBiRelationsOfASourceDeletesOnlyTheSuperAdminRow() {
        service.addBiRelation(BIZ_TYPE, id("s"), id("t1"), "super_admin", "state").block(TIMEOUT);
        service.addBiRelation(BIZ_TYPE, id("s"), id("t2"), "member", "state").block(TIMEOUT);
        service.addBiRelation(BIZ_TYPE, id("s"), id("t3"), "viewer", "state").block(TIMEOUT);
        service.addBiRelation(OTHER_BIZ_TYPE, id("s"), id("t4"), "super_admin", "state").block(TIMEOUT);

        Boolean removed = service.removeAllBiRelations(BIZ_TYPE, id("s")).block(TIMEOUT);

        List<BiRelation> left = service.getBySourceId(BIZ_TYPE, id("s")).collectList().block(TIMEOUT);
        System.out.println("[BiRelationServiceImplTest] removeAllBiRelations(source) answered " + removed + ", left " + targets(left));
        assertThat(removed).isTrue();
        assertThat(targets(left)).containsExactlyInAnyOrder(id("t2"), id("t3"));
        assertThat(service.countBySourceId(OTHER_BIZ_TYPE, id("s")).block(TIMEOUT)).as("another bizType is not touched").isEqualTo(1);
    }

    /**
     * DEFECT pinned (plan section 9 row, D-6, fix deferred): {@code removeBiRelationById} answers true for an id that
     * no row has, because it maps the completion of {@code deleteById} (which is empty for a missing id) to true
     * (BiRelationServiceImpl.java:231-233); false is only produced by an error. Caller:
     * ResourcePermissionRepositoryImpl.java:79 (removePermissionById). The obvious fix is to answer from whether a row
     * existed (for example {@code existsById} before the delete), which turns this test red.
     */
    @Test
    void removeBiRelationByIdAnswersTrueForAnIdNoRowHas() {
        Boolean answer = service.removeBiRelationById(new org.bson.types.ObjectId().toHexString()).block(TIMEOUT);

        assertThat(answer).isTrue();
    }
}
