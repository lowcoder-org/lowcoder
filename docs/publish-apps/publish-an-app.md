# Publish an App

Publishing an app in Lowcoder transitions it from a Editing State to a live (published) state. This allows users to access and interact with the app based on the sharing and publishing settings defined by the App Creator.

## Publishing States

1. **Editing State**:
   * Apps in this state can only be accessed via the `/preview` endpoint by allowed users and user-groups.
   * Changes made to the app are reflected in real-time during editing but are not visible to end-users until published.
2. **Published State**:
   * The most recent version of the app at the time of publishing becomes the official published version.
   * The published version remains unchanged until a new publish action is performed, even if further edits are made to the app in the meantime.
   * Published apps are accessible via the `/view` endpoint.

<figure><img src="../.gitbook/assets/App Editor  Publish App.png" alt=""><figcaption></figcaption></figure>

## Publishing Scope

An app can be published with different scopes, determining who can access the app:

1. **Selected User Groups or Users**:
   * The app can be published ([shared](share-an-app.md)) to specific user groups or individual users within a workspace.
   * Only those with explicit access will be able to view the app. This option allows the app to be viewed by allowed users via the `/view` endpoint.
2. **Public to All**:
   * The app can be published as "public to all", making it accessible to anyone, including non-logged-in users and users from different workspaces.
   * This option allows the app to be viewed by anyone via the `/view` endpoint.

<figure><img src="../.gitbook/assets/App Editor  Share Public.png" alt="" width="563"><figcaption></figcaption></figure>

## Access Control

* If an app is not shared _publicly_ and a user without the appropriate permissions try to access it, an error message will be displayed.
* For anonymous users (not logged in), attempting to access a non-public app will redirect them to the `/user/auth` endpoint for sign-in or sign-up.

## Marketplace Publishing

Apps can also be published to Lowcoder marketplaces:

<figure><img src="../.gitbook/assets/App Editor  Share Marketplace.png" alt="" width="563"><figcaption></figcaption></figure>

1. **Public to Marketplace**:
   * After _sharing_ the app as "public to all", it can be further published to the marketplace.
   * This makes the app available in the marketplace listings, either globally at app.lowcoder.cloud or within individual Lowcoder installations.

## Workflow for Publishing an App

1. **Development and Preview**:
   * Develop the app in the editing state.
   * Use the `/preview` endpoint to test and view changes during development.
2. **Publish the App**:
   * Select the appropriate user groups, users, or choose to make the app "public to all". in the "Share" dialogue.
   * When ready, publish the app to create the official live version.
   * The published app is now accessible via the `/view` endpoint.
3. **Marketplace Publication** (Optional):
   * If desired, mark the app as "public to All" in the sharing dialogue. Now you can see the second option switch "Public to marketplace"
   * Then, publish the app to the marketplace as you publish other apps too.
   * The app will be listed in the _global_ or local Lowcoder marketplace.&#x20;

{% hint style="info" %}
Global Marketplace means, if you published the app for the Marketplace on app.lowcoder.cloud
{% endhint %}

## Adding Title, Description, Category and Icon

In the left App-Settings Menu, you can add Title, Description, Category, and an Icon to your App, so the display is informative.

{% embed url="https://app.supademo.com/demo/KsbwqBCpWK6OZascdMI-E" %}
Adding Application Meta Information help to make the app display informative.
{% endembed %}
