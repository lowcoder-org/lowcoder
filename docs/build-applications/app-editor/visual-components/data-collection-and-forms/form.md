# Form

In Lowcoder, the **Form** component serves as a container that organizes and manages input elements for user data collection. It streamlines the process of gathering and handling user inputs by grouping related fields together.

#### Key Features : <a href="#properties-of-the-table" id="properties-of-the-table"></a>

1. **Input Components:** Lowcoder's Form supports various input types, including text inputs, number inputs, option lists, radio buttons and other allowing for versatile data collection methods.
2. **Layout Consistency:** To enhance readability and user experience, maintain uniform input field lengths and arrange them in a single column. This approach ensures a clear and organised form structure.
3. **User Feedback Mechanisms:** Incorporate confirmation modals before form submission to prevent unintended actions. Additionally, implement notifications to inform users about the success or failure of their submissions, providing immediate feedback.
4. **Input Reset Options:** After a successful submission, you can configure the Form to clear input fields automatically, facilitating subsequent entries. Alternatively, retain input values if users are likely to submit similar data consecutively.
5. **Event Handlers:** The Form component supports various event handlers, such as 'Submit', allowing you to define specific actions triggered by user interactions, enhancing the form's interactivity and functionality.
6. **Generate Form through Data Source:** Forms can be generated using an already created Data Source. The process to create a Form through a Data Source is explained in the following demo :&#x20;

{% embed url="https://demos.lowcoder.cloud/demo/cm99k2vm51ikwpxcb1q5m4mid" %}
Generating a Form using a Data Source
{% endembed %}

### Component Playground

On Component Playground, you can interact with the Form component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Form component.

{% embed url="https://app.lowcoder.cloud/playground/form/1" %}

### Component Auto-Docs

In the Auto-Docs of Form component, we have shown how to use different properties of the Form component. It also includes the Styling properties of the Form component.

{% embed url="https://app.lowcoder.cloud/components/form" %}

#### Properties of the Form <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="173.76171875">Property Name</th><th width="115.51953125">Type</th><th>Description</th></tr></thead><tbody><tr><td>data</td><td>Object</td><td>The JSON data of the Form component i.e, the components present inside the Form component.</td></tr><tr><td>disabled</td><td>Boolean</td><td>Returns True or False based on whether the Form component is disabled or not</td></tr><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Form component is hidden or not</td></tr><tr><td>invalid</td><td>Boolean</td><td>Returns True or False based on whether the Form component is invalid or not</td></tr><tr><td>loading</td><td>Boolean</td><td>Returns True or False based on whether the Form component is loading or not</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="182.7109375">Event Name</th><th width="447.171875">Description</th></tr></thead><tbody><tr><td>Submit</td><td>When a User "submits" a form</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

<table><thead><tr><th>Method Name</th><th width="426.51953125">Description</th></tr></thead><tbody><tr><td>setData</td><td>Set the data of the property Data</td></tr><tr><td>clear</td><td>Clear the data of the property Data</td></tr><tr><td>reset</td><td>ReSet the data of the property Data</td></tr></tbody></table>

