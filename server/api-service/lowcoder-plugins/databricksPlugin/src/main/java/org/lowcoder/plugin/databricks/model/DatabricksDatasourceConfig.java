package org.lowcoder.plugin.databricks.model;

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
import static org.lowcoder.plugin.databricks.model.DatabricksConnectionUriParser.parseDatabaseFrom;
import static org.lowcoder.sdk.exception.BizError.INVALID_DATASOURCE_CONFIG_TYPE;
import static org.lowcoder.sdk.util.ExceptionUtils.ofException;
import static org.lowcoder.sdk.util.ExceptionUtils.ofPluginException;
import static org.lowcoder.sdk.util.JsonUtils.fromJson;
import static org.lowcoder.sdk.util.JsonUtils.toJson;

@Getter
@Builder
@Jacksonized
public class DatabricksDatasourceConfig implements DatasourceConnectionConfig {
    private final String database;
    private final String username;

    @JsonView(JsonViews.Internal.class)
    private String password;
    
    private final String host;
    private final Long port;
    private final boolean usingSsl;
    private final boolean usingUri;
    
    @JsonView(JsonViews.Internal.class)
    private String jdbcUri;
    
    private final String catalog;
    private final String httpPath;
    private final DatabricksAuthMechanism authMechanism;

    private static final long DEFAULT_PORT = 443L;

    @JsonCreator
    private DatabricksDatasourceConfig(String database, String username, String password, String host, Long port, boolean usingSsl,
        boolean usingUri, String jdbcUri, String catalog, String httpPath, DatabricksAuthMechanism authMechanism) {
        this.database = database;
        this.username = username;
        this.password = password;
        this.host = host;
        this.port = port;
        this.usingSsl = usingSsl;
        this.usingUri = usingUri;
        this.jdbcUri = jdbcUri;
        this.catalog = catalog;
        this.httpPath = httpPath;
        this.authMechanism = authMechanism != null ? authMechanism : DatabricksAuthMechanism.DEFAULT;
    }


    public static DatabricksDatasourceConfig buildFrom(Map<String, Object> requestMap) {
        DatabricksDatasourceConfig result = fromJson(toJson(requestMap), DatabricksDatasourceConfig.class);
        if (result == null) {
            throw ofPluginException(PluginCommonError.DATASOURCE_ARGUMENT_ERROR, "INVALID_DATABRICKS_CONFIG");
        }
        return result;
    }

    public String getCatalog() {
        return StringUtils.trimToEmpty(catalog);
    }

    public String getHttpPath() {
        return StringUtils.trimToEmpty(httpPath);
    }

    public DatabricksAuthMechanism getAuthMechanism() {
        return authMechanism;
    }

    public String getUri() {
        return jdbcUri;
    }

    public String getSchema() {
        return getDatabase();
    }

    public boolean isUsingUri() {
        return usingUri;
    }

    public Long getPort() {
        return port == null ? DEFAULT_PORT : port;
    }

    @Override
    public DatasourceConnectionConfig mergeWithUpdatedConfig(DatasourceConnectionConfig updated) {
        if (!(updated instanceof DatabricksDatasourceConfig)) {
            throw ofException(INVALID_DATASOURCE_CONFIG_TYPE, "INVALID_DATASOURCE_CONFIG_TYPE", updated.getClass().getSimpleName());
        }
        DatabricksDatasourceConfig upd = (DatabricksDatasourceConfig) updated;

        if (upd.isUsingUri()) {
            return DatabricksDatasourceConfig.builder()
                    .usingUri(true)
                    .jdbcUri(firstNonNull(upd.getUri(), getUri()))
                    .password(firstNonNull(upd.getPassword(), this.getPassword()))
                    .build();
        }

        return DatabricksDatasourceConfig.builder()
                .usingUri(false)
                .usingSsl(upd.isUsingSsl())
                .catalog(upd.getCatalog())
                .httpPath(upd.getHttpPath())
                .authMechanism(upd.getAuthMechanism())
                .username(upd.getUsername())
                .password(firstNonNull(upd.getPassword(), this.getPassword()))
                .host(upd.getHost())
                .port(upd.getPort())
                .build();
    }

    @Override
    public DatasourceConnectionConfig doEncrypt(Function<String, String> encryptFunc) {
        password = encryptFunc.apply(password);
        jdbcUri = encryptFunc.apply(jdbcUri);
        return this;
    }

    @Override
    public DatasourceConnectionConfig doDecrypt(Function<String, String> decryptFunc) {
        password = decryptFunc.apply(password);
        jdbcUri = decryptFunc.apply(jdbcUri);
        return this;
    }
        
    @JsonIgnore
    public String getParsedDatabase() {
        if (usingUri) {
            return parseDatabaseFrom(jdbcUri);
        }
        return getDatabase();
    }
}