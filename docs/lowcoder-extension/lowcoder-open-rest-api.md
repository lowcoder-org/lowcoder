# Lowcoder Open REST API

Lowcoder comes with a feature-rich REST API, so you can use it in Lowcoder Apps or extend Lowcoder with new functionality.

On [api-service.lowcoder.cloud](https://api-service.lowcoder.cloud/api/docs/webjars/swagger-ui/index.html#/) you can access this API as well, just some endpoints are not available.

## Authentication

### Session Cookie

In application properties of the API-Service - or as ENV Variable in Docker setups, you can set a name for the Cookie. In our Examples`LOWCODER_CE_SELFHOST_TOKEN`

With this value, you can then authenticate API Calls.

If no user is logged In, API Calls will get executed in the name of "Anonymous User" and for most of the API Calls, this user has no desired rights.

If you are logged in, the Cookie of the currently logged-in user will be used to make API Calls in the name of the current user. This means, that Access Rights to different Functions are automatically applied by the Role of the User. (Admin, Member, Visitor)

If you want to use the API from outside of Lowcoder, you need to authenticate first and use the Cookie as the `LOWCODER_CE_SELFHOST_TOKEN` API key in every API Call.

```bash
// Login a User on Lowcoder by eMail

curl --location '//api/auth/form/login' \
--header 'Content-Type: application/json' \
--header 'Accept: */*' \
--data '{
  "loginId": "<your_user>",
  "password": "<your_password>",
  "register": "false",
  "source": "EMAIL",
  "authId": "EMAIL"
}'
```

When successfully logged in, you will get the following Response:

```json
// Login Method Response

{
    "code": 1,
    "message": "",
    "data": true,
    "success": true
}
```

In particular, you will get back the Cookie to authorize the next API Calls.

```
// Cookie in Response
LOWCODER_CE_SELFHOST_TOKEN=<generatedCookieValue>; Path=/; Max-Age=2592000; Expires=Tue, 25 Jul 2023 13:51:31 GMT; HttpOnly; SameSite=Lax
```

For all the next API Calls you need to set the Cookie

```
// API Requests authorized
curl --location 'http://localhost:3000//api/users/currentUser' \
--header 'Accept: */*' \
--header 'Cookie: LOWCODER_CE_SELFHOST_TOKEN=<generatedCookieValue>'
```

### API Key

Since Lowcoder v2.1.3 you can create and use alternatively also a JWT-based API Key.

As a logged-in user, you can use the API based on the Cookie to generate an API Key.

```bash
// use the Lowcoder API to generate the JWT based API Key
curl --location '<your lowcoder location>/api/auth/api-key' \
--header 'cookie: LOWCODER_CE_SELFHOST_TOKEN=<generatedCookieValue>;' \
--header 'Content-Type: application/json' \
--data '{
    "name":"<your api key name>",
    "description": "A wonderful API Key"
}'
```

In return, you will get a JSON response containing the API key

```json
{
    "code": 1,
    "message": "",
    "data": {
        "id": "<the generated API Key Id",
        "token": "ey...<the JSON Web Token>"
    },
    "success": true
}
```

For all further API Calls, you can then use the API Key, which impersonates the logged-in user, that created the API Key.

{% hint style="warning" %}
As the API Key impersonates the user, who created the API Key (based on the Cookie), all rights of that impersonated User are also active via API Key.&#x20;
{% endhint %}

## OpenAPI Specification & Postman Collection

You can find more information of the specification & documentation here:\
[https://docs.lowcoder.cloud/lowcoder-api-specification/api-reference-lowcoder](https://docs.lowcoder.cloud/lowcoder-api-specification/api-reference-lowcoder)\


The Base URL of the Lowcoder API depends on your installation.

### Single Docker Deployment

The Base URL of the API is the same as for the Frontend. In local installations for example:

```
http://localhost:3000/
https://<yourdomain>:3000/
https://<yourdomain>/
```

### Multi-Docker Deployment

In a Multi-Docker Deployment, you will have an individual IP address or Domain for the API-Service Container. This is then the Base URL for the Lowcoder API.

```
https://<your-api-service-domain>:8080/
https://<your-api-service-domain>/
```

When you run Multi-Docker Deployment on Localhost, you will need to look for the [Bridge-Network Settings](https://www.baeldung.com/ops/docker-communicating-with-containers-on-same-machine) that apply to your setup.

### app.lowcoder.cloud

To use the API of the Cloud Version, the API is to reach via the separate API Service.

```
https://api-service.lowcoder.cloud/
```

Since Lowcoder v2.1.6 we publish the OpenAPI Specification and the Swagger Documentation automatically.

```
Swagger Documentation: <Lowcoder-Location>/api/docs/webjars/swagger-ui/index.html#
OpenAPI Specification: <Lowcoder-Location>/api/docs/api-docs
```

You can find the current API Documentation for example here: \
[https://api-service.lowcoder.cloud/api/docs/webjars/swagger-ui/index.html#/](https://api-service.lowcoder.cloud/api/docs/webjars/swagger-ui/index.html#/)

## Using Lowcoder API - inside Lowcoder Apps

Since Lowcoder v2.0.0, it is possible to use the Lowcoder REST API inside of Apps in Lowcoder itself. To do so, create an OpenAPI specification-based Data Source.

<figure><img src="../.gitbook/assets/Lowcoder API  Create Datasource.png" alt=""><figcaption><p>Connect the Lowcoder API as OpenAPI Datasource</p></figcaption></figure>

Use your defined `LOWCODER_CE_SELFHOST_TOKEN` as API Key Auth. It will be automatically replaced by the adapted Cookie if a User is logged in.

Also, you can use the API Key to interact with the Lowcoder API as an impersonated user.

The OpenAPI specification Document is automatically generated. The Server URL is your API-Service URL. [Please read more about it here](https://docs.lowcoder.cloud/lowcoder-api-specification/api-reference)

```
http://localhost:3000/api/docs/api-docs
https://<yourdomain>/api/docs/api-docs
```

As soon as connected and the OpenAPI specification is found and processed, the API Controllers are accessible in the Datasource.

<figure><img src="../.gitbook/assets/Lowcoder API  Chose Controller.png" alt=""><figcaption><p>Select a Controller to see it's Operations</p></figcaption></figure>

For each Controller, you can see then the possible Operations.

<figure><img src="../.gitbook/assets/Lowcoder API  Choose Operation.png" alt=""><figcaption><p>Find the list of possible Operations for the selected Controller</p></figcaption></figure>

Now you can execute the API Call based on its settings.

<figure><img src="../.gitbook/assets/Lowcoder API  Get User Profile.png" alt=""><figcaption></figcaption></figure>
