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

Also, the Text Styles can be individualised for every column.

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
| selectedIndexes | Array   | Useful in Multiple selection mode, Selected Indexes in Display Data                                                                                |
| changeSet       | Object  | An Object Representing Changes to an Editable Table, Only Contains the Changed Cell. Rows Go First and Columns Go Second.                          |
| toUpdateRows    | Array   | An Array of Objects for Rows to Be Updated in Editable Tables.                                                                                     |
| pageNo          | Number  | Current Display Page, Starting from 1                                                                                                              |
| pageSize        | Number  | How Many Rows per Page                                                                                                                             |
| sortColumn      | Object  | The Name of the Currently Selected Sorted Column                                                                                                   |
| sortDesc        | Boolean | Whether the Current Row Is in Descending Order                                                                                                     |
| pageOffset      | Number  | The Current Start of Paging, Used for Paging to Get Data. Example: Select \* from Users Limit \{{table1.pageSize\}} Offset \{{table1.pageOffset\}} |
| displayData     | Array   | Data Displayed in the Current Table                                                                                                                |
| filter          | Object  | Table Filtering Parameters                                                                                                                         |
| data            | Array   | The JSON Data for the Table                                                                                                                        |
| insertSet       | Object  | An Object representing the data of the Rows to be inserted in a Table                                                                              |
| selectedCell    | Object  | Provides Column name and index of the Selected Cell                                                                                                |
| sortColumns     | Array   | The Name of the Currently Selected Sorted Columns                                                                                                  |
| toInsertRows    | Array   | An Array of Objects for Rows to Be Inserted in Editable Tables.                                                                                    |

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

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.&#x20;

**setPage() :**&#x20;

table1.setPage() method sets the table's page property to be displayed on Table component. e.g. following code will set the 2nd page on the Table component :

```javascript
table1.setPage(2);
```

**setFilter() :**&#x20;

table1.setFilter() method sets single or multiple Filter conditions on the Table's data, and in return Table shows the filtered data as per the conditions set in the setFilter() method. Here's how it works :&#x20;

```javascript
// Single Filter condition
table1.setFilter({
  stackType: 'and',
  filters: [
  {
    columnKey: 'name',
    filterValue: 'Mano',
    operator: 'contain'
  }
  ]
})
```

In the above code, "stackType" sets the condition of "AND" or "OR" among different Filters. "filters" array include the  columnKey, filterValue and the operator.

```javascript
// Multiple Filter conditions
table1.setFilter({
  stackType: 'and',
  filters: [
    {
    columnKey: 'name',
    filterValue: 'a',
    operator: 'contain'
  },
  {
    columnKey: 'id',
    filterValue: '1',
    operator: 'contain'
  }
]
})
```

In the above code, we have applied multiple filters on the Table.

**setSort() :**&#x20;

table1.setSort() method sorts an individual column on a Table in ascending or descending order. It takes two arguments :&#x20;

1. ColumnKey
2. Descending order

```javascript
// Descending order set to True
table1.setSort("id", true);
```

The above code sorts the "ID" column in descending order. If descending order is set to 'false', then it will sort the "ID" column in ascending order.

**setMultiSort() :**&#x20;

table1.setMultiSort() method sorts the Table in ascending or descending order, based on multiple columns. It sorts first based on 1st column , and then based on the 2nd column :&#x20;

```javascript
// MultiSort
table1.setMultiSort([
  {
    "column": "name",
    "desc": true
  },
  {
    "column": "id",
    "desc": false
  }])
```

**resetSelections() :**&#x20;

table1.resetSelections() method resets the selected Row or Rows to the default ones. By default, 1st Row is selected in the Table in case of Single Row Select. If you click on let say 5th Row of the Table, it will get selected and if you run following code, then the table's 1st Row will be selected.

In case of multiple row selected, following code will deselect all the selected rows.

```javascript
table1.resetSelections();
```

**cancelChanges() :**&#x20;

table1.cancelChanges() method cancels the Updated + Inserted changes on an Editable table. Updated changes are those which you make to the existing Table data/rows. Inserted changes are the new Rows that you insert on the Table

```javascript
table1.cancelChanges();
```

**cancelInsertChanges() :**&#x20;

table1.cancelInsertChanges() method only cancels the inserted changes on an Editable table.

```javascript
table1.cancelInsertChanges();
```
