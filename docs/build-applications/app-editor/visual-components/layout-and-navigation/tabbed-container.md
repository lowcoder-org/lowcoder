# Tabbed Container

In Lowcoder, the **Tabbed Container** component enables developers to organize content into multiple tabs within a single interface, enhancing user experience by allowing seamless navigation between different sections without leaving the current page.

**Key Features:**

1. **Multiple Tabs:** Create and manage multiple tabs, each capable of containing various components, facilitating the organization of related content within a compact space.
2. **Customisation:** Tailor each tab's title, icon, and content to align with the application's design and functionality requirements.
3. **Dynamic Content Loading:** Configure tabs to load content dynamically, improving performance by fetching data only when a tab is activated.
4. **Event Handling:** Implement event handlers to trigger specific actions when users switch tabs, enhancing interactivity and responsiveness.
5. **Styling Options:** Apply custom styles to the Tabbed Container and its tabs to maintain visual consistency with the overall application design.

Be aware that, by default, components within inactive tabs may be destroyed to optimize performance. To retain their state, adjust the "Destroy Inactive TabPane" setting accordingly.

### Component Playground

On Component Playground, you can interact with the Tabbed Container component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Tabbed Container component.

{% embed url="https://app.lowcoder.cloud/playground/tabbedContainer/1" %}

### Component Auto-Docs

In the Auto-Docs of Tabbed Container component, we have shown how to use different properties of the  component. It also includes the Styling properties of the component.

{% embed url="https://app.lowcoder.cloud/components/tabbedContainer" %}

#### Properties of the Tabbed Container <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="176.38671875">Property Name</th><th width="114.9921875">Type</th><th>Description</th></tr></thead><tbody><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Tabbed Container is hidden or not</td></tr><tr><td>selectedTabKey</td><td>String</td><td>Returns value of the Selected Tab option</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="141.53125">Event Name</th><th width="515.65625">Description</th></tr></thead><tbody><tr><td>Switch Tab</td><td>Triggers when a User "switches" any Tab on the Tabbed Container</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilised. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

<table><thead><tr><th width="177.9296875">Method Name</th><th width="485.80078125">Description</th></tr></thead><tbody><tr><td>setKey</td><td>Set the data/value of the property selectedTabKey</td></tr><tr><td>clearKey</td><td>Clear the data/value of the property selectedTabKey</td></tr><tr><td>resetKey</td><td>Clear the data/value of the property selectedTabKey</td></tr></tbody></table>

