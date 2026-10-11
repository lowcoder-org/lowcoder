package org.lowcoder.sdk.contract;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Golden fixtures of the JSON contract (docs/API_PAYLOAD_TEST_PLAN.md §4, §7, §8.2).
 *
 * <p>Fixtures live under {@link #FIXTURE_DIRECTORY} of the module under test, addressed by a path relative to it,
 * for example {@code types/org.lowcoder.domain.folder.model.Folder.S1.json}.
 *
 * <ul>
 *   <li><b>Overlay.</b> With {@code -D}{@value #OVERLAY_PROPERTY}{@code =<dir>}, a fixture present in that directory
 *       (same relative path) is used instead of the module's. The mutation check of §8.2 changes fixtures there, so
 *       repository files are never touched.</li>
 *   <li><b>Creation only.</b> A missing fixture fails the test. With {@code -D}{@value #CREATE_MISSING_PROPERTY}
 *       {@code =true} the actual content is written to the module's fixture path first, and the test still fails, so
 *       a created fixture is always reviewed. An existing fixture is never written.</li>
 * </ul>
 *
 * <p>JSON fixtures are compared with {@link CanonicalJson#assertEquivalent}; text fixtures (rendered SQL, Mongo,
 * query strings) exactly.
 *
 * <p>Fixture paths must be relative and stay inside the fixture directory (and the overlay), both lexically and once
 * the symbolic links of their existing part are followed; anything else is an {@link IllegalArgumentException}. A
 * link created between that check and the read or write is not caught.
 *
 * <p>Limits: the module directory is the {@code basedir} system property that surefire and failsafe set, or the
 * working directory when it is absent; a test run from another directory resolves fixtures elsewhere. Created
 * fixtures hold the actual text unchanged, without pretty-printing, so their number lexemes and escapes are the
 * ones produced.
 */
public final class GoldenJson {

    public static final String FIXTURE_DIRECTORY = "src/test/resources/json-contract";
    public static final String OVERLAY_PROPERTY = "contract.fixtureOverlay";
    public static final String CREATE_MISSING_PROPERTY = "contract.createMissing";
    public static final String BASEDIR_PROPERTY = "basedir";
    public static final String WORKING_DIRECTORY_PROPERTY = "user.dir";

    private final Path fixtureRoot;
    private final Path overlayRoot;
    private final boolean createMissing;

    public GoldenJson(Path fixtureRoot, Path overlayRoot, boolean createMissing) {
        this.fixtureRoot = fixtureRoot;
        this.overlayRoot = overlayRoot;
        this.createMissing = createMissing;
    }

    /** The fixtures of the module under test, configured by the system properties above. */
    public static GoldenJson forModule() {
        Path moduleDirectory = Path.of(System.getProperty(BASEDIR_PROPERTY, System.getProperty(WORKING_DIRECTORY_PROPERTY)));
        String overlay = System.getProperty(OVERLAY_PROPERTY);
        return new GoldenJson(moduleDirectory.resolve(FIXTURE_DIRECTORY),
                overlay == null || overlay.isBlank() ? null : Path.of(overlay),
                Boolean.parseBoolean(System.getProperty(CREATE_MISSING_PROPERTY)));
    }

    /** Compares {@code actualJson} with the JSON fixture at {@code relativePath} by the §1.2 contract. */
    public void assertJson(String relativePath, String actualJson) {
        CanonicalJson.assertEquivalent(expected(relativePath, actualJson), actualJson);
    }

    /** Compares {@code actualText} with the text fixture at {@code relativePath} exactly. */
    public void assertText(String relativePath, String actualText) {
        String expected = expected(relativePath, actualText);
        if (!expected.equals(actualText)) {
            throw new AssertionError("rendered text differs from fixture " + relativePath
                    + "\nexpected: " + expected + "\nactual:   " + actualText);
        }
    }

    /** Reads a fixture used as test input, from the overlay when it has one. */
    public String read(String relativePath) {
        Path fixture = resolve(relativePath);
        if (!Files.exists(fixture)) {
            throw new AssertionError("missing input fixture " + fixture);
        }
        return readFile(fixture);
    }

    /** The fixture file used for {@code relativePath}: the overlay's when it exists there, else the module's. */
    public Path resolve(String relativePath) {
        if (overlayRoot != null) {
            Path overlaid = inside(overlayRoot, relativePath);
            if (Files.exists(overlaid)) {
                System.out.println("[contract] fixture " + relativePath + " read from overlay " + overlaid);
                return overlaid;
            }
        }
        return inside(fixtureRoot, relativePath);
    }

    /** {@code root} resolved with {@code relativePath}, which must be relative and must not leave {@code root}. */
    private static Path inside(Path root, String relativePath) {
        Path relative = Path.of(relativePath);
        if (relative.isAbsolute()) {
            throw new IllegalArgumentException("fixture path must be relative to " + root + ": " + relativePath);
        }
        Path normalizedRoot = root.toAbsolutePath().normalize();
        Path resolved = normalizedRoot.resolve(relative).normalize();
        if (!resolved.startsWith(normalizedRoot) || resolved.equals(normalizedRoot) || leavesThroughLink(normalizedRoot, resolved)) {
            throw new IllegalArgumentException("fixture path must stay inside " + root + ": " + relativePath);
        }
        return resolved;
    }

    /**
     * Whether the deepest existing part of {@code resolved} lies outside {@code root} once symbolic links are
     * followed. A root that does not exist yet has no links to follow.
     */
    private static boolean leavesThroughLink(Path root, Path resolved) {
        if (!Files.exists(root)) {
            return false;
        }
        Path existing = resolved;
        while (existing != null && !Files.exists(existing)) {
            existing = existing.getParent();
        }
        try {
            return existing == null || !existing.toRealPath().startsWith(root.toRealPath());
        } catch (IOException e) {
            throw new UncheckedIOException("cannot resolve fixture path " + resolved, e);
        }
    }

    private String expected(String relativePath, String actual) {
        Path fixture = resolve(relativePath);
        if (Files.exists(fixture)) {
            return readFile(fixture);
        }
        Path target = inside(fixtureRoot, relativePath);
        if (!createMissing) {
            throw new AssertionError("missing fixture " + target + "; run with -D" + CREATE_MISSING_PROPERTY
                    + "=true to create it from the actual value, then review it\nactual: " + actual);
        }
        try {
            Files.createDirectories(target.getParent());
            Files.writeString(target, actual, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("cannot create fixture " + target, e);
        }
        throw new AssertionError("created fixture " + target + " from the actual value; review it and run again");
    }

    private static String readFile(Path fixture) {
        try {
            return Files.readString(fixture, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("cannot read fixture " + fixture, e);
        }
    }
}
