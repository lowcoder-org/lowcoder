# Configure IP allowlists

If your database or API restricts incoming connections by source IP, add the Lowcoder Cloud outbound IP to its firewall or IP allowlist before connecting.

## Lowcoder Cloud outbound IP

For server-side data source connections from [app.lowcoder.cloud](https://app.lowcoder.cloud), allow this static IPv4 address:

```text
34.181.220.47
```

If your firewall requires CIDR notation, use:

```text
34.181.220.47/32
```

This single address is used by both the API service and the Node service for outbound data source connections. The services run in US East (Ashburn).

{% hint style="warning" %}
Updated on 11 October 2026: this address replaces the IP lists previously published on this page. Add the new address and test your connections. Remove old Lowcoder Cloud allowlist entries once you have confirmed they are no longer needed for other services.
{% endhint %}

## Configure and test your firewall

1. Allow incoming connections from `34.181.220.47/32` on the port used by your database or API.
2. Keep your data source authentication and TLS settings enabled. An IP allowlist does not replace them.
3. In Lowcoder, open **Data Sources**, select your connection, and click **Test connection**.

Use the outbound IP above for source-IP rules. The IP addresses returned by DNS for the Lowcoder website or API domains are not the outbound address. Requests made directly from a user's browser use that user's network address instead.

## Self-hosted and private deployments

For self-hosted Lowcoder or a dedicated private deployment, allow the outbound IP address of that deployment's API and Node services, or its NAT gateway. The shared Lowcoder Cloud address above does not apply to those deployments.
