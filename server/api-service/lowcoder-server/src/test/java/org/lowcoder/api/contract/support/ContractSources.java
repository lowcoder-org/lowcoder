package org.lowcoder.api.contract.support;

import org.springframework.asm.ClassReader;
import org.springframework.asm.ClassVisitor;
import org.springframework.asm.Label;
import org.springframework.asm.MethodVisitor;
import org.springframework.asm.SpringAsmInfo;
import org.springframework.asm.Type;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.type.classreading.CachingMetadataReaderFactory;
import org.springframework.core.type.classreading.MetadataReader;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * The source-level facts the completeness gate needs beyond the walker (docs/API_PAYLOAD_TEST_PLAN.md §5.2, §6.1).
 *
 * <ul>
 *   <li><b>Rule 7, route sites.</b> Calls that produce a {@code RouterFunction} in main sources:
 *       {@code RouterFunctions.route|nest|resources(}, and the bare {@code route(}, {@code nest(} or
 *       {@code resources(} in a file that imports them statically from {@code RouterFunctions}. Each gets a stable key
 *       {@code <path>#<member>#<callee>#<ordinal>}, built like the JSON boundary keys.</li>
 *   <li><b>Rule 9, query-result producer sites.</b> Calls that put a value into {@code QueryExecutionResult} in main
 *       sources: {@code QueryExecutionResult.success(}, {@code QueryExecutionResult.ofRestApiResult(} and their method
 *       references ({@code QueryExecutionResult::success}), the command of plan §4.6 as a scan. Keys as for route
 *       sites; a method reference's callee is {@code ::<name>}.</li>
 *   <li><b>Rule 8, response-branch occurrences.</b> For an endpoint, the controller method that implements it, its line
 *       range from the bytecode {@code LineNumberTable} (with its {@code lambda$<name>$n} bodies) read with Spring's
 *       ASM {@link ClassReader}, and within that range of the source every {@code return},
 *       {@code .switchIfEmpty(}, {@code .defaultIfEmpty(}, {@code .onErrorResume(}, {@code .onErrorReturn(} and
 *       {@code Mono.error(}, as {@code <line> <token>} (with {@code #n} for a repeat on one line).</li>
 * </ul>
 *
 * <p>Limits (plan §5.2): rule 8 is a tripwire, not a proof. It does not follow calls, so a shape built in a helper
 * method counts as one branch of the controller; lambdas javac names otherwise (or none, for method references) are
 * not added to the range; occurrence keys carry line numbers, so an edit inside a controller method makes the owning
 * WP re-assign them. Route and producer detection is lexical, like the boundary scanner: a route built through
 * another API is missed, and so is a producer called through a static import or a variable of another name.
 */
public final class ContractSources {

    public static final String SERVER_MAIN = "lowcoder-server/src/main/java";
    public static final String API_PACKAGE_PATH = "org/lowcoder/api";
    private static final Pattern QUALIFIED_ROUTE = Pattern.compile("\\bRouterFunctions\\s*\\.\\s*(route|nest|resources)\\s*\\(");
    private static final Pattern BARE_ROUTE = Pattern.compile("(?<![.\\w])(route|nest|resources)\\s*\\(");
    private static final Pattern STATIC_ROUTE_IMPORT = Pattern.compile(
            "^import\\s+static\\s+org\\.springframework\\.web\\.reactive\\.function\\.server\\.RouterFunctions\\.(?:route|nest|resources|\\*)\\s*;",
            Pattern.MULTILINE);
    /** Group 1: the called factory; group 2: the factory of a method reference. */
    private static final Pattern PRODUCER_CALL = Pattern.compile(
            "\\bQueryExecutionResult\\s*(?:\\.\\s*(success|ofRestApiResult)\\s*\\(|::\\s*(success|ofRestApiResult)\\b)");
    private static final String METHOD_REFERENCE = "::";
    private static final Pattern BRANCH_TOKEN = Pattern.compile(
            "\\breturn\\b|\\.\\s*(switchIfEmpty|defaultIfEmpty|onErrorResume|onErrorReturn)\\s*\\(|\\bMono\\s*\\.\\s*error\\s*\\(");
    private static final String MONO_ERROR = "Mono.error";
    private static final String RETURN = "return";
    /** The token names of {@link #branchOccurrences}, which a registry branch key must use. */
    public static final Set<String> BRANCH_TOKEN_NAMES = Set.of(RETURN, "switchIfEmpty", "defaultIfEmpty", "onErrorResume", "onErrorReturn", MONO_ERROR);
    /** {@code <line> <token>} or, for the n-th (n ≥ 2) repeat on one line, {@code <line> <token>#n}. */
    public static final Pattern BRANCH_OCCURRENCE = Pattern.compile("[1-9][0-9]* ([A-Za-z.]+)(?:#(?:[2-9]|[1-9][0-9]+))?");
    private static final String LAMBDA_PREFIX = "lambda$";
    private static final String CLASS_SUFFIX = ".class";
    private static final String REPEAT = "#";

    private ContractSources() {
    }

    /** One call found by a lexical scan: its location ({@code <path>:<line>}, informational) and its stable key. */
    public record CallSite(String location, String key) {
    }

    /** Rule 7: every route-producing call of the main sources under {@code root}. */
    public static List<CallSite> routeSites(Path root) {
        return callSites(root, code -> {
            List<Matcher> matchers = new ArrayList<>(List.of(QUALIFIED_ROUTE.matcher(code)));
            if (STATIC_ROUTE_IMPORT.matcher(code).find()) {
                matchers.add(BARE_ROUTE.matcher(code));
            }
            return matchers;
        }, matcher -> matcher.group(1));
    }

    /** Rule 9: the calls that put a value into {@code QueryExecutionResult}, in every main source file. */
    public static List<CallSite> producerSites(Path root) {
        return callSites(root, code -> List.of(PRODUCER_CALL.matcher(code)),
                matcher -> matcher.group(1) != null ? matcher.group(1) : METHOD_REFERENCE + matcher.group(2));
    }

    /**
     * The sites the matchers of {@code matchersOf} find in the non-code-blanked main sources, keyed
     * {@code <path>#<member>#<callee>#<ordinal>} with the callee {@code calleeOf} names.
     */
    private static List<CallSite> callSites(Path root, Function<String, List<Matcher>> matchersOf, Function<Matcher, String> calleeOf) {
        List<CallSite> sites = new ArrayList<>();
        for (String relative : JsonBoundaryScanner.mainSourceFiles(root)) {
            String code = JsonBoundaryScanner.blankNonCode(read(root.resolve(relative)));
            Function<Integer, String> members = JsonBoundaryScanner.members(code);
            Map<String, Integer> ordinals = new HashMap<>();
            TreeSet<Integer> offsets = new TreeSet<>();
            Map<Integer, String> callees = new HashMap<>();
            for (Matcher matcher : matchersOf.apply(code)) {
                while (matcher.find()) {
                    offsets.add(matcher.start());
                    callees.put(matcher.start(), calleeOf.apply(matcher));
                }
            }
            for (int offset : offsets) {
                String member = members.apply(offset);
                String callee = callees.get(offset);
                int ordinal = ordinals.merge(member + REPEAT + callee, 1, Integer::sum);
                int line = (int) code.substring(0, offset).chars().filter(c -> c == '\n').count() + 1;
                sites.add(new CallSite(relative + ":" + line, relative + REPEAT + member + REPEAT + callee + REPEAT + ordinal));
            }
        }
        return sites;
    }

    /** The controller method implementing an endpoint, its source file (relative to {@code root}) and its lines. */
    public record ControllerMethod(Class<?> controller, Method method, String sourceFile, int firstLine, int lastLine) {
    }

    /** Rule 8: the response-branch occurrences of the controller method behind {@code endpoint}. */
    public static List<String> branchOccurrences(Path root, ControllerMethod controllerMethod) {
        String[] lines = JsonBoundaryScanner.blankNonCode(read(root.resolve(controllerMethod.sourceFile()))).split("\n", -1);
        List<String> occurrences = new ArrayList<>();
        for (int number = controllerMethod.firstLine(); number <= controllerMethod.lastLine(); number++) {
            Map<String, Integer> repeats = new HashMap<>();
            Matcher token = BRANCH_TOKEN.matcher(lines[number - 1]);
            while (token.find()) {
                String name = token.group(1) != null ? token.group(1) : token.group().startsWith(RETURN) ? RETURN : MONO_ERROR;
                int repeat = repeats.merge(name, 1, Integer::sum);
                occurrences.add(number + " " + name + (repeat > 1 ? REPEAT + repeat : ""));
            }
        }
        return occurrences;
    }

    /**
     * The implementation of {@code declared} (a method of an endpoint declaration) among the classes of
     * {@value #API_PACKAGE_PATH} in {@code mainClasses}: the declaration itself when it is a class, otherwise the class
     * that implements the interface and declares a method with the same name and parameter types.
     */
    public static ControllerMethod controllerMethod(Path root, Path mainClasses, Method declared) {
        Class<?> declaration = declared.getDeclaringClass();
        Class<?> controller = declaration.isInterface() ? implementation(mainClasses, declaration) : declaration;
        try {
            Method method = controller.getDeclaredMethod(declared.getName(), declared.getParameterTypes());
            LineRange range = lineRange(controller, method);
            String sourceFile = SERVER_MAIN + "/" + controller.getPackageName().replace('.', '/') + "/" + range.sourceFile();
            if (!Files.isRegularFile(root.resolve(sourceFile))) {
                throw new IllegalStateException("no source file " + sourceFile + " for " + controller.getName());
            }
            return new ControllerMethod(controller, method, sourceFile, range.first(), range.last());
        } catch (NoSuchMethodException e) {
            throw new IllegalStateException(controller.getName() + " does not declare " + declared, e);
        }
    }

    private record LineRange(String sourceFile, int first, int last) {
    }

    private static LineRange lineRange(Class<?> controller, Method method) {
        String descriptor = Type.getMethodDescriptor(method);
        String lambdaPrefix = LAMBDA_PREFIX + method.getName() + "$";
        int[] range = {Integer.MAX_VALUE, Integer.MIN_VALUE};
        String[] source = new String[1];
        try (InputStream in = controller.getResourceAsStream(controller.getSimpleName() + CLASS_SUFFIX)) {
            if (in == null) {
                throw new IllegalStateException("no class file for " + controller.getName());
            }
            new ClassReader(in).accept(new ClassVisitor(SpringAsmInfo.ASM_VERSION) {
                @Override
                public void visitSource(String file, String debug) {
                    source[0] = file;
                }

                @Override
                public MethodVisitor visitMethod(int access, String name, String desc, String signature, String[] exceptions) {
                    boolean own = name.equals(method.getName()) && desc.equals(descriptor);
                    if (!own && !name.startsWith(lambdaPrefix)) {
                        return null;
                    }
                    return new MethodVisitor(SpringAsmInfo.ASM_VERSION) {
                        @Override
                        public void visitLineNumber(int line, Label start) {
                            range[0] = Math.min(range[0], line);
                            range[1] = Math.max(range[1], line);
                        }
                    };
                }
            }, ClassReader.SKIP_FRAMES);
        } catch (IOException e) {
            throw new UncheckedIOException("cannot read the class file of " + controller.getName(), e);
        }
        if (source[0] == null || range[0] == Integer.MAX_VALUE) {
            throw new IllegalStateException(controller.getName() + "#" + method.getName() + " has no line numbers (compiled without -g?)");
        }
        return new LineRange(source[0], range[0], range[1]);
    }

    private static Class<?> implementation(Path mainClasses, Class<?> declaration) {
        String pattern = mainClasses.resolve(API_PACKAGE_PATH).toUri() + "/**/*" + CLASS_SUFFIX;
        CachingMetadataReaderFactory readers = new CachingMetadataReaderFactory();
        List<String> implementations = new ArrayList<>();
        try {
            for (Resource resource : new PathMatchingResourcePatternResolver().getResources(pattern)) {
                MetadataReader reader = readers.getMetadataReader(resource);
                if (!reader.getClassMetadata().isInterface()
                        && Arrays.asList(reader.getClassMetadata().getInterfaceNames()).contains(declaration.getName())) {
                    implementations.add(reader.getClassMetadata().getClassName());
                }
            }
            if (implementations.size() != 1) {
                throw new IllegalStateException(declaration.getName() + " has " + implementations.size() + " implementations: " + implementations);
            }
            return Class.forName(implementations.get(0), false, ContractSources.class.getClassLoader());
        } catch (IOException e) {
            throw new UncheckedIOException("cannot read class files matching " + pattern, e);
        } catch (ClassNotFoundException e) {
            throw new IllegalStateException("implementation of " + declaration.getName() + " is not loadable", e);
        }
    }

    private static String read(Path file) {
        try {
            return Files.readString(file, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("cannot read " + file, e);
        }
    }
}
