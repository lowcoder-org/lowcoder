# OAuth

Since Lowcoder 2.1.3 we support OAuth for 4 standard sources. The list will increase and be completed by a generic OAUTH configuration ability.

As for now we support:

* Google
* Github
* ORY
* KeyCloak

Next on the list are:

* Atlassian
* Gitlab
* Microsoft Graph (AD / B2C) as OAuth
* LinkedIn
* Facebook

### Use OAuth providers in 2 ways.

* By Invite Link
* By workspace welcome Page

### Invite Link

When an Admin or User with appropriate rights sends an Invite Link, then this Invite Link contains the information in which workspace the new users get invited. In this way, the List of OAuth Providers at the Sign in and Sign up Screens is adapted.

<figure><img src="../../.gitbook/assets/OAuth Invite People.png" alt=""><figcaption></figcaption></figure>

### Workspace welcome page

Based on a URL pattern you can guide new Users to your Workspace welcome page, where they will find the List of OAuth Providers at the Sign in and Sign up Screens too.

```
// URL pattern to show the Workspace welcome page
// The Workspace-ID == the Org ID.

https://<your Lowcoder location>/org/<your org Id>/auth/login?redirectUrl=...
```

### Manage Login Methods (Auth Providers)

In the Admin area of Lowcoder select Settings > Auth Providers. Here you see the list of currently active auth providers. At the beginning, you will always see the standard-provider "Email"

{% hint style="warning" %}
In Lowcoder, Auth Providers except Email are bound to the Workspace. That means, that per workspace you can have individual settings and Auth Provider.
{% endhint %}

<figure><img src="../../.gitbook/assets/OAuth Providers.png" alt=""><figcaption><p>the list of Auth Providers per Workspace can be different -exept the Standard Provider Email</p></figcaption></figure>



{% hint style="info" %}
As OAuth Providers are bound to a single Workspace, they will not appear on the general Sign In or Sign up screens, but only on the Workspace-related screens.
{% endhint %}

