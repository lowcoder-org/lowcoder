package org.lowcoder.sdk.contract;

import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Self-test of {@link GoldenJson}: fixture lookup, the overlay, and the creation-only policy (plan §7, §8.2).
 *
 * <p>{@link #moduleFixtureMatches()} reads the real module fixture {@value #SELFTEST_FIXTURE} through
 * {@link GoldenJson#forModule()}, so the §8.2 mutation check can be run against it with
 * {@code -Dcontract.fixtureOverlay}.
 */
public class GoldenJsonTest {

    private static final String SELFTEST_FIXTURE = "selftest/golden.json";
    private static final String SELFTEST_ACTUAL = "{\"name\":\"GoldenJsonTest\",\"count\":1001,\"ratio\":1.50}";
    private static final String TYPE_FIXTURE = "types/example.S1.json";
    private static final String TEXT_FIXTURE = "boundary/example/render.txt";

    @Rule
    public TemporaryFolder folder = new TemporaryFolder();

    private Path fixtures() throws IOException {
        return folder.newFolder("fixtures").toPath();
    }

    private static void write(Path file, String content) throws IOException {
        Files.createDirectories(file.getParent());
        Files.writeString(file, content, StandardCharsets.UTF_8);
    }

    @Test
    public void moduleFixtureMatches() {
        GoldenJson golden = GoldenJson.forModule();
        System.out.println("[GoldenJsonTest] module fixture " + golden.resolve(SELFTEST_FIXTURE));
        golden.assertJson(SELFTEST_FIXTURE, SELFTEST_ACTUAL);
    }

    @Test
    public void matchingFixturePassesAndDifferenceFails() throws IOException {
        Path root = fixtures();
        write(root.resolve(TYPE_FIXTURE), "{\"a\":1}");
        GoldenJson golden = new GoldenJson(root, null, false);
        golden.assertJson(TYPE_FIXTURE, "{ \"a\": 1 }");
        assertThatThrownBy(() -> golden.assertJson(TYPE_FIXTURE, "{\"a\":1.0}"))
                .isInstanceOf(AssertionError.class).hasMessageContaining("$.a: number lexeme differs");
    }

    @Test
    public void overlayFixtureWinsOverModuleFixture() throws IOException {
        Path root = fixtures();
        Path overlay = folder.newFolder("overlay").toPath();
        write(root.resolve(TYPE_FIXTURE), "{\"a\":1}");
        write(overlay.resolve(TYPE_FIXTURE), "{\"b\":1}");
        GoldenJson golden = new GoldenJson(root, overlay, false);
        assertThat(golden.resolve(TYPE_FIXTURE)).isEqualTo(overlay.resolve(TYPE_FIXTURE));
        assertThatThrownBy(() -> golden.assertJson(TYPE_FIXTURE, "{\"a\":1}"))
                .isInstanceOf(AssertionError.class).hasMessageContaining("$.b: missing property");
        assertThat(golden.resolve(TEXT_FIXTURE)).as("a fixture absent from the overlay comes from the module")
                .isEqualTo(root.resolve(TEXT_FIXTURE));
    }

    @Test
    public void missingFixtureFailsWithoutCreating() throws IOException {
        Path root = fixtures();
        GoldenJson golden = new GoldenJson(root, null, false);
        assertThatThrownBy(() -> golden.assertJson(TYPE_FIXTURE, "{\"a\":1}"))
                .isInstanceOf(AssertionError.class).hasMessageContaining("missing fixture")
                .hasMessageContaining(GoldenJson.CREATE_MISSING_PROPERTY);
        assertThat(root.resolve(TYPE_FIXTURE)).doesNotExist();
    }

    @Test
    public void createMissingWritesTheActualTextAndStillFails() throws IOException {
        Path root = fixtures();
        GoldenJson golden = new GoldenJson(root, null, true);
        String actual = "{\"n\":1.50,\"s\":\"\\u00e9\"}";
        assertThatThrownBy(() -> golden.assertJson(TYPE_FIXTURE, actual))
                .isInstanceOf(AssertionError.class).hasMessageContaining("created fixture");
        assertThat(Files.readString(root.resolve(TYPE_FIXTURE), StandardCharsets.UTF_8)).isEqualTo(actual);
        golden.assertJson(TYPE_FIXTURE, actual);
    }

    @Test
    public void existingFixtureIsNeverOverwritten() throws IOException {
        Path root = fixtures();
        write(root.resolve(TYPE_FIXTURE), "{\"a\":1}");
        GoldenJson golden = new GoldenJson(root, null, true);
        assertThatThrownBy(() -> golden.assertJson(TYPE_FIXTURE, "{\"a\":2}")).isInstanceOf(AssertionError.class);
        assertThat(Files.readString(root.resolve(TYPE_FIXTURE), StandardCharsets.UTF_8)).isEqualTo("{\"a\":1}");
    }

    @Test
    public void textFixturesAreComparedExactly() throws IOException {
        Path root = fixtures();
        write(root.resolve(TEXT_FIXTURE), "WHERE a = '{\"k\":\"é\"}'");
        GoldenJson golden = new GoldenJson(root, null, false);
        golden.assertText(TEXT_FIXTURE, "WHERE a = '{\"k\":\"é\"}'");
        assertThatThrownBy(() -> golden.assertText(TEXT_FIXTURE, "WHERE a = '{\"k\":\"\\u00e9\"}'"))
                .isInstanceOf(AssertionError.class).hasMessageContaining("rendered text differs");
    }

    @Test
    public void fixturePathsCannotLeaveTheFixtureRoot() throws IOException {
        Path root = fixtures();
        GoldenJson golden = new GoldenJson(root, null, true);
        String escaping = "../outside.json";
        String absolute = root.resolve("types/absolute.json").toAbsolutePath().toString();
        assertThatThrownBy(() -> golden.assertJson(escaping, "{}"))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("must stay inside");
        assertThatThrownBy(() -> golden.assertJson(absolute, "{}"))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("must be relative");
        assertThat(root.resolve(escaping).normalize()).as("nothing created outside the root").doesNotExist();
    }

    @Test
    public void fixturePathsCannotLeaveTheFixtureRootThroughASymlink() throws IOException {
        Path root = fixtures();
        Path outside = folder.newFolder("outside").toPath();
        Files.createSymbolicLink(root.resolve("link"), outside);
        GoldenJson golden = new GoldenJson(root, null, true);
        assertThatThrownBy(() -> golden.assertJson("link/created.json", "{}"))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("must stay inside");
        assertThat(outside.resolve("created.json")).as("nothing created through the symlink").doesNotExist();
    }

    @Test
    public void readReturnsInputFixturesFromTheOverlay() throws IOException {
        Path root = fixtures();
        Path overlay = folder.newFolder("overlay").toPath();
        write(root.resolve(TYPE_FIXTURE), "module");
        write(overlay.resolve(TYPE_FIXTURE), "overlay");
        assertThat(new GoldenJson(root, overlay, false).read(TYPE_FIXTURE)).isEqualTo("overlay");
        assertThat(new GoldenJson(root, null, false).read(TYPE_FIXTURE)).isEqualTo("module");
        assertThatThrownBy(() -> new GoldenJson(root, null, false).read(TEXT_FIXTURE))
                .isInstanceOf(AssertionError.class).hasMessageContaining("missing input fixture");
    }
}
