package org.lowcoder.domain.solutions;

import org.junit.jupiter.api.Test;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.service.ApplicationRecordService;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.service.DatasourceService;
import org.lowcoder.domain.template.model.Template;
import org.lowcoder.domain.template.service.TemplateService;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.contract.JavaValueWalker;
import org.lowcoder.sdk.contract.QueryResults;
import org.lowcoder.sdk.contract.RepresentativeInput;
import org.mockito.ArgumentCaptor;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Group {@code dynamic-roundtrip} (docs/API_PAYLOAD_TEST_PLAN.md §4.10, the {@code lowcoder-domain} part of task T9.3):
 * {@code TemplateSolutionServiceImpl.createFromTemplate} copies the template application's DSL as text: the production
 * mapper writes it ({@code toJson}), every template data source id is replaced in that text by the id of its copy, and
 * the text is read back ({@code fromJsonMap}) as the new application's editing DSL. The real service runs with mocked
 * stores on {@link #dsl()}, the §4.6 representative input as a query's {@code comp} and as a UI value, plus a
 * {@code java.util.Date} (as MongoDB hands one out) and a {@code BigDecimal}; the DSL handed to
 * {@code ApplicationService.create} is pinned, with the Java class of every value ({@link JavaValueWalker}) and the text
 * the production mapper writes for it, next to the same for the input, in {@value #REPORT}.
 *
 * <p>Limits: the stores are mocks; the template application has no published record, so its editing DSL is the live
 * one (`Application.getLiveApplicationDsl`); the replacement is plain text replacement, so the fixture also shows an id
 * replaced inside an unrelated string.
 */
class TemplateDslCopyContractTest {

    static final String REPORT = "dynamic-roundtrip/TemplateSolutionService.createFromTemplate.json";
    static final String TEMPLATE_ID = "template1";
    static final String APPLICATION_ID = "app1";
    static final String ORGANIZATION_ID = "org1";
    static final String VISITOR_ID = "user1";
    static final String TEMPLATE_DATASOURCE_ID = "ds-template";
    static final String COPIED_DATASOURCE_ID = "ds-copy";
    static final String INPUT_KEY = "input";
    static final String COPY_KEY = "copy";
    static final String SHAPE_KEY = "shape";
    static final String WRITTEN_KEY = "written";
    static final Duration TIMEOUT = Duration.ofSeconds(20);

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    private final TemplateService templateService = mock(TemplateService.class);
    private final DatasourceService datasourceService = mock(DatasourceService.class);
    private final ApplicationService applicationService = mock(ApplicationService.class);
    private final ApplicationRecordService applicationRecordService = mock(ApplicationRecordService.class);

    @BoundarySites({
            "lowcoder-domain/src/main/java/org/lowcoder/domain/solutions/TemplateSolutionServiceImpl.java#TemplateSolutionServiceImpl.createFromTemplate#toJson#1",
            "lowcoder-domain/src/main/java/org/lowcoder/domain/solutions/TemplateSolutionServiceImpl.java#TemplateSolutionServiceImpl.createFromTemplate#fromJsonMap#1"})
    @Test
    void dslCopyAsPinned() {
        Map<String, Object> dsl = dsl();
        Map<String, Object> report = new LinkedHashMap<>();
        report.put(INPUT_KEY, outcome(dsl));
        report.put(COPY_KEY, outcome(copy(dsl)));
        String actual = ConfigBinding.write(report);
        System.out.println("[TemplateDslCopyContractTest]\n" + actual);
        GOLDEN.assertJson(REPORT, actual);
    }

    /** The editing DSL of the application {@code createFromTemplate} creates from a template whose DSL is {@code dsl}. */
    private Map<String, Object> copy(Map<String, Object> dsl) {
        Template template = mock(Template.class);
        when(template.getName()).thenReturn("Template");
        when(template.getApplicationId()).thenReturn(APPLICATION_ID);
        when(templateService.getById(TEMPLATE_ID)).thenReturn(Mono.just(template));
        Application templateApplication = Application.builder().id(APPLICATION_ID).editingApplicationDSL(dsl).build();
        when(applicationService.findById(APPLICATION_ID)).thenReturn(Mono.just(templateApplication));
        when(applicationRecordService.getLatestRecordByApplicationId(APPLICATION_ID)).thenReturn(Mono.empty());
        Datasource templateDatasource = mock(Datasource.class);
        when(templateDatasource.getName()).thenReturn("Template datasource");
        when(datasourceService.getById(TEMPLATE_DATASOURCE_ID)).thenReturn(Mono.just(templateDatasource));
        Datasource copiedDatasource = mock(Datasource.class);
        when(copiedDatasource.getId()).thenReturn(COPIED_DATASOURCE_ID);
        when(datasourceService.create(any(Datasource.class), eq(VISITOR_ID))).thenReturn(Mono.just(copiedDatasource));
        when(applicationService.create(any(Application.class), eq(VISITOR_ID))).thenAnswer(call -> Mono.just(call.getArgument(0)));

        new TemplateSolutionServiceImpl(templateService, datasourceService, applicationService, applicationRecordService)
                .createFromTemplate(TEMPLATE_ID, ORGANIZATION_ID, VISITOR_ID).block(TIMEOUT);
        ArgumentCaptor<Application> created = ArgumentCaptor.forClass(Application.class);
        verify(applicationService).create(created.capture(), eq(VISITOR_ID));
        return created.getValue().getEditingApplicationDSL();
    }

    /** The Java class of every value and the text the production mapper writes. */
    private static Map<String, Object> outcome(Map<String, Object> dsl) {
        Map<String, Object> outcome = new LinkedHashMap<>();
        outcome.put(SHAPE_KEY, JavaValueWalker.shape(dsl));
        outcome.put(WRITTEN_KEY, QueryResults.written(dsl));
        return outcome;
    }

    /** A template DSL: one query on the template data source, UI values, a stored date and a decimal. */
    private static Map<String, Object> dsl() {
        Map<String, Object> query = new LinkedHashMap<>();
        query.put("id", "q1");
        query.put("gid", "gq1");
        query.put("name", "query1");
        query.put("datasourceId", TEMPLATE_DATASOURCE_ID);
        query.put("compType", "postgres");
        query.put("comp", RepresentativeInput.map());
        Map<String, Object> ui = new LinkedHashMap<>();
        ui.put("representative", RepresentativeInput.map());
        ui.put("savedAt", new Date(1_709_212_455_123L));
        ui.put("ratio", new BigDecimal("1.50"));
        ui.put("label", "reads from " + TEMPLATE_DATASOURCE_ID);
        Map<String, Object> dsl = new LinkedHashMap<>();
        dsl.put("ui", ui);
        dsl.put("queries", new ArrayList<>(List.of(query)));
        return dsl;
    }
}
