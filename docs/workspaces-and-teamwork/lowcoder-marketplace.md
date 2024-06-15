# Lowcoder Marketplace

The Lowcoder Application Marketplace is a platform where the Lowcoder Community comes together to share and explore applications and modules.&#x20;

It's the spot for app developers and business people to find innovative solutions in Lowcoder that can help streamline operations and enhance project outcomes. Here, users can contribute their own creations, tapping into a pool of shared knowledge and resources.&#x20;

For us It's all about harnessing the power of collaboration to bring the best out of the Lowcoder platform, making it easier for everyone to achieve their goals with speed of light.

## Global and Local App Marketplace

The place where Apps are built and shared on the Marketplace of [app.lowcoder.cloud](https://app.lowcoder.cloud), we call the "global Marketplace".&#x20;

If you operate a self-hosted installation you will be able to see and use the Apps from the global Marketplace always. However, you can share apps in a local Marketplace too, which is only available across all workspaces of your self-hosted installation.

In self-hosted installations, both Marketplaces are available and show the apps that are shared on these Marketplaces.

## Use Apps from Marketplace

{% embed url="https://app.supademo.com/demo/FAj2tiD2WnnveGkLUW4A8" %}

## Publish Apps to Marketplace

{% embed url="https://app.supademo.com/demo/me6zeg4Oe9GCKtAiMWTCu" %}

{% hint style="info" %}
If you publish your App in the Lowcoder Editor on [app.lowcoder.cloud](https://app.lowcoder.cloud), your App will be listed on the "global Marketplace" and every Lowcoder User can see and use the App.
{% endhint %}

{% hint style="warning" %}
If you publish your App in the Lowcoder Editor on your self-hosted Installation, only Users inside your self-hosted Installation can see and use these Apps.
{% endhint %}

## Adding Title, Description, Category and Icon

In the left App-Settings Menu, you can add Title, Description, Category, and an Icon to your App, so the display on the Marketplace is informative.

{% embed url="https://app.supademo.com/demo/KsbwqBCpWK6OZascdMI-E" %}

## Before you publish your App to the Marketplace

#### 1. Audit Your Application for Sensitive Data

* **Review Local Data Sources**: Examine all local data sources within your application to identify any that contain sensitive information. This includes user information, API keys, passwords, and any other data that should not be publicly accessible.
* **Check Local Data Queries**: Look through your local data queries to ensure they do not reference or pull in sensitive data inadvertently.

#### 2. Remove or Anonymize Sensitive Data

* **Anonymize Data**: If your application requires example data to demonstrate functionality, replace real data with anonymized or fictional data that does not relate to any real individuals or entities.

#### 3. Replace Local Data Queries and Sources with Neutral Equivalents

* **Implement Neutral Data Queries**: Replace queries that access sensitive data with neutral data queries. These should demonstrate the app's functionality without using or exposing real data.
* **Use Neutral Data Sources**: Switch out any local data sources containing sensitive information with neutral, example-based sources. Ensure these sources clearly illustrate how the app operates without relying on real data. Remove any Data Source from your application, which uses Passwords or other Backend Side encrypted credencials. This includes development environment configurations that might contain API keys or database credentials. You can use anonymous accessible APIs or place Demo-Data in [Temporary States](../business-logic-in-apps/write-javascript/temporary-state.md) and bind queries to these Temporary States for demonstration purposes.

#### 4. Place a documentation in the app

To help others to use your app, you can use a Text-Display component with Markdown at the bottom and write a README, so other users understand how to use the App and its components & logic.
