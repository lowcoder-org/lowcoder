# Transfer

## 🔁 Transfer Component in Lowcoder

The **Transfer** component in Lowcoder facilitates the movement of items between two lists, allowing users to select and transfer items from one side to the other. This is particularly useful for assigning roles, selecting options, or managing item distributions within applications.

<figure><img src="../../../../.gitbook/assets/frame_generic_light (3) (3).png" alt=""><figcaption></figcaption></figure>

### 🔧 Key Features

* **Dual List Interface**: Presents two lists side by side, enabling intuitive item transfers.
* **Search Functionality**: Includes search bars for filtering items within each list.
* **Customisable Titles**: Allows setting custom titles for both source and target lists.
* **Responsive Design**: Adapts seamlessly to various screen sizes and devices.

### 🛠 Configuration Options

* **Data Binding**: Bind the component to dynamic data sources using Lowcoder's data binding syntax (`{{ }}`), ensuring real-time data representation.
* **Default Selections**: Predefine selected items to appear in the target list upon component load.
* **Styling Options**: Customize the appearance, including dimensions, borders, and colors, to align with your application's design.
* **Event Handlers**: Define actions to be executed upon item transfers, such as updating databases or triggering other components.

### ⚙️ Integration Tips

* **Dynamic Data Integration**: Bind the Transfer component to queries or variables to reflect real-time data changes.
* **Event Handling**: Implement event handlers to perform actions like updating user roles or permissions based on item transfers.
* **Combining with Other Components**: Use in conjunction with components like Tables or Forms to enhance functionality and user interaction.

### Component Playground

On Component Playground, you can interact with the Transfer component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Transfer component.

{% embed url="https://app.lowcoder.cloud/playground/transfer/1" %}

### Component Auto-Docs

In the Auto-Docs of Transfer component, we have shown how to use different properties of the Transfer component. It also includes the Styling properties of the Transfer component.

{% embed url="https://app.lowcoder.cloud/components/transfer" %}

#### Properties of the Transfer component <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="175.97265625">Property Name</th><th width="114.05859375">Type</th><th>Description</th></tr></thead><tbody><tr><td>items</td><td>Array</td><td>Returns Array of Objects containing all the items of the Transfer component</td></tr><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Transfer component is hidden or not</td></tr><tr><td>searchInfo</td><td>Array</td><td>Returns an Array containing the Search term being searched in Transfer component</td></tr><tr><td>selectedKeys</td><td>Array</td><td>Returns an Array containing the keys of the Selected items</td></tr><tr><td>targerObject</td><td>Array</td><td>Returns an Array of Objects containing list of all the items present in Target section</td></tr><tr><td>targetKeys</td><td>Array</td><td>Returns an Array containing list of Keys of all the items present in Target section</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="166.04296875">Event Name</th><th width="458.8515625">Description</th></tr></thead><tbody><tr><td>Change</td><td>Triggers, when anything Changes on the Transfer component</td></tr><tr><td>Search</td><td>Triggers, when a User searches inside the Transfer component</td></tr><tr><td>Selection Change</td><td>Triggers, when a User selects or unselects an item on the Transfer component</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

**setItems() :**&#x20;

transfer1.setItems() method sets the Transfer component's Items property, which gets shown in the Transfer component.

```javascript
transfer1.setItems([
  {
    "key": "1",
    "title": "Content 1"
  },
  {
    "key": "2",
    "title": "Content 2"
  },
  {
    "key": "3",
    "title": "Content 3"
  }
]);
```

**clearItems() :**&#x20;

transfer1.clearItems() clears the Transfer component's Items property and empties the Items from the Transfer component.

```javascript
transfer1.clearItems();
```

**resetItems() :**&#x20;

transfer1.resetItems() method resets the Transfer component's Items property to the default Items of the Transfer component.

```javascript
transfer1.resetItems();
```

**setTargetKeys() :**&#x20;

transfer1.setTargetKeys() method sets the Transfer component's targetKeys property, which shows items in the Transfer component's Target section.

```javascript
transfer1.setTargetKeys(["1","3"]);
```

**clearTargetKeys() :**&#x20;

transfer1.clearTargetKeys() clears the Transfer component's targetKeys property and empties the items from the Transfer component's Target section.

```javascript
transfer1.clearTargetKeys();
```

**resetTargetKeys() :**&#x20;

transfer1.resetTargetKeys()  method resets the Transfer component's targetKeys property to the default targetKeys value of the Transfer component.

```javascript
transfer1.resetTargetKeys();
```

### 📌 Use Cases

* **User Role Assignment**: Assign or revoke user roles by transferring users between available and assigned lists.
* **Feature Selection**: Enable users to select desired features or options from a list of available items.
* **Task Allocation**: Distribute tasks among team members by moving tasks between unassigned and assigned lists.
* **Permission Management**: Manage access permissions by transferring resources between accessible and restricted lists.
