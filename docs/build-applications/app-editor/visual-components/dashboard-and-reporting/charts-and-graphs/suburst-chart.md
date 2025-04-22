# Suburst Chart

#### 🌞 Sunburst Chart – Radial Insight Into Hierarchies

The **Sunburst Chart** in **Lowcoder** presents **hierarchical data** in a **circular, multi-level format**, allowing users to explore nested relationships with a quick glance. Think of it as a pie chart that goes deeper — each level of the hierarchy adds a new ring, radiating from the center outward.

#### 🌐 Best Used For:

* **Organization structures** (e.g., Company → Departments → Teams)
* **Product category breakdowns**
* **File directory visualizations**
* **Multi-tiered survey results or user segments**

#### 🧩 Example Data Structure

Sunburst data is typically hierarchical and tree-like:

```json
{
  "name": "Company",
  "children": [
    {
      "name": "Engineering",
      "children": [
        { "name": "Frontend", "value": 10 },
        { "name": "Backend", "value": 15 }
      ]
    },
    {
      "name": "Marketing",
      "value": 20
    }
  ]
}
```

Each node can have a `value`, and/or `children` for deeper nesting.

#### ⚙️ Key Features

* **Chart Type:** Drag “Sunburst” from the components section onto Editor's View
* **Nested Levels:** Automatically expands based on data depth
* **Segment Size:** Proportional to values — larger value, wider arc
* **Tooltips:** Hover to view node details (name, value, path)

#### 🎨 Customisation & Theming

* Define **color schemes** by level or branch
* Style **labels** (e.g., rotate, hide, or show on hover)
* Control **level radius**, animation, and visual emphasis using **ECharts JSON configuration**

### Component Playground

{% embed url="https://app.lowcoder.cloud/playground/sunburstChart/1" %}

### Component Auto-Docs

{% embed url="https://app.lowcoder.cloud/components/sunburstChart" %}
