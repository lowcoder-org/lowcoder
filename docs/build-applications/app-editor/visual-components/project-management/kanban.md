# Kanban

## 🗂️ Kanban Component in Lowcoder

The **Kanban** component in Lowcoder provides a dynamic and visual way to manage tasks and workflows by organising items into columns representing different stages of a process.

<figure><img src="../../../../.gitbook/assets/frame_generic_light (12).png" alt=""><figcaption></figcaption></figure>

### 🔧 Key Features

* **Column-Based Layout**: Organize tasks into customisable columns such as "To Do," "In Progress," and "Done."
* **Drag-and-Drop Functionality**: Easily move tasks between columns to reflect changes in status.
* **Customizable Cards**: Display relevant information on each card, including titles, descriptions, and labels.
* **Data Binding**: Integrate with data sources to dynamically populate and update the Kanban board.
* **Event Handling**: Trigger actions based on user interactions, such as moving a card to a different column.

### 🛠 Configuration Options

* **Columns**: Define the stages of your workflow by setting up columns with custom titles and identifiers.
* **Card Fields**: Specify which data fields to display on each card, such as task name, assignee, or due date.
* **Styling**: Customize the appearance of the Kanban board and cards, including colors, fonts, and layouts.
* **Data Source Integration**: Connect to APIs or databases to fetch and update task data in real-time.

### ⚙️ Integration Tips

* **Dynamic Data Loading**: Use queries to load tasks into the Kanban board based on specific criteria or filters.
* **Real-Time Updates**: Implement event handlers to refresh the board when data changes occur elsewhere in the application.
* **User Interaction Handling**: Define actions to take when users interact with the board, such as opening a task detail view when a card is clicked.

### Component Playground

On Component Playground, you can interact with the Kanban component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Kanban component.

{% embed url="https://app.lowcoder.cloud/playground/kanban/1" %}

### Component Auto-Docs

In the Auto-Docs of Kanban component, we have shown how to use different properties of the Kanban component. It also includes the Styling properties of the Kanban component.

{% embed url="https://app.lowcoder.cloud/components/kanban" %}

#### Properties of the Kanban component <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="176.38671875">Property Name</th><th width="114.9921875">Type</th><th>Description</th></tr></thead><tbody><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Kanban component is hidden or not</td></tr><tr><td>data</td><td>Array</td><td>Returns an Array of Objects, containing data of the Kanban's component</td></tr><tr><td>intialData</td><td>Array</td><td>Returns an Array of Objects, containing initial/default data of the Kanban's component</td></tr><tr><td>activeCardData</td><td>Object</td><td>Return an Object, containing only the Active Card's data of the Kanban component</td></tr><tr><td>activeCardIndex</td><td>Number</td><td>Return a Number, containing the index of the Active Card item</td></tr><tr><td>toInsertedItems</td><td>Object</td><td>Returns an Array of Objects, containing data of the newly inserted items/tasks in Kanban component</td></tr><tr><td>toUpdatedItems</td><td>Object</td><td>Returns an Array of Objects, containing data of the Updated items/tasks of Kanban component</td></tr><tr><td>toDeletedItems</td><td>Object</td><td>Returns an Array of Objects, containing data of the Deleted items/tasks of Kanban component</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="152.5625">Event Name</th><th width="495.39453125">Description</th></tr></thead><tbody><tr><td>onChange</td><td>Triggers, when anything changes on the Kanban component</td></tr><tr><td>onEdit</td><td>Triggers, when a User clicks on the "Edit" link</td></tr><tr><td>onCardClick</td><td>Triggers, when a User clicks on a Card</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

**setData() :**&#x20;

kanban1.setData() method sets the Kanban's Data property, which sets the data to be shown in the Kanban component.

```javascript
kanban1.setData([
    {
        "label": "Task - 29001",
        "status": "Open",
        "summary": "Analyze customer requirements.",
        "type": "",
        "priority": "High",
        "tags": "Bug, Release Bug",
        "estimate": 0,
        "assignee": "Nancy Davloio",
        "rankId": 1,
        "id": 0
    }
]);
```

**getData() :**&#x20;

kanban1.getData() gets the Kanban data from the Data property.

```javascript
kanban1.getData()
```

**resetData() :**&#x20;

kanban1.resetData() method resets the Kanban's Data property to the default value of the Kanban component.

```javascript
kanban1.resetData();
```

**clearInsertedItems() :**&#x20;

kanban1.clearInsertedItems() clears the newly inserted items from the "toInsertedItems" property of the Kanban component.

```javascript
kanban1.clearInsertedItems();
```

**clearUpdatedItems() :**&#x20;

kanban1.clearUpdatedItems() method clears the updated items from the "toUpdatedItems" of the Kanban component.

```javascript
kanban1.clearUpdatedItems();
```

**clearDeletedItems() :**&#x20;

kanban1.clearDeletedItems() gets the Kanban data from the "toDeletedItems" property of the Kanban component.

```javascript
kanban1.clearDeletedItems();
```

### 📌 Use Cases

* **Project Management**: Track tasks and progress across different stages of a project.
* **Customer Support**: Manage support tickets through various resolution phases.
* **Sales Pipelines**: Visualize leads and opportunities as they move through the sales process.
