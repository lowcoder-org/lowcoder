package org.lowcoder.plugin.es;

import org.lowcoder.plugin.es.model.EsDatasourceConfig;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.dynamic.ConfigCenterForTest;
import org.lowcoder.sdk.contract.ContainerImages;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.utility.DockerImageName;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * The shared Elasticsearch 8.15 container of the L4-14 tests (heavy-container tag: one per test JVM, started on first use,
 * removed by Testcontainers' reaper when the JVM exits; the port is the one Docker assigns) and the helpers around it. A generic
 * container, not the module's ElasticsearchContainer (the module classes need a commons-lang3 other than the one this module's
 * classpath resolves; see log-L5.md). A single node with security on and HTTP SSL off, so the plugin's plain-HTTP client meets a
 * secured cluster; a 512 MB heap, no machine learning, no geoip download, and the disk-watermark check off (on a nearly full build disk the node refuses to allocate new shards, so creating an index would wait past the client's 30 second socket timeout). Start is bounded twice: a log wait with a startup timeout,
 * then a bounded loop of the engine's own {@code testConnection}. No Docker guard on purpose (owner decision D-7). Not a test.
 */
final class EsContainerSupport {

    static final String USER = "elastic";
    static final String PASSWORD = "Es-S3cret-pass";
    static final int HTTP_PORT = 9200;
    private static final String READY_PATTERN = ".*\"message\":\\s*\"started.*";
    private static final Duration START_TIMEOUT = Duration.ofMinutes(3);
    private static final int READY_ATTEMPTS = 60;
    private static final long READY_PAUSE_MILLIS = 1000;
    static final Duration BLOCK_TIMEOUT = Duration.ofSeconds(60);

    private static final GenericContainer<?> ELASTICSEARCH = new GenericContainer<>(DockerImageName.parse(ContainerImages.ELASTICSEARCH_8_15))
            .withEnv("discovery.type", "single-node")
            .withEnv("xpack.security.enabled", "true")
            .withEnv("xpack.security.http.ssl.enabled", "false")
            .withEnv("ELASTIC_PASSWORD", PASSWORD)
            .withEnv("ES_JAVA_OPTS", "-Xms512m -Xmx512m")
            .withEnv("xpack.ml.enabled", "false")
            .withEnv("ingest.geoip.downloader.enabled", "false")
            .withEnv("cluster.routing.allocation.disk.threshold_enabled", "false")
            .withExposedPorts(HTTP_PORT)
            .waitingFor(Wait.forLogMessage(READY_PATTERN, 1).withStartupTimeout(START_TIMEOUT));

    static final EsConnector CONNECTOR = new EsConnector(new ConfigCenterForTest(), new CommonConfig());
    static final EsQueryExecutor EXECUTOR = new EsQueryExecutor();

    static {
        long start = System.nanoTime();
        ELASTICSEARCH.start();
        System.out.println("[EsContainerSupport] " + ContainerImages.ELASTICSEARCH_8_15 + " started in "
                + (System.nanoTime() - start) / 1_000_000 + " ms on " + host() + ":" + port());
        awaitReady();
    }

    private EsContainerSupport() {
    }

    static String host() {
        return ELASTICSEARCH.getHost();
    }

    static int port() {
        return ELASTICSEARCH.getMappedPort(HTTP_PORT);
    }

    static String baseUrl() {
        return "http://" + host() + ":" + port();
    }

    /** A datasource config for the node; a null user or password leaves the field out. */
    static EsDatasourceConfig config(String connectionString, String username, String password) {
        Map<String, Object> values = new HashMap<>();
        values.put("connectionString", connectionString);
        if (username != null) {
            values.put("username", username);
        }
        if (password != null) {
            values.put("password", password);
        }
        return CONNECTOR.resolveConfig(values);
    }

    static EsDatasourceConfig config() {
        return config(baseUrl(), USER, PASSWORD);
    }

    private static void awaitReady() {
        for (int attempt = 1; attempt <= READY_ATTEMPTS; attempt++) {
            DatasourceTestResult result = CONNECTOR.testConnection(config()).block(BLOCK_TIMEOUT);
            if (result != null && result.isSuccess()) {
                System.out.println("[EsContainerSupport] answered the engine's test connection on attempt " + attempt);
                return;
            }
            try {
                Thread.sleep(READY_PAUSE_MILLIS);
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("interrupted while waiting for Elasticsearch", interrupted);
            }
        }
        throw new IllegalStateException("Elasticsearch did not accept the engine's test connection after " + READY_ATTEMPTS + " attempts");
    }
}
