# Bar Chart

In Lowcoder, the **Bar Chart** component enables the visualisation of categorical data through rectangular bars, making it ideal for comparing quantities across different categories.

**Key Features:**

1.  **Data Binding:** The Bar Chart can display data from arrays of JavaScript objects, with each object representing a data point. For example:

    ```json
    [
      { "date": "2022-03-01", "fruit": "apple", "count": 4 },
      { "date": "2022-03-01", "fruit": "banana", "count": 6 },
      { "date": "2022-04-01", "fruit": "grape", "count": 10 }
    ]
    ```

This data structure allows for straightforward mapping of categories and values on the chart.

2. **Chart Configuration:** Drag a Bar chart from the Components panel on right side. Adjust settings such as axis types, labels, and series to tailor the chart to your data.
3. **Dynamic Data Transformation:** Utilize JavaScript within Lowcoder to transform and manipulate data before rendering. This is particularly useful when working with data from queries that may need restructuring. For instance, transforming query results into the desired format for the chart.
4. **Styling and Theming:** Apply custom styles to the Bar Chart to match your application's design. This includes modifying colors, fonts, and other visual elements. Additionally, you can integrate Apache ECharts for advanced customization by providing a JSON configuration in the chart's settings.

### Component Playground

{% embed url="https://app.lowcoder.cloud/playground/chart/1" %}

### Component Auto-Docs

{% embed url="https://app.lowcoder.cloud/components/barChart" %}
