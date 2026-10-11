package org.lowcoder.api.framework.exception;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.infra.perf.PerfEvent;
import org.lowcoder.infra.perf.PerfHelper;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.test.util.ReflectionTestUtils;

import io.micrometer.core.instrument.Tag;
import io.micrometer.core.instrument.Tags;

/** Tests of {@link ApiPerfHelper}: the counted event and its tags. */
class ApiPerfHelperTest {

    private PerfHelper perfHelper;
    private ApiPerfHelper helper;

    @BeforeEach
    void setUp() {
        perfHelper = mock(PerfHelper.class);
        helper = new ApiPerfHelper();
        ReflectionTestUtils.setField(helper, "perfHelper", perfHelper);
    }

    @SuppressWarnings("unchecked")
    private Tags capturedTags(PerfEvent event) {
        ArgumentCaptor<Iterable<Tag>> tags = ArgumentCaptor.forClass(Iterable.class);
        verify(perfHelper).count(eq(event), tags.capture());
        return (Tags) tags.getValue();
    }

    /** Catches the business error code or the url being counted wrongly; a missing path counts as unknownUrl. */
    @Test
    void bizError_isCountedWithItsCodeAndTheUrl() {
        helper.perf(BizError.REQUEST_THROTTLED, MockServerHttpRequest.get("/api/orders/7").build().getPath());

        assertThat(capturedTags(PerfEvent.API_ERROR_CODE)).containsExactlyInAnyOrder(Tag.of("errorCode", "5009"), Tag.of("url", "/api/orders/7"));
        System.out.println("[ApiPerfHelperTest] counted " + PerfEvent.API_ERROR_CODE);
    }

    @Test
    void bizError_withoutAPath_isCountedAsUnknownUrl() {
        helper.perf(BizError.INTERNAL_SERVER_ERROR, null);

        assertThat(capturedTags(PerfEvent.API_ERROR_CODE)).containsExactlyInAnyOrder(Tag.of("errorCode", "5000"), Tag.of("url", "unknownUrl"));
    }

    @Test
    void pluginError_isCountedWithItsNameAndTheUrl() {
        helper.perf(PluginCommonError.QUERY_EXECUTION_ERROR, MockServerHttpRequest.get("/api/query").build().getPath());

        assertThat(capturedTags(PerfEvent.PLUGIN_ERROR_CODE)).containsExactlyInAnyOrder(Tag.of("errorCode", "QUERY_EXECUTION_ERROR"), Tag.of("url", "/api/query"));
    }

    @Test
    void pluginError_withoutAPath_isCountedAsUnknownUrl() {
        helper.perf(PluginCommonError.QUERY_EXECUTION_ERROR, null);

        assertThat(capturedTags(PerfEvent.PLUGIN_ERROR_CODE)).contains(Tag.of("url", "unknownUrl"));
        verify(perfHelper).count(eq(PerfEvent.PLUGIN_ERROR_CODE), any(Iterable.class));
    }
}
