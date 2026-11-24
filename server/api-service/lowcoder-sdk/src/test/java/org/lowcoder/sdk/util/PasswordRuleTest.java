package org.lowcoder.sdk.util;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.Set;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

/**
 * {@link PasswordRule} (D-48) must accept and refuse exactly what the client's JS rule
 * ({@code checkPassWithMsg}) does. Every non-ASCII or invisible character is written as a Java
 * Unicode escape (backslash, u, four hex digits), never as a literal character, so the file
 * stays readable in any editor (tab, LF, VT, FF and CR use the standard one-letter escapes instead).
 */
class PasswordRuleTest {

    /**
     * The 25 code points of ECMAScript {@code /\s/} (WhiteSpace + LineTerminator), measured on Node
     * v24.14.1 as documented in {@link PasswordRule}'s javadoc.
     */
    private static final Set<Integer> JS_WHITESPACE = Set.of(
            0x0009, 0x000A, 0x000B, 0x000C, 0x000D, 0x0020,
            0x00A0, 0x1680,
            0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A,
            0x2028, 0x2029, 0x202F, 0x205F, 0x3000, 0xFEFF);

    private static Stream<Arguments> acceptanceCases() {
        return Stream.of(
                Arguments.of("null", null, false),
                Arguments.of("empty", "", false),
                Arguments.of("7 UTF-16 code units", "Passw0r", false),
                Arguments.of("exactly 8", "Passw0rd", true),
                Arguments.of("8 code units, 5 code points", "a1" + "\uD83D\uDE00".repeat(3), true),
                Arguments.of("7 code units", "a1" + "\uD83D\uDE00".repeat(2) + "b", false),
                Arguments.of("no ASCII digit", "Passwordx", false),
                Arguments.of("no ASCII letter", "12345678", false),
                Arguments.of("non-ASCII letters only", "\u00E9".repeat(7) + "1", false),
                Arguments.of("non-ASCII digit only", "Password\u0663", false),
                Arguments.of("space", "Pass w0rd", false),
                Arguments.of("tab", "Passw0rd\t", false),
                Arguments.of("LF", "Passw0rd\n", false),
                Arguments.of("VT", "Passw0rd\u000B", false),
                Arguments.of("FF", "Passw0rd\f", false),
                Arguments.of("CR", "Passw0rd\r", false),
                Arguments.of("NBSP", "Passw0rd\u00A0", false),
                Arguments.of("U+1680", "Passw0rd\u1680", false),
                Arguments.of("U+2000", "Passw0rd\u2000", false),
                Arguments.of("U+200A", "Passw0rd\u200A", false),
                Arguments.of("U+2028", "Passw0rd\u2028", false),
                Arguments.of("U+2029", "Passw0rd\u2029", false),
                Arguments.of("U+202F", "Passw0rd\u202F", false),
                Arguments.of("U+205F", "Passw0rd\u205F", false),
                Arguments.of("U+3000", "Passw0rd\u3000", false),
                Arguments.of("U+FEFF", "Passw0rd\uFEFF", false),
                Arguments.of("zero-width space (not JS whitespace)", "Passw0rd\u200B", true),
                Arguments.of("U+180E (not JS whitespace since Unicode 6.3)", "Passw0rd\u180E", true),
                Arguments.of("e2e password", "Passw0rd-e2e", true),
                Arguments.of("e2e password changed", "Passw0rd-e2e-changed", true),
                Arguments.of("e2e password other", "Passw0rd-e2e-other", true),
                Arguments.of("UpdatePasswordRequest fixture", "UpdatePasswordRequest.newPassword1", true),
                Arguments.of("ResetLostPasswordRequest fixture", "ResetLostPasswordRequest.newPassword1", true),
                Arguments.of("UserEndpointsContractTest fixture", "UserEndpointsContractTest.password1", true),
                Arguments.of("lowcoder1 fixture", "lowcoder1", true),
                Arguments.of("the measured defect value", "a", false));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("acceptanceCases")
    void isAcceptable_matchesTheClientRule(String label, String value, boolean expected) {
        boolean actual = PasswordRule.isAcceptable(value);
        System.out.println("[PasswordRuleTest] " + label + " -> " + actual + " (expected " + expected + ")");
        assertEquals(expected, actual, label);
    }

    @Test
    void everyCodeUnitIsRefusedExactlyWhenItIsJsWhitespace() {
        for (int c = 0; c <= 0xFFFF; c++) {
            boolean expectedAcceptable = !JS_WHITESPACE.contains(c);
            boolean actual = PasswordRule.isAcceptable("Passw0rd" + (char) c);
            assertEquals(expectedAcceptable, actual, "code unit 0x" + Integer.toHexString(c));
        }
        System.out.println("[PasswordRuleTest] every code unit 0x0000-0xFFFF matches JS_WHITESPACE membership");
    }

    @Test
    void minLengthIsEight() {
        assertEquals(8, PasswordRule.MIN_LENGTH);
        System.out.println("[PasswordRuleTest] MIN_LENGTH=" + PasswordRule.MIN_LENGTH);
    }
}
