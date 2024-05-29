package org.lowcoder.api.bundle;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.lowcoder.api.bundle.view.BundleInfoView;
import org.lowcoder.api.home.SessionUserServiceImpl;
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
                "name",
                "title",
                "description",
                "category",
                "image",
                null));
        StepVerifier.create(bundleInfoViewMono)
                .assertNext(bundleInfoView -> {
                    assertNotNull(bundleInfoView.getBundleId());
                    assertEquals("name", bundleInfoView.getName());
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
                "name",
                "title",
                "description",
                "category",
                "image",
                null));
        StepVerifier.create(bundleInfoViewMono1)
                .assertNext(bundleInfoView -> {
                    assertNotNull(bundleInfoView.getBundleId());
                    assertEquals("name", bundleInfoView.getName());
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
                "name",
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
                "name",
                "title",
                "description",
                "category",
                "image",
                null));
        BundleInfoView bundleInfoView2 = bundleApiService.create(new BundleEndpoints.CreateBundleRequest(
                "org01",
                "name2",
                "title",
                "description",
                "category",
                "image",
                null)).block();
        assert bundleInfoView2 != null;

        StepVerifier.create(bundleInfoViewMono)
                .assertNext(bundleInfoView -> {
                    //And then add app01 to created bundle
                    StepVerifier.create(bundleApiService.addApp("app01", bundleInfoView.getBundleId()))
                            .verifyComplete();
                    //or move bundle
                    StepVerifier.create(bundleApiService.moveApp("app01", bundleInfoView.getBundleId(), bundleInfoView2.getBundleId()))
                            .verifyComplete();
                    //Try no dev user to add app to bundle
                    when(sessionUserService.getVisitorId()).thenReturn(Mono.just("user01"));
                    when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(new OrgMember("org01", "user01", MemberRole.MEMBER, "NORMAL", 0)));
                    StepVerifier.create(bundleApiService.addApp("app01", bundleInfoView.getBundleId()))
                            .expectError();
                    StepVerifier.create(bundleApiService.moveApp("app01", bundleInfoView.getBundleId(), bundleInfoView2.getBundleId()))
                            .expectError();
                })
                .verifyComplete();
    }
}
