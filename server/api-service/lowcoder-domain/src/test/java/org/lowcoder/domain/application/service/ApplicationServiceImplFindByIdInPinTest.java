package org.lowcoder.domain.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.domain.application.service.ApplicationServiceImplTestSupport.appWithGid;
import static org.lowcoder.domain.application.service.ApplicationServiceImplTestSupport.appWithSlug;
import static org.lowcoder.domain.application.service.ApplicationServiceImplTestSupport.counted;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.lowcoder.domain.application.model.Application;
import org.mockito.ArgumentMatcher;

import reactor.core.publisher.Flux;

/**
 * BF-154 and BF-156 (fixed; were pinned as candidate rows G1 and G2 of task L3-12) in ApplicationServiceImpl.findByIdIn,
 * which is reached with client-supplied ids by MetaController.java:46 ({@code applicationServiceImpl.findByIdIn(param.appIds())})
 * and, for the module ids found in a DSL, by getAllDependentModulesFromDsl. Every key is looked up by slug, and the keys no
 * slug matched by object id or gid. G1 was "a slug match drops the ids of the list"; G2 was "a list starting with a
 * slug that has a hyphen goes to the gid query and is never looked up by slug". The repository is a mock: each test answers
 * a query only for the keys it is given, so a key sent to the wrong query finds nothing.
 */
class ApplicationServiceImplFindByIdInPinTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(5);

    private final ApplicationServiceImplTestSupport s = new ApplicationServiceImplTestSupport();

    /** Matches a collection with exactly these keys, in any order. */
    private static ArgumentMatcher<Collection<String>> keys(String... keys) {
        return actual -> actual != null && new HashSet<>(actual).equals(Set.of(keys));
    }

    @Test
    void findByIdInOfASlugAnIdAndAGidAnswersAllThreeBF154() {
        AtomicInteger slugQueries = new AtomicInteger();
        when(s.repository.findBySlugIn(argThat(keys("theslug", "someid", "aa-bb")))).thenReturn(counted(Flux.just(appWithSlug("app-of-the-slug", "theslug")), slugQueries));
        when(s.repository.findByIdIn(argThat(keys("someid")))).thenReturn(Flux.just(appWithSlug("someid", null)));
        when(s.repository.findByGidIn(argThat(keys("aa-bb")))).thenReturn(Flux.just(appWithGid("app-of-the-gid", "aa-bb")));

        List<Application> found = s.service.findByIdIn(List.of("theslug", "someid", "aa-bb")).collectList().block(TIMEOUT);

        System.out.println("[ApplicationServiceImplFindByIdInPinTest] slug + id + gid -> " + found.stream().map(Application::getId).toList());
        assertThat(found).extracting(Application::getId).containsExactlyInAnyOrder("app-of-the-slug", "someid", "app-of-the-gid");
        assertThat(slugQueries.get()).isEqualTo(1);
    }

    /**
     * An application named by its slug and by its object id in the same list is answered once (the object id has no
     * hyphen, so it goes to the id query, which finds the application a second time).
     */
    @Test
    void anApplicationNamedTwiceIsAnsweredOnce() {
        when(s.repository.findBySlugIn(any())).thenReturn(Flux.just(appWithSlug("app1", "theslug")));
        when(s.repository.findByIdIn(argThat(keys("app1")))).thenReturn(Flux.just(appWithSlug("app1", "theslug")));

        List<Application> found = s.service.findByIdIn(List.of("theslug", "app1")).collectList().block(TIMEOUT);

        System.out.println("[ApplicationServiceImplFindByIdInPinTest] slug and id of one application -> " + found.stream().map(Application::getId).toList());
        assertThat(found).extracting(Application::getId).containsExactly("app1");
    }

    @Test
    void getPrivateApplicationIdsOfASlugAnIdAndAGidAnswersAllThreeBF154() {
        when(s.repository.findByCreatedByAndSlugIn(eq("user"), argThat(keys("theslug", "someid", "aa-bb")))).thenReturn(Flux.just(appWithSlug("app-of-the-slug", "theslug")));
        when(s.repository.findByCreatedByAndIdIn(eq("user"), argThat(keys("someid")))).thenReturn(Flux.just(appWithSlug("someid", null)));
        when(s.repository.findByCreatedByAndGidIn(eq("user"), argThat(keys("aa-bb")))).thenReturn(Flux.just(appWithGid("app-of-the-gid", "aa-bb")));

        Set<String> answered = s.service.getPrivateApplicationIds(List.of("theslug", "someid", "aa-bb"), "user").block(TIMEOUT);

        System.out.println("[ApplicationServiceImplFindByIdInPinTest] private slug + id + gid -> " + answered);
        assertThat(answered).as("the id and the gid as given, the slug match as its object id")
                .containsExactlyInAnyOrder("app-of-the-slug", "someid", "aa-bb");
    }

    @Test
    void findByIdInOfAHyphenatedSlugFindsItBySlugBF156() {
        AtomicInteger gidQueries = new AtomicInteger();
        when(s.repository.findBySlugIn(argThat(keys("my-slug")))).thenReturn(Flux.just(appWithSlug("app-of-the-slug", "my-slug")));
        when(s.repository.findByGidIn(any())).thenReturn(counted(Flux.empty(), gidQueries));

        List<Application> found = s.service.findByIdIn(List.of("my-slug")).collectList().block(TIMEOUT);

        System.out.println("[ApplicationServiceImplFindByIdInPinTest] my-slug -> " + found.stream().map(Application::getId).toList() + ", gid queries " + gidQueries.get());
        assertThat(found).extracting(Application::getId).containsExactly("app-of-the-slug");
        assertThat(gidQueries.get()).as("a key a slug matched is not looked up again").isZero();
    }
}
