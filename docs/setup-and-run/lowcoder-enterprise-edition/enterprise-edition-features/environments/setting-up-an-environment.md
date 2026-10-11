# Setting up an Environment

Lowcoder Enterprise Edition supports multiple **Environments** (or **Instances**) like **Development**, **Staging**, or **Production** to support structured deployment workflows. Each environment runs as an independent Lowcoder instance but connects to a **central PostgreSQL database** for coordination and control.

There are **two ways** to register environments in Lowcoder Enterprise. Via the UI, or better, **automatically via plugin bootstrapping**.

### Prerequisites for All Environments

Before setting up an environment (via either method), ensure the following:

1. **A Central PostgreSQL Database**
   * Required and **shared** across all environments (Dev, Staging, Prod)
   * Used to register metadata, deployment relations, and staging logic
2. **Enterprise Plugin and License**
   * You must have the `.jar` plugin file and `.lic` license file installed

### Option 1: Automatic Registration (Recommended)

The simplest and most robust way to create an environment is via **auto-registration at startup**.

#### Steps:

1. **Prepare the Central PostgreSQL**
   * Ensure it is accessible to all Lowcoder environments
   * Pre-create a database such as `lowcoder_enterprise` with the correct user and password
2. **Install Plugin & License**
   * Place the plugin `.jar` file at:\
     `/lowcoder-stacks/plugins`
   * Place the license file at:\
     `/lowcoder-stacks/licenses`
3. **Add Enterprise ENV Variables** to your `docker-compose` or environment file for each Instance

```env
LOWCODER_PLUGINS_DIR=/lowcoder-stacks/plugins
PLUGIN_ENTERPRISE_ENV_TYPE=DEV
PLUGIN_ENTERPRISE_DATABASE_URL=postgresql://localhost:5432/lowcoder_enterprise
PLUGIN_ENTERPRISE_DATABASE_USER=lowcoder
PLUGIN_ENTERPRISE_DATABASE_PASSWORD=yourSecurePassword
PLUGIN_ENTERPRISE_LICENSE_LOCATION=/lowcoder-stacks/licenses
PLUGIN_ENTERPRISE_REDIS_URL=redis://localhost:6379
PLUGIN_ENTERPRISE_MAXMIND_ACCOUNT_ID=124
PLUGIN_ENTERPRISE_MAXMIND_LICENSE=yourMaxMindAPIKey
```

4. **Restart the Target Environment**
   * When the Lowcoder instance starts, the Enterprise Plugin detects the config and **automatically registers the environment** into the central PostgreSQL instance

### Option 2: Manual Setup via UI

#### Steps:

1. **Log in to the Source (Master) Environment (typically your DEV environment)**
   * Use an Admin account
   * Navigate to the **Environments page**
2. **Click “Add Environment”**\
   Fill out the form with:
   * **Environment Name**
   * **Stage Type** (e.g., Dev, Test, Production)
   * **API Service URL** (the URL of the instance to connect)
   * **API Key** (created manually on the target Lowcoder instance)
3. **Set Environment Role**
   * Toggle ON if the new environment is to act as a **Master** (optional)
4.  **Click "Create Environment"**

    * The environment will now be registered and ready for staging and deployment operations.

    \


    <figure><img src="../../../../.gitbook/assets/frame_generic_light (26).png" alt=""><figcaption></figcaption></figure>

***

#### 📌 Notes for API Key (Manual Setup)

To generate an API key for an instance:

1. Log in to the target instance
2. Use an Admin account
3. Navigate to Your **User** **Profile → API Keys**
4. Generate and copy the API key to use in the manual setup form\


