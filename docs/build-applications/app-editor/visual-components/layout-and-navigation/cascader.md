# Cascader

In Lowcoder, the **Cascader** component allows users to select options from a hierarchical, multi-level data structure through a dropdown menu. This component is particularly useful for presenting nested options in a streamlined and user-friendly manner.

**Key Features:**

1. **Hierarchical Data Representation:** The Cascader displays data in multiple interconnected levels, enabling users to navigate and select from nested categories efficiently.
2. **Dynamic Option Loading:** It supports asynchronous loading of options, allowing for the retrieval of data on-the-fly as users expand parent categories, which is beneficial for handling large datasets without performance issues.
3. **Multiple Selection:** The component can be configured to allow single or multiple selections, providing flexibility based on the application's requirements.
4. **Customizable Display:** Developers can customize the display of selected options, including the separator between levels, to enhance readability and user experience.
5. **Search Functionality:** The Cascader includes a built-in search feature, enabling users to quickly locate specific options within the hierarchy by typing keywords.
6. **Integration with Forms:** It seamlessly integrates with form components, allowing for the collection of structured data inputs that reflect complex relationships.

By incorporating the Cascader component, developers can effectively manage and present complex, nested data structures in their Lowcoder applications, enhancing both functionality and user experience.

### Component Playground

On Component Playground, you can interact with the Cascader component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Cascader component.

{% embed url="https://app.lowcoder.cloud/playground/cascader/1" %}

### Component Auto-Docs

In the Auto-Docs of Cascader component, we have shown how to use different properties of the  component. It also includes the Styling properties of the Cascader component.

{% embed url="https://app.lowcoder.cloud/components/cascader" %}

#### Properties of the Cascader <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="176.38671875">Property Name</th><th width="114.9921875">Type</th><th>Description</th></tr></thead><tbody><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Cascader component is hidden or not</td></tr><tr><td>disabled</td><td>Boolean</td><td>Returns True or False based on whether the Cascader component is disabled or not</td></tr><tr><td>value</td><td>Array</td><td>Returns array of the items present in the Cascader component.</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="152.5625">Event Name</th><th width="495.39453125">Description</th></tr></thead><tbody><tr><td>Change</td><td>When a User "changes" anything on the Cascader component.</td></tr><tr><td>Focus</td><td>When a User "clicks" on the Cascader typing area.</td></tr><tr><td>Blur</td><td>When a User "clicks" outside of the Cascader component i.e, defocuses the Cascader component.</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

**setValue() :**&#x20;

cascader1.setValue() method sets the Cascader's Value property, which is shown as selected in the Cascader component.

```javascript
cascader1.setValue(["New South Wales","Sydney","Sydney Opera House"]);
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
