# Radio

## 🔘 Radio Component in Lowcoder

The **Radio** component in Lowcoder enables users to select a single option from a predefined set, ensuring exclusive selection within forms or interactive interfaces.

<figure><img src="../../../../.gitbook/assets/frame_generic_light (3) (7).png" alt=""><figcaption></figcaption></figure>

### 🔧 Key Features

* **Single Selection**: Ensures only one option can be selected at a time.
* **Customizable Options**: Define labels and values for each radio button to suit application needs.
* **Dynamic Binding**: Bind the selected value to data sources or variables for real-time updates.
* **Event Handling**: Trigger actions based on user selection, enhancing interactivity.
* **Styling Options**: Customize appearance to align with application design.

### 🛠 Configuration Options

* **Default Selection**: Set a default selected option upon component load.
* **Disabled State**: Disable specific options to prevent user interaction when necessary.
* **Orientation**: Arrange radio buttons vertically or horizontally based on layout requirements.
* **Styling**: Customize dimensions, colors, and other visual aspects to match your application's theme.
* **Event Handlers**: Define actions to be executed upon selection changes, such as updating data or triggering other components.

### ⚙️ Integration Tips

* **Data Binding**: Use Lowcoder's data binding syntax (`{{ }}`) to connect the selected value to variables or data sources.
* **Event Handling**: Implement event handlers to perform actions when the selection changes, such as updating a database or triggering notifications.
* **Combining with Other Components**: Integrate the Radio component with forms or other interactive elements to enhance user experience.

### Component Playground

On Component Playground, you can interact with the Radio component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Radio component.

{% embed url="https://app.lowcoder.cloud/playground/radio/1" %}

### Component Auto-Docs

In the Auto-Docs of Radio component, we have shown how to use different properties of the Radio component. It also includes the Styling properties of the Radio component.

{% embed url="https://app.lowcoder.cloud/components/radio" %}

#### Properties of the Radio component <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="175.97265625">Property Name</th><th width="114.05859375">Type</th><th>Description</th></tr></thead><tbody><tr><td>value</td><td>String</td><td>Returns a String containing the Current value of the option selected in the Radio component</td></tr><tr><td>disabled</td><td>Boolean</td><td>Returns True or False based on whether the Radio component is Disabled or not</td></tr><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Radio component is Hidden or not</td></tr><tr><td>invalid</td><td>Boolean</td><td>Returns True or False based on whether the Radio component is Invalid or not</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="166.04296875">Event Name</th><th width="458.8515625">Description</th></tr></thead><tbody><tr><td>Change</td><td>Triggers, when anything Changes on the Radio component</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

**setValue() :**&#x20;

radio1.setValue() method sets the Radio component's Value property, which gets shown in the Radio component.

```javascript
radio1.setValue(2);
```

**clearValue() :**&#x20;

radio1.clearValue() clears the Radio component's Value property and empties the value from the Radio component.

```javascript
radio1.clearValue();
```

**resetValue() :**&#x20;

radio1.resetValue()  method resets the Radio component's value property to the default value of the Radio component.

```javascript
radio1.resetValue();
```

### 📌 Use Cases

* **Preference Settings**: Allow users to select preferences, such as notification methods.
* **Form Inputs**: Collect single-choice responses in surveys or questionnaires.
* **Option Selection**: Enable users to choose one option from a list, such as payment methods.
* **Feature Toggles**: Allow users to enable or disable specific features within the application.
