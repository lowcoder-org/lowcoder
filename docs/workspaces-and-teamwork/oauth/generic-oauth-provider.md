# Generic OAuth Provider

Since Lowcoder v2.4.0, a generic OAuth Provider has been introduced. The goal is to cover as many OAuth providers as possible without special implementation but give you, as an Admin, the freedom to connect to any OAuth Provider using a flexible configuration.

{% hint style="info" %}
As communicated and voted by the community, we introduced the functionality in v2.4.0 but are still optimizing it, based on your feedback. Latest by Lowcoder v2.5.x this function is stable. (We expect anyhow already before that version a stable function of it.)
{% endhint %}

OAuth Providers are configured individually per Workspace.

The configuration has three parts:

* Meta-Data
* OAuth Provider Configuration
* Information Mapping

### Setup a generic OAuth provider

As the Admin of your Workspace, go to Settings > User Authentication. Here, you will find a List of your configured User Authentication Providers.

<figure><img src="../../.gitbook/assets/Settings  Auth Providers.png" alt=""><figcaption><p>Overview of configured Aouth Providers for your Workspace</p></figcaption></figure>

Now, you can use the button in the upper right corner to add a new OAuth Provider. Select "Generic".

<figure><img src="../../.gitbook/assets/Settings  OAuth  Select Generic OAuth Provider.png" alt="" width="563"><figcaption></figcaption></figure>

### .well\_known URI

The `.well-known/openid-configuration` URI is specifically part of the OpenID Connect (OIDC) standard. If a provider supports OpenID Connect, this endpoint provides a JSON document with the configuration details for OAuth and OIDC operations. Lowcoder will try to use this configuration data and will fill out the standard OAuth Provider Configuration fields as well as possible in the next screens of the Generic OAuth Provider Configurator.

<figure><img src="../../.gitbook/assets/Settings  OAuth  Well Known URI.png" alt="" width="563"><figcaption><p>Enter your Well Known URI to auto-fill the configuration in Step 2</p></figcaption></figure>

### Popular Services

Here are some popular services and their OpenID configuration Endpoints

#### Google

```
https://accounts.google.com/.well-known/openid-configuration
```

#### Facebook

```
https://www.facebook.com/.well-known/openid-configuration
```

#### Microsoft

```
https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration
```

#### LinkedIn

```
https://www.linkedin.com/oauth/.well-known/openid-configuration
```

#### Apple

```
https://appleid.apple.com/.well-known/openid-configuration
```

#### Amazon Cognito

```
https://cognito-idp.{region}.amazonaws.com/{userPoolId}/.well-known/openid-configuration
```

#### Salesforce

```
https://login.salesforce.com/.well-known/openid-configuration
```

#### Dropbox

```
https://www.dropbox.com/.well-known/openid-configuration
```

#### PayPal

```
https://www.paypal.com/.well-known/openid-configuration
```

#### Slack

```
https://slack.com/.well-known/openid-configuration
```

### Popular IDMs that you can self-host

#### Keycloak

```
https://{yourKeycloakDomain}/auth/realms/{yourRealm}/.well-known/openid-configuration
```

#### Okta

```
// Self-Host
https://{yourOktaDomain}/.well-known/openid-configuration
// Cloud (domain depends on the region)
https://{yourApp}.okta-emea.com/.well-known/openid-configuration
```

#### Auth0

```
// Self-Host
https://{yourAuth0Domain}/.well-known/openid-configuration
// Cloud
https://{yourApp}.auth0.com/.well-known/openid-configuration
```

#### Ory

```
// Self-Host
https://{yourOryHydraDomain}/.well-known/openid-configuration
// Cloud
https://{yourApp}.projects.oryapis.com/.well-known/openid-configuration
```

#### Authentik

```
https://{yourAuthentikDomain}/application/o/.well-known/openid-configuration
```

#### IBM Security Access Manager (ISAM)

```
https://{yourISAMDomain}/mga/sps/oauth/oauth20/.well-known/openid-configuration
```

### OAuth Source Meta-Data

Meta Data describes the Auth Source, allowing you to influence the visual representation of the OAuth Provider in the Sign In / Sign Up screen.

<figure><img src="../../.gitbook/assets/Settings  OAuth  Meta Data.png" alt="" width="563"><figcaption><p>Enter a Displayed Name, Category, Icon and a Description</p></figcaption></figure>

{% hint style="danger" %}
In Lowcoder v2.4.0 you must set the field "Source" to GENERIC
{% endhint %}

From Lowcoder v2.4.1, the field "Source" will be hidden and filled out automatically.

### OAuth Configuration

In Step 2, you can now set up the configuration Data for your OAuth Provider. We introduced this in v2.4.0, and the screen will surely be extended with features in the upcoming versions.

<figure><img src="../../.gitbook/assets/Settings  OAuth  Provider Configuration.png" alt="" width="563"><figcaption></figcaption></figure>

{% hint style="danger" %}
Scopes must be set with a space character between the scopes, not comma-separated.
{% endhint %}

{% hint style="info" %}
Some providers do only support OAuth - but not (yet?) OpenID. This means that the User Introspection Endpoints /userinfo are not available. For this case you can activate or deactivate this Introspection. (This function comes into effect at Lowcoder v2.4.1)
{% endhint %}

### Provider-Side Configuration

At your IDM you would need to prepare an OAuth Client resp. a OAuth Client Application. There are multiple settings.

* Redirect URL. Here you enter your domain of your installation like **http://localhost:3000** or **https://app.lowcoder.cloud**
* Scopes: You should set the following Scopes if possible. **offline\_access** and **profile** are important.
  * openid
  * offline\_access
  * email
  * profile
* Supported OAuth2 flows: To handle User-Logins you need to activate the **Authorization Code Flow.** Also you may need to activate the **Refresh Token** possibility.
* Client authentication mechanism: Here, you can set **HTTP Body**

### OAuth Data Mapping

We introduce the possibility of mapping Data from OAuth providers to Lowcoder. We just started it in v2.4.0, and in this version, we enabled 4 attributes.

* UID (The User-ID in the IDM System)
* Email (The Email Address of the User in the IDM System)
* Username (The Name of the User)
* Avatar (The profile picture of the User)

<figure><img src="../../.gitbook/assets/Settings  OAuth  Data Mapping.png" alt="" width="563"><figcaption><p>OData Mapping</p></figcaption></figure>

<figure><img src="../../.gitbook/assets/Settings  OAuth  Data Mapping Result.png" alt=""><figcaption></figcaption></figure>

The second screen shows how the Avatar and Username come into effect after the Mapping.

{% hint style="warning" %}
In v2.4.0 we support mapping out of the JWT (access\_token) from the IDM. In future versions, we will also support the mapping of Attributes from the OpenID /userInfo endpoint.
{% endhint %}

{% hint style="info" %}
In future versions of Lowcoder, we will also support Attribute Matching of Token Claims to User Groups and Roles.
{% endhint %}
