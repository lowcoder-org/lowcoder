package org.lowcoder.domain.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.domain.application.service.ApplicationServiceImplTestSupport.app;
import static org.lowcoder.domain.application.service.ApplicationServiceImplTestSupport.appWithGid;
import static org.lowcoder.domain.application.service.ApplicationServiceImplTestSupport.counted;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.lowcoder.domain.application.model.Application;

import reactor.core.publisher.Flux;

/**
 * Pins the application sites of the section 9 family row (task L3-12, G3): "id-or-gid routing decided from one element drops
 * the other kind" (same cause as DatasourceRepository.findByIds, L3-11c, and LibraryQueryServiceImpl.getByIds, L3-11d).
 * ApplicationServiceImpl.findByIdIn (:129), getPublicApplicationIds (:262), getPrivateApplicationIds (:282),
 * getPublicMarketplaceApplicationIds (:303) and getPublicAgencyApplicationIds (:323) look at the first element only; a list
 * of one kind with an element of the other drops that element. Reach: ApplicationPermissionHandler.java:78 and :93 pass
 * {@code newHashSet(resourceIds)} (arbitrary first element) to getFilteredPublicApplicationIds, and MetaController.java:46
 * passes the client's appIds to findByIdIn. A fix (query both kinds) changes these tests on purpose.
 */
class ApplicationServiceImplIdKindFamilyPinTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(5);

    private final ApplicationServiceImplTestSupport s = new ApplicationServiceImplTestSupport();

    @Test
    void findByIdInOfAGidAndAnIdQueriesOnlyTheKindOfTheFirstElement_pinsTheFamilyRow() {
        AtomicInteger idQueries = new AtomicInteger();
        AtomicInteger gidQueries = new AtomicInteger();
        when(s.repository.findByGidIn(any())).thenReturn(counted(Flux.just(app("by-gid")), gidQueries));
        when(s.repository.findByIdIn(any())).thenReturn(counted(Flux.just(app("by-id")), idQueries));

        List<Application> gidFirst = s.service.findByIdIn(List.of("aa-bb", "plainid")).collectList().block(TIMEOUT);
        assertThat(gidFirst).extracting(Application::getId).containsExactly("by-gid");
        assertThat(idQueries.get()).as("the id of a gid-first list is never looked up").isZero();

        List<Application> idFirst = s.service.findByIdIn(List.of("plainid", "aa-bb")).collectList().block(TIMEOUT);
        System.out.println("[ApplicationServiceImplIdKindFamilyPinTest] PINNED gid first -> " + gidFirst.size() + " (gid queries " + gidQueries.get()
                + "), id first -> " + idFirst.size() + " (id queries " + idQueries.get() + ")");
        assertThat(idFirst).extracting(Application::getId).containsExactly("by-id");
        assertThat(gidQueries.get()).as("the gid of an id-first list is never looked up").isEqualTo(1);
    }

    @Test
    void thePublicIdFilterOfAMixedSetAnswersOnlyTheKindOfTheFirstElement_pinsTheFamilyRow() {
        Application withGid = appWithGid("real-id", "the-gid");
        AtomicInteger idQueries = new AtomicInteger();
        AtomicInteger gidQueries = new AtomicInteger();
        when(s.repository.findByPublicToAllIsTrueAndGidIn(any())).thenReturn(counted(Flux.just(withGid), gidQueries));
        when(s.repository.findByPublicToAllIsTrueAndIdIn(any())).thenReturn(counted(Flux.just(withGid), idQueries));
        Set<String> gidFirst = new LinkedHashSet<>(List.of("aa-bb", "plainid"));
        Set<String> idFirst = new LinkedHashSet<>(List.of("plainid", "aa-bb"));

        Set<String> byGidFirst = s.service.getPublicApplicationIds(gidFirst).block(TIMEOUT);
        Set<String> byIdFirst = s.service.getPublicApplicationIds(idFirst).block(TIMEOUT);

        System.out.println("[ApplicationServiceImplIdKindFamilyPinTest] PINNED public filter: gid first -> " + byGidFirst + ", id first -> " + byIdFirst);
        assertThat(byGidFirst).containsExactly("the-gid");
        assertThat(byIdFirst).containsExactly("real-id");
        assertThat(gidQueries.get()).isEqualTo(1);
        assertThat(idQueries.get()).isEqualTo(1);
    }
}
