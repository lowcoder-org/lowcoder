package org.lowcoder.sdk.util;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.assertTrue;

import java.util.Locale;

import org.junit.After;
import org.junit.Test;
import org.lowcoder.sdk.constants.AuthSourceConstants;

/**
 * The form-login and SSO paths resolve an account by address through {@link EmailUtils}, so the exact
 * behaviour of these three methods -- including their null and locale edges -- decides who can log in.
 * (Password recovery is the exception: {@code UserServiceImpl#lostPassword} still resolves by
 * {@code user.name} and does not go through this class.)
 *
 * <p>Each assertion prints what it checked, so a failure in CI shows the offending value rather than just a
 * line number.
 */
public class EmailUtilsTest {

    private static final String CANONICAL = "john@doe.com";
    private static final String MIXED_CASE = "JoHn@DoE.CoM";
    private static final String GITHUB_SUBJECT = "AbC123";

    /** Restores whatever locale the JVM started with, so the Turkish test cannot leak into the others. */
    private final Locale originalDefault = Locale.getDefault();

    @After
    public void restoreDefaultLocale() {
        Locale.setDefault(originalDefault);
    }

    private void checkNormalize(String input, String expected) {
        String actual = EmailUtils.normalize(input);
        System.out.printf("normalize(%s) -> %s (expected %s)%n",
                quote(input), quote(actual), quote(expected));
        assertEquals("normalize(" + quote(input) + ")", expected, actual);
    }

    private void checkLooksLikeEmail(String input, boolean expected) {
        boolean actual = EmailUtils.looksLikeEmail(input);
        System.out.printf("looksLikeEmail(%s) -> %s (expected %s)%n", quote(input), actual, expected);
        assertEquals("looksLikeEmail(" + quote(input) + ")", expected, actual);
    }

    private static String quote(String value) {
        return value == null ? "null" : "\"" + value + "\"";
    }

    // ---------------------------------------------------------------- normalize

    @Test
    public void normalizeLowerCasesAndTrims() {
        checkNormalize(MIXED_CASE, CANONICAL);
        checkNormalize("  " + MIXED_CASE + "  ", CANONICAL);
        checkNormalize("\t" + CANONICAL + "\n", CANONICAL);
        checkNormalize(CANONICAL, CANONICAL);
    }

    /**
     * The whole point of normalizing is that it converges. Applying it twice must not move the value again,
     * or a value normalized on write would stop matching the same value normalized on read.
     */
    @Test
    public void normalizeIsIdempotent() {
        String once = EmailUtils.normalize("  " + MIXED_CASE + " ");
        String twice = EmailUtils.normalize(once);
        System.out.printf("normalize twice: %s -> %s -> %s%n", quote(MIXED_CASE), quote(once), quote(twice));
        assertEquals(once, twice);
    }

    /** Null-safe by contract: callers compare the result without guarding, so it must never be null. */
    @Test
    public void normalizeReturnsEmptyStringForNullAndBlank() {
        checkNormalize(null, "");
        checkNormalize("", "");
        checkNormalize("   ", "");
    }

    /**
     * {@code String.trim()} only strips characters at or below U+0020, so interior whitespace survives. That
     * is deliberate -- {@link EmailUtils#looksLikeEmail} is what rejects such values; normalize does not
     * silently repair them into something that looks valid.
     */
    @Test
    public void normalizeDoesNotStripInteriorWhitespace() {
        checkNormalize(" John Doe@Example.com ", "john doe@example.com");
        assertFalse("a value with interior whitespace must still fail the shape check",
                EmailUtils.looksLikeEmail(EmailUtils.normalize(" John Doe@Example.com ")));
    }

    /**
     * The reason {@code toLowerCase(Locale.ROOT)} is spelled out in the implementation. Under a Turkish
     * locale the no-argument {@code toLowerCase()} maps {@code I} to the dotless {@code ı} (U+0131), so
     * {@code INFO@X.COM} would canonicalize differently depending on the JVM's locale -- two canonical forms
     * for one address, which is exactly the bug this class exists to remove.
     */
    @Test
    public void normalizeIsIndependentOfTheDefaultLocale() {
        Locale.setDefault(new Locale("tr", "TR"));

        String localeSensitive = "INFO@EXAMPLE.COM".toLowerCase();
        String normalized = EmailUtils.normalize("INFO@EXAMPLE.COM");
        System.out.printf("under tr-TR: toLowerCase() -> %s, EmailUtils.normalize() -> %s%n",
                quote(localeSensitive), quote(normalized));

        assertEquals("normalize must use Locale.ROOT", "info@example.com", normalized);
        assertFalse("sanity: the default-locale lower-case really does differ under tr-TR, "
                        + "so this test is actually exercising the difference",
                localeSensitive.equals(normalized));
    }

    // -------------------------------------------------- normalizeIfEmailSource

    @Test
    public void normalizeIfEmailSourceNormalizesOnlyEmailConnections() {
        String normalized = EmailUtils.normalizeIfEmailSource(AuthSourceConstants.EMAIL, "  " + MIXED_CASE + " ");
        System.out.printf("normalizeIfEmailSource(EMAIL, %s) -> %s%n", quote(MIXED_CASE), quote(normalized));
        assertEquals(CANONICAL, normalized);
    }

    /**
     * For every non-EMAIL source the value is the IdP's opaque subject, not an address. Lower-casing one
     * would let the subject {@code AbC123} authenticate as {@code abc123} -- a different account at the
     * provider.
     */
    @Test
    public void normalizeIfEmailSourceLeavesOpaqueSubjectsByteExact() {
        for (String source : new String[] {
                AuthSourceConstants.GOOGLE,
                AuthSourceConstants.GITHUB,
                AuthSourceConstants.ORY,
                AuthSourceConstants.KEYCLOAK,
                "SOME_FUTURE_PROVIDER",
                null }) {
            String actual = EmailUtils.normalizeIfEmailSource(source, GITHUB_SUBJECT);
            System.out.printf("normalizeIfEmailSource(%s, %s) -> %s%n",
                    quote(source), quote(GITHUB_SUBJECT), quote(actual));
            assertSame("source " + quote(source) + " must pass the subject through untouched",
                    GITHUB_SUBJECT, actual);
        }
    }

    /**
     * Null-preserving for every source, unlike {@link EmailUtils#normalize}. A connection whose {@code rawId}
     * or {@code email} is absent must stay absent: {@code ""} is a value, and a stored {@code ""} address
     * would read as an address that no lookup can ever resolve.
     */
    @Test
    public void normalizeIfEmailSourcePreservesNull() {
        for (String source : new String[] { AuthSourceConstants.EMAIL, AuthSourceConstants.GOOGLE, null }) {
            String actual = EmailUtils.normalizeIfEmailSource(source, null);
            System.out.printf("normalizeIfEmailSource(%s, null) -> %s%n", quote(source), quote(actual));
            assertNull("null must survive for source " + quote(source), actual);
        }
    }

    // ---------------------------------------------------------- looksLikeEmail

    @Test
    public void looksLikeEmailAcceptsRealAddresses() {
        checkLooksLikeEmail(CANONICAL, true);
        checkLooksLikeEmail("John.Doe+tag@sub.example.co.uk", true);
        checkLooksLikeEmail("a@b", true);
    }

    /**
     * No dot-in-domain requirement, on purpose. Self-hosted instances really do have accounts at
     * {@code localhost} and at single-label intranet hosts, and rejecting those would lock those operators
     * out of their own deployment.
     */
    @Test
    public void looksLikeEmailAcceptsDotlessDomains() {
        checkLooksLikeEmail("root@localhost", true);
        checkLooksLikeEmail("user@intranet", true);
    }

    @Test
    public void looksLikeEmailRejectsMissingOrEmptyParts() {
        checkLooksLikeEmail(null, false);
        checkLooksLikeEmail("", false);
        checkLooksLikeEmail("   ", false);
        checkLooksLikeEmail("notanemail", false);
        checkLooksLikeEmail("@example.com", false);
        checkLooksLikeEmail("user@", false);
        checkLooksLikeEmail("@", false);
    }

    @Test
    public void looksLikeEmailRejectsMultipleAtSigns() {
        checkLooksLikeEmail("a@b@c.com", false);
        checkLooksLikeEmail("user@@example.com", false);
    }

    /**
     * Whitespace anywhere is a reject, including the leading and trailing kind. Callers must
     * {@link EmailUtils#normalize} first -- that ordering is what the production call sites do, and this
     * pins it so a future caller that forgets the trim gets a rejection rather than a stored
     * {@code " john@doe.com "}.
     */
    @Test
    public void looksLikeEmailRejectsAnyWhitespaceAndRequiresNormalizeFirst() {
        checkLooksLikeEmail("John Doe@example.com", false);
        checkLooksLikeEmail("user@exa mple.com", false);
        checkLooksLikeEmail("user\t@example.com", false);
        checkLooksLikeEmail(" " + CANONICAL + " ", false);

        assertTrue("normalize() first is what makes a padded address acceptable",
                EmailUtils.looksLikeEmail(EmailUtils.normalize(" " + CANONICAL + " ")));
    }

    /**
     * The values that actually reached production as if they were addresses: a display name and an empty
     * string, both written by endpoints that validated nothing.
     */
    @Test
    public void looksLikeEmailRejectsTheValuesThatUsedToBeStoredAsAddresses() {
        checkLooksLikeEmail("Iron Man", false);
        checkLooksLikeEmail("octocat", false);
        checkLooksLikeEmail("", false);
    }
}
