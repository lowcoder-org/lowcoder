# Audit Logs

Audit-Logs are essential for teams that require **security visibility**, **compliance readiness**, and **operational accountability** — especially when managing multiple environments (e.g., Development, Staging, Production).

Audit Logs provide a **detailed record** of everything that Users do in your Lowcoder environment. They help you:

* **Trace Lowcoder App Developer behavior** for security monitoring
* **Meet compliance standards** (e.g., SOC2, ISO27001)
* **Investigate changes or issues** with full contextual data
* **Understand how apps and resources are being managed**

<figure><img src="../../../.gitbook/assets/frame_generic_light (22).png" alt=""><figcaption></figcaption></figure>

<figure><img src="../../../.gitbook/assets/frame_generic_light (1) (4).png" alt=""><figcaption></figcaption></figure>

### Tracked Events

Lowcoder logs all critical operations, including authentication, app interactions, resource management, and system-level actions.

#### 🔐 User Sessions

* Sign in
* Logout

#### 🧩 App Operations

* View app
* Create new app
* Update app
* Delete app
* Move app to folder
* Move app to Trash
* Restore app

#### 📁 Folder Operations

* Create new folder
* Update folder
* Delete folder

#### 📊 Data Query Activity

* Execute data query

#### 👥 User Group Management

* Create user group
* Update user group
* Delete user group
* Add group member
* Remove group member
* Update member role
* Leave user group

#### 🛠️ Platform/System

* Server startup

#### 🌐 Data Source Management

* Create data source
* Update data source
* Delete data source
* Grant permission
* Update permission
* Delete permission

#### 🧱 Library Queries

* Create library query
* Update library query
* Delete library query
* Publish library query

### What Data Is Logged?

Each audit entry records the **who**, **what**, **when**, **where**, and **how** of the event.

#### 📌 Metadata Collected:

| Field                                | Description                                               |
| ------------------------------------ | --------------------------------------------------------- |
| **Event ID**                         | Unique ID for the log entry                               |
| **Event Time**                       | Timestamp of the action                                   |
| **Event Type**                       | Type of action (from the list above)                      |
| **User ID**                          | Identifier of the acting user                             |
| **Organization ID**                  | Context in which the action took place                    |
| **Application ID**                   | Related app (if applicable)                               |
| **Details**                          | Description of what was changed (e.g., old and new names) |
| **Geolocation**                      | Location data derived from IP                             |
| **User Agent Data**                  | Full client fingerprint, including:                       |
| → Name, Device Class, Brand          |                                                           |
| → OS name and version                |                                                           |
| → Browser engine and version         |                                                           |
| → Webview container info (if mobile) |                                                           |

This ensures **maximum traceability** and **complete accountability**.

### Multi-Environment Support

When running multiple Lowcoder environments via the Enterprise “Staging” setup, all audit logs are **centralized** — enabling you to:

* View logs **across environments**
* Compare activity **between Dev, Staging, and Prod**
* Maintain a **single pane of glass** for security audits

### Exploring Audit Logs in the UI

Lowcoder Enterprise offers a **dedicated Audit Log UI**, where administrators can:

* Use filters to drill down by:
  * **Environment**
  * **Workspace**
  * **User**
  * **Apps**
  * **Event Type**
  * **Time range**
* View a **bar chart** for quick visual overview of activity volume
* Inspect a **detailed table** of events
* **Expand any row** to see the full event payload, including:
  * Metadata
  * Device + browser info
  * Action-specific details

This gives you a **high-resolution view** of every interaction.

<figure><img src="../../../.gitbook/assets/frame_generic_light (5) (1) (1).png" alt=""><figcaption></figcaption></figure>

**Event Details Page :**&#x20;

Each Event has an Event details page, which include all the information about the Event, User's location and device/OS/Browser information.&#x20;

<figure><img src="../../../.gitbook/assets/frame_generic_light (6) (1).png" alt=""><figcaption></figcaption></figure>
