# Input Field Types

In Lowcoder, **Input Type** components are essential for capturing user data, offering a range of options to suit different data entry needs. The primary input components include:

1. **Input:** A single-line text field for general text input. It's versatile and commonly used for short text entries such as names or titles.
2. **Input Number:** Specifically designed for numerical data, this component ensures that only valid numbers are entered, facilitating operations like calculations or data analysis.
3. **Password:** Similar to the standard Input component but masks the entered characters, enhancing security for sensitive information like passwords.
4. **Text Area:** A multi-line text field suitable for longer text inputs, such as comments or descriptions, providing users with ample space for detailed information.

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

<table><thead><tr><th width="172.3359375">Method Name</th><th width="479.24609375">Description</th></tr></thead><tbody><tr><td>setValue</td><td>Set the data/value of the Value property</td></tr><tr><td>setDefaultValue</td><td>Set the data/value of the Default Value property</td></tr><tr><td>setRangeText</td><td>Set the minimum and maximum length of the characters in input type component</td></tr><tr><td>setSelectionRange</td><td>Set the data/value of the Selection Range property</td></tr><tr><td>select</td><td>Set the Text type of the Input type component</td></tr><tr><td>clearValue</td><td>Clear the data/value of the Value property</td></tr><tr><td>clearDefaultValue</td><td>Clear the data/value of the Default Value property</td></tr><tr><td>resetDefaultValue</td><td>Reset the data/value of the Default Value property</td></tr><tr><td>resetValue</td><td>Reset the data/value of the Value property</td></tr><tr><td>click</td><td>Set what happens on Click event on the Input type component</td></tr></tbody></table>







