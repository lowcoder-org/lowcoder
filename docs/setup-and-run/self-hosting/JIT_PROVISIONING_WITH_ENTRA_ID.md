# JIT (Just-In-Time) Provisioning with Entra ID (Azure AD)

This guide explains how to set up JIT user provisioning with Microsoft Entra ID (formerly Azure AD) for Lowcoder.

## Overview

**JIT Provisioning** automatically creates user accounts in Lowcoder when users authenticate via SSO for the first time. This eliminates the need for manual user creation or SCIM provisioning for basic SSO scenarios.

## How It Works

1. User clicks **"Sign in with Entra ID"** on Lowcoder login page
2. User authenticates with Microsoft Entra ID
3. Entra ID redirects back to Lowcoder with authentication details
4. Lowcoder automatically:
   - Creates a new user account (if doesn't exist)
   - Sets up the correct auth connection (Entra ID, not EMAIL)
   - Adds user to the organization
   - Logs user in

## Prerequisites

- Lowcoder instance running (self-hosted or cloud)
- Admin access to Lowcoder
- Microsoft Entra ID (Azure AD) tenant
- Admin access to Azure Portal

## Step 1: Configure Application in Azure Portal

### 1.1 Register a New Application

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Configure:
   - **Name**: `Lowcoder SSO`
   - **Supported account types**: Choose based on your needs
     - Single tenant (most common for enterprise)
     - Multi-tenant (if needed)
   - **Redirect URI**:
     - Platform: `Web`
     - URI: `https://your-lowcoder-domain.com/api/auth/oauth2/callback`
5. Click **Register**

### 1.2 Configure API Permissions

1. In your app registration, go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Choose **Delegated permissions**
5. Add these permissions:
   - `openid`
   - `profile`
   - `email`
   - `User.Read`
6. Click **Add permissions**
7. Click **Grant admin consent** (if you have admin rights)

### 1.3 Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Description: `Lowcoder SSO Secret`
4. Expires: Choose appropriate duration (12-24 months recommended)
5. Click **Add**
6. **IMPORTANT**: Copy the secret **Value** immediately (you won't see it again!)

### 1.4 Note Your Configuration Details

From **Overview** page, note:

- **Application (client) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Directory (tenant) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

## Step 2: Configure Entra ID Provider in Lowcoder

### 2.1 Access Admin Settings

1. Log in to Lowcoder as **admin**
2. Go to **Settings** → **Authentication** (or Admin panel)
3. Click **Add Authentication Provider**

### 2.2 Configure Generic OAuth Provider

Fill in the following details:

| Field                      | Value                                                                 |
| -------------------------- | --------------------------------------------------------------------- |
| **Provider Name**          | `Entra ID` or `Azure AD`                                              |
| **Auth Type**              | `GENERIC` (Generic OAuth2)                                            |
| **Client ID**              | `<Application (client) ID from Azure>`                                |
| **Client Secret**          | `<Client secret value from Azure>`                                    |
| **Authorization Endpoint** | `https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/authorize` |
| **Token Endpoint**         | `https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token`     |
| **User Info Endpoint**     | `https://graph.microsoft.com/v1.0/me`                                 |
| **Scope**                  | `openid profile email User.Read`                                      |
| **Enable Registration**    | ✅ **TRUE** (This enables JIT provisioning!)                          |

Replace `{tenant-id}` with your actual tenant ID.

### 2.3 Configure User Attribute Mappings

Set up how Entra ID user attributes map to Lowcoder user fields:

```json
{
  "uid": "id",
  "username": "userPrincipalName",
  "email": "mail",
  "avatar": "photo"
}
```

Or if email field is sometimes null:

```json
{
  "uid": "id",
  "username": "userPrincipalName",
  "email": "userPrincipalName",
  "avatar": "photo"
}
```

### 2.4 Save Configuration

Click **Save** or **Enable** to activate the provider.

## Step 3: Test JIT Provisioning

### 3.1 Test User Login

1. **Log out** from Lowcoder (if logged in)
2. Go to Lowcoder login page
3. You should see **"Sign in with Entra ID"** button
4. Click the button
5. You'll be redirected to Microsoft login
6. Enter credentials and authenticate
7. You'll be redirected back to Lowcoder
8. **User account is automatically created** ✅

### 3.2 Verify User Creation

As admin:

1. Go to **Settings** → **Members** or **Users**
2. You should see the newly created user
3. Check user details:
   - Auth Source should be **"Entra ID"** (not EMAIL)
   - Email should match the Entra ID account
   - User should be active

## SCIM + JIT Combined Approach (Optional)

If you need both SCIM provisioning AND SSO authentication:

### Use Case

- SCIM pre-provisions users (for compliance/audit)
- Users still authenticate via SSO
- JIT adds auth connection on first login

### How It Works with Updated Code

The updated `createSCIMUserAndAddToOrg` endpoint now:

1. **Creates a placeholder user** via SCIM (no auth connection)
2. **On first SSO login**, JIT provisioning adds the Entra ID auth connection
3. **Subsequent logins** work normally via SSO

### Configure Entra ID SCIM Provisioning

1. In Azure Portal, go to your **Enterprise Application**
2. Navigate to **Provisioning**
3. Set **Provisioning Mode**: `Automatic`
4. Configure:
   - **Tenant URL**: `https://your-lowcoder-domain.com/api/v1/organizations/{orgId}/scim/users`
   - **Secret Token**: Your API token
5. **Mappings**: Map Azure AD attributes to SCIM attributes
6. **Save** and **Start Provisioning**

## Troubleshooting

### Issue: "Sign in with Entra ID" button doesn't appear

**Solution**:

- Verify the auth provider is **enabled** in settings
- Check that `enableRegister` is set to `true`
- Clear browser cache and reload

### Issue: User login fails with "LOG_IN_SOURCE_NOT_SUPPORTED"

**Solution**:

- Verify Authorization, Token, and User Info endpoints are correct
- Check that tenant ID is properly replaced in URLs
- Verify client ID and secret are correct

### Issue: User created but with wrong auth source (EMAIL instead of Entra ID)

**Solution**:

- This means SCIM endpoint was used with old code
- With updated code, SCIM creates placeholder users
- JIT adds correct auth connection on first SSO login
- Rebuild Docker image with the fix

### Issue: "EMAIL_PROVIDER_DISABLED" error

**Solution**:

- This error occurs if trying to create EMAIL-based users when EMAIL auth is disabled
- Use SSO with JIT provisioning instead
- Don't use the old SCIM implementation that creates EMAIL users

## Security Considerations

1. **Client Secret**: Store securely, rotate regularly
2. **Redirect URI**: Must exactly match what's configured in Azure
3. **Scope**: Request minimum permissions needed
4. **Enable Registration**: Only enable if you want JIT provisioning
5. **Organization**: Configure which organization new users join

## Advanced Configuration

### Multi-Organization Support

If you have multiple organizations:

- Configure separate OAuth providers per organization
- Or use organization domains to auto-assign users

### Custom User Roles

To assign custom roles on JIT provisioning:

- Modify `AuthenticationApiServiceImpl.onUserLogin()`
- Add logic to check Entra ID groups/roles
- Map to Lowcoder roles accordingly

### Email Verification

JIT-provisioned users are automatically verified since they authenticated via SSO.

## Comparison: SCIM vs JIT

| Feature              | SCIM Provisioning            | JIT Provisioning       |
| -------------------- | ---------------------------- | ---------------------- |
| **User Creation**    | Pre-provisioned via SCIM     | Created on first login |
| **Setup Complexity** | High                         | Low                    |
| **Auth Source**      | EMAIL (with old code)        | Correct SSO source     |
| **Works with SSO**   | Requires fix                 | ✅ Native support      |
| **Audit Trail**      | Full provisioning audit      | Login-based audit      |
| **Use Case**         | Compliance, pre-provisioning | Simple SSO             |

## Recommendation

For most use cases: **Use JIT Provisioning** (simpler, works correctly with SSO)

For compliance requirements: **Use SCIM + JIT Combined** (with updated code)

## References

- [Microsoft Entra ID OAuth2 Documentation](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [Lowcoder Authentication Documentation](../../../workspaces-and-teamwork/oauth/)
- [Generic OAuth Provider Setup](../../../workspaces-and-teamwork/oauth/generic-oauth-provider.md)
