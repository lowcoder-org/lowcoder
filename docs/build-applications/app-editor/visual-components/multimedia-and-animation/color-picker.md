# Color Picker

## 🎨 Color Picker Component in Lowcoder

The **Color Picker** component in Lowcoder empowers users to select and apply colors dynamically within applications. It is particularly useful in scenarios requiring user-defined color customisation, such as theming, design tools, or settings configurations.

<figure><img src="../../../../.gitbook/assets/frame_generic_light (15).png" alt=""><figcaption></figcaption></figure>

### 🔧 Key Features

* **Interactive Color Selection**: Provides a user-friendly interface for selecting colors.
* **Multiple Color Formats**: Supports various color formats, including HEX, RGB, and HSL.
* **Opacity Control**: Allows users to adjust the transparency of the selected color.
* **Real-Time Preview**: Displays immediate visual feedback of the selected color.
* **Customisable UI**: Offers styling options to match the application's design aesthetics.

### 🛠 Configuration Options

* **Default Color**: Set an initial color value upon component load.
* **Format Selection**: Choose the preferred color format for input and output.
* **Opacity Slider**: Enable or disable the opacity adjustment feature.
* **Styling**: Customize dimensions, colors, and other visual aspects to align with your application's theme.
* **Event Handlers**: Define actions to be executed upon color selection or change.

### ⚙️ Integration Tips

* **Data Binding**: Use Lowcoder's data binding syntax (`{{ }}`) to connect the selected color value to variables or data sources.
* **Event Handling**: Implement event handlers to perform actions when the color selection changes, such as updating a theme or triggering other components.
* **Combining with Other Components**: Integrate the Color Picker component with forms, settings panels, or other interactive elements to enhance user experience.

### Component Playground

On Component Playground, you can interact with the Color Picker component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Color Picker component.

{% embed url="https://app.lowcoder.cloud/playground/colorPicker/1" %}

### Component Auto-Docs

In the Auto-Docs of Color Picker component, we have shown how to use different properties of the Color Picker component. It also includes the Styling properties of the Color Picker component.

{% embed url="https://app.lowcoder.cloud/components/colorPicker" %}

#### Properties of the Color Picker component <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="175.97265625">Property Name</th><th width="114.05859375">Type</th><th>Description</th></tr></thead><tbody><tr><td>value</td><td>String</td><td>Returns the HEX code of the currently selected Color of the Color Picker component</td></tr><tr><td>disabled</td><td>Boolean</td><td>Returns True or False based on whether the Color Picker component is disabled or not</td></tr><tr><td>color</td><td>Object</td><td>Returns an Object containing all the details about the selected Color of the Color Picker component</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="166.04296875">Event Name</th><th width="458.8515625">Description</th></tr></thead><tbody><tr><td>Change</td><td>Triggers, when anything changes on the Color Picker component</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

**setValue() :**&#x20;

colorPicker1.setValue() method sets the Color Picker component's Value property, which gets shown in the Color Picker component.

```javascript
colorPicker1.setValue("#EE3456");
```

**clearValue() :**&#x20;

colorPicker1.clearValue() clears the Color Picker component's Value property and empties the value from the Color Picker component.

```javascript
colorPicker1.clearValue();
```

**resetValue() :**&#x20;

colorPicker1.resetValue()  method resets the Color Picker component's value property to the default value of the Color Picker component.

```javascript
colorPicker1.resetValue();
```

**setDefaultValue() :**&#x20;

colorPicker1.setDefaultValue() method sets the Color Picker component's Default value, which gets shown in the Color Picker component as default.

```javascript
colorPicker1.setDefaultValue("#EE3245");
```

**clearDefaultValue() :**&#x20;

colorPicker1.clearDefaultValue() clears the Color Picker component's Default value and empties the value from the Color Picker component.

```javascript
colorPicker1.clearDefaultValue();
```

**resetDefaultValue() :**&#x20;

colorPicker1.resetDefaultValue()  method resets the Color Picker component's Default value to the default value of the Color Picker component.

```javascript
colorPicker1.resetDefaultValue();
```

**setColor() :**&#x20;

colorPicker1.setColor() method sets the Color Picker component's Color property.

```javascript
colorPicker1.setColor({
    "hex": "#0B214D",
    "hsb": {
        "h": 220,
        "s": 0.8589743589743589,
        "a": 1,
        "b": 0.30000000000000004
    },
    "rgb": {
        "r": 11,
        "g": 33,
        "b": 77,
        "a": 1
    }
});
```

**clearColor() :**&#x20;

colorPicker1.clearColor() clears the Color Picker component's Color property.

```javascript
colorPicker1.clearColor();
```

**resetColor() :**&#x20;

colorPicker1.resetColor()  method resets the Color Picker component's Color property to the default value of the Color Picker component.

```javascript
colorPicker1.resetColor();
```

### 📌 Use Cases

* **Theme Customisation**: Allow users to personalize the application's color scheme.
* **Design Tools**: Enable color selection for elements within design or editing tools.
* **Settings Configuration**: Provide options for users to set colors for various application features.
* **Interactive Forms**: Collect user-defined color inputs within forms or surveys.
