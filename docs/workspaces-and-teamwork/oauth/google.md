# Google

### Google as OAuth Identity Provider

To use Google as Auth Provider, you must setup a so-called "OAuth 2.0 Client ID". You can do so in the Google Cloud Console. [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)

<figure><img src="../../.gitbook/assets/Google OAuth Credencials.png" alt=""><figcaption><p>You can create many OAuth 2.0 Client IDs</p></figcaption></figure>

Use the Form to create your Client ID (app registration)



<figure><img src="../../.gitbook/assets/Google create Client ID (1).png" alt=""><figcaption><p>You can set multiple redirect URLs</p></figcaption></figure>

On the right side, you will find the Client-ID and Client Secret. Now you go back to Lowcoder Settings > Auth Providers and click "Add OAuth Provider" and select Google from the list of Auth Providers.

<figure><img src="../../.gitbook/assets/OAuth Add Provider.png" alt=""><figcaption><p>select Google as Auth Provider from the List</p></figcaption></figure>

You can now copy and paste the Client ID and Client Secret from the Google Cloud Console.

<figure><img src="../../.gitbook/assets/OAuth Add Google.png" alt=""><figcaption></figcaption></figure>

Thats it! Now you can invite new Users to Lowcoder. They can choose Google to Sign Up (register) or Sign in / log in.

<figure><img src="../../.gitbook/assets/OAuth Register with Invite Link (1).png" alt=""><figcaption><p>Based on an invite Link, users can now login with the OAuth provider Google.</p></figcaption></figure>
