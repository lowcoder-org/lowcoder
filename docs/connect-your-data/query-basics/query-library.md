# Query library

**Query Library** lets you store, reuse and share data queries for data sourced across your workspace. Create and run queries in query library, and call them from any Lowcoder app.

## Features

The main function of the query \*\*\*\* library is to create and manage reusable queries:

* Writing queries based on data sources, with the ability to define **Inputs** variables.\\
* Importing and triggering queries from query library in apps and modules.\\
* Referencing different versions of queries.\\

## Create a new query

1. Click **+ New** and select a data source.
2. Rename the query on demand.
3. Write code and click ▶ **Run** to get results. The results will display in the bottom pane of the window.

### Input parameters

There are cases where you want to pass dynamic parameters to a query. Lowcoder supports that by introducing input configuration of a query.

Click **Add** in the **Inputs** tab in the right pane to add input parameters. Reference them using `{{}}` in the query, then you can input test values to test execution of the query.

{% hint style="warning" %}
You can only reference variables instead of writing JavaScript code in `{{}}`.
{% endhint %}

To edit the name and description of the input variables, click `...` and select **Edit** or directly click the title of the variable.

## Version management

Queries may be updated on demand. You can make an adjustment to a query to a newer version and at the same time maintain the older version. Such version management is achievable in query library. Click `···` in the top right corner to publish different versions of queries, and you can view and restore history versions.

### Publish

When you finish writing a version of the query, you can publish it. Click `···` > **Publish**. Use [semantic versioning](https://semver.org/) (also known as SemVer) to name your version.

### History version

To view and restore the history versions, go to `···` > **History version**.

You can restore your current draft to a history version by selecting the target version from the history version list and clicking **Restore this version**. Click **Exit** to return to edit mode.

## Import a query

1. In an app or module, Click **+ New** in the **Query editor** in the bottom pane, then select **Import from Query Library**.
2. Select a query from the library from the dropdown list, choose your desired version and pass in corresponding input parameters.

For other settings, see .

## Permissions

Workspace **Admin** and members of **Developers** group have access to the **Query Library** and have read and write permissions to all queries in the library.
