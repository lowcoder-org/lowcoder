package org.lowcoder.sdk.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.util.MultiValueMap;

/** What {@link HttpHeaderMaps#copyOf} keeps of {@link HttpHeaders}: names without regard to case, order, values and their JSON form. */
class HttpHeaderMapsTest {

    private static HttpHeaders headers() {
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", "application/json");
        headers.add("X-Multi", "first");
        headers.add("X-Multi", "second, with comma");
        headers.add("Cookie", "session=1");
        return headers;
    }

    /** Catches a copy that loses a value, a name's order or a name's case. */
    @Test
    void theCopyHoldsEveryValueInOrder() {
        MultiValueMap<String, String> copy = HttpHeaderMaps.copyOf(headers());

        System.out.println("[HttpHeaderMapsTest] copy " + copy);
        assertThat(copy.keySet()).as("names in the order of the headers, in their first spelling")
                .containsExactly("Content-Type", "X-Multi", "Cookie");
        assertThat(copy.get("X-Multi")).as("values of a repeated header").containsExactly("first", "second, with comma");
    }

    /** Catches a case-sensitive copy: removing a header by another spelling must work, as it does on HttpHeaders. */
    @Test
    void namesAreComparedWithoutRegardToCase() {
        MultiValueMap<String, String> copy = HttpHeaderMaps.copyOf(headers());

        assertThat(copy.remove("cookie")).as("removed by a lower-case spelling").containsExactly("session=1");
        copy.addIfAbsent("X-MULTI", "third");
        assertThat(copy.get("x-multi")).as("addIfAbsent did not add to the existing header").containsExactly("first", "second, with comma");
        assertThat(copy).as("the copy without the cookie").doesNotContainKey("Cookie");
    }

    /** Catches a view instead of a copy: the headers must not change when the copy does. */
    @Test
    void theCopyIsIndependentOfTheHeaders() {
        HttpHeaders original = headers();

        HttpHeaderMaps.copyOf(original).remove("Cookie");
        HttpHeaderMaps.copyOf(original).add("X-Added", "1");

        assertThat(original.containsHeader("Cookie")).as("original still has the cookie").isTrue();
        assertThat(original.containsHeader("X-Added")).as("original has no added header").isFalse();
    }

    /** Catches a copy that is not written as a JSON object of arrays, the form the results hold the response headers in. */
    @Test
    void theCopyIsWrittenAsAnObjectOfArrays() {
        String json = JsonUtils.toJson(HttpHeaderMaps.copyOf(headers()));

        System.out.println("[HttpHeaderMapsTest] json " + json);
        assertThat(json).isEqualTo("{\"Content-Type\":[\"application/json\"],\"X-Multi\":[\"first\",\"second, with comma\"],\"Cookie\":[\"session=1\"]}");
    }
}
