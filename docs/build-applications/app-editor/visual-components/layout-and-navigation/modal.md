# Modal

In Lowcoder, the **Modal** component is a versatile container designed to display content in an overlay, effectively capturing user attention for specific interactions or information. It functions similarly to other container components like Form or Drawer allowing you to embed various UI elements or modules within it.

**Key Features:**

1. **Content Display:** The Modal can house multiple components, enabling the creation of complex interfaces within the overlay. This is particularly useful for tasks such as form submissions, displaying detailed information, or presenting user prompts/alerts. User can drag/insert different components inside the Modal component.
2. **Event Handling:** You can define event handlers for the Modal to manage user interactions effectively. For instance, triggering specific actions when the Modal is opened or closed enhances the interactivity of your application.&#x20;
3. **Styling and Customisation:** The Modal supports extensive styling options, allowing you to align its appearance with your application's design. You can customize aspects such as colors, borders, backgrounds etc to create a cohesive user experience.

{% embed url="https://demos.lowcoder.cloud/demo/oqryqCpi0mAG2oLGj5ypd" %}

By leveraging the Modal component, you can effectively manage user focus and interactions, presenting essential information or actions in a centralised overlay within your Lowcoder applications.

### Component Playground

On Component Playground, you can interact with the Modal component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Modal component.

{% embed url="https://app.lowcoder.cloud/playground/modal/1" %}

### Component Auto-Docs

In the Auto-Docs of Modal component, we have shown how to use different properties of the Modal component. It also includes the Styling properties of the Modal component.

{% embed url="https://app.lowcoder.cloud/components/modal" %}

#### Properties of the Modal <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="176.38671875">Property Name</th><th width="114.9921875">Type</th><th>Description</th></tr></thead><tbody><tr><td>visible</td><td>Boolean</td><td>Returns True or False based on whether the Modal  component is visible or not</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="152.5625">Event Name</th><th width="495.39453125">Description</th></tr></thead><tbody><tr><td>Open</td><td>When a User "opens" a Modal</td></tr><tr><td>Close</td><td>When a User "closes" a Modal</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

**setVisible() :**&#x20;

modal1.setVisible() method sets the Modal's Visible property, due to which Modal component is shown or not.

```javascript
modal1.setVisible(true);
```

**clearVisible() :**&#x20;

modal1.clearVisible() clears the Modal's Visible property and empties the already set value in the Modal component.

```javascript
modal1.clearVisible();
```

**resetVisible() :**&#x20;

modal1.resetVisible()  method resets the Modal's visible property to the default value of the Modal component.

```javascript
modal1.resetValue();
```
