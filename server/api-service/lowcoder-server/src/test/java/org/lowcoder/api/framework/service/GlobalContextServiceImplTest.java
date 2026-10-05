package org.lowcoder.api.framework.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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
 * <p>Pinned under D-6, plan §9 row "malformed Accept-Language makes the error handler fail (LanguageRange.parse,
 * GlobalContextServiceImpl)": a malformed header makes both overloads throw IllegalArgumentException; the effect on
 * the client is shown in {@code CustomErrorWebExceptionHandlerTest}.
 */
class GlobalContextServiceImplTest {

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

    /** Pins plan §9 row "malformed Accept-Language makes the error handler fail": the parse error is not caught. */
    @ParameterizedTest
    @CsvSource({"false", "true"})
    void malformedHeader_throwsIllegalArgument_pinsTheSection9Row(boolean functional) {
        assertThatThrownBy(() -> resolve(functional, "this is !! not a language range"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> resolve(functional, "")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void wildcardHeader_observed() {
        Locale locale = resolve(true, "*");

        System.out.println("[GlobalContextServiceImplTest] '*' -> '" + locale.toLanguageTag() + "'");
        assertThat(locale).isEqualTo(Locale.forLanguageTag("*"));
    }
}
