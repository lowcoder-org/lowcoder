package org.lowcoder.api.contract.support;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.Deque;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Java port of {@code docs/tools/json_boundary_sites.py}: finds the JSON boundary sites of the main sources and checks
 * them against the classification {@code lowcoder-server/src/test/resources/json-contract/boundary-sites/json-boundary-sites.tsv} (docs/API_PAYLOAD_TEST_PLAN.md §4.10,
 * §6.2). The matching rules, the file-level rows, the attestation tokens, {@code WRAPPER_RULE} and the checks are the
 * prototype's; its doc string states their limits, which apply here unchanged.
 *
 * <p><b>Row keys.</b> The prototype keys a row by {@code <path>:<line>} and callee. This port also gives every site a
 * stable key, {@code <path>#<member>#<callee>#<ordinal>} ({@link Site#key()}), which the classification's fifth column
 * holds and the gate matches, so an edit that only shifts lines does not fail the gate. {@code <member>} is the
 * innermost enclosing method ({@code Type.method}), the field whose initializer holds the site ({@code Type.field}),
 * {@code Type.<init>} inside an initializer block, or {@value #FILE_MEMBER} for a file-level row; nested and anonymous
 * types are joined with {@code .} ({@code new Foo} for an anonymous one). {@code <ordinal>} counts the sites with the
 * same member and callee in source order, from 1.
 *
 * <p>Limits of the keys: members are found by tracking braces in the source with comments and literals blanked out,
 * not by a parser. Overloads share a member name, so their sites share one ordinal sequence; adding a site before
 * another with the same member and callee shifts the later ordinals; renaming a method changes its keys.
 */
public final class JsonBoundaryScanner {

    public static final String MAPPER_KIND = "mapper";
    public static final String MAPPER_CALLEE = "new ObjectMapper";
    public static final String IMPORT_CALLEE = "import";
    public static final String FILE_MEMBER = "<file>";
    public static final String INITIALIZER_MEMBER = "<init>";
    public static final String UNLISTED_WRAPPER = "# unlisted wrapper";
    public static final String KEY_SEPARATOR = "#";
    public static final String ATTESTATION_PREFIX = "sha256=";
    public static final int ATTESTATION_LENGTH = 16;
    public static final String WRAPPER_KIND = "wrapper";

    /** The prototype's KINDS, in its order (which is also the alternation order of the call pattern). */
    public static final Map<String, List<String>> KINDS = kinds();
    public static final Map<String, List<String>> SCOPES = Map.of(
            "layer-c", List.of("lowcoder-sdk/src/main/java", "lowcoder-plugins/*/src/main/java"),
            "server", List.of("lowcoder-server/src/main/java", "lowcoder-domain/src/main/java", "lowcoder-infra/src/main/java"));
    public static final List<String> SCOPE_ORDER = List.of("layer-c", "server");
    public static final Map<String, String> EXCLUDED = Map.of(
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/util/JsonUtils.java", "implementation of the JsonUtils helpers",
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/test/JsonFileReader.java", "fixture reader used only by test sources");
    public static final Set<String> WRAPPER_RETURN_TYPES = Set.of("String", "JsonNode", "ObjectNode", "ArrayNode");
    public static final Set<String> WRAPPER_SOURCE_KINDS = Set.of("read", "write", "convert", "reader-writer", WRAPPER_KIND);
    public static final Set<String> WRAPPER_EXEMPT = Set.of(
            "lowcoder-infra/src/main/java/org/lowcoder/infra/config/AutoReloadConfigFactory.java#getValue");

    private static final int FLAGS = Pattern.UNICODE_CHARACTER_CLASS;
    private static final Map<String, String> KIND_OF = KINDS.entrySet().stream()
            .flatMap(entry -> entry.getValue().stream().map(callee -> Map.entry(callee, entry.getKey())))
            .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, LinkedHashMap::new));
    private static final String NAMES = KIND_OF.keySet().stream()
            .map(name -> Pattern.quote(name).replace(".", "\\E\\s*\\.\\s*\\Q"))
            .collect(Collectors.joining("|"));
    private static final Pattern CALL_PATTERN = Pattern.compile(
            "(::\\s*)\\b(" + NAMES + ")\\b|\\b(" + NAMES + ")\\b\\s*\\(|\\bnew\\s+ObjectMapper\\s*\\(", FLAGS);
    private static final String MODIFIERS = "(?:public|protected|private|static|final|default|synchronized|abstract)";
    private static final String STATEMENT_KEYWORDS = "(?!(?:return|throw|new|else|case|yield|assert)\\b)";
    private static final Pattern DECLARATION_PATTERN = Pattern.compile(
            "^\\s*(?:" + MODIFIERS + "\\s+)*(?:<[^>]*>\\s*)?" + STATEMENT_KEYWORDS + "\\w[\\w.<>\\[\\],? ]*\\s+(" + NAMES + ")\\s*\\(", FLAGS);
    private static final Pattern METHOD_DECLARATION = Pattern.compile(
            "^\\s*((?:" + MODIFIERS + "\\s+)*)(?:<[^>]*>\\s*)?" + STATEMENT_KEYWORDS + "([\\w.<>\\[\\],? ]+?)\\s+(\\w+)\\s*\\([^;]*$", FLAGS);
    private static final Set<String> NOT_METHOD_NAMES = Set.of("if", "for", "while", "switch", "catch", "synchronized");
    private static final Pattern RETURN_LINE = Pattern.compile("^\\s*return\\b", FLAGS);
    private static final Pattern NON_CODE_PATTERN = Pattern.compile(
            // the prototype's "(?:\\.|[^"\\\n])*", unrolled so that Java's matcher does not recurse once per character
            "//[^\\n]*|/\\*.*?\\*/|\"[^\"\\\\\\n]*+(?:\\\\.[^\"\\\\\\n]*+)*+\"|'[^'\\\\\\n]*+(?:\\\\.[^'\\\\\\n]*+)*+'",
            Pattern.DOTALL | FLAGS);
    private static final Pattern NON_NEWLINE = Pattern.compile("[^\\n]");
    private static final Pattern WHITESPACE = Pattern.compile("\\s+", FLAGS);
    private static final String RAW_JACKSON_TYPES =
            "com\\.fasterxml\\.jackson\\.databind\\.(?:JsonNode\\b|node\\.|ObjectMapper|ObjectReader|ObjectWriter|SerializerProvider"
                    + "|JsonSerializer|JsonDeserializer|DeserializationContext|module\\.|cfg\\.|ser\\.|deser\\.)"
                    + "|com\\.fasterxml\\.jackson\\.core\\.(?:JsonFactory|JsonParser|JsonGenerator)"
                    + "|org\\.springframework\\.http\\.codec\\.json\\."
                    + "|(?!lombok\\.)[a-z]\\w*(?:\\.[a-z]\\w*)+\\.\\w*Jackson\\w*\\b";
    private static final Pattern RAW_JACKSON_IMPORT = Pattern.compile(
            "^import\\s+(?:static\\s+)?(?:" + RAW_JACKSON_TYPES + ")", Pattern.MULTILINE | FLAGS);
    private static final Pattern RAW_JACKSON_NAME = Pattern.compile(
            "^(?!\\s*(?:import|package)\\b).*(?:" + RAW_JACKSON_TYPES + ")", Pattern.MULTILINE | FLAGS);
    private static final Pattern STATIC_INSERTER_IMPORT = Pattern.compile(
            "^import\\s+static\\s+org\\.springframework\\.web\\.reactive\\.function\\.BodyInserters\\.", Pattern.MULTILINE | FLAGS);
    private static final Pattern JSON_UTILS_IMPORT = Pattern.compile(
            "^import\\s+(?:static\\s+)?org\\.lowcoder\\.sdk\\.util\\.JsonUtils\\b", Pattern.MULTILINE | FLAGS);
    private static final String JAVA_SUFFIX = ".java";
    private static final String GLOB_SEGMENT = "*";

    private JsonBoundaryScanner() {
    }

    private static Map<String, List<String>> kinds() {
        Map<String, List<String>> kinds = new LinkedHashMap<>();
        kinds.put("read", List.of("fromJson", "fromJsonSafely", "fromJsonQuietly", "fromJsonMap", "fromJsonList", "fromJsonSet",
                "readTree", "readValue", "readValues", "treeAsTokens"));
        kinds.put("write", List.of("toJson", "toJsonSafely", "toJsonThrows", "writeValueAsString", "writeValueAsBytes", "writeValue",
                "toPrettyString", "writeValues", "writeTree"));
        kinds.put("convert", List.of("valueToTree", "jsonNodeToObject", "convertValue", "treeToValue", "fromJsonNode", "updateValue"));
        kinds.put("reader-writer", List.of("reader", "readerFor", "readerForUpdating", "readerForListOf", "readerForMapOf",
                "readerWithView", "writer", "writerFor", "writerWithView", "writerWithDefaultPrettyPrinter", "createParser",
                "createGenerator"));
        kinds.put("codec-decode", List.of("bodyToMono", "bodyToFlux", "toEntity", "toEntityList"));
        kinds.put("codec-encode", List.of("bodyValue", "BodyInserters.fromValue"));
        kinds.put("codec-config", List.of("codecs", "jackson2JsonEncoder", "jackson2JsonDecoder"));
        kinds.put("mapper-access", List.of("getObjectMapper"));
        kinds.put(WRAPPER_KIND, List.of("renderMustacheJsonString", "renderMustacheArrayJsonString", "renderMustacheJson",
                "parseResultBody", "getConcatSqlStr"));
        return java.util.Collections.unmodifiableMap(kinds);
    }

    /** One JSON boundary site; {@code line} is 0 for a file-level row. */
    public record Site(String path, int line, String kind, String callee, String member, int ordinal) {

        /** The prototype's row key: {@code <path>:<line> <callee>}. */
        public String location() {
            return path + ":" + line + " " + callee;
        }

        /** The stable row key of the classification's fifth column. */
        public String key() {
            return path + KEY_SEPARATOR + member + KEY_SEPARATOR + callee + KEY_SEPARATOR + ordinal;
        }

        /** The prototype's {@code list} line. */
        public String listLine() {
            return path + ":" + line + " " + kind + " " + callee;
        }
    }

    /** The sites of one scope, in the prototype's order, and its notes (excluded files, unlisted wrappers). */
    public record Scan(List<Site> sites, List<String> notes) {
    }

    /** Scans one scope under {@code root} with the listed wrappers of {@link #KINDS}. */
    public static Scan scan(Path root, String scope) {
        return scan(root, scope, KINDS.get(WRAPPER_KIND));
    }

    /** Scans one scope under {@code root}; {@code wrappers} replaces the listed wrappers for WRAPPER_RULE only. */
    public static Scan scan(Path root, String scope, Collection<String> wrappers) {
        List<Site> sites = new ArrayList<>();
        List<String> notes = new ArrayList<>();
        for (Path file : sourceFiles(root, SCOPES.get(scope))) {
            String relative = relative(root, file);
            if (EXCLUDED.containsKey(relative)) {
                notes.add("# excluded " + relative + ": " + EXCLUDED.get(relative));
                continue;
            }
            String code = blankNonCode(read(file));
            List<int[]> rawSites = new ArrayList<>();
            List<Site> fileSites = sitesIn(relative, code, rawSites);
            sites.addAll(fileSites);
            if (needsFileRow(code, !rawSites.isEmpty())) {
                sites.add(new Site(relative, 0, IMPORT_CALLEE, IMPORT_CALLEE, FILE_MEMBER, 1));
            }
            for (String wrapper : unlistedWrappers(relative, code, rawSites, wrappers)) {
                notes.add(UNLISTED_WRAPPER + " " + wrapper);
            }
        }
        return new Scan(sites, notes);
    }

    /** The main source files of both scopes, relative to {@code root}, in {@link #SCOPE_ORDER} and the prototype's order. */
    public static List<String> mainSourceFiles(Path root) {
        return SCOPE_ORDER.stream().flatMap(scope -> sourceFiles(root, SCOPES.get(scope)).stream()).map(file -> relative(root, file)).toList();
    }

    /** Both scopes, in {@link #SCOPE_ORDER}. */
    public static List<Site> scanAll(Path root) {
        return SCOPE_ORDER.stream().flatMap(scope -> scan(root, scope).sites().stream()).toList();
    }

    /** WRAPPER_RULE violations over both scopes, with the given listed wrappers. */
    public static List<String> wrapperProblems(Path root, Collection<String> wrappers) {
        return SCOPE_ORDER.stream().flatMap(scope -> scan(root, scope, wrappers).notes().stream())
                .filter(note -> note.startsWith(UNLISTED_WRAPPER))
                .map(note -> note.substring(2))
                .toList();
    }

    /** The prototype's {@code list <scope>} output. */
    public static List<String> listLines(Path root, String scope) {
        Scan scan = scan(root, scope);
        List<String> lines = new ArrayList<>(scan.sites().stream().map(Site::listLine).toList());
        lines.addAll(scan.notes());
        lines.add("# " + scan.sites().size() + " sites");
        return lines;
    }

    /** The prototype's attestation token of a file's content. */
    public static String attestation(String content) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(content.getBytes(StandardCharsets.UTF_8));
            return ATTESTATION_PREFIX + HexFormat.of().formatHex(digest).substring(0, ATTESTATION_LENGTH);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }

    /** The attestation token of the file at {@code relative} under {@code root}. */
    public static String fileAttestation(Path root, String relative) {
        return attestation(read(root.resolve(relative)));
    }

    /** Comments and literals replaced by spaces, newlines kept, so that offsets and line numbers stay valid. */
    public static String blankNonCode(String source) {
        return NON_CODE_PATTERN.matcher(source).replaceAll(match -> NON_NEWLINE.matcher(match.group()).replaceAll(" "));
    }

    /**
     * The enclosing members of offsets in one file's code with comments and literals blanked
     * ({@link #blankNonCode}), as row keys name them; for callers that key other source sites the same way.
     */
    public static Function<Integer, String> members(String blankedCode) {
        return new Members(blankedCode)::memberAt;
    }

    /** Comments replaced by spaces, string and char literals kept, newlines kept. */
    public static String blankComments(String source) {
        return NON_CODE_PATTERN.matcher(source).replaceAll(match -> match.group().startsWith("/")
                ? NON_NEWLINE.matcher(match.group()).replaceAll(" ") : Matcher.quoteReplacement(match.group()));
    }

    private static List<Site> sitesIn(String relative, String code, List<int[]> rawSites) {
        String[] lines = code.split("\n", -1);
        int[] lineStarts = lineStarts(code);
        Members members = new Members(code);
        Map<String, Site> found = new LinkedHashMap<>();
        Map<String, Integer> ordinals = new HashMap<>();
        Matcher matcher = CALL_PATTERN.matcher(code);
        while (matcher.find()) {
            int lineNumber = lineOf(lineStarts, matcher.start());
            String kind;
            String callee;
            if (matcher.group(1) != null) {
                callee = "::" + WHITESPACE.matcher(matcher.group(2)).replaceAll("");
                kind = KIND_OF.get(callee.substring(2));
            } else if (matcher.group(3) != null) {
                if (DECLARATION_PATTERN.matcher(lines[lineNumber - 1]).lookingAt()) {
                    continue;
                }
                callee = WHITESPACE.matcher(matcher.group(3)).replaceAll("");
                kind = KIND_OF.get(callee);
            } else {
                callee = MAPPER_CALLEE;
                kind = MAPPER_KIND;
            }
            rawSites.add(new int[]{lineNumber, WRAPPER_SOURCE_KINDS.contains(kind) ? 1 : 0});
            String location = lineNumber + " " + callee;
            if (!found.containsKey(location)) {
                String member = members.memberAt(matcher.start());
                int ordinal = ordinals.merge(member + KEY_SEPARATOR + callee, 1, Integer::sum);
                found.put(location, new Site(relative, lineNumber, kind, callee, member, ordinal));
            }
        }
        return new ArrayList<>(found.values());
    }

    private static boolean needsFileRow(String code, boolean hasSites) {
        if (RAW_JACKSON_IMPORT.matcher(code).find() || RAW_JACKSON_NAME.matcher(code).find()
                || STATIC_INSERTER_IMPORT.matcher(code).find()) {
            return true;
        }
        return !hasSites && JSON_UTILS_IMPORT.matcher(code).find();
    }

    /** {@code <path>:<line> <method>} for each method that WRAPPER_RULE requires to be a listed or exempt wrapper. */
    private static List<String> unlistedWrappers(String relative, String code, List<int[]> rawSites, Collection<String> wrappers) {
        Set<Integer> sourceLines = rawSites.stream().filter(site -> site[1] == 1).map(site -> site[0]).collect(Collectors.toSet());
        List<String> result = new ArrayList<>();
        String method = null;
        String[] lines = code.split("\n", -1);
        for (int number = 1; number <= lines.length; number++) {
            String line = lines[number - 1];
            Matcher declaration = METHOD_DECLARATION.matcher(line);
            if (declaration.matches() && !NOT_METHOD_NAMES.contains(declaration.group(3))) {
                boolean isPrivate = List.of(declaration.group(1).trim().split("\\s+")).contains("private");
                String[] returnType = declaration.group(2).split("\\.");
                method = isPrivate || !WRAPPER_RETURN_TYPES.contains(returnType[returnType.length - 1]) ? null : declaration.group(3);
            }
            if (method != null && sourceLines.contains(number) && RETURN_LINE.matcher(line).find()
                    && !wrappers.contains(method) && !WRAPPER_EXEMPT.contains(relative + KEY_SEPARATOR + method)) {
                result.add(relative + ":" + number + " " + method);
            }
        }
        return result;
    }

    /** The {@code .java} files under each base (a {@code *} segment matches one directory), in the prototype's order. */
    private static List<Path> sourceFiles(Path root, List<String> bases) {
        List<Path> files = new ArrayList<>();
        for (String base : bases) {
            for (Path directory : expand(root, base)) {
                try (Stream<Path> walk = Files.walk(directory)) {
                    walk.filter(path -> path.toString().endsWith(JAVA_SUFFIX) && Files.isRegularFile(path)).forEach(files::add);
                } catch (IOException e) {
                    throw new UncheckedIOException("cannot list " + directory, e);
                }
            }
        }
        // Python sorts pathlib paths component by component
        Comparator<Path> byComponents = (a, b) -> {
            List<String> left = components(root, a);
            List<String> right = components(root, b);
            for (int i = 0; i < Math.min(left.size(), right.size()); i++) {
                int compared = left.get(i).compareTo(right.get(i));
                if (compared != 0) {
                    return compared;
                }
            }
            return Integer.compare(left.size(), right.size());
        };
        return files.stream().distinct().sorted(byComponents).toList();
    }

    private static List<Path> expand(Path root, String base) {
        List<Path> directories = List.of(root);
        for (String segment : base.split("/")) {
            List<Path> next = new ArrayList<>();
            for (Path directory : directories) {
                if (segment.equals(GLOB_SEGMENT)) {
                    try (Stream<Path> children = Files.list(directory)) {
                        children.filter(Files::isDirectory).sorted().forEach(next::add);
                    } catch (IOException e) {
                        throw new UncheckedIOException("cannot list " + directory, e);
                    }
                } else if (Files.isDirectory(directory.resolve(segment))) {
                    next.add(directory.resolve(segment));
                }
            }
            directories = next;
        }
        return directories;
    }

    private static List<String> components(Path root, Path path) {
        return List.of(relative(root, path).split("/"));
    }

    private static String relative(Path root, Path file) {
        return root.relativize(file).toString().replace('\\', '/');
    }

    private static String read(Path file) {
        try {
            return Files.readString(file, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("cannot read " + file, e);
        }
    }

    private static int[] lineStarts(String code) {
        List<Integer> starts = new ArrayList<>();
        starts.add(0);
        for (int i = 0; i < code.length(); i++) {
            if (code.charAt(i) == '\n') {
                starts.add(i + 1);
            }
        }
        return starts.stream().mapToInt(Integer::intValue).toArray();
    }

    private static int lineOf(int[] lineStarts, int offset) {
        int index = java.util.Arrays.binarySearch(lineStarts, offset);
        return (index >= 0 ? index : -index - 2) + 1;
    }

    /**
     * The enclosing member of each offset of blanked code, found by tracking braces. A {@code {} opens a type when the
     * text before it declares a class, interface, enum or record, or ends with {@code new X(...)} (an anonymous type);
     * a method when it ends with a name and a parameter list directly inside a type; otherwise a block.
     */
    static final class Members {

        private static final Pattern TYPE_HEADER = Pattern.compile("(?<![.\\w@])(?:class|interface|enum|record)\\s+(\\w+)", FLAGS);
        private static final Pattern ANONYMOUS_HEADER = Pattern.compile("\\bnew\\s+([\\w.]+)\\s*(?:<[^{}]*>)?\\s*\\([^{}]*\\)\\s*$", FLAGS);
        private static final Pattern METHOD_HEADER = Pattern.compile(
                "(\\w+)\\s*\\((?:[^()]|\\([^()]*\\))*\\)\\s*(?:throws\\s+[\\w.,\\s<>]+)?$", FLAGS);
        private static final Pattern FIELD_NAME = Pattern.compile("(\\w+)\\s*=(?!=)", FLAGS);
        private static final Set<String> KEYWORDS = Set.of("if", "for", "while", "switch", "catch", "synchronized", "try",
                "return", "new", "else", "do", "finally");

        private enum FrameKind { TYPE, METHOD, BLOCK }

        private record Frame(FrameKind kind, String name, int start, int end) {
        }

        private final String code;
        private final List<Frame> frames = new ArrayList<>();
        private final TreeMap<Integer, Integer> boundaries = new TreeMap<>();

        Members(String code) {
            this.code = code;
            Deque<Integer> open = new ArrayDeque<>();
            Deque<Frame> stack = new ArrayDeque<>();
            int boundary = 0;
            for (int i = 0; i < code.length(); i++) {
                char c = code.charAt(i);
                if (c == '{') {
                    String header = WHITESPACE.matcher(code.substring(boundary, i)).replaceAll(" ").trim();
                    Frame parent = stack.peek();
                    Frame frame = classify(header, parent, i);
                    stack.push(frame);
                    open.push(frames.size());
                    frames.add(frame);
                    boundary = i + 1;
                } else if (c == '}') {
                    if (!stack.isEmpty()) {
                        Frame closed = stack.pop();
                        int index = open.pop();
                        frames.set(index, new Frame(closed.kind(), closed.name(), closed.start(), i));
                    }
                    boundary = i + 1;
                } else if (c == ';') {
                    boundary = i + 1;
                }
                boundaries.put(i, boundary);
            }
        }

        private Frame classify(String header, Frame parent, int start) {
            Matcher anonymous = ANONYMOUS_HEADER.matcher(header);
            if (anonymous.find()) {
                return new Frame(FrameKind.TYPE, "new " + anonymous.group(1), start, Integer.MAX_VALUE);
            }
            Matcher type = TYPE_HEADER.matcher(header);
            String typeName = null;
            while (type.find()) {
                typeName = type.group(1);
            }
            if (typeName != null && !header.endsWith(")") ) {
                return new Frame(FrameKind.TYPE, typeName, start, Integer.MAX_VALUE);
            }
            if (typeName != null && header.matches(".*(?<![.\\w@])record\\s+\\w+\\s*(?:<[^{}]*>)?\\s*\\([^{}]*\\)\\s*(?:implements\\s+[\\w.,\\s<>]+)?$")) {
                return new Frame(FrameKind.TYPE, typeName, start, Integer.MAX_VALUE);
            }
            Matcher method = METHOD_HEADER.matcher(header);
            if (parent != null && parent.kind() == FrameKind.TYPE && method.find() && !KEYWORDS.contains(method.group(1))) {
                return new Frame(FrameKind.METHOD, method.group(1), start, Integer.MAX_VALUE);
            }
            return new Frame(FrameKind.BLOCK, null, start, Integer.MAX_VALUE);
        }

        /** {@code Type.method}, {@code Type.field}, {@code Type.<init>}, or {@value #FILE_MEMBER} outside any type. */
        String memberAt(int offset) {
            List<Frame> enclosing = frames.stream().filter(frame -> frame.start() < offset && offset < frame.end()).toList();
            List<String> types = new ArrayList<>();
            String method = null;
            boolean inTypeBlock = false;
            for (Frame frame : enclosing) {
                switch (frame.kind()) {
                    case TYPE -> {
                        types.add(frame.name());
                        method = null;
                        inTypeBlock = false;
                    }
                    case METHOD -> method = frame.name();
                    case BLOCK -> inTypeBlock = method == null;
                }
            }
            if (types.isEmpty()) {
                return FILE_MEMBER;
            }
            String typePath = String.join(".", types);
            if (method != null) {
                return typePath + "." + method;
            }
            if (inTypeBlock) {
                return typePath + "." + INITIALIZER_MEMBER;
            }
            Map.Entry<Integer, Integer> boundary = boundaries.floorEntry(offset);
            String declaration = code.substring(boundary == null ? 0 : boundary.getValue(), offset);
            Matcher field = FIELD_NAME.matcher(declaration);
            String name = null;
            while (field.find()) {
                name = field.group(1);
            }
            return typePath + "." + (name == null ? INITIALIZER_MEMBER : name);
        }
    }

    /** Groups the sites by a key; used by callers that look rows up by location or by key. */
    public static <K> Map<K, Site> index(List<Site> sites, Function<Site, K> key) {
        Map<K, Site> index = new LinkedHashMap<>();
        sites.forEach(site -> index.putIfAbsent(key.apply(site), site));
        return index;
    }
}
