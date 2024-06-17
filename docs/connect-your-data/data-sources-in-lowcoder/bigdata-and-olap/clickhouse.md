# ClickHouse

ClickHouse is an open-source column-oriented database management system designed for high-speed online analytical processing (OLAP) and data warehousing, capable of processing petabytes of data in real-time.

## Prerequisites

* Get ClickHouse database connection parameters from the database owner.
* Refer to IP allowlist to add IP addresses of Lowcoder to your allowlist (if needed).

## Connect to ClickHouse data source

Follow the steps below:

1. Create a new data source in two ways. Note that this permission is restricted to workspace admins and developers.
   * Navigate to the **Data Sources** tab on [Lowcoder Homepage](https://lowcoder.dev) and click **New data source**.
   * When creating a new query in the app editor, click **+ New** > **+ New data source**.
2. Select **Database** > **ClickHouse** as the data source type.
3. Set its name and configure general settings, including host, port, and database name. You can also set the user name and a password.
4. (Optional) Click **Test connection** to check whether the new data source is successfully connected.
5. Click **Save**, and it will be saved to your data source library.
