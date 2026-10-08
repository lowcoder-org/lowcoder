package org.lowcoder.plugins;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugins.SmtpPlugin.SmtpEngine;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.FieldTree;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.contract.QueryResults;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Group {@code smtp-lists} (docs/API_PAYLOAD_TEST_PLAN.md §4.10, task T8.3): {@code SmtpEngine.buildQueryExecutionContext}
 * renders the address lists ({@code to}, {@code cc}, {@code bcc}, {@code replyTo}) as JSON arrays of strings and the
 * attachments as a JSON array of {@code Attachment} records, then reads both with {@code JsonUtils.fromJsonList}. Each
 * case of {@link #CASES} is one query config rendered with {@link #PARAMS}; the report pins the built context's fields
 * ({@link FieldTree}: the addresses by their text, the attachments by their components) or the error. Pinned in
 * {@value #REPORT}.
 *
 * <p>An address field that renders to a JSON string (text, or a parameter holding text) is read as one comma-separated
 * address list (NEW-36, GitHub #1491); one that renders to an array is read element by element.
 *
 * <p>Limits: no mail is sent; {@code fromJsonList} logs and returns {@code null} for text it cannot read, which the
 * engine treats as no addresses or no attachments, and the report shows that as an empty array or {@code null}.
 */
public class SmtpListsContractTest {

    static final String REPORT = "smtp-lists/SmtpEngine.buildQueryExecutionContext.json";
    static final String FROM = "sender@example.com";
    static final Map<String, Object> PARAMS = params();
    static final Map<String, Map<String, Object>> CASES = cases();

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    private final SmtpEngine engine = new SmtpEngine();

    @BoundarySites({
            "lowcoder-plugins/smtpPlugin/src/main/java/org/lowcoder/plugins/SmtpPlugin.java#SmtpPlugin.SmtpEngine.buildQueryExecutionContext#fromJsonList#1",
            "lowcoder-plugins/smtpPlugin/src/main/java/org/lowcoder/plugins/SmtpPlugin.java#SmtpPlugin.SmtpEngine.renderAsArrayAndParse#fromJsonList#1",
            "lowcoder-plugins/smtpPlugin/src/main/java/org/lowcoder/plugins/SmtpPlugin.java#SmtpPlugin.SmtpEngine.renderAsArrayAndParse#fromJson#1"})
    @Test
    public void listsAsPinned() {
        Map<String, Object> report = new LinkedHashMap<>();
        CASES.forEach((name, queryConfig) -> {
            try {
                report.put(name, FieldTree.of(engine.buildQueryExecutionContext(null, queryConfig, PARAMS, null)).get(FieldTree.VALUES_KEY));
            } catch (RuntimeException e) {
                report.put(name, Map.of(QueryResults.ERROR_KEY, ConfigBinding.errorText(e)));
            }
        });
        String actual = ConfigBinding.write(report);
        System.out.println("[SmtpListsContractTest]\n" + actual);
        GOLDEN.assertJson(REPORT, actual);
    }

    private static Map<String, Object> params() {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("to", "žluť <zlut@example.com>");
        params.put("list", List.of("a@example.com", "b@example.com, c@example.com"));
        params.put("name", "report \"2026\".csv");
        params.put("attachments", List.of(Map.of("name", "a.txt", "contentType", "text/plain", "content", "aGk=")));
        params.put("count", 3_000_000_001L);
        params.put("recipients", "test@mydomain.net");
        params.put("recipientList", "a@example.com, \"Doe, Jane\" <jane@example.com>");
        params.put("bracketed", "[test@mydomain.net]");
        params.put("empty", "");
        return params;
    }

    private static Map<String, Object> config(String to, String cc, String attachments) {
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("from", FROM);
        config.put("to", to);
        config.put("cc", cc);
        config.put("subject", "s");
        config.put("attachments", attachments);
        return config;
    }

    private static Map<String, Map<String, Object>> cases() {
        Map<String, Map<String, Object>> cases = new LinkedHashMap<>();
        cases.put("arrays", config("[\"x@example.com\", \"{{to}}\"]", "{{list}}",
                "[{\"name\": \"{{name}}\", \"contentType\": \"text/csv\", \"content\": \"YSxi\", \"extra\": 1}]"));
        cases.put("attachmentWithoutExtraProperty", config("[\"x@example.com\"]", "",
                "[{\"name\": \"{{name}}\", \"contentType\": \"text/csv\", \"content\": \"YSxi\"}]"));
        cases.put("attachmentsParameter", config("[\"x@example.com\"]", "", "{{attachments}}"));
        // NEW-36 (GitHub #1491): text, or a parameter holding text, is one address list (before: no address at all)
        cases.put("singleAddressNotArray", config("x@example.com", "", ""));
        cases.put("addressListText", config("x@example.com, y@example.com", "\"Doe, Jane\" <jane@example.com>", ""));
        cases.put("parameterHoldingAnAddress", config("{{recipients}}", "", ""));
        cases.put("parameterHoldingAnAddressList", config("{{recipientList}}", "", ""));
        cases.put("parameterHoldingBracketedText", config("{{bracketed}}", "", ""));
        cases.put("parameterHoldingEmptyText", config("{{empty}}", "", ""));
        cases.put("missingParameter", config("{{absent}}", "", ""));
        cases.put("arrayWithNumber", config("[\"x@example.com\", {{count}}]", "", ""));
        cases.put("attachmentNotObject", config("[\"x@example.com\"]", "", "[\"a.txt\"]"));
        cases.put("attachmentNumberContent", config("[\"x@example.com\"]", "", "[{\"name\": \"n\", \"content\": {{count}}}]"));
        cases.put("invalidAddress", config("[\"not an address@@\"]", "", ""));
        cases.put("arrayWithNull", config("[\"x@example.com\", null]", "", ""));
        return cases;
    }
}
