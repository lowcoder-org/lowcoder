# Modules

One of the most **powerful concepts of Lowcoder** is **Modules**. Lowcoder Modules are Applications, that can get **included and repeated** in other Applications. You can insert a module into an app or other modules (referred to as _external apps_ in the rest of this document) and it **functions just like a single component**. Also, Modules can get [**integrated/embedded natively in other Web Applications**](../../publish-apps/embedd-an-app/)**!**

When building an app, you want to reuse a bundle of components and queries across different apps. Imagine a User-Profile Card. Profile-Image, Name, Contacts. If you create these Elements inside of a Module, you can integrate this in all other Apps as it would be a single component.

## Module basics

### Create a new module

Select **New > Module** at the top right of the Admin Page to enter the module editor.

<figure><img src="../../.gitbook/assets/Admin  Modules.png" alt=""><figcaption><p>Create a new Module like a normal App</p></figcaption></figure>

### Editing of Layout, Components, and Data Queries

There are no differences in editing a Module or App other than the Module Settings. Placement of Components and Dataqueries behaves the same as in the App Editor. You can insert components and create queries the same way as your normal App-building process.&#x20;

In the Module Editor, you can resize a module by dragging the bottom-right corner to the desirable default size. Be aware, that the screen in the editor does not show the real horizontal size of the module, as this size is defined at the App, where the Module is placed.

{% hint style="info" %}
Any changes you made at Modules are only available and active for Apps that use the Module after the new publishing of the Module!
{% endhint %}



<figure><img src="../../.gitbook/assets/App Editor  Edit Module.png" alt=""><figcaption><p>Modules get created and edited as normal Apps.</p></figcaption></figure>

Toggle the button in the **Properties** panel to control whether the **component height scales with the container**. This only works for the fixed-height components within the module.

### Insert module to apps or other modules

When editing an App or Module, select **Insert > Extensions > Modules** to display the modules that you have access to.

<figure><img src="../../.gitbook/assets/App Editor  Place Module.png" alt=""><figcaption><p>You can select available modules in the Extension Panel</p></figcaption></figure>

Then drag and drop the module onto the canvas, set input parameters, and change styles inside the module's **Properties** panel.

<figure><img src="../../.gitbook/assets/App Editor  Place and use Module.png" alt=""><figcaption><p>Modules are placed liko other Components too</p></figcaption></figure>

The horizontal size is free to choose from. However, the Module inside considers the bounding box size as 100% of its horizontal size.

<figure><img src="../../.gitbook/assets/App Editor  Module Width.png" alt=""><figcaption><p>The Module Width scales by the placement in the App</p></figcaption></figure>

### Module settings

As modules can get embedded, they need to be able to interact with outside apps or websites. There are four elements to support communication with a Module.

* **Inputs**: dynamic parameters passed into the current module from external apps.
* **Outputs**: set data exposed to external apps.
* **Methods**: methods exposed to external apps. For example, you can define a module with a `resetTitle` method, so that external apps can call it to reset the module's title.
* **Events**: module events can be handled by external apps. For example, you can define an event named `dataChanged`, so that external apps can add event handlers to it once the `dataChanged` event is fired by the module.

<figure><img src="../../.gitbook/assets/App Editor  Module Settings.png" alt=""><figcaption><p>Modules have Settings &#x26; possibility to test these - to communicate with the outside App or Website.</p></figcaption></figure>

## Module settings

### Input

Module inputs are parameters passed to the module from external Apps. The supported input types are **data**, **string**, **number**, **array**, **boolean**, and **query**. The first five are data types. Choose **data** to not restrict it to a specific data type. When choosing the type of **query**, you can pass in a query from external apps and trigger it inside the module. Then you can reference a module input parameter by its **name**.

#### Add a new Input

In the **Settings** tab (green), click **+** **Add** to create a new **input**. Click the input to rename it and select a data type.&#x20;

#### Input Test

To quickly test the effectiveness of Input parameters during editing a Module, you can use the **Input Test** function. In the **Module Editor**, select the whole Module to conduct tests with simulated input data in the **Properties** panel of the Module (blue).

<figure><img src="../../.gitbook/assets/App Editor  Module Test Data.png" alt=""><figcaption><p>Modules can receive dynamically input data</p></figcaption></figure>

{% hint style="info" %}
Make sure, that you remove any test data when you publish the Module.
{% endhint %}

### Output

Module outputs are the data exposed to an app or other modules. You can inspect the outputs of a module in the data browser and access them via JavaScript code in `{{ }}`. Then you can check out and reference the outputs of a module in apps or other modules using it.

{% hint style="info" %}
We suggest to chose output data names carefully.&#x20;

* Make sure they express the module origin
* Make sure they express the inner source (from data, from action etc.)
{% endhint %}

### Method

Methods are used to call functions / action in a Module from outside - your App or Webpage where you embed a Module.&#x20;

#### Add a new Method

In the **Settings** tab, click **+** **Add** to create a new Module Method. Click the Method to rename it and select an action.&#x20;

<figure><img src="../../.gitbook/assets/App Editor  Module Methods.png" alt=""><figcaption><p>From an App, one can call Methods of a embedded Module.</p></figcaption></figure>

{% hint style="warning" %}
When creating a Method for a Module, you cannot create input parameters for the Method and can only reference parameters within the scope of the current Module.
{% endhint %}

#### Call a Method

When using modules, you can call a module method in two ways:

* In event handlers, select **Action** > **Control component**, and then select the **component** and **method**.
* Use dot notation in JavaScript queries. For example, `module1.clearAll()` calls the method `clearAll()` of `module1`.

<figure><img src="../../.gitbook/assets/App Editor  Use Module Method.png" alt=""><figcaption><p>In the App, Methods of an embedded Module are accessible like for other Components.</p></figcaption></figure>

#### Method Test

You can simulate testing method calling in the **Method Test** function.

### Event

Events are used to transfer signals from a module to external apps, such as defining `orderPlaced` `OrderModified` events for an order management module. You can add and fire events within a module, and deal with them using [Event Handlers](modules.md#event-handlers) externally.

#### Add a new event

In the **Settings** tab, click **+** **Add** to create a new module event. Click the event to set its name.

#### Trigger an event

In the following example, the event `contentChange` is triggered when the content in any input box changes. You can trigger it in two ways:

* In **Event handlers** of both input components, click **+ Add**, select **Change** as the component event and **Trigger module event** as the action, and finally select the module event `contentChange`.
* Use dot notation in JavaScript queries: `contentChange.trigger()`.

#### Event handlers

When an app uses a module, you can configure how the current app reacts to the module's events. For example, in **Event handlers** of `module1`, click **+ Add**, and select the module event `contentChange`and the action **Show notification**.

#### Event Test

The following example conducts event tests in the **Event Test** section.

## Permissions

End users are automatically granted permission to view modules in apps or other modules they have viewing permissions with. If you are an editor and wish to use a module in external apps, you should at least have the viewer's role of that module.&#x20;

## Releases and versions

Lowcoder stores the historical versions of your modules for your reference. Click **Preview > Publish** at the top right. The release management of a module is identical to that of an app. For detailed information, see [version history](version-and-release-management.md).

{% hint style="info" %}
For an unpublished module, the apps and modules use its latest version; while for a published one, you need to publish it again to sync your latest changes.
{% endhint %}
