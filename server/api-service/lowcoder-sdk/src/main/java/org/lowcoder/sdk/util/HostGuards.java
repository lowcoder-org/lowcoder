package org.lowcoder.sdk.util;

import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

/**
 * Host checks of datasource guards that compare addresses, not host text: a host is resolved first, so another spelling of
 * the same machine ({@code localhost}, {@code 127.1}, {@code [::1]}, a name that resolves to it) is treated like the
 * address itself.
 * <p>
 * The HTTP clients get the same disallowed-hosts rule from {@code SafeHostResolverGroup}, which applies it inside the
 * client's own name resolution and so at every connection. The Elasticsearch and Mongo clients are built without such a
 * resolver hook, so these checks resolve the host themselves, once, before the client is built or the datasource is saved.
 * <p>
 * Limits: the lookup blocks, so callers run these checks off the request threads. A host that does not resolve passes
 * (the connection to it fails later anyway). The check holds at the time it runs: a name that resolves differently later
 * (DNS rebinding), or addresses the client looks up itself afterwards (such as the targets of a Mongo SRV record), are not
 * covered.
 */
public final class HostGuards {

    private static final String IPV6_LITERAL_START = "[";
    private static final String IPV6_LITERAL_END = "]";

    private HostGuards() {
    }

    /**
     * Whether the host text, or any address it resolves to, is in {@code disallowedHosts}: the rule
     * {@code SafeHostResolverGroup} applies to the HTTP clients. Addresses are compared in their
     * {@link InetAddress#getHostAddress()} form, so a list entry {@code 127.0.0.1} matches {@code localhost} and
     * {@code 127.1}, but an IPv6 address matches only its full form ({@code 0:0:0:0:0:0:0:1}). No list (null or empty)
     * disallows nothing.
     */
    public static boolean isDisallowed(String host, Set<String> disallowedHosts) {
        if (CollectionUtils.isEmpty(disallowedHosts)) {
            return false;
        }
        if (host != null && disallowedHosts.contains(host)) {
            return true;
        }
        return resolve(host).stream().anyMatch(address -> disallowedHosts.contains(address.getHostAddress()));
    }

    /** Whether any address the host resolves to is a loopback address or the wildcard address ({@code 0.0.0.0}, {@code ::}). */
    public static boolean isLoopbackOrWildcard(String host) {
        return resolve(host).stream().anyMatch(address -> address.isLoopbackAddress() || address.isAnyLocalAddress());
    }

    /**
     * Every address of the host, trimmed and without the brackets of an IPv6 literal; none for a blank host (which
     * {@link InetAddress#getAllByName} would answer with the loopback address) or one that does not resolve.
     */
    static List<InetAddress> resolve(String host) {
        String name = StringUtils.trimToEmpty(host);
        if (name.startsWith(IPV6_LITERAL_START) && name.endsWith(IPV6_LITERAL_END)) {
            name = name.substring(IPV6_LITERAL_START.length(), name.length() - IPV6_LITERAL_END.length());
        }
        if (name.isEmpty()) {
            return List.of();
        }
        try {
            return Arrays.asList(InetAddress.getAllByName(name));
        } catch (UnknownHostException e) {
            return List.of();
        }
    }
}
