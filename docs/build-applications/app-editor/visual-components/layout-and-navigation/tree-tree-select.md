# Tree / Tree Select

In Lowcoder, the **Tree** and **Tree Select** components are designed to display and interact with hierarchical data structures, providing users with intuitive navigation and selection capabilities.

**Tree Component:**

* **Hierarchical Display:** Presents data in a tree-like structure, allowing users to expand and collapse nodes to explore nested items.
* **Customisation:** Supports customisation of node labels, icons, and styles to align with application requirements.
* **Event Handling:** Offers event handlers for interactions such as node selection, expansion, and collapse, enabling dynamic responses to user actions.

**Tree Select Component:**

* **Dropdown Hierarchy:** Combines the hierarchical display of the Tree component with a dropdown interface, allowing users to select options from nested categories within a compact UI element.
* **Search Functionality:** Includes a search feature to help users quickly locate specific nodes within the hierarchy.
* **Multiple Selection:** Can be configured to allow single or multiple selections based on application needs.

### Tree Select component Demo

{% embed url="https://demos.lowcoder.cloud/demo/cly7cu24w00eafa5ifz478oji" %}

### Component Playground

On Component Playground, you can interact with the Tree/ Tree Select component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Tree/ Tree Select component.

* [Tree Component](https://app.lowcoder.cloud/playground/tree/1)
* Tree Select Component

### Component Auto-Docs

In the Auto-Docs of Tree/ Tree Select component, we have shown how to use different properties of the  component. It also includes the Styling properties of the component.

* [Tree Component](https://app.lowcoder.cloud/components/tree)
* [Tree Select Component](https://app.lowcoder.cloud/components/treeSelect)

#### Properties of the Tree / Tree Select component <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="176.38671875">Property Name</th><th width="114.9921875">Type</th><th>Description</th></tr></thead><tbody><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Tree/Tree Select component is hidden or not</td></tr><tr><td>disabled</td><td>Boolean</td><td>Returns True or False based on whether the Tree/Tree Select component is disabled or not</td></tr><tr><td>invalid</td><td>Boolean</td><td>Returns True or False based on whether the Tree/Tree Select component is invalid or not</td></tr><tr><td>value</td><td>Array</td><td>Returns an Array which contain the selected value/values from the Component</td></tr><tr><td>expanded</td><td>Array</td><td>Returns an Array which contain the expanded value/nodes of the Component</td></tr><tr><td>treeData</td><td>Array</td><td>Returns an Array which contain all the Tree component data</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="152.5625">Event Name</th><th width="495.39453125">Description</th></tr></thead><tbody><tr><td>Change</td><td>When a User "changes" anything on the component.</td></tr><tr><td>Focus</td><td>When a User "clicks" on the Component's typing area.</td></tr><tr><td>Blur</td><td>When a User "clicks" outside of the component i.e, defocuses the component.</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

**setValue() :**&#x20;

tree1.setValue() method sets the Tree's Value property, which is shown as selected in the Tree component.

```javascript
tree1.setValue(["asia","china","beijing"]);
```

**clearValue() :**&#x20;

tree1.clearValue() clears the Tree's Value property and empties the selected value in the Tree component.

```javascript
tree1.clearValue();
```

**resetValue() :**&#x20;

tree1.resetValue()  method resets the Tree's value property to the default value of the Tree component.

```javascript
tree1.resetValue();
```
