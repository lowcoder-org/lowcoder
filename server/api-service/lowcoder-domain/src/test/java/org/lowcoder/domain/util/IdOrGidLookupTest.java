package org.lowcoder.domain.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.function.Function;

import org.junit.jupiter.api.Test;

import reactor.core.publisher.Flux;

/**
 * {@link IdOrGidLookup}: each key goes to the query of its kind ({@code FieldName.isGID}: a key with a hyphen is a gid),
 * a kind without keys is not queried, and the matching keys are answered as given. The queries are recorded lambdas over
 * an in-memory table of {@link Row}s.
 */
class IdOrGidLookupTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(5);

    record Row(String id, String gid) {
    }

    static final String ID_1 = "id1";
    static final String ID_2 = "id2";
    static final String ID_3 = "id3";
    static final String GID_1 = "aa-01";
    static final String GID_2 = "aa-02";
    static final String GID_3 = "aa-03";
    /** An object id key and a gid key that name no row. */
    static final String MISSING_ID = "missing";
    static final String MISSING_GID = "aa-none";

    private static final List<Row> TABLE = List.of(new Row(ID_1, GID_1), new Row(ID_2, GID_2), new Row(ID_3, GID_3));

    private final List<Collection<String>> idQueries = new ArrayList<>();
    private final List<Collection<String>> gidQueries = new ArrayList<>();

    private final Function<Collection<String>, Flux<Row>> byIds = keys -> {
        idQueries.add(keys);
        return Flux.fromIterable(TABLE).filter(row -> keys.contains(row.id()));
    };
    private final Function<Collection<String>, Flux<Row>> byGids = keys -> {
        gidQueries.add(keys);
        return Flux.fromIterable(TABLE).filter(row -> keys.contains(row.gid()));
    };

    @Test
    void splitByKindPutsEachKeyUnderItsKindInTheGivenOrder() {
        IdOrGidLookup.Keys kinds = IdOrGidLookup.splitByKind(List.of(GID_2, ID_1, GID_1, ID_1, ID_2));

        System.out.println("[IdOrGidLookupTest] split -> " + kinds);
        assertThat(kinds.ids()).containsExactly(ID_1, ID_2);
        assertThat(kinds.gids()).containsExactly(GID_2, GID_1);
    }

    @Test
    void findAnswersTheRowsOfBothKindsOfAMixedList() {
        List<Row> found = IdOrGidLookup.find(List.of(GID_2, ID_1, MISSING_ID, MISSING_GID), byIds, byGids).collectList().block(TIMEOUT);

        System.out.println("[IdOrGidLookupTest] find -> " + found + ", id queries " + idQueries + ", gid queries " + gidQueries);
        assertThat(found).containsExactlyInAnyOrder(TABLE.get(0), TABLE.get(1));
        assertThat(idQueries).containsExactly(Set.of(ID_1, MISSING_ID));
        assertThat(gidQueries).containsExactly(Set.of(GID_2, MISSING_GID));
    }

    @Test
    void aKindWithoutKeysIsNotQueried() {
        assertThat(IdOrGidLookup.find(List.of(ID_3), byIds, byGids).collectList().block(TIMEOUT)).containsExactly(TABLE.get(2));
        assertThat(gidQueries).isEmpty();
        assertThat(IdOrGidLookup.find(List.of(GID_3), byIds, byGids).collectList().block(TIMEOUT)).containsExactly(TABLE.get(2));
        assertThat(idQueries).hasSize(1);
        assertThat(IdOrGidLookup.find(List.of(), byIds, byGids).collectList().block(TIMEOUT)).isEmpty();
        assertThat(idQueries).hasSize(1);
        assertThat(gidQueries).hasSize(1);
    }

    @Test
    void matchingKeysAnswersTheKeysAsGiven() {
        Set<String> keys = IdOrGidLookup.matchingKeys(List.of(GID_2, ID_1, MISSING_ID, MISSING_GID), byIds, Row::id, byGids, Row::gid)
                .block(TIMEOUT);

        System.out.println("[IdOrGidLookupTest] matching keys -> " + keys);
        assertThat(keys).containsExactlyInAnyOrder(GID_2, ID_1);
        assertThat(IdOrGidLookup.matchingKeys(List.of(), byIds, Row::id, byGids, Row::gid).block(TIMEOUT)).isEmpty();
    }
}
