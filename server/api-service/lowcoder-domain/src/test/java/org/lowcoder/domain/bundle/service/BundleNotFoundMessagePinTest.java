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
 * BF-157 (fixed; was pinned as plan section 9 row G6, task L3-12b): the message keys BundleServiceImpl uses for a bundle
 * that does not exist, BUNDLE_NOT_FOUND (BundleServiceImpl:53, :56; BundleApiServiceImpl:581) and CANT_FIND_BUNDLE
 * (BundleServiceImpl:75), are now in locale_en, locale_de and locale_zh.properties and name the bundle. They were in none,
 * so LocaleUtils.getMessage answered the text of INTERNAL_SERVER_ERROR ("Oops! Service is busy, please try again later.").
 */
class BundleNotFoundMessagePinTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(5);
    private static final String INTERNAL_SERVER_ERROR_KEY = "INTERNAL_SERVER_ERROR";
    private static final String BUNDLE_ID = "unknown";
    private static final String BUNDLE_GID = "un-known";
    private static final String NOT_FOUND_EN = "Bundle %s cannot be found.";
    private static final String NOT_FOUND_DE = "Bundle %s konnte nicht gefunden werden.";
    private static final String NOT_FOUND_ZH = "找不到包 %s。";

    @ParameterizedTest
    @CsvSource({
            "BUNDLE_NOT_FOUND,en", "BUNDLE_NOT_FOUND,de", "BUNDLE_NOT_FOUND,zh",
            "CANT_FIND_BUNDLE,en", "CANT_FIND_BUNDLE,de", "CANT_FIND_BUNDLE,zh"})
    void theBundleNotFoundKeysNameTheBundleBF157(String key, String language) {
        Locale locale = Locale.forLanguageTag(language);

        String message = LocaleUtils.getMessage(locale, key, BUNDLE_ID);

        System.out.println("[BundleNotFoundMessagePinTest] " + key + " in " + language + ": " + message);
        assertThat(message).isNotEqualTo(LocaleUtils.getMessage(locale, INTERNAL_SERVER_ERROR_KEY)).contains(BUNDLE_ID);
    }

    @Test
    void anUnknownBundleIsReportedAsABundleThatCannotBeFoundBF157() {
        BundleServiceImplTestSupport s = new BundleServiceImplTestSupport();
        org.mockito.Mockito.when(s.repository.findById(BUNDLE_ID)).thenReturn(reactor.core.publisher.Mono.empty());
        org.mockito.Mockito.when(s.repository.findByGid(BUNDLE_GID)).thenReturn(Flux.empty());

        for (String id : new String[] {BUNDLE_ID, BUNDLE_GID}) {
            BizException failure = assertThrows(BizException.class, () -> s.service.findById(id).block(TIMEOUT));
            System.out.println("[BundleNotFoundMessagePinTest] findById(" + id + "): " + failure.getMessage());
            assertThat(failure.getError()).isEqualTo(BizError.NO_RESOURCE_FOUND);
            assertThat(failure.getMessageKey()).isEqualTo("BUNDLE_NOT_FOUND");
            assertThat(failure.getMessage()).isEqualTo(NOT_FOUND_EN.formatted(id));
            assertThat(failure.getMessage(Locale.GERMAN)).isEqualTo(NOT_FOUND_DE.formatted(id));
            assertThat(failure.getMessage(Locale.CHINESE)).isEqualTo(NOT_FOUND_ZH.formatted(id));
        }
        BizException withoutDsl = assertThrows(BizException.class, () -> s.service.findByIdWithoutDsl(BUNDLE_ID).block(TIMEOUT));
        System.out.println("[BundleNotFoundMessagePinTest] findByIdWithoutDsl(" + BUNDLE_ID + "): " + withoutDsl.getMessage());
        assertThat(withoutDsl.getMessageKey()).isEqualTo("CANT_FIND_BUNDLE");
        assertThat(withoutDsl.getMessage()).isEqualTo(NOT_FOUND_EN.formatted(BUNDLE_ID));
        assertThat(withoutDsl.getMessage(Locale.GERMAN)).isEqualTo(NOT_FOUND_DE.formatted(BUNDLE_ID));
        assertThat(withoutDsl.getMessage(Locale.CHINESE)).isEqualTo(NOT_FOUND_ZH.formatted(BUNDLE_ID));
    }
}
