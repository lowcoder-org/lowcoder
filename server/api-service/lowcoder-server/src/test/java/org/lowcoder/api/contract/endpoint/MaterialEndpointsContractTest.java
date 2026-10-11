package org.lowcoder.api.contract.endpoint;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.contract.support.MaterialSamples;
import org.lowcoder.api.contract.support.PayloadSamples;
import org.lowcoder.api.material.MaterialApiService;
import org.lowcoder.api.material.MaterialController;
import org.lowcoder.api.material.MaterialEndpoints;
import org.lowcoder.api.material.MaterialEndpoints.MaterialView;
import org.lowcoder.api.material.MaterialEndpoints.UploadMaterialRequestDTO;
import org.lowcoder.domain.material.model.MaterialMeta;
import org.lowcoder.domain.material.service.meta.MaterialMetaService;
import org.lowcoder.sdk.exception.BizError;
import org.mockito.Mockito;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Codec-level tests of the 4 {@link MaterialEndpoints} (docs/API_PAYLOAD_TEST_PLAN.md §5.2, task T7.1), through the
 * production {@link MaterialController} in the {@link ContractTestClient} harness, with its two services mocked.
 *
 * <ul>
 *   <li>{@code upload}'s D1 body reaches the service as file name, base64 content and type; the controller builds the
 *       {@link MaterialView} from the stored metadata's id and file name, so the answer is its S1 golden.</li>
 *   <li>{@code download} answers the file's bytes, not JSON (§1.4), with the content type of its file name, a content
 *       disposition ({@code attachment}, or {@code inline} for {@value MaterialEndpoints#PREVIEW_TYPE}) and an hour of
 *       caching; an unknown id answers {@code INVALID_PARAMETER} with {@code FILE_NOT_EXIST} before any byte.</li>
 *   <li>{@code getFileList} wraps the service's list, {@code delete} answers {@code true}.</li>
 * </ul>
 *
 * <p>Stubbing groups (registry column {@code group}): {@code assembling} for {@code upload}, whose view the controller
 * builds; {@code pass-through} for the other three.
 */
class MaterialEndpointsContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(MaterialEndpoints.class);
    static final String MATERIAL_ID = "MaterialEndpointsContractTest.materialId";
    static final String TYPE_PARAMETER = "type";
    static final String TRUE = "true";
    /** {@code MaterialController#download}'s cache header: one hour. */
    static final String CACHE_CONTROL = "max-age=3600";

    private ContractTestClient.Builder builder;
    private MaterialApiService materialApiService;
    private MaterialMetaService materialMetaService;

    @BeforeEach
    void mocks() {
        builder = ContractTestClient.builder();
        materialApiService = builder.mock(MaterialApiService.class);
        materialMetaService = builder.mock(MaterialMetaService.class);
    }

    @AfterAll
    static void everyEndpointAndBranchHasATest() {
        CONTRACT.assertComplete(MaterialEndpointsContractTest.class);
    }

    @Test
    void upload() {
        UploadMaterialRequestDTO sample = (UploadMaterialRequestDTO) PayloadSamples.of(UploadMaterialRequestDTO.class).value();
        MaterialView view = MaterialSamples.materialView();
        Mockito.when(materialApiService.upload(sample.getFilename(), sample.getContent(), sample.getType()))
                .thenReturn(Mono.just(MaterialSamples.materialMeta(view.getId(), view.getFilename())));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "upload", Map.of(), EndpointContract.d1(UploadMaterialRequestDTO.class));
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(MaterialView.class)));
            Mockito.verify(materialApiService).upload(sample.getFilename(), sample.getContent(), sample.getType());
        }
    }

    /** The default type, {@value MaterialEndpoints#DOWNLOAD_TYPE}: an attachment. */
    @Test
    void download() {
        EntityExchangeResult<byte[]> result = downloadAs(Map.of());
        assertThat(result.getResponseHeaders().getContentDisposition()).isEqualTo(ContentDisposition.attachment().filename(MaterialSamples.FILENAME).build());
    }

    @Test
    void downloadPreview() {
        EntityExchangeResult<byte[]> result = downloadAs(Map.of(TYPE_PARAMETER, MaterialEndpoints.PREVIEW_TYPE));
        assertThat(result.getResponseHeaders().getContentDisposition()).isEqualTo(ContentDisposition.inline().filename(MaterialSamples.FILENAME).build());
    }

    /** The {@code switchIfEmpty(Mono.error(...))} branch: no metadata for the id. */
    @Test
    void downloadMissing() {
        Mockito.when(materialMetaService.findById(MATERIAL_ID)).thenReturn(Mono.empty());
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "download", Map.of(), null, MATERIAL_ID);
            EndpointContract.assertBizError(result, BizError.INVALID_PARAMETER, "FILE_NOT_EXIST");
            Mockito.verify(materialApiService, Mockito.never()).download(Mockito.any());
        }
    }

    @Test
    void getFileList() {
        Mockito.when(materialApiService.list()).thenReturn(Mono.just(List.of(MaterialSamples.materialView(), MaterialSamples.materialView())));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getFileList", Map.of(), null);
            String view = EndpointContract.s1(MaterialView.class);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.array(view, view)));
        }
    }

    @Test
    void delete() {
        Mockito.when(materialApiService.delete(MATERIAL_ID)).thenReturn(Mono.empty());
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "delete", Map.of(), null, MATERIAL_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            Mockito.verify(materialApiService).delete(MATERIAL_ID);
        }
    }

    /** {@code download} with the {@code type} parameter of {@code query}: the file's bytes, type and caching. */
    private EntityExchangeResult<byte[]> downloadAs(Map<String, ?> query) {
        MaterialMeta meta = MaterialSamples.materialMeta(MATERIAL_ID, MaterialSamples.FILENAME);
        Mockito.when(materialMetaService.findById(MATERIAL_ID)).thenReturn(Mono.just(meta));
        Mockito.doReturn(Flux.just(DefaultDataBufferFactory.sharedInstance.wrap(MaterialSamples.FILE_BYTES))).when(materialApiService).download(meta);
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "download", query, null, MATERIAL_ID);
            EndpointContract.assertBytes(result, HttpStatus.OK, MediaType.IMAGE_PNG, MaterialSamples.FILE_BYTES);
            assertThat(result.getResponseHeaders().getFirst(HttpHeaders.CACHE_CONTROL)).isEqualTo(CACHE_CONTROL);
            return result;
        }
    }

    private ContractTestClient client() {
        return builder.controllerWithMockedDependencies(MaterialController.class).build();
    }
}
