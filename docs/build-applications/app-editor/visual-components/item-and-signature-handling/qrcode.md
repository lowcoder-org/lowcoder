# QRCode

## 🔳 QR Code Component in Lowcoder

The **QR Code** component in Lowcoder enables developers to dynamically generate QR codes within applications, facilitating seamless information sharing and user interactions.

<figure><img src="../../../../.gitbook/assets/frame_generic_light (6) (4).png" alt=""><figcaption></figcaption></figure>

### 🔧 Key Features

* **Dynamic Content Encoding**: Generate QR codes based on dynamic data inputs, such as URLs, text, or other information.
* **Customisable Appearance**: Adjust size, color, and styling to align with your application's design aesthetics.
* **Real-Time Updates**: QR codes update automatically in response to changes in bound data sources.
* **Event Handling**: Implement actions triggered by user interactions with the QR code component.

### 🛠 Configuration Options

* **Data Binding**: Use Lowcoder's data binding syntax (`{{ }}`) to dynamically set the content encoded in the QR code.
* **Styling**: Customize dimensions, colors, and other visual aspects to match your application's theme.
* **Event Handlers**: Define actions to be executed upon specific events, such as clicks or data changes.

### ⚙️ Integration Tips

* **Dynamic Data Integration**: Bind the QR code content to variables or query results to reflect real-time data.
* **User Interaction**: Combine with other components to create interactive experiences, such as displaying additional information upon scanning.
* **Responsive Design**: Ensure the QR code scales appropriately across different devices and screen sizes.

### Component Playground

On Component Playground, you can interact with the Dropdown component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Dropdown component.

{% embed url="https://app.lowcoder.cloud/playground/qrCode/1" %}

### Component Auto-Docs

In the Auto-Docs of Dropdown component, we have shown how to use different properties of the Dropdown component. It also includes the Styling properties of the Dropdown component.

{% embed url="https://app.lowcoder.cloud/components/qrCode" %}

#### Properties of the Dropdown components <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="175.97265625">Property Name</th><th width="114.05859375">Type</th><th>Description</th></tr></thead><tbody><tr><td>value</td><td>String</td><td>Returns the value of the QR component</td></tr><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the QR component is hidden or not</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

**setValue() :**&#x20;

qrCode1.setValue() method sets the QR component's Value property, through which QR code gets generated.

```javascript
qrCode1.setValue("https://www.google.com");
```

**clearValue() :**&#x20;

qrCode1.clearValue() clears the QR component's Value property and empties the value from the QR component.

```javascript
qrCode1.clearValue();
```

**resetValue() :**&#x20;

qrCode1.resetValue() method resets the QR component's Value property to the default value of the QR component.

```javascript
qrCode1.resetValue();
```

### 📌 Use Cases

* **Event Check-Ins**: Generate QR codes for attendees to scan upon arrival.
* **Product Information**: Provide quick access to product details or manuals via QR codes.
* **Payment Processing**: Facilitate transactions by encoding payment information into QR codes.
* **User Authentication**: Implement QR code-based login or verification processes.
