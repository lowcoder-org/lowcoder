package org.lowcoder.domain.bundle.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Duration;
import java.util.Locale;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.util.LocaleUtils;

import reactor.core.publisher.Flux;

/**
 * Pins plan section 9 row G6 (task L3-12b): the message keys BundleServiceImpl uses for a bundle that does not exist,
 * BUNDLE_NOT_FOUND (BundleServiceImpl:54, :57; BundleApiServiceImpl:577) and CANT_FIND_BUNDLE (BundleServiceImpl:76), are in none
 * of locale_en, locale_de and locale_zh.properties. LocaleUtils.getMessage then logs "message key not exist" and answers the
 * text of INTERNAL_SERVER_ERROR ("Oops! Service is busy, please try again later."), so a user asking for an unknown bundle is
 * told the service is busy. Same shape as the L3-7 JS code display name row. A fix (add the keys to the three locale files)
 * changes this test on purpose.
 */
class BundleNotFoundMessagePinTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(5);
    private static final String INTERNAL_SERVER_ERROR_KEY = "INTERNAL_SERVER_ERROR";
    private static final String INTERNAL_SERVER_ERROR_EN = "Oops! Service is busy, please try again later.";

    @ParameterizedTest
    @CsvSource({
            "BUNDLE_NOT_FOUND,en", "BUNDLE_NOT_FOUND,de", "BUNDLE_NOT_FOUND,zh",
            "CANT_FIND_BUNDLE,en", "CANT_FIND_BUNDLE,de", "CANT_FIND_BUNDLE,zh"})
    void theBundleNotFoundKeysAnswerTheInternalServerErrorText_pinsTheSection9Row(String key, String language) {
        Locale locale = Locale.forLanguageTag(language);

        String message = LocaleUtils.getMessage(locale, key);
        String internalServerError = LocaleUtils.getMessage(locale, INTERNAL_SERVER_ERROR_KEY);

        System.out.println("[BundleNotFoundMessagePinTest] PINNED " + key + " in " + language + ": " + message);
        assertThat(message).isEqualTo(internalServerError);
        assertThat(internalServerError).as("the INTERNAL_SERVER_ERROR text exists in this language").isNotBlank();
    }

    @Test
    void anUnknownBundleIsReportedToTheUserAsABusyService_pinsTheSection9Row() {
        BundleServiceImplTestSupport s = new BundleServiceImplTestSupport();
        org.mockito.Mockito.when(s.repository.findById("unknown")).thenReturn(reactor.core.publisher.Mono.empty());
        org.mockito.Mockito.when(s.repository.findByGid("un-known")).thenReturn(Flux.empty());

        for (String id : new String[] {"unknown", "un-known"}) {
            BizException failure = assertThrows(BizException.class, () -> s.service.findById(id).block(TIMEOUT));
            assertThat(failure.getError()).isEqualTo(BizError.NO_RESOURCE_FOUND);
            assertThat(failure.getMessageKey()).isEqualTo("BUNDLE_NOT_FOUND");
            assertThat(failure.getMessage()).isEqualTo(INTERNAL_SERVER_ERROR_EN);
            assertThat(failure.getMessage(Locale.GERMAN)).isEqualTo(LocaleUtils.getMessage(Locale.GERMAN, INTERNAL_SERVER_ERROR_KEY));
            assertThat(failure.getMessage(Locale.CHINESE)).isEqualTo(LocaleUtils.getMessage(Locale.CHINESE, INTERNAL_SERVER_ERROR_KEY));
        }
        BizException withoutDsl = assertThrows(BizException.class, () -> s.service.findByIdWithoutDsl("unknown").block(TIMEOUT));
        assertThat(withoutDsl.getMessageKey()).isEqualTo("CANT_FIND_BUNDLE");
        assertThat(withoutDsl.getMessage()).isEqualTo(INTERNAL_SERVER_ERROR_EN);
    }
}
