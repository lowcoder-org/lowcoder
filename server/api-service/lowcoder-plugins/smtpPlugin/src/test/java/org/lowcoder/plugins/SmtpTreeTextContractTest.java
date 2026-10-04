package org.lowcoder.plugins;

import org.junit.Test;
import org.lowcoder.plugins.SmtpPlugin.SmtpEngine;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.util.MustacheHelper;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Group {@code tree-text}, its {@code smtpPlugin} rows (docs/API_PAYLOAD_TEST_PLAN.md §4.10, task T8.4):
 * {@code SmtpEngine.buildQueryExecutionContext} renders the attachments with {@code renderMustacheJsonString} and
 * the address lists with {@code renderMustacheArrayJsonString} ({@code SmtpPlugin.java:174}, {@code :190}), whose
 * text is {@code JsonNode#toString} (E13), then reads that text with {@code fromJsonList}. For each template of
 * {@link #TEMPLATES} the line pins the text those helpers give for it with {@link #PARAMS}, and what the engine built
 * from the same template as {@code to} and as {@code attachments}, in {@value #REPORT}.
 *
 * <p>Limits: the rendered text is internal to the engine; the test renders it with the same helper the engine calls,
 * and the engine's result shows it was read as rendered.
 */
public class SmtpTreeTextContractTest {

    static final String REPORT = "tree-text/SmtpEngine.renderedLists.txt";
    static final String SEPARATOR = "\t";
    static final String NEWLINE = "\n";
    static final Map<String, Object> PARAMS = params();
    static final Map<String, String> TEMPLATES = templates();

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    private final SmtpEngine engine = new SmtpEngine();

    @BoundarySites({
            "lowcoder-plugins/smtpPlugin/src/main/java/org/lowcoder/plugins/SmtpPlugin.java#SmtpPlugin.SmtpEngine.buildQueryExecutionContext#renderMustacheJsonString#1",
            "lowcoder-plugins/smtpPlugin/src/main/java/org/lowcoder/plugins/SmtpPlugin.java#SmtpPlugin.SmtpEngine.renderAsArrayAndParse#renderMustacheArrayJsonString#1"})
    @Test
    public void renderedListsAsRead() {
        StringBuilder text = new StringBuilder();
        TEMPLATES.forEach((name, template) -> text.append(name)
                .append(SEPARATOR).append(MustacheHelper.renderMustacheArrayJsonString(template, PARAMS))
                .append(SEPARATOR).append(MustacheHelper.renderMustacheJsonString(template, PARAMS))
                .append(SEPARATOR).append(built(template))
                .append(NEWLINE));
        System.out.println("[SmtpTreeTextContractTest]\n" + text);
        GOLDEN.assertText(REPORT, text.toString());
    }

    /** {@code to=<addresses> attachments=<records>} the engine built with {@code template} as both, or the error. */
    private String built(String template) {
        Map<String, Object> queryConfig = new LinkedHashMap<>();
        queryConfig.put("from", "sender@example.com");
        queryConfig.put("to", template);
        queryConfig.put("subject", "s");
        queryConfig.put("attachments", template);
        try {
            SmtpQueryExecutionContext context = engine.buildQueryExecutionContext(null, queryConfig, PARAMS, null);
            return "to=" + Arrays.stream(context.getTo()).map(Object::toString).collect(Collectors.toList())
                    + " attachments=" + context.getAttachments();
        } catch (RuntimeException e) {
            return "ERROR " + ConfigBinding.errorText(e);
        }
    }

    private static Map<String, Object> params() {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("to", "žluť <zlut@example.com>");
        params.put("list", List.of("a@example.com", "b@example.com"));
        Map<String, Object> attachment = new LinkedHashMap<>();
        attachment.put("name", "a \"1\".txt");
        attachment.put("contentType", "text/plain");
        attachment.put("content", "aGk=");
        params.put("attachments", List.of(attachment));
        return params;
    }

    private static Map<String, String> templates() {
        Map<String, String> templates = new LinkedHashMap<>();
        templates.put("addressArray", "[\"x@example.com\", \"{{to}}\"]");
        templates.put("listParameter", "{{list}}");
        templates.put("attachmentArray", "[{\"name\": \"r\\u00e9sum\\u00e9.pdf\", \"contentType\": \"application/pdf\", \"content\": \"JVBERi0=\"}]");
        templates.put("attachmentsParameter", "{{attachments}}");
        templates.put("blank", "");
        return templates;
    }
}
