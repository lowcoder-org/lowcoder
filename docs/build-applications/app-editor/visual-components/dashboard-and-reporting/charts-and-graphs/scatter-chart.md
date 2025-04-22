# Scatter Chart

In Lowcoder, the **Scatter Chart** component is ideal for visualizing relationships and distributions between two numerical variables. It displays data points as individual dots on a two-dimensional plane, making it effective for identifying correlations, clusters, and outliers within datasets.

#### Key Features

**1. Data Binding**

The Scatter Chart accepts data in the form of an array of JavaScript objects, each containing fields for the X and Y coordinates. For example:

```json
[
  { "x": 10, "y": 20 },
  { "x": 15, "y": 25 },
  { "x": 20, "y": 30 }
]
```

You can also utilize JavaScript within `{{ }}` to reference or transform data dynamically, enabling integration with other components or queries.

**2. Chart Configuration**

Customize the Scatter Chart through the Properties panel:

* **Axes Configuration:** Define the X and Y axes to represent the appropriate numerical fields from your data.
* **Series Management:** Manage multiple data series to compare different datasets within the same chart.

These configurations allow for a tailored visualisation that aligns with your specific data representation needs.

**3. Dynamic Data Transformation**

Leverage JavaScript transformers to manipulate and format data before rendering. This is particularly useful when dealing with data from queries that require restructuring to fit the chart's expected format. For instance:

```javascript
let xValues = query1.data.x;
let yValues = query1.data.y;
let result = [];

for (let i = 0; i < xValues.length; i++) {
  result.push({ x: xValues[i], y: yValues[i] });
}

return result;
```

Then, reference the value of the transformer `{{transformer1.value}}` as the data source for the chart.

**4. Styling and Theming**

Enhance the visual appeal of your Scatter Chart by customizing styles:

* **Colors and Fonts:** Adjust colors, fonts, and other stylistic elements to match your application's theme.
* **ECharts Integration:** For advanced customization, integrate Apache ECharts by providing a JSON configuration in the chart's settings. This allows for detailed control over aspects like point size, color gradients, and interactive behaviours.

### Component Playground

{% embed url="https://app.lowcoder.cloud/playground/chart/1" %}

### Component Auto-Docs

{% embed url="https://app.lowcoder.cloud/components/scatterChart" %}
