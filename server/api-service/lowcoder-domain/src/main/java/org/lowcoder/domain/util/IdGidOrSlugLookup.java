package org.lowcoder.domain.util;

import java.util.function.Function;
import java.util.function.Supplier;

import org.apache.commons.lang3.StringUtils;
import org.lowcoder.sdk.constants.FieldName;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * The one entity a single key names, where the key may be an object id, a gid or a slug: a key with a hyphen
 * ({@link FieldName#isGID}) is looked up by gid and any other key by object id, and only a key that names nothing that way is
 * looked up as a slug, answered when exactly one entity has it (NEW-78: the slug came first, so an entity whose slug equalled
 * another entity's object id or gid was answered for it). Empty for a blank key (null, empty or whitespace, as
 * {@code StringUtils.isBlank} decides; no lookup runs, NEW-86's rule) and for a key that names nothing; the error
 * {@code sharedSlug} supplies for a slug more than one entity has. Limits: the slug lookup is whatever {@code bySlug}
 * queries, not scoped to an organization; no index makes slugs unique (NEW-87), so the answer follows the stored data at the
 * moment of the read; the gid lookup takes the first match; a slug match is read at most twice, so the error does not say how
 * many entities share it.
 */
public final class IdGidOrSlugLookup {

    /** Two matches tell a shared slug; no more are read. */
    private static final int SHARED_SLUG_MATCHES = 2;

    private IdGidOrSlugLookup() {
    }

    /**
     * The entity {@code key} names, as the class description says: by gid for a key with a hyphen, else by object id, and only
     * then by slug.
     *
     * @param sharedSlug supplies the error for a slug more than one entity has
     */
    public static <T> Mono<T> find(String key, Function<String, Mono<T>> byId, Function<String, Flux<T>> byGid,
            Function<String, Flux<T>> bySlug, Supplier<? extends RuntimeException> sharedSlug) {
        if (StringUtils.isBlank(key)) {
            return Mono.empty();
        }
        Mono<T> idOrGid = FieldName.isGID(key) ? byGid.apply(key).next() : byId.apply(key);
        return idOrGid.switchIfEmpty(Mono.defer(() -> bySlug.apply(key).take(SHARED_SLUG_MATCHES).collectList()
                .flatMap(matches -> matches.size() == 1 ? Mono.just(matches.get(0))
                        : matches.isEmpty() ? Mono.<T>empty() : Mono.error(sharedSlug.get()))));
    }
}
