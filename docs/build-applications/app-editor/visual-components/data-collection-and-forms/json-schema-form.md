# JSON Schema Form

In Lowcoder, the **JSON Schema Form** component enables developers to generate dynamic, data-driven forms by leveraging JSON Schema definitions. This approach streamlines form creation and ensures consistency across applications.

<figure><img src="../../../../.gitbook/assets/image (11).png" alt=""><figcaption></figcaption></figure>

**Key Features:**

1. **Dynamic Form Generation:** By inputting a JSON Schema, the component automatically constructs the corresponding form fields, reducing manual coding and potential errors.
2. **UI Schema Customisation:** Beyond the structural definition provided by the JSON Schema, a UI Schema allows for detailed customisation of the form's presentation, including layout adjustments and widget selections.
3. **Data Binding:** The form's data can be seamlessly bound to other components or queries within Lowcoder, facilitating real-time data interactions and updates.
4. **Validation:** Built-in validation mechanisms ensure that user inputs adhere to the constraints defined in the JSON Schema, providing immediate feedback and enhancing data integrity.
5. **Event Handling:** The component supports event handlers, such as 'Submit', enabling developers to define specific actions triggered by user interactions, enhancing the form's interactivity and functionality.
6. **Styling and Theming:** Developers can apply custom styles and themes to the form, ensuring visual consistency with the overall application design.

We have created a sample [JSON Schema form](https://app.lowcoder.cloud/apps/66ff1117fd53f40cf263900f/view_marketplace) App for you to review.

### Component Playground

On Component Playground, you can interact with the JSON Schema Form component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the component.

{% embed url="https://app.lowcoder.cloud/playground/jsonSchemaForm/1" %}

### Component Auto-Docs

In the Auto-Docs of JSON Schema Form component, we have shown how to use different properties of the component. It also includes the Styling properties of the component.

{% embed url="https://app.lowcoder.cloud/components/jsonSchemaForm" %}

#### Properties of the JSON Schema Form <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="173.76171875">Property Name</th><th width="115.51953125">Type</th><th>Description</th></tr></thead><tbody><tr><td>data</td><td>Object</td><td>The JSON data of the Form component i.e, the components present inside the Form component.</td></tr><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Form component is hidden or not</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="182.7109375">Event Name</th><th width="447.171875">Description</th></tr></thead><tbody><tr><td>Submit</td><td>When a User "submits" a form</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

**setData() :**&#x20;

jsonSchemaForm1.setData() method sets the json Schema Form's data property, which fills up all the components that are present/added into the json Schema Form component. This method takes Object as an argument. For example, for a json Schema Form having an input field, a number input field and a Date component, following code will set the Data of the json Schema Form component.

```javascript
jsonSchemaForm1.setData({
  name: "Alison",
  phone: "+44 20 7123 4567",
  birthday: "1999-09-09"
});
```

**clearData() :**&#x20;

jsonSchemaForm1.clearData() clears the json Schema Form's Data property and empties the values from the json Schema Form component.

```javascript
jsonSchemaForm1.clearData();
```

**resetData() :**&#x20;

jsonSchemaForm1.resetData()  method resets the json Schema Form's Data property to the default data of the json Schema Form component.

```javascript
jsonSchemaForm1.resetData();
```
