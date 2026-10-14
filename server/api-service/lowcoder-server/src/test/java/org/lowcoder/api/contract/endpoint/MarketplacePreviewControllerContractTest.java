package org.lowcoder.api.contract.endpoint;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.api.application.marketplace.MarketplacePreview;
import org.lowcoder.api.application.marketplace.MarketplacePreviewController;
import org.lowcoder.api.application.marketplace.MarketplacePreviewStore;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationRequestType;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.repository.ApplicationRecordRepository;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.permission.model.ResourceAction;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.model.UserPermissionOnResourceStatus;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.sdk.constants.Authentication;
import org.mockito.Mockito;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.Map;
import java.util.function.Consumer;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests of the 1 {@link MarketplacePreviewController} endpoint, {@code GET {/api/v1,/api}/applications/{applicationId}/marketplace-preview/image}
 * (B02), level {@code codec}. {@code image} answers the stored JPEG of a marketplace application
 * ({@code MarketplacePreviewController.java:31-54}): the application must be eligible (normal, public to all and to the
 * marketplace, {@code MarketplacePreviewWorker.java:81-83}), the visitor must have {@code READ_APPLICATIONS} on it as a
 * marketplace request ({@code :37-40}), it must have a published version ({@code :42}) and a stored preview with an
 * image and a rendered hash ({@code :43-44}). Then it answers 304 when {@code If-None-Match} is the ETag
 * {@code "<rendered hash>"} ({@code :48-49}) and 200 with the bytes otherwise ({@code :50-51}), both with
 * {@code Cache-Control: private, no-cache}; anything else is a 404 with {@code Cache-Control: no-store} and no body
 * ({@code :53}).
 *
 * <p>The controller is the production class with its five collaborators mocked ({@code :24-28}), stubbed before the
 * harness is built; the visitor id is the harness's ({@link Authentication#ANONYMOUS_USER_ID}).
 *
 * <ul>
 *   <li>the branches (rule 8): {@link #image} (the 200), {@link #imageNotModified} (the 304), {@link #imageNotFound}
 *       (the 404, one case per condition);</li>
 *   <li>the mounts: every exchange but one goes to the first path, {@code /api/v1} ({@code EndpointContract} sends to
 *       the method mapping's first path); {@link #imageOnTheOtherMount} sends the same request to {@code /api}.</li>
 * </ul>
 *
 * <p>Limits: {@link #imageOnTheOtherMount}'s request goes around {@code EndpointContract}'s bookkeeping, so
 * {@code assertComplete} does not prove the {@code /api} mount was exercised; the test's own assertions do. The harness
 * has no security chain: that both paths are open to an anonymous visitor is
 * {@code MarketplacePreviewSecurityTest}'s. {@code If-None-Match} is compared as one exact string ({@code :48}); its weak
 * form {@code W/"<hash>"} and a list naming the ETag are not tested. An empty visitor id ({@code :37}) is not tested:
 * {@code GlobalContextFilter} runs the handler only inside {@code getVisitorId().flatMap(…)}
 * ({@code GlobalContextFilter.java:58-60}), in the harness as in production, so a request without a visitor id never
 * reaches the controller (tried during B02: it answered 200 with no headers and no body, the filter's empty completion).
 *
 * <p>Stubbing group (registry column {@code group}): {@code pass-through}: the answer is the stored preview's.
 */
class MarketplacePreviewControllerContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(MarketplacePreviewController.class);
    /** The handler method's name. */
    static final String IMAGE = "image";
    static final String APPLICATION_ID = "MarketplacePreviewControllerContractTest.application";
    static final String RENDERED_HASH = "MarketplacePreviewControllerContractTest.rendered-hash";
    static final String OTHER_HASH = "MarketplacePreviewControllerContractTest.other-hash";
    /** The ETag the controller builds from the rendered hash, {@code :46}. */
    static final String ETAG = "\"" + RENDERED_HASH + "\"";
    static final String OTHER_ETAG = "\"" + OTHER_HASH + "\"";
    /** The JPEG marker {@code 0xFF 0xD8}, then text: the stored image's bytes. */
    static final byte[] JPEG_MARKER = {(byte) 0xFF, (byte) 0xD8};
    static final byte[] IMAGE_BYTES = concat(JPEG_MARKER, "MarketplacePreviewControllerContractTest.image".getBytes(StandardCharsets.UTF_8));
    /** The controller's cache headers: a served or unchanged image ({@code :49}, {@code :51}), a 404 ({@code :53}). */
    static final String SERVED_CACHE_CONTROL = "private, no-cache";
    static final String NOT_FOUND_CACHE_CONTROL = "no-store";
    /** The path of the second mount, {@code MarketplacePreviewController.java:32}. */
    static final String OTHER_MOUNT_PATH = NewUrl.APPLICATION_URL + "/{applicationId}/marketplace-preview/image";
    /** The number of image bytes printed in hex, never the raw bytes. */
    static final int PRINTED_BYTES = 2;
    /** The cases of {@link #imageNotFound}, by name. */
    static final String NO_APPLICATION = "no application";
    static final String RECYCLED = "a recycled application";
    static final String NOT_PUBLIC = "not public to all";
    static final String NOT_ON_THE_MARKETPLACE = "not public to the marketplace";
    static final String NO_PERMISSION = "a visitor without permission";
    static final String NEVER_PUBLISHED = "never published";
    static final String NO_PREVIEW = "no stored preview";
    static final String NO_IMAGE = "a stored preview without an image";
    static final String NO_RENDERED_HASH = "a stored preview without a rendered hash";

    @AfterAll
    static void everyEndpointAndBranchHasATest() {
        CONTRACT.assertComplete(MarketplacePreviewControllerContractTest.class);
    }

    /** An eligible, permitted, published application with a stored preview: 200, the bytes and the two headers. */
    @Test
    void image() {
        Exchange exchange = exchange(new Stubs(), null);
        assertServed(exchange.result());
    }

    /** The same request on the second mount, {@code /api} ({@code :32}), sent around {@code EndpointContract}. */
    @Test
    void imageOnTheOtherMount() {
        Stubs stubs = new Stubs();
        ContractTestClient.Builder builder = stubs.builder();
        try (ContractTestClient client = builder.controllerWithMockedDependencies(MarketplacePreviewController.class).build()) {
            EntityExchangeResult<byte[]> result = client.web().get().uri(OTHER_MOUNT_PATH, APPLICATION_ID).exchange()
                    .expectBody().returnResult();
            System.out.println("[MarketplacePreviewControllerContractTest] GET " + result.getUrl() + " -> " + result.getStatus().value()
                    + " " + result.getResponseHeaders() + " " + describe(result.getResponseBodyContent()));
            assertServed(result);
        }
    }

    /** {@code If-None-Match} equal to the ETag: 304, the two headers, no body. */
    @Test
    void imageNotModified() {
        EntityExchangeResult<byte[]> result = exchange(new Stubs(), ETAG).result();
        EndpointContract.assertEmptyResponse(result, HttpStatus.NOT_MODIFIED, null);
        assertThat(result.getResponseHeaders().getCacheControl()).as("Cache-Control").isEqualTo(SERVED_CACHE_CONTROL);
        assertThat(result.getResponseHeaders().getETag()).as("ETag").isEqualTo(ETAG);
    }

    /** {@code If-None-Match} with another hash: the image is served. */
    @Test
    void imageWithAnotherETag() {
        assertServed(exchange(new Stubs(), OTHER_ETAG).result());
    }

    static Stream<Arguments> missingPreviews() {
        return Stream.of(
                notFound(NO_APPLICATION, stubs -> stubs.application = null, false),
                notFound(RECYCLED, stubs -> stubs.application = application(ApplicationStatus.RECYCLED, true, true), false),
                notFound(NOT_PUBLIC, stubs -> stubs.application = application(ApplicationStatus.NORMAL, false, true), false),
                notFound(NOT_ON_THE_MARKETPLACE, stubs -> stubs.application = application(ApplicationStatus.NORMAL, true, false), false),
                notFound(NO_PERMISSION, stubs -> stubs.permission = UserPermissionOnResourceStatus.anonymousUser(), false),
                notFound(NEVER_PUBLISHED, stubs -> stubs.published = false, false),
                notFound(NO_PREVIEW, stubs -> stubs.preview = null, true),
                notFound(NO_IMAGE, stubs -> stubs.preview.setImage(null), true),
                notFound(NO_RENDERED_HASH, stubs -> stubs.preview.setRenderedHash(null), true));
    }

    /**
     * Each condition of {@code :35-44} that fails: 404, {@code Cache-Control: no-store}, no body; for the conditions
     * before the store ({@code :35-42}), the store not read. Each case builds its own harness and mocks.
     */
    @ParameterizedTest(name = "{0}")
    @MethodSource("missingPreviews")
    void imageNotFound(String name, Consumer<Stubs> change, boolean storeRead) {
        Stubs stubs = new Stubs();
        change.accept(stubs);
        Exchange exchange = exchange(stubs, null);
        EndpointContract.assertEmptyResponse(exchange.result(), HttpStatus.NOT_FOUND, null);
        assertThat(exchange.result().getResponseHeaders().getCacheControl()).as("Cache-Control").isEqualTo(NOT_FOUND_CACHE_CONTROL);
        Mockito.verify(exchange.store(), storeRead ? Mockito.times(1) : Mockito.never()).read(APPLICATION_ID);
    }

    private static Arguments notFound(String name, Consumer<Stubs> change, boolean storeRead) {
        return Arguments.of(name, change, storeRead);
    }

    /** The collaborators' answers, a served preview unless a test changes one. */
    static final class Stubs {
        Application application = application(ApplicationStatus.NORMAL, true, true);
        UserPermissionOnResourceStatus permission = UserPermissionOnResourceStatus.success(
                ResourcePermission.builder().resourceRole(ResourceRole.VIEWER).build());
        boolean published = true;
        MarketplacePreview preview = storedPreview();

        /** A harness builder with the five collaborators mocked and stubbed with these answers. */
        ContractTestClient.Builder builder() {
            ContractTestClient.Builder builder = ContractTestClient.builder();
            Mockito.when(builder.mock(ApplicationService.class).findByIdWithoutDsl(APPLICATION_ID))
                    .thenReturn(application == null ? Mono.empty() : Mono.just(application));
            Mockito.when(builder.mock(ResourcePermissionService.class).checkUserPermissionStatusOnApplication(Authentication.ANONYMOUS_USER_ID,
                    APPLICATION_ID, ResourceAction.READ_APPLICATIONS, ApplicationRequestType.PUBLIC_TO_MARKETPLACE)).thenReturn(Mono.just(permission));
            Mockito.when(builder.mock(ApplicationRecordRepository.class).existsByApplicationId(APPLICATION_ID)).thenReturn(Mono.just(published));
            Mockito.when(builder.mock(MarketplacePreviewStore.class).read(APPLICATION_ID))
                    .thenReturn(preview == null ? Mono.empty() : Mono.just(preview));
            return builder;
        }
    }

    record Exchange(EntityExchangeResult<byte[]> result, MarketplacePreviewStore store) {
    }

    /** GET of {@link #APPLICATION_ID} on the first path with {@code stubs}, with {@code If-None-Match: ifNoneMatch} unless {@code null}. */
    private static Exchange exchange(Stubs stubs, String ifNoneMatch) {
        ContractTestClient.Builder builder = stubs.builder();
        try (ContractTestClient client = builder.controllerWithMockedDependencies(MarketplacePreviewController.class).build()) {
            Consumer<WebTestClient.RequestBodySpec> header = request -> {
                if (ifNoneMatch != null) {
                    request.header(HttpHeaders.IF_NONE_MATCH, ifNoneMatch);
                }
            };
            EntityExchangeResult<byte[]> result = CONTRACT.exchangeWith(client, IMAGE, header, Map.of(), null, APPLICATION_ID);
            System.out.println("[MarketplacePreviewControllerContractTest] If-None-Match " + ifNoneMatch + " -> " + result.getStatus().value()
                    + " " + result.getResponseHeaders() + " " + describe(result.getResponseBodyContent()));
            return new Exchange(result, client.bean(MarketplacePreviewStore.class));
        }
    }

    /** 200, {@code image/jpeg}, the stored bytes, {@code Cache-Control: private, no-cache} and the ETag. */
    private static void assertServed(EntityExchangeResult<byte[]> result) {
        EndpointContract.assertBytes(result, HttpStatus.OK, MediaType.IMAGE_JPEG, IMAGE_BYTES);
        assertThat(result.getResponseHeaders().getCacheControl()).as("Cache-Control").isEqualTo(SERVED_CACHE_CONTROL);
        assertThat(result.getResponseHeaders().getETag()).as("ETag").isEqualTo(ETAG);
    }

    private static Application application(ApplicationStatus status, boolean publicToAll, boolean publicToMarketplace) {
        return Application.builder().id(APPLICATION_ID).applicationStatus(status).publicToAll(publicToAll)
                .publicToMarketplace(publicToMarketplace).build();
    }

    private static MarketplacePreview storedPreview() {
        MarketplacePreview preview = new MarketplacePreview();
        preview.setId(APPLICATION_ID);
        preview.setRenderedHash(RENDERED_HASH);
        preview.setImage(IMAGE_BYTES);
        return preview;
    }

    /** A body as its length and its first bytes in hex. */
    private static String describe(byte[] body) {
        if (body == null) {
            return "no body";
        }
        byte[] head = Arrays.copyOf(body, Math.min(PRINTED_BYTES, body.length));
        return body.length + " bytes, starting " + HexFormat.of().formatHex(head);
    }

    private static byte[] concat(byte[] first, byte[] second) {
        byte[] bytes = Arrays.copyOf(first, first.length + second.length);
        System.arraycopy(second, 0, bytes, first.length, second.length);
        return bytes;
    }
}
