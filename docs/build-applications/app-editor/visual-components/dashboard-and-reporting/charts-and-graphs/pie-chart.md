# Pie Chart

In Lowcoder, the **Pie Chart** component is a powerful tool for visualizing proportional data, allowing developers to represent parts of a whole in a clear and concise manner. This component is particularly effective for displaying percentage distributions, comparisons, and compositions within datasets.

#### Key Features

**1. Data Binding**

The Pie Chart component supports data binding through arrays of JavaScript objects. Each object should contain fields that represent the category and its corresponding value. For example:

```json
[
  { "category": "Apples", "value": 30 },
  { "category": "Bananas", "value": 45 },
  { "category": "Cherries", "value": 25 }
]
```

This structure allows for straightforward mapping of categories to their respective values on the chart. Additionally, you can utilize JavaScript within `{{ }}` to reference or transform data dynamically, enabling integration with other components or queries.

**2. Chart Configuration**

Customize the Pie Chart through the Properties panel:

* **Category Field:** Define the field that represents the categories (slices) of the pie.
* **Value Field:** Specify the field that holds the numerical values corresponding to each category.

These configurations allow for a tailored visualisation that aligns with your specific data representation needs.

**3. Dynamic Data Transformation**

Leverage JavaScript transformers to manipulate and format data before rendering. This is particularly useful when dealing with data from queries that require restructuring to fit the chart's expected format. For instance, transforming query results into the desired format for the chart.

**4. Styling and Theming**

Enhance the visual appeal of your Pie Chart by customizing styles:

* **Colors and Fonts:** Adjust colors, fonts, and other stylistic elements to match your application's theme.
* **ECharts Integration:** For advanced customisation, integrate Apache ECharts by providing a JSON configuration in the chart's settings.&#x20;

These styling options ensure that your chart aligns with the overall design aesthetics of your application.

By utilising the Pie Chart component in Lowcoder, developers can effectively present and analyze proportional data, facilitating informed decision-making and enhancing the application's analytical capabilities.

### Component Playground

{% embed url="https://app.lowcoder.cloud/playground/chart/1" %}

### Component Auto-Docs

{% embed url="https://app.lowcoder.cloud/components/pieChart" %}
