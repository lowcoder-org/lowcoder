# GitHub

### GitHub as OAuth Identity Provider

To use GitHub as Auth Provider, you must setup a so-called "OAuth App". You can do so in your Github Profile > Settings [https://github.com/settings/developers](https://github.com/settings/developers)

<figure><img src="../../.gitbook/assets/Github OAuth Apps.png" alt=""><figcaption></figcaption></figure>

On GitHub the creation of an OAuth Client Registration is comparatively simple.

<figure><img src="../../.gitbook/assets/Github Client OAuth Settings.png" alt=""><figcaption><p>GitHub Client Registration Settings</p></figcaption></figure>

After configuring the Callback URLs, you can "Generate a new client secret".&#x20;

{% hint style="warning" %}
Make sure you copy the client secret directly, as it is displayed only once. Later you cannot copy it again.
{% endhint %}

Now you go back to Lowcoder Settings > Auth Providers and click "Add OAuth Provider" and select GitHub from the list of Auth Providers.

<figure><img src="../../.gitbook/assets/OAuth Add Provider.png" alt=""><figcaption></figcaption></figure>

You can copy and paste now the Client ID and Client Secret from the GitHub Client App Registration.

<figure><img src="../../.gitbook/assets/GitHub setup Auth Client.png" alt=""><figcaption></figcaption></figure>

Thats it! Now you can invite new Users to Lowcoder. They can choose GitHub to Sign Up (register) or Sign in / log in.

<figure><img src="../../.gitbook/assets/OAuth Register with Invite Link (1).png" alt=""><figcaption></figcaption></figure>

When users chose to Sign in or Sign up with GitHub, they will get redirected to the GitHub Login page of the registered Client App

<figure><img src="../../.gitbook/assets/Github OAuth Login.png" alt=""><figcaption></figcaption></figure>

Here they have to Authorize your registered Client App to act and impersonate your users.

<figure><img src="../../.gitbook/assets/Github OAuth Authorize.png" alt=""><figcaption></figcaption></figure>
