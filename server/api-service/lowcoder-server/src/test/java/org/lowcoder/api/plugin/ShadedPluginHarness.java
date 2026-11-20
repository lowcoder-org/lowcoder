package org.lowcoder.api.plugin;

import org.lowcoder.api.framework.configuration.ApplicationConfiguration;
import org.lowcoder.domain.plugin.service.impl.DatasourceMetaInfoServiceImpl;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.config.dynamic.ConfigCenterForTest;
import org.pf4j.PluginManager;
import org.pf4j.PluginState;
import org.pf4j.PluginWrapper;
import org.pf4j.spring.SpringPluginManager;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Path;
import java.util.List;

/**
 * A pf4j plugin manager over a directory of shaded plugin jars, set up as the server sets it up: a Spring context in which the
 * server's own {@link ApplicationConfiguration} defines the {@link SpringPluginManager} bean, whose {@code init()} loads and starts the
 * plugins and registers their extensions as beans (built by pf4j-spring's extension factory, which injects the beans the extension
 * constructors ask for: the {@link ConfigCenter} of the Mongo and ClickHouse plugins, the {@link CommonConfig} of the REST API and
 * GraphQL plugins). The context holds only those two beans of its own, so nothing else of the server is started.
 *
 * <p>{@link #production()} uses the server's bean as it is ({@code new SpringPluginManager()}, whose directory is the
 * {@code pf4j.pluginsDir} system property, which the failsafe configuration of lowcoder-server sets). {@link #over} uses a
 * {@code SpringPluginManager} over the given directory (the way a test builds a directory of its own, as the system property is
 * JVM-wide). {@link #metaInfoService()} is the server's {@link DatasourceMetaInfoServiceImpl} over the same manager, so the lookup of a
 * connector or an executor by datasource type is the server's.
 */
final class ShadedPluginHarness implements AutoCloseable {

    static final String SESSION_COOKIE = "LOWCODER_SESSION";
    static final String PLUGINS_DIR_PROPERTY = "pf4j.pluginsDir";

    private final AnnotationConfigApplicationContext context;
    private final SpringPluginManager manager;

    private ShadedPluginHarness(AnnotationConfigApplicationContext context, SpringPluginManager manager) {
        this.context = context;
        this.manager = manager;
    }

    /**
     * The context's own beans: what the plugins' extension constructors are injected with. Not annotated {@code @Configuration}: the
     * server's component scan covers this package, and a stereotype would put these beans into the server's own test contexts.
     */
    static class PluginDependencies {

        @Bean
        ConfigCenter configCenter() {
            return new ConfigCenterForTest();
        }

        @Bean
        CommonConfig commonConfig() {
            CommonConfig config = new CommonConfig();
            config.setCookieName(SESSION_COOKIE);
            return config;
        }
    }

    /** The same with a plugin manager over {@code directory} instead of the server's no-argument one (not a {@code @Configuration}, see above). */
    static class DirectoryPluginManager {

        static volatile Path directory;

        @Bean
        SpringPluginManager pluginManager() {
            return new SpringPluginManager(directory);
        }
    }

    /** The server's own configuration; the plugin directory is the {@code pf4j.pluginsDir} system property. */
    static ShadedPluginHarness production() {
        String directory = System.getProperty(PLUGINS_DIR_PROPERTY);
        if (directory == null) {
            throw new IllegalStateException("-D" + PLUGINS_DIR_PROPERTY + " is not set: the failsafe configuration of lowcoder-server sets it"
                    + " (../lowcoder-plugins/plugins, filled by the copy-plugins-jar-for-integration-tests step); run the test through failsafe");
        }
        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
        context.register(PluginDependencies.class, ApplicationConfiguration.class);
        context.refresh();
        return new ShadedPluginHarness(context, context.getBean(SpringPluginManager.class));
    }

    /** A plugin manager over {@code directory}. */
    static synchronized ShadedPluginHarness over(Path directory) {
        DirectoryPluginManager.directory = directory;
        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
        context.register(PluginDependencies.class, DirectoryPluginManager.class);
        context.refresh();
        return new ShadedPluginHarness(context, context.getBean(SpringPluginManager.class));
    }

    PluginManager manager() {
        return manager;
    }

    /** The extensions of {@code type} of plugin {@code pluginId}, as {@code DatasourceMetaInfoServiceImpl} asks for them. */
    <T> List<T> extensions(Class<T> type, String pluginId) {
        return manager.getExtensions(type, pluginId);
    }

    PluginWrapper plugin(String pluginId) {
        return manager.getPlugin(pluginId);
    }

    boolean isStarted(String pluginId) {
        PluginWrapper wrapper = manager.getPlugin(pluginId);
        return wrapper != null && wrapper.getPluginState() == PluginState.STARTED;
    }

    /** The server's service that resolves a connector or an executor by datasource type, over this manager. */
    DatasourceMetaInfoServiceImpl metaInfoService() {
        DatasourceMetaInfoServiceImpl service = new DatasourceMetaInfoServiceImpl();
        ReflectionTestUtils.setField(service, "pluginManager", manager);
        return service;
    }

    ConfigurableApplicationContext context() {
        return context;
    }

    @Override
    public void close() {
        manager.stopPlugins();
        manager.unloadPlugins();
        context.close();
    }
}
