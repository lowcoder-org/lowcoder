package org.lowcoder.sdk.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.contract.RepresentativeInput;
import org.lowcoder.sdk.models.Property;
import org.lowcoder.sdk.plugin.http.RawHttpRequest;
import org.springframework.http.HttpMethod;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.Instant;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

/**
 * Group {@code tree-text}, its {@code lowcoder-sdk} rows (docs/API_PAYLOAD_TEST_PLAN.md §4.10, task T8.4): JSON text
 * written by {@code JsonNode#toString}, which uses Jackson's internal default mapper, not the production one (E13).
 * {@code RjsonMustacheParser.renderMustacheJsonString} renders the Elasticsearch DSL, Mongo commands, raw HTTP bodies
 * and SMTP lists with it, so its <em>exact text</em> is pinned ({@link GoldenJson#assertText}), one line per template:
 * the §4.6 representative input, and nodes of every kind the parser builds (int, long, {@code BigInteger} and
 * {@code BigDecimal} inside a map parameter, decimals with trailing zeros, double, boolean, null, text with escapes and
 * non-ASCII, nested containers). The same templates go through {@code MustacheHelper.renderMustacheJsonString},
 * {@code renderMustacheArrayJsonString} (blank gives {@code []}) and {@code RawHttpRequest.renderParams}, whose
 * texts must be the same. A guard pins that {@code toString} and the production mapper still differ as in E13
 * ({@link #toStringIsNotTheProductionMapper}).
 *
 * <p>Limits: {@code toString} is pinned on the nodes these templates build; the callers in the plugins are pinned in
 * their own modules.
 */
public class TreeTextContractTest {

    static final String DIRECTORY = "tree-text/";
    static final String SEPARATOR = "\t";
    static final String NEWLINE = "\n";
    static final String DECIMAL_KEY = "decimal";
    static final String DECIMAL_TEXT = "1.10";
    static final String INSTANT_KEY = "instant";
    static final Map<String, Object> PARAMS = params();
    static final Map<String, String> TEMPLATES = templates();

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @BoundarySites({
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/util/RjsonMustacheParser.java#<file>#import#1",
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/util/RjsonMustacheParser.java#RjsonMustacheParser.renderMustacheJsonString#renderMustacheJson#1",
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/util/MustacheHelper.java#MustacheHelper.renderMustacheJsonString#renderMustacheJsonString#1"})
    @Test
    public void renderMustacheJsonString() {
        assertLines("renderMustacheJsonString.txt", template -> MustacheHelper.renderMustacheJsonString(template, PARAMS));
    }

    @BoundarySites("lowcoder-sdk/src/main/java/org/lowcoder/sdk/util/MustacheHelper.java#MustacheHelper.renderMustacheArrayJsonString#renderMustacheJsonString#1")
    @Test
    public void renderMustacheArrayJsonString() {
        assertLines("renderMustacheArrayJsonString.txt", template -> MustacheHelper.renderMustacheArrayJsonString(template, PARAMS));
    }

    @BoundarySites("lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/http/RawHttpRequest.java#RawHttpRequest.renderParams#renderMustacheJsonString#1")
    @Test
    public void rawHttpRequestBody() {
        assertLines("RawHttpRequest.renderParams.txt", template -> {
            RawHttpRequest request = new RawHttpRequest(HttpMethod.POST, template, "/path", List.<Property>of(), List.<Property>of(), List.<Property>of()) {
            };
            request.renderParams(PARAMS);
            return request.getBody();
        });
    }

    /**
     * E13: {@code toString} writes a {@code BigDecimal} as the production mapper does, but a {@code java.time} value
     * as embedded error text, since its mapper registers no modules; the production mapper writes it as a number.
     */
    @Test
    public void toStringIsNotTheProductionMapper() throws JsonProcessingException {
        ObjectNode node = JsonNodeFactory.instance.objectNode();
        node.put(DECIMAL_KEY, new BigDecimal(DECIMAL_TEXT));
        node.putPOJO(INSTANT_KEY, Instant.EPOCH);
        String text = "production" + SEPARATOR + JsonUtils.getObjectMapper().writeValueAsString(node) + NEWLINE
                + "toString" + SEPARATOR + node.toString() + NEWLINE;
        System.out.println("[TreeTextContractTest] E13\n" + text);
        GOLDEN.assertText(DIRECTORY + "E13.txt", text);
    }

    /** One line per template, {@code name<TAB>template<TAB>text}, or the error in place of the text. */
    private static void assertLines(String fixture, Function<String, String> render) {
        StringBuilder text = new StringBuilder();
        TEMPLATES.forEach((name, template) -> {
            String rendered;
            try {
                rendered = render.apply(template);
            } catch (RuntimeException e) {
                rendered = "ERROR " + ConfigBinding.errorText(e);
            }
            text.append(name).append(SEPARATOR).append(template.replace(NEWLINE, " ")).append(SEPARATOR).append(rendered).append(NEWLINE);
        });
        System.out.println("[TreeTextContractTest] " + fixture + "\n" + text);
        GOLDEN.assertText(DIRECTORY + fixture, text.toString());
    }

    private static Map<String, Object> params() {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("int", 1);
        params.put("long", 3_000_000_001L);
        params.put("double", 0.1);
        params.put("bool", false);
        params.put("nothing", null);
        params.put("str", "žluť \"quoted\" \\ / \t 🐎");
        Map<String, Object> kinds = new LinkedHashMap<>();
        kinds.put("zeta", "first");
        kinds.put("bigInteger", new BigInteger("9223372036854775808"));
        kinds.put("bigDecimal", new BigDecimal("1.50"));
        kinds.put("bigDecimalExponent", new BigDecimal("1E+3"));
        kinds.put("double", 1.0e20);
        kinds.put("nested", Arrays.asList(1, null, Map.of("deep", List.of())));
        params.put("map", kinds);
        params.put("list", Arrays.asList("a", 2, 2.50, null));
        return params;
    }

    private static Map<String, String> templates() {
        Map<String, String> templates = new LinkedHashMap<>();
        templates.put("representativeInput", RepresentativeInput.TEXT.trim());
        PARAMS.keySet().forEach(name -> templates.put("param:" + name, "{{" + name + "}}"));
        templates.put("object", "{\"a\": {{int}}, \"b\": [{{long}}, {{double}}, 1.50, 1e3, 2147483648], \"c\": \"{{str}}\", \"d\": {{map}}, \"{{str}}\": null}");
        templates.put("array", "[{{list}}, {{bool}}, {{nothing}}, \"text {{int}}\"]");
        templates.put("text", "plain text");
        templates.put("blank", " ");
        return templates;
    }
}
