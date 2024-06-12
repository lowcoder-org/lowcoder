# Workspaces

Lowcoder supports Workspaces. These are isolated rooms to organize:

* User-Groups
* Users
* [Data Sources](../connect-your-data/data-source-basics/)
* [Predefined Data Queries](query-library.md)
* [Apps](../build-applications/create-a-new-app/) & App Folders
* [Themes](../build-applications/themes-and-styling/)
* Global includes (Javascript / CSS)

{% hint style="info" %}
To activate this function, please add the [ENV Variable](https://github.com/lowcoder-org/lowcoder/tree/main/deploy/docker#configuration): **COMMON\_WORKSPACE\_MODE**=SAAS
{% endhint %}

{% hint style="info" %}
From Version 2.3.3, you can add the [ENV Variable](https://github.com/lowcoder-org/lowcoder/tree/main/deploy/docker#configuration) **LOWCODER\_CREATE\_WORKSPACE\_ON\_SIGNUP** to control the behavior of your users (Member role) on self-hosted installation.\
\
true - members can use their own workspace when they sign up. \
false - members will not have their own workspace when they sign up.
{% endhint %}

{% hint style="warning" %}
If you want to close the possibility that anyone can Sign in and create an account, you can set the ENV Variable **LOWCODER\_EMAIL\_SIGNUP\_ENABLED** to "false". \
\
The Sign In / Sign Up Screen will still be shown, but the Sign Up will return an Error message and new users cannot create Accounts.\
\
This can be helpful if you have your own Identity / OAuth Provider listed and want to be sure that users only with these Identity / OAuth Providers can create Accounts on your Lowcoder installation.
{% endhint %}

The Workspace is a tool to use for organizing groups or user access to Apps. It is also used to apply a theme to a set of Apps.

<figure><img src="../.gitbook/assets/Admin  Workspaces.png" alt=""><figcaption><p>A list of Workspaces</p></figcaption></figure>

In the public Lowcoder Cloud, the amount of Workspaces is limited to 10.

In the upper right corner, at the profile, you can find the possibility to switch between your Workspaces.

<figure><img src="../.gitbook/assets/Admin  Switch Workspace.png" alt="" width="563"><figcaption><p>Switch between Workspaces</p></figcaption></figure>

### Apps & App Folders

[In Lowcoder, you can create Apps. Each App represents what you can create on a single Screen. Often, a complete application consists of multiple Apps. You can then organize these relationships in App Folders or separate them by Workspaces.](#user-content-fn-1)[^1]

<figure><img src="../.gitbook/assets/Admin  Folders for Apps.png" alt=""><figcaption><p>Organize Apps into Folders to create order and show relationships</p></figcaption></figure>

### Themes

You can create multiple [Themes](../build-applications/themes-and-styling/) for your apps and select a style theme for each app individually. However, each Workspace has its own collection of Themes.

<figure><img src="../.gitbook/assets/Admin  Themes.png" alt=""><figcaption><p>Themes helps to style Applications individually</p></figcaption></figure>

### Global Includes

It is possible to include global CSS styles to fine-tune the visuals of Apps. Also, it may be necessary to include a Javascript script, which is executed for all Apps of a Workspace. With the help of global includes, you can achieve  Workspace.

<figure><img src="../.gitbook/assets/Admin  Global Includes.png" alt=""><figcaption></figcaption></figure>

### Further administrative Settings

On self-hosted installations, you can set up thresholds for workspaces with the help of [ENV Variables](https://github.com/lowcoder-org/lowcoder/tree/main/deploy/docker#configuration)&#x20;

* **LOWCODER\_MAX\_ORGS\_PER\_USER**
  * Sets the default maximum number of Workspaces that a single user (as Admin) can create. This limit ensures that users can manage a reasonable number of organizations without overwhelming your installation.
  * **Default Value**: 100
* **LOWCODER\_MAX\_MEMBERS\_PER\_ORG**
  * Defines the default maximum number of members (including users and roles) allowed in a single Workspace.&#x20;
  * **Default Value**: 1000
* **LOWCODER\_MAX\_GROUPS\_PER\_ORG**
  * **Description**: Specifies the default maximum number of groups that can be created within a Workspace. Groups are used for organizing members with similar roles or access levels, and this limit helps in keeping the group structure manageable.
  * **Default Value**: 100
* **LOWCODER\_MAX\_APPS\_PER\_ORG**
  * **Description**: Determines the default maximum number of applications that could be developed or maintained in a Workspace.
  * **Default Value**: 1000
* **LOWCODER\_MAX\_DEVELOPERS**
  * **Description**: Sets the default maximum number of Users with Developer-Role that can be registered in the Workspace.
  * **Default Value**: 100

[^1]: 
