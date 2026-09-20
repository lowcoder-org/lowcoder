package org.lowcoder.sdk.util;

import java.util.Locale;

import org.apache.commons.lang3.StringUtils;
import org.lowcoder.sdk.constants.AuthSourceConstants;

/**
 * Canonical form for email addresses, and the shape check that decides whether a value is one.
 *
 * <p>Addresses are case-insensitive in practice, so {@code john@doe.com} and {@code JoHn@DoE.com} are one
 * identity. Nothing in this codebase enforced that: no normalization anywhere, and no MongoDB collation, so
 * the two registered as two separate accounts.
 */
public final class EmailUtils {

    private static final char AT = '@';

    private EmailUtils() {
    }

    /**
     * Trim, then lower-case. Null-safe: returns {@code ""} rather than null, so callers can compare without
     * guarding.
     *
     * <p>{@link Locale#ROOT} is not optional. The no-argument {@code toLowerCase()} uses the default locale,
     * and under a Turkish locale it maps {@code I} to the dotless {@code ı} -- so the same address would
     * canonicalize differently depending on the JVM's locale, which is exactly the class of bug this method
     * exists to remove.
     */
    public static String normalize(String value) {
        if (value == null) {
            return StringUtils.EMPTY;
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }

    /**
     * Normalizes only when the value really is an email address.
     *
     * <p>A connection's {@code rawId} holds the address for {@code EMAIL} connections and the <b>opaque IdP
     * subject</b> for every other source. Those subjects are case-sensitive: normalizing one would let the
     * subject {@code AbC} authenticate as {@code abc}. So the source, not the field, decides.
     *
     * <p>Unlike {@link #normalize}, this is <b>null-preserving</b>: null in, null out, for every source. It
     * is a field sanitizer -- it cleans a value that is being stored or matched, and must not invent a
     * value where there was none, because {@code ""} is a value and would later read as an address that
     * nothing can resolve. Use {@code normalize} instead when you need a non-null canonical form to
     * compare against.
     */
    public static String normalizeIfEmailSource(String source, String value) {
        if (value == null) {
            return null;
        }
        return AuthSourceConstants.EMAIL.equals(source) ? normalize(value) : value;
    }

    /**
     * Whether this value is shaped like an email address: exactly one {@code @}, a non-empty local part, a
     * non-empty domain part, and no whitespace anywhere.
     *
     * <p>Deliberately <b>no</b> dot-in-domain requirement. {@code root@localhost} and {@code user@intranet}
     * are real addresses on self-hosted instances, and rejecting them would lock those operators out.
     *
     * <p>This is a shape check, not a validity check -- it exists to keep values that are plainly not
     * addresses (a GitHub handle, a display name, an empty string) out of fields the login paths treat as
     * addresses. It is not an attempt to implement RFC 5322.
     */
    public static boolean looksLikeEmail(String value) {
        if (StringUtils.isBlank(value)) {
            return false;
        }
        int at = value.indexOf(AT);
        // no '@', or an empty local part
        if (at <= 0) {
            return false;
        }
        // more than one '@', or an empty domain part
        if (at != value.lastIndexOf(AT) || at == value.length() - 1) {
            return false;
        }
        return !StringUtils.containsWhitespace(value);
    }
}
