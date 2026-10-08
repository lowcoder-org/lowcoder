package org.lowcoder.api.framework.exception;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.ResourceBundle;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.JsonBoundaryClassification;
import org.lowcoder.api.contract.support.JsonBoundaryScanner;

/**
 * Every message key that main code passes as a literal, or as a literal-valued identifier of the same file, to one of
 * the error and message helpers listed below has a text in {@code locale_en} and {@code locale_zh}, and the two bundles
 * have the same keys (T109: BF-110 {@code JS_CODE_DATASOURCE_NAME}, BF-115
 * {@code GRAPHQL_EXECUTION_ERROR} and BF-157 {@code BUNDLE_NOT_FOUND} / {@code CANT_FIND_BUNDLE} were in no bundle, so
 * {@code LocaleUtils.getMessage} answered the "Oops! Service is busy" text of {@code INTERNAL_SERVER_ERROR}).
 * <p>
 * The main sources of {@link JsonBoundaryScanner#mainSourceFiles} (sdk, plugins, server, domain, infra) are read with
 * their comments blanked. A key is the message-key argument of one of these shapes ({@link Shape}): the second argument
 * of {@code new BizException(}, {@code new PluginException(}, {@code ofError(}, {@code ofException(},
 * {@code deferredError(}, {@code ofPluginError(}, {@code ofPluginException(}, {@code wrapException(},
 * {@code propagateError(}, {@code ofErrorWithHeaders(} and {@code QueryExecutionResult.error(}; the third of
 * {@code check(} ({@code Preconditions.check}, also statically imported; a method declaration of one of these names is
 * not a call); the second of {@code LocaleUtils.getMessage(}; the first of {@code new LocaleMessage(}; and the
 * argument of {@code .add(} inside a {@code validateConfig} body, whose set holds message keys
 * ({@code DatasourceServiceImpl} reads them with {@code LocaleUtils.getMessage}). An argument is a string literal, or an
 * identifier declared in the same file as {@code String NAME = "lit"} or {@code String NAME = cond ? "a" : "b"} (each
 * declaration of that name in the file counts). An identifier with no such declaration, a parameter or a constant of
 * another file, is a key known only at run time and must be listed in {@link #RUN_TIME_KEYS} with its reason. A call of
 * a shape whose argument is neither (an expression such as {@code e.getMessageKey()} or {@code cond ? "a" : "b"}, another
 * overload) must be listed in {@link #UNREAD_CALLS} with its reason. A listed entry that is no longer found fails as well.
 * <p>
 * Limits: the keys behind {@link #RUN_TIME_KEYS} and {@link #UNREAD_CALLS} are not checked here (each reason names where
 * they are); a key passed to a helper of another name, or held in an annotation, an enum or a map literal
 * ({@code SystemGroups}), is not read; a declaration is told from a call by the word before its name only. {@code locale_de} is partial (NEW-35); only that its keys are keys of {@code locale_en} is asserted.
 */
class MessageKeyBundlesTest {

    private static final String BUNDLE_BASE_NAME = "locale";
    private static final List<Locale> REQUIRED_LOCALES = List.of(Locale.ENGLISH, Locale.CHINESE);
    private static final Locale PARTIAL_LOCALE = Locale.GERMAN;
    private static final ResourceBundle.Control NO_FALLBACK =
            ResourceBundle.Control.getNoFallbackControl(ResourceBundle.Control.FORMAT_PROPERTIES);

    private static final String KEY_ARGUMENT = "(\"(?:[^\"\\\\\\n]|\\\\.)*\"|[A-Za-z_][A-Za-z0-9_]*)\\s*[,)]";
    private static final String FIRST_ARGUMENT = "\\s*[A-Za-z_][\\w.]*\\s*,\\s*";
    /** The word before a call that makes it a call although a word precedes it; any other word makes it a declaration. */
    private static final Set<String> WORDS_BEFORE_A_CALL = Set.of("return", "throw", "else", "case", "yield");
    private static final Pattern WORD_BEFORE = Pattern.compile("(\\w+)\\s*$");
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");
    private static final int UNREAD_CALL_LENGTH = 80;
    private static final String GENERIC_CLOSE = ">";
    private static final String LAMBDA_ARROW = "->";
    private static final String ARRAY_CLOSE = "]";
    private static final char RECEIVER_DOT = '.';
    private static final Pattern VALIDATE_CONFIG_BODY = Pattern.compile("\\bvalidateConfig\\s*\\([^)]*\\)\\s*(?:throws[^{;]*)?\\{");
    private static final Pattern STRING_DECLARATION = Pattern.compile("\\bString\\s+([A-Za-z_]\\w*)\\s*=\\s*([^;]*);");
    private static final Pattern CONSTANT_VALUE = Pattern.compile("\\s*(?:[^\";]*\\?\\s*)?\"[^\"]*\"(?:\\s*:\\s*\"[^\"]*\")?\\s*");
    private static final Pattern LITERAL = Pattern.compile("\"([^\"]*)\"");
    private static final String QUOTE = "\"";
    private static final char NEWLINE = '\n';
    private static final char OPEN_BRACE = '{';
    private static final char CLOSE_BRACE = '}';
    private static final String RUN_TIME_KEY_SEPARATOR = "#";

    /** {@code <file name>#<identifier>} of a message-key argument known only at run time, with the reason. */
    private static final Map<String, String> RUN_TIME_KEYS = Map.of(
            "BizException.java#messageKey", "a constructor parameter; each caller's key is read at its new BizException( site",
            "PluginException.java#messageKey", "a constructor parameter; each caller's key is read at its new PluginException( site",
            "ExceptionUtils.java#messageKey", "a helper parameter; each caller's key is read at its ofError( and similar site",
            "Preconditions.java#messageKey", "a helper parameter; each caller's key is read at its check( site",
            "QueryExecutionResult.java#messageKey",
            "the result's field, wrapped in a LocaleMessage; each key is read at its QueryExecutionResult.error( site",
            "DatasourceTestResult.java#localeErrorMsg", "a LocaleMessage built by the caller; its literal keys are read at new LocaleMessage(",
            "QueryResultView.java#msg", "a hint LocaleMessage of the result; its literal keys are read at new LocaleMessage(",
            "SystemGroups.java#key", "a value of SYSTEM_GROUP_NAME_MAP (two literals in a map, not read: a limit)",
            "DatasourceServiceImpl.java#key", "each key of a plugin's validateConfig set, read at its .add( site");

    /** {@code <file name>#<call text>} of a call of a shape whose message-key argument is not read, with the reason. */
    private static final Map<String, String> UNREAD_CALLS = Map.of(
            "CustomErrorWebExceptionHandler.java#LocaleUtils.getMessage(locale, bizException.getMessageKey(), bizException.getArg",
            "a BizException's own key, read at its new BizException( or helper site",
            "DatasourceTestResult.java#new LocaleMessage(pluginException.getMessageKey(), pluginException.getArgs());",
            "a PluginException's own key, read at its new PluginException( or helper site",
            "QueryExecutionServiceImpl.java#QueryExecutionResult.error(pluginException)))",
            "the PluginException overload; the exception's key is read at its new PluginException( or helper site",
            "QueryResultView.java#LocaleUtils.getMessage(locale, queryResult.getLocaleMessage()) : queryResult.get",
            "the result's LocaleMessage, whose key is read at its QueryExecutionResult.error( site");

    /** For each shape, a key it must find, so that a shape that stops matching fails the self-check. */
    private static final Map<Shape, String> KNOWN_KEYS = Map.of(
            Shape.ERROR_HELPER, "GRAPHQL_EXECUTION_ERROR",
            Shape.CHECK, "INVALID_CONNECTION_STRING",
            Shape.GET_MESSAGE, "JS_CODE_DATASOURCE_NAME",
            Shape.NEW_LOCALE_MESSAGE, "DATASOURCE_TEST_GENERIC_ERROR",
            Shape.VALIDATE_CONFIG_ADD, "INVALID_JDBC_URL_CONFIG");
    /** A key reached through a local {@code String messageKey = cond ? "a" : "b"} (ApplicationApiServiceImpl). */
    private static final String TERNARY_KEY = "NO_PERMISSION_TO_VIEW";

    /** A call (its name and opening parenthesis) and the arguments up to the message key, whose group 1 is the key. */
    enum Shape {
        ERROR_HELPER("(?:\\bnew\\s+(?:BizException|PluginException)|\\bofError|\\bofException|\\bdeferredError|\\bofPluginError"
                + "|\\bofPluginException|\\bwrapException|\\bpropagateError|\\bofErrorWithHeaders|\\bQueryExecutionResult\\.error)\\s*\\(",
                FIRST_ARGUMENT + KEY_ARGUMENT),
        /** Preconditions.check, also statically imported; not another receiver's {@code .check(}. */
        CHECK("(?:\\bPreconditions\\.|(?<![\\w.]))check\\s*\\(", "[^,;]+," + FIRST_ARGUMENT + KEY_ARGUMENT),
        GET_MESSAGE("\\bLocaleUtils\\.getMessage\\s*\\(", "\\s*[^,;]+,\\s*" + KEY_ARGUMENT),
        NEW_LOCALE_MESSAGE("\\bnew\\s+LocaleMessage\\s*\\(", "\\s*" + KEY_ARGUMENT),
        /** Matched inside {@code validateConfig} bodies only. */
        VALIDATE_CONFIG_ADD("\\.add\\s*\\(", "\\s*" + KEY_ARGUMENT);

        private final Pattern call;
        private final Pattern arguments;

        Shape(String call, String arguments) {
            this.call = Pattern.compile(call);
            this.arguments = Pattern.compile(arguments);
        }
    }

    record Use(Shape shape, String key, String file, int line) {
        String location() {
            return file + ":" + line + " (" + shape + ")";
        }
    }

    private static List<Use> uses;
    private static Set<String> unresolved;
    private static Set<String> unread;

    @BeforeAll
    static void scanMainSources() {
        Path root = JsonBoundaryClassification.apiServiceRoot();
        Map<String, String> sources = new LinkedHashMap<>();
        for (String relative : JsonBoundaryScanner.mainSourceFiles(root)) {
            sources.put(relative, JsonBoundaryScanner.blankComments(read(root.resolve(relative))));
        }
        Map<String, Map<String, List<String>>> declarations = declarations(sources);
        uses = new ArrayList<>();
        unresolved = new TreeSet<>();
        unread = new TreeSet<>();
        sources.forEach((file, code) -> {
            for (Shape shape : Shape.values()) {
                for (int[] range : ranges(shape, code)) {
                    Matcher call = shape.call.matcher(code).region(range[0], range[1]);
                    while (call.find()) {
                        if (isDeclaration(code, call.start())) {
                            continue;
                        }
                        Matcher matcher = shape.arguments.matcher(code).region(call.end(), range[1]);
                        if (!matcher.lookingAt()) {
                            unread.add(fileName(file) + RUN_TIME_KEY_SEPARATOR + callText(code, call.start()));
                            continue;
                        }
                        String argument = matcher.group(1);
                        int line = lineOf(code, matcher.start(1));
                        List<String> keys = resolve(argument, declarations.getOrDefault(file, Map.of()));
                        if (keys.isEmpty()) {
                            unresolved.add(fileName(file) + RUN_TIME_KEY_SEPARATOR + argument);
                        }
                        keys.forEach(key -> uses.add(new Use(shape, key, file, line)));
                    }
                }
            }
        });
        System.out.println("[MessageKeyBundlesTest] " + sources.size() + " files, " + uses.size() + " uses, "
                + uses.stream().map(Use::key).distinct().count() + " distinct keys, run-time arguments " + unresolved
                + ", unread calls " + unread);
    }

    @Test
    void everyMessageKeyOfMainCodeHasATextInEnglishAndChinese() {
        for (Locale locale : REQUIRED_LOCALES) {
            Set<String> bundleKeys = bundle(locale).keySet();
            Map<String, List<String>> missing = new TreeMap<>();
            for (Use use : uses) {
                if (!bundleKeys.contains(use.key())) {
                    missing.computeIfAbsent(use.key(), key -> new ArrayList<>()).add(use.location());
                }
            }
            System.out.println("[MessageKeyBundlesTest] " + locale + ": " + bundleKeys.size() + " keys, missing " + missing);
            assertThat(missing).as("message keys used by main code that locale_%s lacks", locale).isEmpty();
        }
    }

    @Test
    void theEnglishAndChineseBundlesHaveTheSameKeys() {
        Set<String> english = new TreeSet<>(bundle(Locale.ENGLISH).keySet());
        Set<String> chinese = new TreeSet<>(bundle(Locale.CHINESE).keySet());
        System.out.println("[MessageKeyBundlesTest] en " + english.size() + " keys, zh " + chinese.size() + " keys");
        assertThat(chinese).as("locale_zh against locale_en").isEqualTo(english);
    }

    @Test
    void thePartialGermanBundleHasOnlyEnglishKeys() {
        Set<String> english = bundle(Locale.ENGLISH).keySet();
        Set<String> german = new TreeSet<>(bundle(PARTIAL_LOCALE).keySet());
        Set<String> notEnglish = german.stream().filter(key -> !english.contains(key)).collect(Collectors.toCollection(TreeSet::new));
        System.out.println("[MessageKeyBundlesTest] de " + german.size() + " of " + english.size() + " keys (NEW-35), not in en " + notEnglish);
        assertThat(notEnglish).isEmpty();
    }

    @Test
    void theArgumentsKnownOnlyAtRunTimeAreExactlyTheListedOnes() {
        System.out.println("[MessageKeyBundlesTest] run-time arguments " + unresolved + ", listed " + new TreeSet<>(RUN_TIME_KEYS.keySet()));
        assertThat(unresolved).isEqualTo(new TreeSet<>(RUN_TIME_KEYS.keySet()));
    }

    @Test
    void theCallsWhoseKeyIsNotReadAreExactlyTheListedOnes() {
        System.out.println("[MessageKeyBundlesTest] unread calls " + unread + ", listed " + new TreeSet<>(UNREAD_CALLS.keySet()));
        assertThat(unread).isEqualTo(new TreeSet<>(UNREAD_CALLS.keySet()));
    }

    @Test
    void everyShapeFindsAKnownKey() {
        KNOWN_KEYS.forEach((shape, key) -> {
            List<String> found = uses.stream().filter(use -> use.shape() == shape && use.key().equals(key)).map(Use::location).toList();
            System.out.println("[MessageKeyBundlesTest] " + shape + " finds " + key + " at " + found);
            assertThat(found).as("%s finds %s", shape, key).isNotEmpty();
        });
        assertThat(uses).as("a key reached through a ternary declaration").anyMatch(use -> use.key().equals(TERNARY_KEY));
    }

    /**
     * Whether the name at {@code start} is declared there (a type or a modifier before it) rather than called; a call
     * that starts at its receiver's dot ({@code .add(}) is a call.
     */
    private static boolean isDeclaration(String code, int start) {
        if (code.charAt(start) == RECEIVER_DOT) {
            return false;
        }
        Matcher word = WORD_BEFORE.matcher(code.substring(Math.max(0, start - UNREAD_CALL_LENGTH), start));
        if (word.find()) {
            return !WORDS_BEFORE_A_CALL.contains(word.group(1));
        }
        String before = code.substring(0, start).stripTrailing();
        return (before.endsWith(GENERIC_CLOSE) && !before.endsWith(LAMBDA_ARROW)) || before.endsWith(ARRAY_CLOSE);
    }

    /** The call from its name to the end of its line, whitespace collapsed, at most {@link #UNREAD_CALL_LENGTH} characters. */
    private static String callText(String code, int start) {
        int lineEnd = code.indexOf(NEWLINE, start);
        String text = WHITESPACE.matcher(code.substring(start, lineEnd < 0 ? code.length() : lineEnd)).replaceAll(" ").strip();
        return text.substring(0, Math.min(text.length(), UNREAD_CALL_LENGTH));
    }

    /** The code ranges a shape is matched in: the whole file, or the {@code validateConfig} bodies. */
    private static List<int[]> ranges(Shape shape, String code) {
        if (shape != Shape.VALIDATE_CONFIG_ADD) {
            return List.of(new int[] {0, code.length()});
        }
        String blanked = JsonBoundaryScanner.blankNonCode(code);
        List<int[]> bodies = new ArrayList<>();
        Matcher matcher = VALIDATE_CONFIG_BODY.matcher(blanked);
        while (matcher.find()) {
            int depth = 1;
            int i = matcher.end();
            while (i < blanked.length() && depth > 0) {
                char c = blanked.charAt(i++);
                depth += c == OPEN_BRACE ? 1 : c == CLOSE_BRACE ? -1 : 0;
            }
            bodies.add(new int[] {matcher.end(), i});
        }
        return bodies;
    }

    /** Per file, the literal values of each {@code String} identifier declared with literals only. */
    private static Map<String, Map<String, List<String>>> declarations(Map<String, String> sources) {
        Map<String, Map<String, List<String>>> declarations = new LinkedHashMap<>();
        sources.forEach((file, code) -> {
            Matcher matcher = STRING_DECLARATION.matcher(code);
            while (matcher.find()) {
                if (CONSTANT_VALUE.matcher(matcher.group(2)).matches()) {
                    List<String> values = LITERAL.matcher(matcher.group(2)).results().map(result -> result.group(1)).toList();
                    declarations.computeIfAbsent(file, f -> new LinkedHashMap<>())
                            .computeIfAbsent(matcher.group(1), name -> new ArrayList<>()).addAll(values);
                }
            }
        });
        return declarations;
    }

    /** The keys an argument stands for: a literal's text, or the values of the file's declarations of it; empty if none. */
    private static List<String> resolve(String argument, Map<String, List<String>> fileDeclarations) {
        if (argument.startsWith(QUOTE)) {
            return List.of(argument.substring(1, argument.length() - 1));
        }
        return fileDeclarations.getOrDefault(argument, List.of());
    }

    private static ResourceBundle bundle(Locale locale) {
        return ResourceBundle.getBundle(BUNDLE_BASE_NAME, locale, NO_FALLBACK);
    }

    private static int lineOf(String code, int offset) {
        int line = 1;
        for (int i = 0; i < offset; i++) {
            if (code.charAt(i) == NEWLINE) {
                line++;
            }
        }
        return line;
    }

    private static String fileName(String relative) {
        return relative.substring(relative.lastIndexOf('/') + 1);
    }

    private static String read(Path file) {
        try {
            return Files.readString(file, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
