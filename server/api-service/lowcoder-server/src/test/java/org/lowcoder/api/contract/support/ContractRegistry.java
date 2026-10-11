package org.lowcoder.api.contract.support;

import org.lowcoder.api.contract.support.PayloadTypeWalker.Closure;
import org.lowcoder.api.contract.support.PayloadTypeWalker.PayloadType;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * One row per endpoint (docs/API_PAYLOAD_TEST_PLAN.md §3.2, §6.1), stored in {@value #FILE} with the tab-separated
 * columns {@code endpoint, level, wp, test, group, concrete, branches, reason}:
 *
 * <ul>
 *   <li>{@code endpoint}: the walker's key, declaration + method + parameter types;</li>
 *   <li>{@code level}: {@value #CODEC_LEVEL} or {@value #DECODE_ONLY_LEVEL} (§1.3); a decode-only row needs a
 *       {@code reason};</li>
 *   <li>{@code wp}: the owning WP, taken mechanically from the declaration ({@link #wpOf});</li>
 *   <li>{@code test}: the planned test class ({@link #plannedTestClass});</li>
 *   <li>{@code group}: the stubbing group of §5.2, {@value #PASS_THROUGH} or {@value #ASSEMBLING}, set by the owning WP;</li>
 *   <li>{@code concrete}: comma-separated class names of the concrete types behind the endpoint's untyped roots
 *       (Appendix A), set by the owning WP;</li>
 *   <li>{@code branches}: the §5.2 response-branch assignment, {@code <line> <token>=<branch>} entries joined by
 *       {@value #ENTRY_SEPARATOR}; the key is a {@link ContractSources#BRANCH_OCCURRENCE} (malformed or repeated keys are
 *       problems of the registry shape); equal branch names mean "same shape"; set by the owning WP.</li>
 * </ul>
 */
public final class ContractRegistry {

    public static final String FILE = "lowcoder-server/src/test/resources/json-contract/contract-registry.tsv";
    public static final String FUNCTIONAL_ROUTES_FILE = "lowcoder-server/src/test/resources/json-contract/functional-routes.json";
    public static final String TYPE_FIXTURES = "lowcoder-server/src/test/resources/json-contract/types";
    public static final String REPORT_FILE = "lowcoder-server/target/contract-gate/report.md";
    /**
     * Rule 9 (§4.6): one row per query-result producer site, with the tab-separated columns {@code site} (a key of
     * {@link ContractSources#producerSites}), {@code test} (the class, in any module's test sources, that pins the value
     * the site produces) and {@code producer} (the row of the plan's §4.6 producer table). Limit: rule 9 checks that the
     * named class builds a {@link #PRODUCER_REPORT}, not that it pins this very site; that pairing is checked by hand.
     */
    public static final String PRODUCER_SITES_FILE = "lowcoder-server/src/test/resources/json-contract/producer-sites.tsv";
    public static final int PRODUCER_SITE_COLUMNS = 3;
    /** Rule 9: a producer's test builds its report with {@code QueryResults.report} (the §4.6 producer pin). */
    public static final Pattern PRODUCER_REPORT = Pattern.compile("\\bQueryResults\\s*(?:\\.|::)\\s*report\\b");
    /** Rule 9: the server side of §4.6, the codec-level {@code QueryResultView} test of WP5 (T5.3). */
    public static final String SERVER_RESULT_TEST = "org.lowcoder.api.contract.payload.QueryResultViewContractTest";
    /** Rule 9 is the WP10 gate of plan §10: it is enforced once WP10 is done. */
    public static final String PRODUCER_GATE_WP = "WP10";
    public static final String CODEC_LEVEL = "codec";
    public static final String DECODE_ONLY_LEVEL = "decode-only";
    public static final String PASS_THROUGH = "pass-through";
    public static final String ASSEMBLING = "assembling";
    public static final Set<String> LEVELS = Set.of(CODEC_LEVEL, DECODE_ONLY_LEVEL);
    public static final Set<String> GROUPS = Set.of(PASS_THROUGH, ASSEMBLING);
    public static final String TEST_PACKAGE = "org.lowcoder.api.contract.endpoint";
    public static final String TEST_SUFFIX = "ContractTest";
    public static final String ENTRY_SEPARATOR = "; ";
    public static final String LIST_SEPARATOR = ",";
    public static final int COLUMNS = 8;
    /** §10, as in {@code docs/tools/wp_type_ownership.py}: declarations of WP2–WP6; every other one is WP7's. */
    public static final Map<String, String> WP_BY_DECLARATION = wpByDeclaration();
    public static final String DEFAULT_WP = "WP7";
    public static final List<String> TYPE_WP_ORDER = List.of("WP1", "WP2", "WP3", "WP4", "WP5", "WP6", "WP7");
    /** §3.3 and §5.3: WP1 writes the samples of its error-case representatives. */
    public static final Set<String> WP1_REPRESENTATIVES = Set.of(
            "org.lowcoder.domain.folder.model.Folder",
            "org.lowcoder.api.application.ApplicationEndpoints$CreateApplicationRequest");
    /** §4.0: types without a fixture of their own, with the reason. */
    public static final Map<String, String> EXCLUDED_TYPES = Map.of(
            "org.lowcoder.sdk.models.DatasourceConnectionConfig",
            "interface; its implementations are covered in config-binding and WP5 (§4.0)",
            "org.lowcoder.sdk.models.DatasourceStructure$Key",
            "interface; its implementations are covered in config-binding and WP5 (§4.0)",
            "org.springframework.http.codec.multipart.FilePart",
            "multipart file part, not JSON; the upload endpoint tests compare its name, file name, content type and bytes (§5.2)",
            "java.lang.Boolean",
            "JDK scalar written as a JSON boolean; the endpoint tests pin it inside the envelope (success(true), §5.2)",
            "org.lowcoder.api.usermanagement.view.GroupListResponseView",
            "envelope (a ResponseView subclass the walker does not strip): envelope/GroupListResponseView.success.json pins it "
                    + "(EnvelopeGoldensTest), and GroupEndpoints' getOrgGroups tests its data, the GroupView S1 (§5.2)");
    /**
     * §6.1 rule 3: the untyped roots whose payload is dynamic content or bytes rather than a type, by endpoint, with the
     * reason. Such a root names no {@code concrete} type; its endpoint test pins the content instead, dynamic content
     * with the §4.6 representative fixtures, bytes byte for byte. Each entry must name an untyped root of a registry row
     * with no {@code concrete} types.
     */
    public static final Map<String, String> DYNAMIC_ROOTS = Map.of(
            "ApplicationRecordEndpoints#dslById(String, String)",
            "a record's DSL map (Appendix A); ApplicationRecordEndpointsContractTest pins it with the §4.6 representative input",
            "LibraryQueryRecordEndpoints#dslById(String, String)",
            "a library query record's DSL map (Appendix A); LibraryQueryRecordEndpointsContractTest pins it with the §4.6 representative input",
            "PrivateNpmRegistryEndpoint#getNpmPackageMeta(String, String)",
            "the node service's answer passed through as bytes (§1.4, Appendix A); PrivateNpmRegistryEndpointContractTest pins them byte for byte",
            "PrivateNpmRegistryEndpoint#getNpmPackageAsset(String, String)",
            "the node service's answer passed through as bytes (§1.4, Appendix A); PrivateNpmRegistryEndpointContractTest pins them byte for byte",
            "DatasourceEndpoints#getPluginDynamicConfig(List)",
            "the node service's List<Object> (Appendix A, node-service); DatasourceEndpointsContractTest pins it with the §4.6 representative input",
            "DatasourceEndpoints#info(String)",
            "connection pool statistics, a list of maps of Integers and Properties (Appendix A); DatasourceEndpointsContractTest builds them "
                    + "with the production ClientBasedConnectionPool and pins them in dynamic/DatasourceEndpoints.info.output.json");
    private static final String COLUMN_SEPARATOR = "\t";
    private static final String COMMENT = "#";
    private static final String ASSIGNMENT = "=";
    private static final String KEY_SEPARATOR = "#";
    /** The walker's endpoint key: {@code <Declaration>#<method>(<parameter types>)}. */
    public static final Pattern ENDPOINT_KEY = Pattern.compile("[A-Z][A-Za-z0-9_$]*#[a-zA-Z_$][A-Za-z0-9_$]*\\(.*\\)");

    private ContractRegistry() {
    }

    private static Map<String, String> wpByDeclaration() {
        Map<String, String> map = new LinkedHashMap<>();
        List.of("ApplicationEndpoints", "ApplicationHistorySnapshotEndpoints", "ApplicationRecordEndpoints").forEach(d -> map.put(d, "WP2"));
        map.put("BundleEndpoints", "WP3");
        List.of("UserEndpoints", "OrganizationEndpoints", "GroupEndpoints", "InvitationEndpoints").forEach(d -> map.put(d, "WP4"));
        List.of("DatasourceEndpoints", "QueryEndpoints").forEach(d -> map.put(d, "WP5"));
        List.of("FolderEndpoints", "LibraryQueryEndpoints", "LibraryQueryRecordEndpoints").forEach(d -> map.put(d, "WP6"));
        return java.util.Collections.unmodifiableMap(map);
    }

    /** One registry row; {@code number} is its line in {@value #FILE}. */
    public record Row(int number, String endpoint, String level, String wp, String test, String group,
            List<String> concreteTypes, Map<String, String> branches, String reason) {
    }

    /** The WP owning an endpoint key, from its declaration's simple name. */
    public static String wpOf(String endpointKey) {
        return WP_BY_DECLARATION.getOrDefault(declarationOf(endpointKey), DEFAULT_WP);
    }

    /** {@value #TEST_PACKAGE}{@code .<Declaration>}{@value #TEST_SUFFIX}. */
    public static String plannedTestClass(String endpointKey) {
        return TEST_PACKAGE + "." + declarationOf(endpointKey) + TEST_SUFFIX;
    }

    private static String declarationOf(String endpointKey) {
        return endpointKey.substring(0, endpointKey.indexOf(KEY_SEPARATOR));
    }

    /**
     * The WP that writes each closure type's sample (§3.3; the rule of {@code wp_type_ownership.py}): WP1 for its
     * representatives, otherwise the first WP in {@link #TYPE_WP_ORDER} that owns an endpoint using the type.
     */
    public static Map<String, String> typeOwners(Closure closure) {
        Map<String, String> owners = new TreeMap<>();
        for (PayloadType type : closure.types().values()) {
            String name = type.type().getName();
            owners.put(name, WP1_REPRESENTATIVES.contains(name) ? "WP1" : type.usedBy().stream().map(ContractRegistry::wpOf)
                    .min((a, b) -> Integer.compare(TYPE_WP_ORDER.indexOf(a), TYPE_WP_ORDER.indexOf(b))).orElseThrow());
        }
        return owners;
    }

    /**
     * The rows of {@value #FILE} under {@code root}; a line without {@value #COLUMNS} columns or with an endpoint that is not an
     * {@link #ENDPOINT_KEY} is reported in {@code problems} and skipped, a malformed branch entry is reported and dropped.
     */
    public static List<Row> read(Path root, List<String> problems) {
        List<String> lines;
        try {
            lines = Files.readAllLines(root.resolve(FILE), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("cannot read " + FILE, e);
        }
        List<Row> rows = new ArrayList<>();
        for (int i = 0; i < lines.size(); i++) {
            String line = lines.get(i);
            if (line.isBlank() || line.startsWith(COMMENT)) {
                continue;
            }
            String[] c = line.split(COLUMN_SEPARATOR, -1);
            if (c.length != COLUMNS) {
                problems.add(FILE + ":" + (i + 1) + ": expected " + COLUMNS + " tab-separated columns, got " + c.length);
                continue;
            }
            if (!ENDPOINT_KEY.matcher(c[0]).matches()) {
                problems.add(FILE + ":" + (i + 1) + ": endpoint '" + c[0] + "' is not <Declaration>#<method>(<parameter types>)");
                continue;
            }
            Map<String, String> branches = new LinkedHashMap<>();
            for (String entry : split(c[6], ENTRY_SEPARATOR.trim())) {
                String[] parts = entry.split(ASSIGNMENT, 2);
                Matcher key = ContractSources.BRANCH_OCCURRENCE.matcher(parts[0].trim());
                if (parts.length != 2 || parts[1].isBlank() || !key.matches() || !ContractSources.BRANCH_TOKEN_NAMES.contains(key.group(1))) {
                    problems.add(FILE + ":" + (i + 1) + ": branch entry '" + entry + "' is not <line> <token>[#n]=<branch> with a token of "
                            + ContractSources.BRANCH_TOKEN_NAMES);
                    continue;
                }
                if (branches.put(parts[0].trim(), parts[1].trim()) != null) {
                    problems.add(FILE + ":" + (i + 1) + ": branch occurrence '" + parts[0].trim() + "' assigned twice");
                }
            }
            rows.add(new Row(i + 1, c[0], c[1], c[2], c[3], c[4], split(c[5], LIST_SEPARATOR), branches, c[7]));
        }
        return rows;
    }

    /** One row of {@value #PRODUCER_SITES_FILE}. */
    public record ProducerSite(int number, String site, String test, String producer) {
    }

    /** The rows of {@value #PRODUCER_SITES_FILE}; malformed or repeated rows are added to {@code problems}. */
    public static List<ProducerSite> producerSites(Path root, List<String> problems) {
        List<String> lines;
        try {
            lines = Files.readAllLines(root.resolve(PRODUCER_SITES_FILE), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("cannot read " + PRODUCER_SITES_FILE, e);
        }
        List<ProducerSite> rows = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < lines.size(); i++) {
            String line = lines.get(i);
            if (line.isBlank() || line.startsWith(COMMENT)) {
                continue;
            }
            String[] c = line.split(COLUMN_SEPARATOR, -1);
            if (c.length != PRODUCER_SITE_COLUMNS || Arrays.stream(c).anyMatch(String::isBlank)) {
                problems.add(PRODUCER_SITES_FILE + ":" + (i + 1) + ": expected " + PRODUCER_SITE_COLUMNS + " non-empty tab-separated columns");
                continue;
            }
            if (!seen.add(c[0])) {
                problems.add(PRODUCER_SITES_FILE + ":" + (i + 1) + ": site listed twice: " + c[0]);
                continue;
            }
            rows.add(new ProducerSite(i + 1, c[0], c[1], c[2]));
        }
        return rows;
    }

    private static List<String> split(String column, String separator) {
        return column.isBlank() ? List.of() : Arrays.stream(column.split(separator)).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }
}
