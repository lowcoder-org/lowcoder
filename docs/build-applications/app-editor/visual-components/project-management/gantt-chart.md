# Gantt Chart

## 📊 Gantt Chart Component in Lowcoder

The **Gantt Chart** component in Lowcoder provides a dynamic and visual way to manage and visualize project timelines, tasks, and dependencies. It enables users to plan, schedule, and track project progress efficiently.

<figure><img src="../../../../.gitbook/assets/frame_generic_light.png" alt=""><figcaption></figcaption></figure>

### 🔧 Key Features

* **Task Management**: Create and manage tasks with attributes such as start/end dates, durations, progress indicators, and dependencies.
* **Multiple View Modes**: Switch between various time scales including Hour, Day, Week, Month, and Year to suit project needs.
* **Interactive Editing**: Support for drag-and-drop functionality to adjust task timelines directly within the chart.
* **Customizable Styling**: Extensive options to style chart elements, including bar colors, text sizes, row heights, and more.
* **Event Handling**: Handle events such as task date changes, clicks, deletions, and progress updates to trigger custom actions.

### 🛠 Configuration Options

* **Data Binding**: Bind the Gantt Chart to dynamic data sources using JSON arrays to populate tasks.
* **Styling Sections**:
  * **Legend Header Style**: Customize the header of the task list.
  * **Legend Style**: Style the task list area.
  * **Tooltip Style**: Define the appearance of tooltips displayed on hover.
  * **Chart Style**: Adjust the main chart's appearance, including bar colors and corner radius.
* **Event Handlers**: Implement custom logic for events like task selection, updates, and deletions.

### ⚙️ Integration Tips

* **Dynamic Data Loading**: Use queries to load tasks into the Gantt Chart based on specific criteria or filters.
* **Real-Time Updates**: Implement event handlers to refresh the chart when data changes occur elsewhere in the application.
* **User Interaction Handling**: Define actions to take when users interact with the chart, such as opening a task detail view when a bar is clicked.

### Component Playground

On Component Playground, you can interact with the Gantt Chart component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Gantt Chart component.

{% embed url="https://app.lowcoder.cloud/playground/ganttChart/1" %}

### Component Auto-Docs

In the Auto-Docs of Gantt Chart component, we have shown how to use different properties of the Gantt Chart component. It also includes the Styling properties of the Gantt Chart component.

{% embed url="https://app.lowcoder.cloud/components/ganttChart" %}

#### Properties of the Gantt Chart component <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="176.38671875">Property Name</th><th width="114.9921875">Type</th><th>Description</th></tr></thead><tbody><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Gantt Chartcomponent is hidden or not</td></tr><tr><td>data</td><td>Array</td><td>Returns an Array of Objects, containing data of the Gantt Chart's component</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="152.5625">Event Name</th><th width="495.39453125">Description</th></tr></thead><tbody><tr><td>Task Clicked</td><td>Triggers, when a Task is clicked</td></tr><tr><td>Task Selected</td><td>Triggers, when a Task gets selected for the first time</td></tr><tr><td>Task Updated</td><td>Triggers, when a Task is updated</td></tr><tr><td>Task Deleted</td><td>Triggers, when a Task gets deleted</td></tr><tr><td>Task Date Changed</td><td>Triggers, when a Task's date is changed</td></tr><tr><td>Task Progress Changed</td><td>Triggers, when a Task's progress is changed</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

**setData() :**&#x20;

ganttChart1.setData() method sets the Gantt Chart's Data property, which sets the data to be shown in the Gantt Chart component.

```javascript
ganttChart1.setData([
    {
        "label": "Some Project",
        "start": "2025-04-29T12:45:00.000Z",
        "end": "2025-05-14T19:00:00.000Z",
        "id": "ProjectSample",
        "project": "",
        "progress": 25,
        "type": "project",
        "hideChildren": false,
        "displayOrder": 1,
        "dependencies": [
            ""
        ]
    },
    {
        "label": "Idea",
        "start": "2025-04-29T12:45:00.000Z",
        "end": "2025-04-30T17:23:00.000Z",
        "id": "Task 0",
        "project": "ProjectSample",
        "progress": 45,
        "type": "task",
        "hideChildren": false,
        "displayOrder": 2,
        "dependencies": [
            ""
        ]
    }
]);
```

**getData() :**&#x20;

ganttChart1.getData() gets the Gantt Chart's data from the Data property.

```javascript
ganttChart1.getData();
```

**resetGanttTasks() :**&#x20;

ganttChart1.resetGanttTasks() method resets the Gantt Chart's Data property to the default value of the Gantt Chart component.

```javascript
ganttChart1.resetGanttTasks();
```

### 📌 Use Cases

* **Project Management**: Plan and track project tasks, timelines, and dependencies.
* **Resource Allocation**: Visualize resource assignments and workloads over time.
* **Product Roadmapping**: Outline product development phases and milestones.([npm](https://npm.io/package/lowcoder-comp-gantt-chart?utm_source=chatgpt.com), [2025 Gantt Chart Template](https://2025ganttcharttemplate.z28.web.core.windows.net/gantt-chart-for-software-progress-report.html?utm_source=chatgpt.com))
