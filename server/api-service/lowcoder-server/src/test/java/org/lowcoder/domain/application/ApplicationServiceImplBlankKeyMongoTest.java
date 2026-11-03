package org.lowcoder.domain.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.sdk.constants.FieldName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.test.context.ActiveProfiles;

/**
 * NEW-104: {@code ApplicationServiceImpl.findByIdIn} against the MongoDB test container (shared {@code test} context, ids
 * generated per test): a null key in the slug query matched every application without a slug, a blank key the application
 * stored with that slug, and a null first key did not fail. Each case stores what it needs through the Mongo template and
 * removes it again (one removal query by the stored gids, the removed count asserted, a removal failure attached to the
 * case's failure as suppressed). Limits: the blank slugs of M3 cannot be unique, so M3 asserts the answer is exactly C and
 * prints what was answered; the shared database may hold other applications without a slug, which the null-key cases
 * would have answered at HEAD too.
 */
@SpringBootTest(classes = ServerApplication.class)
@ActiveProfiles("test")
class ApplicationServiceImplBlankKeyMongoTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(30);
    private static final String LOG_PREFIX = "[ApplicationServiceImplBlankKeyMongoTest] ";
    /** The applications without a slug the null-key case stores, so that a slug lookup by null matches several. */
    private static final int APPS_WITHOUT_A_SLUG = 2;
    private static final String WITHOUT_A_SLUG_NAME = "without-a-slug";
    private static final String BLANK_SLUG_NAME = "blank-slug";
    private static final String KEPT_NAME = "kept";
    private static final String EMPTY_KEY = "";
    private static final String WHITESPACE_KEY = " ";

    @Autowired
    private ApplicationService applicationService;
    @Autowired
    private ReactiveMongoTemplate mongo;

    static Stream<String> blankKeys() {
        return Stream.of(EMPTY_KEY, WHITESPACE_KEY);
    }

    /** An application with this name and slug (null: none), its gid recorded in {@code storedGids} before it is saved. */
    private Application save(List<String> storedGids, String name, String slug) {
        String gid = UUID.randomUUID().toString();
        storedGids.add(gid);
        Application application = Application.builder().name(name).gid(gid).slug(slug).editingApplicationDSL(new HashMap<>()).build();
        return mongo.save(application).block(TIMEOUT);
    }

    /** C: an application with a slug, unique per case. */
    private Application saveKept(List<String> storedGids) {
        return save(storedGids, KEPT_NAME, "s" + UUID.randomUUID().toString().replace("-", ""));
    }

    private List<String> answered(List<String> keys) {
        return applicationService.findByIdIn(keys).map(Application::getId).collectList().block(TIMEOUT);
    }

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

    private void removeStored(List<String> storedGids) {
        long removed = mongo.remove(Query.query(Criteria.where(FieldName.GID).in(storedGids)), Application.class).block(TIMEOUT)
                .getDeletedCount();
        System.out.println(LOG_PREFIX + "removed " + removed + " of the " + storedGids.size() + " application(s) the case stored");
        assertThat(removed).as("applications removed").isEqualTo(storedGids.size());
    }

    /**
     * A null key in the list names no application; {@code findByIdIn([C.id, null])} answers C only. The slug query ran
     * first and its null key matched the applications without a slug.
     */
    @Test
    void aNullKeyInFindByIdInMatchesNoApplicationWithoutASlugNEW104() {
        List<String> storedGids = new ArrayList<>();
        runThenRemove(storedGids, () -> {
            for (int i = 0; i < APPS_WITHOUT_A_SLUG; i++) {
                save(storedGids, WITHOUT_A_SLUG_NAME, null);
            }
            Application c = saveKept(storedGids);

            List<String> answered = answered(Arrays.asList(c.getId(), null));

            System.out.println(LOG_PREFIX + "findByIdIn([" + c.getId() + ", null]) with " + APPS_WITHOUT_A_SLUG
                    + " applications without a slug stored -> " + answered);
            assertThat(answered).as("ids answered").containsExactly(c.getId());
        });
    }

    /** A null first key does not fail the call; the answer is the application of the other key. */
    @Test
    void aNullFirstKeyInFindByIdInAnswersAsAnyOtherOrderNEW104() {
        List<String> storedGids = new ArrayList<>();
        runThenRemove(storedGids, () -> {
            for (int i = 0; i < APPS_WITHOUT_A_SLUG; i++) {
                save(storedGids, WITHOUT_A_SLUG_NAME, null);
            }
            Application c = saveKept(storedGids);
            Object[] answer = new Object[1];

            Throwable failure = catchThrowable(() -> answer[0] = answered(Arrays.asList(null, c.getId())));

            System.out.println(LOG_PREFIX + "findByIdIn([null, " + c.getId() + "]) -> failure " + failure + ", answer " + answer[0]);
            assertThat(failure).as("failure of findByIdIn").isNull();
            assertThat(answer[0]).as("ids answered").isEqualTo(List.of(c.getId()));
        });
    }

    /** An empty or whitespace key finds no application by a blank slug either. */
    @ParameterizedTest(name = "key=[{0}]")
    @MethodSource("blankKeys")
    void aBlankKeyInFindByIdInDoesNotFindAnApplicationWithThatSlugNEW104(String key) {
        List<String> storedGids = new ArrayList<>();
        runThenRemove(storedGids, () -> {
            Application blank = save(storedGids, BLANK_SLUG_NAME, key);
            Application c = saveKept(storedGids);

            List<String> answered = answered(List.of(c.getId(), key));

            System.out.println(LOG_PREFIX + "findByIdIn([" + c.getId() + ", [" + key + "]]) with application " + blank.getId()
                    + " holding that slug -> " + answered);
            assertThat(answered).as("ids answered").containsExactly(c.getId());
        });
    }
}
