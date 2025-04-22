# Treemap Chart

#### 🧱 Treemap Chart – Big Picture Through Nested Blocks

The **Treemap Chart** in **Lowcoder** transforms hierarchical data into a **space-efficient, nested rectangle layout**, where each block’s size and color reflect the data it represents. It’s ideal for spotting **proportions, distributions**, and **dominant categories** in complex datasets.

#### 📊 Best Used For:

* **Visualizing budget breakdowns**
* **Market share comparisons**
* **Categorized performance metrics**
* **File system/storage analysis**

#### 🧩 Sample Data Format

Treemap data uses a hierarchical JSON structure:

```json
{
  "name": "Categories",
  "children": [
    { "name": "Marketing", "value": 30000 },
    { "name": "Engineering", "value": 50000 },
    {
      "name": "Sales",
      "children": [
        { "name": "Domestic", "value": 20000 },
        { "name": "International", "value": 25000 }
      ]
    }
  ]
}
```

Each node can include a `value` (to determine block size) or `children` for nesting.

#### ⚙️ Key Configuration Options

* **Chart Type:** Drag “Treemap Chart” from the components section onto Editor's View
* **Node Size:** Determined by the `value` field
* **Hierarchy Depth:** Supports multiple nested levels
* **Tooltip Display:** Show name, value, or percent on hover

#### 🎨 Styling & Customisation

* Customize **color palette** to distinguish levels or value ranges
* Adjust **border spacing**, **label visibility**, and **hover effects**
* Use **ECharts JSON configuration** for control over animation, breadcrumb trails, and styling rules

### Component Playground

{% embed url="https://app.lowcoder.cloud/playground/treemapChart/1" %}

### Component Auto-Docs

{% embed url="https://app.lowcoder.cloud/components/treemapChart" %}
