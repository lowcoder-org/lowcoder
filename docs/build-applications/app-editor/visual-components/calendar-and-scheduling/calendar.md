# Calendar

The Calendar Component is a feature-rich way to organize and edit date and calendar entries in Lowcoder. To offer the best experience for Calendars, we integrated the [fullcalendar.io](https://fullcalendar.io/docs) Project.

You can refer to the documentation like this: [https://fullcalendar.io/docs](https://fullcalendar.io/docs)

<figure><img src="../../../../.gitbook/assets/Component Calendar  Overview.png" alt=""><figcaption></figcaption></figure>

### Dynamic Data for Events

In the "Basic" section, you can bind your Datasource to feed the calendar with your existing Events.

The JSON structure is an array of objects, where each object represents a single event on the calendar. Here's a breakdown of what each key in the object means:

* **`id`**: A unique identifier for the event. This is a string that helps distinguish each event from others.
* **`title`**: The name or title of the event. This is a brief description that will be displayed on the calendar to represent the event.
* **`start`**: The start date and time of the event. This should be in the format "YYYY-MM-DD HH:MM:SS". For all-day events, you can omit the time part and only provide the date.
* **`end`**: The end date and time of the event, following the same format as the start date. For all-day events that last multiple days, this indicates the end date.
* **`color`**: (Optional) A string representing the color code (in hexadecimal format) to be used for the event's display on the calendar. This allows for visual differentiation between different types of events.
* **`allDay`**: (Optional) A boolean value (`true` or `false`) indicating whether the event lasts all day. If `true`, the event will be shown as an all-day event, possibly in a different section of the calendar or styled differently. If this key is omitted, the event is treated as having specific start and end times.

```
[
    {
        "id": "1",
        "title": "Coding",
        "start": "2024-03-04 09:00:00",
        "end": "2024-03-04 23:30:00",
        "color": "#079968",
        "allDay": true
    },...
]
```

As soon as a user edits or adds a new Event, the data object is updated so that you can persist this change on your chosen Datasource.&#x20;

```
// Access all current calendar event data
return calendar1.events;
```

### Editable Calendar

Based on the Setting "Editable" you can allow your Application Users to add or edit own Calendar Events. A small modal opens and allows the entry of Event information.

### Premium Views

To display the Premium Views (Resource Timeline and Resource Grid), you must purchase a License at [https://fullcalendar.io/purchase](https://fullcalendar.io/purchase) per Developer Seat. This License is then valid for all App Users in the Role "Member / Viewer".

You can enter the License Key in the Property Settings Menu. As soon as you enter the License Key, the Premium Views will be available at the Dropdown "Default View".

### Properties of the Calendar

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.&#x20;

<table><thead><tr><th width="168.40234375">Property Name</th><th width="144.2265625">Type</th><th>Description</th></tr></thead><tbody><tr><td>allEvents</td><td>Array</td><td>An array of Objects containing list of all the Events on a Calendar component</td></tr><tr><td>events</td><td>Array</td><td></td></tr><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Form component is hidden or not</td></tr><tr><td>resources</td><td>Array</td><td></td></tr><tr><td>resourcesEvents</td><td>Array</td><td></td></tr><tr><td>toDeletedEvents</td><td>Object</td><td></td></tr><tr><td>toInsertedEvents</td><td>Object</td><td>An Object to be Inserted as a new Event in the Calendar </td></tr><tr><td>toUpdatedEvents</td><td>Object</td><td>An Object to be updated as an Event in the Calendar</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="175.01953125">Event Name</th><th width="442.3671875">Description</th></tr></thead><tbody><tr><td>Change</td><td>When a User make any"changes" to the Calendar component.</td></tr><tr><td>Double Click</td><td>When a User "Double Click" on an Event or a Time slot.</td></tr><tr><td>Drag</td><td>When a User "Drags" an Event.</td></tr><tr><td>Drop</td><td>When a User "Drops" an Event.</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

<table><thead><tr><th width="247.83984375">Method Name</th><th width="446.3984375">Description</th></tr></thead><tbody><tr><td>clearDeletedEvents</td><td>Clears the data in the property toDeletedEvent</td></tr><tr><td>clearInsertedEvents</td><td>Clears the data in the property toInsertedEvent</td></tr><tr><td>clearUpdatedEvents</td><td>Clears the data in the property toUpdatedEvent</td></tr><tr><td>setResources</td><td>Set the data for the property Resources</td></tr><tr><td>clearResources</td><td>Clear the data for the property Resources</td></tr><tr><td>resetResources</td><td>Reset the data for the property Resources</td></tr><tr><td>setDayGridDayView</td><td>Switches the Calendar view to 'Day Grid Day', displaying a Single day in a grid layout that includes all events for that day.</td></tr><tr><td>setDayGridWeeklyView</td><td>Switches the Calendar view to 'Day Grid Week', where the days of the week are displayed as Columns and Events are laid out in Grid form.</td></tr><tr><td>setDayGridMonthlyView</td><td>Switches the Calendar view to 'Day Grid Month', presenting the entire month in a grid with events displayed on their respective days.</td></tr><tr><td>setListWeekView</td><td>Switches the Calendar view to 'List Week', which provides a list-style overview of all the events happening throughout the week.</td></tr><tr><td>setMultiMonthYearView</td><td>Switches the Calendar view to 'Multi Month Year', showing multiple months at once, allowing for long-term planning and overview.</td></tr><tr><td>setResourceTimeGridDayView</td><td>Switches the Calendar view to 'Resource Time Grid Day', which displays resources along the vertical axis and the hours of the Single day along the horizontal axis.</td></tr><tr><td>setResourceTimelineDayView</td><td>Switches the Calendar view to 'Resource Timeline Day', showing Events against a timeline for a Single day, segmented by Resources.</td></tr><tr><td>setTimeGridDayView</td><td>Switches the Calendar view to 'Time Grid Day', which shows a detailed hourly schedule for a Single day.</td></tr><tr><td>setTimeGridWeekView</td><td>Switches the Calendar view to 'Day Grid Week', where the days of the week are displayed as Columns and Events are laid out in Grid form.</td></tr></tbody></table>

