package org.lowcoder.sdk.webclient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.CopyOnWriteArrayList;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

/** Redirect target resolution, the same-origin decision, the credential-free client copy (BF-009, BF-010) and the redirect location (BF-113). */
class WebClientRedirectsTest {

    private static final URI ORIGIN = URI.create("http://api.example.com:8080/v1/start?x=1");
    private static final String NO_VALUE = "NONE";

    @ParameterizedTest(name = "[{index}] {0} -> {1}")
    @CsvSource({
            "/next, http://api.example.com:8080/next",
            "next, http://api.example.com:8080/v1/next",
            "../up, http://api.example.com:8080/up",
            "?page=2, http://api.example.com:8080/v1/start?page=2",
            "//other.example.com/x, http://other.example.com/x",
            "https://other.example.com:9443/y, https://other.example.com:9443/y"})
    void resolveLocationResolvesAgainstTheUriThatAnswered(String location, String expected) throws URISyntaxException {
        URI resolved = WebClientRedirects.resolveLocation(ORIGIN, location);

        System.out.println("[WebClientRedirectsTest] " + location + " -> " + resolved);
        assertThat(resolved).isEqualTo(URI.create(expected));
    }

    @Test
    void resolveLocationRejectsATargetWithoutAHostAndAValueThatIsNotAUri() {
        assertThatThrownBy(() -> WebClientRedirects.resolveLocation(ORIGIN, "mailto:someone@example.com"))
                .isInstanceOf(URISyntaxException.class).hasMessageContaining("no host");
        assertThatThrownBy(() -> WebClientRedirects.resolveLocation(ORIGIN, "ht tp://x y")).isInstanceOf(URISyntaxException.class);
    }

    @ParameterizedTest(name = "[{index}] {0} vs {1} -> {2}")
    @CsvSource({
            "http://a.example.com/x, http://a.example.com/y, true",
            "http://a.example.com/x, http://a.example.com:80/y, true",
            "https://a.example.com/x, https://A.EXAMPLE.com:443/y, true",
            "HTTP://a.example.com/x, http://a.example.com/y, true",
            "http://a.example.com/x, https://a.example.com/x, false",
            "http://a.example.com/x, http://a.example.com:8080/x, false",
            "http://a.example.com/x, http://b.example.com/x, false",
            "http://a.example.com/x, http://127.0.0.1/x, false"})
    void isSameOriginComparesSchemeHostAndEffectivePort(String first, String second, boolean expected) {
        boolean same = WebClientRedirects.isSameOrigin(URI.create(first), URI.create(second));

        System.out.println("[WebClientRedirectsTest] " + first + " vs " + second + " -> " + same);
        assertThat(same).isEqualTo(expected);
    }

    @Test
    void forAnotherOriginKeepsOnlyTheContentHeadersAndDropsEveryOtherDefaultHeaderAndTheDefaultCookies() {
        List<ClientRequest> requests = new CopyOnWriteArrayList<>();
        WebClient client = WebClient.builder()
                .exchangeFunction(request -> {
                    requests.add(request);
                    return Mono.just(ClientResponse.create(HttpStatus.OK, ExchangeStrategies.withDefaults()).build());
                })
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Basic dXNlcjpzZWNyZXQ=")
                .defaultHeader(HttpHeaders.COOKIE, "session=1")
                .defaultHeader("X-Api-Key", "key")
                .defaultHeader("accept", "application/json")
                .defaultHeader(HttpHeaders.ACCEPT_LANGUAGE, "en")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, "application/json")
                .defaultHeader(HttpHeaders.USER_AGENT, "lowcoder")
                .defaultCookie("a", "1")
                .build();

        client.get().uri("http://a.example.com/").retrieve().toBodilessEntity().block();
        WebClientRedirects.forAnotherOrigin(client).get().uri("http://b.example.com/").retrieve().toBodilessEntity().block();

        ClientRequest original = requests.get(0);
        ClientRequest other = requests.get(1);
        System.out.println("[WebClientRedirectsTest] original headers " + original.headers() + " cookies " + original.cookies()
                + "; another origin headers " + other.headers() + " cookies " + other.cookies());
        assertThat(original.headers().get(HttpHeaders.AUTHORIZATION)).containsExactly("Basic dXNlcjpzZWNyZXQ=");
        assertThat(original.headers().get("X-Api-Key")).containsExactly("key");
        assertThat(original.cookies().get("a")).containsExactly("1");
        assertThat(other.headers().keySet().stream().map(name -> name.toLowerCase(Locale.ROOT)))
                .as("header names are compared without case").containsExactlyInAnyOrder("accept", "accept-language", "content-type", "user-agent");
        assertThat(other.headers().getAccept()).hasToString("[application/json]");
        assertThat(other.cookies()).isEmpty();
    }

    /**
     * BF-113: the location of a 3xx answer, or null for an answer that is not a 3xx or has no Location that is not
     * blank, which the executors then read as an ordinary answer.
     */
    @ParameterizedTest(name = "[{index}] {0} Location={1} -> {2}")
    @CsvSource(nullValues = NO_VALUE, value = {
            "302, /next, /next",
            "307, http://other.example.com/x, http://other.example.com/x",
            "301, NONE, NONE",
            "304, NONE, NONE",
            "302, ' ', NONE",
            "200, /next, NONE",
    })
    void redirectLocationIsTheLocationOfA3xxAnswerOnlyBF113(int status, String location, String expected) {
        ClientResponse.Builder builder = ClientResponse.create(HttpStatus.valueOf(status), ExchangeStrategies.withDefaults());
        if (location != null) {
            builder.header(HttpHeaders.LOCATION, location);
        }

        String redirect = WebClientRedirects.redirectLocation(builder.build());

        System.out.println("[WebClientRedirectsTest] " + status + " Location=" + location + " -> " + redirect);
        assertThat(redirect).isEqualTo(expected);
    }
}
