# List View

The component **List View** displays rows of data. Similar to Form, Modal, and Drawer, it is also a container-like component that can hold other components or modules. For list viewing data, you first bind the data to a **List View** component and configure the naming rules for the items. Then, you design the display of the first row by dragging and dropping components, and this layout will be applied to all items within this component.

The following is a demo of **List View**, displaying movies from [IMDB](https://www.imdb.com/chart/top/?ref_=nv_mv_250) :&#x20;

{% embed url="https://demos.lowcoder.cloud/demo/clz2tcvmi3cb5z9kdmrxcm9kl" %}

Drag and drop **List View** onto the canvas. Each item contains an **Image**, a **Title** with **URL/Link** and a **Rating** component. You can update the exhibition of the whole **List View** component by configuring the layout of the first entry.

Click the **Title** component, and you will redirected to Movie page in a new Tab.

The **List View** component retrieves data from a JSON array of objects and displays an **Image**, a **Title** and a **Rating** component for each entry. You can also pass query results to a **List View** and show dynamic data inside **List View** component. Following demo shows a **List View** showing Dynamic data via a REST query.

{% embed url="https://demos.lowcoder.cloud/demo/clz2ubz2v3csqz9kdxugs5szi" %}

## Bind data

The data of a **List View** component accepts two types of values: number and array.

* Number: Numbers are processed as row count and no valid data is passed into the **List View** component.
* Array: The length of an array is passed as row count and each entry in the array is processed as a JS object in JSON format, corresponding to a row in the **List View** component. For example, the following data contains two rows of data, each containing four fields: `rate`, `title`, `url`, and `cover`.

```json
[
    {
        "rate": "9.2",
        "title": "The Shawshank Redemption",
        "url": "https://www.imdb.com/title/tt0111161/",
        "cover": "https://m.media-amazon.com/images/M/MV5BMDFkYTc0MGEtZmNhMC00ZDIzLWFmNTEtODM1ZmRlYWMwMWFmXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_UY67_CR0,0,45,67_AL_.jpg"
    },
    {
        "rate": "9.2",
        "title": "The Godfather",
        "url": "https://www.imdb.com/title/tt0068646/",
        "cover": "https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_UY67_CR1,0,45,67_AL_.jpg"
    }
]
```

You can view the detailed data about the **List View** component, its items, the properties, etc., in the data browser.

## Display data in inside components

After binding valid data to **List View** component and designing its inside components, you can add data to these components. **List View** supports local variables `currentItem` and `i`. Notice that you only need to change data of the first row, and the same settings are applied to the other rows automatically.

## Name items

You can set the item index names and item data names. This is useful when embedding a list in another list. For example, you can set the index of one list as `i`, and the inner nested `j` to avoid naming conflict.

### Item index name

By default, item index is named as`i`, referring to the index of list data and starting from zero. Besides using `i` as numbers, you can also use `i` to dynamically access data from query results.

For example, to access the `title` field from the object`Data` in the **Text** component, write the following code.

```javascript
{{listview1.data[i].title}}
```

Then you can see the Movies title displayed in **List View** by index order.

### Item data name

By default, you can reference the value of each item within a list using variable `currentItem`. For example, to display a serial number plus Movie Title, write the following code in `text` value.

```javascript
{{i+1}}. {{currentItem.title}}
```

{% hint style="info" %}
Circular dependency errors occur when you reference the data of a row by `listView.items[i]` from a component inside a **List View** component. It is recommended to use such reference only outside the list.
{% endhint %}

## Pagination

### Quick jumper

Toggle "Show quick jumper" or set its value to `true` to allow your users quickly jump to the specified page.

### Page size

You can configure whether to allow your users to customize how many items to be displayed on a single page by enabling or disabling the "Show size changer button" or set its value in JS. When disabled, you can set the default page size.

If enabled, you can configure several page sizes for your users to select.

### Total row count

By default, the total row count of a **List View** component is the number of current data items. You can also insert a value from a query. For example, `{{query1.data[0].count}}`.

## Reference List View items outside

**List View** supports exposing data of inside components with **Items** field. You can inspect the **Data Browser** in the left pane.

For example, drag an **Input** component into **List View**, and then you can reference the value of the **Rating** component in components outside the **List View** by the following code.

```javascript
{{listView1.items[0].rating1.value}}
```

### Component Playground

On Component Playground, you can interact with the List View component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the component.

### Component Auto-Docs

In the Auto-Docs of List View component, we have shown how to use different properties of the list View component. It also includes the Styling properties of the component.

{% embed url="https://app.lowcoder.cloud/components/listView" %}

### Properties of List View Component

<table><thead><tr><th>Property Name</th><th width="454.8515625">Description</th></tr></thead><tbody><tr><td>data</td><td>JSON data used in the current ListView component</td></tr><tr><td>hidden</td><td>Returns True or False based on whether the ListView component is hidden or not</td></tr><tr><td>items</td><td>Exposing data of all the components inside the ListView component</td></tr><tr><td>pageNo</td><td>Returns the current Page Number of the ListView component</td></tr></tbody></table>

### &#x20;Methods

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.&#x20;

**setPage() :**&#x20;

listView1.setPage() method sets the ListView's page property to be displayed on the ListView component. e.g. following code will set the 3nd page on the ListView component :

```javascript
listView1.setPage(3);
```
