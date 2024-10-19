package org.lowcoder.sdk.plugin.common;

import com.google.common.reflect.TypeToken;
import jakarta.annotation.Nonnull;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.models.TokenBasedConnectionDetail;
import org.pf4j.ExtensionPoint;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeoutException;

import static org.lowcoder.sdk.exception.PluginCommonError.DATASOURCE_TIMEOUT_ERROR;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_EXECUTION_ERROR;
import static org.lowcoder.sdk.util.ExceptionUtils.ofPluginException;
import static org.lowcoder.sdk.util.JsonUtils.fromJson;
import static org.lowcoder.sdk.util.JsonUtils.toJson;

@SuppressWarnings("unchecked")
public interface DatasourceConnector<Connection, ConnectionConfig extends DatasourceConnectionConfig> extends ExtensionPoint {

    @SuppressWarnings("UnstableApiUsage")
    @Nonnull
    default ConnectionConfig resolveConfig(Map<String, Object> configMap) {
        TypeToken<ConnectionConfig> type = new TypeToken<>(getClass()) {
        };

        Class<? super ConnectionConfig> tClass = type.getRawType();
        Object result = fromJson(toJson(configMap), tClass);
        if (result == null) {
            throw ofPluginException(PluginCommonError.DATASOURCE_ARGUMENT_ERROR, "DATASOURCE_CONFIG_ERROR");
        }
        return (ConnectionConfig) result;
    }

    /**
     * should not override this method!
     *
     * @return datasource validation messages
     */
    default Set<String> doValidateConfig(DatasourceConnectionConfig config) {
        ConnectionConfig connectionConfig;
        try {
            connectionConfig = (ConnectionConfig) config;
        } catch (ClassCastException e) {
            throw ofPluginException(PluginCommonError.INVALID_QUERY_SETTINGS, "DATASOURCE_TYPE_ERROR", e.getMessage());
        }

        return validateConfig(connectionConfig);
    }

    /**
     * create connection with {@link #doCreateConnection}, and test its availability
     * <p>
     * should not override this method!
     */
    default Mono<DatasourceTestResult> doTestConnection(DatasourceConnectionConfig config) {
        ConnectionConfig connectionConfig;
        try {
            connectionConfig = (ConnectionConfig) config;
        } catch (ClassCastException e) {
            throw ofPluginException(PluginCommonError.DATASOURCE_ARGUMENT_ERROR, "DATASOURCE_TYPE_ERROR", e.getMessage());
        }
        return testConnection(connectionConfig);
    }

    /**
     * should not override this method!
     */
    default Mono<Connection> doCreateConnection(DatasourceConnectionConfig config) {
        ConnectionConfig connectionConfig;
        try {
            connectionConfig = (ConnectionConfig) config;
        } catch (ClassCastException e) {
            throw ofPluginException(PluginCommonError.INVALID_QUERY_SETTINGS, "DATASOURCE_TYPE_ERROR", e.getMessage());
        }

        return createConnection(connectionConfig)
                .timeout(Duration.ofSeconds(10))
                .onErrorMap(TimeoutException.class, error -> new PluginException(DATASOURCE_TIMEOUT_ERROR, "DATASOURCE_TIMEOUT_ERROR"))
                .onErrorMap(Throwable.class, error -> {
                    if (error instanceof PluginException) {
                        return error;
                    }
                    return new PluginException(QUERY_EXECUTION_ERROR, "PLUGIN_CREATE_CONNECTION_FAILED", error.getMessage());
                });
    }

    Set<String> validateConfig(ConnectionConfig config);

    Mono<DatasourceTestResult> testConnection(ConnectionConfig config);

    Mono<Connection> createConnection(ConnectionConfig connectionConfig);

    Mono<Void> destroyConnection(Connection connection);

    default TokenBasedConnectionDetail resolveTokenDetail(Map<String, Object> tokenDetail) {
        throw new UnsupportedOperationException();
    }
}
