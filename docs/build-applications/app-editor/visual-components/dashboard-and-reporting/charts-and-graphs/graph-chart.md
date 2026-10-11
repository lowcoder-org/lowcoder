# Graph Chart

The **Graph Chart** component in **Lowcoder** is designed for mapping **networks**, **connections**, and **relationships** between entities. Unlike bar or line charts that focus on metrics, the Graph Chart reveals how **nodes (things)** are linked through **edges (connections)** — perfect for illustrating complex systems.

#### Ideal Use Cases

* **Organisational charts**
* **Social networks** (users and their followers/friends)
* **IT infrastructure maps** (servers, APIs, databases)
* **Dependency graphs** (tasks, modules, or processes)

#### Data Structure

Graph Charts work with two key datasets: **nodes** and **links**.

```json
{
  "nodes": [
    { "id": "A", "label": "Start" },
    { "id": "B", "label": "Process" },
    { "id": "C", "label": "End" }
  ],
  "links": [
    { "source": "A", "target": "B" },
    { "source": "B", "target": "C" }
  ]
}
```

***

#### Core Features

* **Chart Type:** Drag “Graph Chart” component from the right window of the Editor page
* **Force Layout:** Automatically organizes nodes based on physical forces (repulsion, gravity, etc.)
* **Interactive:** Nodes can be draggable; tooltips and hover effects are supported
* **Directional Arrows:** Show flow or influence (optional via edge styling)

***

#### Customisation & Styling

* **Customize node size, color, and labels**
* Use **ECharts JSON** config for full control over:
  * Edge curvature or thickness
  * Node grouping or clustering
  * Tooltip formatting
  * Animation effects

### Component Playground

{% embed url="https://app.lowcoder.cloud/playground/graphChart/1" %}

### Component Auto-Docs

{% embed url="https://app.lowcoder.cloud/components/graphChart" %}
