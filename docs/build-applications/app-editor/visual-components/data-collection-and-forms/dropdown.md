# Dropdown

## 🔽 Dropdown Component in Lowcoder

The **Dropdown** component in Lowcoder enables users to select a single option from a predefined list, enhancing form inputs and user interactions with a clean and intuitive interface.

<figure><img src="../../../../.gitbook/assets/frame_generic_light (1) (1).png" alt=""><figcaption></figcaption></figure>

### 🔧 Key Features

* **Single Selection**: Allows users to choose one option from a list.
* **Manual and Dynamic Data Entry**: Supports both manually entered options and dynamic data binding from APIs or databases.
* **Customisable Display**: Configure labels, values, and placeholder text to match application requirements.
* **Event Handling**: Trigger actions based on user interactions, such as selection changes.

### 🛠 Configuration Options

* **Manual Mode**: Manually define options with specific labels and values.
* **Mapped Mode**: Bind options dynamically from data sources like APIs or databases.
* **Default Value**: Set an initial selected value for the dropdown.
* **Disabled State**: Disable the dropdown to prevent user interaction when necessary.
* **Hidden State**: Hide the dropdown from view without removing it from the layout.

### ⚙️ Integration Tips

*   **Data Binding**: Use `{{ }}` syntax to bind the selected value to other components or queries. For example:

    ```javascript
    {{dropdown1.value}}
    ```
* **Event Handling**: Implement event handlers to respond to selection changes and trigger corresponding actions.

### Component Playground

On Component Playground, you can interact with the Dropdown component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Dropdown component.

{% embed url="https://app.lowcoder.cloud/playground/dropdown/1" %}

### Component Auto-Docs

In the Auto-Docs of Dropdown component, we have shown how to use different properties of the Dropdown component. It also includes the Styling properties of the Dropdown component.

{% embed url="https://app.lowcoder.cloud/components/dropdown" %}

#### Properties of the Dropdown components <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="175.97265625">Property Name</th><th width="114.05859375">Type</th><th>Description</th></tr></thead><tbody><tr><td>text</td><td>String</td><td>Returns the text of the Dropdown component</td></tr><tr><td>disabled</td><td>Boolean</td><td>Returns True or False based on whether the Dropdown component is disabled or not</td></tr><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Dropdown component is hidden or not</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="166.04296875">Event Name</th><th width="458.8515625">Description</th></tr></thead><tbody><tr><td>Click</td><td>Triggers, when a User clicks on the Dropdown component</td></tr></tbody></table>

### 📌 Use Cases

* **Form Inputs**: Collect user selections in forms, such as choosing a country or category.
* **Filtering Data**: Allow users to filter displayed data based on selected criteria.
* **Navigation Menus**: Create dropdown menus for navigating between different sections or pages.
