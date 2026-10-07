package org.lowcoder.plugin.redis.utils;

import static org.apache.commons.lang3.ObjectUtils.firstNonNull;

import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.apache.commons.lang3.StringUtils;
import org.lowcoder.plugin.redis.model.RedisDatasourceConfig;

public class RedisUriUtils {
    private static final Long DEFAULT_PORT = 6379L;
    private static final String REDIS_SCHEME = "redis://";
    private static final String REDIS_SSL_SCHEME = "rediss://";
    private static final String USER_PASSWORD_SEPARATOR = ":";
    private static final String USER_INFO_END = "@";
    /** {@link URLEncoder} writes a space as {@code +}, which a URI's user info does not decode; a literal {@code +} is {@code %2B}. */
    private static final String FORM_SPACE = "+";
    private static final String PERCENT_SPACE = "%20";

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

    /**
     * The user info of the URI, {@code user:password@}, each part percent-encoded (BF-055): Jedis reads them with
     * {@link URI#getUserInfo()}, which decodes, and splits at the first colon, so a password with {@code @ : / # %} or a space
     * comes back unchanged. A user name without a password is kept as {@code user:@}, which Jedis sends as {@code AUTH user ""}
     * (a user with {@code nopass} is let in); without the colon Jedis would fail to read the password. A blank user name or
     * password counts as absent.
     * <p>
     * Limits: a user name containing a colon cannot be given: Jedis splits the decoded user info at its first colon, so the
     * rest of the name becomes part of the password.
     */
    private static String getUriAuth(RedisDatasourceConfig datasourceConfiguration) {
        String username = datasourceConfiguration.getUsername();
        String password = datasourceConfiguration.getPassword();
        boolean hasUsername = StringUtils.isNotBlank(username);
        boolean hasPassword = StringUtils.isNotBlank(password);
        if (!hasUsername && !hasPassword) {
            return StringUtils.EMPTY;
        }
        return (hasUsername ? encode(username) : StringUtils.EMPTY) + USER_PASSWORD_SEPARATOR
                + (hasPassword ? encode(password) : StringUtils.EMPTY) + USER_INFO_END;
    }

    private static String encode(String credential) {
        return URLEncoder.encode(credential, StandardCharsets.UTF_8).replace(FORM_SPACE, PERCENT_SPACE);
    }
}
