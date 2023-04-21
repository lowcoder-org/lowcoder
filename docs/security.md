# Security

## Does Lowcoder / Openblocks store my data?

No, Lowcoder / Openblocks doesn't store any data returned from your APIs or database queries.

Lowcoder / Openblocks only serves as a proxy between client side and your data sources. When you query your APIs or databases, Lowcoder / Openblocks server connects to the data source with your credentials, forwards the request, and returns the result data to the browser. During the whole process, Lowcoder / Openblocks doesn't store any data from your requests or responses.

Lowcoder / Openblocks also provides a self-hosted version. You can deploy self-hosted Lowcoder / Openblocks images on your own device, on-premise deployment ensures you have total control over your resources and that your data is securely stored.

## Is it safe to log in to my databases on Lowcoder / Openblocks Cloud?

Yes, it is very safe for the following reasons:

* All sensitive credentials, such as database passwords, are encrypted with [AES-256 encryption](https://en.wikipedia.org/wiki/Advanced\_Encryption\_Standard).
* All sensitive credentials will never be sent to the browser from the server. They are only used in server side and are never exposed to the browser, the browser will display "Encrypted on the server side" as a placeholder.

<figure><img src=".gitbook/assets/image (3) (1).png" alt=""><figcaption></figcaption></figure>

## Other security measures within Lowcoder / Openblocks

Lowcoder / Openblocks provides secure-by-default service.

* All connections on Lowcoder / Openblocks Cloud are encrypted with [TLS](https://en.wikipedia.org/wiki/Public\_key\_certificate).
* Sensitive credentials, such as database access credentials, are encrypted with AES-256, and each self-hosted Lowcoder / Openblocks instance can be configured with unique salt values.
* Lowcoder / Openblocks Cloud service is deployed and hosted on Tier 3 data centres which are located in Switzerland, in secure, ISO9001, ISO27001, ISAE3402 & PCIDSS certified SafeHost data centres which ensure that you are at exceptionally low risk of flooding, landslides or earthquakes..
* Lowcoder / Openblocks **** ensures data redundancy on all cloud instances, so you do not need to worry about single point of failure or data loss.
* The Internal access to Lowcoder / Openblocks Cloud is controlled through [two-factor authentication (2FA)](https://en.wikipedia.org/wiki/Help:Two-factor\_authentication) and audit logs.

## Feedback

Should you have any questions about data security in Lowcoder / Openblocks, please feel free to contact us. We welcome any feedback on our service from security experts and all users.
