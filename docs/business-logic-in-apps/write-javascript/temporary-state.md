# Temporary state

Temporary states in Lowcoder are a powerful feature used to manage complex variables that dynamically update the state of components in your application. These states act as intermediary or transient storage for data that can change over time due to user interactions or other processes.

In Lowcoder, temporary states are particularly useful when dealing with scenarios where the state of a component needs to be updated based on user input or other dynamic conditions. By binding these states to components using Handlebars syntax, you can create highly interactive and responsive user interfaces.

Here's a brief overview of how temporary states work in Lowcoder:

1. **Definition and Initialization**: Temporary states are defined within the Lowcoder environment. They are initialized with a default value, which can be a simple data type like a string or number, or more complex objects and arrays.
2. **Binding to Components**: These states are then bound to UI components using Handlebars syntax. For example, `{{tempState}}` would bind the value of `tempState` to a component. This binding ensures that any changes to the temporary state are immediately reflected in the component.
3. **Dynamic Updates**: As users interact with the application, actions such as clicking a button, entering text, or selecting an option from a dropdown can trigger updates to these temporary states. This could be as simple as updating a text value or as complex as altering an array or object structure.
4. **Reactivity**: The key advantage of using temporary states is their reactivity. When a temporary state changes, all components bound to that state automatically update to reflect the new value. This reactivity is crucial for creating dynamic and fluid user experiences.
5. **Use Cases**: Common use cases for temporary states include form input handling, visibility toggling of UI elements, temporary storage of user selections, and managing the state of interactive elements like accordions, tabs, and modals.
6. **Lifecycle**: Temporary states in Lowcoder are typically short-lived. They exist for the duration of a specific task or user interaction and do not persist across different sessions or page reloads, unlike more permanent state management solutions.

By leveraging temporary states, Lowcoder allows developers to build complex, state-driven applications with ease, ensuring that the UI stays consistent with the underlying application state and providing a seamless experience for the end-user.

## Use case scenarios

Temporary states may help in the following scenarios:

* To track the temporary values of a variable when the user interacts with your app.
* To store your data only in operation without persisting to a database.
* To function as a temporary property when built-in properties in Lowcoder (such as `{{table.selectedRow}}` and `{{select.value}}`) do not support your use case.

{% hint style="info" %}
To store and access data across apps in your workspace, use localStorage instead.
{% endhint %}

## Create a temporary state

Click **+ New** and select **Temporary state** in query editor.

You can rename the temporary state and set an initial value.

## Set state values

Temporary state offers `setValue()` and `setIn()` methods to set or change its value, which can be called in JavaScript queries.

Use `setValue()` to change the value directly.

```javascript
//state.setValue(value: any)
state.setValue(3)
state.setValue(input1.value)
```

When the initial value of a temporary state is an object, use `setIn()` to change the value in a specified path.

```javascript
// initial value of state2 as follows：
{
    girl: {
        name: "Lucy",
        age: 18,
        city: {
            name: "New York"
        }
     }
     boy: {
         name: "Bob",
         age: 21,
         city: {
             name: "Los Angeles"
         }
     }
}
//To change the value in a specified path
//state.setIn(path, any value)
//path: an array of keys or indexes. Only the last item in the path will be changed.
state2.setIn(['girl','city'],{name:'Seatle'})
state2.setIn(['boy','age'],18)


// To set value array value, you can use 
// init value = ["hello", "world"]
state2.setIn([1],"foo") // this will result to ["hello", "foo"]
```

You can also call these two methods in event handlers. Select **Set temporary state** as the action and choose method on demand.

## Example: Multiple Steps Job application app

In this example, we are building an app via which an Applicant can apply for a job by going via different steps. We will use Temporary state variable to store data on each step, and  will show all the data on the final step from Temporary state variable.

The following demo shows all the steps of creating this app, and explains in detail the usage of Temporary state :&#x20;

{% embed url="https://app.supademo.com/demo/clyikd4yd03wbphh054on5hh2" %}
