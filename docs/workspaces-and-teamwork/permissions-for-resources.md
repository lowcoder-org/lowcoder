# Permissions for Resources

Lowcoder implements [Role-based Access Control](https://en.wikipedia.org/wiki/Role-based\_access\_control) (RBAC) by assigning a set of permissions to different roles. These permissions determine the actions users can take on resources, including apps, modules, navigations, folders, query library, and data sources.

Only workspace admins and members of **Developers** group are allowed to create resources. Workspace admins are in fact the owner of all resources.

## 1) Application Folders

Folders help you sort out the Apps, Modules, and Navigations in your Workspace. Only workspace **Admins** and members of **Developers** group have the following permissions for folders:

* Create
* Rename
* Delete
* Move Apps, Modules and Navigations into or out of folders

## 2) Apps, modules, **navigations**

The way permissions are applicable for Apps, Modules, and Navigations are the same.

<figure><img src="../.gitbook/assets/Admin  Permissions for Apps Modules Navigation.png" alt=""><figcaption><p>Apps, Modules, and Navigations works the same way for permissions.</p></figcaption></figure>

The owners of an App, a Module, or a Navigation can add members and assign different roles to them. To set Permissions for Users or Usergroups use the **Share** button in the App Editor at the top right, then click **Add members**.

<figure><img src="../.gitbook/assets/App Editor  Member Rights.png" alt=""><figcaption><p>Set Permissions based on Roles for an App</p></figcaption></figure>

Choose members and / or groups from the list and set roles for them.

The available roles and their corresponding permissions are listed in the table below.

<table><thead><tr><th width="179">Role</th><th>Permissions</th></tr></thead><tbody><tr><td><ul><li>Viewer</li></ul></td><td><ul><li>View and use the app, module and navigation</li></ul></td></tr><tr><td><ul><li>Editor</li></ul></td><td><ul><li>View and use the app, module and navigation</li><li>Rename</li><li>Edit</li><li>Publish</li><li>Duplicate</li><li>Export</li></ul></td></tr><tr><td><ul><li>Owner</li></ul></td><td><ul><li>All permissions of Editor</li><li>Delete the app or module</li><li>Set roles for members</li></ul></td></tr></tbody></table>

### Anonymous User Access for Apps

If you want to make an app or a module or a navigation public to all users (including anonymous users), you can toggle on **Make the app public** in **Share** settings.

<figure><img src="../.gitbook/assets/App Editor  Share App public.png" alt=""><figcaption><p>Apps can be public viewable without Lowcoder Login</p></figcaption></figure>

## 3) Data sources

Only workspace admins and developers can view the **Data Sources** page and create new data sources.

<figure><img src="../.gitbook/assets/Admin  Datasources.png" alt=""><figcaption><p>Overview of all Datasources of a Workspace</p></figcaption></figure>

For each data source, workspace admins and the creator can change its **Access Control**. Go to Lowcoder homepage > **Data Sources**, and click `···` > **Access Control**.

<figure><img src="../.gitbook/assets/Datasource Editor  Member Rights.png" alt=""><figcaption><p>Set Permissions based on Roles for an Datasource</p></figcaption></figure>

In **Access Control** settings, add members or groups from the workspace, and then choose their roles (**Can use** or **Can manage**).

The permissions of these two roles are listed in the following table:

<table><thead><tr><th width="217">Role</th><th>Permissions</th></tr></thead><tbody><tr><td><ul><li>Can use</li></ul></td><td><ul><li>Use data source when editing an app/module/navigation/library query</li></ul></td></tr><tr><td><ul><li>Can manage</li></ul></td><td><ul><li>Use data source when editing an app/module/navigation/library query</li><li>Edit data source</li><li>Delete data source</li><li>Manage data source permission roles</li></ul></td></tr></tbody></table>

## 4) Query library

Workspace Admins and members of Developers group can create Query Library in Lowcoder and have read, write, use, and delete permissions for queries (if they can use the query's corresponding data source).

<figure><img src="../.gitbook/assets/Query Library  New Query.png" alt=""><figcaption></figcaption></figure>
