package org.lowcoder.domain.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.domain.application.service.ApplicationServiceImplTestSupport.app;
import static org.lowcoder.domain.application.service.ApplicationServiceImplTestSupport.counted;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.lowcoder.domain.application.model.Application;

import reactor.core.publisher.Flux;

/**
 * Candidate pins G1 and G2 of task L3-12 (plan section 9 rows, subject to the coordinator's merge), both about
 * ApplicationServiceImpl.findByIdIn (:128-132), which is reached with client-supplied ids by MetaController.java:46
 * ({@code applicationServiceImpl.findByIdIn(param.appIds())}) and, for the module ids found in a DSL, by
 * getAllDependentModulesFromDsl (:153, :164).
 * G1 row: "ApplicationServiceImpl.findByIdIn drops the ids of a list as soon as one entry matches a slug (:131)".
 * G2 row: "ApplicationServiceImpl.findByIdIn never looks up a slug that starts a list and contains a hyphen (:129-130); a
 * hyphenated slug is valid (SlugUtils.validate accepts '-') and findByIdWithoutDsl does find it by slug first".
 * Both are consequences of the same heuristics as the L3-11b hyphenated-slug row. A fix changes these tests on purpose.
 */
class ApplicationServiceImplFindByIdInPinTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(5);

    private final ApplicationServiceImplTestSupport s = new ApplicationServiceImplTestSupport();

    @Test
    void findByIdInOfASlugAndAnIdAnswersOnlyTheSlugMatch_pinsTheSection9RowG1() {
        AtomicInteger idQueries = new AtomicInteger();
        when(s.repository.findBySlugIn(any())).thenReturn(Flux.just(app("app-of-the-slug")));
        when(s.repository.findByIdIn(any())).thenReturn(counted(Flux.just(app("app-of-the-id")), idQueries));

        List<Application> found = s.service.findByIdIn(List.of("theslug", "someid")).collectList().block(TIMEOUT);

        System.out.println("[ApplicationServiceImplFindByIdInPinTest] PINNED G1: " + found.stream().map(Application::getId).toList()
                + ", id query subscribed " + idQueries.get() + " times");
        assertThat(found).extracting(Application::getId).containsExactly("app-of-the-slug");
        assertThat(idQueries.get()).as("the id lookup never runs once a slug matched").isZero();
    }

    @Test
    void getPrivateApplicationIdsOfASlugAndAnIdAnswersOnlyTheSlugMatch_sameCauseAsG1() {
        AtomicInteger idQueries = new AtomicInteger();
        when(s.repository.findByCreatedByAndSlugIn(any(), any())).thenReturn(Flux.just(app("app-of-the-slug")));
        when(s.repository.findByCreatedByAndIdIn(any(), any())).thenReturn(counted(Flux.just(app("app-of-the-id")), idQueries));

        assertThat(s.service.getPrivateApplicationIds(List.of("theslug", "someid"), "user").block(TIMEOUT))
                .containsExactly("app-of-the-slug");
        assertThat(idQueries.get()).isZero();
    }

    @Test
    void findByIdInOfAHyphenatedSlugGoesToTheGidQueryAndNeverAsksForSlugs_pinsTheSection9RowG2() {
        AtomicInteger slugQueries = new AtomicInteger();
        AtomicInteger gidQueries = new AtomicInteger();
        when(s.repository.findBySlugIn(any())).thenReturn(counted(Flux.just(app("app-of-the-slug")), slugQueries));
        when(s.repository.findByGidIn(any())).thenReturn(counted(Flux.empty(), gidQueries));

        List<Application> found = s.service.findByIdIn(List.of("my-slug")).collectList().block(TIMEOUT);

        System.out.println("[ApplicationServiceImplFindByIdInPinTest] PINNED G2: found " + found.size() + ", gid query " + gidQueries.get()
                + ", slug query " + slugQueries.get());
        assertThat(found).isEmpty();
        assertThat(gidQueries.get()).isEqualTo(1);
        assertThat(slugQueries.get()).as("the slug lookup is never subscribed").isZero();
    }
}
