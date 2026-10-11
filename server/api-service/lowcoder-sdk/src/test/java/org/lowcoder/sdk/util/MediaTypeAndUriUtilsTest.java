package org.lowcoder.sdk.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.net.URI;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;

import reactor.core.publisher.Mono;

/**
 * {@link MediaTypeUtils} (the content type a stored material is served with) and {@link UriUtils} (the referer and the
 * cookie domain of a request).
 */
public class MediaTypeAndUriUtilsTest {

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
     * DEFECT pinned (new plan section 9 row "MediaTypeUtils is case-sensitive: IMG.JPG is served as
     * application/octet-stream"; D-6, fix deferred). {@code getMediaType} switches on the extension as written
     * (MediaTypeUtils.java:34-41), and the only caller, MaterialController.download (MaterialController.java:59), passes the
     * stored file name as uploaded (MaterialApiServiceImpl.upload keeps it unchanged), so a file named {@code IMG_0001.JPG} or
     * {@code LOGO.PNG} is served with {@code application/octet-stream}, also for the inline preview. A fix that lower-cases
     * the extension turns these assertions red.
     */
    @Test
    public void anUpperCaseExtensionIsNotRecognisedAndGetsOctetStreamD() {
        for (String name : new String[] {"LOGO.PNG", "IMG_0001.JPG", "Photo.Jpeg", "SCAN.PDF", "ICON.SVG", "a.GIF"}) {
            MediaType type = MediaTypeUtils.parse(name);
            System.out.println("[MediaTypeAndUriUtilsTest] " + name + " -> " + type);
            assertEquals(MediaType.APPLICATION_OCTET_STREAM, type, name);
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
     * Observation (callers reported to the coordinator): the referer header is client-controlled and is parsed with
     * {@code URI.create}, so a value that is not a valid URI (a space is enough) throws an IllegalArgumentException. Callers:
     * GlobalContextFilter.java:111 (every request, inside the context write) and CookieHelper.java:50 (the session cookie).
     */
    @Test
    public void anInvalidRefererThrowsAnIllegalArgumentExceptionToItsCaller() {
        for (String referer : new String[] {"http://bad host/", "http://a b", "<script>"}) {
            IllegalArgumentException failure = assertThrows(IllegalArgumentException.class,
                    () -> UriUtils.getRefererDomainFromRequest(exchange("http://x/", referer)), referer);
            System.out.println("[MediaTypeAndUriUtilsTest] referer '" + referer + "' -> " + failure.getMessage());
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
}
