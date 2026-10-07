package org.lowcoder.domain.bundle.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.domain.bundle.service.BundleServiceImplTestSupport.bundle;
import static org.lowcoder.domain.bundle.service.BundleServiceImplTestSupport.bundleWithGid;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Function;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.domain.bundle.model.Bundle;
import org.mockito.ArgumentMatcher;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * BF-155 (fixed; was pinned as the section 9 family row "id-or-gid routing decided from one element drops the other kind",
 * task L3-12, G3) at the bundle sites: findByIdIn and the public, private, marketplace and agency filters tell each key apart
 * (an object id or a gid) instead of taking the kind of the first one, in either order. Reach: BundlePermissionHandler passes
 * the resource ids of the permission check to getFilteredPublicBundleIds, and MetaController.java:51 passes the client's
 * bundleIds to findByIdIn. The repository is a mock that answers a query only for the keys of its kind.
 */
class BundleServiceImplIdKindFamilyPinTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(5);
    private static final String ID = "plainid";
    private static final String GID = "aa-bb";

    private final BundleServiceImplTestSupport s = new BundleServiceImplTestSupport();

    private static <T extends Iterable<String>> ArgumentMatcher<T> only(String key) {
        return actual -> {
            if (actual == null) {
                return false;
            }
            Set<String> keys = new HashSet<>();
            actual.forEach(keys::add);
            return keys.equals(Set.of(key));
        };
    }

    private static Set<String> ordered(boolean gidFirst) {
        return new LinkedHashSet<>(gidFirst ? List.of(GID, ID) : List.of(ID, GID));
    }

    @ParameterizedTest(name = "gid first {0}")
    @ValueSource(booleans = {true, false})
    void findByIdInOfAGidAndAnIdAnswersBothBF155(boolean gidFirst) {
        when(s.repository.findAllById(argThat(BundleServiceImplIdKindFamilyPinTest.<Iterable<String>>only(ID)))).thenReturn(Flux.just(bundle("by-id")));
        when(s.repository.findAllByGid(argThat(only(GID)))).thenReturn(Flux.just(bundle("by-gid")));

        List<Bundle> found = s.service.findByIdIn(ordered(gidFirst)).collectList().block(TIMEOUT);

        System.out.println("[BundleServiceImplIdKindFamilyPinTest] findByIdIn " + ordered(gidFirst) + " -> " + found.stream().map(Bundle::getId).toList());
        assertThat(found).extracting(Bundle::getId).containsExactlyInAnyOrder("by-id", "by-gid");
    }

    /** Each filter answers the matching keys as given: the object id key as the id, the gid key as the gid. */
    @ParameterizedTest(name = "gid first {0}")
    @ValueSource(booleans = {true, false})
    void theFiltersOfAMixedSetAnswerBothKeysBF155(boolean gidFirst) {
        Bundle byId = bundleWithGid(ID, "gid-of-the-id-match");
        Bundle byGid = bundleWithGid("id-of-the-gid-match", GID);
        when(s.repository.findByPublicToAllIsTrueAndIdIn(argThat(only(ID)))).thenReturn(Flux.just(byId));
        when(s.repository.findByPublicToAllIsTrueAndGidIn(argThat(only(GID)))).thenReturn(Flux.just(byGid));
        when(s.repository.findByCreatedByAndIdIn(eq("user"), argThat(only(ID)))).thenReturn(Flux.just(byId));
        when(s.repository.findByCreatedByAndGidIn(eq("user"), argThat(only(GID)))).thenReturn(Flux.just(byGid));
        when(s.repository.findByPublicToAllIsTrueAndPublicToMarketplaceIsTrueAndIdIn(argThat(only(ID)))).thenReturn(Flux.just(byId));
        when(s.repository.findByPublicToAllIsTrueAndPublicToMarketplaceIsTrueAndGidIn(argThat(only(GID)))).thenReturn(Flux.just(byGid));
        when(s.repository.findByPublicToAllIsTrueAndAgencyProfileIsTrueAndIdIn(argThat(only(ID)))).thenReturn(Flux.just(byId));
        when(s.repository.findByPublicToAllIsTrueAndAgencyProfileIsTrueAndGidIn(argThat(only(GID)))).thenReturn(Flux.just(byGid));

        List<Function<Set<String>, Mono<Set<String>>>> filters = List.of(
                keys -> s.service.getPublicBundleIds(keys),
                keys -> s.service.getPrivateBundleIds(keys, "user"),
                keys -> s.service.getPublicMarketplaceBundleIds(keys, false, false),
                keys -> s.service.getPublicAgencyBundleIds(keys));
        for (Function<Set<String>, Mono<Set<String>>> filter : filters) {
            Set<String> answered = filter.apply(ordered(gidFirst)).block(TIMEOUT);
            System.out.println("[BundleServiceImplIdKindFamilyPinTest] filter " + ordered(gidFirst) + " -> " + answered);
            assertThat(answered).containsExactlyInAnyOrder(ID, GID);
        }
    }
}
