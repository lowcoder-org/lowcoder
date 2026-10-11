# Rating

## ⭐ Rating Component in Lowcoder

<figure><img src="../../../../.gitbook/assets/frame_generic_light (9) (2).png" alt=""><figcaption></figcaption></figure>

### 🔧 Key Features

* **Customizable Scale**: Define the number of rating units (e.g., stars) to suit your application's needs.
* **Half-Star Support**: Enable half-star increments for more precise ratings.
* **Read-Only Mode**: Display ratings without allowing user interaction, useful for showcasing average ratings.
* **Dynamic Binding**: Bind the rating value to data sources or variables for real-time updates.
* **Event Handling**: Trigger actions based on user interactions, such as submitting a rating or displaying a message.

### 🛠 Configuration Options

* **Maximum Rating**: Set the total number of rating units (e.g., 5 stars).
* **Allow Half Ratings**: Enable or disable half-star selections.
* **Default Value**: Specify the initial rating value displayed.
* **Read-Only**: Determine whether the rating is interactive or display-only.
* **Styling**: Customize the appearance, including size, color, and spacing, to match your application's design.

### ⚙️ Integration Tips

* **Data Binding**: Use Lowcoder's data binding syntax (`{{ }}`) to connect the rating value to variables or data sources.
* **Event Handling**: Implement event handlers to perform actions when the rating changes, such as updating a database or triggering a notification.
* **Combining with Other Components**: Integrate the Rating component with forms or feedback sections to collect comprehensive user input.

### Component Playground

On Component Playground, you can interact with the Rating component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Rating component.

{% embed url="https://app.lowcoder.cloud/playground/rating/1" %}

### Component Auto-Docs

In the Auto-Docs of Rating component, we have shown how to use different properties of the Rating component. It also includes the Styling properties of the Rating component.

{% embed url="https://app.lowcoder.cloud/components/rating" %}

#### Properties of the Rating component <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="175.97265625">Property Name</th><th width="114.05859375">Type</th><th>Description</th></tr></thead><tbody><tr><td>value</td><td>String</td><td>Returns the current value of the Rating component</td></tr><tr><td>disabled</td><td>Boolean</td><td>Returns True or False based on whether the Rating component is disabled or not</td></tr><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Rating component is hidden or not</td></tr><tr><td>max</td><td>Number</td><td>Returns the maximum value of the Rating component</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="166.04296875">Event Name</th><th width="458.8515625">Description</th></tr></thead><tbody><tr><td>Change</td><td>Triggers, when anything changes on the Rating component</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

**setValue() :**&#x20;

rating1.setValue() method sets the Rating component's Value property, which gets shown in the Rating component.

```javascript
rating1.setValue(3);
```

**clearValue() :**&#x20;

rating1.clearValue() clears the Rating component's Value property and empties the value from the Rating component.

```javascript
rating1.clearValue();
```

**resetValue() :**&#x20;

select1.resetValue()  method resets the Rating component's value property to the default value of the Rating component.

```javascript
rating1.resetValue();
```

**setDefaultValue() :**&#x20;

select1.setDefaultValue() method sets the Rating component's Default value, which gets shown in the Rating component as default.

```javascript
rating1.setDefaultValue(2);
```

**clearDefaultValue() :**&#x20;

select1.clearDefaultValue() clears the Rating component's Default value and empties the value from the Rating component.

```javascript
rating1.clearDefaultValue();
```

**resetDefaultValue() :**&#x20;

select1.resetDefaultValue()  method resets the Rating component's Default value to the default value of the Rating component.

```javascript
rating1.resetDefaultValue();
```

### 📌 Use Cases

* **Product Reviews**: Allow customers to rate products they've purchased.
* **Service Feedback**: Collect user ratings on services provided.
* **Content Evaluation**: Enable users to rate articles, videos, or other content.
* **Performance Assessments**: Gather evaluations for employees, students, or systems.
