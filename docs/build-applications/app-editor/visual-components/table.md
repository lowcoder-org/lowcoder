# Table

The Standard Table is a highly functional and feature-rich component. It is recommended for Server-Side paging and filtering when data display for tables needs many individual settings.

The Lowcoder Table supports auto-size as a component as well as fixed size, where the Header and Toolbar can be fixed when the Table-Body is scrollable.

{% embed url="https://app.supademo.com/demo/NEYc5eNZNchrXkpjo2GJs" %}
Header & Toolbar can be fixed
{% endembed %}

The Borders of Tables can be set individually for the whole table till down to the individual cell.

{% embed url="https://app.supademo.com/demo/9SG70olbmEvAIdCnYJxWm" %}
Individual Settings for Borders in Tables
{% endembed %}

{% embed url="https://app.supademo.com/demo/CJMoAPTKk3mZiSJeEYqDr" %}
Individual Grid Settings in the Table
{% endembed %}

Also, the Text Styles can be individualized for every column.

{% embed url="https://app.supademo.com/demo/BQZNtDeTNXX9gVKD292sq" %}

### Component Playground

{% embed url="https://app.lowcoder.cloud/playground/table/1" %}

### Component Auto-Docs

{% embed url="https://app.lowcoder.cloud/components/table" %}

### Properties of the Table

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries. \


{% hint style="warning" %}
Properties are read-only
{% endhint %}

| Property Name   | Type    | Description                                                                                                                                        |
| --------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| selectedRow     | Object  | Provides Data for the Currently Selected Row, Indicating the Row That Triggers a Click Event If the User Clicks a Button/Link on the Row           |
| selectedRows    | Array   | Useful in Multiple Selection Mode, Same as SelectedRow                                                                                             |
| selectedIndex   |         | Selected Index in Display Data                                                                                                                     |
| selectedIndexes | Array   | Selected Index in Display Data                                                                                                                     |
| changeSet       | Object  | An Object Representing Changes to an Editable Table, Only Contains the Changed Cell. Rows Go First and Columns Go Second.                          |
| toUpdateRows    | Array   | An Array of Objects for Rows to Be Updated in Editable Tables.                                                                                     |
| pageNo          | Number  | Current Display Page, Starting from 1                                                                                                              |
| pageSize        | Number  | How Many Rows per Page                                                                                                                             |
| sortColumn      |         | The Name of the Currently Selected Sorted Column                                                                                                   |
| sortDesc        | Boolean | Whether the Current Row Is in Descending Order                                                                                                     |
| pageOffset      | Number  | The Current Start of Paging, Used for Paging to Get Data. Example: Select \* from Users Limit \{{table1.pageSize\}} Offset \{{table1.pageOffset\}} |
| displayData     | Array   | Data Displayed in the Current Table                                                                                                                |
| filter          | Object  | Table Filtering Parameters                                                                                                                         |
| data            | Array   | The JSON Data for the Table                                                                                                                        |

### Events

Events give you the ability to trigger further actions (with Event-Handlers)

| Event Name        | Description                            |
| ----------------- | -------------------------------------- |
| Save Changes      | When a user clicks "Save Changes"      |
| Cancel Changes    | When a user decide to skip Changes     |
| Row Select Change | When the selected Row Change           |
| Row Click         | When a Row is Clicked                  |
| Row Expand        | When a Row gets Expanded               |
| Row Shrink        | When a expanded Row shrink             |
| Column Edited     | When a Column gets Edited              |
| Search            | When a user make a global Search       |
| Download          | When a user Download Table Data        |
| Filter Change     | When a Filter Change                   |
| Sort Change       | When a Sorting Change                  |
| Page Change       | When a user changes the displayed Page |
| Refresh           | When a user Refresh the Table View     |

### Methods

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events

| Method Name     | Description                               |
| --------------- | ----------------------------------------- |
| setFilter       | Set the Value of Property filter          |
| setPage         | Set the Value of Property page            |
| setSort         | Set the Value of Property sort            |
| resetSelections | Set the Value of Property resetselections |

\
