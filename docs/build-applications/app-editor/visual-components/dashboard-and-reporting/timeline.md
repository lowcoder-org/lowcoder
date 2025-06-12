# Timeline

## 📅 Timeline Component in Lowcoder

The **Timeline** component in Lowcoder offers a visual representation of chronological events, allowing users to display sequences such as project milestones, historical data, or activity logs in a structured and interactive manner.

<figure><img src="../../../../.gitbook/assets/frame_generic_light (4) (8).png" alt=""><figcaption></figcaption></figure>

### 🔧 Key Features

* **Chronological Display**: Presents events in a sequential order, enhancing the understanding of temporal relationships.
* **Customisable Entries**: Each timeline item can include titles, descriptions, timestamps, and icons to convey detailed information.
* **Dynamic Data Binding**: Supports binding to various data sources, enabling real-time updates and interactivity.
* **Event Handling**: Allows the implementation of actions triggered by user interactions with timeline items.
* **Styling Flexibility**: Offers customization options for colors, fonts, and layouts to align with application design.

### 🛠 Configuration Options

* **Data Source Integration**: Connect the timeline to APIs, databases, or static data for dynamic content.
* **Orientation Settings**: Choose between vertical or horizontal layouts to fit the application's structure.
* **Sorting Order**: Display events in ascending or descending order based on timestamps.
* **Grouping**: Organize events into categories or phases for better clarity.
* **Responsive Design**: Ensures optimal viewing across various devices and screen sizes.

### ⚙️ Integration Tips

* **Data Binding**: Utilize Lowcoder's data binding syntax (`{{ }}`) to connect timeline items to dynamic data sources.
* **Event Handling**: Implement event handlers to perform actions when users interact with timeline entries, such as displaying detailed information or navigating to related content.
* **Combining with Other Components**: Integrate the Timeline component with other UI elements like modals or detail views to enhance user experience.

### Component Playground

On Component Playground, you can interact with the Timeline component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Timeline component.

{% embed url="https://app.lowcoder.cloud/playground/timeline/1" %}

### Component Auto-Docs

In the Auto-Docs of Timeline component, we have shown how to use different properties of the Timeline component. It also includes the Styling properties of the Timeline component.

{% embed url="https://app.lowcoder.cloud/components/timeline" %}

#### Properties of the Timeline component <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="175.97265625">Property Name</th><th width="114.05859375">Type</th><th>Description</th></tr></thead><tbody><tr><td>value</td><td>Array</td><td>Returns an Array of Objects containing the value of the Timeline component</td></tr><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Timeline component is hidden or not</td></tr><tr><td>clickedIndex</td><td>Number</td><td>Returns the Index of the Clicked item/title of the Timeline component</td></tr><tr><td>clickedObject</td><td>Object</td><td>Returns an Object containing the detailed of the Clicked item of the Timeline component</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="166.04296875">Event Name</th><th width="458.8515625">Description</th></tr></thead><tbody><tr><td>Click</td><td>Triggers, when a User clicks on the title of Timeline component</td></tr></tbody></table>

### 📌 Use Cases

* **Project Management**: Illustrate project phases, deadlines, and milestones.
* **Historical Data Representation**: Showcase events over time, such as company history or product evolution.
* **User Activity Logs**: Display sequences of user actions or system events.
* **Educational Content**: Present chronological information for learning purposes, like historical timelines or process flows.
