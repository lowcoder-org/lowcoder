package org.lowcoder.api.framework.plugin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.lowcoder.api.framework.plugin.PluginTestSupport.RecordingPlugin;
import org.lowcoder.api.framework.plugin.PluginTestSupport.SameIdPlugin;
import org.lowcoder.api.framework.plugin.PluginTestSupport.SecondPlugin;
import org.lowcoder.api.framework.plugin.endpoint.PluginEndpointHandler;
import org.lowcoder.infra.config.model.ServerConfig;
import org.lowcoder.infra.config.repository.ServerConfigRepository;
import org.lowcoder.plugin.api.LowcoderPlugin;
import org.lowcoder.plugin.api.LowcoderServices;
import org.lowcoder.plugin.api.PluginEndpoint;
import org.lowcoder.plugin.api.event.LowcoderEvent;
import org.lowcoder.sdk.config.CommonConfig;
import org.springframework.boot.system.ApplicationHome;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

import reactor.core.publisher.Mono;

/**
 * Tests of {@link LowcoderPluginManager}, {@link PluginExecutor} and {@link SharedPluginServices}.
 * Plugins loaded from a real jar record, inside {@code load()}, the thread name, context class loader, environment and
 * services they were given; the test reads them through a bounded {@code future.get}. The {@code loadOrder} sort is
 * not observable (every plugin gets its own thread and the order of thread starts is not a guarantee), so it has no test.
 */
class LowcoderPluginManagerTest {

    private static final long WAIT_SECONDS = 20;

    @TempDir
    Path tempDir;

    private final LowcoderServices services = mock(LowcoderServices.class);

    private StandardEnvironment environment(Map<String, Object> properties) {
        StandardEnvironment env = new StandardEnvironment();
        env.getPropertySources().addFirst(new MapPropertySource("test-properties", properties));
        // a source that cannot enumerate its names must be skipped, not fail the environment scan
        env.getPropertySources().addLast(new org.springframework.core.env.PropertySource<Object>("opaque", new Object()) {
            @Override
            public Object getProperty(String name) {
                return null;
            }
        });
        return env;
    }

    private PluginLoader jarLoader(String dirName) throws IOException {
        Path root = tempDir.resolve(dirName);
        PluginTestSupport.jar(root, "rec.jar", List.of(RecordingPlugin.class), RecordingPlugin.class);
        PluginTestSupport.jar(root, "second.jar", List.of(SecondPlugin.class), RecordingPlugin.class, SecondPlugin.class);
        CommonConfig common = new CommonConfig();
        common.setPluginDirs(List.of(root.toString()));
        ApplicationHome home = mock(ApplicationHome.class);
        return new PathBasedPluginLoader(common, home);
    }

    @SuppressWarnings("unchecked")
    private static Object[] recorded(LowcoderPlugin plugin) throws Exception {
        return ((CompletableFuture<Object[]>) plugin.pluginInfo()).get(WAIT_SECONDS, TimeUnit.SECONDS);
    }

    /**
     * Catches the plugin thread not being named after the plugin, not getting the plugin's class loader as context
     * class loader, or getting the wrong environment slice (prefix {@code PLUGIN_<ID>_}, dashes as underscores).
     */
    @Test
    void postConstruct_startsOneNamedThreadPerPlugin_withItsClassLoaderEnvironmentAndServices() throws Exception {
        PluginLoader loader = jarLoader("manager-jars");
        Map<String, Object> props = new HashMap<>();
        props.put("PLUGIN_RECORDING_PLUGIN_API_KEY", "k-1");
        props.put("PLUGIN_RECORDING_PLUGIN_MODE", "fast");
        props.put("PLUGIN_SECOND_PLUGIN_OTHER", "x");
        props.put("PLUGIN_RECORDING_PLUGINX", "no-underscore-after-id");
        props.put("UNRELATED", "u");
        LowcoderPluginManager manager = new LowcoderPluginManager(services, loader, environment(props));

        ReflectionTestUtils.invokeMethod(manager, "loadPlugins");

        List<?> infos = manager.getLoadedPluginsInfo();
        assertThat(infos).hasSize(2);
        System.out.println("[LowcoderPluginManagerTest] infos " + infos);
        LowcoderPlugin recording = pluginById(manager, "recording-plugin");
        LowcoderPlugin second = pluginById(manager, "second-plugin");

        Object[] rec = recorded(recording);
        assertThat(rec[0]).isEqualTo("recording-plugin");
        assertThat(rec[1]).isSameAs(recording.getClass().getClassLoader()).isInstanceOf(PluginClassLoader.class);
        assertThat(rec[1]).isNotSameAs(Thread.currentThread().getContextClassLoader());
        assertThat(rec[2]).isEqualTo(Map.of("API_KEY", "k-1", "MODE", "fast"));
        assertThat(rec[3]).isSameAs(services);

        Object[] sec = recorded(second);
        assertThat(sec[0]).isEqualTo("second-plugin");
        assertThat(sec[2]).isEqualTo(Map.of("OTHER", "x"));
        System.out.println("[LowcoderPluginManagerTest] recording env " + rec[2] + ", second env " + sec[2]);
    }

    @SuppressWarnings("unchecked")
    private LowcoderPlugin pluginById(LowcoderPluginManager manager, String id) {
        Map<String, LowcoderPlugin> plugins = (Map<String, LowcoderPlugin>) ReflectionTestUtils.getField(manager, "plugins");
        return plugins.get(id);
    }

    /** Catches a later plugin with an already registered id replacing the first one. */
    @Test
    void register_duplicatePluginId_keepsTheFirst() {
        LowcoderPlugin first = new RecordingPlugin();
        LowcoderPlugin duplicate = new SameIdPlugin();
        PluginLoader loader = mock(PluginLoader.class);
        when(loader.loadPlugins()).thenReturn(List.of(first, duplicate));
        LowcoderPluginManager manager = new LowcoderPluginManager(services, loader, environment(Map.of()));

        ReflectionTestUtils.invokeMethod(manager, "loadPlugins");

        List<?> infos = manager.getLoadedPluginsInfo();
        assertThat(infos).hasSize(1);
        assertThat(infos.get(0).toString()).contains("records its load").doesNotContain("same id");
        System.out.println("[LowcoderPluginManagerTest] " + infos);
    }

    /** Catches a null or empty loader result failing the start-up. */
    @Test
    void register_nullOrEmptyLoaderResult_registersNothing() {
        PluginLoader loader = mock(PluginLoader.class);
        when(loader.loadPlugins()).thenReturn(null).thenReturn(List.of());
        LowcoderPluginManager manager = new LowcoderPluginManager(services, loader, environment(Map.of()));

        ReflectionTestUtils.invokeMethod(manager, "loadPlugins");
        ReflectionTestUtils.invokeMethod(manager, "loadPlugins");

        assertThat(manager.getLoadedPluginsInfo()).isEmpty();
        System.out.println("[LowcoderPluginManagerTest] null and empty results -> no plugins");
    }

    /** Catches an unload failure of one plugin stopping the unload of the others. */
    @Test
    void unloadPlugins_unloadsEveryPlugin_evenWhenOneThrows() {
        LowcoderPlugin failing = mock(LowcoderPlugin.class);
        when(failing.pluginId()).thenReturn("failing");
        when(failing.loadOrder()).thenReturn(0);
        doThrow(new IllegalStateException("unload failed")).when(failing).unload();
        LowcoderPlugin healthy = mock(LowcoderPlugin.class);
        when(healthy.pluginId()).thenReturn("healthy");
        when(healthy.loadOrder()).thenReturn(1);
        PluginLoader loader = mock(PluginLoader.class);
        when(loader.loadPlugins()).thenReturn(List.of(failing, healthy));
        LowcoderPluginManager manager = new LowcoderPluginManager(services, loader, environment(Map.of()));
        ReflectionTestUtils.invokeMethod(manager, "loadPlugins");

        manager.unloadPlugins();

        verify(failing).unload();
        verify(healthy).unload();
        System.out.println("[LowcoderPluginManagerTest] both plugins unloaded despite the failure");
    }

    /** Catches {@code run} not calling load with the given environment and services, for a plugin returning false too. */
    @Test
    void executor_run_loadsThePluginWithItsEnvironmentAndServices() {
        LowcoderPlugin plugin = mock(LowcoderPlugin.class);
        when(plugin.pluginId()).thenReturn("exec-plugin");
        Map<String, Object> env = Map.of("A", "b");
        when(plugin.load(env, services)).thenReturn(true);

        PluginExecutor executor = new PluginExecutor(plugin, env, services);
        executor.run();

        assertThat(executor.getName()).isEqualTo("exec-plugin");
        assertThat(executor.getContextClassLoader()).isSameAs(plugin.getClass().getClassLoader());
        verify(plugin).load(env, services);

        LowcoderPlugin refusing = mock(LowcoderPlugin.class);
        when(refusing.pluginId()).thenReturn("refusing");
        new PluginExecutor(refusing, env, services).run();
        verify(refusing).load(env, services);
        System.out.println("[LowcoderPluginManagerTest] executor ran " + executor.getName());
    }

    // ------------------------------------------------------ SharedPluginServices

    private SharedPluginServices shared(PluginEndpointHandler handler, ServerConfigRepository repository) {
        SharedPluginServices shared = new SharedPluginServices(handler);
        ReflectionTestUtils.setField(shared, "serverConfigRepository", repository);
        return shared;
    }

    /** Catches events not reaching every listener, in registration order. */
    @Test
    @SuppressWarnings("unchecked")
    void sharedServices_publishEvents_notifiesEveryListenerInOrder() {
        SharedPluginServices shared = shared(mock(PluginEndpointHandler.class), mock(ServerConfigRepository.class));
        List<String> calls = new java.util.ArrayList<>();
        Consumer<LowcoderEvent> first = event -> calls.add("first");
        Consumer<LowcoderEvent> second = event -> calls.add("second");
        shared.registerEventListener(first);
        shared.registerEventListener(second);

        ReflectionTestUtils.invokeMethod(shared, "publishEvents", mock(LowcoderEvent.class));

        assertThat(calls).containsExactly("first", "second");
        System.out.println("[LowcoderPluginManagerTest] listeners called " + calls);
    }

    /** Catches endpoint registration not being forwarded with its prefix and list. */
    @Test
    void sharedServices_registerEndpoints_delegatesToTheHandler() {
        PluginEndpointHandler handler = mock(PluginEndpointHandler.class);
        List<PluginEndpoint> endpoints = List.of(mock(PluginEndpoint.class));

        shared(handler, mock(ServerConfigRepository.class)).registerEndpoints("pfx", endpoints);

        verify(handler).registerEndpoints("pfx", endpoints);
        System.out.println("[LowcoderPluginManagerTest] registerEndpoints delegated");
    }

    /** Catches config being written under the wrong key/value, or read through the wrong field. */
    @Test
    void sharedServices_setConfig_andGetConfig_goThroughTheRepository() {
        ServerConfigRepository repository = mock(ServerConfigRepository.class);
        java.util.concurrent.atomic.AtomicBoolean upsertSubscribed = new java.util.concurrent.atomic.AtomicBoolean();
        when(repository.upsert("k", "v")).thenReturn(Mono.defer(() -> {
            upsertSubscribed.set(true);
            return Mono.just(ServerConfig.builder().key("k").value("v").build());
        }));
        when(repository.findByKey("k")).thenReturn(Mono.just(ServerConfig.builder().key("k").value("stored").build()));
        when(repository.findByKey("missing")).thenReturn(Mono.empty());
        SharedPluginServices shared = shared(mock(PluginEndpointHandler.class), repository);

        shared.setConfig("k", "v");

        verify(repository).upsert("k", "v");
        assertThat(upsertSubscribed).as("setConfig must wait for (subscribe to) the upsert").isTrue();
        assertThat(shared.getConfig("k")).isEqualTo("stored");
        assertThat(shared.getConfig("missing")).isNull();
        System.out.println("[LowcoderPluginManagerTest] config round trip");
    }
}
