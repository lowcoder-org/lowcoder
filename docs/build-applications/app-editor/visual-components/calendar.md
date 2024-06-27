# Calendar

The Calendar Component is a feature-rich way to organize and edit date and calendar entries in Lowcoder. To offer the best experience for Calendars, we integrated the [fullcalendar.io](https://fullcalendar.io/docs) Project.

You can refer to the documentation like this: [https://fullcalendar.io/docs](https://fullcalendar.io/docs)

<figure><img src="../../../.gitbook/assets/Component Calendar  Overview.png" alt=""><figcaption></figcaption></figure>

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

