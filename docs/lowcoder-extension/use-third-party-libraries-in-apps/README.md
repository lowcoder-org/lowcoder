# Use third-party libraries in Apps

Every developer learns one of the most important principles of software engineering early in their career: DRY (Don’t Repeat Yourself). Using third-party libraries can save you time as you do not need to develop the functionality that the library provides. Lowcoder provides some built-in third-party libraries for common uses, and you can manually import other libraries on demand.

## Built-in libraries

Lowcoder provides some JavaScript built-in libraries for use.

| Library   | What for                                                                                                              | Docs                                                                 | Version                    |
| --------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------- |
| lodash    | Powerful **utility** functions for _Arrays, Collections, JS Functions, JS Objects, Strings, Numbers, Math, Sequences_ | [https://lodash.com/docs/](https://lodash.com/docs/)                 | 4.17.21                    |
| uuid      | Create, parse and validate **UUIDs** of [version 1 to 5](https://www.uuidtools.com/uuid-versions-explained)           | [https://github.com/uuidjs/uuid](https://github.com/uuidjs/uuid)     | 9.0.0（Support v1/v3/v4/v5） |
| numbro    | Powerful **Number formatting** helper                                                                                 | [https://numbrojs.com/format.html](https://numbrojs.com/format.html) | 2.3.6                      |
| papaparse | Parser for CSV to JSON                                                                                                | [https://www.papaparse.com/docs](https://www.papaparse.com/docs)     | 5.3.2                      |

Built-in Libraries can be used directly everywhere where you can use JavaScript.

```
// loadash
return _.chunk(['a', 'b', 'c', 'd'], 2);
// => [['a', 'b'], ['c', 'd']]

// uuid
return uuid.v4();
// => 3965f3d4-8dd8-4785-9756-0ee98d91238d

// numbro
return numbro(1000).format({thousandSeparated: true});
// => 1,000

// Papaparse
return Papa.parse("name|age\nJohn Doe|30\nJane Doe|25", {delimiter: "|"})
// => {"data":[["name","age"],["John Doe","30"],["Jane Doe","25"]],"errors":[],"meta":{"delimiter":"|","linebreak":"\n","aborted":false,"truncated":false,"cursor":32}}
```

## Import third-party libraries

Lowcoder supports setting up preloaded JavaScript and libraries, which can either be imported for individual apps or the whole workspace.

{% hint style="danger" %}
Only libraries using the [UMD (Universal Module Definition)](https://github.com/umdjs/umd) approach are supported.&#x20;
{% endhint %}

{% hint style="success" %}
As soon as imported/bound to an App or workspace, Lowcoder manages the pre-loading of these libraries automatically in the editor and app view.
{% endhint %}

* **App-level** libraries get loaded only in the app where they were defined. This means a library imported to app A is not loaded for app B. The reverse is also true. A library imported for app B is not available to app A unless it is explicitly imported to app A as well.
* **Workspace-level** libraries will be loaded when you open any application in your workspace. All apps can access (and will load automatically) those libraries.

{% hint style="warning" %}
importing third-party libraries can impact app performance, especially when you have complex JavaScript functions. Decide carefully to import on the App-level or on Workspace-level
{% endhint %}

{% hint style="info" %}
**Tips you should know before setting up libraries:**

* External libraries are loaded and run in the browser.
* NodeJS-only libraries are not supported now.
* URLs of external libraries need to support cross-domain.
* The export of the library must be set directly on the window object, global variables like `var xxx = xxx` do not take effect.
*   The external libraries run in a restricted sandbox environment and the following global variables are not available:

    <mark style="background-color:yellow;">`parent`</mark>

    <mark style="background-color:yellow;">`document`</mark>

    <mark style="background-color:yellow;">`location`</mark>

    <mark style="background-color:yellow;">`chrome`</mark>

    <mark style="background-color:yellow;">`setTimeout`</mark>

    <mark style="background-color:yellow;">`fetch`</mark>

    <mark style="background-color:yellow;">`setInterval`</mark>

    <mark style="background-color:yellow;">`clearInterval`</mark>

    <mark style="background-color:yellow;">`setImmediate`</mark>

    <mark style="background-color:yellow;">`XMLHttpRequest`</mark>

    <mark style="background-color:yellow;">`importScripts`</mark>

    <mark style="background-color:yellow;">`Navigator`</mark>

    <mark style="background-color:yellow;">`MutationObserver`</mark>
{% endhint %}

Now let's take **cowsay** as an example and import it at the app level and the workspace level.

* GitHub page: [https://github.com/piuccio/cowsay](https://github.com/piuccio/cowsay)
* Unpkg link: [https://unpkg.com/cowsay@1.5.0/build/cowsay.umd.js](https://unpkg.com/cowsay@1.5.0/build/cowsay.umd.js)
  * JSDeliver link: [https://cdn.jsdelivr.net/npm/cowsay@1.6.0/build/cowsay.umd.min.js](https://cdn.jsdelivr.net/npm/cowsay@1.6.0/build/cowsay.umd.min.js)

{% hint style="info" %}
You can check popular CDNs if they host your desired library as a minified package.\


[https://jsdelivr.com](https://www.jsdelivr.com/)

[https://cdnjs.com](https://cdnjs.com/)

[https://unpkg.com](https://unpkg.com/)
{% endhint %}

### Import / bind at the app level

Navigate to the settings page and then click the plus sign **+** under the **JavaScript library** tab. Paste the **library** link and click **Add New**.  Lowcoder will now check, if the external library will be compatible and securely usable.

You can also click the download icon to quickly download any recommended JS library.

<figure><img src="../../.gitbook/assets/App Editor  External Libraries.png" alt=""><figcaption><p>Bind an external JS Library to an individual App</p></figcaption></figure>

Now, you can create a JS query and insert code.

<figure><img src="../../.gitbook/assets/App Edtor  External Library usage.png" alt=""><figcaption><p>You can start using the external Library</p></figcaption></figure>

```

return window.cowsay.say({
    text : "Lowcoder is cool", e : "oO", T : "U "
})
```

Note that the cowsay library is imported in our example at app-level and you can not use it in any other app within your workspace.

You should see something similar to the image below after successfully importing the cowsay library. Note that you see what global variable you can use to access the library.

![](<../../.gitbook/assets/CleanShot 2023-07-31 at 20.46.26.png>)

{% hint style="danger" %}
Imported external libraries are bound to the window object. \
\
cowsay.say(...) will not work\
\
window.cowsay.say(...) - does the job.
{% endhint %}

### Import/bind at the workspace level

Go to [Lowcoder's homepage](https://www.lowcoder.cloud/), select **Settings** > **Advanced**, and click **Add** under the **JavaScript library** tab. Paste the link of the third-party JS library and click **Add New** to add it to your workspace. You can also click the download icon to add any recommended JS library quickly. The installed libraries are accessible from any app within your workspace.

<figure><img src="../../.gitbook/assets/Admin  external Libraries.png" alt=""><figcaption><p>Bind an external JS Library to all Apps of a Workspace</p></figcaption></figure>
