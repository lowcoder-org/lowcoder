package org.lowcoder.api.bundle;

import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.lowcoder.api.bundle.view.BundleInfoView;
import org.lowcoder.api.common.mockuser.WithMockUser;
import org.lowcoder.domain.bundle.model.BundleRequestType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@RunWith(SpringRunner.class)
public class BundleApiServiceImplTest {
    @Autowired
    BundleApiServiceImpl bundleApiService;

    @Test
    @WithMockUser
    public void createBundleTestAdminUser() {
        //When org admin user creates bundle it succeed
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
    }
    @Test
    @WithMockUser(id="user02")
    public void createBundleTestDevUser() {
        //When org dev user creates bundle it succeed
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
    }
    @Test
    @WithMockUser(id="user03")
    public void createBundleTestNonDevUser() {
        //When non-dev create bundle throws error
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
    @WithMockUser
    public void moveAddAppTestAdmin() {
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

    @Test
    @WithMockUser(id="user02")
    public void moveAddAppTestNonDev() {
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

        Flux<?> testFlux = Flux.zip(bundleInfoViewMono, bundleInfoViewMono2)
                .flatMap(tuple2 -> {
                    var bundleInfoView = tuple2.getT1();
                    var bundleInfoView2 = tuple2.getT2();

                    return Flux.concat(bundleApiService.addApp("app01", bundleInfoView.getBundleId()),
                            bundleApiService.moveApp("app01", bundleInfoView.getBundleId(), bundleInfoView2.getBundleId()));
                });

        StepVerifier.create(testFlux)
                .expectError()
                .verify();

        StepVerifier.create(testFlux)
                .expectError()
                .verify();
    }

    private Mono<BundleInfoView> createBundle(String name, String folderId) {
        BundleEndpoints.CreateBundleRequest createApplicationRequest =
                new BundleEndpoints.CreateBundleRequest("org01", name, "title", "desc", "category", "image", folderId);
        return bundleApiService.create(createApplicationRequest);
    }

    @Test
    @WithMockUser
    public void testPublishBundle() {
        Mono<String> bundleIdMono = createBundle("test", null)
                .map(BundleInfoView::getBundleId)
                .delayUntil(id ->bundleApiService.addApp("app01", id))
                .cache();

        // edit dsl before publish
        StepVerifier.create(bundleIdMono.flatMap(id -> bundleApiService.getEditingBundle(id)))
                .assertNext(bundleView -> Assert.assertNotNull(bundleView.getEditingBundleDSL()))
                .verifyComplete();

        // published dsl before publish
        StepVerifier.create(bundleIdMono.flatMap(id -> bundleApiService.getPublishedBundle(id, BundleRequestType.PUBLIC_TO_ALL)))
                .assertNext(bundleView -> Assert.assertNull(bundleView.getPublishedBundleDSL()))
                .verifyComplete();

        // publish
        bundleIdMono = bundleIdMono
                .delayUntil(id -> bundleApiService.publish(id));

        // edit dsl after publish
        StepVerifier.create(bundleIdMono.flatMap(id -> bundleApiService.getEditingBundle(id)))
                .assertNext(bundleView -> Assert.assertNotNull(bundleView.getEditingBundleDSL()))
                .verifyComplete();

        // published dsl after publish
        StepVerifier.create(bundleIdMono.flatMap(id -> bundleApiService.getPublishedBundle(id, BundleRequestType.PUBLIC_TO_ALL)))
                .assertNext(bundleView -> Assert.assertNotNull(bundleView.getPublishedBundleDSL()))
                .verifyComplete();
    }
}
