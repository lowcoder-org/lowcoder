package org.lowcoder.plugin.googlesheets.queryhandler;

import java.io.IOException;
import java.net.Proxy;
import java.net.ProxySelector;
import java.net.SocketAddress;
import java.net.URI;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Test guard that stops any request to a host or port other than the test's own loopback servers. It is a
 * {@link ProxySelector}: {@code HttpURLConnection} (so {@code NetHttpTransport}, which the Google client uses) asks
 * {@link ProxySelector#getDefault()} before it resolves or connects, and this selector throws for a foreign URI, so
 * nothing is resolved or connected for it.
 *
 * <p>Limits: it covers only clients that consult {@code ProxySelector.getDefault()} (HttpURLConnection and
 * NetHttpTransport without an explicit proxy). It does NOT cover Reactor Netty, raw sockets, or a client that is given an
 * explicit {@link Proxy}. It is JVM-wide: it is installed with {@link ProxySelector#setDefault} in {@code @BeforeEach}
 * and the previous selector restored in {@code @AfterEach}, so tests using it must not run in parallel with other tests
 * (this module runs its classes sequentially).
 */
final class ForeignHostGuard extends ProxySelector {

    static final String LOOPBACK = "127.0.0.1";

    private final Set<Integer> allowedPorts;
    private final List<String> allowed = new CopyOnWriteArrayList<>();
    private final List<String> foreign = new CopyOnWriteArrayList<>();

    ForeignHostGuard(Set<Integer> allowedPorts) {
        this.allowedPorts = allowedPorts;
    }

    @Override
    public List<Proxy> select(URI uri) {
        if (LOOPBACK.equals(uri.getHost()) && allowedPorts.contains(uri.getPort())) {
            allowed.add(uri.toString());
            return List.of(Proxy.NO_PROXY);
        }
        foreign.add(uri.toString());
        throw new IllegalStateException("GUARD: request to a foreign host " + uri.getHost() + ":" + uri.getPort());
    }

    @Override
    public void connectFailed(URI uri, SocketAddress address, IOException failure) {
        // nothing to do: the guard only decides which URIs may be used
    }

    /** The URIs the guard let through. */
    List<String> allowed() {
        return allowed;
    }

    /** The URIs the guard refused (must be empty in every test). */
    List<String> foreign() {
        return foreign;
    }
}
