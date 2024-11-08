# Supabase Assets API

The **Supabase Storage** (or Assets/Storage) feature provides a scalable, secure, and easy-to-use solution for managing and serving files such as images, videos, documents, and other types of media. This feature is built to handle file storage needs for modern web and mobile applications, offering direct integration with your backend database and user authentication systems.

### Prerequisites :&#x20;

* Get the Supabase Project parameteres from API settings from your Supabase Project.

### Connecting to Supabase Assets API :&#x20;

Follow the steps below :&#x20;

1. Create a new data source in two ways. Note that this permission is restricted to workspace admins and developers.
   1. Navigate to the **Data Sources** tab in Lowcoder and click **New data source**.
   2. When creating a new query in the app editor, click **+ New** > **+ New data source**.
2. Navigate to **Assets & Storage** section and click on **Supabase Assets** option.
3. Set its name and configure general settings, including your Supabase Project URL and API key.
4. Click **Save**, and it will be saved to your data source library.

### Demo :&#x20;

Let's show you how we can use the Supabase Storage feature to Upload and Retrieve data to/from Supabase.&#x20;

{% embed url="https://demos.lowcoder.cloud/demo/cm0p82k14000110hfpa1xr8da" %}

All of the above functionalities can be accessed using Supabase SDK as well.&#x20;

To create a bucket on Supabase Storage, use following code :&#x20;

```
const { data, error } = await supabase
  .storage
  .createBucket('avatars', {
    public: false,
    allowedMimeTypes: ['image/png'],
    fileSizeLimit: 1024
  })
```

To List all the buckets present on Supabase Storage, use following code :&#x20;

```
const { data, error } = await supabase
  .storage
  .getBucket('avatars')
```

To List all files in a specific Bucket, use following code :&#x20;

```
const { data, error } = await supabase
  .storage
  .from('avatars')
  .list('folder', {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  })
```

More details can be found here : [https://supabase.com/docs/reference/javascript/storage-createbucket](https://supabase.com/docs/reference/javascript/storage-createbucket)
