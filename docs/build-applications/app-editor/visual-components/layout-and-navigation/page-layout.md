# Page Layout

In Lowcoder, the **Page Layout** component serves as a foundational container designed to structure and organize the main sections of an application interface, including the header, sidebar (sider), footer, and main content areas. This component facilitates the creation of consistent and responsive layouts, ensuring a cohesive user experience across different devices.

**Key Features:**

1. **Structured Layout:** The Page Layout component provides predefined regions—header, sider, footer, and content—that can be customised and populated with various UI elements to establish a clear and organised interface.
2. **Responsiveness:** Designed to adapt to different screen sizes, the Page Layout ensures that applications are accessible and functional across desktops, tablets, and mobile devices.
3. **Customisation:** Each section within the Page Layout can be styled individually, allowing developers to align the appearance with the application's design guidelines.
4. **Integration:** The Page Layout seamlessly integrates with other Lowcoder components, enabling the embedding of forms, tables, charts, and other elements within its structured regions.

### Component Playground

On Component Playground, you can interact with the Page Layout component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Page Layout component.

{% embed url="https://app.lowcoder.cloud/playground/pageLayout/1" %}

### Component Auto-Docs

In the Auto-Docs of the Page Layout component, we have shown how to use different properties of this component. It also includes the Styling properties of the component.

{% embed url="https://app.lowcoder.cloud/components/pageLayout" %}

#### Properties of the Page Layout component <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="176.38671875">Property Name</th><th width="114.9921875">Type</th><th>Description</th></tr></thead><tbody><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Page Layout component is hidden or not</td></tr><tr><td>container</td><td>Object</td><td>Returns the Container object, which contains all the components placed inside the Container</td></tr><tr><td>disabled</td><td>Boolean</td><td>Returns True or False based on whether the Page Layout component is disabled or not</td></tr><tr><td>siderCollapsed</td><td>Boolean</td><td>Returns True or False based on whether the Page Layout sider is collapsed or not</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilised. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

**setSiderCollapsed() :**&#x20;

pageLayout1.setSiderCollapsed() method sets the siderCollapsed property of the Page Layout component. It takes True or False as an Argument. Following code collapses the Sider component on Page Layout.

```javascript
pageLayout1.setSiderCollapsed(true);
```
