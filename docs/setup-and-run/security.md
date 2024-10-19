# Security

## Does Lowcoder store data from my data sources?

No, Lowcoder doesn't store any data returned from your APIs or database queries. Only the connection data of your created Datasources are stored and encrypted.

Lowcoder only serves as a proxy between the client side and your data sources. When you query your APIs or databases, the Lowcoder server connects to the data source with your credentials, forwards the request, and returns the result data to the browser. During the whole process, Lowcoder doesn't store any data from your requests or responses.

Lowcoder also provides a self-hosted version. You can deploy self-hosted Lowcoder images on your own device, on-premise deployment ensures you have total control over your resources and that your data is securely stored.

## Is it safe to log in to my databases on Lowcoder?

Yes, it is safe for the following reasons:

* All sensitive credentials, such as database passwords, are encrypted with [AES-256 encryption](https://en.wikipedia.org/wiki/Advanced\_Encryption\_Standard).
* Sensitive credentials will never be sent to the browser from the server. They are only used at the server side (in the API service) and are never exposed to the browser, the browser will display "Encrypted on the server side" as a placeholder for existing Datasources.

## Other security measures within Lowcoder

Lowcoder provides secure-by-default service.

* All connections on Lowcoder Cloud are encrypted with [TLS](https://en.wikipedia.org/wiki/Public\_key\_certificate).
* Sensitive credentials, such as database access credentials, are encrypted with AES-256.
* Self-hosted Lowcoder instances can be configured with unique encryption salt values.
* Lowcoder Cloud only connects to your databases or APIs through allowed IPs, ensuring that your data won't be exposed to unknown IPs while using our cloud service.

```
(US) 
185.122.165.50
185.122.165.51
185.122.165.52
185.122.165.56

(GB)
185.85.242.35
185.85.242.36
185.85.242.37

(DE)
185.44.64.41
185.44.64.42
185.44.64.43
185.44.64.44
185.44.64.47
```

* Lowcoder Cloud service is deployed and hosted on German, UK, and US Data-Centers, which are certified with SOC 1 Type II,PCI-DSS,SOC 2 Type II,ISO 27001,HIPAA and NIST 800-53/FISMA.
* Lowcoder Cloud ensures data redundancy on all cloud instances, so you do not need to worry about a single point of failure or data loss.
* Internal access to Lowcoder Cloud is controlled through [two-factor authentication (2FA)](https://en.wikipedia.org/wiki/Help:Two-factor\_authentication) and audit logs.

## Feedback

Should you have any questions about data security in Lowcoder, please feel free to contact us. We welcome any feedback on our service from security experts and all users.
