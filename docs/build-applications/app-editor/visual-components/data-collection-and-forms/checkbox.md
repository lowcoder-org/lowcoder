# Checkbox

## ☑️ Checkbox Component in Lowcoder

The **Checkbox** component in Lowcoder enables users to select one or multiple options from a list, making it ideal for forms, settings, and preference selections.

<figure><img src="../../../../.gitbook/assets/frame_generic_light (29).png" alt=""><figcaption></figcaption></figure>

### 🔧 Key Features

* **Multiple Selections**: Allow users to select multiple options simultaneously.
* **Customizable Labels**: Define descriptive labels for each checkbox to enhance clarity.
* **Dynamic Binding**: Bind checkbox states to data sources or variables for real-time updates.
* **Event Handling**: Trigger actions based on user interactions, such as form submissions or data filtering.

### 🛠 Configuration Options

* **Default State**: Set checkboxes to be checked or unchecked by default.
* **Disabled State**: Disable checkboxes to prevent user interaction when necessary.
* **Styling**: Customize the appearance, including size, color, and spacing, to match your application's design.
* **Grouping**: Organize multiple checkboxes into groups for better structure and logic.

### ⚙️ Integration Tips

* **Data Binding**: Use Lowcoder's data binding syntax (`{{ }}`) to connect checkbox states to variables or data sources.
* **Event Handling**: Implement event handlers to perform actions when checkbox states change, such as updating a database or triggering other components.
* **Combining with Other Components**: Integrate checkboxes with forms or filters to enhance user interaction and data collection.

### Component Playground

On Component Playground, you can interact with the Checkbox component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Checkbox component.

{% embed url="https://app.lowcoder.cloud/playground/checkbox/1" %}

### Component Auto-Docs

In the Auto-Docs of Checkbox component, we have shown how to use different properties of the Checkbox component. It also includes the Styling properties of the Checkbox component.

{% embed url="https://app.lowcoder.cloud/components/checkbox" %}

#### Properties of the Checkbox component <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="175.97265625">Property Name</th><th width="114.05859375">Type</th><th>Description</th></tr></thead><tbody><tr><td>value</td><td>Array</td><td>Returns an Array containing the Current value of the options selected in the Checkbox component</td></tr><tr><td>disabled</td><td>Boolean</td><td>Returns True or False based on whether the Checkbox component is disabled or not</td></tr><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Checkbox component is hidden or not</td></tr><tr><td>invalid</td><td>Boolean</td><td>Returns True or False based on whether the Checkbox component is invalid or not</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="166.04296875">Event Name</th><th width="458.8515625">Description</th></tr></thead><tbody><tr><td>Change</td><td>Triggers, when anything Changes on the Checkbox component</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

**setValue() :**&#x20;

checkbox1.setValue() method sets the Checkbox component's Value property, which gets shown in the Checkbox component.

```javascript
checkbox1.setValue(['1']);
```

**clearValue() :**&#x20;

checkbox1.clearValue() clears the Checkbox component's Value property and empties the value from the Checkbox component.

```javascript
checkbox1.clearValue();
```

**resetValue() :**&#x20;

checkbox1.resetValue()  method resets the Checkbox component's value property to the default value of the Checkbox component.

```javascript
checkbox1.resetValue();
```

**setDefaultValue() :**&#x20;

checkbox1.setDefaultValue() method sets the Checkbox component's Default value, which gets shown in the Checkbox component as default.

```javascript
checkbox1.setDefaultValue(['1']);
```

**clearDefaultValue() :**&#x20;

checkbox1.clearDefaultValue() clears the Checkbox component's Default value and empties the value from the Checkbox component.

```javascript
checkbox1.clearDefaultValue();
```

**resetDefaultValue() :**&#x20;

checkbox1.resetDefaultValue()  method resets the Checkbox component's Default value to the default value of the Checkbox component.

```javascript
checkbox1.resetDefaultValue();
```

### 📌 Use Cases

* **Preference Settings**: Allow users to select their preferences or settings.
* **Form Inputs**: Collect multiple responses in surveys or questionnaires.
* **Data Filtering**: Enable users to filter data based on selected criteria.
* **Feature Toggles**: Allow users to enable or disable specific features or options.

***
