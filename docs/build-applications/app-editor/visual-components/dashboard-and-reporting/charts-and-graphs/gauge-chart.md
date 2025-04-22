# Gauge Chart

The **Gauge Chart** in **Lowcoder** is a dynamic, dial-style visualization ideal for displaying **real-time values**, **threshold indicators**, or **KPI metrics**. Inspired by speedometers or pressure dials, it’s perfect for showing how close a value is to a goal or limit — at a glance.

#### Common Use Cases

* **System Monitoring:** CPU usage, memory, temperature
* **Business Metrics:** Sales target completion, customer satisfaction score
* **IoT Dashboards:** Sensor readings, production levels

#### Sample Data Format

This chart typically expects a single value:

```json
{ "metric": 76 }
```

You can bind this to a query, variable, or transformer like: `{{query1.data.metric}}`

#### Key Features

* **Chart Type:** Set to "Gauge Chart" in the Properties panel
* **Min & Max Values:** Define your dial’s scale — e.g., 0 to 100
* **Color Zones:** Highlight ranges (e.g., green for good, red for danger)
* **Pointer & Label:** Shows current value in real-time with optional animation

***

#### Custom Styling

* Modify **dial color**, **tick marks**, and **pointer style**
* Use **ECharts JSON editor** for deeper customization (like gradients or split sections)
* Animate the needle for live dashboards

### Component Playground

{% embed url="https://app.lowcoder.cloud/playground/gaugeChart/1" %}

### Component Auto-Docs

{% embed url="https://app.lowcoder.cloud/components/gaugeChart" %}
