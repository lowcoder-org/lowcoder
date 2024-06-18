# KeyCloak

### KeyCloak as Identity Provider

To use KeyCloak as an Auth Provider, you must install and maintain an own installation of KeyCloak.  A docker installation is fast achieved.

[https://www.keycloak.org/getting-started/getting-started-docker](https://www.keycloak.org/getting-started/getting-started-docker)&#x20;

In KeyCloak you have to set up first a "Realm". This is a tenant within KeyCloak. Select (or create) your Realm with the top left corner menu.

In your Realm, you can then create and configure a Client. We show here the most minimal configuration to enable Sign in and Sign up with KeyCloak for Lowcoder.

### Setup a KeyCloak Client

Choose a name and id for your Client.

<figure><img src="../../.gitbook/assets/KeyCloak Client setup 1.png" alt=""><figcaption></figcaption></figure>

Make sure the "Standard Flow" is activated, as also "Client authentication" and "Authorization". Only when checked these options, KeyCloak will issue the needed Client-Secret.

<figure><img src="../../.gitbook/assets/KeyCloak Client setup 2.png" alt=""><figcaption></figcaption></figure>

Configure the Lowcoder redirect URLs.

{% hint style="info" %}
For the cloud, the "Valid redirect URI" is https://app.lowcoder.cloud
{% endhint %}

<figure><img src="../../.gitbook/assets/KeyCloak Client Setup 3.png" alt=""><figcaption></figcaption></figure>

After the setup, you can now look for the generated Client-Secret.

<figure><img src="../../.gitbook/assets/KeyCloak Credencials Screen.png" alt=""><figcaption><p>copy the Client Secret for the setup of KeyCloak as Auth Provioder in Lowcoder</p></figcaption></figure>

Check the Settings to make sure the right capabilities are activated...

<figure><img src="../../.gitbook/assets/KeyCloak Capabilities Screen.png" alt=""><figcaption></figcaption></figure>

### KeyCloak as Lowcoder Auth Provider

in Lowcoder, go to Settings > OAuth Provider and select "KeyCloak" in the "Add OAuth Provider Dialogue"

<figure><img src="../../.gitbook/assets/KeyCloak select Provider.png" alt=""><figcaption></figcaption></figure>

Now you can enter all settings for KeyCloak

{% hint style="info" %}
Instance ID is the Base URL of your KeyCloak Installation
{% endhint %}

<figure><img src="../../.gitbook/assets/KeyCloak Setup.png" alt=""><figcaption></figcaption></figure>

You can also change settings later.

<figure><img src="../../.gitbook/assets/KeyCloak Settings.png" alt=""><figcaption></figcaption></figure>



{% hint style="warning" %}
The minimal scope to setup is "offline\_access openid".
{% endhint %}

Thats it! Now you can use KeyCloak to offer your Users to Sign in and Sign up with KeyCloak.



<figure><img src="../../.gitbook/assets/KeyCloak Sign in.png" alt=""><figcaption></figcaption></figure>

<figure><img src="../../.gitbook/assets/KeyCloak use Login.png" alt=""><figcaption></figcaption></figure>
