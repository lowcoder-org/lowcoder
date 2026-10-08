package org.lowcoder.plugin.sql;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.sql.GeneralSqlExecutor.StatementInput;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * BF-146 (T145, verify first): the sort rewrite of {@code GeneralSqlExecutor.getStatementAndExecute} loops
 * ({@code do ... while (orderByIndex >= 0)}) until no bind parameter is a map with a {@code sort} key. A sort map whose
 * index is not below the number of {@code ?} in the SQL is never removed, so the loop would not end. That needs more bind
 * parameters than {@code ?}. The defect is not reproduced, and the loop is left as it is, because of the structure below:
 * the text path builds both from one key list. This class checks that on representative shapes and a seeded fuzz; it is
 * evidence for the argument, not an exhaustive proof over every SQL text.
 *
 * <p>The bind list and the placeholders come from the same mustache keys: {@code MustacheHelper.doPrepareStatement}
 * replaces each key with a placeholder, merges the keys of one quoted literal into one generated key and inlines an
 * {@code IN} list, mutating the key list each time, and {@code getPreparedStatementInput} reads the bind values from that
 * list afterwards. A literal {@code ?} in the SQL only adds to the count the rewrite splits on.
 *
 * <p>The other producers are run in their modules: the GUI commands in {@code GuiSqlCommandRenderTest} (sdk: MySQL,
 * Postgres), {@code MssqlQueryExecutorTest} and {@code OracleQueryExecutorTest}, which bind a sort map as its JSON text
 * or write it into the SQL, never as a map, so the rewrite does not act on a GUI statement at all; and Postgres's own
 * {@code getPreparedStatementInput} in {@code PostgresExecutorPreparedInputTest}, run through the real executor.
 *
 * <p>The {@code ?} are counted as the rewrite counts them ({@code split("\\?")}, literal ones included), on purpose:
 * that is the loop's own condition, not the JDBC placeholder count. This shows the loop ends; it does not show the
 * rewrite is correct: with a literal {@code ?} before the sort placeholder it rewrites the wrong {@code ?} (NEW-46).
 *
 * <p>Limits: the fuzz covers the shapes in {@link #PIECES}, not every SQL text.
 */
public class GeneralSqlExecutorSortRewriteReachTest {

    static final String TAG = "[GeneralSqlExecutorSortRewriteReachTest] ";
    static final String SORT_KEY = "sort";
    static final Map<String, Object> SORT_MAP = Map.of(SORT_KEY, "desc");
    static final String QUESTION_MARK = "\\?";
    /** SQL fragments the fuzz joins: quotes, an IN list opener, a LIKE pattern, literal question marks and mustaches. */
    static final String[] PIECES = {"select ", "a ", "'", "\"", "`", "?", "(", ")", ",", " in (", " like ", "%", "{{k}}", "{{k}}",
            "{{k}}", " order by x ", "\n", "$$", "\\", " "};
    static final String MUSTACHE_PIECE = "{{k}}";
    static final long SEED = 146;
    static final int CASES = 100_000;
    static final int MAX_PIECES = 16;

    private final GeneralSqlExecutor executor = new GeneralSqlExecutor();

    private static int placeholders(String sql) {
        return sql.split(QUESTION_MARK, -1).length - 1;
    }

    /** The index of the first sort map in {@code params} that has no {@code ?} to replace, or -1. */
    private static int unreachableSortIndex(List<Object> params, int placeholders) {
        for (int i = 0; i < params.size(); i++) {
            if (params.get(i) instanceof Map<?, ?> map && map.containsKey(SORT_KEY) && i >= placeholders) {
                return i;
            }
        }
        return -1;
    }

    private StatementInput prepare(String sql, Map<String, Object> params) {
        StatementInput input = executor.getPreparedStatementInput(sql, new HashMap<>(params));
        System.out.println(TAG + sql.replace('\n', ' ') + " -> " + input.getSql().replace('\n', ' ') + " " + input.getParams());
        return input;
    }

    /**
     * The shapes that change the key list: a quoted literal holding two keys, an IN list, a literal {@code ?}, each before
     * a sort placeholder. In each the bind list is no longer than the placeholders and the sort map has its {@code ?}.
     */
    @Test
    public void theShapesThatChangeTheKeyListKeepASortMapOnItsPlaceholderBF146() {
        Map<String, Object> params = Map.of("a", "x", "b", "y", "ids", List.of(1, 2), "n", 3, "dir", SORT_MAP);
        for (String sql : List.of(
                "select id from t where name like '%{{a}}%{{b}}%' order by id {{dir}}",
                "select id from t where id in ({{ids}}) and n > {{n}} order by id {{dir}}",
                "select 'what?' as q, id from t where n > {{n}} order by id {{dir}}",
                "select id from t order by id {{dir}}, n {{dir}}")) {
            StatementInput input = prepare(sql, params);
            int placeholders = placeholders(input.getSql());
            assertTrue(input.getParams().size() <= placeholders, sql);
            assertEquals(-1, unreachableSortIndex(input.getParams(), placeholders), sql);
        }
    }

    /**
     * BF-146: over {@value #CASES} templates joined at random from {@link #PIECES} (fixed seed {@value #SEED}), with each
     * mustache bound to a sort map, a list, a text with a question mark or a number, no prepared statement has more bind
     * values than placeholders, so no sort map lacks its {@code ?}. Catches: a change to the key handling that lets the
     * bind list outgrow the placeholders, which would make the rewrite loop endless.
     */
    @Test
    public void noTemplateGivesASortMapWithoutAPlaceholderBF146() {
        Random random = new Random(SEED);
        int withSortMap = 0;
        for (int n = 0; n < CASES; n++) {
            StringBuilder sql = new StringBuilder();
            Map<String, Object> params = new HashMap<>();
            int keys = 0;
            int pieces = 2 + random.nextInt(MAX_PIECES - 1);
            for (int i = 0; i < pieces; i++) {
                String piece = PIECES[random.nextInt(PIECES.length)];
                if (piece.equals(MUSTACHE_PIECE)) {
                    String key = "k" + keys++;
                    piece = "{{" + key + "}}";
                    params.put(key, switch (random.nextInt(4)) {
                        case 0 -> SORT_MAP;
                        case 1 -> List.of(1, 2);
                        case 2 -> "v?";
                        default -> 7;
                    });
                }
                sql.append(piece);
            }
            StatementInput input = executor.getPreparedStatementInput(sql.toString(), new HashMap<>(params));
            int placeholders = placeholders(input.getSql());
            if (params.containsValue(SORT_MAP)) {
                withSortMap++;
            }
            assertTrue(input.getParams().size() <= placeholders,
                    () -> "more bind values than placeholders: " + sql + " -> " + input.getSql() + " " + input.getParams());
            assertEquals(-1, unreachableSortIndex(input.getParams(), placeholders), sql::toString);
        }
        System.out.println(TAG + CASES + " templates, " + withSortMap + " with a sort map: none without its placeholder");
        assertTrue(withSortMap > CASES / 4, "the fuzz must bind sort maps");
    }
}
