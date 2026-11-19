package org.lowcoder.sdk.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

/**
 * {@link HostGuards}: hosts are compared by the addresses they resolve to (BF-022, BF-023). Only literal addresses,
 * {@code localhost} and a name under the reserved {@code .invalid} top-level domain (which never resolves) are used, so no
 * test depends on outside DNS.
 */
class HostGuardsTest {

    /** Both loopback forms are listed, so {@code localhost} is disallowed whichever address the machine resolves it to. */
    private static final Set<String> DISALLOWED = Set.of("127.0.0.1", "0:0:0:0:0:0:0:1", "169.254.169.254");

    @ParameterizedTest(name = "[{index}] ''{0}'' disallowed: {1}")
    @CsvSource({
            "127.0.0.1, true",
            "localhost, true",
            "127.1, true",
            "' 127.0.0.1 ', true",
            "169.254.169.254, true",
            "::1, true",
            "[::1], true",
            "127.0.0.2, false",
            "10.0.0.5, false",
            "no-such-host.invalid, false"})
    void isDisallowedComparesTheHostTextAndEveryResolvedAddress(String host, boolean expected) {
        boolean disallowed = HostGuards.isDisallowed(host, DISALLOWED);

        System.out.println("[HostGuardsTest] isDisallowed '" + host + "' against " + DISALLOWED + " -> " + disallowed);
        assertThat(disallowed).isEqualTo(expected);
    }

    @ParameterizedTest(name = "[{index}] ''{0}''")
    @ValueSource(strings = {"127.0.0.1", "localhost", "no-such-host.invalid"})
    void anEmptyOrMissingDisallowedListDisallowsNothing(String host) {
        assertThat(HostGuards.isDisallowed(host, Set.of())).isFalse();
        assertThat(HostGuards.isDisallowed(host, null)).isFalse();
    }

    @ParameterizedTest(name = "[{index}] ''{0}'' loopback or wildcard: {1}")
    @CsvSource({
            "localhost, true",
            "LOCALHOST, true",
            "127.0.0.2, true",
            "127.1, true",
            "' 127.0.0.1', true",
            "0.0.0.0, true",
            "::, true",
            "::1, true",
            "[::1], true",
            "0:0:0:0:0:0:0:1, true",
            "10.0.0.5, false",
            "192.168.1.20, false",
            "169.254.169.254, false",
            "[2001:db8::1], false",
            "no-such-host.invalid, false"})
    void isLoopbackOrWildcardResolvesTheHost(String host, boolean expected) {
        boolean refused = HostGuards.isLoopbackOrWildcard(host);

        System.out.println("[HostGuardsTest] isLoopbackOrWildcard '" + host + "' -> " + refused + " " + HostGuards.resolve(host));
        assertThat(refused).isEqualTo(expected);
    }

    /** A blank host has no addresses: InetAddress would answer it with the loopback address, which must not count. */
    @ParameterizedTest(name = "[{index}] ''{0}''")
    @NullSource
    @ValueSource(strings = {"", "   ", "[]"})
    void aBlankHostResolvesToNothing(String host) {
        assertThat(HostGuards.resolve(host)).isEmpty();
        assertThat(HostGuards.isLoopbackOrWildcard(host)).isFalse();
        assertThat(HostGuards.isDisallowed(host, DISALLOWED)).as("an immutable list is not asked for null").isFalse();
    }
}
