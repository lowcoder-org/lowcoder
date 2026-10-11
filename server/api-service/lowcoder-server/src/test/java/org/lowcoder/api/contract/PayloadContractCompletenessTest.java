package org.lowcoder.api.contract;

import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.ContractRegistry;
import org.lowcoder.api.contract.support.ContractRegistry.Row;
import org.lowcoder.api.contract.support.ContractSources;
import org.lowcoder.api.contract.support.ContractSources.ControllerMethod;
import org.lowcoder.api.contract.support.JsonBoundaryClassification;
import org.lowcoder.api.contract.support.PayloadTypeWalker;
import org.lowcoder.api.contract.support.PayloadTypeWalker.Closure;
import org.lowcoder.api.contract.support.PayloadTypeWalker.Endpoint;
import org.lowcoder.api.contract.support.PayloadTypeWalker.PayloadType;
import org.lowcoder.api.contract.support.PayloadTypeWalker.Property;
import org.lowcoder.api.contract.support.WorkPackageStatus;
import org.lowcoder.sdk.contract.JacksonAnnotationGuard;
import org.lowcoder.sdk.util.JsonUtils;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * {@code PayloadContractCompletenessTest} of docs/API_PAYLOAD_TEST_PLAN.md §6.1. Each test is one rule; a finding is
 * filed under the WP it belongs to. Rules 6 and 7, the registry's shape (parsable rows, one row per endpoint, level, WP
 * and planned test class) and the reasons of {@code EXCLUDED_TYPES} fail the build always ({@value #ALWAYS}). Rules 1,
 * 3, 4, 8 and 9, and the per-endpoint part of rule 2, fail only for WPs in {@code wp-status.json}; the others are
 * reported. Rule 5 fails always: a fixture that belongs to no
 * type has no WP that could own it. Rule 9 is the WP10 gate of plan §10: every query-result producer site has a test
 * that pins its value, and the server's {@code QueryResultView} test exists; the shape of its file fails always. Every finding is written to {@value ContractRegistry#REPORT_FILE}, one section per
 * WP; a WP may be marked done only when its section is empty.
 */
class PayloadContractCompletenessTest {

    static final String ALWAYS = "always";
    private static final Pattern UNTYPED_ROOT_SUFFIX = Pattern.compile("(?:\\[\\]|\\{key\\})*");
    private static final Pattern FIXTURE_NAME = Pattern.compile("(.+)\\.([A-Za-z0-9']+)\\.json");
    private static final String SERIALIZED_CASE = "S1";
    private static final String DESERIALIZED_CASE = "D1";
    private static final String JSON_BODY = "json";
    private static final String ROUTES_FIELD = "routes";
    private static final Set<String> ROUTE_BODIES = Set.of(JSON_BODY, "bytes");

    private record Finding(String wp, int rule, String text) {
    }

    private static Path root;
    private static Closure closure;
    private static List<Row> registry;
    private static List<String> registryProblems;
    private static Set<String> done;
    private static Map<String, String> typeOwners;
    private static Map<String, String> extraRootOwners;
    private static final List<Finding> findings = new ArrayList<>();

    @BeforeAll
    static void load() {
        root = JsonBoundaryClassification.apiServiceRoot();
        closure = PayloadTypeWalker.walkCompiledApi();
        registryProblems = new ArrayList<>();
        registry = ContractRegistry.read(root, registryProblems);
        done = WorkPackageStatus.done(root);
        typeOwners = ContractRegistry.typeOwners(closure);
        extraRootOwners = new TreeMap<>();
        registry.forEach(row -> row.concreteTypes().stream().filter(type -> !typeOwners.containsKey(type))
                .forEach(type -> extraRootOwners.putIfAbsent(type, row.wp())));
        System.out.println("[completeness] WPs done: " + done + "; " + closure.endpoints().size() + " endpoints, "
                + registry.size() + " registry rows, " + typeOwners.size() + " closure types, " + extraRootOwners.size() + " extra roots");
    }

    @AfterAll
    static void writeReport() throws IOException {
        Map<String, List<Finding>> byWp = new TreeMap<>(findings.stream().collect(Collectors.groupingBy(Finding::wp)));
        StringBuilder report = new StringBuilder("# Payload contract completeness (docs/API_PAYLOAD_TEST_PLAN.md §6.1)\n\n")
                .append("WPs done: ").append(done).append("\n");
        for (String wp : Stream.concat(Stream.of(ALWAYS), Stream.iterate(0, i -> i <= 10, i -> i + 1).map(i -> "WP" + i)).toList()) {
            List<Finding> section = byWp.getOrDefault(wp, List.of());
            report.append("\n## ").append(wp).append(enforced(wp) ? " (enforced)" : " (reported)").append(": ")
                    .append(section.size()).append(" finding(s)\n");
            section.forEach(finding -> report.append("- rule ").append(finding.rule()).append(": ").append(finding.text()).append('\n'));
        }
        Path file = root.resolve(ContractRegistry.REPORT_FILE);
        Files.createDirectories(file.getParent());
        Files.writeString(file, report.toString(), StandardCharsets.UTF_8);
        System.out.println("[completeness] report written to " + file + "; findings per section: "
                + byWp.entrySet().stream().map(e -> e.getKey() + "=" + e.getValue().size()).collect(Collectors.joining(", ")));
    }

    private static boolean enforced(String wp) {
        return ALWAYS.equals(wp) || done.contains(wp);
    }

    /** Files the findings and fails on the enforced ones. */
    private static void file(int rule, List<Finding> ruleFindings) {
        findings.addAll(ruleFindings);
        List<Finding> enforcedFindings = ruleFindings.stream().filter(finding -> enforced(finding.wp())).toList();
        System.out.println("[completeness] rule " + rule + ": " + ruleFindings.size() + " finding(s), " + enforcedFindings.size() + " enforced");
        enforcedFindings.forEach(finding -> System.out.println("[completeness]   " + finding));
        assertThat(enforcedFindings).as("rule " + rule + " findings of enforced WPs").isEmpty();
    }

    private static Set<String> untypedRootEndpoints() {
        return closure.untypedPayloads().stream()
                .filter(u -> u.path().startsWith(u.endpoint())
                        && UNTYPED_ROOT_SUFFIX.matcher(u.path().substring(u.endpoint().length())).matches())
                .map(PayloadTypeWalker.UntypedPayload::endpoint).collect(Collectors.toCollection(TreeSet::new));
    }

    private static Map<String, List<Path>> fixturesByType() {
        Path directory = root.resolve(ContractRegistry.TYPE_FIXTURES);
        Map<String, List<Path>> fixtures = new TreeMap<>();
        if (!Files.isDirectory(directory)) {
            return fixtures;
        }
        try (Stream<Path> files = Files.list(directory)) {
            files.filter(Files::isRegularFile).forEach(file -> {
                Matcher name = FIXTURE_NAME.matcher(file.getFileName().toString());
                fixtures.computeIfAbsent(name.matches() ? name.group(1) : file.getFileName().toString(), k -> new ArrayList<>()).add(file);
            });
        } catch (IOException e) {
            throw new UncheckedIOException("cannot list " + directory, e);
        }
        return fixtures;
    }

    private static String ownerOf(String type) {
        return typeOwners.getOrDefault(type, extraRootOwners.get(type));
    }

    @Test
    void rule1EveryTypeHasAFixtureOrAnExclusion() {
        Map<String, List<Path>> fixtures = fixturesByType();
        List<Finding> ruleFindings = new ArrayList<>();
        ContractRegistry.EXCLUDED_TYPES.forEach((type, reason) -> {
            if (reason.isBlank()) {
                ruleFindings.add(new Finding(ALWAYS, 1, "EXCLUDED_TYPES entry " + type + " has no reason"));
            }
        });
        Stream.concat(typeOwners.keySet().stream(), extraRootOwners.keySet().stream())
                .filter(type -> !ContractRegistry.EXCLUDED_TYPES.containsKey(type) && !fixtures.containsKey(type))
                .forEach(type -> ruleFindings.add(new Finding(ownerOf(type), 1, type + " has no fixture under " + ContractRegistry.TYPE_FIXTURES)));
        file(1, ruleFindings);
    }

    @Test
    void rule2EveryEndpointHasARegistryRow() {
        List<Finding> always = new ArrayList<>();
        registryProblems.forEach(problem -> always.add(new Finding(ALWAYS, 2, problem)));
        Map<String, List<Row>> rowsByEndpoint = registry.stream().collect(Collectors.groupingBy(Row::endpoint, LinkedHashMap::new, Collectors.toList()));
        Set<String> endpointKeys = closure.endpoints().stream().map(Endpoint::key).collect(Collectors.toCollection(TreeSet::new));
        endpointKeys.stream().filter(key -> !rowsByEndpoint.containsKey(key))
                .forEach(key -> always.add(new Finding(ALWAYS, 2, "endpoint without a registry row: " + key)));
        rowsByEndpoint.forEach((key, rows) -> {
            if (!endpointKeys.contains(key)) {
                always.add(new Finding(ALWAYS, 2, ContractRegistry.FILE + ":" + rows.get(0).number() + ": stale row " + key));
            }
            if (rows.size() > 1) {
                always.add(new Finding(ALWAYS, 2, "endpoint with " + rows.size() + " registry rows: " + key));
            }
        });
        for (Row row : registry) {
            String where = ContractRegistry.FILE + ":" + row.number() + ": ";
            if (!ContractRegistry.LEVELS.contains(row.level())) {
                always.add(new Finding(ALWAYS, 2, where + "unknown level '" + row.level() + "'"));
            }
            if (ContractRegistry.DECODE_ONLY_LEVEL.equals(row.level()) && row.reason().isBlank()) {
                always.add(new Finding(ALWAYS, 2, where + "a decode-only row needs its §1.3 reason"));
            }
            if (!ContractRegistry.wpOf(row.endpoint()).equals(row.wp())) {
                always.add(new Finding(ALWAYS, 2, where + "wp is " + row.wp() + ", the declaration's is " + ContractRegistry.wpOf(row.endpoint())));
            }
            if (!ContractRegistry.plannedTestClass(row.endpoint()).equals(row.test())) {
                always.add(new Finding(ALWAYS, 2, where + "test is " + row.test() + ", expected " + ContractRegistry.plannedTestClass(row.endpoint())));
            }
        }
        List<Finding> perWp = new ArrayList<>(always);
        for (Row row : registry) {
            if (!testClassExists(row.test())) {
                perWp.add(new Finding(row.wp(), 2, row.endpoint() + ": test class " + row.test() + " does not exist"));
            }
            if (!ContractRegistry.GROUPS.contains(row.group())) {
                perWp.add(new Finding(row.wp(), 2, row.endpoint() + ": no stubbing group (" + ContractRegistry.GROUPS + ")"));
            }
        }
        file(2, perWp);
    }

    @Test
    void rule3UntypedRootsHaveConcreteTypes() {
        Map<String, Row> rows = registry.stream().collect(Collectors.toMap(Row::endpoint, row -> row, (a, b) -> a));
        Set<String> untyped = untypedRootEndpoints();
        System.out.println("[completeness] " + untyped.size() + " endpoints with untyped roots (plan Appendix A: 31)");
        List<Finding> ruleFindings = new ArrayList<>();
        for (String endpoint : untyped) {
            Row row = rows.get(endpoint);
            if (row == null) {
                continue;
            }
            if (row.concreteTypes().isEmpty() && !ContractRegistry.DYNAMIC_ROOTS.containsKey(endpoint)) {
                ruleFindings.add(new Finding(row.wp(), 3, endpoint + ": untyped root without concrete types"));
            }
        }
        ContractRegistry.DYNAMIC_ROOTS.forEach((endpoint, reason) -> {
            Row row = rows.get(endpoint);
            if (reason.isBlank() || row == null || !untyped.contains(endpoint) || !row.concreteTypes().isEmpty()) {
                ruleFindings.add(new Finding(ALWAYS, 3, "DYNAMIC_ROOTS entry " + endpoint
                        + " must have a reason and name an untyped root of a registry row without concrete types"));
            }
        });
        for (Row row : registry) {
            row.concreteTypes().stream().filter(type -> !classExists(type))
                    .forEach(type -> ruleFindings.add(new Finding(row.wp(), 3, row.endpoint() + ": concrete type " + type + " is not a class")));
        }
        file(3, ruleFindings);
    }

    @Test
    void rule4FixturePropertyNamesMatchTheWalker() {
        List<Finding> ruleFindings = new ArrayList<>();
        fixturesByType().forEach((type, files) -> {
            String owner = ownerOf(type);
            if (owner == null || !classExists(type)) {
                return;
            }
            JavaType javaType = JsonUtils.getObjectMapper().constructType(load(type));
            if (javaType.isMapLikeType() || javaType.isCollectionLikeType()) {
                System.out.println("[completeness] rule 4 skips " + type + ": a map or collection type has no properties, its keys are data");
                return;
            }
            PayloadType described = closure.types().containsKey(type) ? closure.types().get(type) : PayloadTypeWalker.describe(load(type));
            for (Path file : files) {
                Matcher name = FIXTURE_NAME.matcher(file.getFileName().toString());
                String fixtureCase = name.matches() ? name.group(2) : "";
                List<Property> expected = SERIALIZED_CASE.equals(fixtureCase) ? described.serializedProperties()
                        : DESERIALIZED_CASE.equals(fixtureCase) ? described.deserializedProperties() : null;
                if (expected == null) {
                    continue;
                }
                Set<String> expectedNames = expected.stream().map(Property::name).collect(Collectors.toCollection(TreeSet::new));
                Set<String> actualNames = topLevelNames(file);
                if (!expectedNames.equals(actualNames)) {
                    ruleFindings.add(new Finding(owner, 4, file.getFileName() + ": property names " + actualNames
                            + " differ from the walker's " + expectedNames));
                }
            }
        });
        file(4, ruleFindings);
    }

    @Test
    void rule5EveryFixtureBelongsToAType() {
        List<Finding> ruleFindings = new ArrayList<>();
        fixturesByType().forEach((type, files) -> {
            if (ownerOf(type) == null && !ContractRegistry.EXCLUDED_TYPES.containsKey(type)) {
                files.forEach(file -> ruleFindings.add(new Finding(ALWAYS, 5, file.getFileName() + " belongs to no closure type or extra root")));
            }
        });
        file(5, ruleFindings);
    }

    @Test
    void rule6NoJacksonAnnotationOutsideTheAllowList() {
        List<Class<?>> classes = new ArrayList<>(closure.guardedClasses());
        extraRootOwners.keySet().stream().filter(PayloadContractCompletenessTest::classExists).map(PayloadContractCompletenessTest::load).forEach(classes::add);
        List<Finding> ruleFindings = JacksonAnnotationGuard.violations(JsonUtils.getObjectMapper(), classes).stream()
                .map(violation -> new Finding(ALWAYS, 6, violation.toString())).toList();
        System.out.println("[completeness] rule 6 inspected " + classes.size() + " classes");
        file(6, ruleFindings);
    }

    @Test
    void rule7EveryRouteFunctionIsClassified() throws IOException {
        JsonNode routes = JsonUtils.getObjectMapper().readTree(
                Files.readString(root.resolve(ContractRegistry.FUNCTIONAL_ROUTES_FILE), StandardCharsets.UTF_8)).path(ROUTES_FIELD);
        Map<String, JsonNode> entries = new LinkedHashMap<>();
        List<Finding> ruleFindings = new ArrayList<>();
        if (!routes.isArray()) {
            ruleFindings.add(new Finding(ALWAYS, 7, ContractRegistry.FUNCTIONAL_ROUTES_FILE + " needs a '" + ROUTES_FIELD + "' array"));
        }
        routes.forEach(route -> {
            if (entries.put(route.path("key").asText(), route) != null) {
                ruleFindings.add(new Finding(ALWAYS, 7, "route entry listed twice: " + route.path("key").asText()));
            }
        });
        List<ContractSources.CallSite> sites = ContractSources.routeSites(root);
        sites.forEach(site -> System.out.println("[completeness] route site " + site.location() + " -> " + site.key()));
        Set<String> keys = sites.stream().map(ContractSources.CallSite::key).collect(Collectors.toSet());
        sites.stream().filter(site -> !entries.containsKey(site.key()))
                .forEach(site -> ruleFindings.add(new Finding(ALWAYS, 7, "unclassified route site " + site.location() + " (key " + site.key() + ")")));
        entries.forEach((key, entry) -> {
            if (!keys.contains(key)) {
                ruleFindings.add(new Finding(ALWAYS, 7, "stale route entry " + key));
            }
            String body = entry.path("body").asText();
            if (!ROUTE_BODIES.contains(body)) {
                ruleFindings.add(new Finding(ALWAYS, 7, key + ": body must be one of " + ROUTE_BODIES));
            }
            if (JSON_BODY.equals(body) && !testClassExists(entry.path("test").asText())) {
                ruleFindings.add(new Finding(ALWAYS, 7, key + ": JSON route without an existing test class"));
            }
            if (!JSON_BODY.equals(body) && entry.path("note").asText().isBlank()) {
                ruleFindings.add(new Finding(ALWAYS, 7, key + ": a non-JSON route needs its reason in note"));
            }
        });
        file(7, ruleFindings);
    }

    @Test
    void rule8EveryResponseBranchOccurrenceIsAssigned() {
        Map<String, Row> rows = registry.stream().collect(Collectors.toMap(Row::endpoint, row -> row, (a, b) -> a));
        Path mainClasses = PayloadTypeWalker.mainClassesDirectory();
        List<Finding> ruleFindings = new ArrayList<>();
        int occurrences = 0;
        for (Endpoint endpoint : closure.endpoints()) {
            Row row = rows.get(endpoint.key());
            if (row == null) {
                continue;
            }
            ControllerMethod method = ContractSources.controllerMethod(root, mainClasses, endpoint.method());
            List<String> found = ContractSources.branchOccurrences(root, method);
            occurrences += found.size();
            String where = endpoint.key() + " (" + method.sourceFile() + ":" + method.firstLine() + "-" + method.lastLine() + ")";
            found.stream().filter(occurrence -> !row.branches().containsKey(occurrence))
                    .forEach(occurrence -> ruleFindings.add(new Finding(row.wp(), 8, where + ": unassigned occurrence " + occurrence)));
            row.branches().keySet().stream().filter(occurrence -> !found.contains(occurrence))
                    .forEach(occurrence -> ruleFindings.add(new Finding(row.wp(), 8, where + ": stale assignment " + occurrence)));
        }
        System.out.println("[completeness] rule 8: " + occurrences + " response-branch occurrences in " + closure.endpoints().size() + " controller methods");
        file(8, ruleFindings);
    }

    @Test
    void rule9EveryQueryResultProducerIsPinned() {
        String wp = ContractRegistry.PRODUCER_GATE_WP;
        List<String> problems = new ArrayList<>();
        List<ContractRegistry.ProducerSite> rows = ContractRegistry.producerSites(root, problems);
        List<Finding> ruleFindings = new ArrayList<>(problems.stream().map(problem -> new Finding(ALWAYS, 9, problem)).toList());
        List<ContractSources.CallSite> sites = ContractSources.producerSites(root);
        sites.forEach(site -> System.out.println("[completeness] producer site " + site.location() + " -> " + site.key()));
        Set<String> listed = rows.stream().map(ContractRegistry.ProducerSite::site).collect(Collectors.toSet());
        Set<String> keys = sites.stream().map(ContractSources.CallSite::key).collect(Collectors.toSet());
        sites.stream().filter(site -> !listed.contains(site.key()))
                .forEach(site -> ruleFindings.add(new Finding(wp, 9, "producer site without a pinning test: " + site.location() + " (key " + site.key() + ")")));
        for (ContractRegistry.ProducerSite row : rows) {
            String where = ContractRegistry.PRODUCER_SITES_FILE + ":" + row.number() + ": ";
            if (!keys.contains(row.site())) {
                ruleFindings.add(new Finding(wp, 9, where + "stale site " + row.site()));
            }
            Path source = testSource(row.test());
            if (source == null) {
                ruleFindings.add(new Finding(wp, 9, where + "test class " + row.test() + " is in no test source root " + JsonBoundaryClassification.TEST_ROOT_PATTERNS));
            } else if (!ContractRegistry.PRODUCER_REPORT.matcher(read(source)).find()) {
                ruleFindings.add(new Finding(wp, 9, where + row.test() + " does not build a QueryResults.report"));
            }
        }
        if (!testClassExists(ContractRegistry.SERVER_RESULT_TEST)) {
            ruleFindings.add(new Finding(wp, 9, "the server's QueryResultView test " + ContractRegistry.SERVER_RESULT_TEST + " does not exist"));
        }
        System.out.println("[completeness] rule 9: " + sites.size() + " producer sites, " + rows.size() + " rows in " + ContractRegistry.PRODUCER_SITES_FILE);
        file(9, ruleFindings);
    }

    /** The source of a test class in any module's test root, or {@code null}. */
    private static Path testSource(String className) {
        String relative = className.replace('.', '/') + ".java";
        return JsonBoundaryClassification.testRoots(root).stream().map(testRoot -> root.resolve(testRoot).resolve(relative))
                .filter(Files::isRegularFile).findFirst().orElse(null);
    }

    private static String read(Path file) {
        try {
            return Files.readString(file, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("cannot read " + file, e);
        }
    }

    private static Set<String> topLevelNames(Path file) {
        try {
            JsonNode node = JsonUtils.getObjectMapper().readTree(Files.readString(file, StandardCharsets.UTF_8));
            Set<String> names = new TreeSet<>();
            node.fieldNames().forEachRemaining(names::add);
            return names;
        } catch (IOException e) {
            throw new UncheckedIOException("cannot read fixture " + file, e);
        }
    }

    private static boolean testClassExists(String name) {
        return !name.isBlank() && classExists(name);
    }

    private static boolean classExists(String name) {
        try {
            Class.forName(name, false, PayloadContractCompletenessTest.class.getClassLoader());
            return true;
        } catch (ClassNotFoundException e) {
            return false;
        }
    }

    private static Class<?> load(String name) {
        try {
            return Class.forName(name, false, PayloadContractCompletenessTest.class.getClassLoader());
        } catch (ClassNotFoundException e) {
            throw new IllegalStateException(name + " is not loadable", e);
        }
    }
}
