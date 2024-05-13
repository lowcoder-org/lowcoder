package org.lowcoder.domain.solutions;

import jakarta.annotation.Nonnull;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.RandomStringUtils;
import org.apache.commons.lang3.tuple.Pair;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceCreationSource;
import org.lowcoder.domain.datasource.service.DatasourceService;
import org.lowcoder.domain.query.model.ApplicationQuery;
import org.lowcoder.domain.template.model.Template;
import org.lowcoder.domain.template.service.TemplateService;
import org.lowcoder.infra.annotation.NonEmptyMono;
import org.lowcoder.infra.util.TupleUtils;
import org.lowcoder.sdk.util.JsonUtils;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static java.util.Objects.isNull;
import static org.lowcoder.sdk.exception.BizError.TEMPLATE_NOT_CORRECT;
import static org.lowcoder.sdk.exception.BizError.TEMPLATE_NOT_EXIST;
import static org.lowcoder.sdk.util.ExceptionUtils.deferredError;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;

@RequiredArgsConstructor
@Service
public class TemplateSolutionServiceImpl implements TemplateSolutionService {

    private static final int RANDOM_LENGTH = 6;

    private final TemplateService templateService;
    private final DatasourceService datasourceService;
    @Lazy
    private final ApplicationService applicationService;

    @Override
    public Mono<Application> createFromTemplate(String templateId, String orgId, String visitorId) {
        return templateService.getById(templateId)
                .switchIfEmpty(deferredError(TEMPLATE_NOT_EXIST, "TEMPLATE_NOT_EXIST"))
                .zipWith(Mono.just(orgId))
                .zipWhen(tuple -> applicationService.findById(tuple.getT1().getApplicationId())
                                .switchIfEmpty(deferredError(TEMPLATE_NOT_EXIST, "TEMPLATE_NOT_EXIST")),
                        TupleUtils::merge)
                .zipWhen(tuple -> copyDatasourceFromTemplateToCurrentOrganization(tuple.getT2(), tuple.getT3(), visitorId), TupleUtils::merge)
                .flatMap(tuple -> {
                    Template template = tuple.getT1();
                    String organizationId = tuple.getT2();
                    Application templateApplication = tuple.getT3();
                    List<Pair<String, String>> datasourceIdMap = tuple.getT4();
                    String dsl = JsonUtils.toJson(templateApplication.getLiveApplicationDsl());
                    for (Pair<String, String> stringStringPair : datasourceIdMap) {
                        dsl = dsl.replace(stringStringPair.getLeft(), stringStringPair.getRight());
                    }
                    Map<String, Object> applicationDSL = JsonUtils.fromJsonMap(dsl);
                    Application application = Application.builder()
                            .applicationStatus(ApplicationStatus.NORMAL)
                            .organizationId(organizationId)
                            .name(template.getName())
                            .editingApplicationDSL(applicationDSL)
                            .publishedApplicationDSL(applicationDSL)
                            .build();
                    return applicationService.create(application, visitorId);
                });
    }


    @Override
    @NonEmptyMono
    public Mono<Set<String>> getTemplateApplicationIds(Collection<String> applicationIds) {
        return templateService.getByApplicationIds(applicationIds)
                .map(Template::getApplicationId)
                .collect(Collectors.toSet());
    }

    /**
     * @param application template application
     * @return pairs of template datasource id and copied datasource id
     */
    private Mono<List<Pair<String, String>>> copyDatasourceFromTemplateToCurrentOrganization(String currentOrganizationId, Application application,
            String visitorId) {
        Set<ApplicationQuery> queries = application.getLiveQueries();
        if (isNull(queries)) {
            return ofError(TEMPLATE_NOT_CORRECT, "TEMPLATE_NOT_CORRECT");
        }
        Set<String> datasourceIds = queries.stream()
                .map(query -> query.getBaseQuery().getDatasourceId())
                .collect(Collectors.toSet());
        return Flux.fromIterable(datasourceIds)
                .flatMap(datasourceId -> doCopyDatasource(currentOrganizationId, datasourceId, visitorId)
                        .map(copiedDatasourceId -> Pair.of(datasourceId, copiedDatasourceId)))
                .collectList();
    }

    /**
     * @param organizationId user current orgId
     * @return newly copied datasource id
     */
    @SuppressWarnings({"ConstantConditions"})
    private Mono<String> doCopyDatasource(String organizationId, String datasourceId, String visitorId) {
        return datasourceService.getById(datasourceId)
                .flatMap(datasource -> {
                    if (datasource.isSystemStatic()) {
                        return Mono.just(datasource.getId());
                    }

                    // return new QUICK_REST_API id for legacy quick rest api
                    if (datasource.isLegacyQuickRestApi()) {
                        return Mono.just(Datasource.QUICK_REST_API.getId());
                    }

                    if (datasource.isLegacyLowcoderApi()) {
                        return Mono.just(Datasource.LOWCODER_API.getId());
                    }
                    return createNewDatasourceFrom(organizationId, visitorId, datasource);
                });

    }

    @SuppressWarnings("ReactiveStreamsNullableInLambdaInTransform")
    @Nonnull
    private Mono<String> createNewDatasourceFrom(String organizationId, String visitorId, Datasource datasource) {
        Datasource copyDatasource = new Datasource();
        copyDatasource.setName(generateCopyDatasourceName(datasource.getName()));
        copyDatasource.setType(datasource.getType());
        copyDatasource.setDetailConfig(datasource.getDetailConfig());
        copyDatasource.setCreationSource(DatasourceCreationSource.CLONE_FROM_TEMPLATE.getValue());
        copyDatasource.setOrganizationId(organizationId);
        return datasourceService.create(copyDatasource, visitorId)

                .map(Datasource::getId);
    }

    private String generateCopyDatasourceName(String name) {
        return name + "_" + RandomStringUtils.random(RANDOM_LENGTH, true, false);
    }


}
