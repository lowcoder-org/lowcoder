# Enterprise Mode

In Enterprise Mode, there is only One Workspace that gets created automatically and Users can only join in that Workspace as a Member/Admin, but can't create their own Workspaces. With some other settings, Super Admin can control the behavior of Users on Enterprise mode . ( will explain it )&#x20;

### Setting Up Enterprise mode :&#x20;

1. In Local Setup, we have a Root Admin User, that we can configure in docker-compose-multi.yml file. This user will be created by default and it will Super Admin of the default Workspace.\
   ![](<../../.gitbook/assets/frame_generic_light (3) (1).png>)
2. Set LOWCODER\_WORKSPACE\_MODE to "ENTERPRISE" in docker-compose-multi.yml file. \
   ![](<../../.gitbook/assets/frame_generic_light (3).png>)
3. In the above screenshot, you can see three configuration variables regarding Email and Workspace creation on Sign up. Let's go through these one by one :&#x20;
   1. **LOWCODER\_EMAIL\_SIGNUP\_ENABLED :** \
      This variable is the configuration for showing "Sign Up" button on Lowcoder. When it is set to "TRUE", "Sign Up" button will show up and new User can sign up in ENTERPRISE mode. But, as this is ENTERPRISE mode, so new User will only become the Member of default Workspace. \
      LOWCODER\_EMAIL\_SIGNUP\_ENABLED = true;\
      \
      ![](<../../.gitbook/assets/frame_generic_light (1) (2).png>)\
      LOWCODER\_EMAIL\_SIGNUP\_ENABLED = false;\
      \
      ![](<../../.gitbook/assets/frame_generic_light (2) (1).png>)
   2. **LOWCODER\_CREATE\_WORKSPACE\_ON\_SIGNUP :** \
      This variable is the configuration for creating a Workspace when new User signs up, but as there is only One Workspace that gets created by default in ENTERPRISE mode, so this variable value doesn't matter in ENTERPRISE mode. Setting it to TRUE or FALSE won't create a new Workspace on Sign Up.\
      ![](<../../.gitbook/assets/frame_generic_light (11) (2).png>)

### Scenarios :&#x20;

1. LOWCODER\_WORKSPACE\_MODE = ENTERPRISE
2. LOWCODER\_EMAIL\_SIGNUP\_ENABLED = true

| Scenario                             | Subscenario                                                       | Expected Result                                                                                  |
| ------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Can Workspace Admin login Normally   |                                                                   |                                                                                                  |
|                                      | If They are Admin of Single Workspace                             | Should be able to Login                                                                          |
|                                      | If They are Admin of multiple Workspaces                          | Not Applicable as ENTERPRISE mode allows only ONE Workspace                                      |
|                                      | If they are Admin on Workspace A, but Member on Workspace B       | Not Applicable as ENTERPRISE mode allows only ONE Workspace                                      |
| Can Workspace Members login Normally |                                                                   |                                                                                                  |
|                                      | If they are Member at a single Workspace                          | Should be able to Login                                                                          |
|                                      | If they are Member at multiple Workspaces                         | Not Applicable as ENTERPRISE mode allows only ONE Workspace                                      |
|                                      | If they are Member at Workspace A, but Admin on Workspace B       | Not Applicable as ENTERPRISE mode allows only ONE Workspace                                      |
| New User Sign up                     |                                                                   |                                                                                                  |
|                                      | Can New User sign up as an Admin                                  | Not Applicable as in ENTERPRISE mode, new User can only sign up as a member of default Workspace |
|                                      | Can New User sign up as a Member                                  | Any User should be able to sign up as a Member of default Workspace                              |
|                                      | Can Super Admin make a Member the Admin of Default Workspace      | Super Admin should be able to update the Role of Member to Admin                                 |
|                                      | Can Admin create a New Workspace                                  | Admin should NOT be able to create a New Workspace                                               |
|                                      | Can Super Admin create a New Workspace                            | Super Admin should NOT be able to create a New Workspace                                         |
|                                      | Can Super Admin or Admin update the Role of a Member to Developer | Super Admin or Admin should be able to update the Role of a Member to Developer                  |
|                                      | Can Developer create a New Workspace                              | Developer should NOT be able to create a New Workspace                                           |

| Scenario                   | LOWCODER\_EMAIL\_SIGNUP\_ENABLED  | LOWCODER\_CREATE\_WORKSPACE\_ON\_SIGNUP | Disable Email Auth   |
| -------------------------- | --------------------------------- | --------------------------------------- | -------------------- |
| Can Admin Login            | True                              | NA                                      | Enabled              |
| ....                       | True                              | NA                                      | Disabled             |
| ....                       | False                             | NA                                      | Enabled              |
| Can Admin Login            | False                             | NA                                      | Disabled             |
| Can Member Sign Up / Login | True                              | NA                                      | Enabled              |
| ....                       | True                              | NA                                      | Disabled             |
| ....                       | False                             | NA                                      | Enabled              |
| Can Member Sign Up / Login | False                             | NA                                      | Disabled             |



**Scenario #1 : Admin -> When LOWCODER\_EMAIL\_SIGNUP\_ENABLED = True or False** \
Any User can't sign up as Admin in ENTERPRISE Mode, regardless of any settings for Env Variables. Admin can only Login.

Here, if Admin disables the "Email Auth" ( means that Members can't Sign up/Login using Standard Email field ), Lowcoder allows Admin to still be able to login using /admin/auth/login. But, for other Users, Email field won't be available at /user/auth/login. They would only be able to see other Auth Providers options set by Admin.\
**View on /user/auth/login :** \
![](<../../.gitbook/assets/frame_generic_light (16).png>)

**View on /admin/login :** \
![](<../../.gitbook/assets/frame_generic_light (14).png>)

**Scenario #2 : Member -> When LOWCODER\_EMAIL\_SIGNUP\_ENABLED = True**\
This means that New User can sign up as Member.  When Email Auth is Disabled, then User can only Sign up/Login using other Auth Providers.

**Scenario #3 : Member -> When LOWCODER\_EMAIL\_SIGNUP\_ENABLED = False**\
With this configuration, only existing Members would be able to Login to Lowcoder. No new Member can Sign up.

**Note :** Workspace Mode Env variable can also have the value "SINGLEWORKSPACE" instead of "ENTERPRISE" .\
![](<../../.gitbook/assets/frame_generic_light (13).png>)
