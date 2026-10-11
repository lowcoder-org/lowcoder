package org.lowcoder.api.contract.support;

import org.lowcoder.api.contract.support.JsonBoundaryScanner.Site;
import org.lowcoder.sdk.contract.GoldenJson;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * The classification of the JSON boundary sites ({@code lowcoder-server/src/test/resources/json-contract/boundary-sites/json-boundary-sites.tsv}) and its test groups
 * ({@code lowcoder-server/src/test/resources/json-contract/boundary-sites/json-boundary-groups.tsv}), and the prototype's {@code check} rules applied by stable key
 * (docs/API_PAYLOAD_TEST_PLAN.md §4.10, §6.2).
 *
 * <p>Rules, as in {@code docs/tools/json_boundary_sites.py}: every scanned site has a row and every row a scanned site;
 * dispositions are {@link #DISPOSITIONS}; {@link #REASON_REQUIRED} rows have a note; a file-level row's note starts
 * with the file's current attestation token. Added here: rows have {@link #COLUMNS} columns, keys are unique, a
 * {@code test:<group>} disposition names a group of the groups file, a row's path and callee are those of its key's
 * site, and per file the rows ordered by line name the sites in source order. Line numbers themselves are not
 * compared: the prototype checks them, and the gate is meant not to fail on edits that only shift lines. Limit: two
 * rows of one line swapping keys with the same callee keep their order and are not caught.
 */
public final class JsonBoundaryClassification {

    public static final String SITES_FILE = "lowcoder-server/src/test/resources/json-contract/boundary-sites/json-boundary-sites.tsv";
    public static final String GROUPS_FILE = "lowcoder-server/src/test/resources/json-contract/boundary-sites/json-boundary-groups.tsv";
    public static final String CONTROL_DIRECTORY = "lowcoder-server/src/test/resources/json-contract/boundary-sites/json_boundary_control";
    public static final String CONTROL_OUTPUT = "lowcoder-server/src/test/resources/json-contract/boundary-sites/json-boundary-control.out";
    public static final String CONTROL_SCOPE = "layer-c";
    public static final List<String> DISPOSITIONS = List.of("test", "log", "not-jackson", "unreachable", "tree-only");
    public static final List<String> REASON_REQUIRED = List.of("not-jackson", "unreachable", "tree-only");
    public static final String TEST_DISPOSITION = "test";
    public static final int COLUMNS = 5;
    private static final String COLUMN_SEPARATOR = "\t";
    private static final String LIST_SEPARATOR = ",";
    private static final String COMMENT = "#";
    private static final String DISPOSITION_SEPARATOR = ":";
    private static final String ATTESTATION_END = ";";

    public static final List<String> TEST_ROOT_PATTERNS = List.of("lowcoder-*/src/test/java", "lowcoder-plugins/*/src/test/java");
    private static final Pattern ANNOTATION = Pattern.compile(
            "@(?:org\\.lowcoder\\.sdk\\.contract\\.)?BoundarySites\\s*\\(([^)]*)\\)");
    private static final Pattern VALUE_NAME = Pattern.compile("^\\s*value\\s*=");
    private static final Pattern STRING_LITERAL = Pattern.compile("\"([^\"\\\\]*+(?:\\\\.[^\"\\\\]*+)*+)\"");
    private static final Pattern LIST_PUNCTUATION = Pattern.compile("[{},\\s]");
    private static final Pattern FOLLOWING_METHOD = Pattern.compile(
            "(?:\\s*@[\\w.]+(?:\\s*\\([^)]*\\))?)*\\s*(?:(?:public|protected|private|static|final)\\s+)*void\\s+(\\w+)\\s*\\(");
    private static final Pattern TEST_ANNOTATION = Pattern.compile("@(?:[\\w]+\\.)*(?:Test|ParameterizedTest|RepeatedTest)\\b");
    private static final String JAVA_SUFFIX = ".java";

    private JsonBoundaryClassification() {
    }

    /** {@code server/api-service}: the parent of the module directory that surefire and failsafe pass as {@code basedir}. */
    public static Path apiServiceRoot() {
        return Path.of(System.getProperty(GoldenJson.BASEDIR_PROPERTY, System.getProperty(GoldenJson.WORKING_DIRECTORY_PROPERTY)))
                .toAbsolutePath().getParent();
    }

    /**
     * One {@code @BoundarySites} annotation found in a test source: its file and test root (relative to
     * {@code server/api-service}), the annotated method, whether that method is a test, and the keys.
     * {@code literalKeys} is false when the value is not a list of string literals (then {@code keys} holds the
     * literals that were found).
     */
    public record AnnotatedTest(String file, String testRoot, String method, boolean isTest, List<String> keys, boolean literalKeys) {
    }

    /** Every {@code @BoundarySites} of every test source under the test roots of {@link #TEST_ROOT_PATTERNS}. */
    public static List<AnnotatedTest> annotatedTests(Path root) {
        List<AnnotatedTest> tests = new ArrayList<>();
        for (String testRoot : testRoots(root)) {
            try (Stream<Path> walk = Files.walk(root.resolve(testRoot))) {
                for (Path file : walk.filter(path -> path.toString().endsWith(JAVA_SUFFIX)).sorted().toList()) {
                    String source = Files.readString(file, StandardCharsets.UTF_8);
                    tests.addAll(annotatedTestsIn(root.relativize(file).toString().replace('\\', '/'), testRoot, source));
                }
            } catch (IOException e) {
                throw new UncheckedIOException("cannot read test sources under " + testRoot, e);
            }
        }
        return tests;
    }

    /** The test source roots that exist, relative to {@code root}; a {@code *} in a segment matches any text there. */
    public static List<String> testRoots(Path root) {
        Set<String> roots = new TreeSet<>();
        for (String pattern : TEST_ROOT_PATTERNS) {
            List<String> candidates = List.of("");
            for (String segment : pattern.split("/")) {
                List<String> next = new ArrayList<>();
                Pattern segmentPattern = Pattern.compile(Pattern.quote(segment).replace("*", "\\E[^/]*\\Q"));
                for (String candidate : candidates) {
                    Path directory = root.resolve(candidate);
                    if (!Files.isDirectory(directory)) {
                        continue;
                    }
                    try (Stream<Path> children = Files.list(directory)) {
                        children.filter(Files::isDirectory)
                                .map(child -> child.getFileName().toString())
                                .filter(name -> segmentPattern.matcher(name).matches())
                                .forEach(name -> next.add(candidate.isEmpty() ? name : candidate + "/" + name));
                    } catch (IOException e) {
                        throw new UncheckedIOException("cannot list " + directory, e);
                    }
                }
                candidates = next;
            }
            roots.addAll(candidates);
        }
        return List.copyOf(roots);
    }

    /** The {@code @BoundarySites} annotations of one source file (comments and text inside literals are ignored). */
    public static List<AnnotatedTest> annotatedTestsIn(String file, String testRoot, String source) {
        // annotations and methods are found with comments and literals blanked; keys are read from the same offsets
        // of the source with only comments blanked, so that text inside string literals is never taken for code
        String code = JsonBoundaryScanner.blankNonCode(source);
        String withLiterals = JsonBoundaryScanner.blankComments(source);
        List<AnnotatedTest> tests = new ArrayList<>();
        Matcher annotation = ANNOTATION.matcher(code);
        while (annotation.find()) {
            String value = VALUE_NAME.matcher(withLiterals.substring(annotation.start(1), annotation.end(1))).replaceFirst("");
            List<String> keys = new ArrayList<>();
            Matcher literal = STRING_LITERAL.matcher(value);
            while (literal.find()) {
                keys.add(literal.group(1));
            }
            boolean literalKeys = !keys.isEmpty()
                    && LIST_PUNCTUATION.matcher(STRING_LITERAL.matcher(value).replaceAll("")).replaceAll("").isEmpty();
            int statementStart = Math.max(Math.max(code.lastIndexOf(';', annotation.start()), code.lastIndexOf('}', annotation.start())),
                    code.lastIndexOf('{', annotation.start())) + 1;
            Matcher method = FOLLOWING_METHOD.matcher(code);
            method.region(annotation.end(), code.length());
            boolean found = method.lookingAt();
            String annotations = code.substring(statementStart, annotation.start()) + (found ? code.substring(annotation.end(), method.end()) : "");
            tests.add(new AnnotatedTest(file, testRoot, found ? method.group(1) : null,
                    found && TEST_ANNOTATION.matcher(annotations).find(), List.copyOf(keys), literalKeys));
        }
        return tests;
    }

    /** One classification row; {@code number} is its line in the file. */
    public record Row(int number, String location, String callee, String disposition, String note, String key) {

        /** The group of a {@code test:<group>} row, or {@code null}. */
        public String group() {
            String[] parts = disposition.split(DISPOSITION_SEPARATOR, 2);
            return parts[0].equals(TEST_DISPOSITION) && parts.length == 2 ? parts[1] : null;
        }

        String path() {
            return location.substring(0, location.lastIndexOf(':'));
        }

        /** The line of the location column; the prototype checks it, the gate only compares line order. */
        int line() {
            return Integer.parseInt(location.substring(location.lastIndexOf(':') + 1));
        }
    }

    /** One test group: its owning WPs and the test source roots (relative to {@code server/api-service}). */
    public record Group(String name, List<String> wps, List<String> testRoots) {
    }

    public static List<String> readLines(Path root, String relative) {
        try {
            return Files.readAllLines(root.resolve(relative), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("cannot read " + root.resolve(relative), e);
        }
    }

    /** The data rows of {@code lines}; a row with the wrong column count is reported and skipped. */
    public static List<Row> rows(List<String> lines, String sourceName, List<String> problems) {
        List<Row> rows = new ArrayList<>();
        for (int i = 0; i < lines.size(); i++) {
            String line = lines.get(i);
            if (line.isBlank() || line.startsWith(COMMENT)) {
                continue;
            }
            String[] columns = line.split(COLUMN_SEPARATOR, -1);
            if (columns.length != COLUMNS) {
                problems.add(sourceName + ":" + (i + 1) + ": expected " + COLUMNS + " tab-separated columns, got " + columns.length);
                continue;
            }
            rows.add(new Row(i + 1, columns[0], columns[1], columns[2], columns[3], columns[4]));
        }
        return rows;
    }

    /** The groups of {@value #GROUPS_FILE}, by name, in file order. */
    public static Map<String, Group> groups(Path root) {
        Map<String, Group> groups = new LinkedHashMap<>();
        for (String line : readLines(root, GROUPS_FILE)) {
            if (line.isBlank() || line.startsWith(COMMENT)) {
                continue;
            }
            String[] columns = line.split(COLUMN_SEPARATOR, -1);
            if (columns.length != 3) {
                throw new IllegalStateException(GROUPS_FILE + ": expected 3 tab-separated columns: " + line);
            }
            groups.put(columns[0], new Group(columns[0], List.of(columns[1].split(LIST_SEPARATOR)), List.of(columns[2].split(LIST_SEPARATOR))));
        }
        return groups;
    }

    /**
     * Every problem of the classification {@code lines} against {@code scanned}. {@code attest} gives the current
     * attestation token of a file path (relative to {@code server/api-service}).
     */
    public static List<String> problems(List<String> lines, List<Site> scanned, Set<String> groupNames, String sourceName,
            Function<String, String> attest) {
        List<String> problems = new ArrayList<>();
        List<Row> rows = rows(lines, sourceName, problems);
        Map<String, Site> sitesByKey = JsonBoundaryScanner.index(scanned, Site::key);
        Set<String> rowKeys = new HashSet<>();
        for (Row row : rows) {
            String where = sourceName + ":" + row.number() + ": ";
            if (!rowKeys.add(row.key())) {
                problems.add(where + "duplicate key " + row.key());
            }
            if (!DISPOSITIONS.contains(row.disposition().split(DISPOSITION_SEPARATOR, 2)[0])) {
                problems.add(where + "unknown disposition '" + row.disposition() + "'");
            }
            if (REASON_REQUIRED.stream().anyMatch(row.disposition()::startsWith) && row.note().isBlank()) {
                problems.add(where + row.disposition() + " needs a reason in the note column");
            }
            if (row.group() != null && !groupNames.contains(row.group())) {
                problems.add(where + "group '" + row.group() + "' is not in " + GROUPS_FILE);
            }
            Site site = sitesByKey.get(row.key());
            if (site != null && (!site.path().equals(row.path()) || !site.callee().equals(row.callee()))) {
                problems.add(where + row.key() + " is the key of " + site.path() + " " + site.callee() + ", not of "
                        + row.path() + " " + row.callee());
            }
            if (site != null && site.line() == 0 && JsonBoundaryScanner.IMPORT_CALLEE.equals(site.callee())) {
                String expected = attest.apply(site.path());
                if (!row.note().startsWith(expected + ATTESTATION_END)) {
                    problems.add(where + "attestation out of date, re-review " + site.path() + " and start the note with '"
                            + expected + ATTESTATION_END + "'");
                }
            }
        }
        for (Site site : scanned) {
            if (!rowKeys.contains(site.key())) {
                problems.add("unclassified site: " + site.location() + " (add the row: " + site.path() + ":" + site.line()
                        + COLUMN_SEPARATOR + site.callee() + COLUMN_SEPARATOR + "<disposition>" + COLUMN_SEPARATOR + "<note>"
                        + COLUMN_SEPARATOR + site.key() + ")");
            }
        }
        rows.stream().filter(row -> !sitesByKey.containsKey(row.key()))
                .forEach(row -> problems.add("stale classification row: " + row.key()));
        problems.addAll(orderProblems(rows, scanned));
        return problems;
    }

    /**
     * Per file, the rows ordered by their line must name the file's sites in source order: the n-th distinct line of
     * the rows holds the keys of the sites on the n-th distinct line of the scan (file rows, line 0, last). This ties
     * each key to its row without comparing line numbers, so a line shift passes and keys moved between rows fail.
     * A file whose rows and sites differ in their number of lines is skipped: the unclassified or stale rows are
     * reported already.
     */
    private static List<String> orderProblems(List<Row> rows, List<Site> scanned) {
        Map<String, TreeMap<Integer, Set<String>>> rowLines = new LinkedHashMap<>();
        for (Row row : rows) {
            rowLines.computeIfAbsent(row.path(), path -> new TreeMap<>())
                    .computeIfAbsent(lineOrder(row.line()), line -> new TreeSet<>()).add(row.key());
        }
        Map<String, TreeMap<Integer, Set<String>>> siteLines = new LinkedHashMap<>();
        for (Site site : scanned) {
            siteLines.computeIfAbsent(site.path(), path -> new TreeMap<>())
                    .computeIfAbsent(lineOrder(site.line()), line -> new TreeSet<>()).add(site.key());
        }
        List<String> problems = new ArrayList<>();
        rowLines.forEach((path, byLine) -> {
            TreeMap<Integer, Set<String>> sites = siteLines.get(path);
            if (sites == null || sites.size() != byLine.size()) {
                return;
            }
            List<Set<String>> expected = new ArrayList<>(sites.values());
            List<Set<String>> actual = new ArrayList<>(byLine.values());
            if (!expected.equals(actual)) {
                problems.add("rows of " + path + " are not in the order of their sites: by line, the rows hold " + actual
                        + " where the source has " + expected);
            }
        });
        return problems;
    }

    private static int lineOrder(int line) {
        return line == 0 ? Integer.MAX_VALUE : line;
    }

    /** The prototype's summary line: scanned sites, rows, and rows per disposition. */
    public static String summary(List<String> lines, List<Site> scanned) {
        List<Row> rows = rows(lines, SITES_FILE, new ArrayList<>());
        Set<String> keys = scanned.stream().map(Site::key).collect(Collectors.toSet());
        Map<String, Long> counts = rows.stream().filter(row -> keys.contains(row.key()))
                .collect(Collectors.groupingBy(row -> row.disposition().split(DISPOSITION_SEPARATOR, 2)[0], Collectors.counting()));
        return "# " + scanned.size() + " sites scanned, " + rows.size() + " rows; " + DISPOSITIONS.stream()
                .map(disposition -> disposition + " " + counts.getOrDefault(disposition, 0L)).collect(Collectors.joining(", "));
    }
}
