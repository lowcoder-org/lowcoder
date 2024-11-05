package org.lowcoder.api.application;

import lombok.RequiredArgsConstructor;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.application.ApplicationRecordApiService;
import org.lowcoder.api.application.view.ApplicationRecordMetaView;
import org.lowcoder.domain.application.model.ApplicationCombineId;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
@RestController
public class ApplicationRecordController implements ApplicationRecordEndpoints
{
    private final ApplicationRecordApiService applicationRecordApiService;

    @Override
    public Mono<Void> delete(@PathVariable String applicationRecordId) {
        return applicationRecordApiService.delete(applicationRecordId);
    }

    @Override
    public Mono<ResponseView<List<ApplicationRecordMetaView>>> getByApplicationId(@RequestParam(name = "applicationId") String applicationId) {
        return applicationRecordApiService.getByApplicationId(applicationId)
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Map<String, Object>>> dslById(@RequestParam(name = "applicationId") String applicationId,
            @RequestParam(name = "applicationRecordId") String applicationRecordId) {
        ApplicationCombineId applicationCombineId = new ApplicationCombineId(applicationId, applicationRecordId);
        return applicationRecordApiService.getRecordDSLFromApplicationCombineId(applicationCombineId)
                .map(ResponseView::success);
    }

}
