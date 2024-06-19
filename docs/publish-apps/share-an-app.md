---
description: Application Sharing in Lowcoder
---

# Share an App

## Overview

Application sharing in Lowcoder allows Application Creators to share their applications with specific users, user groups, or the public. This functionality is accessible via the sharing dialogue and supports various sharing states and roles.

## Sharing States

An application can be shared in two states:

1. **In Editing**: The app is still under development and not yet published. That means, the App can get _edited_ and shown as _preview_ by all allowed users.
2. **Published**: The app is completed and released to users. That means, the App can get additionally _viewed_ by all allowed users.

<figure><img src="../.gitbook/assets/App Editor  Share.png" alt=""><figcaption><p>The Share button is on the App Editor in the upper right corner</p></figcaption></figure>

## Roles

When sharing an application with a User-Group or individual User, you can apply a role to define the level of access:

* **Viewer**: Can view the application but cannot make any changes.
* **Editor**: Can view and edit the application.
* **Owner**: Has full control over the application, including editing and managing sharing settings.

<figure><img src="../.gitbook/assets/App Editor  Share in Workspace.png" alt="" width="563"><figcaption></figcaption></figure>

## Sharing Methods

There are three primary methods for sharing an application:

1. **Direct Sharing**: Share the app directly with specific users or user groups.
2. **Public Sharing**: Share the app with the "Anonymous" user role, making it accessible to anyone.
3. **Public to Marketplace**: Share the app on the marketplace, making it accessible to all users within the marketplace scope.

<figure><img src="../.gitbook/assets/App Editor  Share Public.png" alt="" width="563"><figcaption></figcaption></figure>

### Public to Marketplace

"Public to Marketplace" is a special sharing case designed to showcase applications in a Lowcoder marketplace.&#x20;

<figure><img src="../.gitbook/assets/App  Share Marketplace.png" alt="" width="563"><figcaption></figcaption></figure>

This feature supports two types of marketplaces:

1. **Global Marketplace**: Accessible at app.lowcoder.cloud, where apps are available to everyone.
2. **Local Marketplace**: Individual Lowcoder installations can host their own marketplaces, accessible only to their users.

The `LOWCODER_MARKETPLACE_PRIVATE_MODE` environment variable controls the visibility of apps on local marketplaces:

* **True**: Only logged-in users (Viewer, Editor, Owner) can see apps published on the local marketplace.
* **False**: Apps published on the local marketplace can be seen by everyone, including Anonymous users.

{% hint style="warning" %}
Remember, you need to publish an App, so the **Public Sharing** or the **Public to Marketplace** Sharing has an effect.
{% endhint %}

