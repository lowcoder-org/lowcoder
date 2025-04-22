# Line Chart

In Lowcoder, the **Line Chart** component is a powerful tool for visualizing trends and changes over time or across categories. It connects individual data points with lines, making it ideal for tracking progressions, comparisons, and patterns within datasets.

#### Key Features

**1. Data Binding**

The Line Chart component supports data binding through arrays of JavaScript objects. Each object represents a data point with specific fields corresponding to chart axes. For example:

```json
[
  { "date": "2022-03-01", "category": "A", "value": 10 },
  { "date": "2022-03-02", "category": "B", "value": 15 },
  { "date": "2022-03-03", "category": "A", "value": 20 }
]
```

This structure allows for straightforward mapping of data onto the chart's axes. Additionally, you can utilize JavaScript within `{{ }}` to reference or transform data dynamically, enabling integration with other components or queries.

**2. Chart Configuration**

Customize the Line Chart through the Properties panel:

* **X-Axis Configuration:** Define the X-axis to represent categories, values, time, or logarithmic scales, depending on your data.
* **Series Management:** Manage multiple data series to compare different datasets within the same chart.

These configurations allow for a tailored visualization that aligns with your specific data representation needs.

**3. Dynamic Data Transformation**

Leverage JavaScript transformers to manipulate and format data before rendering:

```javascript
let dates = query1.data.date;
let categories = query1.data.category;
let values = query1.data.value;
let result = [];

for (let i = 0; i < dates.length; i++) {
  result.push({ date: dates[i], category: categories[i], value: values[i] });
}

return result;
```

This approach is particularly useful when dealing with data from queries that require restructuring to fit the chart's expected format.&#x20;

**4. Styling and Theming**

Enhance the visual appeal of your Line Chart by customizing styles:

* **Colors and Fonts:** Adjust colors, fonts, and other stylistic elements to match your application's theme.
* **ECharts Integration:** For advanced customization, integrate Apache ECharts by providing a JSON configuration in the chart's settings.

These styling options ensure that your chart aligns with the overall design aesthetics of your application.

### Component Playground

{% embed url="https://app.lowcoder.cloud/playground/chart/1" %}

### Component Auto-Docs

{% embed url="https://app.lowcoder.cloud/components/lineChart" %}
