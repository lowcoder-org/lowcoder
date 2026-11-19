package org.lowcoder.domain.bundle.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.lowcoder.domain.bundle.service.BundleServiceImplTestSupport.bundle;
import static org.lowcoder.domain.bundle.service.BundleServiceImplTestSupport.bundleWithEditingDsl;
import static org.lowcoder.domain.bundle.service.BundleServiceImplTestSupport.bundleWithGid;
import static org.lowcoder.domain.bundle.service.BundleServiceImplTestSupport.counted;
import static org.lowcoder.domain.bundle.service.BundleServiceImplTestSupport.dsl;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.bundle.model.BundleRequestType;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.model.ResourceType;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.mockito.ArgumentCaptor;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * BundleServiceImpl with mocked collaborators (unit U12, task L3-12; the NonEmptyMono aspect is not applied). Not repeated:
 * the L1 D6 row (bundle flag setters fail for every user: findByIdWithoutDsl has no gid routing), the family pins in
 * BundleServiceImplIdKindFamilyPinTest. deleteAllById and exist are not tested: no caller in main code (owner's list).
 */
class BundleServiceImplTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(5);
    private static final String USER = "user-1";

    private final BundleServiceImplTestSupport s = new BundleServiceImplTestSupport();
    private final BundleServiceImpl service = s.service;

    private static BizException failure(Runnable call) {
        return assertThrows(BizException.class, call::run);
    }

    /** Catches: null passing through the three lookups, the not-found keys swapped, the gid routing of findById missing. */
    @Test
    void lookupsFailForNullAndUnknownWithTheirKeysAndFindByIdRoutesGids() {
        Bundle byId = bundle("b1");
        Bundle byGid = bundleWithGid("b2", "aa-bb");
        when(s.repository.findById("b1")).thenReturn(Mono.just(byId));
        when(s.repository.findByGid("aa-bb")).thenReturn(Flux.just(byGid));

        assertThat(service.findById("b1").block(TIMEOUT)).isSameAs(byId);
        assertThat(service.findById("aa-bb").block(TIMEOUT)).isSameAs(byGid);
        assertThat(failure(() -> service.findById(null).block(TIMEOUT)).getError()).isEqualTo(BizError.INVALID_PARAMETER);
        BizException unknown = failure(() -> service.findById("nope").block(TIMEOUT));
        assertThat(unknown.getError()).isEqualTo(BizError.NO_RESOURCE_FOUND);
        assertThat(unknown.getMessageKey()).isEqualTo("BUNDLE_NOT_FOUND");
        assertThat(failure(() -> service.findById("no-gid").block(TIMEOUT)).getMessageKey()).isEqualTo("BUNDLE_NOT_FOUND");

        assertThat(service.findByIdWithoutDsl("b1").block(TIMEOUT)).isSameAs(byId);
        assertThat(failure(() -> service.findByIdWithoutDsl(null).block(TIMEOUT)).getError()).isEqualTo(BizError.INVALID_PARAMETER);
        assertThat(failure(() -> service.findByIdWithoutDsl("nope").block(TIMEOUT)).getMessageKey()).isEqualTo("CANT_FIND_BUNDLE");
    }

    /** Catches: updateById not rejecting null, not delegating the bundle and id. */
    @Test
    void updateByIdRejectsNullAndOtherwiseDelegates() {
        Bundle patch = bundle("x");
        when(s.mongoUpsertHelper.updateById(patch, "b1")).thenReturn(Mono.just(true));

        assertThat(service.updateById("b1", patch).block(TIMEOUT)).isTrue();
        assertThat(failure(() -> service.updateById(null, patch).block(TIMEOUT)).getError()).isEqualTo(BizError.INVALID_PARAMETER);
    }

    /**
     * Catches: the findByIdIn routing changed for homogeneous lists (BF-155): plain keys go to the id query, keys with a
     * hyphen to the gid query, each only when the list has keys of it, so an empty list asks no query (it asked the id
     * query before, which a real database answers empty too). Mixed lists are in BundleServiceImplIdKindFamilyPinTest.
     */
    @Test
    void findByIdInRoutesGidListsToTheGidQueryAndOthersToTheIdQuery() {
        AtomicInteger idQueries = new AtomicInteger();
        AtomicInteger gidQueries = new AtomicInteger();
        when(s.repository.findAllById(any(Iterable.class))).thenReturn(counted(Flux.just(bundle("by-id")), idQueries));
        when(s.repository.findAllByGid(any())).thenReturn(counted(Flux.just(bundle("by-gid")), gidQueries));

        assertThat(service.findByIdIn(List.of("aa-bb", "cc-dd")).collectList().block(TIMEOUT)).extracting(Bundle::getId).containsExactly("by-gid");
        assertThat(idQueries.get()).isZero();
        assertThat(service.findByIdIn(List.of("plain1", "plain2")).collectList().block(TIMEOUT)).extracting(Bundle::getId).containsExactly("by-id");
        assertThat(service.findByIdIn(List.of()).collectList().block(TIMEOUT)).isEmpty();
        assertThat(gidQueries.get()).isEqualTo(1);
        assertThat(idQueries.get()).isEqualTo(1);
    }

    /** Catches: the owner grant before the save or with another id, user, role or type; a failing grant not failing create. */
    @Test
    void createSavesThenGrantsOwnerAndFailsWhenTheGrantFails() {
        Bundle newBundle = bundle(null);
        Bundle saved = bundle("saved-id");
        AtomicBoolean saveSubscribed = new AtomicBoolean();
        when(s.repository.save(newBundle)).thenReturn(Mono.just(saved).doOnSubscribe(x -> saveSubscribed.set(true)));
        when(s.resourcePermissionService.addResourcePermissionToUser("saved-id", USER, ResourceRole.OWNER, ResourceType.BUNDLE))
                .thenAnswer(invocation -> {
                    assertThat(saveSubscribed).as("the grant runs after the save").isTrue();
                    return Mono.just(true);
                });

        assertThat(service.create(newBundle, USER).block(TIMEOUT)).isSameAs(saved);
        verify(s.resourcePermissionService).addResourcePermissionToUser("saved-id", USER, ResourceRole.OWNER, ResourceType.BUNDLE);

        when(s.resourcePermissionService.addResourcePermissionToUser("saved-id", "bad-user", ResourceRole.OWNER, ResourceType.BUNDLE))
                .thenReturn(Mono.error(new IllegalStateException("grant failed")));
        assertThrows(IllegalStateException.class, () -> service.create(newBundle, "bad-user").block(TIMEOUT));
    }

    /** Catches: a listing delegated to a neighbouring repository method. */
    @Test
    void listingsUseTheIntendedRepositoryMethods() {
        when(s.repository.findByCreatedBy("u")).thenReturn(Flux.just(bundle("a")));
        when(s.repository.findByPublicToAllIsTrueAndPublicToMarketplaceIsTrue()).thenReturn(Flux.just(bundle("m1"), bundle("m2")));
        when(s.repository.findByPublicToAllIsTrueAndAgencyProfileIsTrue()).thenReturn(Flux.just(bundle("g1"), bundle("g2"), bundle("g3")));

        assertThat(service.findByUserId("u").collectList().block(TIMEOUT)).hasSize(1);
        assertThat(service.findAllMarketplaceBundles().collectList().block(TIMEOUT)).hasSize(2);
        assertThat(service.findAllAgencyProfileBundles().collectList().block(TIMEOUT)).hasSize(3);
    }

    /** Catches: publish copying the wrong DSL, writing it to the wrong field or bundle, writing for an unknown bundle. */
    @Test
    void publishCopiesTheEditingDslToThePublishedDslAndAnUnknownBundleFailsWithoutAWrite() {
        Map<String, Object> editing = dsl("editing");
        Bundle loaded = bundleWithEditingDsl("b1", editing);
        when(s.repository.findById("b1")).thenReturn(Mono.just(loaded));
        when(s.mongoUpsertHelper.updateById(any(Bundle.class), eq("b1"))).thenReturn(Mono.just(true));

        assertThat(service.publish("b1").block(TIMEOUT)).isSameAs(loaded);

        ArgumentCaptor<Bundle> patch = ArgumentCaptor.forClass(Bundle.class);
        verify(s.mongoUpsertHelper).updateById(patch.capture(), eq("b1"));
        assertThat(patch.getValue().getPublishedBundleDSL()).isEqualTo(editing);
        assertThat(patch.getValue().getEditingBundleDSL()).isNull();
        assertThat(failure(() -> service.publish("nope").block(TIMEOUT)).getError()).isEqualTo(BizError.NO_RESOURCE_FOUND);
        verify(s.mongoUpsertHelper, never()).updateById(any(Bundle.class), eq("nope"));
    }

    /** Catches: the three flag setters writing another field; the marketplace setter writing for an unknown bundle. */
    @Test
    void theFlagSettersWriteOnlyTheirOwnFlagAndMarketplaceChecksTheBundleFirst() {
        when(s.mongoUpsertHelper.updateById(any(Bundle.class), anyString())).thenReturn(Mono.just(true));
        when(s.repository.findById("b3")).thenReturn(Mono.just(bundle("b3")));

        assertThat(service.setBundlePublicToAll("b1", true).block(TIMEOUT)).isTrue();
        assertThat(service.setBundleAsAgencyProfile("b2", true).block(TIMEOUT)).isTrue();
        assertThat(service.setBundlePublicToMarketplace("b3", true).block(TIMEOUT)).isTrue();

        ArgumentCaptor<Bundle> all = ArgumentCaptor.forClass(Bundle.class);
        verify(s.mongoUpsertHelper).updateById(all.capture(), eq("b1"));
        assertThat(all.getValue().isPublicToAll()).isTrue();
        assertThat(all.getValue().agencyProfile()).isFalse();
        assertThat(all.getValue().isPublicToMarketplace()).isFalse();
        ArgumentCaptor<Bundle> agency = ArgumentCaptor.forClass(Bundle.class);
        verify(s.mongoUpsertHelper).updateById(agency.capture(), eq("b2"));
        assertThat(agency.getValue().agencyProfile()).isTrue();
        assertThat(agency.getValue().isPublicToAll()).isFalse();
        ArgumentCaptor<Bundle> marketplace = ArgumentCaptor.forClass(Bundle.class);
        verify(s.mongoUpsertHelper).updateById(marketplace.capture(), eq("b3"));
        assertThat(marketplace.getValue().isPublicToMarketplace()).isTrue();
        assertThat(marketplace.getValue().isPublicToAll()).isFalse();

        assertThat(failure(() -> service.setBundlePublicToMarketplace("nope", true).block(TIMEOUT)).getError()).isEqualTo(BizError.NO_RESOURCE_FOUND);
        verify(s.mongoUpsertHelper, never()).updateById(any(Bundle.class), eq("nope"));
    }

    /** Catches: updatePublishedBundleDSL writing another field. */
    @Test
    void updatePublishedBundleDslWritesOnlyThePublishedDsl() {
        Map<String, Object> published = dsl("published");
        when(s.mongoUpsertHelper.updateById(any(Bundle.class), eq("b1"))).thenReturn(Mono.just(true));

        assertThat(service.updatePublishedBundleDSL("b1", published).block(TIMEOUT)).isTrue();

        ArgumentCaptor<Bundle> patch = ArgumentCaptor.forClass(Bundle.class);
        verify(s.mongoUpsertHelper).updateById(patch.capture(), eq("b1"));
        assertThat(patch.getValue().getPublishedBundleDSL()).isEqualTo(published);
        assertThat(patch.getValue().getEditingBundleDSL()).isNull();
    }

    /** Catches: the request-type switch or the anonymous test routing to a neighbouring query. */
    @ParameterizedTest
    @ValueSource(strings = {"", "  "})
    void filteredIdsRouteByRequestTypeAndAnonymity(String blankUser) {
        AtomicInteger publicQ = new AtomicInteger();
        AtomicInteger privateQ = new AtomicInteger();
        when(s.repository.findByPublicToAllIsTrueAndIdIn(any())).thenReturn(counted(Flux.just(bundle("pub")), publicQ));
        when(s.repository.findByCreatedByAndIdIn(anyString(), any())).thenReturn(counted(Flux.just(bundle("priv")), privateQ));
        when(s.repository.findByPublicToAllIsTrueAndPublicToMarketplaceIsTrueAndIdIn(any())).thenReturn(Flux.just(bundle("mkt")));
        when(s.repository.findByPublicToAllIsTrueAndAgencyProfileIsTrueAndIdIn(any())).thenReturn(Flux.just(bundle("agy")));
        Collection<String> ids = List.of("x1");

        assertThat(service.getFilteredPublicBundleIds(BundleRequestType.PUBLIC_TO_ALL, ids, blankUser, false).block(TIMEOUT)).containsExactly("pub");
        assertThat(service.getFilteredPublicBundleIds(BundleRequestType.PUBLIC_TO_ALL, ids, null, false).block(TIMEOUT)).containsExactly("pub");
        assertThat(publicQ.get()).isEqualTo(2);
        assertThat(privateQ.get()).isZero();
        assertThat(service.getFilteredPublicBundleIds(BundleRequestType.PUBLIC_TO_ALL, ids, USER, false).block(TIMEOUT)).containsExactly("priv");
        assertThat(privateQ.get()).isEqualTo(1);
        assertThat(service.getFilteredPublicBundleIds(BundleRequestType.PUBLIC_TO_MARKETPLACE, ids, USER, false).block(TIMEOUT)).containsExactly("mkt");
        assertThat(service.getFilteredPublicBundleIds(BundleRequestType.AGENCY_PROFILE, ids, null, true).block(TIMEOUT)).containsExactly("agy");
    }

    /** Behaviour: a request type of null is not handled (the switch dereferences it). */
    @Test
    void aNullRequestTypeFailsInTheSwitch() {
        assertThrows(NullPointerException.class, () -> service.getFilteredPublicBundleIds(null, List.of("x"), USER, false));
    }

    /** Catches: the marketplace truth table (anonymous x private mode) changed (:172). */
    @Test
    void marketplaceIdsAreHiddenOnlyFromAnonymousVisitorsOfAPrivateMarketplace() {
        AtomicInteger marketQ = new AtomicInteger();
        when(s.repository.findByPublicToAllIsTrueAndPublicToMarketplaceIsTrueAndIdIn(any())).thenReturn(counted(Flux.just(bundle("mkt")), marketQ));
        Collection<String> ids = List.of("x1");

        assertThat(service.getPublicMarketplaceBundleIds(ids, true, true).blockOptional(TIMEOUT)).isEmpty();
        assertThat(marketQ.get()).isZero();
        assertThat(service.getPublicMarketplaceBundleIds(ids, true, false).block(TIMEOUT)).containsExactly("mkt");
        assertThat(service.getPublicMarketplaceBundleIds(ids, false, true).block(TIMEOUT)).containsExactly("mkt");
        assertThat(service.getPublicMarketplaceBundleIds(ids, false, false).block(TIMEOUT)).containsExactly("mkt");
        assertThat(marketQ.get()).isEqualTo(3);
    }

    /**
     * Catches: the gid variant answering ids or the id variant answering gids. An empty list asks no query and answers an
     * empty set (BF-155; it asked the id query before, which a real database answers empty too).
     */
    @Test
    void theFourFiltersAnswerGidsForGidListsAndIdsOtherwise() {
        Bundle withGid = bundleWithGid("real-id", "the-gid");
        when(s.repository.findByPublicToAllIsTrueAndGidIn(any())).thenReturn(Flux.just(withGid));
        when(s.repository.findByCreatedByAndGidIn(anyString(), any())).thenReturn(Flux.just(withGid));
        when(s.repository.findByPublicToAllIsTrueAndPublicToMarketplaceIsTrueAndGidIn(any())).thenReturn(Flux.just(withGid));
        when(s.repository.findByPublicToAllIsTrueAndAgencyProfileIsTrueAndGidIn(any())).thenReturn(Flux.just(withGid));
        when(s.repository.findByPublicToAllIsTrueAndIdIn(any())).thenReturn(Flux.just(withGid));
        when(s.repository.findByCreatedByAndIdIn(anyString(), any())).thenReturn(Flux.just(withGid));
        when(s.repository.findByPublicToAllIsTrueAndPublicToMarketplaceIsTrueAndIdIn(any())).thenReturn(Flux.just(withGid));
        when(s.repository.findByPublicToAllIsTrueAndAgencyProfileIsTrueAndIdIn(any())).thenReturn(Flux.just(withGid));
        Collection<String> gids = List.of("aa-bb");
        Collection<String> ids = List.of("plain");

        assertThat(service.getPublicBundleIds(gids).block(TIMEOUT)).containsExactly("the-gid");
        assertThat(service.getPrivateBundleIds(gids, USER).block(TIMEOUT)).containsExactly("the-gid");
        assertThat(service.getPublicMarketplaceBundleIds(gids, false, false).block(TIMEOUT)).containsExactly("the-gid");
        assertThat(service.getPublicAgencyBundleIds(gids).block(TIMEOUT)).containsExactly("the-gid");

        assertThat(service.getPublicBundleIds(ids).block(TIMEOUT)).containsExactly("real-id");
        assertThat(service.getPrivateBundleIds(ids, USER).block(TIMEOUT)).containsExactly("real-id");
        assertThat(service.getPublicMarketplaceBundleIds(ids, false, false).block(TIMEOUT)).containsExactly("real-id");
        assertThat(service.getPublicAgencyBundleIds(ids).block(TIMEOUT)).containsExactly("real-id");
        assertThat(service.getPublicBundleIds(List.of()).block(TIMEOUT)).isEmpty();
        assertThat(service.getPublicAgencyBundleIds(List.of()).block(TIMEOUT)).isEmpty();
    }
}
