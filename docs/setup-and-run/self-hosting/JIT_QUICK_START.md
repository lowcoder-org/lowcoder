# Quick Start: Enable JIT Provisioning with Entra ID

## What is JIT Provisioning?

**Just-In-Time (JIT) Provisioning** automatically creates user accounts when they first login via SSO. No manual user creation or SCIM needed!

## Why Use JIT?

✅ **Simple** - Minimal configuration  
✅ **Secure** - Users authenticated via Entra ID  
✅ **Correct** - Proper auth source (not EMAIL)  
✅ **Fast** - Users created on first login

## 5-Minute Setup

### 1. Azure Portal Setup (3 minutes)

1. Go to [Azure Portal](https://portal.azure.com) → **App registrations** → **New registration**
2. Name: `Lowcoder SSO`, Redirect URI: `https://your-domain.com/api/auth/oauth2/callback`
3. Create a **Client Secret** (save the value!)
4. Add permissions: **API permissions** → **Microsoft Graph** → `User.Read`, `email`, `profile`, `openid`
5. Note your **Client ID** and **Tenant ID**

### 2. Lowcoder Configuration (2 minutes)

Login as admin → **Settings** → **Authentication** → **Add Provider**:

```yaml
Provider Name: Entra ID
Auth Type: GENERIC
Client ID: <from Azure>
Client Secret: <from Azure>
Authorization Endpoint: https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/authorize
Token Endpoint: https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token
User Info Endpoint: https://graph.microsoft.com/v1.0/me
Scope: openid profile email User.Read
Enable Registration: ✅ TRUE # ← This enables JIT!
```

**User Mappings**:

```json
{
  "uid": "id",
  "username": "userPrincipalName",
  "email": "mail"
}
```

### 3. Test (30 seconds)

1. Logout from Lowcoder
2. Click **"Sign in with Entra ID"**
3. Authenticate with Microsoft
4. ✅ User automatically created and logged in!

## That's It!

No SCIM needed. No manual user creation. Users are provisioned automatically on first login with the correct authentication source.

## Need SCIM?

If you need SCIM for compliance, see the full guide: [JIT_PROVISIONING_WITH_ENTRA_ID.md](./JIT_PROVISIONING_WITH_ENTRA_ID.md)

## Troubleshooting

**Can't see "Sign in with Entra ID" button?**

- Check `Enable Registration` is ✅ TRUE
- Verify provider is enabled in settings

**Login fails?**

- Verify redirect URI matches exactly
- Check client ID and secret are correct
- Verify tenant ID in endpoints

## Support

For detailed documentation, see: [JIT_PROVISIONING_WITH_ENTRA_ID.md](./JIT_PROVISIONING_WITH_ENTRA_ID.md)
