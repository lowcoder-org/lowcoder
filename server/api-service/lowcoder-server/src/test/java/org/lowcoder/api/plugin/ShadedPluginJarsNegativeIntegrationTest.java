package org.lowcoder.api.plugin;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.plugin.common.DatasourceConnector;
import org.lowcoder.sdk.plugin.common.QueryExecutor;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Enumeration;
import java.util.Iterator;
import java.util.List;
import java.util.function.Predicate;
import java.util.jar.Attributes;
import java.util.jar.JarFile;
import java.util.jar.JarOutputStream;
import java.util.jar.Manifest;
import java.util.zip.ZipEntry;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The cases in which {@link ShadedPluginJarsIntegrationTest} must fail, run against the real REST API plugin jar of the plugins
 * directory and altered copies of it in a directory of the test's own: the intact jar is found (the control, so the other cases fail
 * for their reason and not because the setup is wrong); a jar without its {@code META-INF/extensions.idx} loads and starts but offers no
 * extension, so the server's lookup by datasource type answers {@code PLUGIN_NOT_FOUND}; a jar whose manifest has no plugin id is not
 * loaded; an empty directory loads nothing.
 *
 * <p>Limits: one plugin jar stands for all (they are shaded and described the same way); the alterations are the two descriptor
 * files pf4j reads, not damage inside class files.
 */
public class ShadedPluginJarsNegativeIntegrationTest {

    static final String TAG = "[ShadedPluginJarsNegativeIntegrationTest] ";
    static final String RESTAPI_PLUGIN_ID = "restapi-plugin";
    static final String RESTAPI_TYPE = "restApi";
    static final String JAR_GLOB = "restApiPlugin-*.jar";
    static final String EXTENSIONS_INDEX = "META-INF/extensions.idx";
    static final String MANIFEST = "META-INF/MANIFEST.MF";
    static final String PLUGIN_ID_ATTRIBUTE = "Plugin-Id";
    static final String PLUGIN_NOT_FOUND_KEY = "PLUGIN_NOT_FOUND";

    @TempDir
    Path directory;

    private static Path shippedRestApiJar() throws IOException {
        Path plugins = Path.of(System.getProperty(ShadedPluginHarness.PLUGINS_DIR_PROPERTY, ""));
        assertTrue(Files.isDirectory(plugins), "the plugins directory " + plugins.toAbsolutePath() + " exists (-D" + ShadedPluginHarness.PLUGINS_DIR_PROPERTY + ")");
        try (DirectoryStream<Path> jars = Files.newDirectoryStream(plugins, JAR_GLOB)) {
            Iterator<Path> iterator = jars.iterator();
            if (!iterator.hasNext()) {
                throw new AssertionError("no " + JAR_GLOB + " in " + plugins.toAbsolutePath());
            }
            return iterator.next();
        }
    }

    /** A copy of {@code source} in {@code target} without the entries {@code drop} selects; the manifest, if kept, goes through {@code manifestEdit}. */
    private static void rewrite(Path source, Path target, Predicate<String> drop, java.util.function.Consumer<Manifest> manifestEdit) throws IOException {
        try (JarFile in = new JarFile(source.toFile()); OutputStream file = Files.newOutputStream(target); JarOutputStream out = new JarOutputStream(file)) {
            Enumeration<java.util.jar.JarEntry> entries = in.entries();
            while (entries.hasMoreElements()) {
                java.util.jar.JarEntry entry = entries.nextElement();
                if (drop.test(entry.getName())) {
                    continue;
                }
                if (MANIFEST.equals(entry.getName())) {
                    Manifest manifest = new Manifest(in.getInputStream(entry));
                    manifestEdit.accept(manifest);
                    out.putNextEntry(new ZipEntry(MANIFEST));
                    manifest.write(out);
                    out.closeEntry();
                    continue;
                }
                out.putNextEntry(new ZipEntry(entry.getName()));
                try (InputStream data = in.getInputStream(entry)) {
                    data.transferTo(out);
                }
                out.closeEntry();
            }
        }
    }

    private Path plugins(String name) throws IOException {
        return Files.createDirectory(directory.resolve(name));
    }

    @Test
    public void theIntactJarOffersTheConnectorAndTheExecutorTheOthersCasesAreMeasuredAgainst() throws IOException {
        Path plugins = plugins("intact");
        Files.copy(shippedRestApiJar(), plugins.resolve("restApiPlugin.jar"));
        try (ShadedPluginHarness harness = ShadedPluginHarness.over(plugins)) {
            assertTrue(harness.isStarted(RESTAPI_PLUGIN_ID), "the intact jar loads and starts");
            assertEquals(1, harness.extensions(DatasourceConnector.class, RESTAPI_PLUGIN_ID).size(), "its connector is found");
            assertEquals(1, harness.extensions(QueryExecutor.class, RESTAPI_PLUGIN_ID).size(), "its executor is found");
            assertNotNull(harness.metaInfoService().getDatasourceConnector(RESTAPI_TYPE), "the server's lookup by type finds the connector");
        }
    }

    @Test
    public void aJarWithoutItsExtensionIndexStartsButOffersNoExtensionAndTheServersLookupAnswersPluginNotFound() throws IOException {
        Path plugins = plugins("no-index");
        rewrite(shippedRestApiJar(), plugins.resolve("restApiPlugin.jar"), name -> EXTENSIONS_INDEX.equals(name), manifest -> { });
        try (ShadedPluginHarness harness = ShadedPluginHarness.over(plugins)) {
            assertTrue(harness.isStarted(RESTAPI_PLUGIN_ID), "the plugin itself loads and starts: " + harness.manager().getPlugins());
            List<?> connectors = harness.extensions(DatasourceConnector.class, RESTAPI_PLUGIN_ID);
            List<?> executors = harness.extensions(QueryExecutor.class, RESTAPI_PLUGIN_ID);
            System.out.println(TAG + "without " + EXTENSIONS_INDEX + ": connectors " + connectors + ", executors " + executors);
            assertTrue(connectors.isEmpty(), "no connector without the extension index: " + connectors);
            assertTrue(executors.isEmpty(), "no executor without the extension index: " + executors);

            BizException connectorFailure = assertThrows(BizException.class, () -> harness.metaInfoService().getDatasourceConnector(RESTAPI_TYPE));
            BizException executorFailure = assertThrows(BizException.class, () -> harness.metaInfoService().getQueryExecutor(RESTAPI_TYPE));
            System.out.println(TAG + "server lookups: " + connectorFailure.getError() + " " + connectorFailure.getMessageKey() + " / "
                    + executorFailure.getError() + " " + executorFailure.getMessageKey());
            assertEquals(BizError.NO_RESOURCE_FOUND, connectorFailure.getError());
            assertEquals(PLUGIN_NOT_FOUND_KEY, connectorFailure.getMessageKey());
            assertEquals(BizError.NO_RESOURCE_FOUND, executorFailure.getError());
            assertEquals(PLUGIN_NOT_FOUND_KEY, executorFailure.getMessageKey());
        }
    }

    @Test
    public void aJarWhoseManifestHasNoPluginIdIsNotLoaded() throws IOException {
        Path plugins = plugins("no-plugin-id");
        rewrite(shippedRestApiJar(), plugins.resolve("restApiPlugin.jar"), name -> false,
                manifest -> manifest.getMainAttributes().remove(new Attributes.Name(PLUGIN_ID_ATTRIBUTE)));
        try (ShadedPluginHarness harness = ShadedPluginHarness.over(plugins)) {
            System.out.println(TAG + "manifest without " + PLUGIN_ID_ATTRIBUTE + ": plugins " + harness.manager().getPlugins());
            assertFalse(harness.isStarted(RESTAPI_PLUGIN_ID), "the plugin is not started");
            assertTrue(harness.extensions(DatasourceConnector.class, RESTAPI_PLUGIN_ID).isEmpty(), "no connector");
            assertThrows(BizException.class, () -> harness.metaInfoService().getDatasourceConnector(RESTAPI_TYPE));
        }
    }

    @Test
    public void anEmptyPluginsDirectoryLoadsNothingAndEveryLookupAnswersPluginNotFound() throws IOException {
        Path plugins = plugins("empty");
        try (ShadedPluginHarness harness = ShadedPluginHarness.over(plugins)) {
            assertTrue(harness.manager().getPlugins().isEmpty(), "no plugin is loaded from an empty directory");
            for (String type : List.of(RESTAPI_TYPE, "postgres", "mongodb")) {
                BizException failure = assertThrows(BizException.class, () -> harness.metaInfoService().getDatasourceConnector(type), type);
                assertEquals(PLUGIN_NOT_FOUND_KEY, failure.getMessageKey(), type);
            }
        }
    }
}
