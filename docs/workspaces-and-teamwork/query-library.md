# Query library

The **Query Library** lets you store, reuse and share Data Queries for all Data Sources in a workspace. You can create and run queries in the Query Library, and call them from any Lowcoder app. This helps you to organize and pre-define important queries for colleagues that work with you on Apps for example.

The main function of the Query Library is to create and manage reusable Queries with Versioning.

## 1) Create a new query

1. Click **+ New** and select a data source. You can rename the query on demand.

<figure><img src="../.gitbook/assets/Admin  Query Collection.png" alt=""><figcaption><p>Overview of Data Queries and Action Buttons to create new Data Queries</p></figcaption></figure>

Write code and click ▶ **Run** to get results. The results will display in the bottom pane of the window.

<figure><img src="../.gitbook/assets/Query Library  New Query.png" alt=""><figcaption><p>You can create Data Queries for example as SQL Script for Databases</p></figcaption></figure>

If available based on the Datasource, helping Metadata will get displayed on the right side to create Queries faster.

### Input parameters

There are cases where you want to pass dynamic parameters to a query. Lowcoder supports that by introducing input configuration of a query.

Click **Add** in the **Inputs** tab in the right upper pane to add input parameters.&#x20;

With the template notation `{{}}`, you can use the dynamic Input parameters in the Query. To test the Input Parameter, you can set test values that are directly used in the Query.

<figure><img src="../.gitbook/assets/Query Library  Input Parameter.png" alt=""><figcaption><p>Using Input Parameters for dynamic Queries.</p></figcaption></figure>

{% hint style="warning" %}
You can only reference variables instead of writing JavaScript code in `{{}}`.
{% endhint %}

To edit the name and description of the input variables, click `...` and select **Edit** or directly click the title of the variable.

## 2) Publish Queries

When you finish writing a version of the query, you can publish it. Click `···` > **Publish**.&#x20;

<figure><img src="../.gitbook/assets/Query Library  Publish Query.png" alt=""><figcaption><p>Queries need to get published to be usable in Apps</p></figcaption></figure>

### History versions of Queries

To view and restore the history versions of a Query, go to `···` > **History version**.

You can restore your current draft to a history version by selecting the target version from the history version list and clicking **Restore this version**. Click **Exit** to return to edit mode.

### Version management of Data Queries

Queries may be updated on demand. You can make an adjustment to a query to a newer version and at the same time maintain the older version. Such version management is achievable in the query library. Click `···` in the top right corner to publish different versions of queries, and you can view and restore history versions.

The Query Library automatically suggests an Up-Versioning Format to choose from, (Minor to Major Version Change) so you can use [semantic versioning](https://semver.org/) (also known as SemVer) to name your version.

<figure><img src="../.gitbook/assets/Query Library  Version Query.png" alt=""><figcaption><p>Semantiv Versioning to Data Queries</p></figcaption></figure>

## 3) Using Data Queries from Query Library

In an app or module, Click **+ New** in the **Query editor** in the bottom pane, then select **Import from Query Library**.

Select a query from the library from the dropdown list, choose your desired version and pass in the corresponding input parameters.

<figure><img src="../.gitbook/assets/App Editor  Data Query from Library.png" alt=""><figcaption></figcaption></figure>

## 4) Export and Import of Queries

### Export of Data Queries

You can export a Query as a JSON Definition file. This helps to use a Query across different Lowcocer installations for example, or simply as a Backup.

{% hint style="info" %}
Be aware, that the connected Datasource of a Query may have different security credentials at different installation locations.
{% endhint %}

<figure><img src="../.gitbook/assets/Query Library  Export Query.png" alt=""><figcaption><p>With "Export to JSON" you can backup a query or store it externally to use it in other Lowcoder Installations.</p></figcaption></figure>

### Import Queries

Based on the JSON Definition file, you can import Queries into Lowcoder. On the Query Library Overview Screen, you can use the Button "Import from File"

<figure><img src="../.gitbook/assets/Query Library  Import Query.png" alt=""><figcaption><p>Import Data Queries from a JSON Definition File.</p></figcaption></figure>

## Permissions

Workspace **Admin** and members of **Developers** group have access to the **Query Library** and have read and write permissions to all queries in the library.
