package org.lowcoder.domain.bundle;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.meta.MetaController;
import org.lowcoder.api.meta.MetaEndpoints.GetMetaDataRequest;
import org.lowcoder.api.meta.view.BundleMetaView;
import org.lowcoder.api.meta.view.MetaView;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.bundle.service.BundleService;
import org.lowcoder.sdk.constants.FieldName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.test.context.ActiveProfiles;

/**
 * NEW-110 (a pin, test only): {@code BundleServiceImpl.findByIdIn} and {@code POST /api[/v1]/meta/} against the MongoDB test
 * container (shared {@code test} context). P12's step 0 ran null, empty and whitespace bundle keys one at a time and next to a
 * real id, directly and through meta, on this fixture: they never failed and never matched another bundle, so the index's
 * "may fail the whole answer" does not hold and no source changes. These cases pin that observed behaviour: they pass at the
 * base commit, and the mutations of the plan (a null key matching every bundle, a null key throwing) make them fail.
 *
 * <p>Each case stores two bundles (B, which a key names, and OTHER, which no key names, so that a lookup matching every
 * bundle answers more than B) and removes them again (one removal query by the stored gids, the removed count asserted, a
 * removal failure attached to the case's failure as suppressed). Every call and its {@code block} run inside
 * {@code catchThrowable}, and the throwable is asserted null before the answer, so a throw or an error signal is a failed
 * assertion, never a test error. P2 (the three blank keys in one list) was not run by step 0; it is expected to pass.
 * Limits: the claim is no wider than the cases (null, empty and whitespace keys, alone and next to a real id, through the
 * service and through the meta controller bean); no HTTP, no security chain, no exception handler.
 */
@SpringBootTest(classes = ServerApplication.class)
@ActiveProfiles("test")
class BundleServiceImplBlankKeyMongoTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(30);
    private static final String LOG_PREFIX = "[BundleServiceImplBlankKeyMongoTest] ";
    private static final String BUNDLE_NAME_PREFIX = "blank-key-bundle-";
    private static final String EMPTY_KEY = "";
    private static final String WHITESPACE_KEY = " ";

    @Autowired
    private BundleService bundleService;
    @Autowired
    private MetaController metaController;
    @Autowired
    private ReactiveMongoTemplate mongo;

    private Bundle saveBundle(List<String> storedGids) {
        String gid = UUID.randomUUID().toString();
        storedGids.add(gid);
        Bundle bundle = Bundle.builder().name(BUNDLE_NAME_PREFIX + gid).gid(gid).organizationId(new ObjectId().toHexString()).build();
        return mongo.save(bundle).block(TIMEOUT);
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
        long removed = mongo.remove(Query.query(Criteria.where(FieldName.GID).in(storedGids)), Bundle.class).block(TIMEOUT)
                .getDeletedCount();
        System.out.println(LOG_PREFIX + "removed " + removed + " of the " + storedGids.size() + " bundle(s) the case stored");
        assertThat(removed).as("bundles removed").isEqualTo(storedGids.size());
    }

    /** The failure of the call, its subscription or its {@code block} (null if none), and the ids answered. */
    private record Outcome(Throwable failure, List<String> ids) {
    }

    private Outcome findByIdIn(List<String> keys) {
        List<String>[] answer = new List[1];
        Throwable failure = catchThrowable(() -> answer[0] = bundleService.findByIdIn(keys).map(Bundle::getId).collectList().block(TIMEOUT));
        System.out.println(LOG_PREFIX + "findByIdIn(" + keys + ") -> failure " + failure + ", ids " + answer[0]);
        return new Outcome(failure, answer[0]);
    }

    /** P1: a null key next to a real id, in either order, names no other bundle and does not fail. */
    @ParameterizedTest(name = "null first {0}")
    @ValueSource(booleans = {true, false})
    void aNullKeyInFindByIdInMatchesNoBundleNEW110(boolean nullFirst) {
        List<String> storedGids = new ArrayList<>();
        runThenRemove(storedGids, () -> {
            Bundle b = saveBundle(storedGids);
            Bundle other = saveBundle(storedGids);

            Outcome outcome = findByIdIn(nullFirst ? Arrays.asList(null, b.getId()) : Arrays.asList(b.getId(), null));

            System.out.println(LOG_PREFIX + "B=" + b.getId() + ", OTHER=" + other.getId());
            assertThat(outcome.failure()).as("failure of findByIdIn").isNull();
            assertThat(outcome.ids()).as("ids answered").containsExactly(b.getId());
        });
    }

    /** P2: the three blank keys alone name no bundle and do not fail (not run by step 0; expected to pass). */
    @Test
    void onlyBlankKeysInFindByIdInAnswerNoBundleNEW110() {
        List<String> storedGids = new ArrayList<>();
        runThenRemove(storedGids, () -> {
            Bundle b = saveBundle(storedGids);
            Bundle other = saveBundle(storedGids);

            Outcome outcome = findByIdIn(Arrays.asList(null, EMPTY_KEY, WHITESPACE_KEY));

            System.out.println(LOG_PREFIX + "B=" + b.getId() + ", OTHER=" + other.getId());
            assertThat(outcome.failure()).as("failure of findByIdIn").isNull();
            assertThat(outcome.ids()).as("ids answered").isEmpty();
        });
    }

    /** P3: blank bundle keys next to a real id do not fail the meta answer and name no other bundle. */
    @Test
    void blankBundleKeysDoNotFailTheMetaAnswerNEW110() {
        List<String> storedGids = new ArrayList<>();
        runThenRemove(storedGids, () -> {
            Bundle b = saveBundle(storedGids);
            Bundle other = saveBundle(storedGids);
            GetMetaDataRequest request = new GetMetaDataRequest(List.of(), List.of(), List.of(), List.of(),
                    Arrays.asList(b.getId(), null, EMPTY_KEY, WHITESPACE_KEY), List.of(), List.of(), List.of());
            ResponseView<MetaView>[] answer = new ResponseView[1];

            Throwable failure = catchThrowable(() -> answer[0] = metaController.getMetaData(request).block(TIMEOUT));

            List<String> bundleIds = answer[0] == null ? null
                    : answer[0].getData().getBundles().stream().map(BundleMetaView::getId).toList();
            System.out.println(LOG_PREFIX + "B=" + b.getId() + ", OTHER=" + other.getId() + "; getMetaData(bundleIds=[B, null, [], [ ]]) -> failure "
                    + failure + ", bundles " + bundleIds);
            assertThat(failure).as("failure of getMetaData").isNull();
            assertThat(bundleIds).as("bundle ids in the meta answer").isEqualTo(List.of(b.getId()));
        });
    }
}
