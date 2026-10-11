# Switch

## 🔄 Switch Component in Lowcoder

The **Switch** component in Lowcoder provides a user-friendly toggle interface, enabling users to switch between two states, such as "on" and "off" or "enabled" and "disabled." This component is ideal for settings, preferences, and binary choices within applications.

<figure><img src="../../../../.gitbook/assets/frame_generic_light (1) (7).png" alt=""><figcaption></figcaption></figure>

### 🔧 Key Features

* **Binary Toggle**: Offers a simple interface for toggling between two states.
* **Customizable Labels**: Allows setting custom labels for both "on" and "off" states to enhance clarity.
* **Dynamic Binding**: Supports binding to variables or data sources for real-time state management.
* **Event Handling**: Triggers actions based on state changes, facilitating interactive application behavior.
* **Styling Options**: Provides customisation of appearance to align with application design.

### 🛠 Configuration Options

* **Default State**: Set the initial state of the switch (on/off) upon component load.
* **Disabled State**: Disable the switch to prevent user interaction when necessary.
* **Labels**: Define custom text labels for both states to provide context.
* **Styling**: Customize dimensions, colors, and other visual aspects to match your application's theme.
* **Event Handlers**: Define actions to be executed upon state changes, such as updating data or triggering other components.

### ⚙️ Integration Tips

* **Data Binding**: Use Lowcoder's data binding syntax (`{{ }}`) to connect the switch state to variables or data sources.
* **Event Handling**: Implement event handlers to perform actions when the switch state changes, such as updating a database or triggering notifications.
* **Combining with Other Components**: Integrate the Switch component with forms, settings panels, or other interactive elements to enhance user experience.

### Component Playground

On Component Playground, you can interact with the Switch component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Switch component.

{% embed url="https://app.lowcoder.cloud/playground/switch/1" %}

### Component Auto-Docs

In the Auto-Docs of Switch component, we have shown how to use different properties of the Switch component. It also includes the Styling properties of the Switch component.

{% embed url="https://app.lowcoder.cloud/components/switch" %}

#### Properties of the Switch component <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="175.97265625">Property Name</th><th width="114.05859375">Type</th><th>Description</th></tr></thead><tbody><tr><td>value</td><td>Boolean</td><td>Returns True or False based on whether the Switch component is On or not</td></tr><tr><td>disabled</td><td>Boolean</td><td>Returns True or False based on whether the Switch component is disabled or not</td></tr><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Switch component is hidden or not</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="166.04296875">Event Name</th><th width="458.8515625">Description</th></tr></thead><tbody><tr><td>Change</td><td>Triggers, when anything Changes on the Switch component</td></tr><tr><td>On</td><td>Tiggers, when Switch component is Turned On.</td></tr><tr><td>Off</td><td>Tiggers, when Switch component is Turned Off.</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

**setValue() :**&#x20;

switch1.setValue() method sets the Switch component's Value property, which gets shown in the Switch component.

```javascript
switch1.setValue(0);
```

**clearValue() :**&#x20;

switch1.clearValue() clears the Switch component's Value property and empties the value from the Switch component.

```javascript
switch1.clearValue();
```

**resetValue() :**&#x20;

switch1.resetValue()  method resets the Switch component's value property to the default value of the Switch component.

```javascript
switch1.resetValue(1);
```

**setDefaultValue() :**&#x20;

switch1.setDefaultValue() method sets the Switch component's Default value, which gets shown in the Switch component as default.

```javascript
switch1.setDefaultValue(1);
```

**clearDefaultValue() :**&#x20;

switch1.clearDefaultValue() clears the Switch component's Default value and empties the value from the Switch component.

```javascript
switch1.clearDefaultValue();
```

**resetDefaultValue() :**&#x20;

switch1.resetDefaultValue()  method resets the Switch component's Default value to the default value of the Switch component.

```javascript
switch1.resetDefaultValue();
```

### 📌 Use Cases

* **Feature Toggles**: Allow users to enable or disable specific features within the application.
* **Preference Settings**: Enable users to set preferences, such as dark mode or notifications.
* **Access Controls**: Manage user access to certain functionalities or sections of the application.
* **Form Inputs**: Collect binary responses in forms or surveys.
