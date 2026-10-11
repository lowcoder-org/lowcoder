# Text

In Lowcoder, the **Text** component allows developers to display static or dynamic text within their applications. It supports Markdown formatting, enabling rich text presentation, including headings, lists, links, and images. citeturn0search3 Additionally, the Text component can be styled through the Properties pane or custom CSS, allowing customization of fonts, colors, and other visual aspects to align with the application's design. citeturn0search4 By leveraging the Text component, developers can effectively present information and enhance the user interface of their Lowcoder applications.

### Demo about Styling a Text Component

{% embed url="https://demos.lowcoder.cloud/demo/FWO1CpYQeBSYStJjvi_DM" %}

### Component Playground

On Component Playground, you can interact with the Text component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Text component.

{% embed url="https://app.lowcoder.cloud/playground/text/1" %}

### Component Auto-Docs

In the Auto-Docs of Text component, we have shown how to use different properties of the Text component. It also includes the Styling properties of the Text component.

{% embed url="https://app.lowcoder.cloud/components/text" %}

#### Properties of the Text component <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="176.38671875">Property Name</th><th width="114.9921875">Type</th><th>Description</th></tr></thead><tbody><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Text component is hidden or not</td></tr><tr><td>text</td><td>String</td><td>Returns value/data of the Text component</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="141.53125">Event Name</th><th width="515.65625">Description</th></tr></thead><tbody><tr><td>Click</td><td>When a User "click" on the component</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilised. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

**setText() :**&#x20;

text1.setText() method sets the Text component's text property. It takes a String argument

```javascript
text1.setText("Text component's Text");
```

**clearText() :**&#x20;

text1.clearText() clears the Text component's text property and empties the current value from the component.

```javascript
text1.clearText();
```

**resetText() :**&#x20;

text1.resetValue()  method resets the Text component's text property to the default value of the component.

```javascript
text1.resetText();
```
