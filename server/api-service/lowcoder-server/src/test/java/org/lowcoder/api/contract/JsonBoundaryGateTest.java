package org.lowcoder.api.contract;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.JsonBoundaryClassification;
import org.lowcoder.api.contract.support.JsonBoundaryClassification.AnnotatedTest;
import org.lowcoder.api.contract.support.JsonBoundaryClassification.Group;
import org.lowcoder.api.contract.support.JsonBoundaryClassification.Row;
import org.lowcoder.api.contract.support.JsonBoundaryScanner;
import org.lowcoder.api.contract.support.JsonBoundaryScanner.Site;
import org.lowcoder.api.contract.support.WorkPackageStatus;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * {@code JsonBoundaryGate} of docs/API_PAYLOAD_TEST_PLAN.md §6.2.
 *
 * <ul>
 *   <li><b>Classification (enforcing).</b> {@link JsonBoundaryScanner} runs over every main source, reached from this
 *       module through {@code ..}, and {@link JsonBoundaryClassification#problems} checks
 *       {@code lowcoder-server/src/test/resources/json-contract/boundary-sites/json-boundary-sites.tsv} against it with the prototype's rules, by stable key; WRAPPER_RULE
 *       holds; every {@code test:<group>} names a group of {@code lowcoder-server/src/test/resources/json-contract/boundary-sites/json-boundary-groups.tsv}, and every
 *       group there has rows.</li>
 *   <li><b>{@code @BoundarySites} (enforcing).</b> In every test source root, each annotation has string-literal keys,
 *       sits on a test method, and names current rows whose group lists that test root, so stale or misplaced keys
 *       fail.</li>
 *   <li><b>Per WP.</b> A group whose WPs are all in {@code wp-status.json} ({@link WorkPackageStatus}) fails while one of its rows is named by no
 *       {@code @BoundarySites} test under its roots; other groups are reported.</li>
 * </ul>
 *
 * <p>Limit (plan §6.2): it proves that each row has a test that claims it, not that the test reaches the site.
 */
class JsonBoundaryGateTest {

    private static final String TEST_ROOT_SUFFIX = "/src/test/java";

    private static Path root;
    private static List<Site> scanned;
    private static List<String> classification;
    private static List<Row> rows;
    private static Map<String, Group> groups;
    private static List<AnnotatedTest> annotated;

    @BeforeAll
    static void scan() {
        root = JsonBoundaryClassification.apiServiceRoot();
        scanned = JsonBoundaryScanner.scanAll(root);
        classification = JsonBoundaryClassification.readLines(root, JsonBoundaryClassification.SITES_FILE);
        rows = JsonBoundaryClassification.rows(classification, JsonBoundaryClassification.SITES_FILE, new ArrayList<>());
        groups = JsonBoundaryClassification.groups(root);
        annotated = JsonBoundaryClassification.annotatedTests(root);
        System.out.println("[JsonBoundaryGateTest] " + JsonBoundaryClassification.summary(classification, scanned));
    }

    @Test
    void classificationMatchesTheMainSources() {
        List<String> problems = new ArrayList<>(JsonBoundaryClassification.problems(classification, scanned, groups.keySet(),
                JsonBoundaryClassification.SITES_FILE, path -> JsonBoundaryScanner.fileAttestation(root, path)));
        problems.addAll(JsonBoundaryScanner.wrapperProblems(root, JsonBoundaryScanner.KINDS.get(JsonBoundaryScanner.WRAPPER_KIND)));
        problems.forEach(problem -> System.out.println("[JsonBoundaryGateTest] " + problem));
        assertThat(problems).isEmpty();
    }

    @Test
    void everyGroupHasRowsAnOwnerAndAnExistingModule() {
        Set<String> used = rows.stream().map(Row::group).filter(java.util.Objects::nonNull).collect(Collectors.toCollection(TreeSet::new));
        assertThat(groups.keySet()).containsExactlyInAnyOrderElementsOf(used);
        groups.values().forEach(group -> {
            assertThat(group.wps()).as(group.name()).allSatisfy(wp -> assertThat(wp).matches(WorkPackageStatus.WP_NAME));
            // the module must exist; its test sources may not yet (the owning WP creates them)
            assertThat(group.testRoots()).as(group.name()).allSatisfy(testRoot -> assertThat(testRoot).endsWith(TEST_ROOT_SUFFIX)
                    .satisfies(r -> assertThat(root.resolve(r.substring(0, r.length() - TEST_ROOT_SUFFIX.length()))).isDirectory()));
        });
    }

    @Test
    void boundarySitesAnnotationsNameCurrentRowsOfTheirGroup() {
        Map<String, Row> rowsByKey = rows.stream().collect(Collectors.toMap(Row::key, row -> row, (a, b) -> a, LinkedHashMap::new));
        List<String> problems = new ArrayList<>();
        for (AnnotatedTest test : annotated) {
            String where = test.file() + "#" + test.method() + ": ";
            if (!test.literalKeys()) {
                problems.add(where + "@BoundarySites keys must be string literals");
            }
            if (!test.isTest()) {
                problems.add(where + "@BoundarySites must be on a test method");
            }
            for (String key : test.keys()) {
                Row row = rowsByKey.get(key);
                if (row == null) {
                    problems.add(where + "no current classification row " + key);
                } else if (row.group() == null || !groups.get(row.group()).testRoots().contains(test.testRoot())) {
                    problems.add(where + key + " is a '" + row.disposition() + "' row, not a row of a group tested under " + test.testRoot());
                }
            }
        }
        System.out.println("[JsonBoundaryGateTest] " + annotated.size() + " @BoundarySites annotations read");
        problems.forEach(problem -> System.out.println("[JsonBoundaryGateTest] " + problem));
        assertThat(problems).isEmpty();
    }

    @Test
    void groupsOfDoneWorkPackagesHaveATestForEveryRow() {
        Set<String> done = WorkPackageStatus.done(root);
        System.out.println("[JsonBoundaryGateTest] WPs done: " + done);
        Map<String, Set<String>> claimed = new LinkedHashMap<>();
        for (AnnotatedTest test : annotated) {
            test.keys().forEach(key -> claimed.computeIfAbsent(key, k -> new TreeSet<>()).add(test.testRoot()));
        }
        List<String> failures = new ArrayList<>();
        for (Group group : groups.values()) {
            List<String> uncovered = rows.stream().filter(row -> group.name().equals(row.group()))
                    .filter(row -> claimed.getOrDefault(row.key(), Set.of()).stream().noneMatch(group.testRoots()::contains))
                    .map(Row::key).toList();
            boolean enforced = done.containsAll(group.wps());
            System.out.println("[JsonBoundaryGateTest] group " + group.name() + " " + group.wps() + (enforced ? " enforced" : " reported")
                    + ": " + uncovered.size() + " row(s) without a @BoundarySites test");
            if (enforced && !uncovered.isEmpty()) {
                failures.add(group.name() + ": " + uncovered);
            }
        }
        assertThat(failures).isEmpty();
    }

    @Test
    void annotationReaderSelfTest() {
        String source = String.join("\n",
                "class Sample {",
                "    @BoundarySites({\"a#M.m#toJson#1\", \"b#<file>#import#1\"})",
                "    @Test",
                "    void literalKeys() {}",
                "    @Test",
                "    @BoundarySites(\"c#M.n#fromJson#1\")",
                "    public void testAfterAnnotation() {}",
                "    @BoundarySites(KEYS)",
                "    @Test",
                "    void constantKeys() {}",
                "    @BoundarySites(value = \"d#M.o#toJson#1\")",
                "    void notATest() {}",
                "    // @BoundarySites(\"e#M.p#toJson#1\") @Test void commentedOut() {}",
                "}");
        List<AnnotatedTest> tests = JsonBoundaryClassification.annotatedTestsIn("Sample.java", "root", source);
        tests.forEach(test -> System.out.println("[JsonBoundaryGateTest] reader " + test));
        assertThat(tests).extracting(AnnotatedTest::method).containsExactly("literalKeys", "testAfterAnnotation", "constantKeys", "notATest");
        assertThat(tests.get(0).keys()).containsExactly("a#M.m#toJson#1", "b#<file>#import#1");
        assertThat(tests.get(3).keys()).containsExactly("d#M.o#toJson#1");
        assertThat(tests).extracting(AnnotatedTest::isTest).containsExactly(true, true, true, false);
        assertThat(tests).extracting(AnnotatedTest::literalKeys).containsExactly(true, true, false, true);
    }
}
