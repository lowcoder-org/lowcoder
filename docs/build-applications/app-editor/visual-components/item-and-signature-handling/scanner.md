# Scanner

## 📷 Scanner Component in Lowcoder

The **Scanner** component in Lowcoder enables applications to capture and process QR codes and barcodes directly through a device's camera. This functionality is essential for building interactive, real-time applications such as inventory systems, event check-ins, and secure access controls.

<figure><img src="../../../../.gitbook/assets/frame_generic_light (2) (4).png" alt=""><figcaption></figcaption></figure>

### 🔧 Key Features

* **Camera Integration**: Utilizes the device's camera to scan QR codes and barcodes.
* **Real-Time Scanning**: Processes codes instantly, providing immediate feedback.
* **Event Handling**: Triggers actions upon successful scans, such as data retrieval or navigation.
* **Responsive Design**: Adapts to various screen sizes and devices for optimal user experience.

### 🛠 Configuration Options

* **Camera Selection**: Choose between available cameras (e.g., front or rear) on the device.
* **Scan Formats**: Specify the types of codes to scan, such as QR codes or specific barcode standards.
* **Styling**: Customize the appearance, including dimensions and borders, to match your application's design.
* **Event Handlers**: Define actions to be executed upon successful scans, such as running queries or updating components.

### ⚙️ Integration Tips

* **Data Binding**: Bind the scanned data to other components or queries using Lowcoder's data binding syntax.
* **Event Handling**: Implement event handlers to perform actions like navigating to a different page or displaying additional information based on the scanned data.
* **Error Handling**: Incorporate error messages or fallback actions in case of scan failures or unsupported code formats.

### Component Playground

On Component Playground, you can interact with the Dropdown component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Dropdown component.

{% embed url="https://app.lowcoder.cloud/playground/scanner/1" %}

### Component Auto-Docs

In the Auto-Docs of Dropdown component, we have shown how to use different properties of the Dropdown component. It also includes the Styling properties of the Dropdown component.

{% embed url="https://app.lowcoder.cloud/components/scanner" %}

#### Properties of the Dropdown components <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="175.97265625">Property Name</th><th width="114.05859375">Type</th><th>Description</th></tr></thead><tbody><tr><td>data</td><td>Array</td><td>Returns the data of the Scanner component</td></tr><tr><td>disabled</td><td>Boolean</td><td>Returns True or False based on whether the Scanner component is disabled or not</td></tr><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Scanner component is hidden or not</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="166.04296875">Event Name</th><th width="458.8515625">Description</th></tr></thead><tbody><tr><td>Click</td><td>Triggers, when a User clicks on the Scanner component</td></tr><tr><td>Success</td><td>Triggers, when the Scanner component successfully scans a QR code</td></tr><tr><td>Close</td><td>Triggers, when Scanner component closes</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

**setData() :**&#x20;

scanner1.setData(); method sets the Scanner component's Data property.

```javascript
scanner1.setData(["https://www.google.com","https://www.facebook.com"]);
```

**clearData() :**&#x20;

scanner1.clearData() clears the Scanner component's Data property and empties the Data from the Scanner component.

```javascript
scanner1.clearData();
```

**resetData() :**&#x20;

scanner1.resetData() method resets the Scanner component's Data property to the default Data of the Scanner component.

```javascript
scanner1.resetData();
```

### 📌 Use Cases

* **Inventory Management**: Scan product barcodes to retrieve or update inventory information.
* **Event Check-Ins**: Validate attendee tickets by scanning QR codes at entry points.
* **Secure Access**: Authenticate users or grant access to restricted areas through code scanning.
* **Product Information**: Provide detailed product information by scanning codes on packaging.
