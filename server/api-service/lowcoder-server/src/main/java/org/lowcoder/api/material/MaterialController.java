package org.lowcoder.api.material;

import java.time.Duration;
import java.util.List;

import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.domain.material.service.meta.MaterialMetaService;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.util.MediaTypeUtils;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@RestController
public class MaterialController implements MaterialEndpoints 
{
    private final MaterialApiService materialApiService;
    private final MaterialMetaService materialMetaService;

    @Override
    public Mono<ResponseView<MaterialView>> upload(@RequestBody UploadMaterialRequestDTO uploadMaterialRequestDTO) {
        return materialApiService.upload(uploadMaterialRequestDTO.getFilename(), uploadMaterialRequestDTO.getContent(),
                        uploadMaterialRequestDTO.getType())
                .map(materialMeta -> {
                    MaterialView view = MaterialView.builder()
                            .id(materialMeta.getId())
                            .filename(materialMeta.getFilename())
                            .build();
                    return ResponseView.success(view);
                });
    }

    /**
     * @param type {@link #DOWNLOAD_TYPE,#PREVIEW_TYPE}
     */
    @Override
    public Mono<Void> download(@PathVariable String id,
            @RequestParam(value = "type", defaultValue = DOWNLOAD_TYPE) String type,
            ServerHttpResponse serverHttpResponse) {
        return materialMetaService.findById(id)
                .switchIfEmpty(Mono.error(new BizException(BizError.INVALID_PARAMETER, "FILE_NOT_EXIST")))
                .doOnNext(materialMeta -> {
                    HttpHeaders headers = serverHttpResponse.getHeaders();
                    if (PREVIEW_TYPE.equals(type)) {
                        headers.setContentDisposition(ContentDisposition.inline().filename(materialMeta.getFilename()).build());
                    } else {
                        headers.setContentDisposition(ContentDisposition.attachment().filename(materialMeta.getFilename()).build());
                    }
                    headers.setContentType(MediaTypeUtils.parse(materialMeta.getFilename()));
                    headers.setCacheControl(CacheControl.maxAge(Duration.ofHours(1)));
                })
                .flatMap(materialMeta -> serverHttpResponse.writeWith(materialApiService.download(materialMeta)))
                .then();
    }

    @Override
    public Mono<ResponseView<List<MaterialView>>> getFileList() {
        return materialApiService.list()
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> delete(@PathVariable String id) {
        return materialApiService.delete(id)
                .thenReturn(ResponseView.success(true));
    }
}
