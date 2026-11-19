package org.lowcoder.sdk.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.ResourceLock;
import org.junit.jupiter.api.parallel.Resources;
import org.springframework.http.MediaType;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;

import reactor.core.publisher.Mono;

/**
 * {@link MediaTypeUtils} (the content type a stored material is served with) and {@link UriUtils} (the referer and the
 * cookie domain of a request).
 */
public class MediaTypeAndUriUtilsTest {

    private static final String UPPER_CASE_REFERER = "https://API.EXAMPLE.COM/x";
    private static final String UPPER_CASE_SINGLE_LABEL_URL = "http://INTRANET/x";
    private static final String UPPER_CASE_REGISTRABLE_URL = "https://WWW.EXAMPLE.IO/x";
    private static final String LOWER_CASE_REFERER_DOMAIN = "api.example.com";
    private static final String LOWER_CASE_SINGLE_LABEL = "intranet";
    private static final String LOWER_CASE_REGISTRABLE_DOMAIN = "example.io";
    /** The request URL of an exchange whose Referer is what a case reads. */
    private static final String ANY_REQUEST_URL = "http://x/";
    /** An exchange without a Referer, for a case that reads only the request URL. */
    private static final String NO_REFERER = null;

    private static final MediaType SVG = new MediaType("image", "svg+xml");
    private static final Locale TURKISH = Locale.forLanguageTag("tr-TR");
    /** Referer values that {@code URI.create} rejects: a blank in the host, a blank in the authority, markup. */
    private static final String[] UNPARSABLE_REFERERS = {"http://bad host/", "http://a b", "<script>"};

    private static MockServerWebExchange exchange(String url, String referer) {
        MockServerHttpRequest.BaseBuilder<?> builder = MockServerHttpRequest.get(url);
        if (referer != null) {
            builder.header(UriUtils.REFERER, referer);
        }
        return MockServerWebExchange.from(builder.build());
    }

    @Test
    public void knownLowerCaseExtensionsMapToTheirMediaTypeAndOthersToTheDefault() {
        assertEquals(MediaType.IMAGE_JPEG, MediaTypeUtils.parse("photo.jpg"));
        assertEquals(MediaType.IMAGE_JPEG, MediaTypeUtils.parse("photo.jpeg"));
        assertEquals(MediaType.IMAGE_GIF, MediaTypeUtils.parse("a.gif"));
        assertEquals(MediaType.IMAGE_PNG, MediaTypeUtils.parse("logo.png"));
        assertEquals(MediaType.APPLICATION_PDF, MediaTypeUtils.parse("doc.pdf"));
        assertEquals(new MediaType("image", "svg+xml"), MediaTypeUtils.parse("icon.svg"));
        assertEquals(MediaType.APPLICATION_OCTET_STREAM, MediaTypeUtils.parse("archive.zip"));
        assertEquals(MediaType.IMAGE_PNG, MediaTypeUtils.parse("many.dots.in.the.name.png"), "the last extension counts");
        assertEquals(MediaType.TEXT_PLAIN, MediaTypeUtils.parse("notes.txt", MediaType.TEXT_PLAIN), "the given default replaces octet-stream");
        assertNull(MediaTypeUtils.parse("notes.txt", null), "a null default is allowed");
        assertEquals(MediaType.IMAGE_PNG, MediaTypeUtils.getMediaType("png"));
        assertEquals(MediaType.APPLICATION_OCTET_STREAM, MediaTypeUtils.getMediaType("exe"));
    }

    @Test
    public void aFileNameWithoutADotIsTreatedAsItsOwnExtensionAndABlankNameIsRejected() {
        // behaviour (ruled): split on "." leaves the whole name as the last part
        assertEquals(MediaType.IMAGE_PNG, MediaTypeUtils.parse("png"));
        assertEquals(MediaType.APPLICATION_OCTET_STREAM, MediaTypeUtils.parse("README"));
        assertThrows(IllegalArgumentException.class, () -> MediaTypeUtils.parse(""));
        assertThrows(IllegalArgumentException.class, () -> MediaTypeUtils.parse("  "));
        assertThrows(IllegalArgumentException.class, () -> MediaTypeUtils.parse(null));
    }

    /**
     * BF-141 (plan section 9 row "MediaTypeUtils is case-sensitive: IMG.JPG is served as application/octet-stream"): the
     * extension is matched in any case, so {@code LOGO.PNG} or {@code IMG_0001.JPG}, stored with the name as uploaded and
     * served by MaterialController.download, get their media type. Catches: the extension matched as written.
     */
    @Test
    public void anExtensionIsRecognisedInAnyCaseBF141() {
        Map<String, MediaType> expected = new LinkedHashMap<>();
        expected.put("LOGO.PNG", MediaType.IMAGE_PNG);
        expected.put("IMG_0001.JPG", MediaType.IMAGE_JPEG);
        expected.put("Photo.Jpeg", MediaType.IMAGE_JPEG);
        expected.put("SCAN.PDF", MediaType.APPLICATION_PDF);
        expected.put("ICON.SVG", SVG);
        expected.put("a.GIF", MediaType.IMAGE_GIF);
        expected.put("ARCHIVE.ZIP", MediaType.APPLICATION_OCTET_STREAM);
        expected.forEach((name, type) -> {
            MediaType actual = MediaTypeUtils.parse(name);
            System.out.println("[MediaTypeAndUriUtilsTest] " + name + " -> " + actual);
            assertEquals(type, actual, name);
        });
        assertEquals(MediaType.IMAGE_PNG, MediaTypeUtils.getMediaType("PNG"));
    }

    /**
     * BF-141: the extension is lower-cased without the default locale, under which a Turkish {@code GIF} becomes
     * {@code gıf} (dotless i). Catches: {@code toLowerCase()} with the default locale.
     */
    @Test
    public void anUpperCaseExtensionIsRecognisedUnderATurkishDefaultLocaleBF141() {
        Locale previous = Locale.getDefault();
        Locale.setDefault(TURKISH);
        try {
            MediaType actual = MediaTypeUtils.parse("a.GIF");
            System.out.println("[MediaTypeAndUriUtilsTest] a.GIF under " + Locale.getDefault() + " -> " + actual);
            assertEquals(MediaType.IMAGE_GIF, actual);
        } finally {
            Locale.setDefault(previous);
        }
    }

    @Test
    public void theRefererDomainIsTheLowerCasedHostOrEmpty() {
        assertEquals("app.example.com", UriUtils.getRefererDomainFromRequest(exchange("http://x/", "https://App.Example.COM:8443/path?q=1")));
        assertEquals("", UriUtils.getRefererDomainFromRequest(exchange("http://x/", null)));
        assertEquals("", UriUtils.getRefererDomainFromRequest(exchange("http://x/", "  ")));
        assertEquals("", UriUtils.getRefererDomainFromRequest(exchange("http://x/", "mailto:someone@example.com")), "a referer without a host");
        assertEquals(URI.create("https://a.b/c"), UriUtils.getRefererURI(exchange("http://x/", "https://a.b/c").getRequest()));
        assertNull(UriUtils.getRefererURI(exchange("http://x/", null).getRequest()));
    }

    /**
     * BF-143: the referer header is client-controlled; a value that is not a valid URI (a space is enough) is treated as
     * no referer, an empty domain and a null URI, instead of an IllegalArgumentException that GlobalContextFilter (every
     * request) and CookieHelper (the session cookie) let escape. Catches: the parse failure escaping again.
     */
    @Test
    public void anUnparsableRefererIsTreatedAsAbsentBF143() {
        for (String referer : UNPARSABLE_REFERERS) {
            MockServerWebExchange exchange = exchange("http://x/", referer);
            String domain = UriUtils.getRefererDomainFromRequest(exchange);
            URI uri = UriUtils.getRefererURI(exchange.getRequest());
            System.out.println("[MediaTypeAndUriUtilsTest] referer '" + referer + "' -> domain '" + domain + "', uri " + uri);
            assertEquals("", domain, referer);
            assertNull(uri, referer);
        }
    }

    @Test
    public void theRefererDomainFromTheContextIsEmptyWithoutADomainEntry() {
        assertEquals("example.com", UriUtils.getRefererDomainFromContext().contextWrite(ctx -> ctx.put(org.lowcoder.sdk.constants.GlobalContext.DOMAIN, "example.com")).block());
        assertNull(UriUtils.getRefererDomainFromContext().block());
        assertEquals(Mono.empty().block(), UriUtils.getRefererDomainFromContext().block());
    }

    @Test
    public void theTopPrivateDomainIsTheRegistrableDomainInLowerCaseOrTheHostItself() {
        assertEquals("example.co.uk", UriUtils.getTopPrivateDomain(exchange("https://a.b.example.co.uk/x", null)));
        assertEquals("example.com", UriUtils.getTopPrivateDomain(exchange("https://WWW.Example.COM/x", null)));
        assertEquals("example.com", UriUtils.getTopPrivateDomain(exchange("https://example.com/x", null)));
        assertEquals("localhost", UriUtils.getTopPrivateDomain(exchange("http://localhost:8080/x", null)));
        assertEquals("localhost", UriUtils.getTopPrivateDomain(exchange("http://LOCALHOST/x", null)));
        assertEquals("127.0.0.1", UriUtils.getTopPrivateDomain(exchange("http://127.0.0.1:3000/x", null)), "an IP address is not a domain name");
        assertEquals("intranet", UriUtils.getTopPrivateDomain(exchange("http://intranet/x", null)), "a single label has no public suffix: the error is logged and the host returned");
        assertEquals("co.uk", UriUtils.getTopPrivateDomain(exchange("http://co.uk/x", null)), "a bare public suffix has no private part");
    }

    /**
     * Observation: the top private domain falls back to {@code uri.getHost().toLowerCase()} (UriUtils.java:59), which is a
     * NullPointerException for a request URI without a host. Its only caller is CookieHelper.java:60, in cloud mode.
     */
    @Test
    public void aRequestUriWithoutAHostFailsWithANullPointerException() {
        MockServerWebExchange hostless = MockServerWebExchange.from(MockServerHttpRequest.get("/relative").build());

        assertThrows(NullPointerException.class, () -> UriUtils.getTopPrivateDomain(hostless));
    }


    /**
     * NEW-40: the referer domain is lower-cased with {@code Locale.ROOT}'s rule under a Turkish default locale; the
     * default locale's rule made {@code API.EXAMPLE.COM} {@code apı.example.com}. The case holds JUnit's
     * {@code Resources.LOCALE} lock while it changes the default locale; the lock orders it only against tests that
     * hold the same lock, and it restores the locale after its calls, which block, have completed.
     */
    @Test
    @ResourceLock(Resources.LOCALE)
    public void theRefererDomainIsLowerCasedUnderATurkishDefaultLocaleNEW40() {
        Locale previous = Locale.getDefault();
        Locale.setDefault(TURKISH);
        try {
            String referer = UriUtils.getRefererDomainFromRequest(exchange(ANY_REQUEST_URL, UPPER_CASE_REFERER));
            System.out.println("[MediaTypeAndUriUtilsTest] under " + Locale.getDefault() + ": referer " + UPPER_CASE_REFERER + " -> " + referer);
            assertEquals(LOWER_CASE_REFERER_DOMAIN, referer);
        } finally {
            Locale.setDefault(previous);
        }
    }

    /**
     * NEW-40: the host the top private domain falls back to (a single label, which has no public suffix) is lower-cased
     * with {@code Locale.ROOT}'s rule under a Turkish default locale; the default locale's rule made {@code INTRANET}
     * {@code ıntranet}. The registrable domain comes lower-cased from Guava ({@code InternetDomainName}), so the
     * conversion after it, left with the default locale, gives it unchanged; its case is the control. The case holds
     * JUnit's {@code Resources.LOCALE} lock while it changes the default locale; the lock orders it only against tests
     * that hold the same lock, and it restores the locale after its calls, which block, have completed.
     */
    @Test
    @ResourceLock(Resources.LOCALE)
    public void theHostFallbackIsLowerCasedUnderATurkishDefaultLocaleNEW40() {
        Locale previous = Locale.getDefault();
        Locale.setDefault(TURKISH);
        try {
            String singleLabel = UriUtils.getTopPrivateDomain(exchange(UPPER_CASE_SINGLE_LABEL_URL, NO_REFERER));
            String registrable = UriUtils.getTopPrivateDomain(exchange(UPPER_CASE_REGISTRABLE_URL, NO_REFERER));
            System.out.println("[MediaTypeAndUriUtilsTest] under " + Locale.getDefault() + ": single label " + UPPER_CASE_SINGLE_LABEL_URL + " -> "
                    + singleLabel + ", registrable " + UPPER_CASE_REGISTRABLE_URL + " -> " + registrable);
            assertEquals(LOWER_CASE_SINGLE_LABEL, singleLabel);
            assertEquals(LOWER_CASE_REGISTRABLE_DOMAIN, registrable);
        } finally {
            Locale.setDefault(previous);
        }
    }
}
