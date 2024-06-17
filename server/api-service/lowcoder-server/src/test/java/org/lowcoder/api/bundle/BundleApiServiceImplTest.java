package org.lowcoder.api.bundle;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.lowcoder.api.bundle.view.BundleInfoView;
import org.lowcoder.api.home.SessionUserServiceImpl;
import org.lowcoder.domain.bundle.model.BundleRequestType;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@SpringBootTest
@RunWith(SpringRunner.class)
public class BundleApiServiceImplTest {
    @Autowired
    BundleApiServiceImpl bundleApiService;
    @MockBean
    SessionUserServiceImpl sessionUserService;

    @Test
    public void createBundleTest() {
        //When org admin user creates bundle it succeed
        when(sessionUserService.getVisitorId()).thenReturn(Mono.just("user01"));
        when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(new OrgMember("org01", "user01", MemberRole.ADMIN, "NORMAL", 0)));
        Mono<BundleInfoView> bundleInfoViewMono = bundleApiService.create(new BundleEndpoints.CreateBundleRequest(
                "org01",
                "name1",
                "title",
                "description",
                "category",
                "image",
                null));
        StepVerifier.create(bundleInfoViewMono)
                .assertNext(bundleInfoView -> {
                    assertNotNull(bundleInfoView.getBundleId());
                    assertEquals("name1", bundleInfoView.getName());
                    assertEquals("title", bundleInfoView.getTitle());
                    assertEquals("description", bundleInfoView.getDescription());
                    assertEquals("category", bundleInfoView.getCategory());
                    assertEquals("image", bundleInfoView.getImage());
                    assertFalse(bundleInfoView.getPublicToAll());
                    assertFalse(bundleInfoView.getPublicToMarketplace());
                    assertFalse(bundleInfoView.getAgencyProfile());
                    assertNull(bundleInfoView.getFolderId());
                })
                .verifyComplete();

        //When org dev user creates bundle it succeed
        when(sessionUserService.getVisitorId()).thenReturn(Mono.just("user02"));
        when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(new OrgMember("org01", "user02", MemberRole.MEMBER, "NORMAL", 0)));
        Mono<BundleInfoView> bundleInfoViewMono1 = bundleApiService.create(new BundleEndpoints.CreateBundleRequest(
                "org01",
                "name2",
                "title",
                "description",
                "category",
                "image",
                null));
        StepVerifier.create(bundleInfoViewMono1)
                .assertNext(bundleInfoView -> {
                    assertNotNull(bundleInfoView.getBundleId());
                    assertEquals("name2", bundleInfoView.getName());
                    assertEquals("title", bundleInfoView.getTitle());
                    assertEquals("description", bundleInfoView.getDescription());
                    assertEquals("category", bundleInfoView.getCategory());
                    assertEquals("image", bundleInfoView.getImage());
                    assertFalse(bundleInfoView.getPublicToAll());
                    assertFalse(bundleInfoView.getPublicToMarketplace());
                    assertFalse(bundleInfoView.getAgencyProfile());
                    assertNull(bundleInfoView.getFolderId());
                })
                .verifyComplete();

        //When non-dev create bundle throws error
        when(sessionUserService.getVisitorId()).thenReturn(Mono.just("user01"));
        when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(new OrgMember("org01", "user01", MemberRole.MEMBER, "NORMAL", 0)));
        Mono<BundleInfoView> bundleInfoViewMono2 = bundleApiService.create(new BundleEndpoints.CreateBundleRequest(
                "org01",
                "name3",
                "title",
                "description",
                "category",
                "image",
                null));
        StepVerifier.create(bundleInfoViewMono2)
                .expectError()
                .verify();
    }

    @Test
    public void moveAddAppTest() {
        when(sessionUserService.getVisitorId()).thenReturn(Mono.just("user01"));
        when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(new OrgMember("org01", "user01", MemberRole.ADMIN, "NORMAL", 0)));
        //Create bundles
        Mono<BundleInfoView> bundleInfoViewMono = bundleApiService.create(new BundleEndpoints.CreateBundleRequest(
                "org01",
                "name4",
                "title",
                "description",
                "category",
                "image",
                null));

        Mono<BundleInfoView> bundleInfoViewMono2 = bundleApiService.create(new BundleEndpoints.CreateBundleRequest(
                "org01",
                "name5",
                "title",
                "description",
                "category",
                "image",
                null));

        Mono<Void> testMono = Mono.zip(bundleInfoViewMono, bundleInfoViewMono2)
                .flatMap(tuple2 -> {
                    var bundleInfoView = tuple2.getT1();
                    var bundleInfoView2 = tuple2.getT2();

                    return bundleApiService.addApp("app01", bundleInfoView.getBundleId())
                            .then(bundleApiService.moveApp("app01", bundleInfoView.getBundleId(), bundleInfoView2.getBundleId()))
                            .then(Mono.fromRunnable(() -> {
                                // Try a no-dev user to add app to bundle
                                when(sessionUserService.getVisitorId()).thenReturn(Mono.just("user01"));
                                when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(new OrgMember("org01", "user01", MemberRole.MEMBER, "NORMAL", 0)));
                            }))
                            .then(bundleApiService.addApp("app01", bundleInfoView.getBundleId()).onErrorResume(e -> Mono.empty()))
                            .then(bundleApiService.moveApp("app01", bundleInfoView.getBundleId(), bundleInfoView2.getBundleId()).onErrorResume(e -> Mono.empty()))
                            //Get published bundle
                            .then(bundleApiService.getPublishedBundle(bundleInfoView2.getBundleId(), BundleRequestType.PUBLIC_TO_ALL))
                            .doOnNext(bundle -> {
                                //should have no published dsl since not yet published
                                assertNotNull(bundle.getBundleId());
                                assertNull(bundle.getPublishedBundleDSL());
                            })
                            .then();
                });

        StepVerifier.create(testMono)
                .verifyComplete();
    }
}
