# File upload

<figure><img src="../../../.gitbook/assets/file.png" alt="" width="256"><figcaption><p>File Upload Component</p></figcaption></figure>

## Basics

The File upload helps you to able users to upload binary and text Files and process this data further in Lowcoder to send it to local or remote Storage and other Backends.

### File type

You can input an array of strings to restrict the types of the files to be uploaded. The default value of file type is empty, meaning that no limitation is pre-defined. Each string value in a specified file type array should be a [unique file type specifier](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#unique\_file\_type\_specifiers) in one of the following formats.

* A valid case-insensitive filename extension, starting with a period character ("."), such as `.png`, `.txt`, and `.pdf`.
* A valid string in [MIME format](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics\_of\_HTTP/MIME\_types) without an extension.
* String `audio/*` indicating "any audio file".
* String `video/*` indicating "any video file".
* String `image/*` indicating "any image file".

For example, when the value of file type is `[".pdf", ".mp4", "image/*"]`, you can upload PDF files, MP4 files, and any type of image files.



### Upload type

You can decide whether to upload a single file, multiple files, or a directory.

<figure><img src="../../../.gitbook/assets/App Editor  File Upload.png" alt=""><figcaption><p>Configure the File Upload to accept individual, multiple Files or whole Folders</p></figcaption></figure>

### Display uploaded files

Switch on or off **Show upload list** to display or hide the list of the uploaded files. You can also set this property via JS code. By default, its value is "true".

The upload list presents the file names of all uploaded files in chronological order. You can also access the name of the uploaded files via the property `files[index].name`. When hovering your mouse over a file, the 🗑️ icon appears and you can click it to delete the corresponding file.

### Parse files

Toggle **Parse files** and Lowcoder will try to parse the uploaded file data structure into objects, arrays, or strings. This does not work with binary data but with structured text data like Excel, JSON, and CSV files.

<figure><img src="../../../.gitbook/assets/App Editor  File Upload Parse.png" alt=""><figcaption><p>Lowcoder can try to parse the content of the files so you can directly access it.</p></figcaption></figure>

You can access the parsed result via the property `parsedValue`.&#x20;

For each uploaded file Lowcoder will try to parse and you can access the data of the files then in the array.

<pre><code>// access the structured content of an uploaded File in Lowcoder Apps
<strong>file1.parsedValue[0]
</strong><strong>// the array contains the data for each uploaded file.
</strong>file1.parsedValue[0], file1.parsedValue[1], file1.parsedValue[2]
</code></pre>

<figure><img src="../../../.gitbook/assets/App Editor  File Upload Display parsed File.png" alt=""><figcaption><p>You can access the contents of Excel, CSV and JSON Files as JSON Data object after upload and parse</p></figcaption></figure>

## Validation

Under the validation tab, you can configure how many files are allowed to be uploaded, as well as the minimum and maximum size of a single file to be uploaded.

<figure><img src="../../../.gitbook/assets/App Editor  File Upload validation.png" alt=""><figcaption><p>You can define the minimal and maximal size of files that can get uploaded</p></figcaption></figure>

### Max files

When the upload type is "Multiple" or "Directory", you can set **Max files** to limit the maximum number of files to upload. If the number of files to be uploaded exceeds this threshold, the latest uploaded files will replace the oldest ones.

<figure><img src="../../../.gitbook/assets/App Editor  File Upload Validation Multiple.png" alt=""><figcaption><p>If multiple files can get uploaded, you can define the maximal amount of files</p></figcaption></figure>

### File size

You can set the minimum and maximum size of the files to upload, using KB, MB, GB, or TB units. The default unit for file size is byte. When the size of the uploaded file exceeds the limit, you will see a global alert.

### Access uploaded files

Files uploaded via the file upload component are stored in browser cache memory in **base64-encoded** string format. To store these files in data sources, you need to build queries to connect to databases or APIs. You can view the properties of the uploaded files in the data browser in the left pane, or access property names in `{{}}` or JS queries via JS code. Commonly used properties are as follows.

* `value`: A list of the content of the uploaded files, encoded in base64.

```
// Access the File content (represented as base64)
{{file1.value[0]}} // will return "WwogIHsKICAgICJpZCI6ICJkODE5NGI3Mi1lZGNiLTRhMWMtYTRlMC1lZT...
```

* `files`: A list of metadata of the uploaded files, including `uid`, `name`, `type`, `size`, and `lastModified`.

```
// Access the File metadata information. 

{{file1.files[0].name}} // will return "open_issues.json"

{{file1.files[0].type}} // will return "application/json"

{{file1.files[0].type}} // will return "247285" (in bytes)
```

* `parsedValue`: A list of the value of the parsed files.

