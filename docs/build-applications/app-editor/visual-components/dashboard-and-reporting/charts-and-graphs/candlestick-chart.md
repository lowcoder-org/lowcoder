# CandleStick Chart

In **Lowcoder**, the **Candlestick Chart** component is tailor-made for **financial and stock market visualisations**. Unlike standard charts that focus on categories or continuous trends, the Candlestick Chart captures **market volatility and trading behavior** through detailed time-series snapshots.

#### What It Shows

Each "candle" displays **four critical price points** within a specific time frame:

* **Open** – Price at the beginning of the interval
* **Close** – Price at the end of the interval
* **High** – The maximum price reached
* **Low** – The minimum price reached

This format helps users interpret **market momentum**, identify **bullish/bearish trends**, and make **data-driven financial decisions**.

***

#### Best Use Cases

* Visualizing **daily/weekly stock prices**
* Tracking **cryptocurrency market movements**
* Displaying **commodity trading patterns**

#### Configuration Highlights

* **Time Axis:** Typically dates on the X-axis
* **Price Range Axis:** Automatically scales for highs and lows
*   **Data Structure Required:**

    ```json
    {
      "date": "2023-01-01",
      "open": 120,
      "close": 135,
      "high": 140,
      "low": 115
    }
    ```

***

#### Customisation

You can:

* Change **color themes** (e.g., green for gain, red for loss)
* Toggle between **solid and hollow candles**
* Add **tooltips** for precise price points on hover

Advanced users can extend the chart with **Apache ECharts JSON configuration** for animations, zooming, or overlays like moving averages.

### Component Playground

{% embed url="https://app.lowcoder.cloud/playground/candleStickChart/1" %}

### Component Auto-Docs

{% embed url="https://app.lowcoder.cloud/components/candleStickChart" %}
