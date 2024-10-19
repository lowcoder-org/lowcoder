package org.lowcoder.plugin.mongo.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import com.google.common.annotations.VisibleForTesting;
import lombok.Builder;
import lombok.Getter;
import lombok.extern.jackson.Jacksonized;
import org.apache.commons.collections4.ListUtils;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.sdk.config.JsonViews;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.models.Endpoint;

import java.util.List;
import java.util.Map;
import java.util.function.Function;

import static org.apache.commons.lang3.ObjectUtils.firstNonNull;
import static org.lowcoder.plugin.mongo.model.MongoConnectionUriParser.parseDatabaseFrom;
import static org.lowcoder.sdk.exception.BizError.INVALID_DATASOURCE_CONFIG_TYPE;
import static org.lowcoder.sdk.util.ExceptionUtils.ofException;
import static org.lowcoder.sdk.util.ExceptionUtils.ofPluginException;
import static org.lowcoder.sdk.util.JsonUtils.fromJson;
import static org.lowcoder.sdk.util.JsonUtils.toJson;

@Getter
@Builder
@Jacksonized
public class MongoDatasourceConfig implements DatasourceConnectionConfig {

    private final boolean usingUri;
    private final boolean srvMode;
    private final boolean ssl;

    @JsonView(JsonViews.Internal.class)
    private String uri;

    private final List<Endpoint> endpoints;

    private final String host;
    private final Integer port;

    private final String database;
    private final String username;

    @JsonView(JsonViews.Internal.class)
    private String password;
    private final MongoAuthMechanism authMechanism;

    @JsonCreator
    private MongoDatasourceConfig(boolean usingUri, boolean srvMode,
            boolean ssl, String uri, List<Endpoint> endpoints,
            String host, Integer port, String database, String username, String password,
            MongoAuthMechanism authMechanism) {
        this.usingUri = usingUri;
        this.srvMode = srvMode;
        this.ssl = ssl;
        this.uri = uri;
        this.endpoints = endpoints;
        this.host = host;
        this.port = port;
        this.database = database;
        this.username = username;
        this.password = password;
        this.authMechanism = authMechanism;
    }

    public static MongoDatasourceConfig buildFrom(Map<String, Object> requestMap) {
        MongoDatasourceConfig result = fromJson(toJson(requestMap), MongoDatasourceConfig.class);
        if (result == null) {
            throw ofPluginException(PluginCommonError.DATASOURCE_ARGUMENT_ERROR, "INVALID_MONGODB_CONFIG");
        }
        return result;
    }

    public String getUsername() {
        return StringUtils.trimToEmpty(username);
    }

    @Override
    public DatasourceConnectionConfig mergeWithUpdatedConfig(DatasourceConnectionConfig updatedConfig) {

        if (!(updatedConfig instanceof MongoDatasourceConfig updatedMongoConfig)) {
            throw ofException(INVALID_DATASOURCE_CONFIG_TYPE, "INVALID_DATASOURCE_CONFIG_TYPE", updatedConfig.getClass().getSimpleName());
        }

        if (updatedMongoConfig.isUsingUri()) {
            return MongoDatasourceConfig.builder()
                    .usingUri(true)
                    .uri(firstNonNull(updatedMongoConfig.getUri(), getUri()))
                    .build();
        }

        return MongoDatasourceConfig.builder()
                .usingUri(false)
                .srvMode(updatedMongoConfig.isSrvMode())
                .ssl(updatedMongoConfig.isSsl())
                .authMechanism(updatedMongoConfig.getAuthMechanism())
                .endpoints(updatedMongoConfig.getEndpoints())
                .database(updatedMongoConfig.getDatabase())
                .username(updatedMongoConfig.getUsername())
                .password(firstNonNull(updatedMongoConfig.getPassword(), this.getPassword()))
                .host(updatedMongoConfig.getHost())
                .port(updatedMongoConfig.getPort())
                .build();
    }

    @VisibleForTesting
    public MongoDatasourceConfigBuilder toBuilder() {
        return builder()
                .usingUri(usingUri)
                .uri(uri)
                .srvMode(srvMode)
                .ssl(ssl)
                .authMechanism(authMechanism)
                .endpoints(endpoints)
                .database(database)
                .username(username)
                .password(password)
                .host(host)
                .port(port);
    }

    @Override
    public DatasourceConnectionConfig doEncrypt(Function<String, String> encryptFunc) {
        password = encryptFunc.apply(password);
        uri = encryptFunc.apply(uri);
        return this;
    }

    @Override
    public DatasourceConnectionConfig doDecrypt(Function<String, String> decryptFunc) {
        password = decryptFunc.apply(password);
        uri = decryptFunc.apply(uri);
        return this;
    }

    public List<Endpoint> getEndpoints() {
        return ListUtils.emptyIfNull(endpoints);
    }

    public int getPort() {
        return port == null ? 27017 : port;
    }

    @JsonIgnore
    public String getParsedDatabase() {
        if (usingUri) {
            return parseDatabaseFrom(uri);
        }
        return database;
    }
}
