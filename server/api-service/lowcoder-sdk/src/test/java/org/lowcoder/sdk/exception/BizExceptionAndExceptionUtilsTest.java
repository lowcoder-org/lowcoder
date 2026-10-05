package org.lowcoder.sdk.exception;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Locale;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.util.ExceptionUtils;
import org.springframework.http.HttpHeaders;

import reactor.core.publisher.Mono;

/**
 * {@link BizException} (status and code from its error, the messages in a locale, the lazily created headers) and
 * {@link ExceptionUtils} (the factories, and the wrap/propagate rule: keep an exception that already is, or is caused by,
 * a {@link BaseException}; wrap anything else with its message; never swallow a fatal error).
 */
public class BizExceptionAndExceptionUtilsTest {

    private static final String KEY_WITH_ARG = "DATASOURCE_TEST_GENERIC_ERROR";
    private static final String KEY_WITHOUT_ARG = "FILE_NOT_EXIST";
    private static final String ENGLISH_WITH_ARG = "Failed to connect data source: boom.";
    private static final String ENGLISH_WITHOUT_ARG = "Invalid parameter: the file does not exist.";

    @Test
    public void statusAndCodeComeFromTheErrorAndTheMessageIsLocalised() {
        BizException exception = new BizException(BizError.NOT_AUTHORIZED, KEY_WITH_ARG, "boom");

        System.out.println("[BizExceptionAndExceptionUtilsTest] " + exception.getHttpStatus() + " / " + exception.getBizErrorCode() + " / " + exception.getMessage());
        assertEquals(BizError.NOT_AUTHORIZED.getHttpErrorCode(), exception.getHttpStatus());
        assertEquals(401, exception.getHttpStatus());
        assertEquals(BizError.NOT_AUTHORIZED.getBizErrorCode(), exception.getBizErrorCode());
        assertEquals(5001, exception.getBizErrorCode());
        assertEquals(ENGLISH_WITH_ARG, exception.getMessage());
        assertEquals(ENGLISH_WITH_ARG, exception.getMessage(Locale.ENGLISH));
        assertEquals(KEY_WITH_ARG, exception.getMessageKey());
        assertArrayEquals(new Object[] {"boom"}, exception.getArgs());
        assertSame(BizError.NOT_AUTHORIZED, exception.getError());
        assertNull(exception.getHeaders());
    }

    @Test
    public void withoutAnErrorTheStatusIsFiveHundredTheCodeMinusOneAndTheMessageThatOfTheSuperConstructor() {
        BizException exception = new BizException(null, KEY_WITHOUT_ARG);

        assertEquals(500, exception.getHttpStatus());
        assertEquals(-1, exception.getBizErrorCode());
        assertEquals(ENGLISH_WITHOUT_ARG, exception.getMessage());
        assertEquals(ENGLISH_WITHOUT_ARG, exception.getMessage(Locale.FRENCH),
                "with no error the locale is ignored and the English text of the constructor stays");
    }

    @Test
    public void aMessageInAnotherLocaleUsesThatBundleAndAnUnknownKeyFallsBackToTheServiceBusyText() {
        BizException german = new BizException(BizError.INVALID_PARAMETER, KEY_WITHOUT_ARG);
        BizException unknown = new BizException(BizError.INVALID_PARAMETER, "NO_SUCH_KEY_FOR_THE_TEST");

        System.out.println("[BizExceptionAndExceptionUtilsTest] de: " + german.getMessage(Locale.GERMAN) + " / unknown: " + unknown.getMessage());
        assertTrue(!german.getMessage(Locale.GERMAN).equals(ENGLISH_WITHOUT_ARG), "the German bundle has its own text");
        assertEquals("Oops! Service is busy, please try again later.", unknown.getMessage());
    }

    @Test
    public void headersAreCreatedOnFirstUseAndBlankNamesOrValuesAreIgnored() {
        BizException exception = new BizException(BizError.INVALID_PARAMETER, KEY_WITHOUT_ARG);

        exception.addHeader("", "v");
        exception.addHeader("Name", " ");
        exception.addHeader(null, "v");
        exception.addHeader("Name", null);
        assertNull(exception.getHeaders(), "nothing was added");
        exception.addHeader("X-Test", "one");
        exception.addHeader("X-Test", "two");

        assertEquals(List.of("one", "two"), exception.getHeaders().get("X-Test"));
        HttpHeaders given = new HttpHeaders();
        given.add("Retry-After", "5");
        BizException withHeaders = new BizException(BizError.INVALID_PARAMETER, KEY_WITHOUT_ARG, given);
        assertSame(given, withHeaders.getHeaders());
        withHeaders.addHeader("Retry-After", "6");
        assertEquals(List.of("5", "6"), given.get("Retry-After"));
    }

    @Test
    public void theExceptionFactoriesBuildTheRightTypesAndMonosSignalAnErrorOnSubscription() {
        BizException biz = ExceptionUtils.ofException(BizError.INVALID_PARAMETER, KEY_WITH_ARG, "boom");
        PluginException plugin = ExceptionUtils.ofPluginException(PluginCommonError.QUERY_ARGUMENT_ERROR, KEY_WITH_ARG, "boom");

        assertEquals(ENGLISH_WITH_ARG, biz.getMessage());
        assertEquals(ENGLISH_WITH_ARG, plugin.getMessage());
        assertSame(BizError.INVALID_PARAMETER, assertThrows(BizException.class, () -> ExceptionUtils.ofError(BizError.INVALID_PARAMETER, KEY_WITH_ARG, "x").block()).getError());
        assertSame(BizError.INVALID_PARAMETER, assertThrows(BizException.class, () -> ExceptionUtils.deferredError(BizError.INVALID_PARAMETER, KEY_WITH_ARG, "x").block()).getError());
        assertSame(PluginCommonError.QUERY_ARGUMENT_ERROR,
                assertThrows(PluginException.class, () -> ExceptionUtils.ofPluginError(PluginCommonError.QUERY_ARGUMENT_ERROR, KEY_WITH_ARG, "x").block()).getError());
        HttpHeaders headers = new HttpHeaders();
        headers.add("X", "1");
        BizException withHeaders = assertThrows(BizException.class, () -> ExceptionUtils.ofErrorWithHeaders(BizError.INVALID_PARAMETER, KEY_WITH_ARG, headers, "x").block());
        assertSame(headers, withHeaders.getHeaders());
    }

    @Test
    public void deferredErrorBuildsItsExceptionOnlyWhenSubscribedAndOfErrorBuildsItAtOnce() {
        Mono<Object> deferred = ExceptionUtils.deferredError(BizError.INVALID_PARAMETER, KEY_WITH_ARG, "x");
        // two subscriptions give two different exception instances (built per subscription)
        Throwable first = assertThrows(BizException.class, deferred::block);
        Throwable second = assertThrows(BizException.class, deferred::block);
        assertTrue(first != second);
    }

    @Test
    public void wrapKeepsABaseExceptionOrOneCausedByAndWrapsOthersWithTheirMessage() {
        BizException biz = new BizException(BizError.NOT_AUTHORIZED, KEY_WITHOUT_ARG);
        PluginException plugin = new PluginException(PluginCommonError.QUERY_ARGUMENT_ERROR, KEY_WITHOUT_ARG);
        Exception causedByBiz = new RuntimeException("outer", biz);
        Exception causedByDeeper = new RuntimeException("outer", new IllegalStateException("middle", biz));
        Exception plain = new IllegalStateException("boom");

        assertSame(biz, ExceptionUtils.wrapException(BizError.INVALID_PARAMETER, KEY_WITH_ARG, biz));
        assertSame(plugin, ExceptionUtils.wrapException(PluginCommonError.QUERY_ARGUMENT_ERROR, KEY_WITH_ARG, plugin));
        assertSame(biz, ExceptionUtils.wrapException(BizError.INVALID_PARAMETER, KEY_WITH_ARG, causedByBiz), "the direct cause is unwrapped");
        BaseException wrappedDeep = ExceptionUtils.wrapException(BizError.INVALID_PARAMETER, KEY_WITH_ARG, causedByDeeper);
        System.out.println("[BizExceptionAndExceptionUtilsTest] cause two levels down -> " + wrappedDeep.getClass().getSimpleName() + ": " + wrappedDeep.getMessage());
        assertTrue(wrappedDeep != biz, "only one level of cause is looked at");
        BizException wrappedPlain = assertInstanceOf(BizException.class, ExceptionUtils.wrapException(BizError.INVALID_PARAMETER, KEY_WITH_ARG, plain));
        assertEquals(ENGLISH_WITH_ARG, wrappedPlain.getMessage(), "the original message becomes the message argument");
        assertSame(BizError.INVALID_PARAMETER, wrappedPlain.getError());
        PluginException wrappedPluginPlain = assertInstanceOf(PluginException.class,
                ExceptionUtils.wrapException(PluginCommonError.QUERY_ARGUMENT_ERROR, KEY_WITH_ARG, plain));
        assertEquals(ENGLISH_WITH_ARG, wrappedPluginPlain.getMessage());
    }

    @Test
    public void propagateGivesAnErrorMonoWithTheSameRuleAsWrap() {
        BizException biz = new BizException(BizError.NOT_AUTHORIZED, KEY_WITHOUT_ARG);
        PluginException plugin = new PluginException(PluginCommonError.QUERY_ARGUMENT_ERROR, KEY_WITHOUT_ARG);

        assertSame(biz, assertThrows(BizException.class, () -> ExceptionUtils.propagateError(BizError.INVALID_PARAMETER, KEY_WITH_ARG, biz).block()));
        assertSame(biz, assertThrows(BizException.class, () -> ExceptionUtils.propagateError(BizError.INVALID_PARAMETER, KEY_WITH_ARG, new RuntimeException(biz)).block()));
        assertSame(plugin, assertThrows(PluginException.class, () -> ExceptionUtils.propagateError(PluginCommonError.QUERY_ARGUMENT_ERROR, KEY_WITH_ARG, plugin).block()));
        BizException wrapped = assertThrows(BizException.class, () -> ExceptionUtils.propagateError(BizError.INVALID_PARAMETER, KEY_WITH_ARG, new IllegalStateException("boom")).block());
        assertEquals(ENGLISH_WITH_ARG, wrapped.getMessage());
        PluginException wrappedPlugin = assertThrows(PluginException.class,
                () -> ExceptionUtils.propagateError(PluginCommonError.QUERY_ARGUMENT_ERROR, KEY_WITH_ARG, new IllegalStateException("boom")).block());
        assertEquals(ENGLISH_WITH_ARG, wrappedPlugin.getMessage());
    }

    @Test
    public void aFatalErrorIsRethrownByWrapAndPropagateInsteadOfBeingWrapped() {
        LinkageError fatal = new LinkageError("fatal for the test");

        assertSame(fatal, assertThrows(LinkageError.class, () -> ExceptionUtils.wrapException(BizError.INVALID_PARAMETER, KEY_WITH_ARG, fatal)));
        assertSame(fatal, assertThrows(LinkageError.class, () -> ExceptionUtils.wrapException(PluginCommonError.QUERY_ARGUMENT_ERROR, KEY_WITH_ARG, fatal)));
        assertSame(fatal, assertThrows(LinkageError.class, () -> ExceptionUtils.propagateError(BizError.INVALID_PARAMETER, KEY_WITH_ARG, fatal)));
        assertSame(fatal, assertThrows(LinkageError.class, () -> ExceptionUtils.propagateError(PluginCommonError.QUERY_ARGUMENT_ERROR, KEY_WITH_ARG, fatal)));
    }
}
