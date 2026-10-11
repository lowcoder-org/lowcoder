# Heatmap Chart

#### Heatmap Chart – Turn Data Density into Visual Intensity

The **Heatmap Chart** in **Lowcoder** transforms raw numerical data into a vibrant grid of color-coded cells, helping you instantly identify **patterns, anomalies, or concentration zones** in large datasets. It’s a visual way of answering: _"Where is the intensity highest?"_

#### Perfect For:

* **Website analytics:** Track clicks or engagement across a page
* **User behavior grids:** View activity by time and category
* **Correlation matrices:** Compare how variables relate to one another
* **Calendar heatmaps:** Spot daily, weekly, or monthly trends (e.g., GitHub commits)

#### Data Format Example

Each cell requires an X and Y coordinate with a value:

```json
[
  { "x": "Monday", "y": "User A", "value": 5 },
  { "x": "Tuesday", "y": "User A", "value": 12 },
  { "x": "Monday", "y": "User B", "value": 9 }
]
```

You can dynamically bind this from queries or transformers.

#### Configuration Highlights

* **Chart Type:** Drag “Heatmap Chart” from the Components on the Editor View.
* **Axes:** Define horizontal and vertical dimensions (e.g., time, user, region)
* **Color Encoding:** Value intensity is represented using a color gradient
* **Tooltips:** Hover to display exact values in each cell

#### Custom Styling

* Use color palettes to show scale (e.g., blue to red, green to yellow)
* Apply spacing, border styles, or rounded corners to each cell
* Customize label visibility for cleaner or more data-dense displays
* Advanced? Use **ECharts JSON config** to fine-tune the layout and interactions

### Component Playground

{% embed url="https://app.lowcoder.cloud/playground/heatmapChart/1" %}

### Component Auto-Docs

{% embed url="https://app.lowcoder.cloud/components/heatmapChart" %}
