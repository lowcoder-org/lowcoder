# Query basics

If there is a special case handling, you can specify it additionally for the individual Event HandlerQueries support reading data from or writing data to your data sources. You can use Data Queries for all kinds of Data Sources, like Databases, Stream Data Sources, or classic Restful APIs. You can create queries while editing an app or in the query library.&#x20;

All Data Queries in Lowcoder will always return JSON Data. When you call your Database, the result will get transformed into a JSON response for example. This is very useful to have ease of use for the data in all later places in Lowcoder without the need for a Data Serialization between Formats.

## Connect to a data source

You can connect to a data source that was already in your data source library or create a new one. For detailed information, see [Data sources in Lowcoder](../data-sources-in-lowcoder/).

## Create a query

The UI of query editor varies when you choose different types of data sources. Below is an example of a connection to a PostgreSQL database and a corresponding statement.

<figure><img src="../../.gitbook/assets/App Editor  Database Query SQL.png" alt=""><figcaption><p>A Data Query to a Postgres Database</p></figcaption></figure>

The SQL Mode is suitable for everyone who queries the Database and for proficient Developers who are very fluent in SQL Language and their used Database specialties.

<figure><img src="../../.gitbook/assets/App Editor  Database Query GUI.png" alt=""><figcaption><p>For many Databases there is a visual GUI Mode to execute prepared statements on the Database.</p></figcaption></figure>

Lowcoder also offers a GUI Mode for Write-Operations on the Database, such as INSERT, UPDATE, and DELETE. This helps you to ease the Binding of user-made changes of Data in your App, back to the Databases.

### Metadata

You can view the metadata of databases such as PostgreSQL, MongoDB, and MySQL. Click Metadata, and the database tables and their fields are displayed in a tree structure. Metadata is useful for writing queries, and it enables auto-suggestion while you type. It can also help you understand the Structure of the Database and its tables for a connected Database.

### Dynamic Queries and Data Binding

Lowcoder evaluates your query statement with JavaScript code inside `{{ }}` in real-time, and the result is displayed below in a floating box, so you can use it to check the correctness of the query statement.

## Trigger a query when:...

Lowcoder triggers your queries in two modes: it runs automatically when "inputs change or on page load" or manually (and so invoked in other event handlers for example).&#x20;

### Inputs change or on page load

Queries set to this mode automatically run when dependent inputs change or on page load. For example, the query result of `select * from users where customer_id = {{input.value}}` updates immediately when `input.value` changes. \*\*\*\* This mode to run a query is recommended for queries reading data from data sources.

{% hint style="warning" %}
Consider carefully when to trigger a query. Data Queries that may take longer to respond may block the application visuals from loading properly and displaying your data.&#x20;
{% endhint %}

### Manually invoked

For this mode of queries, they run only with your manual trigger, such as a button or link click. You need to specify an event handler to trigger the query. This mode is recommended for queries writing data to data sources, because you may need to confirm that the input is complete and error-free before running it.

{% hint style="info" %}
**How to choose a query's trigger mode?**

In most cases, queries reading data, like **select** operations, can be set to the former mode, and those writing data, like **create**/**delete**/**update** operations, run the latter way.

When Lowcoder detects your query statement switches from reading to writing data, the trigger mode switches to **Manually invoked** automatically, but not the other way around.
{% endhint %}

{% hint style="info" %}
Sometimes, you can also have the need to call a Data Query as an outcome or after the response of another Data Query to merge data responses, for example. You can use [Event-Handlers](../../build-applications/app-interaction/event-handlers.md) of Data Queries or the so called [Data Responder](../../business-logic-in-apps/write-javascript/data-responder.md) then. The first query may be triggered "on Inputs change or on page load" and following queries will then use the trigger "manually invoked".
{% endhint %}

## Response-Event Handler

As soon as the Response processing (and parsing) of a Data Query is done, you can use Event Handlers as a trigger for further actions. There are onSuccess and onError Triggers. You also can combine multiple Event Handlers.

### onSuccess Handler

The `onSuccess` handler is designed to execute specific actions after a data query has successfully completed. This mechanism is essential for initiating subsequent operations, such as running JavaScript queries or other subsequent queries that may need the Response of a initial Data Query.

**Implementation**

To utilize the `onSuccess` handler, simply click on "Event Handlers" in the lower section of the Data Query Editor in the "General" Tab. Then you choose "on Success" and next your desired action.

<figure><img src="../../.gitbook/assets/Screenshot 2024-03-12 at 18.59.28.png" alt="Data Query Editor Event Handler"><figcaption></figcaption></figure>

#### onError Handler

The `onError` handler serves as the counterpart to the `onSuccess` handler, designed to manage scenarios where a data query fails. This could be due to various reasons, such as network issues, API errors, or data inconsistencies.

<figure><img src="../../.gitbook/assets/Screenshot 2024-03-12 at 19.01.02.png" alt=""><figcaption></figcaption></figure>

To build an event handling for a data query error case, simply choose "Failure" on the Event Selection for the Event Handler. You can specify additionally for the individual Event Handler if there is a special case handling. For example, you would only show a notification on a 4xx or 5xx Response Code for a Restful Data Query.

<figure><img src="../../.gitbook/assets/Screenshot 2024-03-12 at 19.06.09.png" alt=""><figcaption><p>Create a rule when to use the Event Handler</p></figcaption></figure>

## Notification tab and Advanced tab

In notification and advanced tabs, you can configure settings regarding notifications, timeout, periodic run, and more. Settings in **Notification** tab and **Advanced** vary based on trigger mode of your query.

| Tab              | Settings                                    | Inputs change or on page load | Manually invoked |
| ---------------- | ------------------------------------------- | :---------------------------: | :--------------: |
| **Notification** | Display a Success message after running     |               🚫              |         ✅        |
|                  | Display a Failure message after running     |               ✅               |         ✅        |
| **Advanced**     | Display a confirmation modal before running |         <p>🚫<br></p>         |         ✅        |
|                  | Set timeout for query running               |               ✅               |         ✅        |
|                  | Perform query periodically                  |               ✅               |        🚫        |
