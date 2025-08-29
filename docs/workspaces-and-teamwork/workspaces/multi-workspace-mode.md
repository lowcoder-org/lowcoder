# Multi-Workspace Mode



In Multi-Workspace Mode, User can create multiple Workspaces. With some other settings, Admin can control the behavior of Users on Multi-Workspace mode.

### Setting Up Multi-Workspace mode

1. Set LOWCODER\_WORKSPACE\_MODE to "SAAS" in docker-compose-multi.yml file.

{% hint style="info" %}
Workspace Mode Env variable can also have the value "MULTIWORKSPACE" instead of "SAAS"&#x20;
{% endhint %}

<figure><img src="../../.gitbook/assets/frame_generic_light (4) (3).png" alt=""><figcaption></figcaption></figure>

You can see in the following screenshot that in "Multi-Workspace" mode, each User can create multiple Workspaces.

<figure><img src="../../.gitbook/assets/frame_generic_light (5) (2).png" alt=""><figcaption></figcaption></figure>

1. In the above screenshot, you can see three configuration variables regarding Email and Workspace creation on Sign up.
   1.  **LOWCODER\_EMAIL\_SIGNUP\_ENABLED**\
       \
       This variable is the configuration for showing "Sign Up" button on Lowcoder. When it is set to "TRUE", "Sign Up" button will show up and new User can sign up in Multi-Workspace mode. A new Workspace will be created for this User, and he/she will be the Admin of this Workspace : \
       \
       LOWCODE\_EMAIL\_SIGNUP\_ENABLED = **true**\


       <figure><img src="../../.gitbook/assets/frame_generic_light (1) (1) (1) (1) (1).png" alt=""><figcaption></figcaption></figure>

       LOWCODE\_EMAIL\_SIGNUP\_ENABLED = **false**\


       <figure><img src="../../.gitbook/assets/frame_generic_light (2) (3).png" alt=""><figcaption></figcaption></figure>
   2.  **LOWCODER\_CREATE\_WORKSPACE\_ON\_SIGNUP**\
       \
       This variable is the configuration for creating a Workspace when new User signs up.\
       \
       LOWCODER\_CREATE\_WORKSPACE\_ON\_SIGNUP = **true**\


       <figure><img src="../../.gitbook/assets/frame_generic_light (6) (1) (1).png" alt=""><figcaption></figcaption></figure>

       LOWCODER\_CREATE\_WORKSPACE\_ON\_SIGNUP = **false**\


       <figure><img src="../../.gitbook/assets/frame_generic_light (11) (1) (1).png" alt=""><figcaption></figcaption></figure>

### Scenarios

1. LOWCODER\_WORKSPACE\_MODE = SAAS
2. LOWCODER\_EMAIL\_SIGNUP\_ENABLED = true
3. LOWCODER\_CREATE\_WORKSPACE\_ON\_SIGNUP =  true

| Scenario                           | Subscenario                                                                                     | Expected Result                                                                                                                                                                                                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Can Workspace Admins login normal  |                                                                                                 |                                                                                                                                                                                                                                                      |
|                                    | If they are Admin of a single workspace                                                         | Admin should get redirected to Password screen and relevant OAuth methods should get displayed if these are configured.                                                                                                                              |
|                                    | if they are Admin of multiple workspaces                                                        | Admin should be displayed with the option to choose from Workspaces he/she is Admin of. After selecting a Workspace, Lowcoder should redirect to Password screen and relevant OAuth methods should get displayed if these are configured.            |
|                                    | If they are Admin on Workspace A, but Member on Workspace B                                     | Admin should be displayed with the option to choose from Workspaces he/she is Admin of. After selecting a Workspace, Lowcoder should redirect to Password screen and relevant OAuth methods should get displayed if these are configured.            |
| Can Workspace Members login normal |                                                                                                 |                                                                                                                                                                                                                                                      |
|                                    | If they are Member at a single Workspace                                                        | Member should get redirected to Password screen and relevant OAuth methods should get displayed if these are configured.                                                                                                                             |
|                                    | If they are Member at multiple Workspaces                                                       | Member should be displayed with the option to choose from Workspaces he/she is Member of. After selecting a Workspace, Lowcoder should redirect to Password screen and relevant OAuth methods should get displayed if these are configured.          |
|                                    | If they are Member at Workspace A, but Admin on Workspace B                                     | Member should be displayed with the option to choose from Workspaces he/she is Member or Admin of. After selecting a Workspace, Lowcoder should redirect to Password screen and relevant OAuth methods should get displayed if these are configured. |
| New User Sign up                   |                                                                                                 |                                                                                                                                                                                                                                                      |
|                                    | Can New User sign up as an Admin                                                                | Yes. Any New User will the Admin of their Workspace as they Sign up                                                                                                                                                                                  |
|                                    | Can New User sign up as a Member                                                                | By default, No. but, if they join another Workspace through the Invite link, then they will Sign up as a Member.                                                                                                                                     |
|                                    | Can Admin create a New Workspace                                                                | Yes. Admin can create multiple Workspaces                                                                                                                                                                                                            |
|                                    | Can Admin update the Role of a Member to Developer                                              | Yes. It is possible.                                                                                                                                                                                                                                 |
| Create Workspace on Sign up        |                                                                                                 |                                                                                                                                                                                                                                                      |
|                                    | Is a New Workspace get created when new Member signs up ?                                       | New Workspace should get created when a new Member signs up.                                                                                                                                                                                         |
|                                    | Is a New Workspace get created when a new Member signs up using another Workspace Invite link ? | New Member should get added as Member on the Workspace he/she joined in, and No New Workspace should get created.                                                                                                                                    |

| Scenario                         | LOWCODER\_EMAIL\_SIGNUP\_ENABLED  | LOWCODER\_CREATE\_WORKSPACE\_ON\_SIGNUP | Disable Email Auth   |
| -------------------------------- | --------------------------------- | --------------------------------------- | -------------------- |
| Can Admin/Member Sign up / Login | True                              | True                                    | Enabled              |
| Can Admin/Member Sign up / Login | True                              | True                                    | Disabled             |
| ....                             | True                              | False                                   | Enabled              |
| ....                             | True                              | False                                   | Disabled             |
| ....                             | False                             | True                                    | Enabled              |
| ....                             | False                             | True                                    | Disabled             |
| Can Admin/Member Sign up / Login | False                             | False                                   | Enabled              |
| Can Admin/Member Sign up / Login | False                             | False                                   | Disabled             |

Let's explain the above scenarios with different settings of the Environment Variables.\
\
**LOWCODER\_EMAIL\_SIGNUP\_ENABLED**

This Env variable controls the Sign up feature whether New Users can Sign Pp or not. If set to False, Sign up button is not shown up and if a new User tries to enter an email and go forward, User is not shown the Sign up page.

\
![](<../../.gitbook/assets/frame_generic_light (7) (1) (1).png>)

**LOWCODER\_CREATE\_WORKSPACE\_ON\_SIGNUP**

This Env variable controls the creation of a Workspace when a new User signs up. If set to False, a new User will get added to the Default Workspace.

**Disable Email Auth**

<figure><img src="../../.gitbook/assets/frame_generic_light (10) (1).png" alt=""><figcaption></figcaption></figure>

This feature controls the Sign up/Login using standard Email field. When set to disabled, Email field won't show up on Sign Up and Login pages, and User won't be able to Sign up or Login using Email field. \
\
\
**Scenario: When LOWCODER\_EMAIL\_SIGNUP\_ENABLED = False**

<figure><img src="../../.gitbook/assets/frame_generic_light (8) (1).png" alt="" width="375"><figcaption></figcaption></figure>

This means that New User can't Sign up on a Workspace. So, LOWCODER\_CREATE\_WORKSPACE\_ON\_SIGNUP Env variable won't matter.&#x20;

Now, if Email Auth is "disabled", then User can only sign in using other Auth Providers, but still New User should NOT be able to Sign up.

### Administrative Access

Here, if Admin disables the "Email Auth" ( means that Members can't Sign up/Login using Standard Email field ), Lowcoder allows Admin to still be able to login using /admin/auth/login. But, for other Users, Email field won't be available at /user/auth/login. They would only be able to see other Auth Providers options set by Admin.\
\
**View on /user/auth/login**

<figure><img src="../../.gitbook/assets/frame_generic_light (16).png" alt=""><figcaption></figcaption></figure>

**View on /admin/login**

<figure><img src="../../.gitbook/assets/frame_generic_light (14).png" alt=""><figcaption></figcaption></figure>

**Scenario: When LOWCODER\_EMAIL\_SIGNUP\_ENABLED = True**\
\
If LOWCODER\_CREATE\_WORKSPACE\_ON\_SIGNUP is set to "True", then for every new Sign Up, a New Workspace will be created for the User.&#x20;

<figure><img src="../../.gitbook/assets/frame_generic_light (12) (1).png" alt=""><figcaption></figcaption></figure>

