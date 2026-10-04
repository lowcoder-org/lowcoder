package org.lowcoder.api.contract.support;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.lowcoder.api.contract.support.JsonBoundaryClassification.Row;
import org.lowcoder.api.contract.support.JsonBoundaryScanner.Site;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Self-test of {@link JsonBoundaryScanner} and {@link JsonBoundaryClassification} (docs/API_PAYLOAD_TEST_PLAN.md §3.2,
 * §6.2, §8.1): the port reproduces the prototype's control output, its row keys survive a line shift, and each of the
 * prototype's six {@code selftest} breakages (plus the two rules the port adds) is reported. Nothing on disk changes.
 */
class JsonBoundaryScannerTest {

    private static final String CTL = "lowcoder-sdk/src/main/java/Ctl.java";
    private static final String UNLISTED_WRAPPER_BREAKAGE = "renderMustacheArrayJsonString";
    private static final String STALE_ROW = "lowcoder-sdk/src/main/java/Missing.java:1\ttoJson\tlog\t\tlowcoder-sdk/src/main/java/Missing.java#Missing.m#toJson#1";
    private static final String CORRUPT_DISPOSITION = "tested";
    private static final String ATTESTATION_EDIT = "\n// edited\n";
    private static final String SHIFT = "\n\n\n";

    private static Path root;
    private static List<String> classification;
    private static List<Site> scanned;
    private static Set<String> groupNames;

    @BeforeAll
    static void scan() {
        root = JsonBoundaryClassification.apiServiceRoot();
        classification = JsonBoundaryClassification.readLines(root, JsonBoundaryClassification.SITES_FILE);
        scanned = JsonBoundaryScanner.scanAll(root);
        groupNames = JsonBoundaryClassification.groups(root).keySet();
    }

    private static List<String> problems(String name, List<String> lines, Function<String, String> attest) {
        List<String> problems = JsonBoundaryClassification.problems(lines, scanned, groupNames, name, attest);
        System.out.println("[JsonBoundaryScannerTest] breakage '" + name + "': " + (problems.isEmpty() ? "NOT DETECTED" : problems.get(0)));
        return problems;
    }

    private static List<String> problems(String name, List<String> lines) {
        return problems(name, lines, path -> JsonBoundaryScanner.fileAttestation(root, path));
    }

    private static int firstRow(java.util.function.Predicate<Row> condition) {
        return JsonBoundaryClassification.rows(classification, "", new ArrayList<>()).stream().filter(condition)
                .findFirst().orElseThrow().number() - 1;
    }

    private static List<String> replaceColumn(int index, int column, String value) {
        List<String> lines = new ArrayList<>(classification);
        String[] columns = lines.get(index).split("\t", -1);
        columns[column] = value;
        lines.set(index, String.join("\t", columns));
        return lines;
    }

    @Test
    void controlScanMatchesThePrototypeControlOutput() {
        Path control = root.resolve(JsonBoundaryClassification.CONTROL_DIRECTORY);
        List<String> actual = JsonBoundaryScanner.listLines(control, JsonBoundaryClassification.CONTROL_SCOPE);
        actual.forEach(line -> System.out.println("[JsonBoundaryScannerTest] control " + line));
        assertThat(actual).isEqualTo(JsonBoundaryClassification.readLines(root, JsonBoundaryClassification.CONTROL_OUTPUT));
    }

    @Test
    void controlKeysNameTheEnclosingMember() {
        Map<String, String> keys = JsonBoundaryScanner.scan(root.resolve(JsonBoundaryClassification.CONTROL_DIRECTORY),
                JsonBoundaryClassification.CONTROL_SCOPE).sites().stream().collect(Collectors.toMap(Site::location, Site::key));
        assertThat(keys).containsEntry(CTL + ":4 readTree", CTL + "#Ctl.a#readTree#1")
                .containsEntry(CTL + ":7 fromJson", CTL + "#Ctl.b#fromJson#1")
                .containsEntry(CTL + ":9 ::fromJsonNode", CTL + "#Ctl.f#::fromJsonNode#1")
                .containsEntry(CTL + ":10 new ObjectMapper", CTL + "#Ctl.m#new ObjectMapper#1")
                .containsEntry(CTL + ":17 jackson2JsonEncoder", CTL + "#CtlCodecs.configure#jackson2JsonEncoder#1")
                .containsEntry("lowcoder-sdk/src/main/java/Wrap.java:7 toJson", "lowcoder-sdk/src/main/java/Wrap.java#Wrap.hidden#toJson#1")
                .containsEntry("lowcoder-sdk/src/main/java/TreeText.java:0 import", "lowcoder-sdk/src/main/java/TreeText.java#<file>#import#1");
    }

    @Test
    void keysSurviveALineShiftThatLocationsDoNot(@TempDir Path copy) throws IOException {
        Path control = root.resolve(JsonBoundaryClassification.CONTROL_DIRECTORY);
        try (Stream<Path> files = Files.walk(control)) {
            for (Path file : files.filter(Files::isRegularFile).toList()) {
                Path target = copy.resolve(control.relativize(file).toString());
                Files.createDirectories(target.getParent());
                Files.writeString(target, SHIFT + Files.readString(file, StandardCharsets.UTF_8), StandardCharsets.UTF_8);
            }
        }
        List<Site> original = JsonBoundaryScanner.scan(control, JsonBoundaryClassification.CONTROL_SCOPE).sites();
        List<Site> shifted = JsonBoundaryScanner.scan(copy, JsonBoundaryClassification.CONTROL_SCOPE).sites();
        assertThat(shifted).extracting(Site::key).isEqualTo(original.stream().map(Site::key).toList());
        assertThat(shifted).extracting(Site::location).doesNotContainAnyElementsOf(
                original.stream().filter(site -> site.line() > 0).map(Site::location).toList());
    }

    @Test
    void sitesThatOnlyMovedLinesStillMatchTheClassification() {
        List<Site> shifted = scanned.stream().map(site -> new Site(site.path(), site.line() == 0 ? 0 : site.line() + SHIFT.length(),
                site.kind(), site.callee(), site.member(), site.ordinal())).toList();
        assertThat(JsonBoundaryClassification.problems(classification, shifted, groupNames, "shifted",
                path -> JsonBoundaryScanner.fileAttestation(root, path))).isEmpty();
    }

    @Test
    void realClassificationHasNoProblemAndUniqueKeys() {
        assertThat(problems("none", classification)).isEmpty();
        assertThat(scanned).extracting(Site::key).doesNotHaveDuplicates();
    }

    @Test
    void droppedRowIsReported() {
        int first = firstRow(row -> true);
        List<String> lines = new ArrayList<>(classification);
        lines.remove(first);
        assertThat(problems("drop a row", lines)).anySatisfy(problem -> assertThat(problem).startsWith("unclassified site: "));
    }

    @Test
    void staleRowIsReported() {
        List<String> lines = new ArrayList<>(classification);
        lines.add(STALE_ROW);
        assertThat(problems("add a stale row", lines)).anySatisfy(problem -> assertThat(problem).startsWith("stale classification row: "));
    }

    @Test
    void corruptDispositionIsReported() {
        assertThat(problems("corrupt a disposition", replaceColumn(firstRow(row -> true), 2, CORRUPT_DISPOSITION)))
                .anySatisfy(problem -> assertThat(problem).contains("unknown disposition 'tested'"));
    }

    @Test
    void blankReasonIsReported() {
        int index = firstRow(row -> JsonBoundaryClassification.REASON_REQUIRED.stream().anyMatch(row.disposition()::startsWith));
        assertThat(problems("blank a reason", replaceColumn(index, 3, "")))
                .anySatisfy(problem -> assertThat(problem).contains("needs a reason in the note column"));
    }

    @Test
    void editedAttestedFileIsReported() {
        Row attested = JsonBoundaryClassification.rows(classification, "", new ArrayList<>()).stream()
                .filter(row -> row.callee().equals(JsonBoundaryScanner.IMPORT_CALLEE)).findFirst().orElseThrow();
        String path = attested.path();
        Function<String, String> edited = file -> file.equals(path)
                ? JsonBoundaryScanner.attestation(readFile(file) + ATTESTATION_EDIT) : JsonBoundaryScanner.fileAttestation(root, file);
        assertThat(problems("edit an attested file", classification, edited))
                .anySatisfy(problem -> assertThat(problem).contains("attestation out of date, re-review " + path));
    }

    @Test
    void unlistedWrapperIsReported() {
        List<String> wrappers = JsonBoundaryScanner.KINDS.get(JsonBoundaryScanner.WRAPPER_KIND).stream()
                .filter(wrapper -> !wrapper.equals(UNLISTED_WRAPPER_BREAKAGE)).toList();
        List<String> problems = JsonBoundaryScanner.wrapperProblems(root, wrappers);
        System.out.println("[JsonBoundaryScannerTest] breakage 'unlist a wrapper': " + problems);
        assertThat(problems).anySatisfy(problem -> assertThat(problem).startsWith("unlisted wrapper ").endsWith(" " + UNLISTED_WRAPPER_BREAKAGE));
        assertThat(JsonBoundaryScanner.wrapperProblems(root, JsonBoundaryScanner.KINDS.get(JsonBoundaryScanner.WRAPPER_KIND))).isEmpty();
    }

    @Test
    void keysSwappedBetweenRowsAreReported() {
        List<Row> rows = JsonBoundaryClassification.rows(classification, "", new ArrayList<>());
        Row first = rows.stream().filter(row -> row.line() > 0 && rows.stream().anyMatch(other -> other.path().equals(row.path())
                && other.callee().equals(row.callee()) && other.line() > row.line())).findFirst().orElseThrow();
        Row second = rows.stream().filter(row -> row.path().equals(first.path()) && row.callee().equals(first.callee())
                && row.line() > first.line()).findFirst().orElseThrow();
        System.out.println("[JsonBoundaryScannerTest] swapping the keys of " + first.location() + " and " + second.location());
        List<String> lines = replaceColumn(first.number() - 1, 4, second.key());
        String[] columns = lines.get(second.number() - 1).split("\t", -1);
        columns[4] = first.key();
        lines.set(second.number() - 1, String.join("\t", columns));
        assertThat(problems("swap two keys", lines)).anySatisfy(problem -> assertThat(problem).contains("not in the order of their sites"));
    }

    @Test
    void keyOfAnotherCalleeIsReported() {
        List<Row> rows = JsonBoundaryClassification.rows(classification, "", new ArrayList<>());
        Row row = rows.stream().filter(candidate -> rows.stream().anyMatch(other -> other.path().equals(candidate.path())
                && !other.callee().equals(candidate.callee()))).findFirst().orElseThrow();
        Row other = rows.stream().filter(candidate -> candidate.path().equals(row.path()) && !candidate.callee().equals(row.callee()))
                .findFirst().orElseThrow();
        List<String> lines = replaceColumn(row.number() - 1, 1, other.callee());
        assertThat(problems("callee of another row", lines)).anySatisfy(problem -> assertThat(problem).contains("is the key of"));
    }

    @Test
    void unknownGroupAndDuplicateKeyAreReported() {
        int testRow = firstRow(row -> row.group() != null);
        assertThat(problems("unknown group", replaceColumn(testRow, 2, "test:no-such-group")))
                .anySatisfy(problem -> assertThat(problem).contains("group 'no-such-group' is not in"));
        List<String> duplicated = new ArrayList<>(classification);
        duplicated.add(classification.get(testRow));
        assertThat(problems("duplicate a row", duplicated)).anySatisfy(problem -> assertThat(problem).contains("duplicate key"));
    }

    private static String readFile(String relative) {
        try {
            return Files.readString(root.resolve(relative), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new java.io.UncheckedIOException(e);
        }
    }
}
