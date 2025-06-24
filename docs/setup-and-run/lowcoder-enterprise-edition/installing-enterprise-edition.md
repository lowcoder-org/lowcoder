---
description: Installation Guide
---

# Installing Enterprise Edition

### Easy to install.

Just add the Enterprise Edition Plugin to your existing Lowcoder installation without any further changes. By adding the Plugin- and License-Files to your existing Lowcoder Environment, you can activate the additional functionality. You can try Lowcoder Enterprise Edition without risk. If you no longer want it, just remove the Plugin-File. All will work as before too. Lowcoder Enterprise Edition does not change the Configuration or Files on your regular installation.

To enable the full suite of Enterprise features for the self-hosted Lowcoder instance(s), you’ll need to prepare your infrastructure and apply the provided plugin and licenses. The process is straightforward and allows seamless upgrade of your Lowcoder environment.

***

### Prerequisites

Before installation, make sure the following are **ready and accessible**:

* **PostgreSQL Database**\
  A separate PostgreSQL database is required for storing Enterprise feature metadata.
* **Redis Server**\
  A separate (suggested) Redis Database is needed for caching and enhanced performance.
* **MaxMind Account (for GeoIP Logging)**\
  Optional. It is used to enrich audit logs and app usage with geographic data.

***

### Files You Will Receive

Once you're licensed, we will provide:

* **Enterprise Plugin JAR**&#x20;
* **License File**

***

### File Placement

Ensure the following directories exist in your deployment stack and place the files accordingly for each deployment (stage / instance)

| File Type      | Path                        |
| -------------- | --------------------------- |
| Plugin `.jar`  | `/lowcoder-stacks/plugins`  |
| License `.lic` | `/lowcoder-stacks/licenses` |

You can mount these volumes into your Docker container or place them directly if running natively.

***

### Required Environment Variables

Add the following variables to your Lowcoder `.env` file or Docker Compose environment:

```env
LOWCODER_PLUGINS_DIR=./lowcoder-stacks/plugins
PLUGIN_ENTERPRISE_ENV_TYPE=DEV # or TEST, PREPROD, PROD

# PostgreSQL (Enterprise DB)
PLUGIN_ENTERPRISE_DATABASE_URL=postgresql://yourhost:5432/lowcoder_enterprise
PLUGIN_ENTERPRISE_DATABASE_USER=lowcoder
PLUGIN_ENTERPRISE_DATABASE_PASSWORD=yourSecurePassword

# License File Path
PLUGIN_ENTERPRISE_LICENSE_LOCATION=./lowcoder-stacks/license

# Redis
PLUGIN_ENTERPRISE_REDIS_URL=redis://yourhost:6379

# MaxMind GeoIP Service
PLUGIN_ENTERPRISE_MAXMIND_ACCOUNT_ID=124
PLUGIN_ENTERPRISE_MAXMIND_LICENSE=abc
```

{% hint style="warning" %}
Replace the placeholder values with your actual credentials and database settings.
{% endhint %}

***

### MaxMind GeoIP

[**MaxMind**](https://www.maxmind.com/) provides GeoIP data services that convert IP addresses into **geographic locations** (e.g., country, city, latitude/longitude). In Lowcoder Enterprise, this data powers enriched **Audit Logs** and **App Usage Logs**, allowing you to track **where** users interact with your apps from.

**How to Get a License:**

1. Visit: [https://www.maxmind.com](https://www.maxmind.com)
2. Create a free or paid account
3. Navigate to **My License Keys** under your account settings
4. Copy the **Account ID** and **License Key**
5. Insert both into the respective environment variables

***

### Final Steps

After placing the files and configuring your environment:

1. **Restart your Lowcoder services** (Docker or systemd, depending on setup)
2. Navigate to your instance
3. You should now see the Enterprise features (e.g., Environments, Branding, Audit Logs) available in the UI
