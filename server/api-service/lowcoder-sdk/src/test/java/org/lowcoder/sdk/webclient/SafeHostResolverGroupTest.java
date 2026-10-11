package org.lowcoder.sdk.webclient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.netty.resolver.AddressResolver;
import io.netty.util.concurrent.DefaultEventExecutor;
import io.netty.util.concurrent.Future;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.UnknownHostException;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.stream.Collectors;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

/**
 * Tests the SSRF guard {@link SafeHostResolverGroup}. Every resolver is obtained through the group's public
 * {@code getResolver}, so a constructor or {@code newResolver} that drops the disallowed set is caught.
 * Callers must pass unresolved addresses (Netty returns an already-resolved address without consulting the
 * name resolver); WebClientBuildHelper:129 does, via Reactor Netty. Hence every test uses
 * {@link InetSocketAddress#createUnresolved}. Only IP literals and "localhost" are used: no DNS is needed.
 * The two UnknownHostException catch branches (failing DNS lookup) are deliberately not covered.
 */
class SafeHostResolverGroupTest {

    private static final String NOT_ALLOWED_MESSAGE = "Host not allowed.";
    private static final String LOOPBACK_IP = "127.0.0.1";
    private static final String LOCALHOST = "localhost";
    private static final String UNRELATED_IP = "203.0.113.7";
    private static final int PORT = 8080;
    private static final long TIMEOUT_SECONDS = 10;

    private static DefaultEventExecutor executor;

    @BeforeAll
    static void startExecutor() {
        executor = new DefaultEventExecutor();
    }

    @AfterAll
    static void stopExecutor() {
        executor.shutdownGracefully(0, 1, TimeUnit.SECONDS);
    }

    private static AddressResolver<InetSocketAddress> resolver(Set<String> disallowed) {
        return new SafeHostResolverGroup(disallowed).getResolver(executor);
    }

    private static <T> T await(Future<T> future) throws ExecutionException, InterruptedException, TimeoutException {
        return future.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
    }

    private static void assertRejected(Future<?> future, String what) {
        assertThatThrownBy(() -> await(future))
                .as(what)
                .isInstanceOf(ExecutionException.class)
                .hasCauseInstanceOf(UnknownHostException.class)
                .hasRootCauseMessage(NOT_ALLOWED_MESSAGE);
        System.out.println("[SafeHostResolverGroupTest] rejected: " + what);
    }

    @Test
    void resolveRejectsDisallowedIpLiteral() {
        assertRejected(resolver(Set.of(LOOPBACK_IP)).resolve(InetSocketAddress.createUnresolved(LOOPBACK_IP, PORT)),
                "resolve(127.0.0.1) with 127.0.0.1 disallowed");
    }

    @Test
    void resolveRejectsHostNameWhoseResolvedAddressIsDisallowed() throws Exception {
        String resolvedIp = InetAddress.getByName(LOCALHOST).getHostAddress();
        assertThat(resolvedIp).isNotEqualTo(LOCALHOST);
        assertRejected(resolver(Set.of(resolvedIp)).resolve(InetSocketAddress.createUnresolved(LOCALHOST, PORT)),
                "resolve(localhost) with its resolved IP " + resolvedIp + " disallowed (post-resolution check)");
    }

    @Test
    void resolveRejectsNameInDisallowedSetBeforeLookup() {
        assertRejected(resolver(Set.of(LOCALHOST)).resolve(InetSocketAddress.createUnresolved(LOCALHOST, PORT)),
                "resolve(localhost) with the name localhost disallowed");
    }

    @Test
    void resolveAllowsHostWhenOnlyAnotherIpDisallowed() throws Exception {
        InetSocketAddress result = await(resolver(Set.of(UNRELATED_IP))
                .resolve(InetSocketAddress.createUnresolved(LOCALHOST, PORT)));
        assertThat(result.getAddress()).isEqualTo(InetAddress.getByName(LOCALHOST));
        assertThat(result.getPort()).isEqualTo(PORT);
        System.out.println("[SafeHostResolverGroupTest] allowed localhost -> " + result);
    }

    @Test
    void resolveAllowsAllowedIpLiteral() throws Exception {
        InetSocketAddress result = await(resolver(Set.of())
                .resolve(InetSocketAddress.createUnresolved(LOOPBACK_IP, PORT)));
        assertThat(result.getAddress().getHostAddress()).isEqualTo(LOOPBACK_IP);
        assertThat(result.getPort()).isEqualTo(PORT);
        System.out.println("[SafeHostResolverGroupTest] allowed 127.0.0.1 -> " + result);
    }

    @Test
    void resolveAllRejectsNameInDisallowedSet() {
        assertRejected(resolver(Set.of(LOCALHOST)).resolveAll(InetSocketAddress.createUnresolved(LOCALHOST, PORT)),
                "resolveAll(localhost) with the name localhost disallowed");
    }

    /**
     * resolveAll rejects when ANY returned address is disallowed (here the last one).
     * Limit: catches a first-address-only check only where localhost resolves to several addresses; on a
     * single-address host (as in the L4-1 evidence) that mutation passes. Closing it needs a JVM hosts-file
     * override, which is outside the lane rules.
     */
    @Test
    void resolveAllRejectsWhenAnyReturnedAddressIsDisallowed() throws Exception {
        InetAddress[] all = InetAddress.getAllByName(LOCALHOST);
        // disallow only the LAST address, so a check of the first address alone would let it through
        String last = all[all.length - 1].getHostAddress();
        assertRejected(resolver(Set.of(last)).resolveAll(InetSocketAddress.createUnresolved(LOCALHOST, PORT)),
                "resolveAll(localhost) with only the last of " + all.length + " addresses (" + last + ") disallowed");
    }

    @Test
    void resolveAllAllowsHostWhenNoAddressDisallowed() throws Exception {
        List<InetSocketAddress> result = await(resolver(Set.of(UNRELATED_IP))
                .resolveAll(InetSocketAddress.createUnresolved(LOOPBACK_IP, PORT)));
        List<InetAddress> expected = Arrays.asList(InetAddress.getAllByName(LOOPBACK_IP));
        assertThat(result.stream().map(InetSocketAddress::getAddress).collect(Collectors.toList()))
                .containsExactlyElementsOf(expected);
        assertThat(result).allSatisfy(a -> assertThat(a.getPort()).isEqualTo(PORT));
        System.out.println("[SafeHostResolverGroupTest] resolveAll allowed -> " + result);
    }

    @Test
    void resolveAllRejectsDisallowedIpLiteral() {
        assertRejected(resolver(Set.of(LOOPBACK_IP)).resolveAll(InetSocketAddress.createUnresolved(LOOPBACK_IP, PORT)),
                "resolveAll(127.0.0.1) with 127.0.0.1 disallowed");
    }
}
