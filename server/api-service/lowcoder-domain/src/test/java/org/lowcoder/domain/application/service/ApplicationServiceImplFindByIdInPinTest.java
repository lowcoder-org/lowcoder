package org.lowcoder.domain.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.lowcoder.domain.application.service.ApplicationServiceImplTestSupport.appWithGid;
import static org.lowcoder.domain.application.service.ApplicationServiceImplTestSupport.appWithSlug;
import static org.lowcoder.domain.application.service.ApplicationServiceImplTestSupport.counted;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.lowcoder.domain.application.model.Application;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatcher;

import reactor.core.publisher.Flux;

/**
 * BF-154 and BF-156 (fixed; were pinned as candidate rows G1 and G2 of task L3-12) in ApplicationServiceImpl.findByIdIn,
 * which is reached with client-supplied ids by MetaController.java:46 ({@code applicationServiceImpl.findByIdIn(param.appIds())})
 * and, for the module ids found in a DSL, by getAllDependentModulesFromDsl. Every non-blank key is looked up by slug, and the keys no
 * slug matched by object id or gid. G1 was "a slug match drops the ids of the list"; G2 was "a list starting with a
 * slug that has a hyphen goes to the gid query and is never looked up by slug". The repository is a mock: the BF-154 to BF-156 tests answer
 * a query only for the keys it is given, so a key sent to the wrong query finds nothing; the NEW-104 test B2 stubs the id query for
 * any keys and asserts the keys each query received by capture.
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

    /** The blank keys: none, empty, one space, and other whitespace (a tab, a space, a newline). */
    private static final String NULL_KEY = null;
    private static final String EMPTY_KEY = "";
    private static final String WHITESPACE_KEY = " ";
    private static final String MIXED_WHITESPACE_KEY = "\t \n";
    private static final String APP_ID = "65a1b2c3d4e5f60718293a4b";
    private static final String LOG_PREFIX = "[ApplicationServiceImplFindByIdInPinTest] ";
    private static final String USER_ID = "user";

    /**
     * NEW-104: a list of blank keys only names no application and asks no query. Catches the slug query asked with the
     * blank keys (HEAD): the repository mock is touched.
     */
    @Test
    void findByIdInWithOnlyBlankKeysAsksNoQueryNEW104() {
        List<String> keys = java.util.Arrays.asList(NULL_KEY, EMPTY_KEY, WHITESPACE_KEY, MIXED_WHITESPACE_KEY);

        List<Application> found = s.service.findByIdIn(keys).collectList().block(TIMEOUT);

        System.out.println(LOG_PREFIX + "findByIdIn " + keys + " -> " + found);
        assertThat(found).as("answer").isEmpty();
        verifyNoInteractions(s.repository);
    }

    /**
     * NEW-104: the blank keys are dropped before the queries: with {@code [null, APP_ID, " "]} the slug query and the id
     * query see {@code [APP_ID]} only. Catches the blank keys passed on to either query.
     */
    @Test
    void findByIdInDropsBlankKeysBeforeItsQueriesNEW104() {
        Application app = appWithSlug(APP_ID, null);
        when(s.repository.findByIdIn(any())).thenReturn(Flux.just(app));
        List<String> keys = java.util.Arrays.asList(NULL_KEY, APP_ID, WHITESPACE_KEY);

        List<Application> found = s.service.findByIdIn(keys).collectList().block(TIMEOUT);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Collection<String>> slugKeys = ArgumentCaptor.forClass(Collection.class);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Collection<String>> idKeys = ArgumentCaptor.forClass(Collection.class);
        verify(s.repository).findBySlugIn(slugKeys.capture());
        verify(s.repository).findByIdIn(idKeys.capture());
        System.out.println(LOG_PREFIX + "findByIdIn " + keys + " -> slug query keys " + slugKeys.getValue() + ", id query keys "
                + idKeys.getValue() + ", answered " + found.stream().map(Application::getId).toList());
        assertThat(new java.util.ArrayList<>(slugKeys.getValue())).as("keys of the slug query").containsExactly(APP_ID);
        assertThat(new java.util.ArrayList<>(idKeys.getValue())).as("keys of the id query").containsExactly(APP_ID);
        assertThat(found).extracting(Application::getId).containsExactly(APP_ID);
    }

    /**
     * NEW-109: a list of blank keys only names no application and asks no query; the answer is an empty set (the method is
     * {@code @NonEmptyMono} and both callers zip it). The call and its {@code block} run inside {@code catchThrowable}, so a
     * throw is a failed assertion.
     */
    @Test
    void getPrivateApplicationIdsWithOnlyBlankKeysAsksNoQueryNEW109() {
        List<String> keys = java.util.Arrays.asList(NULL_KEY, EMPTY_KEY, WHITESPACE_KEY, MIXED_WHITESPACE_KEY);
        Object[] answer = new Object[1];

        Throwable failure = catchThrowable(() -> answer[0] = s.service.getPrivateApplicationIds(keys, USER_ID).block(TIMEOUT));

        System.out.println(LOG_PREFIX + "getPrivateApplicationIds " + keys + " -> failure " + failure + ", answer " + answer[0]);
        assertThat(failure).as("failure of getPrivateApplicationIds").isNull();
        assertThat(answer[0]).as("answer").isEqualTo(new HashSet<String>());
        verifyNoInteractions(s.repository);
    }

    /**
     * NEW-109: the blank keys are dropped before the queries: with {@code [null, APP_ID, " "]} the slug query and the id query
     * see {@code [APP_ID]} only, and the answer is {@code APP_ID}.
     */
    @Test
    void getPrivateApplicationIdsDropsBlankKeysBeforeItsQueriesNEW109() {
        when(s.repository.findByCreatedByAndIdIn(eq(USER_ID), any())).thenReturn(Flux.just(appWithSlug(APP_ID, null)));
        List<String> keys = java.util.Arrays.asList(NULL_KEY, APP_ID, WHITESPACE_KEY);
        Object[] answer = new Object[1];

        Throwable failure = catchThrowable(() -> answer[0] = s.service.getPrivateApplicationIds(keys, USER_ID).block(TIMEOUT));

        System.out.println(LOG_PREFIX + "getPrivateApplicationIds " + keys + " -> failure " + failure + ", answer " + answer[0]);
        assertThat(failure).as("failure of getPrivateApplicationIds").isNull();
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Collection<String>> slugKeys = ArgumentCaptor.forClass(Collection.class);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Collection<String>> idKeys = ArgumentCaptor.forClass(Collection.class);
        verify(s.repository).findByCreatedByAndSlugIn(eq(USER_ID), slugKeys.capture());
        verify(s.repository).findByCreatedByAndIdIn(eq(USER_ID), idKeys.capture());
        System.out.println(LOG_PREFIX + "slug query keys " + slugKeys.getValue() + ", id query keys " + idKeys.getValue());
        assertThat(new java.util.ArrayList<>(slugKeys.getValue())).as("keys of the slug query").containsExactly(APP_ID);
        assertThat(new java.util.ArrayList<>(idKeys.getValue())).as("keys of the id query").containsExactly(APP_ID);
        assertThat(answer[0]).as("answer").isEqualTo(Set.of(APP_ID));
    }
}
