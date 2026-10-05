package org.lowcoder.plugin.graphql;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.lang.reflect.Method;
import java.net.InetSocketAddress;
import java.net.SocketAddress;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Consumer;
import java.util.function.Supplier;

import io.netty.resolver.AddressResolver;
import io.netty.resolver.AddressResolverGroup;
import io.netty.util.concurrent.DefaultEventExecutor;
import io.netty.util.concurrent.EventExecutor;
import io.netty.util.concurrent.Future;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.restapi.auth.AuthConfig;
import org.lowcoder.sdk.webclient.SafeHostResolverGroup;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.BodyInserter;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.Connection;
import reactor.netty.ConnectionObserver;
import reactor.netty.http.client.HttpClient;
import reactor.netty.resources.ConnectionProvider;
import reactor.netty.transport.TransportConfig;

/**
 * DEFECT pinned (plan section 9 row "SSRF guard bypass: a relative Location is followed as a host-less URI that the
 * disallowed-hosts resolver does not stop"; D-6, fix deferred; goes with D14): the executor's disallowed hosts work
 * through {@code SafeHostResolverGroup}, set on the HttpClient by {@code WebClientBuildHelper}. The guard sees only
 * addresses that are still unresolved when the transport connects. For a host-less URI (a relative {@code Location}
 * followed as given, GraphQLExecutor.java:343-347) Reactor Netty hands the connection provider an address that is already
 * resolved ({@code localhost}, port 80, here {@code /[0:0:0:0:0:0:0:1]:80}), so the resolver group answers
 * {@code isResolved == true} and the transport skips it: a disallowed-hosts entry for {@code localhost} does not stop the
 * request. (An earlier run of the REST test with {@code disallowedHosts=[localhost]} reached the machine's localhost:80.)
 *
 * <p>How the test stays hermetic: the HttpClient uses a connection provider that connects only to the local recording
 * server (by its port) and, for any other address, records it and fails without ever opening a socket. The test
 * therefore sends nothing to any uncontrolled address. The redirecting request goes through the executor's private
 * {@code httpCall} (reflection) with a WebClient built on that HttpClient, configured as WebClientBuildHelper does
 * (resolver = SafeHostResolverGroup with {@code localhost} disallowed).
 *
 * <p>The obvious fix, resolving the relative Location against the request URI ({@code uri.resolve(redirectUrl)}), makes
 * the second request go to the recording server, so no host-less address reaches the provider and this test turns red.
 *
 * <p>Limits: the HttpClient is built here the way WebClientBuildHelper builds it, not obtained from the executor; the
 * test shows what the guard is shown for a host-less URI, not the behaviour of every Netty version.
 */
class GraphQLHostlessUriResolverGuardTest {

    private static final int HTTP_DEFAULT_PORT = 80;

    /** Connects only to the loopback server on {@code allowedPort}; records and fails every other address, never connecting. */
    private static final class GuardedProvider implements ConnectionProvider {
        private final ConnectionProvider delegate = ConnectionProvider.newConnection();
        private final int allowedPort;
        final List<SocketAddress> refused = new CopyOnWriteArrayList<>();
        volatile AddressResolverGroup<?> resolverGroup;

        GuardedProvider(int allowedPort) {
            this.allowedPort = allowedPort;
        }

        @Override
        public Mono<? extends Connection> acquire(TransportConfig config, ConnectionObserver observer,
                Supplier<? extends SocketAddress> remoteAddress, AddressResolverGroup<?> group) {
            SocketAddress address = remoteAddress.get();
            if (address instanceof InetSocketAddress inet && inet.getPort() == allowedPort) {
                return delegate.acquire(config, observer, remoteAddress, group);
            }
            refused.add(address);
            resolverGroup = group;
            return Mono.error(new IllegalStateException("refused without connecting: " + address));
        }
    }

    @Test
    void aHostlessRedirectTargetReachesTheTransportAsAnAlreadyResolvedAddressTheGuardIsNotAskedAboutD14() throws ReflectiveOperationException {
        try (RecordingHttpServer server = RecordingHttpServer.serve(Map.of(
                "/start", request -> GraphQLCallSupport.redirect(302, "/next"),
                "/next", request -> GraphQLCallSupport.json(200, "{}")))) {
            GuardedProvider provider = new GuardedProvider(server.port());
            HttpClient httpClient = HttpClient.create(provider).resolver(new SafeHostResolverGroup(Set.of("localhost")));
            WebClient client = WebClient.builder().clientConnector(new ReactorClientHttpConnector(httpClient)).build();
            Method httpCall = GraphQLExecutor.class.getDeclaredMethod("httpCall", WebClient.class, HttpMethod.class, URI.class,
                    BodyInserter.class, int.class, AuthConfig.class, Consumer.class);
            httpCall.setAccessible(true);
            URI origin = URI.create(server.baseUrl() + "/start");

            Mono<?> call = (Mono<?>) httpCall.invoke(new GraphQLExecutor(new CommonConfig()), client, HttpMethod.POST, origin,
                    BodyInserters.fromValue(new byte[0]), 0, null, (Consumer<HttpHeaders>) headers -> { });
            assertThatThrownBy(() -> call.block(GraphQLCallSupport.TIMEOUT)).isInstanceOf(PluginException.class);

            System.out.println("[GraphQLHostlessUriResolverGuardTest] addresses refused by the provider: " + provider.refused
                    + "; the recording server saw " + server.requests().stream().map(RecordingHttpServer.Request::pathAndQuery).toList());
            assertThat(server.requests()).extracting(RecordingHttpServer.Request::pathAndQuery).containsExactly("/start");
            assertThat(provider.refused).hasSize(1);
            InetSocketAddress hostless = (InetSocketAddress) provider.refused.get(0);
            assertThat(hostless.getPort()).isEqualTo(HTTP_DEFAULT_PORT);
            assertThat(hostless.getAddress().isLoopbackAddress()).isTrue();
            assertThat(hostless.isUnresolved()).as("the address is already resolved when the transport gets it").isFalse();

            EventExecutor executor = new DefaultEventExecutor();
            try {
                @SuppressWarnings("unchecked")
                AddressResolver<SocketAddress> resolver = (AddressResolver<SocketAddress>) provider.resolverGroup.getResolver(executor);
                assertThat(provider.resolverGroup).isInstanceOf(SafeHostResolverGroup.class);
                assertThat(resolver.isResolved(hostless)).as("a resolved address is not passed to the resolver: the guard is skipped").isTrue();
                // control: asked about the same name as an unresolved address, the guard does reject it
                Future<SocketAddress> asked = resolver.resolve(InetSocketAddress.createUnresolved("localhost", HTTP_DEFAULT_PORT));
                asked.await(5000);
                System.out.println("[GraphQLHostlessUriResolverGuardTest] guard asked about unresolved localhost:80 -> " + asked.cause());
                assertThat(asked.isSuccess()).isFalse();
                assertThat(asked.cause()).hasMessageContaining("Host not allowed");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException(e);
            } finally {
                executor.shutdownGracefully();
            }
        }
    }
}
