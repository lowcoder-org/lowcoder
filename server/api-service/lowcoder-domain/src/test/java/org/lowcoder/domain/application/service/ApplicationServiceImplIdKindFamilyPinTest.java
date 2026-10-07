package org.lowcoder.domain.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.domain.application.service.ApplicationServiceImplTestSupport.appWithGid;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Function;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.domain.application.model.Application;
import org.mockito.ArgumentMatcher;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * BF-155 (fixed; was pinned as the section 9 family row "id-or-gid routing decided from one element drops the other kind",
 * task L3-12, G3) at the application sites: findByIdIn and the public, private, marketplace and agency filters tell each key
 * apart (an object id or a gid) instead of taking the kind of the first one, in either order. Reach:
 * ApplicationPermissionHandler passes {@code newHashSet(resourceIds)} (arbitrary first element) to the filters, and
 * MetaController.java:46 passes the client's appIds to findByIdIn. The repository is a mock that answers a query only for the
 * keys of its kind.
 */
class ApplicationServiceImplIdKindFamilyPinTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(5);
    private static final String ID = "plainid";
    private static final String GID = "aa-bb";

    private final ApplicationServiceImplTestSupport s = new ApplicationServiceImplTestSupport();

    private static ArgumentMatcher<Collection<String>> only(String key) {
        return actual -> actual != null && new HashSet<>(actual).equals(Set.of(key));
    }

    private static Set<String> ordered(boolean gidFirst) {
        return new LinkedHashSet<>(gidFirst ? List.of(GID, ID) : List.of(ID, GID));
    }

    @ParameterizedTest(name = "gid first {0}")
    @ValueSource(booleans = {true, false})
    void findByIdInOfAGidAndAnIdAnswersBothBF155(boolean gidFirst) {
        when(s.repository.findByIdIn(argThat(only(ID)))).thenReturn(Flux.just(appWithGid("by-id", "gid-of-by-id")));
        when(s.repository.findByGidIn(argThat(only(GID)))).thenReturn(Flux.just(appWithGid("by-gid", GID)));

        List<Application> found = s.service.findByIdIn(List.copyOf(ordered(gidFirst))).collectList().block(TIMEOUT);

        System.out.println("[ApplicationServiceImplIdKindFamilyPinTest] findByIdIn " + ordered(gidFirst) + " -> " + found.stream().map(Application::getId).toList());
        assertThat(found).extracting(Application::getId).containsExactlyInAnyOrder("by-id", "by-gid");
    }

    /** Each filter answers the matching keys as given: the object id key as the id, the gid key as the gid. */
    @ParameterizedTest(name = "gid first {0}")
    @ValueSource(booleans = {true, false})
    void theFiltersOfAMixedSetAnswerBothKeysBF155(boolean gidFirst) {
        Application byId = appWithGid(ID, "gid-of-the-id-match");
        Application byGid = appWithGid("id-of-the-gid-match", GID);
        when(s.repository.findByPublicToAllIsTrueAndIdIn(argThat(only(ID)))).thenReturn(Flux.just(byId));
        when(s.repository.findByPublicToAllIsTrueAndGidIn(argThat(only(GID)))).thenReturn(Flux.just(byGid));
        when(s.repository.findByCreatedByAndIdIn(org.mockito.ArgumentMatchers.eq("user"), argThat(only(ID)))).thenReturn(Flux.just(byId));
        when(s.repository.findByCreatedByAndGidIn(org.mockito.ArgumentMatchers.eq("user"), argThat(only(GID)))).thenReturn(Flux.just(byGid));
        when(s.repository.findByPublicToAllIsTrueAndPublicToMarketplaceIsTrueAndIdIn(argThat(only(ID)))).thenReturn(Flux.just(byId));
        when(s.repository.findByPublicToAllIsTrueAndPublicToMarketplaceIsTrueAndGidIn(argThat(only(GID)))).thenReturn(Flux.just(byGid));
        when(s.repository.findByPublicToAllIsTrueAndAgencyProfileIsTrueAndIdIn(argThat(only(ID)))).thenReturn(Flux.just(byId));
        when(s.repository.findByPublicToAllIsTrueAndAgencyProfileIsTrueAndGidIn(argThat(only(GID)))).thenReturn(Flux.just(byGid));

        List<Function<Set<String>, Mono<Set<String>>>> filters = List.of(
                keys -> s.service.getPublicApplicationIds(keys),
                keys -> s.service.getPrivateApplicationIds(keys, "user"),
                keys -> s.service.getPublicMarketplaceApplicationIds(keys, false, false),
                keys -> s.service.getPublicAgencyApplicationIds(keys));
        for (Function<Set<String>, Mono<Set<String>>> filter : filters) {
            Set<String> answered = filter.apply(ordered(gidFirst)).block(TIMEOUT);
            System.out.println("[ApplicationServiceImplIdKindFamilyPinTest] filter " + ordered(gidFirst) + " -> " + answered);
            assertThat(answered).containsExactlyInAnyOrder(ID, GID);
        }
    }

    @Test
    void anEmptySetAnswersAnEmptySet() {
        assertThat(s.service.getPublicApplicationIds(Set.of()).block(TIMEOUT)).isEmpty();
        assertThat(s.service.findByIdIn(List.of()).collectList().block(TIMEOUT)).isEmpty();
    }
}
