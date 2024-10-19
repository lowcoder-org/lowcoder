# n8n Integration

The combination of Lowcoder and n8n is just amazing. It empowers you as App creators to build not just individual screens, but entire ecosystems of interconnected, data-driven workflows. The ability to access data from various sources and react to user inputs elevates the user experience to new heights, making it a game-changer in the world of application development. With this partnership, your applications can truly become dynamic, intelligent, and tailored to the needs of your users.

The overall path is as follows:

* [Install](https://docs.lowcoder.cloud/lowcoder-documentation/setup-and-run/self-hosting) Lowcoder or use [app.lowcoder.cloud](https://app.lowcoder.cloud)&#x20;
* [Install n8n](https://docs.n8n.io/hosting/installation/) (selfhosted to access Community Nodes)
* Install the [Lowcoder Community Node](https://www.npmjs.com/package/n8n-nodes-lowcoder)
* Create Lowcoder Credentials in n8n
* Place Lowcoder n8n Nodes in your workflow to represent individual app screens
* Access n8n via Datasource to gather Workflow and Execution Data
* Automate Application loading and data handover based on workflows

### Install the n8n Lowcoder Node

The Lowcoder Community Node for n8n is public in npmjs.com\
[https://www.npmjs.com/package/n8n-nodes-lowcoder](https://www.npmjs.com/package/n8n-nodes-lowcoder)

In your self-host installation of n8n you can install Community nodes easily with the UI.

```
n8n-nodes-lowcoder
```

<figure><img src="../.gitbook/assets/n8n  Install Lowcoder Node.png" alt=""><figcaption><p>UI to install Community Nodes for n8n</p></figcaption></figure>

You can also install the node based on the shell command in the local n8n root directory.

```
npm install n8n-nodes-lowcoder
```

If you run n8n in a docker, use the mounted /custom folder for the installation

```
mkdir ~/.n8n/custom
cd ~/.n8n/custom
npm install n8n-nodes-lowcoder
```

{% hint style="info" %}
If you operate n8n in the queue mode and use multiple workers, remember to install the Lowcoder Community Node on each worker too.
{% endhint %}

### Connect Lowcoder in n8n

After proper installation, the Lowcoder Community Node will be available in the list of actions.

<figure><img src="../.gitbook/assets/n8n  Lowcoder Node.png" alt=""><figcaption><p>use the Lowcoder Node in your n8n Workflows</p></figcaption></figure>

You can use one or many Lowcoder Nodes in your workflow. As any other n8n node, just place the Lowcoder Node in your workflow and connect it.

### Enter Credentials to connect to your Lowcoder

With the help of the credentials dialogue, you can now connect to Lowcoder (API).

As API Base URL you can use https://api-service.lowcoder.cloud for the public community edition or the URL of your self-hosted api-service instance of Lowcoder.

<figure><img src="../.gitbook/assets/n8n  Lowcoder Credencials.png" alt=""><figcaption><p>Connect to Lowcoder with your credencials</p></figcaption></figure>

### Set an app as a Reference

As we use Username and Password - and internally work with the Lowcoder Access-Token, your current workspace is the used Workspace for the Lowcoder Node. Based on that you can now search your app or module to set this app as reference in the Lowcoder Community Node.

<figure><img src="../.gitbook/assets/n8n  Choose App reference.png" alt=""><figcaption></figcaption></figure>

{% hint style="warning" %}
Remember, the displayed App List is connected to your current Workspace in Lowcoder. When you change the workspace in Lowcoder, you will get an adapted List of apps of the newly selected Workspace.
{% endhint %}

If you know the ID of your Lowcoder App, you can enter it manually instead "by ID" of searching from the Application List.

<figure><img src="../.gitbook/assets/n8n  App selection type.png" alt=""><figcaption><p>Select "By ID" to enter an Lowcoder App ID manually</p></figcaption></figure>

### n8n Lowcoder App Reference & State

As soon as a workflow of n8n reaches a Lowcoder Node, the execution in n8n changes in the state of "waiting". The expectation behind this is, that a Lowcoder Node represents an App, in which most likely a "User-Action" will happen. The Workflow therefore needs to wait, till the User-Action is finalized.

By itself, the Lowcoder n8n Node will wait infinitely. To resume the workflow and continue to the next nodes, the Lowcoder n8n Node offers a Webhook. This is a Rest API call that is connected to the Lowcoder n8n node. The structure of this webhook is also described in the UI of the Lowcoder Node in n8n.

{% hint style="info" %}
Resume the workflow by calling this Webhook: \
http(s)://{n8n-url}/webhook-waiting/{Workflow-Execution-ID}/{Lowcoder-App-ID}
{% endhint %}

This Webhook has 2 functions. First, it resumes the Workflow, so n8n will exit the "wait" state and continue the execution of the workflow. The second function is truly important tough...

By the Webhook in POST Method, you can send Data from the Lowcoder App to the Lowcoder n8n node. In this way, you can easily integrate User-feedback / User-action-data in n8n workflows. Imagine for example Form Data that is later in the n8n workflow processed.

### Access n8n information in Lowcoder Apps

Lowcoder offers REST API calls (to use for Webhooks) and a native n8n API integration as Datasource. These instruments you can use to work with n8n on the Lowcoder side.

To connect to the n8n API you need to create and use an API Key of n8n.

<figure><img src="../.gitbook/assets/n8n  create API Key.png" alt=""><figcaption><p>Create and Manage API Keys in n8n</p></figcaption></figure>

Now you can connect the native n8n Data source in Lowcoder.

<figure><img src="../.gitbook/assets/n8n  Datasource.png" alt=""><figcaption><p>accessing n8n as a Data source by API</p></figcaption></figure>

### The magic sauce - n8n Workflows & Lowcoder

There are two important IDs you need from n8n to deal with workflows in Lowcoder.\
The "Workflow-ID" and the "Workflow-Execution-ID".&#x20;

The Workflow-Execution-ID is built, as soon as the first node of a workflow (trigger) is successfully executed. In our example, we trigger the workflow from a Lowcoder App by the Webhook. To get the "own Execution-ID" of this Workflow Execution as a result (to work with it further on till the workflow is finalized), we need this ID in Lowcoder. The trick here is to use a "Respond to Webhook" Node of n8n, which does not do much more than sending back the Execution-ID as soon as a Workflow Execution is triggered.

To achieve this, we use the expression for a JSON Data Response.

```
{"execution_id" : "{{ $execution.id }}"}
```

<figure><img src="../.gitbook/assets/n8n  get Execution ID.png" alt=""><figcaption><p>using the Response to Webhook to gather the Workflow-Execution-ID</p></figcaption></figure>

<figure><img src="../.gitbook/assets/n8n  Example Workflow.png" alt=""><figcaption><p>an example n8n Workflow which can be triggered by Lowcoder</p></figcaption></figure>

We can now use REST API Calls to trigger n8n to start or continue Workflows.

<figure><img src="../.gitbook/assets/n8n  trigger Workflow.png" alt=""><figcaption><p>use a POST Method Webhook to resume a n8n execution after a Lowcoder Node and send Data from Lowcoder to n8n</p></figcaption></figure>

Next to the Webhooks to trigger actions in n8n, we can use the n8n native Datasource in Lowcoder to retrieve Data about the Workflow and the current workflow execution.

<figure><img src="../.gitbook/assets/n8n  get Workflow Execution Data.png" alt=""><figcaption><p>access the current workflow execution and data, which was build and collected in the n8n workflow so far.</p></figcaption></figure>

### How to use

The possibilities of this integration are pretty endless. However, a few major concept ideas may help you to start with the first steps.

* You can create a "Master-App" in Lowcoder, which contains several hidden modules, which are screens of a larger application. Based on the current workflow execution node, you can hide or show these modules (Apps) based on the current situation in the n8n workflow.&#x20;

```
// A n8n datasource query with the name "get_workflow_execution_data" retrieves 
// the current state of an execution, so you can access the current (Lowcoder) node
// in the workflow with this notation:
{{ get_workflow_execution_data.data.data.resultData.lastNodeExecuted }}
```

<figure><img src="../.gitbook/assets/n8n  Lowcoder Master App.png" alt=""><figcaption><p>a Master-App can contain multiple "hidden" Modules (apps). <br>The display of these Modules is then bound to the current n8n workflow execution</p></figcaption></figure>

* You could create independent Lowcoder apps, connect user-action buttons and the "Go to App" Event Handler, and open "next" apps in the workflow based on the current node information after a resumed workflow (when n8n did execute further steps and waits at the next Lowcoder Node)
* You could use Lowcoder Apps like Forms or Interactive Charts to send Data into Workflows with the Lowcoder Node and the POST Method resume-Webhook.
* You can use n8n to collect data from various data sources and pre-process it before it reaches a Lowcoder App. This could save you from writing complex data transformation steps based on Javascript in Lowcoder Transformers.&#x20;
* Lowering the Datasizes which hit Lowcoder Applications and the Browser of the Users. Smaller Data, which fits the needs of components and the desired display of data will speed up the Development of apps as well as the displaying and execution of Apps.
* You could use n8n as your Middleware, and store in the backend sensitive Data like Credentials of APIs or OAuth Tokens (JWT) and allow only access to backend APIs via n8n. A similar principle is used in Lowcoder too.
