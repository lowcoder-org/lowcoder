package org.lowcoder.domain.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * {@link IdGidOrSlugLookup}: a key with a hyphen is looked up by gid, any other key by object id, and only a key that names
 * nothing that way is looked up as a slug, answered when exactly one entity has it (NEW-78). The three lookups are lambdas
 * over fixed lists of {@link Row}s, each counting its calls.
 */
class IdGidOrSlugLookupTest {

    private static final String LOG_PREFIX = "[IdGidOrSlugLookupTest] ";
    private static final Duration TIMEOUT = Duration.ofSeconds(5);

    record Row(String name, String id, String gid, String slug) {
    }

    /** An object id (24 hex) key and a gid (hyphenated) key. */
    static final String OBJECT_ID_KEY = "0123456789abcdef01234567";
    static final String GID_KEY = "gid-key-0001";
    static final String SLUG_KEY = "my-unique-slug";
    static final String UNKNOWN_KEY = "nothing-names-this";
    static final String SHARED_SLUG_MESSAGE = "shared slug";
    static final RuntimeException SHARED_SLUG_ERROR = new IllegalStateException(SHARED_SLUG_MESSAGE);

    static final Row BY_ID = new Row("by-id", OBJECT_ID_KEY, "other-gid-1", "slug-of-by-id");
    static final Row BY_GID = new Row("by-gid", "ffffffffffffffffffffffff", GID_KEY, "slug-of-by-gid");
    static final Row SECOND_BY_GID = new Row("second-by-gid", "eeeeeeeeeeeeeeeeeeeeeeee", GID_KEY, "slug-of-second");
    static final Row SLUG_HOLDER_OF_OBJECT_ID_KEY = new Row("slug-holder-1", "dddddddddddddddddddddddd", "other-gid-2", OBJECT_ID_KEY);
    static final Row SLUG_HOLDER_OF_GID_KEY = new Row("slug-holder-2", "cccccccccccccccccccccccc", "other-gid-3", GID_KEY);
    static final Row SHARING_ONE = new Row("sharing-1", "bbbbbbbbbbbbbbbbbbbbbbbb", "other-gid-4", OBJECT_ID_KEY);
    static final Row SHARING_TWO = new Row("sharing-2", "aaaaaaaaaaaaaaaaaaaaaaaa", "other-gid-5", OBJECT_ID_KEY);
    static final Row SHARING_THREE = new Row("sharing-3", "999999999999999999999999", "other-gid-6", OBJECT_ID_KEY);
    static final Row SHARING_GID_ONE = new Row("sharing-g1", "888888888888888888888888", "other-gid-7", GID_KEY);
    static final Row SHARING_GID_TWO = new Row("sharing-g2", "777777777777777777777777", "other-gid-8", GID_KEY);
    static final Row UNIQUE_SLUG = new Row("unique-slug", "666666666666666666666666", "other-gid-9", SLUG_KEY);

    private final AtomicInteger idCalls = new AtomicInteger();
    private final AtomicInteger gidCalls = new AtomicInteger();
    private final AtomicInteger slugCalls = new AtomicInteger();

    private Function<String, Mono<Row>> byId(List<Row> table) {
        return key -> {
            idCalls.incrementAndGet();
            return Flux.fromIterable(table).filter(row -> key.equals(row.id())).next();
        };
    }

    private Function<String, Flux<Row>> byGid(List<Row> table) {
        return key -> {
            gidCalls.incrementAndGet();
            return Flux.fromIterable(table).filter(row -> key.equals(row.gid()));
        };
    }

    private Function<String, Flux<Row>> bySlug(List<Row> table) {
        return key -> {
            slugCalls.incrementAndGet();
            return Flux.fromIterable(table).filter(row -> key.equals(row.slug()));
        };
    }

    private Row find(String key, List<Row> table) {
        System.out.println(LOG_PREFIX + "key '" + key + "' over rows " + table);
        Row answer = IdGidOrSlugLookup.find(key, byId(table), byGid(table), bySlug(table), () -> SHARED_SLUG_ERROR).block(TIMEOUT);
        System.out.println(LOG_PREFIX + "key '" + key + "' -> " + answer + " (id calls " + idCalls
                + ", gid calls " + gidCalls + ", slug calls " + slugCalls + ")");
        return answer;
    }

    /** Catches: the slug asked before the object id, so another entity's slug equal to the id shadowing it. */
    @Test
    void anObjectIdKeyFoundByIdIsAnsweredWithoutASlugQueryNEW78() {
        Row answer = find(OBJECT_ID_KEY, List.of(SLUG_HOLDER_OF_OBJECT_ID_KEY, BY_ID));

        assertThat(answer).isSameAs(BY_ID);
        assertThat(slugCalls.get()).as("slug calls").isZero();
        assertThat(gidCalls.get()).as("gid calls").isZero();
    }

    /** Catches: the slug asked before the gid, or a gid key sent to the object id query. */
    @Test
    void aGidKeyFoundByGidIsAnsweredWithoutASlugQueryNEW78() {
        Row answer = find(GID_KEY, List.of(SLUG_HOLDER_OF_GID_KEY, BY_GID));

        assertThat(answer).isSameAs(BY_GID);
        assertThat(slugCalls.get()).as("slug calls").isZero();
        assertThat(idCalls.get()).as("id calls").isZero();
    }

    /** Catches: the slug fallback lost for a key that names nothing by id or gid. */
    @ParameterizedTest
    @ValueSource(strings = {OBJECT_ID_KEY, GID_KEY})
    void aKeyNothingNamesByIdOrGidFallsBackToItsOneSlugMatchNEW78(String key) {
        Row holder = OBJECT_ID_KEY.equals(key) ? SLUG_HOLDER_OF_OBJECT_ID_KEY : SLUG_HOLDER_OF_GID_KEY;

        Row answer = find(key, List.of(holder));

        assertThat(answer).isSameAs(holder);
        assertThat(slugCalls.get()).as("slug calls").isEqualTo(1);
    }

    /** Catches: a shared slug answered with the first match, or as empty, instead of the supplied error. */
    @ParameterizedTest
    @ValueSource(strings = {OBJECT_ID_KEY, GID_KEY})
    void aSlugTwoEntitiesShareIsTheSharedSlugErrorNEW78(String key) {
        List<Row> table = OBJECT_ID_KEY.equals(key) ? List.of(SHARING_ONE, SHARING_TWO, SHARING_THREE)
                : List.of(SHARING_GID_ONE, SHARING_GID_TWO);

        Throwable error = org.junit.jupiter.api.Assertions.assertThrows(RuntimeException.class, () -> find(key, table));

        System.out.println(LOG_PREFIX + "key '" + key + "' over sharing rows " + table + " -> " + error);
        assertThat(error).isSameAs(SHARED_SLUG_ERROR);
    }

    /** Catches: a key nothing names answered with something, or an error instead of empty. */
    @Test
    void aKeyNothingNamesIsEmptyNEW78() {
        assertThat(find(UNKNOWN_KEY, List.of(BY_ID, BY_GID, UNIQUE_SLUG))).isNull();
        assertThat(slugCalls.get()).as("slug calls").isEqualTo(1);
    }

    /** Catches: the blank guard removed, so a blank key is looked up (NEW-86's rule: no lookup runs). */
    @ParameterizedTest
    @ValueSource(strings = {"", " ", "\t \n"})
    void aBlankKeyIsEmptyWithoutAnyLookupNEW78(String key) {
        Row blankSlug = new Row("blank-slug", OBJECT_ID_KEY, GID_KEY, key);

        assertThat(find(key, List.of(blankSlug))).isNull();
        assertThat(IdGidOrSlugLookup.find(null, byId(List.of(blankSlug)), byGid(List.of(blankSlug)), bySlug(List.of(blankSlug)),
                () -> SHARED_SLUG_ERROR).block(TIMEOUT)).isNull();
        assertThat(idCalls.get()).as("id calls").isZero();
        assertThat(gidCalls.get()).as("gid calls").isZero();
        assertThat(slugCalls.get()).as("slug calls").isZero();
    }

    /** Pins the stated limit: the gid lookup takes the first match, a second gid match is not read as an error. */
    @Test
    void aSecondGidMatchIsNotReadNEW78() {
        Row answer = find(GID_KEY, List.of(BY_GID, SECOND_BY_GID));

        assertThat(answer).isSameAs(BY_GID);
        assertThat(slugCalls.get()).as("slug calls").isZero();
    }
}
