# Image Editor

## 🖼️ Image Editor Component in Lowcoder

The **Image Editor** component in Lowcoder empowers users to upload, edit, and manage images directly within their applications. It offers a range of tools for image manipulation, enhancing user interaction and content customisation.

<figure><img src="../../../../.gitbook/assets/frame_generic_light (9) (4).png" alt=""><figcaption></figcaption></figure>

### 🔧 Key Features

* **Image Uploading**: Users can upload images from their local devices.
* **Editing Tools**: Provides functionalities such as cropping, resizing, rotating, and applying filters to images.
* **Preview Functionality**: Allows users to preview images before finalizing edits.
* **Responsive Design**: Adapts seamlessly to various screen sizes and devices.
* **Integration Capabilities**: Can be integrated with other components and data sources within Lowcoder.

### 🛠 Configuration Options

* **Default Image**: Set a default image to be displayed upon component load.
* **Editable Settings**: Configure which editing tools are available to the user.
* **Output Format**: Specify the format (e.g., JPEG, PNG) for the edited image output.
* **Styling Options**: Customize the appearance, including dimensions, borders, and background colors.
* **Event Handlers**: Define actions to be triggered on events like image upload, edit completion, or errors.

### ⚙️ Integration Tips

* **Data Binding**: Bind the edited image data to other components or save it to a database using Lowcoder's data binding syntax.
* **Event Handling**: Implement event handlers to perform actions such as saving the image or updating other components upon editing completion.
* **Combining with Other Components**: Use in conjunction with components like Forms or Galleries to enhance functionality.

### Component Playground

On Component Playground, you can interact with the Image Editor component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Image Editor component.

{% embed url="https://app.lowcoder.cloud/playground/imageEditor/1" %}

### Component Auto-Docs

In the Auto-Docs of Image Editor  component, we have shown how to use different properties of the Image Editor  component. It also includes the Styling properties of the Image Editor  component.

{% embed url="https://app.lowcoder.cloud/components/imageEditor" %}

#### Properties of the Dropdown components <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="175.97265625">Property Name</th><th width="114.05859375">Type</th><th>Description</th></tr></thead><tbody><tr><td>data</td><td>String</td><td>Returns the data of the Image Editor component</td></tr><tr><td>buttonText</td><td>String</td><td>Returns the Button Text of the Image Editor component</td></tr><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Image Editor component is hidden or not</td></tr><tr><td>dataURI</td><td>String</td><td>Returns the dataURI of the Image Editor component</td></tr><tr><td>name</td><td>String</td><td>Returns the name of the downloaded image from the Image Editor component</td></tr><tr><td>src</td><td>String</td><td>Returns the Image Source data of the Image Editor component</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="166.04296875">Event Name</th><th width="458.8515625">Description</th></tr></thead><tbody><tr><td>Save</td><td>Triggers, when a User Saves the work on the Image Editor component</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

**setData() :**&#x20;

imageEditor1.setData() method sets the Image Editor component's Data property.

```javascript
imageEditor1.setData("A big giant Fist");
```

**clearData() :**&#x20;

imageEditor1.clearData() clears the Image Editor component's Data property.

```javascript
imageEditor1.clearValue();
```

**resetData() :**&#x20;

imageEditor1.resetData()  method resets the Image Editor component's Data property to the default Data of the Image Editor component.

```javascript
imageEditor1.resetValue();
```

**setDataURI() :**&#x20;

imageEditor1.setDataURI() method sets the Image Editor component's DataURI property.

```javascript
imageEditor1.setDataURI("https://images.unsplash.com/photo-1575936123452-b67c3203c357?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");
```

**clearDataURI() :**&#x20;

imageEditor1.clearDataURI() clears the Image Editor component's DataURI property.

```javascript
imageEditor1.clearDataURI();
```

**resetDataURI() :**&#x20;

imageEditor1.resetDataURI()  method resets the Image Editor component's DataURI property to the default value of the Image Editor component.

```javascript
imageEditor1.resetDataURI();
```

### 📌 Use Cases

* **Profile Picture Editing**: Allow users to upload and edit their profile images.
* **Product Image Management**: Enable administrators to manage product images within an e-commerce application.
* **Content Creation Tools**: Provide users with tools to create and edit images for blogs or social media posts.
* **Educational Platforms**: Facilitate image-based assignments or projects where students can upload and edit images.
