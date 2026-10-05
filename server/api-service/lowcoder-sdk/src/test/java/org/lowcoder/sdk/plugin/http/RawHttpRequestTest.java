package org.lowcoder.sdk.plugin.http;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.models.Property;
import org.springframework.http.HttpMethod;

/** {@link RawHttpRequest}: rendering of the mustache values in the path, the properties and the body, and its validity check. */
public class RawHttpRequestTest {

    private static final class Request extends RawHttpRequest {
        Request(HttpMethod method, String body, String path, List<Property> params, List<Property> headers, List<Property> bodyFormData) {
            super(method, body, path, params, headers, bodyFormData);
        }
    }

    @Test
    public void pathPropertiesAndBodyAreRenderedAndTheTypeOfAPropertyIsKept() {
        Request request = new Request(HttpMethod.POST, "{\"name\":\"{{who}}\"}", "/users/{{id}}",
                List.of(new Property("q-{{k}}", "{{who}}")), List.of(new Property("X-Token", "t-{{id}}", "TEXT")),
                List.of(new Property("f", "{{who}}", "FILE")));

        request.renderParams(Map.of("who", "Ann", "id", 7, "k", "key"));

        System.out.println("[RawHttpRequestTest] body " + request.getBody() + ", path " + request.getPath());
        assertEquals("{\"name\":\"Ann\"}", request.getBody());
        assertEquals("/users/7", request.getPath());
        assertEquals(List.of(new Property("q-key", "Ann", null)), request.getParams());
        assertEquals(List.of(new Property("X-Token", "t-7", "TEXT")), request.getHeaders());
        assertEquals(List.of(new Property("f", "Ann", "FILE")), request.getBodyFormData());
        assertEquals(HttpMethod.POST, request.getHttpMethod());
    }

    @Test
    public void missingListsBecomeEmptyListsAndABlankBodyStaysBlank() {
        Request request = new Request(HttpMethod.GET, null, "/x", null, null, null);

        request.renderParams(Map.of());

        assertEquals(List.of(), request.getParams());
        assertEquals(List.of(), request.getHeaders());
        assertEquals(List.of(), request.getBodyFormData());
        System.out.println("[RawHttpRequestTest] null body renders as '" + request.getBody() + "'");
        assertEquals("/x", request.getPath());
        Request emptyBody = new Request(HttpMethod.POST, "", "/x", List.of(), List.of(), List.of());
        emptyBody.renderParams(Map.of());
        System.out.println("[RawHttpRequestTest] empty body renders as '" + emptyBody.getBody() + "'");
    }

    @Test
    public void aRequestNeedsAMethodAndANonBlankPath() {
        assertFalse(new Request(HttpMethod.GET, null, "/x", null, null, null).hasInvalidData());
        assertTrue(new Request(null, null, "/x", null, null, null).hasInvalidData());
        assertTrue(new Request(HttpMethod.GET, null, null, null, null, null).hasInvalidData());
        assertTrue(new Request(HttpMethod.GET, null, "   ", null, null, null).hasInvalidData());
        assertTrue(new Request(HttpMethod.GET, null, "", null, null, null).hasInvalidData());
    }
}
