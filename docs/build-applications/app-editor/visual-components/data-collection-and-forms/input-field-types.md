# Input Field Types

In Lowcoder, **Input Type** components are essential for capturing user data, offering a range of options to suit different data entry needs. The primary input components include:

1. **Input:** A single-line text field for general text input. It's versatile and commonly used for short text entries such as names or titles.
2. **Input Number:** Specifically designed for numerical data, this component ensures that only valid numbers are entered, facilitating operations like calculations or data analysis.
3. **Password:** Similar to the standard Input component but masks the entered characters, enhancing security for sensitive information like passwords.
4. **Text Area:** A multi-line text field suitable for longer text inputs, such as comments or descriptions, providing users with ample space for detailed information.

<figure><img src="../../../../.gitbook/assets/image (10).png" alt=""><figcaption></figcaption></figure>

**Common Features:**

* **Customisation:** Each component offers properties for customisation, including placeholder text, default values, and styling options, allowing for a tailored user experience.
* **Event Handlers:** They support various event handlers like 'Change', 'Focus', and 'Blur', enabling the execution of specific actions in response to user interactions.
* **Validation:** Input validation rules can be applied to ensure data integrity and provide immediate feedback to users regarding their input.

By effectively utilising these Input Type components, developers can create intuitive and user-friendly forms that cater to a wide array of data entry requirements.

### Component Playground

* [Input Component](https://app.lowcoder.cloud/playground/input/1)
* [Password Component](https://app.lowcoder.cloud/playground/password/1)
* [Number Input](https://app.lowcoder.cloud/playground/textArea/1)
* [Text Area Component](https://app.lowcoder.cloud/components/textArea)

### Component Auto-Docs

* [Input Component](https://app.lowcoder.cloud/components/input)
* [Password Component](https://app.lowcoder.cloud/components/password)
* [Number Input](https://app.lowcoder.cloud/components/numberInput)
* [Text Area Component](https://app.lowcoder.cloud/components/textArea)

#### Properties of the Input Type components <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="175.97265625">Property Name</th><th width="114.05859375">Type</th><th>Description</th></tr></thead><tbody><tr><td>value</td><td>String</td><td>Returns the value of the Input type component</td></tr><tr><td>disabled</td><td>Boolean</td><td>Returns True or False based on whether the Input type component is disabled or not</td></tr><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Input type component is hidden or not</td></tr><tr><td>invalid</td><td>Boolean</td><td>Returns True or False based on whether the Input type component is invalid or not</td></tr><tr><td>required</td><td>Boolean</td><td>Returns True or False based on whether the Input type component is required or not</td></tr><tr><td>placeholder</td><td>String</td><td>Returns the placeholder value of the Input type component</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="166.04296875">Event Name</th><th width="458.8515625">Description</th></tr></thead><tbody><tr><td>Change</td><td>When a User "changes" anything on the Input component.</td></tr><tr><td>Focus</td><td>When a User "clicks" on the input field typing area</td></tr><tr><td>Blur</td><td>When a User "clicks" outside of the input field component i.e, defocuses the input component.</td></tr><tr><td>Submit</td><td>When a User press "enters" inside the input field component.</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

**setValue() :**&#x20;

input1.setValue() method sets the Input's Value property, which gets shown in the Input component.

```javascript
input1.setValue("John Nick");
```

**clearValue() :**&#x20;

input1.clearValue() clears the Input's Value property and empties the value from the Input component.

```javascript
input1.clearValue();
```

**resetValue() :**&#x20;

input1.resetValue()  method resets the Input's value property to the default value of the Input component.

```javascript
input1.resetValue();
```

**setDefaultValue() :**&#x20;

input1.setDefaultValue() method sets the Input's Default value, which gets shown in the Input component as default.

```javascript
input1.setDefaultValue("John Nick");
```

**clearDefaultValue() :**&#x20;

input1.clearDefaultValue() clears the Input's Default value and empties the value from the Input component.

```javascript
input1.clearDefaultValue();
```

**resetDefaultValue() :**&#x20;

input1.resetDefaultValue()  method resets the Input's Default value to the default value of the Input component.

```javascript
input1.resetDefaultValue();
```

**setRangeText() :**&#x20;

input1.setRangeText() method sets the minimum and maximum value of the inout component. Value of the Input component should lie between the minimum and maximum limits.

```javascript
input1.setRangeText(3,6);
```

**setSelectionRange() :**&#x20;

input1.setSelectionRange() sets the Selection Range of the Input component.

```javascript
input1.setSelectionRange();
```

**click() :**&#x20;

input1.click()  method sets what happens when User clicks on the Input component.

```javascript
input1.click();
```

**select() :**&#x20;

input1.select()  method selects the text type of the Input component.

```javascript
input1.select();
```
