# Sankey Chart

#### Sankey Chart – Visualize Flow with Purpose

The **Sankey Chart** in **Lowcoder** is the go-to component for visualizing **how resources, values, or data move** from one stage to another. With its signature **flowing links** and **proportional widths**, the Sankey chart shows where things **come from**, where they **go**, and how much is **lost or retained** along the way.

#### Perfect For:

* **Energy flow diagrams**
* **User journey mapping** (e.g. from landing page → signup → purchase)
* **Budget allocation & expenditure tracking**
* **Process pipelines** (e.g. manufacturing or logistics)

#### Data Format Example

Sankey Charts are based on **nodes** and **links** between them:

```json
{
  "nodes": [
    { "name": "Budget" },
    { "name": "Marketing" },
    { "name": "Operations" },
    { "name": "Profit" }
  ],
  "links": [
    { "source": "Budget", "target": "Marketing", "value": 30000 },
    { "source": "Budget", "target": "Operations", "value": 50000 },
    { "source": "Operations", "target": "Profit", "value": 15000 }
  ]
}
```

Each link’s **width is proportional** to its value — a visual cue for weight or volume.

#### Configuration Essentials

* **Chart Type:** Drag “Sankey Chart” from the Component section onto Editor's View
* **Nodes:** Automatically derived from link data or can be explicitly defined
* **Flow Direction:** Usually left-to-right, but can be styled vertically or circularly
* **Tooltip Support:** Hover to see exact values for any connection

#### Styling Options

* Customize **node color**, **label position**, and **link curvature**
* Adjust **link gradients** or segment spacing for better visual clarity
* Use the **ECharts JSON editor** for deeper enhancements (e.g., link emphasis, dynamic highlights)

### Component Playground

{% embed url="https://app.lowcoder.cloud/playground/sankeyChart/1" %}

### Component Auto-Docs

{% embed url="https://app.lowcoder.cloud/components/sankeyChart" %}
