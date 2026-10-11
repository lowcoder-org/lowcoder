# Theme River Chart

#### 🌊 Theme River Chart – Visualize Flowing Trends Over Time

The **Theme River Chart** in **Lowcoder** is designed to display the **evolution of multiple categories over time**, using a flowing, layered stream of color. Each "river" represents a topic, event, or value stream — rising and falling along a shared timeline — making it perfect for showing **how topics emerge, overlap, and fade**.

#### 📆 Ideal Use Cases

* **News or media timelines:** Track the rise and fall of trending topics
* **Social conversations:** Visualize volume of discussions over time
* **Multi-series comparisons:** See how categories shift in relation to each other
* **Sentiment or event tracking:** Watch how themes surge during campaigns

#### 🧩 Sample Data Format

Each data point combines a **timestamp**, a **category**, and a **value**:

```json
[
  { "date": "2023-01-01", "name": "Product A", "value": 20 },
  { "date": "2023-01-01", "name": "Product B", "value": 35 },
  { "date": "2023-01-02", "name": "Product A", "value": 25 }
]
```

The chart automatically stacks values by category and time.

#### ⚙️ Configuration Highlights

* **Chart Type:** Drag “Theme River Chart” from the components section onto Editor's View
* **X-Axis:** Typically a time series (date or timestamp)
* **Series Field:** Category name (e.g., product, topic, segment)
* **Flowing Area:** The vertical thickness represents the value at that time

#### 🎨 Styling & Customisation

* Assign **distinct colors** per category for visual clarity
* Control label visibility, smoothness, and area curvature
* Use **ECharts JSON config** to animate flows, adjust tooltips, or highlight interactions

### Component Playground

{% embed url="https://app.lowcoder.cloud/playground/themeriverChart/1" %}

### Component Auto-Docs

{% embed url="https://app.lowcoder.cloud/components/themeriverChart" %}
