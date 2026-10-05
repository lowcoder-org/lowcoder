package org.lowcoder.plugin.restapi;

import static org.lowcoder.sdk.plugin.restapi.auth.RestApiAuthType.BASIC_AUTH;
import static org.lowcoder.sdk.plugin.restapi.auth.RestApiAuthType.BEARER_TOKEN_AUTH;
import static org.lowcoder.sdk.plugin.restapi.auth.RestApiAuthType.DIGEST_AUTH;
import static org.lowcoder.sdk.plugin.restapi.auth.RestApiAuthType.NO_AUTH;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;
import org.lowcoder.sdk.plugin.restapi.auth.BasicAuthConfig;
import org.lowcoder.sdk.plugin.restapi.auth.DefaultAuthConfig;
import org.lowcoder.sdk.plugin.restapi.auth.NoneAuthConfig;
import org.lowcoder.sdk.util.JsonUtils;

public class AuthConfigTest {

    @Test
    public void testRestApiDatasourceConfigDeserialize4BasicAuthType() {
        String json = """
                {
                  "headers": [
                    {
                      "key": "Content-Type",
                      "value": "application/json"
                    }
                  ],
                  "authConfig": {
                    "type": "BASIC_AUTH",
                    "username": "jack",
                    "password": "123456"
                  },
                  "url": "http://localhost:8070"
                }
                """;
        RestApiDatasourceConfig restApiDatasourceConfig = JsonUtils.fromJson(json, RestApiDatasourceConfig.class);
        Assertions.assertNotNull(restApiDatasourceConfig);
        BasicAuthConfig basicAuthConfig = (BasicAuthConfig) restApiDatasourceConfig.getAuthConfig();
        Assertions.assertEquals(BASIC_AUTH, basicAuthConfig.getType());
        Assertions.assertEquals("jack", basicAuthConfig.getUsername());
        Assertions.assertEquals("123456", basicAuthConfig.getPassword());
    }

    @Test
    public void testRestApiDatasourceConfigDeserialize4DigestAuthType() {
        String json = """
                {
                  "headers": [
                    {
                      "key": "Content-Type",
                      "value": "application/json"
                    }
                  ],
                  "authConfig": {
                    "type": "DIGEST_AUTH",
                    "username": "jack",
                    "password": "123456"
                  },
                  "url": "http://localhost:8070"
                }
                """;
        RestApiDatasourceConfig restApiDatasourceConfig = JsonUtils.fromJson(json, RestApiDatasourceConfig.class);
        Assertions.assertNotNull(restApiDatasourceConfig);
        BasicAuthConfig basicAuthConfig = (BasicAuthConfig) restApiDatasourceConfig.getAuthConfig();
        Assertions.assertEquals(DIGEST_AUTH, basicAuthConfig.getType());
        Assertions.assertEquals("jack", basicAuthConfig.getUsername());
        Assertions.assertEquals("123456", basicAuthConfig.getPassword());
    }

    @Test
    public void testRestApiDatasourceConfigDeserialize4NoAuthType() {
        String json = """
                {
                  "headers": [
                    {
                      "key": "Content-Type",
                      "value": "application/json"
                    }
                  ],
                  "authConfig": {
                    "type": "NO_AUTH",
                    "username": "jack",
                    "password": "123456"
                  },
                  "url": "http://localhost:8070"
                }
                """;
        RestApiDatasourceConfig restApiDatasourceConfig = JsonUtils.fromJson(json, RestApiDatasourceConfig.class);
        Assertions.assertNotNull(restApiDatasourceConfig);
        NoneAuthConfig noneAuthConfig = (NoneAuthConfig) restApiDatasourceConfig.getAuthConfig();
        Assertions.assertEquals(NO_AUTH, noneAuthConfig.getType());
    }

    @Test
    public void testRestApiDatasourceConfigDeserialize4DefaultAuthType() {
        String json = """
                {
                  "headers": [
                    {
                      "key": "Content-Type",
                      "value": "application/json"
                    }
                  ],
                  "authConfig": {
                    "type": "BEARER_TOKEN_AUTH",
                    "username": "jack",
                    "password": "123456"
                  },
                  "url": "http://localhost:8070"
                }
                """;
        RestApiDatasourceConfig restApiDatasourceConfig = JsonUtils.fromJson(json, RestApiDatasourceConfig.class);
        Assertions.assertNotNull(restApiDatasourceConfig);
        DefaultAuthConfig defaultAuthConfig = (DefaultAuthConfig) restApiDatasourceConfig.getAuthConfig();
        Assertions.assertEquals(BEARER_TOKEN_AUTH, defaultAuthConfig.getType());
    }
}