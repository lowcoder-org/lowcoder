package org.lowcoder.api.framework.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Locale;
import java.util.function.Function;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.reactive.function.server.HandlerStrategies;
import org.springframework.web.reactive.function.server.ServerRequest;

/**
 * Tests of {@link GlobalContextServiceImpl#getClientLocale} for both request types.
 *
 * <p>BF-144 (plan §9 row "malformed Accept-Language makes the error handler fail (LanguageRange.parse,
 * GlobalContextServiceImpl)"), fixed: a malformed or empty header made both overloads throw IllegalArgumentException; it
 * now gives English, as a missing header does. The effect on the client is shown in {@code CustomErrorWebExceptionHandlerTest}.
 */
class GlobalContextServiceImplTest {

    static final String MALFORMED = "this is !! not a language range";
    private static final String EMPTY = "";
    private static final String BAD_WEIGHT = "de;q=high";

    private final GlobalContextServiceImpl service = new GlobalContextServiceImpl();

    private static MockServerHttpRequest httpRequest(String acceptLanguage) {
        MockServerHttpRequest.BaseBuilder<?> builder = MockServerHttpRequest.get("/api/x");
        if (acceptLanguage != null) {
            builder.header("Accept-Language", acceptLanguage);
        }
        return builder.build();
    }

    private static ServerRequest serverRequest(String acceptLanguage) {
        return ServerRequest.create(MockServerWebExchange.from(httpRequest(acceptLanguage)), HandlerStrategies.withDefaults().messageReaders());
    }

    private Locale resolve(boolean functional, String acceptLanguage) {
        Function<String, Locale> resolver = functional
                ? header -> service.getClientLocale(serverRequest(header))
                : header -> service.getClientLocale(httpRequest(header));
        return resolver.apply(acceptLanguage);
    }

    /** Catches the first range of the header not being used, or a missing header not falling back to English. */
    @ParameterizedTest
    @CsvSource({
            "false,'en-US,de;q=0.5',en-US", "true,'en-US,de;q=0.5',en-US",
            "false,de,de", "true,de,de",
            "false,'zh-CN',zh-CN", "true,'zh-CN',zh-CN",
            "false,,en", "true,,en"})
    void firstLanguageRange_orEnglish(boolean functional, String header, String expectedTag) {
        Locale locale = resolve(functional, header);

        assertThat(locale).isEqualTo(Locale.forLanguageTag(expectedTag));
        System.out.println("[GlobalContextServiceImplTest] " + (functional ? "ServerRequest" : "ServerHttpRequest")
                + " '" + header + "' -> " + locale.toLanguageTag());
    }

    /** Observes the range order of a header whose first entry has the lower weight. */
    @ParameterizedTest
    @CsvSource({"false", "true"})
    void headerOrderedByWeight_observed(boolean functional) {
        Locale locale = resolve(functional, "de;q=0.4,fr;q=0.9");

        System.out.println("[GlobalContextServiceImplTest] 'de;q=0.4,fr;q=0.9' -> " + locale.toLanguageTag());
        assertThat(locale).isEqualTo(Locale.forLanguageTag("fr"));
    }

    /**
     * BF-144: a malformed header ({@value #MALFORMED}), an empty one and one with a weight that is no number give English
     * for both request types, instead of an IllegalArgumentException. Catches: the parse failure escaping again.
     */
    @ParameterizedTest
    @CsvSource({"false", "true"})
    void malformedOrEmptyHeader_givesEnglishBF144(boolean functional) {
        for (String header : new String[] {MALFORMED, EMPTY, BAD_WEIGHT}) {
            Locale locale = resolve(functional, header);
            System.out.println("[GlobalContextServiceImplTest] " + (functional ? "ServerRequest" : "ServerHttpRequest")
                    + " '" + header + "' -> " + locale.toLanguageTag());
            assertThat(locale).as(header).isEqualTo(Locale.ENGLISH);
        }
    }

    @Test
    void wildcardHeader_observed() {
        Locale locale = resolve(true, "*");

        System.out.println("[GlobalContextServiceImplTest] '*' -> '" + locale.toLanguageTag() + "'");
        assertThat(locale).isEqualTo(Locale.forLanguageTag("*"));
    }
}
