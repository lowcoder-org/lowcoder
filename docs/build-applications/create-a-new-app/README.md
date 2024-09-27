# Create a new App

## App or Module?

A [Module](modules.md) is a special type of App, which can be **re-used** inside of other Modules or Apps and especially it is possible to [embed](../../publish-apps/embedd-an-app/) the Module directly in your native Web-Application outside of Lowcoder.&#x20;

The Editor for Apps and Modules is the same, only Modules have some extra settings and parameters regarding the embedding.

If you would like to [embed](../../publish-apps/embedd-an-app/) or re-use your Application, choose "Module". If you want only to build a fullscreen Application and eventually hang it in a Navigation, use "App".

{% hint style="info" %}
Be aware that nested Modules "in each other" can cause a slowdown of the Application. It is always a consideration of listed elements in terms of the re-usability of child components or faster Application behavior. When creating Modules, testing regarding the speed of the overall Application and consumption of resources is necessary.
{% endhint %}

## Create a new Application or Module

Click **New > App** (or **Module**) on the upper right of Lowcoder Admin Page. The App or Module will get created and the view switches automatically to the App Editor.

Only workspace **admins** and members of **Developers** group can create apps.

<figure><img src="../../.gitbook/assets/Admin  Apps.png" alt=""><figcaption><p>Creat Applications with the upper right button.</p></figcaption></figure>



You can rename the App at the left-top of the App editor.

<figure><img src="../../.gitbook/assets/App Editor  Rename App.png" alt="" width="563"><figcaption><p>Renaming an App with the top left Menu</p></figcaption></figure>

## Export and import an app

### Export an app

Apps can get exported to a JSON Definition file at multiple places. For example, click your app name and select **Export to JSON**, the app will be exported to a JSON file.

<figure><img src="../../.gitbook/assets/App Editor  Export App (1).png" alt="" width="563"><figcaption></figcaption></figure>

### Import an app

You can import an existing app in a JSON format by clicking **New > Import**.

<figure><img src="../../.gitbook/assets/App Editor  Import App (1).png" alt="" width="563"><figcaption></figcaption></figure>
