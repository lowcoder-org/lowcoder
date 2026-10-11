# Funnel Chart

The **Funnel Chart** component in **Lowcoder** is purpose-built to illustrate **step-by-step drop-off** in a process — like how users move through a sales or signup funnel. Its tapered shape clearly conveys **decreasing values**, helping identify bottlenecks and optimize flow efficiency.

#### Use Case Highlights

* **Sales Funnel:** Leads → Qualified → Proposal → Closed
* **Marketing Pipeline:** Visitors → Signups → Activations
* **Process Efficiency:** Applications received → Reviewed → Approved

#### Data Format Example

Each step in the funnel requires a **label** and a **numerical value**:

```json
[
  { "stage": "Visited Site", "value": 1000 },
  { "stage": "Signed Up", "value": 400 },
  { "stage": "Subscribed", "value": 180 }
]
```

#### Key Features

* **Automatic Sorting:** Values are typically displayed in descending order (largest at the top)
* **Visual Ratio:** Width of each segment is proportional to its value
* **Color Coding:** Customize segment colors to visually separate steps

***

#### Customisation & Tips

* Apply **tooltips** to show percentages or absolute values on hover
* Combine with **Bar/Line charts** for a broader picture of performance
* Use **ECharts JSON config** to enable label alignment, orientation, and segment gaps

### Component Playground

{% embed url="https://app.lowcoder.cloud/playground/funnelChart/1" %}

### Component Auto-Docs

{% embed url="https://app.lowcoder.cloud/components/funnelChart" %}
