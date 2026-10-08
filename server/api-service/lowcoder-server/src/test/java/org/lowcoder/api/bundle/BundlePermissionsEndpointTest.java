package org.lowcoder.api.bundle;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.lowcoder.api.common.InitData;
import org.lowcoder.api.common.mockuser.WithMockUser;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import reactor.test.StepVerifier;

/**
 * BF-145: {@code GET /bundles/{bundleId}/permissions} through the production {@link BundleController} and service on the
 * test database ({@code InitData}: organization {@value #ORG_NAME} {@code org01}, {@code user01} its admin, {@code user03}
 * a plain member, no bundle permission rows). The endpoint used a listing that looked the organization up by the creator's
 * user id (so it always failed) and checked no permission; it now uses {@code getBundlePermissions}: the organization of the
 * bundle, READ_BUNDLES for the visitor, and a NORMAL bundle.
 *
 * <p>Isolation: its own profile ({@code BundlePermissionsEndpointTest}), so its own context and database; nothing is written.
 */
@SpringBootTest
@ActiveProfiles("BundlePermissionsEndpointTest")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class BundlePermissionsEndpointTest {

    static final String ORG_NAME = "The Avengers";
    /** {@code bundle02} of {@code bundle.json}, NORMAL, in {@code org01}, addressed by its gid as the client does. */
    private static final String NORMAL_BUNDLE_GID = "019053a1-f771-7c3a-9f33-6f79d50ad5d4";
    /** {@code bundle03} of {@code bundle.json}, RECYCLED, in {@code org01}. */
    private static final String RECYCLED_BUNDLE_GID = "019053a2-19e4-72b1-ac58-bf5debe20444";
    private static final String MEMBER_USER_ID = "user03";
    private static final Duration WAIT = Duration.ofSeconds(30);

    @Autowired
    private BundleController bundleController;
    @Autowired
    private InitData initData;

    @BeforeAll
    void beforeAll() {
        initData.init();
    }

    /** Catches: the organization looked up by the creator's user id again (the endpoint failed for every bundle). */
    @Test
    @WithMockUser
    void theOrganizationAdminGetsThePermissionsWithTheBundlesOrganizationBF145() {
        StepVerifier.create(bundleController.getBundlePermissions(NORMAL_BUNDLE_GID))
                .assertNext(response -> {
                    System.out.println("[BundlePermissionsEndpointTest] admin -> success=" + response.isSuccess() + " data=" + response.getData());
                    assertThat(response.isSuccess()).isTrue();
                    assertThat(response.getData().getOrgName()).isEqualTo(ORG_NAME);
                    assertThat(response.getData().getPermissions()).isEmpty();
                })
                .expectComplete()
                .verify(WAIT);
    }

    /** Catches: the permissions of a bundle listed for a member who may not read it (the leak a lookup-only fix would open). */
    @Test
    @WithMockUser(id = MEMBER_USER_ID)
    void aMemberWithoutReadPermissionIsRefusedBF145() {
        StepVerifier.create(bundleController.getBundlePermissions(NORMAL_BUNDLE_GID))
                .expectErrorSatisfies(error -> {
                    System.out.println("[BundlePermissionsEndpointTest] member -> " + error);
                    assertThat(error).isInstanceOf(BizException.class);
                    assertThat(((BizException) error).getError()).isEqualTo(BizError.NOT_AUTHORIZED);
                })
                .verify(WAIT);
    }

    /** Catches: the permissions of a recycled bundle listed, unlike every other bundle operation that needs NORMAL. */
    @Test
    @WithMockUser
    void aRecycledBundleIsABadRequestBF145() {
        StepVerifier.create(bundleController.getBundlePermissions(RECYCLED_BUNDLE_GID))
                .expectErrorSatisfies(error -> {
                    System.out.println("[BundlePermissionsEndpointTest] recycled -> " + error);
                    assertThat(error).isInstanceOf(BizException.class);
                    assertThat(((BizException) error).getError()).isEqualTo(BizError.UNSUPPORTED_OPERATION);
                    assertThat(((BizException) error).getMessageKey()).isEqualTo("BAD_REQUEST");
                })
                .verify(WAIT);
    }
}
