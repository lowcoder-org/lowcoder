# Date & Date Range

## 📅 Date & Date Range Components in Lowcoder

Lowcoder offers intuitive and customisable components for date selection, enabling users to seamlessly incorporate date inputs into their applications.

### 📆 Date Component

The **Date** component allows users to select a single date from a calendar interface.

#### 🔧 Key Features

* _**User-Friendly Interface**_**:** Provides a calendar pop-up for easy date selectin.
* _**Customizable Format**_**:** Supports various date formats to match application requiremens.
* _**Data Binding**_**:** Easily bind the selected date to other components or queries within the ap.
* _**Event Handling**_**:** Trigger actions based on user interactions, such as date selection changs.

#### 🛠 Configuration Options

* _**Default Date**_**:** Set an initial date vaue.
* _**Minimum and Maximum Dates**_**:** Restrict selectable dates within a specific rage.
* _**Disabled Dates**_**:** Specify dates that should be unselectale.
* _**Placeholder Text**_**:** Provide guidance when no date is seleced.

#### ⚙️ Integration Tips

*   _**Formatting**_**:** Utilize Day.js, which is integrated into Lowcoder, for date formatting and manipulation. For examle:

    ```javascript
    {{ dayjs(date1.value).format('YYYY-MM-DD') }}
    ```
* _**Event Handling**_**:** Use event handlers to perform actions when the date value chanes.

#### Components Playground

On Component Playground, you can interact with the Date component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Date component.

{% embed url="https://app.lowcoder.cloud/playground/date/1" %}

#### Components Auto-Docs

In the Auto-Docs of Date component, we have shown how to use different properties of the Date component. It also includes the Styling properties of the Date component.

{% embed url="https://app.lowcoder.cloud/components/date" %}

### 📅📅 Date Range Component

The **Date Range** component enables users to select a start and end date, facilitating the selection of a date interval.

#### 🔧 Key Features

* **Dual Date Selection**: Allows selection of both start and end dates.
* **Preset Ranges**: Optionally provide quick selection options like "Last 7 Days" or "This month".
* **Data Binding**: Bind the selected date range to other components or queries.
* **Event Handling**: Trigger actions based on changes to the selected date range.

#### 🛠 Configuration Options

* **Default Range**: Set initial start and end dates.
* **Minimum and Maximum Dates**: Define the allowable range for selection.
* **Disabled Dates**: Specify dates that should be unselectable within the range.
* **Separator**: Customize the separator between start and end dates in the display.

#### ⚙️ Integration Tips

*   **Formating**: Use Day.js for formatting both start and end dates. For example:

    ```javascript
    {{ dayjs(dateRange1.value[0]).format('YYYY-MM-DD') }} to {{ dayjs(dateRange1.value[1]).format('YYYY-MM-DD') }}
    ```
* **Event Handing**: Implement event handlers to respond to changes in the selected date range.

#### Components Playground

On Component Playground, you can interact with the Date Range component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Date Range component.

{% embed url="https://app.lowcoder.cloud/playground/dateRange/1" %}

#### Components Auto-Docs

In the Auto-Docs of Date Range component, we have shown how to use different properties of the Date Range component. It also includes the Styling properties of the Date Range component.

{% embed url="https://app.lowcoder.cloud/components/dateRange" %}

### 🔗 Additional Resources

* **Day.js Documentation**: For advanced date manipulation and formatting, refer to the [Day.js Documentation](https://day.js.org/docs/en/get-et/get).

### Properties of the Date & Date Range Components

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.&#x20;

<table><thead><tr><th width="178.92578125">Property Name</th><th width="144.2265625">Type</th><th>Description</th></tr></thead><tbody><tr><td>value</td><td>String</td><td>Returns the String containing Date value of the Date component</td></tr><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the component is hidden or not</td></tr><tr><td>disabled</td><td>Boolean</td><td>Returns True or False based on whether the component is disabled or not</td></tr><tr><td>invalid</td><td>Boolean</td><td>Returns True or False based on whether the component is valid or not</td></tr><tr><td>formattedValue</td><td>String</td><td>Returns the String containing Full Date value ( Date + Time + Time Zone offset ) of the Component</td></tr><tr><td>timestamp</td><td>String</td><td>Returns the Timestamp value of the Date component</td></tr><tr><td>timeZone</td><td>Object</td><td>Returns TimeZone object, which contains the Name, Offset and TimeZone properties for the Component</td></tr><tr><td>start</td><td>String</td><td>Returns the String containing the Start Date value of the Date Range component</td></tr><tr><td>end</td><td>String</td><td>Returns the String containing the End Date value of the Date Range component</td></tr><tr><td>startTimestamp</td><td>String</td><td>Returns the String containing the Start Timestamp value of the Date Range component</td></tr><tr><td>endTimestamp</td><td>String</td><td>Returns the String containing the End Timestamp value of the Date Range component</td></tr><tr><td>formattedStartValue</td><td>String</td><td>Returns the String containing Full Start Date value ( Date + Time + Time Zone offset ) of the Date Range Component</td></tr><tr><td>formattedEndValue</td><td>String</td><td>Returns the String containing Full End Date value ( Date + Time + Time Zone offset ) of the Date Range Component</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="175.01953125">Event Name</th><th width="442.3671875">Description</th></tr></thead><tbody><tr><td>Change</td><td>Triggers, when a User make any"changes" to the Component</td></tr><tr><td>Focus</td><td>Triggers, when a User "Clicks" on the Component</td></tr><tr><td>Blur</td><td>Triggers, when a User Clicks outside of the Component i.e, defocuses the component.</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

**setValue():**&#x20;

date1.setValue() method sets the Date's Value property, which gets selected in the Date component.

```javascript
date1.setValue("2026-05-05");
```

**clearValue() :**&#x20;

date1.clearValue() clears the Date's Value property and empties the selected value from the Date component.

```javascript
date1.clearValue();
```

**resetValue() :**&#x20;

date1.resetValue()  method resets the Date's value property to the default value of the Date component.

```javascript
date1.resetValue();
```

**setDefaultValue():**&#x20;

date1.setDefaultValue() method sets the Date's DefaultValue property, which gets selected as default in the Date component.

```javascript
date1.setDefaultValue("2026-05-05");
```

**clearDefaultValue() :**&#x20;

date1.clearDefaultValue() clears the Date's DefaultValue property and empties the default value from the Date component.

```javascript
date1.clearDefaultValue();
```

**resetDefaultValue() :**&#x20;

date1.resetDefaultValue()  method resets the Date's Default value property to the default value of the Date component.

```javascript
date1.resetDefaultValue();
```

**setUserTimeZone() :**&#x20;

date1.setUserTimeZone() method sets the Date's TimeZone object property, which sets the TimeZone of  the Date component.

```javascript
date1.setUserTimeZone({
  Name: "GMT+5",
  Offset: "+05:00",
  TimeZone: "Asia/Karachi",
});
```

**clearUserTimeZone() :**

date1.clearUserTimeZone() clears the Date's TimeZone object property and empties the selected/current value of the TimeZone property from the Date component.

```javascript
date1.clearUserTimeZone();
```

**resetUserTimeZone() :**

date1.resetUserTimeZone() method resets the Date's TimeZone object property to the default value of the TimeZone property of the Date component.

```javascript
date1.resetUserTimeZone();
```

**setStart() :**&#x20;

dateRange1.setStart() method sets the Date Range's Start Value property, which sets the Start date of the Date Range component.

```javascript
dateRange1.setStart("2025-01-01");
```

**clearStart() :**

dateRange1.clearStart() clears the Date Range's Start Value property and empties the Start Date value from the Date Range component.

```javascript
dateRange1.clearStart();
```

**resetStart() :**&#x20;

dateRange1.resetStart() method resets the Date Range's Start value property to the default Start value of the Date Range component.

```javascript
dateRange1.resetStart();
```

**setEnd() :**&#x20;

dateRange1.setEnd() method sets the Date Range's End Value property, which sets the End date of the Date Range component.

```javascript
dateRange1.setEnd("2025-01-01");
```

**clearEnd() :**

dateRange1.clearEnd() clears the Date Range's End Value property and empties the End Date value from the Date Range component.

```javascript
dateRange1.clearEnd();
```

**resetEnd() :**&#x20;

dateRange1.resetEnd() method resets the Date Range's End value property to the default End value of the Date Range component.

```javascript
dateRange1.resetEnd();
```

**setRange() :**&#x20;

dateRange1.setRange() method sets the Range of the Date Range component, i.e, it sets the Start and End dates of the Date Range component.

```javascript
dateRange1.setRange("2025-01-01","2025-12-31");
```

**setDefaultStart() :**&#x20;

dateRange1.setDefaultStart() method sets the Date Range's DefaultStart Value property, which sets the Default Start date of the Date Range component.

```javascript
dateRange1.setDefaultStart("2025-01-01");
```

**clearDefaultStart() :**

dateRange1.clearDefaultStart() clears the Date Range's DefaultStart Value property and empties the Default Start Date value from the Date Range component.

```javascript
dateRange1.clearDefaultStart();
```

**resetDefaultStart() :**&#x20;

dateRange1.resetDefaultStart() method resets the Date Range's DefaultStart value property to the default Start value of the Date Range component.

```javascript
dateRange1.resetDefaultStart();
```

**setDefaultEnd() :**&#x20;

dateRange1.setDefaultEnd() method sets the Date Range's DefaultEnd Value property, which sets the Default End date of the Date Range component.

```javascript
dateRange1.setDefaultEnd("2025-01-01");
```

**clearDefaultEnd() :**

dateRange1.clearDefaultEnd() clears the Date Range's DefaultEnd Value property and empties the Default End Date value from the Date Range component.

```javascript
dateRange1.clearDefaultEnd();
```

**resetDefaultEnd() :**&#x20;

dateRange1.resetDefaultEnd() method resets the Date Range's DefaultEnd value property to the default End value of the Date Range component.

```javascript
dateRange1.resetDefaultEnd();
```

**clearAll() :**

dateRange1.clearAll() clears all the Properties of the Date Range component.

```javascript
dateRange1.clearAll();
```

**resetAll() :**

dateRange1.resetAll() reset all the Properties of the Date Range component.

```javascript
dateRange1.resetAll();
```

**setUserRangeTimeZone() :**&#x20;

date1.setUserRangeTimeZone() method sets the Date Range's TimeZone object property, which sets the TimeZone of  the Date Range component.

```javascript
dateRange1.setUserRangeTimeZone({
  Name: "GMT+5",
  Offset: "+05:00",
  TimeZone: "Asia/Karachi",
});
```

**clearUserRangeTimeZone() :**

date1.clearUserRangeTimeZone() clears the Date Range's TimeZone object property and empties the selected/current value of the TimeZone property from the Date Range component.

```javascript
dateRange1.clearUserRangeTimeZone();
```

**resetUserRangeTimeZone() :**

date1.resetUserRangeTimeZone() method resets the Date's TimeZone object property to the default value of the TimeZone property of the Date Range component.

```javascript
dateRange1.resetUserRangeTimeZone();
```
