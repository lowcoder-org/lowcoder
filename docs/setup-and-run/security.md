# Security

## Does OpenFlower store data from my data sources?

No, OpenFlower doesn't store any data returned from your APIs or database queries. Only the connection data of your created Datasources are stored and encrypted.

OpenFlower only serves as a proxy between the client side and your data sources. When you query your APIs or databases, the OpenFlower server connects to the data source with your credentials, forwards the request, and returns the result data to the browser. During the whole process, OpenFlower doesn't store any data from your requests or responses.

OpenFlower also provides a self-hosted version. You can deploy self-hosted OpenFlower images on your own device, on-premise deployment ensures you have total control over your resources and that your data is securely stored.

## Is it safe to log in to my databases on OpenFlower?

Yes, it is safe for the following reasons:

* All sensitive credentials, such as database passwords, are encrypted with [AES-256 encryption](https://en.wikipedia.org/wiki/Advanced\_Encryption\_Standard).
* Sensitive credentials will never be sent to the browser from the server. They are only used at the server side (in the API service) and are never exposed to the browser, the browser will display "Encrypted on the server side" as a placeholder for existing Datasources.

## Other security measures within OpenFlower

OpenFlower provides secure-by-default service.

* All connections on OpenFlower Cloud are encrypted with [TLS](https://en.wikipedia.org/wiki/Public\_key\_certificate).
* Sensitive credentials, such as database access credentials, are encrypted with AES-256.
* Self-hosted OpenFlower instances can be configured with unique encryption salt values.
* OpenFlower Cloud only connects to your databases or APIs through allowed IPs, ensuring that your data won't be exposed to unknown IPs while using our cloud service.

## Feedback

Should you have any questions about data security in OpenFlower, please feel free to contact us. We welcome any feedback on our service from security experts and all users.
