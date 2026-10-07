package org.lowcoder.domain.util;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.lowcoder.sdk.constants.FieldName;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Lookups of a list of keys in which each key is an object id or a gid, in any mix: the kind is told key by key with
 * {@link FieldName#isGID}, and each kind is queried only when the list has keys of it (BF-076, BF-155). The kind of the
 * whole list used to be taken from one element, so the keys of the other kind were dropped.
 * <p>
 * Limits: the kind of a key is the {@link FieldName#isGID} guess (a key with a hyphen is a gid), so a key is looked up as
 * one kind only; slugs are not handled here (the application lookups query them first).
 */
public final class IdOrGidLookup {

    private IdOrGidLookup() {
    }

    /** The keys of a list by kind, each set in the given order. */
    record Keys(Set<String> ids, Set<String> gids) {
    }

    /** The entities found for the object id keys by {@code byIds} and for the gid keys by {@code byGids}. */
    public static <T> Flux<T> find(Collection<String> keys, Function<Collection<String>, Flux<T>> byIds,
            Function<Collection<String>, Flux<T>> byGids) {
        Keys byKind = splitByKind(keys);
        return Flux.merge(query(byKind.ids(), byIds), query(byKind.gids(), byGids));
    }

    /**
     * The keys that name a found entity, as they were given: an object id key whose entity {@code byIds} finds answers
     * that object id ({@code idOf}), a gid key whose entity {@code byGids} finds answers that gid ({@code gidOf}).
     */
    public static <T> Mono<Set<String>> matchingKeys(Collection<String> keys,
            Function<Collection<String>, Flux<T>> byIds, Function<T, String> idOf,
            Function<Collection<String>, Flux<T>> byGids, Function<T, String> gidOf) {
        Keys byKind = splitByKind(keys);
        return Flux.merge(query(byKind.ids(), byIds).map(idOf), query(byKind.gids(), byGids).map(gidOf))
                .collect(Collectors.toSet());
    }

    /** The keys split by kind with {@link FieldName#isGID}. */
    static Keys splitByKind(Collection<String> keys) {
        Map<Boolean, Set<String>> byIsGid = keys.stream()
                .collect(Collectors.partitioningBy(FieldName::isGID, Collectors.toCollection(LinkedHashSet::new)));
        return new Keys(byIsGid.get(Boolean.FALSE), byIsGid.get(Boolean.TRUE));
    }

    private static <T> Flux<T> query(Set<String> keys, Function<Collection<String>, Flux<T>> lookup) {
        return keys.isEmpty() ? Flux.empty() : lookup.apply(keys);
    }
}
