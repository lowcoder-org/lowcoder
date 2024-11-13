# S3 File Storage

With the S3 Datasource Plugin, you can connect to your Amazon S3 Storage to upload and manage Files.

### Prepare Amazon S3 Buckets

<figure><img src="../../../.gitbook/assets/Amazon S3 Buckets.png" alt=""><figcaption><p>Create at least one Bucket in a Region.</p></figcaption></figure>

Next to Buckets, you need to create a User to configure Access Keys

<figure><img src="../../../.gitbook/assets/Amazon S3 User.png" alt=""><figcaption><p>Create a Amazon AWS User, give with a Policy the desired Access for your Buckets</p></figcaption></figure>

Now you can create the Access Keys

<figure><img src="../../../.gitbook/assets/Amazon S3 Access Key.png" alt=""><figcaption><p>The Access Keys are needed to connect to your S3 Buckets</p></figcaption></figure>

### Create a Datasource to Connect to your Bucket

To use Amazon S3, you need to connect to your Buckets.

<figure><img src="../../../.gitbook/assets/Data Plugin  S3 Buckets.png" alt=""><figcaption><p>You need to have at least one Bucket as also your Access Key for S3</p></figcaption></figure>

The URL contains the Amazon AWS Region, in which you created the Buckets. This does not affect replica regions.

```
https://s3.<your_aws_region>.amazonaws.com
```

### Upload Files

With the help of the file upload component, you can now gather the data that you want to upload as Fle to your Bucket. There are two possible file types in general.

* Text based Files like JSON or CSV
* Binary Files

{% hint style="info" %}
Binary files are represented in the Browser as base64 encoding. However, after the transport to the S3 Bucket, they will be available as binary files.
{% endhint %}

From the possible actions of the S3 Datasource Plugin you can choose "Upload file" and fill in the settings.&#x20;

<figure><img src="../../../.gitbook/assets/Data Plugin  S3 File Upload.png" alt=""><figcaption></figcaption></figure>

### List Buckets and Files

Choose "List Buckets" to get a JSON List of your S3 Buckets.

<figure><img src="../../../.gitbook/assets/Data Plugin  S3 Get Buckets.png" alt=""><figcaption><p>You can get all your S3 Buckets as Data List.</p></figcaption></figure>

```json
// Response of "List buckets"
[
  {
    "name": "lowcoder-documentation-bucket"
  }
]
```

With the name of the Bucket you can now request a list of all Files.

<figure><img src="../../../.gitbook/assets/Data Plugin  S3 Get Files.png" alt=""><figcaption><p>Get a List of all Files in your Bucket as JSON</p></figcaption></figure>

```
// Response of "List files"
[
  {
    "name": "open_issues.json",
    "size": 247285,
    "lastModified": "2023-06-24T18:28:51.000Z",
    "signedUrl": "",
    "url": "https://s3.eu-central-1.amazonaws.com/lowcoder-documentation-bucket/open_issues.json"
  },
  {
    "name": "test.json",
    "size": 236646,
    "lastModified": "2023-06-24T18:17:13.000Z",
    "signedUrl": "",
    "url": "https://s3.eu-central-1.amazonaws.com/lowcoder-documentation-bucket/test.json"
  }
]
```

### Read / use Files

Based on Bucket & File name you can now request the Data of Files.

<figure><img src="../../../.gitbook/assets/Data Plugin  S3 Get File.png" alt=""><figcaption><p>Get the file as JSON / Text or base64 encoded.</p></figcaption></figure>

An alternative way to access the File is via the secure Link (Signed URL). To get the "signed Link URLs" for your files, just use the "List files" method including the "Return signed url" checkbox.

<figure><img src="../../../.gitbook/assets/Data Plugin  S3 Get Files with Signed Link.png" alt=""><figcaption><p>Get direct accessible Links of your files</p></figcaption></figure>

You can now use the URL of each file and for example, display it in the File viewer or with the [Image Component](../../../build-applications/app-editor/visual-components/image.md).

### Delete Files

You can use the Method "Delete file" to ... delete a single file from your Bucket.

<figure><img src="../../../.gitbook/assets/Data Plugin  S3 File Delete.png" alt=""><figcaption><p>You can delete single files from your Bucket</p></figcaption></figure>
