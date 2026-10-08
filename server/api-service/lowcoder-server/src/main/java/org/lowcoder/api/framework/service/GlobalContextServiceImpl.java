package org.lowcoder.api.framework.service;

import java.util.List;
import java.util.Locale;
import java.util.Locale.LanguageRange;

import jakarta.annotation.Nullable;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.server.ServerRequest;

/**
 * The client's locale for localised messages: the range of {@code Accept-Language} with the highest weight (the first
 * of {@code LanguageRange.parse}, which orders by weight), or English when the header is absent, empty or malformed
 * (BF-144: {@code LanguageRange.parse} threw for a malformed header, and the error handler, which resolves the locale
 * while rendering an error, failed itself, so the client got an empty 500).
 * <p>Limits: the range is taken as written ({@code *} becomes the root locale, as before) and is not matched against the
 * locales that have message bundles; a header with several values is read from its first value only.
 */
@Service
@Slf4j
public class GlobalContextServiceImpl implements GlobalContextService {

    private static final String ACCEPT_LANGUAGE = "accept-language";

    @Override
    public Locale getClientLocale(ServerHttpRequest request) {
        return localeOf(request.getHeaders().getFirst(ACCEPT_LANGUAGE));
    }

    @Override
    public Locale getClientLocale(ServerRequest request) {
        return localeOf(request.headers().firstHeader(ACCEPT_LANGUAGE));
    }

    private static Locale localeOf(@Nullable String acceptLanguage) {
        if (acceptLanguage == null) {
            return Locale.ENGLISH;
        }
        List<LanguageRange> ranges;
        try {
            ranges = LanguageRange.parse(acceptLanguage);
        } catch (IllegalArgumentException malformed) {
            // the client controls the header, so a malformed one is not worth more than a debug line
            log.debug("ignoring a malformed Accept-Language: {}", malformed.getMessage());
            return Locale.ENGLISH;
        }
        return ranges.stream()
                .findFirst()
                .map(LanguageRange::getRange)
                .map(Locale::forLanguageTag)
                .orElse(Locale.ENGLISH);
    }
}
