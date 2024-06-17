# Members and Groups

In Lowcoder, you can organize the members of your workspace using different groups, and assign roles to groups to manage [permissions for resources](permissions-for-resources.md). You can find members and groups settings in **Settings** on the Lowcoder Admin Page.

## Roles

There are the following Roles for Users in Lowcoder:

### For Workspaces

* Admin
* Member

<figure><img src="../.gitbook/assets/Admin  Member Group Roles.png" alt=""><figcaption><p>User Roles in Worspaces</p></figcaption></figure>

### For Apps

* Owner
* Editor
* Viewer

<figure><img src="../.gitbook/assets/App Editor  Member Rights.png" alt=""><figcaption><p>User Roles for Apps</p></figcaption></figure>

### For Datasources

* User
* Owner

<figure><img src="../.gitbook/assets/Datasource Editor  Member Rights.png" alt=""><figcaption><p>User Roles for Datasources</p></figcaption></figure>

A User in Lowcoder is an admin for his own Workspace when registered without an invite link. However, each user can be a member of one or multiple Worspaces.

In Lowcoder, you can organize the members of your workspace using different groups, and assign roles to groups to manage permissions for resources. You can find members and groups settings in **Settings** on Lowcoder Admin Page.

## Workspace members

In the **Members** tab, there are two pre-built groups by default. This helps you fast to differentiate between your colleagues who you want to invite to develop Apps together and everyone else - including the Users of these Apps. The predefined Usergroups are:

* All Members
* Developer

Independent from these Usergroups you can define your own Usergroups to manage permissions and keep the overview of everyone who is registered and using Apps in your Workspaces.

### Invite new members

You can invite members to your workspace by managing **All Members** group. Open the group and click **Invite Members**, then you can copy the invitation link.

<figure><img src="../.gitbook/assets/Admin  Invite Members.png" alt=""><figcaption></figcaption></figure>

You can also find the shortcut to  **Invite members** on the bottom left of the Lowcoder Admin Page.

{% hint style="info" %}
Permission to invite new members to a Workspace is restricted to workspace **admins** and **developers group**.
{% endhint %}

### Workspace roles and permissions

<table><thead><tr><th width="201">Role</th><th>Workspace and group level permissions</th></tr></thead><tbody><tr><td>Admin</td><td><p>Workspace</p><ul><li>Modify workspace information (name, logo, etc.)</li><li>Delete workspace</li><li>Manage workspace members and set their roles</li><li>View workspace members</li></ul><p>Groups</p><ul><li>Create groups</li><li>Delete groups</li><li>Manage group members and set their roles</li></ul></td></tr><tr><td>Member</td><td>None</td></tr></tbody></table>

Note that the workspace creator is automatically granted admin permissions.

## User Groups

Group-based management helps to organize members from different functional departments in your workspace. You can create User Groups in the **Members** tab.

### The default Group "Developers"

Lowcoder creates a **Developers** group by default which cannot be deleted, and workspace admins can add members to it. The members of the Developers Group can create new resources including apps, modules, navigations, folders, and data sources, and can manage the query library. Workspace admins can add members to the Developers Group.

### The default Group "All members"

To overview all Members of a Workspace, the default User Group "All members" can get used. Here, all Members of a Workspace regardless of their role or connection to other User Groups are listed.

### Own User Groups

In the **Members** tab, workspace admins can click **+ Create Group** to add a new group. The group creator automatically will be the group admin of the new User Group.

Group admins can add members to groups.

### Roles and permissions in own User Groups

The Administrator of a User Group can set an **Admin** or **Member** role for each group member. The permissions are listed in the table below.

<table><thead><tr><th width="145">Role</th><th>Permissions</th></tr></thead><tbody><tr><td>Admin</td><td><ul><li>Change group name</li><li>Delete groups</li><li>Manage group members and set their roles</li><li>View group members</li></ul></td></tr><tr><td>Member</td><td>View group members</td></tr></tbody></table>
