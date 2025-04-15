# Step Control

In Lowcoder, the **Step Control** component allows developers to create a sequence of steps, guiding users through multi-step processes or workflows within their applications.

**Key Features:**

1. **Sequential Navigation:** Organize content into distinct steps, enabling users to progress through a predefined sequence, which is ideal for forms, tutorials, or setup wizards.
2. **Customisation:** Each step can be tailored with specific titles, descriptions, and content, allowing for a personalised user experience that aligns with the application's requirements.
3. **Event Handling:** Define actions triggered by user interactions within each step, such as validations or data submissions, enhancing the interactivity and responsiveness of the workflow.
4. **Styling Options:** Apply custom styles to the Step Control component to ensure visual consistency with the overall design of the application, including adjustments to colors, fonts, and layouts.

### Component Playground

On Component Playground, you can interact with the Step Control component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Step Control component.

{% embed url="https://app.lowcoder.cloud/playground/step/1" %}

### Component Auto-Docs

In the Auto-Docs of Step Control component, we have shown how to use different properties of the  component. It also includes the Styling properties of the component.

{% embed url="https://app.lowcoder.cloud/components/step" %}

#### Properties of the Step Control component <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="173.76171875">Property Name</th><th width="115.51953125">Type</th><th>Description</th></tr></thead><tbody><tr><td>value</td><td>String</td><td>Holds the value of the Step Control component</td></tr><tr><td>disabled</td><td>Boolean</td><td>Returns True or False based on whether the Form component is disabled or not</td></tr><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Form component is hidden or not</td></tr><tr><td>stepPercent</td><td>Number</td><td>Returns the Step Percentage value</td></tr><tr><td>stepStatus</td><td>String</td><td>Returns the Step Status value</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="182.7109375">Event Name</th><th width="447.171875">Description</th></tr></thead><tbody><tr><td>Change</td><td>Triggers, when anything "changes" on Step Control component</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

<table><thead><tr><th>Method Name</th><th width="426.51953125">Description</th></tr></thead><tbody><tr><td>setValue</td><td>Set the data of the property Value</td></tr><tr><td>clearValue</td><td>Clear the data of the property Value</td></tr><tr><td>resetValue</td><td>ReSet the data of the property Value</td></tr><tr><td>blur</td><td>When a User "clicks" outside of the Step Control component i.e, defocuses the Step Control component.</td></tr><tr><td>focus</td><td>When a User "clicks" on the Step Control component</td></tr></tbody></table>

