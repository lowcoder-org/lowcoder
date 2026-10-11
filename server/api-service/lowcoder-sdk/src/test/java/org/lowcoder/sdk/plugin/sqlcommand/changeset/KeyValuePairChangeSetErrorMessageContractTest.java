package org.lowcoder.sdk.plugin.sqlcommand.changeset;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.exception.PluginException;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.fail;

/**
 * The {@code lowcoder-sdk} row of group {@code error-message-json} (docs/API_PAYLOAD_TEST_PLAN.md §4.10, task T8.5):
 * a key-value change set whose {@code comp} is not a list fails with {@code GUI_INVALID_PARAM}, and the production
 * mapper writes the {@code comp} it got ({@code toJson}) into the message. For one {@code comp} of every non-list JSON
 * type the <em>exact text</em> is pinned, one line per value ({@link GoldenJson#assertText}): the message argument and
 * the English message the user sees, in {@value #FIXTURE}.
 *
 * <p>Limits: the localized messages of other locales are not pinned; they take the same argument.
 */
public class KeyValuePairChangeSetErrorMessageContractTest {

    static final String FIXTURE = "error-message-json/KeyValuePairChangeSet.messages.txt";
    static final String SEPARATOR = "\t";
    static final String NEWLINE = "\n";
    static final String EXPECTED_MESSAGE_KEY = "GUI_INVALID_PARAM";

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @BoundarySites("lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/sqlcommand/changeset/KeyValuePairChangeSet.java#KeyValuePairChangeSet.parseColumnValueMap#toJson#1")
    @Test
    public void nonListCompMessage() {
        StringBuilder text = new StringBuilder();
        comps().forEach((name, comp) -> {
            try {
                new KeyValuePairChangeSet(comp);
                fail("a " + name + " comp must not make a change set");
            } catch (PluginException e) {
                if (!EXPECTED_MESSAGE_KEY.equals(e.getMessageKey())) {
                    throw new AssertionError("unexpected message key for " + name + ": " + e.getMessageKey(), e);
                }
                text.append(name).append(SEPARATOR).append(Arrays.toString(e.getArgs()))
                        .append(SEPARATOR).append(e.getMessage()).append(NEWLINE);
            }
        });
        System.out.println("[KeyValuePairChangeSetErrorMessageContractTest] " + FIXTURE + "\n" + text);
        GOLDEN.assertText(FIXTURE, text.toString());
    }

    /** One {@code comp} of every non-list JSON type, by name. */
    private static Map<String, Object> comps() {
        Map<String, Object> comps = new LinkedHashMap<>();
        comps.put("int", 1);
        comps.put("long", 3_000_000_001L);
        comps.put("decimal", 1.5);
        comps.put("exponent", 1.0e20);
        comps.put("bigDecimal", new BigDecimal("1.50"));
        comps.put("bool", true);
        comps.put("null", null);
        comps.put("string", "it's \"q\" \\ žluť");
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("zeta", "it's");
        map.put("decimal", new BigDecimal("1.50"));
        map.put("nested", Arrays.asList(1, null, List.of(true)));
        comps.put("map", map);
        return comps;
    }
}
