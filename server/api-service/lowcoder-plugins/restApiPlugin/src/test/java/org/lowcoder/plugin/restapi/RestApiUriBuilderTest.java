package org.lowcoder.plugin.restapi;

import java.net.URI;
import java.util.Collections;
import java.util.Map;

import org.junit.Assert;
import org.junit.Test;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.common.RestApiUriBuilder;

public class RestApiUriBuilderTest {

    @Test
    public void testPathConcatenation() {
        URI uri = RestApiUriBuilder.buildUri("http://app.lowcoder.cloud", "path?", Collections.emptyMap(), Collections.emptyMap());
        Assert.assertEquals("http://app.lowcoder.cloud/path?", uri.toString());
    }

    @Test
    public void testExtraSlashesInPath() {
        URI uri = RestApiUriBuilder.buildUri("http://app.lowcoder.cloud//", "/path", Collections.emptyMap(), Collections.emptyMap());
        Assert.assertEquals("http://app.lowcoder.cloud/path", uri.toString());
    }

    @Test
    public void testAddUrlParams() {
        URI uri2 = RestApiUriBuilder.buildUri("http://my_api:8080/", "//path?key1=%25", Collections.emptyMap(),
                Map.of("key2", "value2%"));
        Assert.assertEquals("http://my_api:8080/path?key1=%25&key2=value2%25", uri2.toString());
    }

    @Test
    public void testExceptionCases() {
        Map<String, Object> paramsMap = Collections.emptyMap();
        Map<String, String> urlParams = Collections.emptyMap();
        Assert.assertThrows(PluginException.class, () -> {
            URI uri = RestApiUriBuilder.buildUri("8080:app.lowcoder.cloud", "", paramsMap, urlParams);
        });
    }
}
