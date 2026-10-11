# Toggle Button

## 🔘 Toggle Button Component in Lowcoder

The **Toggle Button** component in Lowcoder provides an intuitive interface for users to switch between two states, such as "On" and "Off" or "Enabled" and "Disabled." This component is ideal for settings, preferences, and binary choices within applications.

<figure><img src="../../../../.gitbook/assets/frame_generic_light (2) (7).png" alt=""><figcaption></figcaption></figure>

### 🔧 Key Features

* **Binary Toggle**: Offers a simple interface for toggling between two states.
* **Customisable Labels**: Allows setting custom labels for both "On" and "Off" states to enhance clarity.
* **Dynamic Binding**: Supports binding to variables or data sources for real-time state management.
* **Event Handling**: Triggers actions based on state changes, facilitating interactive application behavior.
* **Styling Options**: Provides customization of appearance to align with application design.

### 🛠 Configuration Options

* **Default State**: Set the initial state of the toggle (On/Off) upon component load.
* **Disabled State**: Disable the toggle to prevent user interaction when necessary.
* **Labels**: Define custom text labels for both states to provide context.
* **Styling**: Customize dimensions, colors, and other visual aspects to match your application's theme.
* **Event Handlers**: Define actions to be executed upon state changes, such as updating data or triggering other components.

### ⚙️ Integration Tips

* **Data Binding**: Use Lowcoder's data binding syntax (`{{ }}`) to connect the toggle state to variables or data sources.
* **Event Handling**: Implement event handlers to perform actions when the toggle state changes, such as updating a database or triggering notifications.
* **Combining with Other Components**: Integrate the Toggle Button component with forms, settings panels, or other interactive elements to enhance user experience.

### Component Playground

On Component Playground, you can interact with the Toggle Button component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Toggle Button component.

{% embed url="https://app.lowcoder.cloud/playground/toggleButton/1" %}

### Component Auto-Docs

In the Auto-Docs of Toggle Button component, we have shown how to use different properties of the Toggle Button component. It also includes the Styling properties of the Toggle Button component.

{% embed url="https://app.lowcoder.cloud/components/toggleButton" %}

#### Properties of the Toggle Button component <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="175.97265625">Property Name</th><th width="114.05859375">Type</th><th>Description</th></tr></thead><tbody><tr><td>value</td><td>Boolean</td><td>Returns True or False based on whether the Toggle Button component is True or Not</td></tr><tr><td>disabled</td><td>Boolean</td><td>Returns True or False based on whether the Toggle Button component is disabled or not</td></tr><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Toggle Button component is hidden or not</td></tr><tr><td>loading</td><td>Boolean</td><td>Returns True or False based on whether the Toggle Button component is hidden or not</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="166.04296875">Event Name</th><th width="458.8515625">Description</th></tr></thead><tbody><tr><td>Change</td><td>Triggers, when anything Changes on the Toggle Button component</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilised. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

**setValue() :**&#x20;

toggleButton1.setValue() method sets the Toggle Button component's Value property, which gets shown in the Toggle Button component.

```javascript
toggleButton1.setValue(0);
```

**clearValue() :**&#x20;

toggleButton1.clearValue() clears the Toggle Button component's Value property and empties the value from the Toggle Button component.

```javascript
toggleButton1.clearValue();
```

**resetValue() :**&#x20;

toggleButton1.resetValue()  method resets the Toggle Button component's value property to the default value of the Toggle Button component.

```javascript
toggleButton1.resetValue();
```

### 📌 Use Cases

* **Feature Toggles**: Allow users to enable or disable specific features within the application.
* **Preference Settings**: Enable users to set preferences, such as dark mode or notifications.
* **Access Controls**: Manage user access to certain functionalities or sections of the application.
* **Form Inputs**: Collect binary responses in forms or surveys.
