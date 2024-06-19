# Access local database or API

By default, docker-hosted instances use a [bridge network](https://docs.docker.com/network/bridge/), which does not support access to services on the docker-host via `127.0.0.1` or `localhost` from inside of the docker.&#x20;

Here we take PostgreSQL as an example and show you how to access local API or database in different operating systems (OS) for docker-hosted Lowcoder.

## Preparation

Assume that a Postgres service is ready on your local host with port `5432`.&#x20;

On Linux, you can check if Postgres runs locally with the command\
`pgrep -u postgres -fa -- -D`

## How to access a local database or API from Lowcoder which runs inside the Docker

{% tabs %}
{% tab title="Linux" %}
1.  Enter `ifconfig docker0` in the terminal, and verify the IP configuration of Docker's virtual bridge (VB).

    Having set up Docker, the OS would automatically create `docker0` using the IP address `172.17.0.1` (by default), through which the Docker service communicates with the host.
2. Enter the same IP address into Lowcoder to configure the Postgres data source (`172.17.0.1` in this example, but use the actual IP address displayed on your terminal in the real case).

{% hint style="warning" %}
On some OS (such as Ubuntu), port access might be blocked by the firewall. To solve that, configure in the following steps:

1. Stop the firewall from blocking access from <mark style="background-color:yellow;">`docker0`</mark> by typing in the terminal:\ <mark style="background-color:yellow;">`iptables -A INPUT -p tcp -i docker0 --dport YOUR_DB_PORT -j ACCEPT`</mark>\
   `Note: In this case`Here we use Postgres port <mark style="background-color:yellow;">`5432`</mark> for <mark style="background-color:yellow;">`YOUR_DB_PORT`</mark>, and you should replace it with your own.
2. Save the firewall configuration by typing in the terminal:\
   <mark style="background-color:yellow;">`iptables-save > /etc/iptables.up.rules`</mark>
{% endhint %}
{% endtab %}

{% tab title="Windows & Mac" %}
On Windows and macOS, Docker does not create the virtual bridge `docker0`. Then the following host name is helpful to resolve the host IP:

```
host.docker.internal
```


{% endtab %}
{% endtabs %}

On Windows and Mac:

<figure><img src="../../.gitbook/assets/Local Database via Docker Network.png" alt=""><figcaption><p>Access a Database on your local network from Lowcoder which runs in Docker</p></figcaption></figure>

<figure><img src="../../.gitbook/assets/Local API via Docker Network.png" alt=""><figcaption><p>Access an API on your local network from Lowcoder which runs in Docker</p></figcaption></figure>
