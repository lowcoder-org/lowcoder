package org.lowcoder.api.framework.plugin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.ServiceLoader;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.lowcoder.api.framework.plugin.PluginTestSupport.MissingBase;
import org.lowcoder.api.framework.plugin.PluginTestSupport.OrphanClass;
import org.lowcoder.api.framework.plugin.PluginTestSupport.RecordingPlugin;
import org.lowcoder.api.framework.plugin.PluginTestSupport.SecondPlugin;
import org.lowcoder.plugin.api.LowcoderPlugin;
import org.lowcoder.sdk.config.CommonConfig;
import org.springframework.boot.system.ApplicationHome;

/**
 * Tests of {@link PathBasedPluginLoader} and {@link PluginClassLoader} with real jars built in a {@code @TempDir}.
 * {@code PathBasedPluginLoader.cachedPluginJars} is static and keyed by the directory list, so every test uses its
 * own temporary directory (a unique key); the cache is deliberately never reset.
 *
 * <p>BF-083 (fixed; was pinned under D-6 as the plan §9 row "PluginClassLoader.loadClass returns null after a
 * NoClassDefFoundError ..., against the ClassLoader contract"):
 * {@link #loadClass_classWithAMissingSuperclass_throwsTheNoClassDefFoundErrorBF083}.
 */
class PluginLoadingTest {

    @TempDir
    Path tempDir;

    private PathBasedPluginLoader loader(String... pluginDirs) {
        CommonConfig common = new CommonConfig();
        common.setPluginDirs(List.of(pluginDirs));
        ApplicationHome home = mock(ApplicationHome.class);
        when(home.getDir()).thenReturn(tempDir.toFile());
        return new PathBasedPluginLoader(common, home);
    }

    // -------------------------------------------------------------- discovery

    /** Catches plugins being missed or foreign files being loaded: discovery is recursive and {@code .jar} only (any case). */
    @Test
    void findPluginsJars_isRecursive_andOnlyTakesJarFiles() throws IOException {
        Path root = tempDir.resolve("plugins-recursive");
        Path top = PluginTestSupport.jar(root, "a.jar", List.of());
        Path nested = PluginTestSupport.jar(root.resolve("sub/deeper"), "b.JAR", List.of());
        Files.writeString(root.resolve("c.txt"), "text");
        Files.writeString(root.resolve("d.jar.bak"), "backup");
        Files.createDirectories(root.resolve("folder.jar"));

        List<String> found = loader(root.toString()).findPluginsJars();

        assertThat(found).containsExactlyInAnyOrder(top.toString(), nested.toString());
        System.out.println("[PluginLoadingTest] found " + found);
    }

    /** Catches a relative plugin directory being resolved against the working directory instead of the application home. */
    @Test
    void findPluginsJars_resolvesARelativeDirectoryAgainstTheApplicationHome() throws IOException {
        Path jar = PluginTestSupport.jar(tempDir.resolve("relative-plugins"), "r.jar", List.of());

        List<String> found = loader("relative-plugins").findPluginsJars();

        assertThat(found).containsExactly(jar.toAbsolutePath().normalize().toString());
        System.out.println("[PluginLoadingTest] relative dir -> " + found);
    }

    /** Catches blank directory entries and unreadable directories breaking discovery. */
    @Test
    void findPluginsJars_skipsBlankEntries_andAMissingDirectoryYieldsNothing() throws IOException {
        Path root = tempDir.resolve("plugins-blank");
        Path jar = PluginTestSupport.jar(root, "x.jar", List.of());

        assertThat(loader("", "   ", root.toString()).findPluginsJars()).containsExactly(jar.toString());
        assertThat(loader(tempDir.resolve("does-not-exist").toString()).findPluginsJars()).isEmpty();
        System.out.println("[PluginLoadingTest] blank entries skipped, missing directory -> empty");
    }

    /**
     * Documents the staleness of the static cache: the jar list of a directory list is computed once per JVM, so a
     * jar added afterwards is not found by a later loader with the same directories.
     */
    @Test
    void findPluginsJars_isCachedPerDirectoryList_soLaterJarsAreNotFound() throws IOException {
        Path root = tempDir.resolve("plugins-cached");
        PluginTestSupport.jar(root, "first.jar", List.of());
        assertThat(loader(root.toString()).findPluginsJars()).hasSize(1);

        PluginTestSupport.jar(root, "added-later.jar", List.of());

        assertThat(loader(root.toString()).findPluginsJars()).as("the cached list is returned").hasSize(1);
        System.out.println("[PluginLoadingTest] a jar added after the first scan is not found (static cache)");
    }

    // ------------------------------------------------------------ loadPlugins

    /** Catches plugins not being loaded from a jar, or being loaded by the application class loader. */
    @Test
    void loadPlugins_loadsTheServicesOfEveryJar_throughThePluginClassLoader() throws IOException {
        Path root = tempDir.resolve("plugins-load");
        PluginTestSupport.jar(root, "one.jar", List.of(RecordingPlugin.class), RecordingPlugin.class);
        PluginTestSupport.jar(root, "two.jar", List.of(SecondPlugin.class), RecordingPlugin.class, SecondPlugin.class);

        List<LowcoderPlugin> plugins = loader(root.toString()).loadPlugins();

        assertThat(plugins).extracting(LowcoderPlugin::pluginId).containsExactlyInAnyOrder("recording-plugin", "second-plugin");
        assertThat(plugins).allSatisfy(plugin -> {
            assertThat(plugin.getClass().getClassLoader()).isInstanceOf(PluginClassLoader.class);
            assertThat(plugin.getClass()).isNotEqualTo(RecordingPlugin.class);
        });
        System.out.println("[PluginLoadingTest] loaded " + plugins.stream().map(LowcoderPlugin::pluginId).toList());
    }

    /** Catches one broken jar taking the others down: a corrupt jar and a jar without services entry yield nothing. */
    @Test
    void loadPlugins_skipsACorruptJar_andAJarWithoutAServicesEntry() throws IOException {
        Path root = tempDir.resolve("plugins-mixed");
        PluginTestSupport.jar(root, "good.jar", List.of(RecordingPlugin.class), RecordingPlugin.class);
        PluginTestSupport.jar(root, "no-services.jar", List.of(), SecondPlugin.class, RecordingPlugin.class);
        Files.writeString(root.resolve("corrupt.jar"), "this is not a zip file");

        List<LowcoderPlugin> plugins = loader(root.toString()).loadPlugins();

        assertThat(plugins).extracting(LowcoderPlugin::pluginId).containsExactly("recording-plugin");
        System.out.println("[PluginLoadingTest] corrupt jar and jar without services skipped, loaded " + plugins.size());
    }

    /**
     * A services entry naming a class that is not in the jar makes the ServiceLoader throw a
     * ServiceConfigurationError (an Error, not an Exception): it must be caught per jar, so the other jars still load.
     */
    @Test
    void loadPlugins_skipsAJarWhoseServicesEntryNamesAMissingClass_andLoadsTheOthers() throws IOException {
        Path root = tempDir.resolve("plugins-missing-provider");
        PluginTestSupport.jar(root, "good.jar", List.of(RecordingPlugin.class), RecordingPlugin.class);
        PluginTestSupport.rawJar(root, "broken.jar", java.util.Map.of(
                PluginTestSupport.SERVICES_ENTRY, "org.example.MissingPlugin".getBytes(java.nio.charset.StandardCharsets.UTF_8)));

        List<LowcoderPlugin> plugins = loader(root.toString()).loadPlugins();

        assertThat(plugins).extracting(LowcoderPlugin::pluginId).containsExactly("recording-plugin");
        System.out.println("[PluginLoadingTest] jar naming a missing provider skipped, loaded " + plugins.size());
    }

    /**
     * BF-083: a services entry naming a class whose superclass is missing makes the ServiceLoader iteration of
     * {@code PathBasedPluginLoader.loadPluginCandidates} fail with the NoClassDefFoundError naming the missing class, which
     * the loader logs per jar; it used to fail with "Provider ... not found" although the provider is in the jar. The
     * failure is caught per jar, so the other jars still load.
     */
    @Test
    void loadPlugins_aProviderWithAMissingSuperclassIsReportedWithTheMissingClass_andTheOtherJarsLoadBF083() throws IOException {
        Path root = tempDir.resolve("plugins-orphan-provider");
        PluginTestSupport.jar(root, "good.jar", List.of(RecordingPlugin.class), RecordingPlugin.class);
        Path orphan = PluginTestSupport.jar(root, "orphan.jar", List.of(OrphanClass.class), OrphanClass.class);

        Iterator<LowcoderPlugin> providers = ServiceLoader.load(LowcoderPlugin.class,
                new PluginClassLoader(orphan.getFileName().toString(), orphan)).iterator();
        assertThatThrownBy(providers::next)
                .isInstanceOf(NoClassDefFoundError.class)
                .hasMessageContaining(PluginTestSupport.internalName(MissingBase.class));

        List<LowcoderPlugin> plugins = loader(root.toString()).loadPlugins();

        assertThat(plugins).extracting(LowcoderPlugin::pluginId).containsExactly("recording-plugin");
        System.out.println("[PluginLoadingTest] provider with a missing superclass reported with the missing class, loaded " + plugins.size());
    }

    @Test
    void loadPlugins_withoutAnyJar_isEmpty() {
        assertThat(loader().loadPlugins()).isEmpty();
        assertThat(loader(tempDir.resolve("empty-plugins-dir").toString()).loadPlugins()).isEmpty();
        System.out.println("[PluginLoadingTest] no jars -> no plugins");
    }

    // -------------------------------------------------------- PluginClassLoader

    private PluginClassLoader classLoaderOf(String jarName, Class<?>... classes) throws IOException {
        Path jar = PluginTestSupport.jar(tempDir.resolve("loader-" + jarName), jarName, List.of(RecordingPlugin.class), classes);
        return new PluginClassLoader(jarName, jar);
    }

    /** Catches the plugin API being loaded twice: its classes must be the application's, so plugins and server agree on the types. */
    @Test
    void loadClass_pluginApiClasses_comeFromTheApplicationClassLoader() throws Exception {
        PluginClassLoader classLoader = classLoaderOf("api.jar", RecordingPlugin.class);

        assertThat(classLoader.loadClass(LowcoderPlugin.class.getName())).isSameAs(LowcoderPlugin.class);
        System.out.println("[PluginLoadingTest] plugin API class shared with the application");
    }

    /** Catches a plugin class being defined by the application loader, or defined again on every load. */
    @Test
    void loadClass_jarClasses_areDefinedByThePluginLoader_once() throws Exception {
        PluginClassLoader classLoader = classLoaderOf("jar-classes.jar", RecordingPlugin.class);

        Class<?> first = classLoader.loadClass(RecordingPlugin.class.getName());
        Class<?> second = classLoader.loadClass(RecordingPlugin.class.getName());

        assertThat(first.getClassLoader()).isSameAs(classLoader);
        assertThat(first).isNotEqualTo(RecordingPlugin.class);
        assertThat(second).isSameAs(first);
        System.out.println("[PluginLoadingTest] " + first.getName() + " defined by " + first.getClassLoader().getName());
    }

    /**
     * A class that exists nowhere throws {@code ClassNotFoundException}: it does NOT return null (the analysis said it
     * did). That holds for an ordinary name and for a name under the plugin API prefix, whose lookup in the
     * application loader fails first.
     */
    @Test
    void loadClass_unknownClass_throwsClassNotFound() throws Exception {
        PluginClassLoader classLoader = classLoaderOf("unknown.jar", RecordingPlugin.class);

        assertThatThrownBy(() -> classLoader.loadClass("does.not.Exist")).isInstanceOf(ClassNotFoundException.class);
        assertThatThrownBy(() -> classLoader.loadClass("org.lowcoder.plugin.api.DoesNotExist")).isInstanceOf(ClassNotFoundException.class);
        System.out.println("[PluginLoadingTest] unknown classes -> ClassNotFoundException");
    }

    /**
     * A class under the plugin API prefix that the application does not have is not an error when the plugin jar has
     * it: the failed application lookup is logged and the jar is consulted next.
     */
    @Test
    void loadClass_apiPrefixClassMissingInTheApplication_fallsBackToTheJar() throws Exception {
        String internalName = "org/lowcoder/plugin/api/ShadowOnlyInTheJar";
        Path jar = PluginTestSupport.rawJar(tempDir.resolve("loader-shadow"), "shadow.jar",
                java.util.Map.of(internalName + ".class", PluginTestSupport.emptyClass(internalName)));
        PluginClassLoader classLoader = new PluginClassLoader("shadow.jar", jar);

        Class<?> shadow = classLoader.loadClass(internalName.replace('/', '.'));

        assertThat(shadow.getClassLoader()).isSameAs(classLoader);
        System.out.println("[PluginLoadingTest] " + shadow.getName() + " fell back to the jar");
    }

    /**
     * BF-083 (fixed; was pinned as the plan §9 row "PluginClassLoader.loadClass returns null after a NoClassDefFoundError
     * ..., against the ClassLoader contract"): a plugin class whose superclass is missing makes the definition fail with a
     * NoClassDefFoundError naming the missing class, which is now thrown instead of being answered with {@code null}.
     */
    @Test
    void loadClass_classWithAMissingSuperclass_throwsTheNoClassDefFoundErrorBF083() throws Exception {
        PluginClassLoader classLoader = classLoaderOf("orphan.jar", OrphanClass.class);

        assertThatThrownBy(() -> classLoader.loadClass(OrphanClass.class.getName()))
                .isInstanceOf(NoClassDefFoundError.class)
                .hasMessageContaining(PluginTestSupport.internalName(MissingBase.class));
        System.out.println("[PluginLoadingTest] class with a missing superclass -> NoClassDefFoundError");
    }

    /** Catches resources of the plugin API (and other names) being looked up in the wrong loader. */
    @Test
    void getResource_andGetResources_delegateTheApiPrefixToTheApplication_andReadTheRestFromTheJar() throws Exception {
        PluginClassLoader classLoader = classLoaderOf("resources.jar", RecordingPlugin.class);
        String apiResource = PluginTestSupport.classEntry(LowcoderPlugin.class);
        String jarResource = PluginTestSupport.classEntry(RecordingPlugin.class);

        URL api = classLoader.getResource(apiResource);
        assertThat(api).isNotNull().isEqualTo(Thread.currentThread().getContextClassLoader().getResource(apiResource));
        assertThat(Collections.list(classLoader.getResources(apiResource)))
                .isEqualTo(Collections.list(Thread.currentThread().getContextClassLoader().getResources(apiResource)));

        URL fromJar = classLoader.getResource(jarResource);
        assertThat(fromJar).isNotNull();
        assertThat(fromJar.toString()).startsWith("jar:file:").contains("resources.jar");
        assertThat(Collections.list(classLoader.getResources(jarResource))).hasSize(1);
        assertThat(classLoader.getResource("org/lowcoder/not/in/the/jar.txt")).isNull();
        assertThat(Collections.list(classLoader.getResources("org/lowcoder/not/in/the/jar.txt"))).isEmpty();
        System.out.println("[PluginLoadingTest] api resource " + api + ", jar resource " + fromJar);
    }

    @Test
    void getResource_andGetResources_rejectANullName() throws Exception {
        PluginClassLoader classLoader = classLoaderOf("null-name.jar", RecordingPlugin.class);

        assertThatThrownBy(() -> classLoader.getResource(null)).isInstanceOf(NullPointerException.class);
        assertThatThrownBy(() -> classLoader.getResources(null)).isInstanceOf(NullPointerException.class);
        System.out.println("[PluginLoadingTest] null resource names rejected");
    }
}
