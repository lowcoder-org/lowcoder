# SAAS Mode

In SAAS Mode, User can create multiple Workspaces. With some other settings, Admin can control the behavior of Users on SAAS mode .

### Setting Up SAAS mode :&#x20;

1. Set LOWCODER\_WORKSPACE\_MODE to "SAAS" in docker-compose-multi.yml file. \
   ![](<../../.gitbook/assets/frame_generic_light (4).png>)\
   You can see in the following screenshot that in "SAAS" mode, each User can create multiple Workspaces : \
   ![](<../../.gitbook/assets/frame_generic_light (5).png>)
2. In the above screenshot, you can see three configuration variables regarding Email and Workspace creation on Sign up. Let's go through these one by one :&#x20;
   1. **LOWCODER\_EMAIL\_SIGNUP\_ENABLED :** \
      This variable is the configuration for showing "Sign Up" button on Lowcoder. When it is set to "TRUE", "Sign Up" button will show up and new User can sign up in SAAS mode. A new Workspace will be created for this User, and he/she will be the Admin of this Workspace : \
      \
      LOWCODE\_EMAIL\_SIGNUP\_ENABLED = true;\
      ![](<../../.gitbook/assets/frame_generic_light (1) (1).png>)\
      LOWCODE\_EMAIL\_SIGNUP\_ENABLED = false;\
      ![](<../../.gitbook/assets/frame_generic_light (2).png>)
   2. **LOWCODER\_CREATE\_WORKSPACE\_ON\_SIGNUP :** \
      This variable is the configuration for creating a Workspace when new User signs up.\
      \
      LOWCODER\_CREATE\_WORKSPACE\_ON\_SIGNUP = true;\
      ![](<../../.gitbook/assets/frame_generic_light (6).png>)\
      LOWCODER\_CREATE\_WORKSPACE\_ON\_SIGNUP = false;\
      ![](<../../.gitbook/assets/frame_generic_light (11) (1).png>)

### Scenarios :&#x20;

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

Let's explain the above scenarios with different settings of the Environment Variables. Let's understand these Env Variables, first : \
\
1\. **LOWCODER\_EMAIL\_SIGNUP\_ENABLED :** This Env variable controls the Sign up feature whether New Users can sign up or not. If set to False, Sign up button is not shown up and if a new User tries to enter an email and go forward, User is not shown the Sign up page. \
![](<../../.gitbook/assets/frame_generic_light (7).png>)

2. **LOWCODER\_CREATE\_WORKSPACE\_ON\_SIGNUP :** This Env variable controls the creation of a Workspace when a new User signs up. If set to False, a new User will get added to the Default Workspace.
3.  &#x20;**Disable Email Auth :** This feature controls the Sign up/Login using standard Email field. When set to False, Email field won't show up on Sign Up and Login pages, and User won't be able to Sign up or Login using Email field. \
    \
    ![](<../../.gitbook/assets/frame_generic_light (10).png>)\
    \
    ![](<../../.gitbook/assets/frame_generic_light (8).png>)\
    **Scenario # 1 : When LOWCODER\_EMAIL\_SIGNUP\_ENABLED = False**

    This means that New User can't Sign up on a Workspace. So, LOWCODER\_CREATE\_WORKSPACE\_ON\_SIGNUP Env variable won't matter. Now, if Email Auth is "disabled", then User can only sign in using other Auth Providers, but still New User should NOT be able to Sign up.\
    \
    Here, if Admin disables the "Email Auth" ( means that Members can't Sign up/Login using Standard Email field ), Lowcoder allows Admin to still be able to login using /admin/auth/login. But, for other Users, Email field won't be available at /user/auth/login. They would only be able to see other Auth Providers options set by Admin.\
    \
    **View on /user/auth/login :** \
    ![](<../../.gitbook/assets/frame_generic_light (16).png>)

    **View on /admin/login :** \
    ![](<../../.gitbook/assets/frame_generic_light (14).png>)\
    \
    **Scenario # 1 : When LOWCODER\_EMAIL\_SIGNUP\_ENABLED = True**\
    This means that New User can't Sign up on a Workspace. If LOWCODER\_CREATE\_WORKSPACE\_ON\_SIGNUP is set to "True", then for every new Sign Up, a New Workspace will be created for the User.&#x20;

**Note :** Workspace Mode Env variable can also have the value "MULTIWORKSPACE" instead of "SAAS" . \
![](<../../.gitbook/assets/frame_generic_light (12).png>)
