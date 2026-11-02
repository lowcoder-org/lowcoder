package org.lowcoder.domain.organization;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.lowcoder.domain.organization.model.OrganizationState.ACTIVE;
import static org.lowcoder.domain.organization.model.OrganizationState.DELETED;
import static org.lowcoder.infra.birelation.BiRelationBizType.ORG_MEMBER;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Supplier;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.domain.asset.model.Asset;
import org.lowcoder.domain.asset.service.AssetRepository;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.OrganizationState;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.sdk.constants.FieldName;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import org.springframework.test.context.ActiveProfiles;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * OrganizationServiceImpl against the MongoDB test container (unit U14, task L3-11b), shared {@code test} context, ids
 * generated per test. Not repeated: the happy paths of updateSlug, getAllActive, getByIds, getOrgCommonSettings and
 * updateCommonSettings (OrganizationServiceTest), the BiRelation cascade of org deletion (L4-8 section 9 row), and the
 * asset rows of L3-10 (the logo tests use the real AssetService only for what OrganizationServiceImpl decides).
 */
@SpringBootTest(classes = ServerApplication.class)
@ActiveProfiles("test")
class OrganizationServiceImplMongoTest extends OrganizationMongoTestBase {

    private static final String INVALID_ORG_ID = "INVALID_ORG_ID";
    /** The organizations without a slug the null-key case stores, so that a slug lookup by null matches several. */
    private static final int ORGS_WITHOUT_A_SLUG = 2;
    private static final String WITHOUT_A_SLUG_NAME = "without-a-slug";
    private static final String BLANK_SLUG_NAME = "blank-slug";
    /** The blank keys: none, empty, one space, and other whitespace. */
    private static final String NULL_KEY = null;
    private static final String EMPTY_KEY = "";
    private static final String WHITESPACE_KEY = " ";
    private static final String MIXED_WHITESPACE_KEY = "\t \n";
    /** The key lookups {@code lookupAnswers} runs: getById, getByIdWithDeleted, getOrgCommonSettings. */
    private static final int LOOKUPS = 3;
    private static final byte[] LOGO_BYTES = "logo-bytes".getBytes(StandardCharsets.UTF_8);

    @Autowired
    private OrganizationService organizationService;
    @Autowired
    private AssetRepository assetRepository;

    /** An organisation with a GID-shaped gid (contains a hyphen) and a hyphen-free slug, so every lookup key is usable. */
    private Organization saveOrg(OrganizationState state, String name) {
        Organization org = Organization.builder().name(name).gid(UUID.randomUUID().toString()).slug("s" + newId()).state(state).build();
        return mongo.save(org).block(TIMEOUT);
    }

    private Organization stored(String orgId) {
        return mongo.findById(orgId, Organization.class).block(TIMEOUT);
    }

    private static void assertNoValidOrg(Throwable error) {
        assertThat(error).isInstanceOf(BizException.class);
        BizException biz = (BizException) error;
        System.out.println("[OrganizationServiceImplMongoTest] error " + biz.getError() + " / " + biz.getMessageKey());
        assertThat(biz.getError()).isEqualTo(BizError.UNABLE_TO_FIND_VALID_ORG);
        assertThat(biz.getMessageKey()).isEqualTo(INVALID_ORG_ID);
    }

    private Part pngPart() {
        Part part = Mockito.mock(Part.class);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_PNG);
        Mockito.when(part.headers()).thenReturn(headers);
        Mockito.when(part.content()).thenAnswer(invocation -> Flux.just(new DefaultDataBufferFactory().wrap(LOGO_BYTES)));
        return part;
    }

    private Part svgPart() {
        Part part = Mockito.mock(Part.class);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("image/svg+xml"));
        Mockito.when(part.headers()).thenReturn(headers);
        Mockito.when(part.content()).thenReturn(Flux.just(new DefaultDataBufferFactory().wrap(LOGO_BYTES)));
        return part;
    }

    // ------------------------------------------------------------------ lookups

    /** Catches: a deleted org served as live, or a lookup key (id, gid, slug) not resolving. */
    @Test
    void getByIdResolvesActiveOrgsByIdGidAndSlugAndNeverDeletedOnes() {
        Organization active = saveOrg(ACTIVE, "active");
        Organization deleted = saveOrg(DELETED, "deleted");

        for (String key : new String[] {active.getId(), active.getGid(), active.getSlug()}) {
            assertThat(organizationService.getById(key).block(TIMEOUT).getId()).as("lookup by " + key).isEqualTo(active.getId());
        }
        for (String key : new String[] {deleted.getId(), deleted.getGid(), deleted.getSlug(), newId(), UUID.randomUUID().toString()}) {
            assertThrows(Exception.class, () -> organizationService.getById(key).block(TIMEOUT));
        }
        try {
            organizationService.getById(deleted.getId()).block(TIMEOUT);
        } catch (Exception e) {
            assertNoValidOrg(e);
        }
    }

    /**
     * The answer of each of the three key lookups for {@code key}, in the order getById, getByIdWithDeleted,
     * getOrgCommonSettings: the error it failed with, else what it answered.
     */
    private List<Object> lookupAnswers(String key) {
        List<Object> answers = new ArrayList<>();
        for (Supplier<Object> lookup : List.<Supplier<Object>>of(
                () -> organizationService.getById(key).block(TIMEOUT),
                () -> organizationService.getByIdWithDeleted(key).block(TIMEOUT),
                () -> organizationService.getOrgCommonSettings(key).block(TIMEOUT))) {
            Object[] answer = new Object[1];
            Throwable error = catchThrowable(() -> answer[0] = lookup.get());
            answers.add(error != null ? error : answer[0]);
        }
        System.out.println("[OrganizationServiceImplMongoTest] key [" + key + "]: getById, getByIdWithDeleted, getOrgCommonSettings -> "
                + answers.stream().map(OrganizationServiceImplMongoTest::describe).toList());
        return answers;
    }

    /** A lookup's answer as printed: {@code error/message key} for a BizException, else the error or the answer as text. */
    private static String describe(Object answer) {
        return answer instanceof BizException biz ? biz.getError() + "/" + biz.getMessageKey() : String.valueOf(answer);
    }

    /**
     * All three lookups failed with a BizException UNABLE_TO_FIND_VALID_ORG / INVALID_ORG_ID; {@code allSatisfy} reports every
     * lookup that did not, so that none hides another.
     */
    private static void assertNoValidOrgInEveryLookup(List<Object> answers) {
        assertThat(answers).as("getById, getByIdWithDeleted, getOrgCommonSettings").hasSize(LOOKUPS)
                .allSatisfy(answer -> assertThat(answer).isInstanceOfSatisfying(BizException.class, biz -> {
                    assertThat(biz.getError()).isEqualTo(BizError.UNABLE_TO_FIND_VALID_ORG);
                    assertThat(biz.getMessageKey()).isEqualTo(INVALID_ORG_ID);
                }));
    }

    /**
     * NEW-43: a null key names no organization; each of the three lookups refuses it with UNABLE_TO_FIND_VALID_ORG. It used
     * to be looked up as a slug, which matches every organization without one: with two of them, getById and
     * getOrgCommonSettings failed with Spring's non-unique-result error, and getByIdWithDeleted failed with an
     * IllegalArgumentException from its id lookup.
     */
    @Test
    void aNullKeyIsNoValidOrgInEveryLookupNEW43() {
        List<String> storedGids = new ArrayList<>();
        runThenRemove(storedGids, () -> {
            for (int i = 0; i < ORGS_WITHOUT_A_SLUG; i++) {
                String gid = UUID.randomUUID().toString();
                storedGids.add(gid);
                mongo.save(Organization.builder().name(WITHOUT_A_SLUG_NAME).gid(gid).state(ACTIVE).build()).block(TIMEOUT);
            }
            System.out.println("[OrganizationServiceImplMongoTest] stored " + ORGS_WITHOUT_A_SLUG + " active orgs without a slug; looking up [" + NULL_KEY + "]");

            assertNoValidOrgInEveryLookup(lookupAnswers(NULL_KEY));
        });
    }

    static Stream<String> blankKeys() {
        return Stream.of(EMPTY_KEY, WHITESPACE_KEY, MIXED_WHITESPACE_KEY);
    }

    /**
     * Runs a case's body, then removes the organizations with the gids it recorded (each before its save, so that a save that
     * reached the database but not the case is removed too), so that no other case of the shared database meets them; when
     * the body fails, a failing removal is attached to the body's failure as suppressed instead of replacing it.
     */
    private void runThenRemove(List<String> storedGids, Runnable body) {
        try {
            body.run();
        } catch (RuntimeException | Error failure) {
            try {
                removeStored(storedGids);
            } catch (RuntimeException | Error removal) {
                failure.addSuppressed(removal);
            }
            throw failure;
        }
        removeStored(storedGids);
    }

    /** Removes the organizations with these gids in one query, and checks that one was removed for each gid. */
    private void removeStored(List<String> storedGids) {
        long removed = mongo.remove(Query.query(Criteria.where(FieldName.GID).in(storedGids)), Organization.class).block(TIMEOUT)
                .getDeletedCount();
        System.out.println("[OrganizationServiceImplMongoTest] removed " + removed + " of the " + storedGids.size() + " org(s) the case stored");
        assertThat(removed).as("organizations removed").isEqualTo(storedGids.size());
    }

    /**
     * NEW-43: an empty or whitespace key names no organization either, even when an organization has it as its slug (an
     * empty slug passes {@code SlugUtils}); each lookup refuses it with UNABLE_TO_FIND_VALID_ORG. It used to find that
     * organization.
     */
    @ParameterizedTest(name = "key=[{0}]")
    @MethodSource("blankKeys")
    void aBlankKeyIsNoValidOrgInEveryLookupEvenWhenAnOrgHasItAsItsSlugNEW43(String key) {
        List<String> storedGids = new ArrayList<>();
        runThenRemove(storedGids, () -> {
            String gid = UUID.randomUUID().toString();
            storedGids.add(gid);
            Organization blank = mongo.save(Organization.builder().name(BLANK_SLUG_NAME).gid(gid).slug(key).state(ACTIVE).build())
                    .block(TIMEOUT);
            System.out.println("[OrganizationServiceImplMongoTest] stored org " + blank.getId() + " with the slug [" + key + "]; looking it up");

            assertNoValidOrgInEveryLookup(lookupAnswers(key));
        });
    }

    /** Throws nothing: the failure of {@code call}, or null. */
    private static Throwable failureOf(Runnable call) {
        return catchThrowable(call::run);
    }

    /**
     * NEW-81: a null key in the list names no organization; {@code getByIds([C.id, null])} answers C only. The slug query ran
     * first (C's id is no gid) and its null key matched the organizations without a slug, which skipped the id query.
     */
    @Test
    void aNullKeyInGetByIdsMatchesNoOrganizationWithoutASlugNEW81() {
        List<String> storedGids = new ArrayList<>();
        runThenRemove(storedGids, () -> {
            for (int i = 0; i < ORGS_WITHOUT_A_SLUG; i++) {
                String gid = UUID.randomUUID().toString();
                storedGids.add(gid);
                mongo.save(Organization.builder().name(WITHOUT_A_SLUG_NAME).gid(gid).state(ACTIVE).build()).block(TIMEOUT);
            }
            Organization c = saveOrgRecorded(storedGids);

            List<String> answered = organizationService.getByIds(java.util.Arrays.asList(c.getId(), null)).map(Organization::getId)
                    .collectList().block(TIMEOUT);
            System.out.println("[OrganizationServiceImplMongoTest] getByIds([" + c.getId() + ", null]) with " + ORGS_WITHOUT_A_SLUG
                    + " orgs without a slug stored -> " + answered);
            assertThat(answered).as("ids answered").containsExactly(c.getId());
        });
    }

    /** NEW-81: a null first key does not fail the call; the answer is the organization of the other key. */
    @Test
    void aNullFirstKeyInGetByIdsDoesNotFailNEW81() {
        List<String> storedGids = new ArrayList<>();
        runThenRemove(storedGids, () -> {
            Organization c = saveOrgRecorded(storedGids);
            Object[] answer = new Object[1];

            Throwable failure = failureOf(() -> answer[0] = organizationService.getByIds(java.util.Arrays.asList(null, c.getId()))
                    .map(Organization::getId).collectList().block(TIMEOUT));
            System.out.println("[OrganizationServiceImplMongoTest] getByIds([null, " + c.getId() + "]) -> failure " + failure + ", answer " + answer[0]);
            assertThat(failure).as("failure of getByIds").isNull();
            assertThat(answer[0]).as("ids answered").isEqualTo(List.of(c.getId()));
        });
    }

    /** NEW-81: an empty or whitespace key finds no organization by a blank slug in the list either. */
    @ParameterizedTest(name = "key=[{0}]")
    @MethodSource("blankKeys")
    void aBlankKeyInGetByIdsDoesNotFindAnOrgWithThatSlugNEW81(String key) {
        List<String> storedGids = new ArrayList<>();
        runThenRemove(storedGids, () -> {
            String gid = UUID.randomUUID().toString();
            storedGids.add(gid);
            Organization blank = mongo.save(Organization.builder().name(BLANK_SLUG_NAME).gid(gid).slug(key).state(ACTIVE).build())
                    .block(TIMEOUT);
            Organization c = saveOrgRecorded(storedGids);

            List<String> answered = organizationService.getByIds(List.of(c.getId(), key)).map(Organization::getId).collectList()
                    .block(TIMEOUT);
            System.out.println("[OrganizationServiceImplMongoTest] getByIds([" + c.getId() + ", [" + key + "]]) with org " + blank.getId()
                    + " holding that slug -> " + answered);
            assertThat(answered).as("ids answered").containsExactly(c.getId());
        });
    }

    /** {@link #saveOrg} for a case that removes its organizations: the gid is recorded in {@code storedGids} first. */
    private Organization saveOrgRecorded(List<String> storedGids) {
        Organization org = Organization.builder().name("c").gid(UUID.randomUUID().toString()).slug("s" + newId()).state(ACTIVE).build();
        storedGids.add(org.getGid());
        return mongo.save(org).block(TIMEOUT);
    }

    static Stream<String> unknownKeys() {
        return Stream.of(newId(), UUID.randomUUID().toString());
    }

    /**
     * An unknown non-blank key, an object id and a gid, names no organization either: each lookup refuses it with
     * UNABLE_TO_FIND_VALID_ORG / INVALID_ORG_ID, as before NEW-43, whose fix routes these refusals through one helper too.
     */
    @ParameterizedTest(name = "key=[{0}]")
    @MethodSource("unknownKeys")
    void anUnknownKeyIsNoValidOrgInEveryLookupAsBefore(String key) {
        System.out.println("[OrganizationServiceImplMongoTest] looking up the unknown key [" + key + "]");

        assertNoValidOrgInEveryLookup(lookupAnswers(key));
    }

    /** Catches: the with-deleted lookup filtering by state, or not resolving a key type; unknown keys must fail. */
    @Test
    void getByIdWithDeletedFindsDeletedOrgsByIdGidAndSlug() {
        Organization deleted = saveOrg(DELETED, "deleted");

        for (String key : new String[] {deleted.getId(), deleted.getGid(), deleted.getSlug()}) {
            assertThat(organizationService.getByIdWithDeleted(key).block(TIMEOUT).getId()).as("lookup by " + key).isEqualTo(deleted.getId());
        }
        for (String key : new String[] {newId(), UUID.randomUUID().toString()}) {
            assertThrows(Exception.class, () -> organizationService.getByIdWithDeleted(key).block(TIMEOUT));
        }
    }

    /** Catches: the settings of a deleted or unknown org being readable. */
    @Test
    void commonSettingsOfADeletedOrUnknownOrgAreNotReadable() {
        Organization deleted = saveOrg(DELETED, "deleted");
        for (String key : new String[] {deleted.getId(), deleted.getGid(), newId()}) {
            assertThrows(Exception.class, () -> organizationService.getOrgCommonSettings(key).block(TIMEOUT));
        }
        Organization active = saveOrg(ACTIVE, "active");
        assertThat(organizationService.getOrgCommonSettings(active.getGid()).block(TIMEOUT)).isNotNull();
    }

    /** Catches: the wrong error for an invalid or duplicate slug, a duplicate slug being applied, an unknown org erroring. */
    @Test
    void updateSlugRejectsInvalidAndDuplicateSlugsAndIgnoresUnknownOrgs() {
        Organization first = saveOrg(ACTIVE, "first");
        Organization second = saveOrg(ACTIVE, "second");
        String newSlug = "n" + newId();

        assertThat(slugError(first.getId(), "bad slug!")).isEqualTo(BizError.SLUG_INVALID);
        assertThat(slugError(first.getId(), second.getSlug())).isEqualTo(BizError.SLUG_DUPLICATE_ENTRY);
        assertThat(stored(first.getId()).getSlug()).as("a rejected slug is not applied").isEqualTo(first.getSlug());

        assertThat(organizationService.updateSlug(first.getId(), newSlug).block(TIMEOUT).getSlug()).isEqualTo(newSlug);
        assertThat(stored(first.getId()).getSlug()).isEqualTo(newSlug);
        assertThat(organizationService.updateSlug(newId(), "u" + newId()).blockOptional(TIMEOUT)).as("unknown org completes empty").isEmpty();
        System.out.println("[OrganizationServiceImplMongoTest] slug errors checked; unknown org completes empty");
    }

    private BizError slugError(String orgId, String slug) {
        try {
            organizationService.updateSlug(orgId, slug).block(TIMEOUT);
        } catch (RuntimeException e) {
            Throwable cause = e instanceof BizException ? e : e.getCause();
            return ((BizException) cause).getError();
        }
        throw new AssertionError("expected an error for slug " + slug);
    }

    /**
     * BF-133 (was the behaviour candidate L6, "accepted but not resolvable by slug"): SlugUtils accepts a hyphen in a
     * slug, and getById, which took any key with a hyphen for a GID only, now looks such a key up as a slug after the GID.
     */
    @Test
    void aSlugWithAHyphenIsAcceptedAndResolvableBySlugBF133() {
        Organization org = saveOrg(ACTIVE, "hyphen");
        String slug = "my-" + newId();

        Organization updated = organizationService.updateSlug(org.getId(), slug).block(TIMEOUT);

        assertThat(updated.getSlug()).isEqualTo(slug);
        Organization found = organizationService.getById(slug).block(TIMEOUT);
        System.out.println("[OrganizationServiceImplMongoTest] slug " + slug + " accepted; getById by that slug -> " + found.getId());
        assertThat(found.getId()).isEqualTo(org.getId());
    }

    /** Catches: a lost update time of a setting, or other keys being touched. */
    @Test
    void updateCommonSettingsStoresTheValueAndItsUpdateTime() {
        Organization org = saveOrg(ACTIVE, "settings");
        long before = System.currentTimeMillis();

        assertThat(organizationService.updateCommonSettings(org.getId(), "theme", "dark").block(TIMEOUT)).isTrue();
        assertThat(organizationService.updateCommonSettings(org.getId(), "lang", "de").block(TIMEOUT)).isTrue();

        Map<String, Object> settings = stored(org.getId()).getCommonSettings();
        System.out.println("[OrganizationServiceImplMongoTest] settings " + settings);
        assertThat(settings).containsEntry("theme", "dark").containsEntry("lang", "de");
        assertThat(((Number) settings.get("theme_updateTime")).longValue()).isBetween(before, System.currentTimeMillis());
        assertThat(settings).containsKey("lang_updateTime");
    }

    /** Catches: a partial update overwriting the unset fields with null. */
    @Test
    void updateChangesOnlyTheGivenFields() {
        Organization org = saveOrg(ACTIVE, "keep-name");

        assertThat(organizationService.update(org.getId(), Organization.builder().contactName("Ada").build()).block(TIMEOUT)).isTrue();

        Organization after = stored(org.getId());
        assertThat(after.getContactName()).isEqualTo("Ada");
        assertThat(after.getName()).isEqualTo("keep-name");
        assertThat(after.getState()).isEqualTo(ACTIVE);
    }

    /** Catches: a company or source mix-up, or deleted orgs matching. */
    @Test
    void bySourceAndCompanyIdMatchesOnlyActiveOrgsOfThatSourceAndCompany() {
        String company = "c" + newId();
        Organization match = mongo.save(Organization.builder().name("m").gid(UUID.randomUUID().toString()).state(ACTIVE)
                .source("wecom").thirdPartyCompanyId(company).build()).block(TIMEOUT);
        mongo.save(Organization.builder().name("d").gid(UUID.randomUUID().toString()).state(DELETED)
                .source("lark").thirdPartyCompanyId(company).build()).block(TIMEOUT);

        assertThat(organizationService.getBySourceAndTpCompanyId("wecom", company).block(TIMEOUT).getId()).isEqualTo(match.getId());
        assertThat(organizationService.getBySourceAndTpCompanyId("lark", company).blockOptional(TIMEOUT)).isEmpty();
        assertThat(organizationService.getBySourceAndTpCompanyId("wecom", "other" + company).blockOptional(TIMEOUT)).isEmpty();
    }

    // ------------------------------------------------------------------ user org lists

    /** Catches: other users' or deleted orgs listed, a case-sensitive or missing name filter, a count that disagrees. */
    @Test
    void userOrgsAreTheActiveOrgsOfTheMembershipsFilteredByNameAndCounted() {
        String user = newId();
        String stranger = newId();
        String token = "Zeta" + newId();
        Organization alpha = saveOrg(ACTIVE, token + " Alpha");
        Organization beta = saveOrg(ACTIVE, token + " Beta");
        Organization gone = saveOrg(DELETED, token + " Gone");
        Organization foreign = saveOrg(ACTIVE, token + " Foreign");
        Organization unrelated = saveOrg(ACTIVE, "Unrelated" + newId());
        for (Organization org : List.of(alpha, beta, gone, unrelated)) {
            orgMemberService.addMember(org.getId(), user, MemberRole.MEMBER).block(TIMEOUT);
        }
        orgMemberService.addMember(foreign.getId(), stranger, MemberRole.MEMBER).block(TIMEOUT);
        PageRequest all = PageRequest.of(0, 10);

        List<String> byName = organizationService.findUserOrgs(user, token.toLowerCase(), all).map(Organization::getId).collectList().block(TIMEOUT);
        System.out.println("[OrganizationServiceImplMongoTest] orgs of the user matching the name: " + byName.size());
        assertThat(byName).containsExactlyInAnyOrder(alpha.getId(), beta.getId());
        assertThat(organizationService.countUserOrgs(user, token.toLowerCase()).block(TIMEOUT)).isEqualTo(2L);
        assertThat(organizationService.findUserOrgs(user, "", all).collectList().block(TIMEOUT)).hasSize(3);
        assertThat(organizationService.countUserOrgs(user, "").block(TIMEOUT)).isEqualTo(3L);
        assertThat(organizationService.countUserOrgs(user, null).block(TIMEOUT)).as("a null name means no filter").isEqualTo(3L);
        assertThat(organizationService.findUserOrgs(user, token, PageRequest.of(0, 1)).collectList().block(TIMEOUT)).hasSize(1);
        assertThat(organizationService.findUserOrgs(user, token, PageRequest.of(1, 1)).collectList().block(TIMEOUT)).hasSize(1);
        assertThat(organizationService.findUserOrgs(user, token, PageRequest.of(2, 1)).collectList().block(TIMEOUT)).isEmpty();
        assertThat(organizationService.findUserOrgs(newId(), "", all).collectList().block(TIMEOUT)).isEmpty();
        assertThat(organizationService.countUserOrgs(newId(), "").block(TIMEOUT)).isZero();
    }

    /**
     * Candidate L3 (service level only: UserController.getUserOrgs maps a null name to "" before calling, :145): what
     * findUserOrgs does with a null name, recorded as observed (printed, not asserted beyond "does not hang").
     */
    @Test
    void findUserOrgsWithANullNameIsRecorded() {
        String user = newId();
        Organization org = saveOrg(ACTIVE, "nullname" + newId());
        orgMemberService.addMember(org.getId(), user, MemberRole.MEMBER).block(TIMEOUT);
        String outcome;
        try {
            outcome = "returned " + organizationService.findUserOrgs(user, null, PageRequest.of(0, 10)).collectList().block(TIMEOUT).size() + " orgs";
        } catch (RuntimeException e) {
            outcome = "failed with " + e.getClass().getSimpleName();
        }
        System.out.println("[OrganizationServiceImplMongoTest] findUserOrgs with a null name " + outcome);
    }

    // ------------------------------------------------------------------ logo

    /** Catches: an uploaded logo not stored or not referenced; a rejected type changing anything. */
    @Test
    void uploadLogoStoresTheAssetAndReferencesItAndRejectsOtherTypes() {
        Organization org = saveOrg(ACTIVE, "logo");

        assertThat(organizationService.uploadLogo(org.getId(), pngPart()).block(TIMEOUT)).isTrue();

        String assetId = stored(org.getId()).getLogoAssetId();
        System.out.println("[OrganizationServiceImplMongoTest] logo asset " + assetId);
        assertThat(assetId).isNotBlank();
        Asset asset = assetRepository.findById(assetId).block(TIMEOUT);
        assertThat(asset.getData()).isEqualTo(LOGO_BYTES);
        assertThat(asset.getContentType()).isEqualTo(MediaType.IMAGE_PNG_VALUE);

        assertThrows(RuntimeException.class, () -> organizationService.uploadLogo(org.getId(), svgPart()).block(TIMEOUT));
        assertThat(stored(org.getId()).getLogoAssetId()).as("a rejected upload leaves the logo alone").isEqualTo(assetId);
    }

    /**
     * BF-063 (formerly pinned as plan section 9 row "uploadLogo never removes the previous logo asset (prevAssetId read from
     * a new empty Organization)": two uploads left two assets stored and the first one orphaned): the previous asset id is
     * read from the stored organization, so a second upload removes the first asset and references the second.
     */
    @Test
    void aSecondLogoUploadRemovesTheFirstAssetBF063() {
        Organization org = saveOrg(ACTIVE, "logo-twice");

        organizationService.uploadLogo(org.getId(), pngPart()).block(TIMEOUT);
        String first = stored(org.getId()).getLogoAssetId();
        assertThat(organizationService.uploadLogo(org.getId(), pngPart()).block(TIMEOUT)).isTrue();
        String second = stored(org.getId()).getLogoAssetId();

        System.out.println("[OrganizationServiceImplMongoTest] first asset " + first + " present="
                + assetRepository.findById(first).blockOptional(TIMEOUT).isPresent() + " after the second " + second);
        assertThat(second).isNotBlank().isNotEqualTo(first);
        assertThat(assetRepository.findById(first).blockOptional(TIMEOUT)).as("the first logo asset is removed").isEmpty();
        assertThat(assetRepository.findById(second).blockOptional(TIMEOUT)).isPresent();
    }

    /** Catches: deleteLogo leaving the asset or the reference stored; the error cases mapping to the wrong key. */
    @Test
    void deleteLogoRemovesTheAssetAndTheReferenceAndFailsWithoutALogo() {
        Organization org = saveOrg(ACTIVE, "logo-delete");
        organizationService.uploadLogo(org.getId(), pngPart()).block(TIMEOUT);
        String assetId = stored(org.getId()).getLogoAssetId();

        assertThat(organizationService.deleteLogo(org.getId()).block(TIMEOUT)).isTrue();

        System.out.println("[OrganizationServiceImplMongoTest] after deleteLogo by id: asset present="
                + assetRepository.findById(assetId).blockOptional(TIMEOUT).isPresent() + " reference=" + stored(org.getId()).getLogoAssetId());
        assertThat(assetRepository.findById(assetId).blockOptional(TIMEOUT)).isEmpty();
        assertThat(stored(org.getId()).getLogoAssetId()).as("the reference is removed (BF-064)").isNull();

        Organization withoutLogo = saveOrg(ACTIVE, "never-had-a-logo");
        BizException noLogo = assertThrows(BizException.class, () -> blockOrUnwrap(organizationService.deleteLogo(withoutLogo.getId())));
        assertThat(noLogo.getError()).isEqualTo(BizError.NO_RESOURCE_FOUND);
        assertThat(noLogo.getMessageKey()).isEqualTo("ASSET_NOT_FOUND");
        assertThat(noLogo.getArgs()).containsExactly("");

        Organization dangling = saveOrg(ACTIVE, "dangling");
        String missingAsset = newId();
        organizationService.update(dangling.getId(), Organization.builder().logoAssetId(missingAsset).build()).block(TIMEOUT);
        BizException missing = assertThrows(BizException.class, () -> blockOrUnwrap(organizationService.deleteLogo(dangling.getId())));
        assertThat(missing.getMessageKey()).isEqualTo("ASSET_NOT_FOUND");
        assertThat(missing.getArgs()).containsExactly(missingAsset);
    }

    private static <T> T blockOrUnwrap(Mono<T> mono) {
        try {
            return mono.block(TIMEOUT);
        } catch (RuntimeException e) {
            if (e instanceof BizException) {
                throw e;
            }
            if (e.getCause() instanceof BizException biz) {
                throw biz;
            }
            throw e;
        }
    }
}
