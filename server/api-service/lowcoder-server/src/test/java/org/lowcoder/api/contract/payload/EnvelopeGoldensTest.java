package org.lowcoder.api.contract.payload;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.PayloadTypeWalker;
import org.lowcoder.api.contract.support.PayloadTypeWalker.Property;
import org.lowcoder.api.framework.view.PageResponseView;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.usermanagement.view.GroupListResponseView;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.util.JsonUtils;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Layer A goldens of the response envelopes (docs/API_PAYLOAD_TEST_PLAN.md §5.2, task T1.1): {@link ResponseView},
 * {@link PageResponseView} and {@link GroupListResponseView}, written by the production mapper and compared with
 * {@code json-contract/envelope/<Envelope>.<case>.json}. Every branch the envelopes have is a case: success with and
 * without data ({@code @JsonInclude(NON_NULL)} drops a null {@code data}), error with and without data, the
 * {@code REDIRECT} code that still counts as success, and the page and group-list fields. Each fixture's top-level
 * names must equal the walker's {@code serializedProperties} of the envelope minus the ones the case leaves null.
 *
 * <p>Envelope fixtures are not under {@code types/}: the walker strips the envelopes from every endpoint, so they are
 * not closure types, and the completeness gate's rule 5 accepts only closure types and extra roots there. The data
 * inside is a fixed small map; the endpoint tests of WP2–WP7 put the S1 goldens of their types inside the envelope.
 */
class EnvelopeGoldensTest {

    static final String DIRECTORY = "envelope/";
    static final int ERROR_CODE = 5000;
    static final String ERROR_MESSAGE = "EnvelopeGoldensTest.message";
    static final int PAGE_NUM = 2;
    static final int PAGE_SIZE = 40_003;
    static final int TOTAL = 40_004;
    static final String DATA_PROPERTY = "data";

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    /** The envelope's payload in every case: two keys, two value kinds. */
    static Map<String, Object> data(String owner) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("name", owner + ".data.name");
        data.put("count", 40_005);
        return data;
    }

    @Test
    void responseViewSuccess() throws IOException {
        assertEnvelope(ResponseView.class, "success", ResponseView.success(data("ResponseView")));
    }

    @Test
    void responseViewSuccessWithoutData() throws IOException {
        assertEnvelope(ResponseView.class, "success-null-data", ResponseView.success(null), DATA_PROPERTY);
    }

    @Test
    void responseViewError() throws IOException {
        assertEnvelope(ResponseView.class, "error", ResponseView.error(ERROR_CODE, ERROR_MESSAGE), DATA_PROPERTY);
    }

    @Test
    void responseViewErrorWithData() throws IOException {
        assertEnvelope(ResponseView.class, "error-with-data", ResponseView.error(ERROR_CODE, ERROR_MESSAGE, data("ResponseView")));
    }

    @Test
    void responseViewRedirectIsSuccess() throws IOException {
        assertEnvelope(ResponseView.class, "redirect",
                ResponseView.error(BizError.REDIRECT.getBizErrorCode(), ERROR_MESSAGE, data("ResponseView")));
    }

    @Test
    void pageResponseViewSuccess() throws IOException {
        assertEnvelope(PageResponseView.class, "success",
                PageResponseView.success(List.of(data("PageResponseView[0]"), data("PageResponseView[1]")), PAGE_NUM, PAGE_SIZE, TOTAL));
    }

    @Test
    void pageResponseViewError() throws IOException {
        assertEnvelope(PageResponseView.class, "error", PageResponseView.error(ERROR_CODE, ERROR_MESSAGE, PAGE_NUM, PAGE_SIZE, TOTAL));
    }

    @Test
    void groupListResponseViewSuccess() throws IOException {
        assertEnvelope(GroupListResponseView.class, "success", new GroupListResponseView<>(ResponseView.SUCCESS, "",
                data("GroupListResponseView"), 40_006, 40_007, 40_008, 40_009, TOTAL, PAGE_NUM, PAGE_SIZE));
    }

    /** Writes {@code envelope}, compares it with its fixture and its names with the walker's, minus {@code nullProperties}. */
    private static void assertEnvelope(Class<?> type, String envelopeCase, Object envelope, String... nullProperties)
            throws JsonProcessingException {
        String json = JsonUtils.getObjectMapper().writeValueAsString(envelope);
        String fixture = DIRECTORY + type.getSimpleName() + "." + envelopeCase + ".json";
        System.out.println("[EnvelopeGoldensTest] " + fixture + ": " + json);
        GOLDEN.assertJson(fixture, json);
        Set<String> expectedNames = PayloadTypeWalker.describe(type).serializedProperties().stream().map(Property::name)
                .collect(Collectors.toCollection(TreeSet::new));
        expectedNames.removeAll(Set.of(nullProperties));
        Set<String> names = new TreeSet<>();
        JsonUtils.getObjectMapper().readTree(json).fieldNames().forEachRemaining(names::add);
        assertThat(names).as("top-level names of " + fixture).isEqualTo(expectedNames);
    }
}
