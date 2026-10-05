package org.lowcoder.domain.bundle.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.domain.bundle.service.BundleServiceImplTestSupport.bundle;
import static org.lowcoder.domain.bundle.service.BundleServiceImplTestSupport.bundleWithGid;
import static org.lowcoder.domain.bundle.service.BundleServiceImplTestSupport.counted;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.lowcoder.domain.bundle.model.Bundle;

import reactor.core.publisher.Flux;

/**
 * Pins the bundle sites of the section 9 family row (task L3-12, G3): "id-or-gid routing decided from one element drops the
 * other kind" (same cause as DatasourceRepository.findByIds, L3-11c, LibraryQueryServiceImpl.getByIds, L3-11d, and the
 * application sites in ApplicationServiceImplIdKindFamilyPinTest). BundleServiceImpl.findByIdIn (:62-66) and the four filters
 * (:138, :158, :182, :202) look at the first element only. Reach: BundlePermissionHandler.java:79 and :87 pass the resource ids
 * of the permission check to getFilteredPublicBundleIds, and MetaController.java:51 passes the client's bundleIds to
 * findByIdIn. A fix (query both kinds) changes these tests on purpose.
 */
class BundleServiceImplIdKindFamilyPinTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(5);

    private final BundleServiceImplTestSupport s = new BundleServiceImplTestSupport();

    @Test
    @SuppressWarnings("unchecked")
    void findByIdInOfAGidAndAnIdQueriesOnlyTheKindOfTheFirstElement_pinsTheFamilyRow() {
        AtomicInteger idQueries = new AtomicInteger();
        AtomicInteger gidQueries = new AtomicInteger();
        when(s.repository.findAllByGid(any())).thenReturn(counted(Flux.just(bundle("by-gid")), gidQueries));
        when(s.repository.findAllById(any(Iterable.class))).thenReturn(counted(Flux.just(bundle("by-id")), idQueries));

        List<Bundle> gidFirst = s.service.findByIdIn(List.of("aa-bb", "plainid")).collectList().block(TIMEOUT);
        assertThat(gidFirst).extracting(Bundle::getId).containsExactly("by-gid");
        assertThat(idQueries.get()).as("the id of a gid-first list is never looked up").isZero();

        List<Bundle> idFirst = s.service.findByIdIn(List.of("plainid", "aa-bb")).collectList().block(TIMEOUT);
        System.out.println("[BundleServiceImplIdKindFamilyPinTest] PINNED gid first -> " + gidFirst.size() + ", id first -> " + idFirst.size()
                + " (gid queries " + gidQueries.get() + ", id queries " + idQueries.get() + ")");
        assertThat(idFirst).extracting(Bundle::getId).containsExactly("by-id");
        assertThat(gidQueries.get()).as("the gid of an id-first list is never looked up").isEqualTo(1);
    }

    @Test
    void thePublicIdFilterOfAMixedSetAnswersOnlyTheKindOfTheFirstElement_pinsTheFamilyRow() {
        Bundle withGid = bundleWithGid("real-id", "the-gid");
        AtomicInteger idQueries = new AtomicInteger();
        AtomicInteger gidQueries = new AtomicInteger();
        when(s.repository.findByPublicToAllIsTrueAndGidIn(any())).thenReturn(counted(Flux.just(withGid), gidQueries));
        when(s.repository.findByPublicToAllIsTrueAndIdIn(any())).thenReturn(counted(Flux.just(withGid), idQueries));
        Set<String> gidFirst = new LinkedHashSet<>(List.of("aa-bb", "plainid"));
        Set<String> idFirst = new LinkedHashSet<>(List.of("plainid", "aa-bb"));

        Set<String> byGidFirst = s.service.getPublicBundleIds(gidFirst).block(TIMEOUT);
        Set<String> byIdFirst = s.service.getPublicBundleIds(idFirst).block(TIMEOUT);

        System.out.println("[BundleServiceImplIdKindFamilyPinTest] PINNED public filter: gid first -> " + byGidFirst + ", id first -> " + byIdFirst);
        assertThat(byGidFirst).containsExactly("the-gid");
        assertThat(byIdFirst).containsExactly("real-id");
        assertThat(gidQueries.get()).isEqualTo(1);
        assertThat(idQueries.get()).isEqualTo(1);
    }
}
