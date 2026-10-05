package org.lowcoder.plugin.graphql;

import static org.assertj.core.api.Assertions.assertThat;

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

import io.netty.resolver.AddressResolverGroup;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.contract.RecordingHttpServer;
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
 * BF-009 for GraphQL: the executor's disallowed hosts work through {@code SafeHostResolverGroup}, set on the HttpClient by
 * {@code WebClientBuildHelper}, and the guard sees only addresses that are still unresolved when the transport connects.
 * A relative {@code Location} followed as a host-less URI reached the transport as an already-resolved {@code localhost}
 * port 80 address that the guard was never asked about. The executor now resolves the {@code Location} against the URI
 * that answered, so the second request goes to the server that redirected and no host-less address reaches the
 * transport.
 *
 * <p>How the test stays hermetic: the HttpClient uses a connection provider that connects only to the local recording
 * server (by its port) and, for any other address, records it and fails without ever opening a socket. The redirecting
 * request goes through the executor's private {@code httpCall} (reflection) with a WebClient built on that HttpClient,
 * configured as WebClientBuildHelper does (resolver = SafeHostResolverGroup with {@code localhost} disallowed).
 *
 * <p>Limits: the HttpClient is built here the way WebClientBuildHelper builds it, not obtained from the executor.
 */
class GraphQLHostlessUriResolverGuardTest {

    /** Connects only to the loopback server on {@code allowedPort}; records and fails every other address, never connecting. */
    private static final class GuardedProvider implements ConnectionProvider {
        private final ConnectionProvider delegate = ConnectionProvider.newConnection();
        private final int allowedPort;
        final List<SocketAddress> refused = new CopyOnWriteArrayList<>();

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
            return Mono.error(new IllegalStateException("refused without connecting: " + address));
        }
    }

    @Test
    void aRelativeRedirectGoesToTheServerThatRedirectedAndNoHostlessAddressReachesTheTransport() throws ReflectiveOperationException {
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
            Object response = call.block(GraphQLCallSupport.TIMEOUT);

            System.out.println("[GraphQLHostlessUriResolverGuardTest] addresses refused by the provider: " + provider.refused
                    + "; the recording server saw " + server.requests().stream().map(RecordingHttpServer.Request::pathAndQuery).toList());
            assertThat(response).isNotNull();
            assertThat(server.requests()).extracting(RecordingHttpServer.Request::pathAndQuery).containsExactly("/start", "/next");
            assertThat(provider.refused).as("no address other than the recording server reached the transport").isEmpty();
        }
    }
}
