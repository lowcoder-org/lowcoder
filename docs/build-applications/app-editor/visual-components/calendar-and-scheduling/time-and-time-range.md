# Time & Time Range

## 🕒 Time & Time Range Components in Lowcoder

Lowcoder offers intuitive and customisable components for time selection, enabling users to seamlessly incorporate time inputs into their applications.

### ⏰ Time Component

The **Time** component allows users to select a specific time value through an interactive interface.

#### 🔧 Key Features

* **User-Friendly Interface** Provides a clock or dropdown interface for easy time selectio.
* **Customisable Format** Supports various time formats (e.g., 12-hour or 24-hour) to match application requirement.
* **Data Binding** Easily bind the selected time to other components or queries within the app.
* **Event Handling** Trigger actions based on user interactions, such as time selection change.

#### 🛠 Configuration Options

* _**Default Time**_**:** Set an initial time value.
* _**Minimum and Maximum Times**_**:** Restrict selectable times within a specific range.
* _**Disabled Times**_**:** Specify times that should be unselectable.
* _**Placeholder Text**_**:** Provide guidance when no time is selected.

#### ⚙️ Integration Tips

*   _**Formatting**_**:** Utilize Day.js, which is integrated into Lowcoder, for time formatting and manipulation. For exampe:

    ```javascript
    {{ dayjs(time1.value).format('HH:mm') }}
    ```
* _**Event Handling**_**:** Use event handlers to perform actions when the time value changes.

#### Components Playground

On Component Playground, you can interact with the Time component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Time component.

{% embed url="https://app.lowcoder.cloud/playground/time/1" %}

#### Components Auto-Docs

In the Auto-Docs of Time component, we have shown how to use different properties of the Time component. It also includes the Styling properties of the Time component.

{% embed url="https://app.lowcoder.cloud/components/time" %}

### 🕘🕒 Time Range Component

The **Time Range** component enables users to select a start and end time, facilitating the selection of a time interval.

#### 🔧 Key Features

* **Dual Time Selecting**: Allows selection of both start and end times.
* **Preset Ranges**: Optionally provide quick selection options like "Business Hours" or "Evening Shift".
* **Data Binding**: Bind the selected time range to other components or queries.
* **Event Handling**: Trigger actions based on changes to the selected time range.

#### 🛠 Configuration Options

* **Default Range**: Set initial start and end times.
* **Minimum and Maximum Times**: Define the allowable range for selection.
* **Disabled Times**: Specify times that should be unselectable within the range.
* **Separator**: Customize the separator between start and end times in the display.

#### ⚙️ Integration Tips

*   **Formatting**: Use Day.js for formatting both start and end times. For example:

    ```javascript
    {{ dayjs(timeRange1.value[0]).format('HH:mm') }} to {{ dayjs(timeRange1.value[1]).format('HH:mm') }}
    ```
* **Event Handling**: Implement event handlers to respond to changes in the selected time range.

#### Components Playground

On Component Playground, you can interact with the Time Range component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Time Range component.

{% embed url="https://app.lowcoder.cloud/playground/timeRange/1" %}

#### Components Auto-Docs

In the Auto-Docs of Time Range component, we have shown how to use different properties of the Time Range component. It also includes the Styling properties of the Time Range component.

{% embed url="https://app.lowcoder.cloud/components/timeRange" %}

### 🔗 Additional Resources

* **Day.js Documentation**: For advanced time manipulation and formatting, refer to the [Day.js Documentation](https://day.js.org/docs/en/get-st/get).

### Properties of the Time & Time Range Components

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.&#x20;

<table><thead><tr><th width="178.92578125">Property Name</th><th width="144.2265625">Type</th><th>Description</th></tr></thead><tbody><tr><td>value</td><td>String</td><td>Returns the String containing Time value of the Time component</td></tr><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the component is hidden or not</td></tr><tr><td>disabled</td><td>Boolean</td><td>Returns True or False based on whether the component is disabled or not</td></tr><tr><td>invalid</td><td>Boolean</td><td>Returns True or False based on whether the component is valid or not</td></tr><tr><td>formattedValue</td><td>String</td><td>Returns the String containing Full Date/Time value ( Date + Time + Time Zone offset ) of the Component</td></tr><tr><td>timeZone</td><td>Object</td><td>Returns TimeZone object, which contains the Name, Offset and TimeZone properties for the Component</td></tr><tr><td>start</td><td>String</td><td>Returns the String containing the Start Time value of the Time Range component</td></tr><tr><td>end</td><td>String</td><td>Returns the String containing the End Time value of the Time Range component</td></tr><tr><td>formattedStartValue</td><td>String</td><td>Returns the String containing Full Start Date/Time value ( Date + Time + Time Zone offset ) of the Time Range Component</td></tr><tr><td>formattedEndValue</td><td>String</td><td>Returns the String containing Full End Date/Time value ( Date + Time + Time Zone offset ) of the Time Range Component</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="175.01953125">Event Name</th><th width="442.3671875">Description</th></tr></thead><tbody><tr><td>Change</td><td>Triggers, when a User make any"changes" to the Component</td></tr><tr><td>Focus</td><td>Triggers, when a User "Clicks" on the Component</td></tr><tr><td>Blur</td><td>Triggers, when a User Clicks outside of the Component i.e, defocuses the component.</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilised. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

**setValue():**&#x20;

time1.setValue() method sets the Time's Value property, which gets selected in the Time component.

```javascript
time1.setValue("13:20:30");
```

**clearValue() :**&#x20;

time1.clearValue() clears the Time's Value property and empties the selected value from the Time component.

```javascript
time1.clearValue();
```

**resetValue() :**&#x20;

time1.resetValue()  method resets the Time's value property to the default value of the Time component.

```javascript
time1.resetValue();
```

**setDefaultValue():**&#x20;

time1.setDefaultValue() method sets the Time's DefaultValue property, which gets selected as default in the Time component.

```javascript
time1.setDefaultValue("09:00:00");
```

**clearDefaultValue() :**&#x20;

time1.clearDefaultValue() clears the Time's DefaultValue property and empties the default value from the Time component.

```javascript
time1.clearDefaultValue();
```

**resetDefaultValue() :**&#x20;

time1.resetDefaultValue()  method resets the Time's Default value property to the default value of the Time component.

```javascript
time1.resetDefaultValue();
```

**setUserTimeZone() :**&#x20;

time1.setUserTimeZone() method sets the Time's TimeZone object property, which sets the TimeZone of  the Time component.

```javascript
time1.setUserTimeZone({
  Name: "GMT+5",
  Offset: "+05:00",
  TimeZone: "Asia/Karachi",
});
```

**clearUserTimeZone() :**

time1.clearUserTimeZone() clears the Time's TimeZone object property and empties the selected/current value of the TimeZone property from the Time component.

```javascript
time1.clearUserTimeZone();
```

**resetUserTimeZone() :**

time1.resetUserTimeZone() method resets the Time's TimeZone object property to the default value of the TimeZone property of the Time component.

```javascript
time1.resetUserTimeZone();
```

**setStart() :**&#x20;

timeRange1.setStart() method sets the Time Range's Start Value property, which sets the Start time of the Time Range component.

```javascript
timeRange1.setStart("13:00:00");
```

**clearStart() :**

timeRange1.clearStart() clears the Time Range's Start Value property and empties the Start Time value from the Time Range component.

```javascript
timeRange1.clearStart();
```

**resetStart() :**&#x20;

timeRange1.resetStart() method resets the Time Range's Start value property to the default Time value of the Time Range component.

```javascript
timeRange1.resetStart();
```

**setEnd() :**&#x20;

timeRange1.setEnd() method sets the Time Range's End Value property, which sets the End time of the Time Range component.

```javascript
timeRange1.setEnd("13:00:00");
```

**clearEnd() :**

timeRange1.clearEnd() clears the Time Range's End Value property and empties the End Time value from the Time Range component.

```javascript
timeRange1.clearEnd();
```

**resetEnd() :**&#x20;

timeRange1.resetEnd() method resets the Time Range's End value property to the default End value of the Time Range component.

```javascript
timeRange1.resetEnd();
```

**setRange() :**&#x20;

timeRange1.setRange() method sets the Range of the Time Range component, i.e, it sets the Start and End time of the Time Range component.

```javascript
timeRange1.setRange("09:00:00","17:00:00");
```

**setDefaultStart() :**&#x20;

timeRange1.setDefaultStart() method sets the Time Range's DefaultStart Value property, which sets the Default Start time of the Time Range component.

```javascript
timeRange1.setDefaultStart("09:00:00");
```

**clearDefaultStart() :**

timeRange1.clearDefaultStart() clears the Time Range's DefaultStart Value property and empties the Default Start Time value from the Time Range component.

```javascript
timeRange1.clearDefaultStart();
```

**resetDefaultStart() :**&#x20;

timeRange1.resetDefaultStart() method resets the Time Range's DefaultStart value property to the default Start value of the Time Range component.

```javascript
timeRange1.resetDefaultStart();
```

**setDefaultEnd() :**&#x20;

timeRange1.setDefaultEnd() method sets the Time Range's DefaultEnd Value property, which sets the Default End time of the Time Range component.

```javascript
timeRange1.setDefaultEnd("17:00:00");
```

**clearDefaultEnd() :**

timeRange1.clearDefaultEnd() clears the Time Range's DefaultEnd Value property and empties the Default End Time value from the Time Range component.

```javascript
timeRange1.clearDefaultEnd();
```

**resetDefaultEnd() :**&#x20;

timeRange1.resetDefaultEnd() method resets the Time Range's DefaultEnd value property to the default End value of the Time Range component.

```javascript
timeRange1.resetDefaultEnd();
```

**clearAll() :**

timeRange1.clearAll() clears all the Properties of the Time Range component.

```javascript
timeRange1.clearAll();
```

**resetAll() :**

timeRange1.resetAll() reset all the Properties of the Time Range component.

```javascript
timeRange1.resetAll();
```

**setUserRangeTimeZone() :**&#x20;

time1.setUserRangeTimeZone() method sets the Time Range's TimeZone object property, which sets the TimeZone of  the Time Range component.

```javascript
timeRange1.setUserRangeTimeZone({
  Name: "GMT+5",
  Offset: "+05:00",
  TimeZone: "Asia/Karachi",
});
```

**clearUserRangeTimeZone() :**

time1.clearUserRangeTimeZone() clears the Time Range's TimeZone object property and empties the selected/current value of the TimeZone property from the Time Range component.

```javascript
timeRange1.clearUserRangeTimeZone();
```

**resetUserRangeTimeZone() :**

time1.resetUserRangeTimeZone() method resets the Time's TimeZone object property to the default value of the TimeZone property of the Time Range component.

```javascript
timeRange1.resetUserRangeTimeZone();
```
