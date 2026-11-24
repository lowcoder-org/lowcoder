package org.lowcoder.sdk.util;

import java.util.regex.Pattern;

/**
 * The password rule of the client ({@code client/packages/lowcoder/src/pages/userAuth/authUtils.ts} {@code checkPassWithMsg}),
 * enforced by the server for every password a user chooses (D-48): sign-up, an admin's create-user route, password change,
 * lost-password reset, first password of a provider-only account. Same definitions as the browser: length in UTF-16 code
 * units ({@code String.length()} = JS {@code length}); an ASCII letter ({@code /[a-zA-Z]/}); an ASCII digit ({@code /\d/}
 * without the {@code u} flag); no character of JS {@code /\s/}, i.e. ECMAScript WhiteSpace plus LineTerminator, listed
 * explicitly because Java's {@code \s} matches only six of those 25 code points.
 *
 * <p>Not applied, on purpose: sign-in (existing weak passwords keep working), the super admin password from the environment
 * and server-generated passwords (ENTERPRISE reset). Limits: the whitespace list is the one Node v24.14.1 enumerates; a
 * future Unicode version that adds a space separator changes the browser's set but not this one. The en/zh/de texts of
 * {@code PASSWORD_TOO_WEAK} state the number 8; change them with {@link #MIN_LENGTH}. The rule is length, letter, digit
 * and whitespace only; no breach list or strength estimate (the client has none either); there is no forced rotation of
 * existing weak passwords.
 */
public final class PasswordRule {

    public static final int MIN_LENGTH = 8;

    /** JS {@code /\s/}: U+0009-000D, U+0020, U+00A0, U+1680, U+2000-200A, U+2028, U+2029, U+202F, U+205F, U+3000, U+FEFF. */
    private static final Pattern WHITESPACE = Pattern.compile(
            "[\\t\\n\\u000B\\f\\r \\u00A0\\u1680\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000\\uFEFF]");
    private static final Pattern ASCII_LETTER = Pattern.compile("[a-zA-Z]");
    private static final Pattern ASCII_DIGIT = Pattern.compile("[0-9]");

    private PasswordRule() {
    }

    /** Whether the client's rule accepts {@code password}; {@code null} is not acceptable. */
    public static boolean isAcceptable(String password) {
        return password != null
                && password.length() >= MIN_LENGTH
                && ASCII_LETTER.matcher(password).find()
                && ASCII_DIGIT.matcher(password).find()
                && !WHITESPACE.matcher(password).find();
    }
}
