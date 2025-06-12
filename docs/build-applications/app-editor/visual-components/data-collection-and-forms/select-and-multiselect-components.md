# Select & MultiSelect components

## 🔽 Select & Multi-Select Components in Lowcoder

Lowcoder offers versatile selection components—**Select** and **Multi-Select**—to enhance user input capabilities in your applications. These components allow users to choose single or multiple options from a list, with support for both static and dynamic data sources.

### 🎯 Select Component

The **Select** component enables users to choose a single option from a dropdown list. It's ideal for scenarios where only one selection is permitted.

<figure><img src="../../../../.gitbook/assets/frame_generic_light (2).png" alt=""><figcaption></figcaption></figure>

#### 🔧 Key Features

* **Single Selection**: Allows selection of one option from the list.
* **Manual and Dynamic Data Entry**: Supports both manually entered options and dynamic data binding from APIs or databases.
* **Customisable Display**: Configure labels, values, and placeholder text to match application requirements.
* **Event Handling**: Trigger actions based on user interactions, such as selection changes.

#### 🛠 Configuration Options

* **Manual Mode**: Manually define options with specific labels and values.
* **Mapped Mode**: Bind options dynamically from data sources like APIs or databases.
* **Default Value**: Set an initial selected value for the dropdown.
* **Disabled State**: Disable the dropdown to prevent user interaction when necessary.
* **Hidden State**: Hide the dropdown from view without removing it from the layout.

### Component Playground

On Component Playground, you can interact with the Dropdown component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Dropdown component.

{% embed url="https://app.lowcoder.cloud/playground/select/1" %}

### Component Auto-Docs

In the Auto-Docs of Dropdown component, we have shown how to use different properties of the Dropdown component. It also includes the Styling properties of the Dropdown component.

{% embed url="https://app.lowcoder.cloud/components/select" %}

### 🧩 Multi-Select Component

The **Multi-Select** component allows users to select multiple options from a list, suitable for scenarios requiring multiple selections.

<figure><img src="../../../../.gitbook/assets/frame_generic_light (4).png" alt=""><figcaption></figcaption></figure>

#### 🔧 Key Features

* **Multiple Selection**: Users can select multiple options simultaneously.
* **Manual and Dynamic Data Entry**: Supports both manually entered options and dynamic data binding from APIs or databases.
* **Customizable Display**: Configure labels, values, and placeholder text to match application requirements.
* **Event Handling**: Trigger actions based on user interactions, such as selection changes.

#### 🛠 Configuration Options

* **Manual Mode**: Manually define options with specific labels and values.
* **Mapped Mode**: Bind options dynamically from data sources like APIs or databases.
* **Default Values**: Set initial selected values for the dropdown.
* **Disabled State**: Disable the dropdown to prevent user interaction when necessary.
* **Hidden State**: Hide the dropdown from view without removing it from the layout.

### ⚙️ Integration Tips

*   **Data Binding**: Use `{{ }}` syntax to bind the selected value(s) to other components or queries. For example:

    ```javascript
    {{ select1.value }}
    {{ multiSelect1.value }}
    ```
* **Event Handling**: Implement event handlers to respond to selection changes and trigger corresponding actions.

### Component Playground

On Component Playground, you can interact with the Dropdown component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Dropdown component.

{% embed url="https://app.lowcoder.cloud/playground/multiSelect/1" %}

### Component Auto-Docs

In the Auto-Docs of Dropdown component, we have shown how to use different properties of the Dropdown component. It also includes the Styling properties of the Dropdown component.

{% embed url="https://app.lowcoder.cloud/components/multiSelect" %}

#### Properties of the Select & Multi-Select components <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="175.97265625">Property Name</th><th width="114.05859375">Type</th><th>Description</th></tr></thead><tbody><tr><td>value</td><td>String</td><td>Returns the current selected value of the Select/Multi-Select component</td></tr><tr><td>disabled</td><td>Boolean</td><td>Returns True or False based on whether the Select/Multi-Select component is disabled or not</td></tr><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Select/Multi-Select component is hidden or not</td></tr><tr><td>invalid</td><td>Boolean</td><td>Returns True or False based on whether the Select/Multi-Select component is valid or not</td></tr><tr><td>inputValue</td><td>String</td><td>Returns the Input value entered by User while searching for the options in Select/Multi-Select component</td></tr><tr><td>selectedIndex</td><td>Number</td><td>Returns the Index of the selected option in the Select component</td></tr><tr><td>selectedLabel</td><td>String</td><td>Returns the Label of the selected option in the Select component</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="166.04296875">Event Name</th><th width="458.8515625">Description</th></tr></thead><tbody><tr><td>Change</td><td>When a User "changes" anything on the component.</td></tr><tr><td>Focus</td><td>When a User "clicks" on the input field of the Component</td></tr><tr><td>Blur</td><td>When a User "clicks" outside of the input field of the Component i.e, defocuses the component.</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

**setValue() :**&#x20;

select1.setValue() method sets the Select component's Value property, which gets shown in the Select component.

```javascript
select1.setValue(1);
```

**clearValue() :**&#x20;

select1.clearValue() clears the Select component's Value property and empties the value from the Select component.

```javascript
select1.clearValue();
```

**resetValue() :**&#x20;

select1.resetValue()  method resets the Select component's value property to the default value of the Select component.

```javascript
select1.resetValue();
```

**setDefaultValue() :**&#x20;

select1.setDefaultValue() method sets the Select component's Default value, which gets shown in the Select component as default.

```javascript
select1.setDefaultValue(1);
```

**clearDefaultValue() :**&#x20;

select1.clearDefaultValue() clears the Select component's Default value and empties the value from the Select component.

```javascript
select1.clearDefaultValue();
```

**resetDefaultValue() :**&#x20;

select1.resetDefaultValue()  method resets the Select component's Default value to the default value of the Select component.

```javascript
select1.resetDefaultValue();
```

### 📌 Use Cases

* **Form Inputs**: Collect user selections in forms, such as choosing a country or category.
* **Filtering Data**: Allow users to filter displayed data based on selected criteria.
* **Tagging Systems**: Enable users to tag items with multiple labels or categories.

***
