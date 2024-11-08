# Supabase PostgreSQL

Every Supabase project is a dedicated PostgreSQL database, trusted by millions of developers. PostgreSQL is a powerful open-source relational database management system (RDBMS), renowned for stability, scalability, and robustness. It is an ideal choice for applications that require data consistency and reliability.

### Prerequisites <a href="#prerequisites" id="prerequisites"></a>

* Get PostgreSQL database connection parameters from the database owner.
* Refer to IP allowlist to add IP addresses of Lowcoder to your allowlist (if needed).

### Connect to PostgreSQL data source <a href="#connect-to-postgresql-data-source" id="connect-to-postgresql-data-source"></a>

Follow the steps below:

1. Create a new data source in two ways. Note that this permission is restricted to workspace admins and developers.
   * Navigate to the **Data Sources** tab in Lowcoder and click **New data source**.
   * When creating a new query in the app editor, click **+ New** > **+ New data source**.
2. Select **Database** > **PostgreSQL** as the data source type.
3. Set its name and configure general settings, including host, port, and database name. You can also set the user name and a password.
4. (Optional) Click **Test connection** to check whether the new data source is successfully connected.
5. Click **Save**, and it will be saved to your data source library.

### Demo :&#x20;

{% embed url="https://demos.lowcoder.cloud/demo/clzmno7d50b0prfaixv9i8nxc" %}

All of the above functionalities can be accessed using Supabase SDK as well.&#x20;

To fetch data from DB, we can use the Select method on Supabase object.&#x20;

```
const { data, error } = await supabase
  .from('countries')
  .select()
```

To insert data into a Table, use following code.&#x20;

```
const { error } = await supabase
  .from('countries')
  .insert({ id: 1, name: 'Denmark' })
```

More details can be found here : [https://supabase.com/docs/reference/javascript/select](https://supabase.com/docs/reference/javascript/select)
