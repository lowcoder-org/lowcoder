package org.lowcoder.api.material;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.usermanagement.OrgDevChecker;
import org.lowcoder.domain.material.model.MaterialMeta;
import org.lowcoder.domain.material.model.MaterialType;
import org.lowcoder.domain.material.repository.MaterialMateRepository;
import org.lowcoder.domain.material.service.meta.MaterialMetaService;
import org.lowcoder.domain.material.service.storage.MaterialStorageService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.dynamic.Conf;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.config.dynamic.ConfigInstance;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.mockito.ArgumentCaptor;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * Mockito unit tests of {@link MaterialApiServiceImpl}. Every call that changes something is recorded in {@link #ops}
 * when its Mono is subscribed (several operations are written as {@code a.then(b(...))}, where {@code b(...)} is
 * called at assembly time), so "nothing was deleted or saved" and the order of the steps are asserted on what was
 * really executed.
 *
 * <p>Pinned under D-6, plan §9 row "material upload deletes the old file before the new one is stored; a storage
 * failure loses both (MaterialApiServiceImpl:84-91)":
 * {@link #upload_whenTheStorageSaveFails_theOldRowAndFileAreAlreadyGone_pinsTheSection9Row}; and plan §9 row "material
 * quota counts the file being replaced": {@link #upload_quotaCountsTheFileBeingReplaced_pinsTheSection9Row}. Pinned as
 * behaviour (no row): a malformed base64 content is a synchronous IllegalArgumentException instead of a coded error
 * ({@link #upload_malformedBase64_throwsIllegalArgumentSynchronously_andTheClientGetsAGeneric500}).
 */
class MaterialApiServiceImplTest {

    private static final String ORG = "org-1";
    private static final String OTHER_ORG = "org-2";
    private static final String SINGLE_LIMIT_KEY = "material.single-size-limit";
    private static final String TOTAL_LIMIT_KEY = "material.total-size-limit";
    private static final long ONE_MB = 1024L * 1024L;
    private static final Duration WAIT = Duration.ofSeconds(10);

    private final List<String> ops = new ArrayList<>();
    private final Map<String, Long> limitOverrides = new java.util.HashMap<>();

    private MaterialMetaService metaService;
    private MaterialMateRepository repository;
    private MaterialStorageService storage;
    private SessionUserService sessionUserService;
    private OrgDevChecker orgDevChecker;
    private ConfigInstance threshold;
    private CommonConfig commonConfig;
    private MaterialApiServiceImpl service;

    @BeforeEach
    void setUp() {
        metaService = mock(MaterialMetaService.class);
        repository = mock(MaterialMateRepository.class);
        storage = mock(MaterialStorageService.class);
        sessionUserService = mock(SessionUserService.class);
        orgDevChecker = mock(OrgDevChecker.class);
        ConfigCenter configCenter = mock(ConfigCenter.class);
        threshold = mock(ConfigInstance.class);
        commonConfig = new CommonConfig();
        ReflectionTestUtils.setField(commonConfig, "cloud", true);
        when(configCenter.threshold()).thenReturn(threshold);
        stubLimitConfig();

        service = new MaterialApiServiceImpl();
        ReflectionTestUtils.setField(service, "materialMetaService", metaService);
        ReflectionTestUtils.setField(service, "materialStorageService", storage);
        ReflectionTestUtils.setField(service, "sessionUserService", sessionUserService);
        ReflectionTestUtils.setField(service, "orgDevChecker", orgDevChecker);
        ReflectionTestUtils.setField(service, "configCenter", configCenter);
        ReflectionTestUtils.setField(service, "materialMateRepository", repository);
        ReflectionTestUtils.setField(service, "commonConfig", commonConfig);
        service.init();

        when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(member(ORG)));
        when(orgDevChecker.checkCurrentOrgDev()).thenReturn(Mono.empty());
        when(metaService.totalSize(anyString())).thenReturn(Mono.just(0L));
        when(repository.findByOrgIdAndType(anyString(), any())).thenReturn(Flux.empty());
        when(repository.findByOrgIdAndFilenameAndType(anyString(), anyString(), any())).thenReturn(Flux.empty());
        when(repository.deleteById(anyString())).thenAnswer(invocation -> recorded("repo.delete:" + invocation.getArgument(0)));
        when(repository.save(any(MaterialMeta.class))).thenAnswer(invocation -> Mono.defer(() -> {
            MaterialMeta meta = invocation.getArgument(0);
            meta.setId("new-id");
            ops.add("repo.save:" + meta.getType() + ":" + meta.getFilename());
            return Mono.just(meta);
        }));
        when(storage.save(any(MaterialMeta.class), any(byte[].class))).thenAnswer(invocation -> Mono.defer(() -> {
            ops.add("storage.save:" + ((MaterialMeta) invocation.getArgument(0)).getId());
            return Mono.just(true);
        }));
        when(storage.delete(any(MaterialMeta.class))).thenAnswer(invocation -> recorded("storage.delete:" + ((MaterialMeta) invocation.getArgument(0)).getId()));
        when(metaService.deleteById(anyString())).thenAnswer(invocation -> recorded("meta.delete:" + invocation.getArgument(0)));
    }

    // ----------------------------------------------------------------- fixtures

    private Mono<Void> recorded(String op) {
        return Mono.defer(() -> {
            ops.add(op);
            return Mono.<Void>empty();
        });
    }

    @SuppressWarnings("unchecked")
    private void stubLimitConfig() {
        when(threshold.ofJson(anyString(), eq(Long.class), anyLong())).thenAnswer(invocation -> {
            Conf<Long> conf = mock(Conf.class);
            String key = invocation.getArgument(0);
            long defaultValue = invocation.getArgument(2);
            when(conf.get()).thenReturn(limitOverrides.getOrDefault(key, defaultValue));
            return conf;
        });
    }

    private static OrgMember member(String orgId) {
        return OrgMember.builder().orgId(orgId).userId("user-1").role(MemberRole.MEMBER).build();
    }

    private static MaterialMeta meta(String id, String orgId, String filename, long size, MaterialType type) {
        MaterialMeta meta = MaterialMeta.builder().orgId(orgId).filename(filename).size(size).type(type).build();
        meta.setId(id);
        return meta;
    }

    private static String base64(byte[] content) {
        return Base64.getEncoder().encodeToString(content);
    }

    private static byte[] bytes(int length) {
        return new byte[length];
    }

    private static void expectBizError(Mono<?> mono, BizError error, String messageKey) {
        StepVerifier.create(mono).expectErrorSatisfies(throwable -> {
            assertThat(throwable).isInstanceOf(BizException.class);
            assertThat(((BizException) throwable).getError()).isEqualTo(error);
            assertThat(((BizException) throwable).getMessageKey()).isEqualTo(messageKey);
            System.out.println("[MaterialApiServiceImplTest] " + error + " " + messageKey + ": " + throwable.getMessage());
        }).verify(WAIT);
    }

    private Mono<MaterialMeta> upload(byte[] content, MaterialType type) {
        return service.upload("file.png", base64(content), type);
    }

    // ------------------------------------------------------------------- upload

    /** Catches the wrong org, filename, size or type being stored, or the file's bytes not being the decoded content. */
    @Test
    void upload_storesTheDecodedFile_forTheSessionOrg() {
        byte[] content = "hello material".getBytes(StandardCharsets.UTF_8);

        StepVerifier.create(service.upload("hello.txt", base64(content), MaterialType.COMMON)).assertNext(saved -> {
            assertThat(saved.getId()).isEqualTo("new-id");
            assertThat(saved.getOrgId()).isEqualTo(ORG);
            assertThat(saved.getFilename()).isEqualTo("hello.txt");
            assertThat(saved.getSize()).isEqualTo(content.length);
            assertThat(saved.getType()).isEqualTo(MaterialType.COMMON);
        }).verifyComplete();

        ArgumentCaptor<byte[]> stored = ArgumentCaptor.forClass(byte[].class);
        verify(storage).save(any(MaterialMeta.class), stored.capture());
        assertThat(stored.getValue()).isEqualTo(content);
        assertThat(ops).containsExactly("repo.save:COMMON:hello.txt", "storage.save:new-id");
        System.out.println("[MaterialApiServiceImplTest] upload steps " + ops);
    }

    /**
     * Pins today's behaviour (no row): content that is not base64 makes {@code upload} throw an
     * IllegalArgumentException synchronously, before any Mono exists, instead of a coded error. The controller does not
     * convert it: through the request stack the client receives the generic HTTP 500 of the controller advice (code 5000,
     * "Oops! Service is busy"), not a raw exception.
     */
    @Test
    void upload_malformedBase64_throwsIllegalArgumentSynchronously_andTheClientGetsAGeneric500() {
        assertThatThrownBy(() -> service.upload("x.png", "%%% not base64 %%%", MaterialType.COMMON))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.upload("x.png", "QUJD$REVG", MaterialType.COMMON))
                .as("an illegal character inside otherwise valid base64 is not skipped (the MIME decoder would skip it)")
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(ops).isEmpty();

        try (ContractTestClient client = ContractTestClient.builder()
                .singleton("materialApiService", service)
                .controllerWithMockedDependencies(MaterialController.class)
                .visitor("user-1", member(ORG))
                .build()) {
            client.web().post().uri(NewUrl.MATERIAL_URL).contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of("filename", "x.png", "content", "%%% not base64 %%%", "type", "COMMON"))
                    .exchange()
                    .expectStatus().isEqualTo(500)
                    .expectBody().jsonPath("$.code").isEqualTo(BizError.INTERNAL_SERVER_ERROR.getBizErrorCode())
                    .jsonPath("$.message").value(message -> System.out.println("[MaterialApiServiceImplTest] client receives: 500 / " + message));
        }
    }

    /** Catches a non-developer uploading: the dev check fails the upload before anything is deleted or saved. */
    @Test
    void upload_requiresOrgDev_andChangesNothingOtherwise() {
        when(orgDevChecker.checkCurrentOrgDev()).thenReturn(Mono.error(new BizException(BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED")));
        when(repository.findByOrgIdAndType(anyString(), any())).thenReturn(Flux.just(meta("old", ORG, "logo.png", 5, MaterialType.LOGO)));

        expectBizError(upload(bytes(3), MaterialType.LOGO), BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED");

        assertThat(ops).isEmpty();
    }

    /** Catches an old LOGO or FAVICON staying behind, and the wrong org or type being replaced. */
    @ParameterizedTest
    @EnumSource(value = MaterialType.class, names = {"LOGO", "FAVICON"})
    void upload_logoAndFavicon_replaceTheOrgsOldOneOfThatType(MaterialType type) {
        when(repository.findByOrgIdAndType(ORG, type)).thenReturn(Flux.just(meta("old-" + type, ORG, "old.png", 5, type)));

        StepVerifier.create(upload(bytes(3), type)).expectNextCount(1).verifyComplete();

        assertThat(ops).containsExactly("repo.delete:old-" + type, "storage.delete:old-" + type, "repo.save:" + type + ":file.png", "storage.save:new-id");
        verify(repository, never()).findByOrgIdAndFilenameAndType(anyString(), anyString(), any());
        System.out.println("[MaterialApiServiceImplTest] " + type + " replacement steps " + ops);
    }

    @ParameterizedTest
    @EnumSource(value = MaterialType.class, names = {"LOGO", "FAVICON"})
    void upload_logoAndFavicon_withoutAnOldOne_justSaves(MaterialType type) {
        StepVerifier.create(upload(bytes(3), type)).expectNextCount(1).verifyComplete();

        assertThat(ops).containsExactly("repo.save:" + type + ":file.png", "storage.save:new-id");
    }

    /** Catches a COMMON file replacing a file of another name, org or type: only org + filename + type. */
    @Test
    void upload_common_replacesTheSameNameFileOfTheOrg() {
        when(repository.findByOrgIdAndFilenameAndType(ORG, "file.png", MaterialType.COMMON))
                .thenReturn(Flux.just(meta("old-common", ORG, "file.png", 5, MaterialType.COMMON)));

        StepVerifier.create(upload(bytes(3), MaterialType.COMMON)).expectNextCount(1).verifyComplete();

        assertThat(ops).containsExactly("repo.delete:old-common", "storage.delete:old-common", "repo.save:COMMON:file.png", "storage.save:new-id");
        verify(repository, never()).findByOrgIdAndType(anyString(), any());
    }

    // ------------------------------------------------------------- size limits

    /** Catches the single-size boundary: exactly the limit passes, one byte more fails before anything is changed. */
    @Test
    void upload_singleSizeLimit_boundary_andConfiguredKey() {
        limitOverrides.put(SINGLE_LIMIT_KEY, 10L);

        StepVerifier.create(upload(bytes(10), MaterialType.COMMON)).expectNextCount(1).verifyComplete();
        ops.clear();

        expectBizError(upload(bytes(11), MaterialType.COMMON), BizError.INVALID_MATERIAL_REQUEST, "EXCEEDS_FILE_SIZE_LIMIT");
        assertThat(ops).isEmpty();
    }

    @Test
    void upload_singleSizeLimit_defaultsToTwentyMegabytes() {
        StepVerifier.create(upload(bytes(1), MaterialType.COMMON)).expectNextCount(1).verifyComplete();

        ArgumentCaptor<Long> defaultValue = ArgumentCaptor.forClass(Long.class);
        verify(threshold).ofJson(eq(SINGLE_LIMIT_KEY), eq(Long.class), defaultValue.capture());
        assertThat(defaultValue.getValue()).isEqualTo(20 * ONE_MB);
    }

    /** Catches the org total boundary: used + new == limit passes, one byte more fails with the org limit error. */
    @Test
    void upload_totalSizeLimit_boundary_andConfiguredKey() {
        limitOverrides.put(TOTAL_LIMIT_KEY, 100L);
        when(metaService.totalSize(ORG)).thenReturn(Mono.just(90L));

        StepVerifier.create(upload(bytes(10), MaterialType.COMMON)).expectNextCount(1).verifyComplete();
        ops.clear();

        expectBizError(upload(bytes(11), MaterialType.COMMON), BizError.INVALID_MATERIAL_REQUEST, "EXCEEDS_ORG_SIZE_LIMIT");
        assertThat(ops).isEmpty();
    }

    @Test
    void upload_totalSizeLimit_defaultsToTwoGigabytes() {
        StepVerifier.create(upload(bytes(1), MaterialType.COMMON)).expectNextCount(1).verifyComplete();

        ArgumentCaptor<Long> defaultValue = ArgumentCaptor.forClass(Long.class);
        verify(threshold).ofJson(eq(TOTAL_LIMIT_KEY), eq(Long.class), defaultValue.capture());
        assertThat(defaultValue.getValue()).isEqualTo(2 * 1024 * ONE_MB);
    }

    /** Catches self-hosted installations being limited: neither limit is read and the total is not even asked. */
    @Test
    void upload_selfHost_ignoresBothLimits() {
        ReflectionTestUtils.setField(commonConfig, "cloud", false);
        limitOverrides.put(SINGLE_LIMIT_KEY, 1L);
        limitOverrides.put(TOTAL_LIMIT_KEY, 1L);
        when(metaService.totalSize(ORG)).thenReturn(Mono.just(Long.MAX_VALUE / 2));

        StepVerifier.create(upload(bytes(100), MaterialType.COMMON)).expectNextCount(1).verifyComplete();

        verify(metaService, never()).totalSize(anyString());
        verify(threshold, never()).ofJson(anyString(), eq(Long.class), anyLong());
    }

    /**
     * Pins plan §9 row "material quota counts the file being replaced" ({@code checkTotalSize}, MaterialApiServiceImpl:147-160):
     * the org total includes the file that is being replaced, so a user near the quota cannot replace a LOGO with one
     * of the same size: it is refused within one file size of the limit although the replacement does not grow the total.
     */
    @Test
    void upload_quotaCountsTheFileBeingReplaced_pinsTheSection9Row() {
        limitOverrides.put(TOTAL_LIMIT_KEY, 100L);
        when(metaService.totalSize(ORG)).thenReturn(Mono.just(96L));
        when(repository.findByOrgIdAndType(ORG, MaterialType.LOGO)).thenReturn(Flux.just(meta("old-logo", ORG, "logo.png", 5, MaterialType.LOGO)));

        expectBizError(upload(bytes(5), MaterialType.LOGO), BizError.INVALID_MATERIAL_REQUEST, "EXCEEDS_ORG_SIZE_LIMIT");

        assertThat(ops).as("the old logo stays").isEmpty();
        System.out.println("[MaterialApiServiceImplTest] same-size logo replacement refused at 96/100 with a 5 byte old logo");
    }

    // ------------------------------------------------------- storage failure

    /**
     * Pins plan §9 row "material upload deletes the old file before the new one is stored; a storage failure loses
     * both (MaterialApiServiceImpl:84-91)": the old row and its file are deleted first, the new row is saved, and when
     * storing the new file fails the org is left with no old material and a new row without a file.
     */
    @Test
    void upload_whenTheStorageSaveFails_theOldRowAndFileAreAlreadyGone_pinsTheSection9Row() {
        when(repository.findByOrgIdAndType(ORG, MaterialType.LOGO)).thenReturn(Flux.just(meta("old-logo", ORG, "logo.png", 5, MaterialType.LOGO)));
        when(storage.save(any(MaterialMeta.class), any(byte[].class))).thenAnswer(invocation -> Mono.defer(() -> {
            ops.add("storage.save:failed");
            return Mono.error(new IllegalStateException("storage backend down"));
        }));

        StepVerifier.create(upload(bytes(3), MaterialType.LOGO)).expectError(IllegalStateException.class).verify(WAIT);

        assertThat(ops).containsExactly("repo.delete:old-logo", "storage.delete:old-logo", "repo.save:LOGO:file.png", "storage.save:failed");
        System.out.println("[MaterialApiServiceImplTest] failed storage save: " + ops);
    }

    // ----------------------------------------------------------------- download

    private static Flux<DataBuffer> content() {
        return Flux.just(new DefaultDataBufferFactory().wrap("bytes".getBytes(StandardCharsets.UTF_8)));
    }

    /** Catches an org check on LOGO and FAVICON: they are served to any caller (they appear on public pages). */
    @ParameterizedTest
    @EnumSource(value = MaterialType.class, names = {"LOGO", "FAVICON"})
    void download_logoAndFavicon_needNoOrgMatch(MaterialType type) {
        MaterialMeta foreign = meta("m1", OTHER_ORG, "logo.png", 5, type);
        when(storage.download(foreign)).thenAnswer(invocation -> content());

        StepVerifier.create(service.download(foreign)).expectNextCount(1).verifyComplete();
    }

    /** Catches another org's material being readable: the caller's org must match, and no byte is read otherwise. */
    @Test
    void download_otherTypes_requireTheCallersOrg() {
        MaterialMeta own = meta("m1", ORG, "a.png", 5, MaterialType.COMMON);
        MaterialMeta foreign = meta("m2", OTHER_ORG, "b.png", 5, MaterialType.COMMON);
        AtomicBoolean foreignRead = new AtomicBoolean();
        when(storage.download(own)).thenAnswer(invocation -> content());
        when(storage.download(foreign)).thenAnswer(invocation -> content().doOnSubscribe(subscription -> foreignRead.set(true)));

        StepVerifier.create(service.download(own)).expectNextCount(1).verifyComplete();
        StepVerifier.create(service.download(foreign)).expectErrorSatisfies(error -> {
            assertThat(((BizException) error).getError()).isEqualTo(BizError.INVALID_MATERIAL_REQUEST);
            assertThat(((BizException) error).getMessageKey()).isEqualTo("FILE_ORG_NOT_MATCH");
        }).verify(WAIT);

        assertThat(foreignRead).as("the foreign file is never read").isFalse();
    }

    // --------------------------------------------------------------------- list

    @Test
    void list_mapsIdAndFilename_ofTheCallersOrg() {
        when(metaService.getByOrgId(ORG)).thenReturn(Flux.just(meta("m1", ORG, "a.png", 5, MaterialType.COMMON), meta("m2", ORG, "b.png", 6, MaterialType.LOGO)));

        List<MaterialEndpoints.MaterialView> views = service.list().block(WAIT);

        assertThat(views).extracting(MaterialEndpoints.MaterialView::getId).containsExactly("m1", "m2");
        assertThat(views).extracting(MaterialEndpoints.MaterialView::getFilename).containsExactly("a.png", "b.png");
        verify(metaService, never()).getByOrgId(OTHER_ORG);
    }

    @Test
    void list_ofAnOrgWithoutMaterial_isEmpty() {
        when(metaService.getByOrgId(ORG)).thenReturn(Flux.empty());

        assertThat(service.list().block(WAIT)).isEmpty();
    }

    // ------------------------------------------------------------------- delete

    @Test
    void delete_unknownId_failsWithInvalidParameter10095_andDeletesNothing() {
        when(metaService.findById("ghost")).thenReturn(Mono.empty());

        expectBizError(service.delete("ghost"), BizError.INVALID_PARAMETER, "10095");

        assertThat(ops).isEmpty();
    }

    /** Catches another org's material being deleted, a non-developer deleting, and the order row then file. */
    @Test
    void delete_checksTheOrgBeforeDev_deletesRowThenFile_andNothingOnAFailure() {
        when(metaService.findById("own")).thenReturn(Mono.just(meta("own", ORG, "a.png", 5, MaterialType.COMMON)));
        when(metaService.findById("foreign")).thenReturn(Mono.just(meta("foreign", OTHER_ORG, "b.png", 5, MaterialType.LOGO)));

        expectBizError(service.delete("foreign"), BizError.INVALID_MATERIAL_REQUEST, "FILE_ORG_NOT_MATCH");
        assertThat(ops).isEmpty();

        when(orgDevChecker.checkCurrentOrgDev()).thenReturn(Mono.error(new BizException(BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED")));
        expectBizError(service.delete("own"), BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED");
        assertThat(ops).isEmpty();

        when(orgDevChecker.checkCurrentOrgDev()).thenReturn(Mono.empty());
        StepVerifier.create(service.delete("own")).verifyComplete();
        assertThat(ops).containsExactly("meta.delete:own", "storage.delete:own");
        System.out.println("[MaterialApiServiceImplTest] delete steps " + ops);
    }
}
