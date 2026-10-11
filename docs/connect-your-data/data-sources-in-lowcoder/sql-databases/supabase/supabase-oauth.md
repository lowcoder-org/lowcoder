# Supabase OAuth

Lowcoder App users can authenticate their app users using the Supabase OAuth feature. It can be accessed through "supabase.auth".

Supabase Auth works with many popular Auth methods, including Social and Phone Auth using third-party providers and the list can be found [https://supabase.com/docs/guides/auth#providers](https://supabase.com/docs/guides/auth#providers) .

In order to Sign up a User through OAuth, we can use the following code :

```
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://example.com/welcome'
  }
})
```

We have to set the "Provider" that we need to use for Sign up. But, before running this query , We need to set the details related to OAuth on Supabase and on the Provider side, in this case Google. For setting up OAuth using Google, please follow the instructions written on this link : [https://supabase.com/docs/guides/auth/social-login/auth-google](https://supabase.com/docs/guides/auth/social-login/auth-google)

After successful sign in through OAuth, we can store the OAuth Provider token using following code :&#x20;

```
// Register this immediately after calling createClient!
// Because signInWithOAuth causes a redirect, you need to fetch the
// provider tokens from the callback.

supabase.auth.onAuthStateChange((event, session) => {
  if (session && session.provider_token) {
    window.localStorage.setItem('oauth_provider_token', session.provider_token)
  }
})
```

In the following Demo, we have shown how to setup Google OAuth using Supabase SDK :&#x20;

{% embed url="https://demos.lowcoder.cloud/demo/cm348a4ma1853533h7m9qp11k" %}
Setting up Google OAuth using Supabase SDK
{% endembed %}

