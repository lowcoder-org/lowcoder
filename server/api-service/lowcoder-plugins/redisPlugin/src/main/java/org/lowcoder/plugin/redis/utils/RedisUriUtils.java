package org.lowcoder.plugin.redis.utils;

import static org.apache.commons.lang3.ObjectUtils.firstNonNull;

import java.net.URI;
import java.net.URISyntaxException;

import org.apache.commons.lang3.StringUtils;
import org.lowcoder.plugin.redis.model.RedisDatasourceConfig;

public class RedisUriUtils {
    private static final Long DEFAULT_PORT = 6379L;
    private static final String REDIS_SCHEME = "redis://";
    private static final String REDIS_SSL_SCHEME = "rediss://";

    /**
     * The connection URI: the stored URI in URI mode, otherwise one built from the fields, with the scheme {@code rediss://}
     * when SSL is selected (BF-024; Jedis connects with TLS for that scheme) and {@code redis://} otherwise.
     * <p>
     * Limits: in URI mode the stored URI's own scheme decides, the SSL switch is not applied to it. With TLS, Jedis checks the
     * server certificate against the JVM's default trust store but, as no hostname verifier is given, not the host name
     * (NEW-7).
     */
    public static URI getURI(RedisDatasourceConfig redisDatasourceConfig) throws URISyntaxException {

        if (redisDatasourceConfig.isUsingUri()) {
            return new URI(redisDatasourceConfig.getUri());
        }

        StringBuilder builder = new StringBuilder();
        builder.append(redisDatasourceConfig.isUsingSsl() ? REDIS_SSL_SCHEME : REDIS_SCHEME);

        String uriAuth = getUriAuth(redisDatasourceConfig);
        builder.append(uriAuth);

        String uriHostAndPort = getUriHostAndPort(redisDatasourceConfig);
        builder.append(uriHostAndPort);

        String uriDatabase = getUriDatabase(redisDatasourceConfig);
        builder.append(uriDatabase);

        return new URI(builder.toString());
    }

    private static String getUriDatabase(RedisDatasourceConfig datasourceConfiguration) {
        return StringUtils.EMPTY;
    }

    private static String getUriHostAndPort(RedisDatasourceConfig datasourceConfiguration) {
        String host = datasourceConfiguration.getHost();
        long port = firstNonNull(datasourceConfiguration.getPort(), DEFAULT_PORT);
        return host + ":" + port;
    }

    private static String getUriAuth(RedisDatasourceConfig datasourceConfiguration) {
        StringBuilder builder = new StringBuilder();
        String username = datasourceConfiguration.getUsername();
        String password = datasourceConfiguration.getPassword();
        if (StringUtils.isNotBlank(password)) {
            if (StringUtils.isNotBlank(username)) {
                builder.append(username);
            }
            builder.append(":").append(password).append("@");
        }
        return builder.toString();
    }
}
