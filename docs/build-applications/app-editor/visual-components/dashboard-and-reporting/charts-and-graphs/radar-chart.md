# Radar Chart

#### Radar Chart – Multi-Dimensional Comparison in a Glance

The **Radar Chart** in **Lowcoder** (also known as a spider or web chart) is ideal for comparing **multiple variables** across categories in a compact, radial format. It lets users instantly see strengths, weaknesses, and balance across dimensions — all on a single canvas.

#### Best Suited For:

* **Performance assessments** (e.g. team skills, product features)
* **Survey results** comparison
* **Multi-category scoring** (like RPG character stats or SWOT analysis)
* **Visual benchmarking** between entities

#### Sample Data Format

Each entity (or series) is plotted across shared dimensions:

```json
[
  {
    "name": "Product A",
    "value": [80, 90, 70, 60, 85]
  },
  {
    "name": "Product B",
    "value": [60, 70, 75, 80, 65]
  }
]
```

And your chart will also need a list of dimensions (like `["Speed", "Quality", "Support", "Price", "Reliability"]`).

#### Key Configuration

* **Chart Type:** Drag “Radar Chart” from the Component section onto Editor View.
* **Indicators:** Define the axes (dimensions) with optional max values
* **Series:** Bind multiple data sets for comparison (optional)
* **Legend:** Easily distinguish between entities

#### Styling & Customization

* Customize **polygon shapes**, **line styles**, and **fill colors**
* Highlight specific data points with **labels or tooltips**
* Use **ECharts JSON editor** for animations, gradients, and advanced layout tweaks

### Component Playground

{% embed url="https://app.lowcoder.cloud/playground/radarChart/1" %}

### Component Auto-Docs

{% embed url="https://app.lowcoder.cloud/components/radarChart" %}
