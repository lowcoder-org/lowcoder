# Google Maps

Lowcoder offers an innovative approach to integrating Geomaps from Google with an advanced geo-data-based overlay of eCharts, providing a dynamic and interactive mapping solution. This integration is particularly powerful for applications requiring real-time data visualization on geographical maps.

The core feature of this integration is the seamless combination of Google Geomaps with eCharts overlays. Google Geomaps provides a robust and familiar mapping interface, known for its detailed and accurate geographical data. By overlaying eCharts, Lowcoder enables the addition of rich, interactive data visualizations directly onto these maps. This overlay capability is not just about static data representation; it supports dynamic, real-time data updates, making it ideal for applications that require up-to-the-minute information, such as traffic monitoring, weather updates, or tracking movements in logistics.

<figure><img src="../../../.gitbook/assets/Screenshot 2023-10-27 at 22.07.19.png" alt=""><figcaption><p>Distribution of Lowcoder Users worldwide (10.2023)</p></figcaption></figure>

Lowcoder ensures that the data displayed in the eCharts overlay is not only current but can also be updated in real-time with the [Stream Query](../../../connect-your-data/data-sources-in-lowcoder/websocket-datasource.md). This is crucial for scenarios where timely data is essential for decision-making. Users can see changes as they happen, providing an interactive and engaging experience.

The eCharts overlay on Google Geomaps in Lowcoder also offers a high degree of customization and interactivity. Users can zoom in and out, pan across different regions, and interact with the data points on the map. This interactivity is enhanced with tooltips, clickable elements, and various chart types like heatmaps, scatter plots, or line graphs, all geo-referenced and layered over the map.

### Using Geomap in Lowcoder

As the first step, place a new Chart from the right Components panel on the canvas.

<figure><img src="../../../.gitbook/assets/App Editor  GeoMaps use 1.png" alt=""><figcaption></figcaption></figure>

Now you can select in the Component Properties the type "Map"

<figure><img src="../../../.gitbook/assets/App Editor  GeoMaps  Select Map.png" alt=""><figcaption></figcaption></figure>

You can use the Properties "Zoomlevel, Longitude, and Latitude" to define the first impression of the GeoMap when the App is displayed.

In Version Lowcoder 2.1.x the eCharts Map is configurable like other eCharts by the "Options JSON"&#x20;

{% hint style="info" %}
For more and deeper information check the eCharts documentation. [https://echarts.apache.org/en/api.html#echartsInstance.setOption](https://echarts.apache.org/en/api.html#echartsInstance.setOption)
{% endhint %}

As eCharts is already integrated into Lowcoder, you only need to prepare and set the Options-JSON Data. The configuration follows the standard eCharts notation.

In the data section, you have nevertheless the possibility not only to set chart data but also the geo-point (lat, long), where the chart data should be displayed. Each Object in the data array will be one chart element on the map.

The section "encode" helps to tell the eCharts Map, which entry (array index number) of the data-array-element represents latitude, longitude, and the value to display.

```json
{
  "tooltip": {
    "trigger": "item"
  },
  "animation": true,
  "series": [
    {
      "name": "Population",
      "type": "scatter",
      "coordinateSystem": "gmap",
      "itemStyle": {
        "color": "#00c1de"
      },
      "data": [
        {
          "name": "Azerbaijan",
          "value": [
            47.395,
            40.43,
            8352021
          ]
        },
        {
          "name": "Albania",
          "value": [
            20.068,
            41.143,
            3153731
          ]
        }, <...>
      ],
      "encode": {
        "value": 2,
        "lng": 0,
        "lat": 1
      }
    }
  ]
}
```

### Dynamic Data & Function binding

As in other components of Lowcoder, you can bind data and functions dynamically to the map.

```javascript
{
  "tooltip": {
    "trigger": "item"
  },
  "animation": true,
  "series": [
    {
      "name": "Company Size",
      "type": "scatter",
      "coordinateSystem": "gmap",
      "itemStyle": {
        "color": "#9d4edd"
      },
      "data": {{mapData.value}},
      "symbolSize" : {{function (val) {return window.mapValueToSize(val[2])}}},
      "encode": {
        "value": 2,
        "lng": 0,
        "lat": 1
      }
    }
  ]
}
```

In this case, the App-global function "mapValueToSize" is bound to the map settings, so the size of the Scatter Plot dots can be dynamically adjusted based on the "value" - of the mapped data.

### Setting Geo-Markers & JavaScript Access

In Version 2.1.x the possibility to place Geo-Markers on the map is possible via Javascript by accessing the maps object.&#x20;

Here you can see the possibility to access the "gmap" object by the new function of the eChart Component "getMapInstance()". The gmap object is the well-known Google Maps Javascript Object, on which you can execute all typical operations.

```javascript
const renderMarker = async function () {
  const gmap = await chart1.getMapInstance ();
  var london = {lat: 51.5074, lng: -0.1278};
  var marker = new google.maps.Marker({
      position: london,
      map: gmap,
      title: 'Welcome to London!'
  });
}
renderMarker ();
```

### Google Maps API Key

When you publish your app, an Google Maps API Key must be in place to display the App accordingly. Use [https://console.cloud.google.com/apis/dashboard](https://console.cloud.google.com/apis/dashboard) to create your API Key.



<figure><img src="../../../.gitbook/assets/Google Maps APIs 0.png" alt=""><figcaption></figcaption></figure>

To display only the Map and use the JavaScript API, "Map Embed API" and "Maps JavaScript API" need to be activated.

<figure><img src="../../../.gitbook/assets/Google Maps APIs 1.png" alt=""><figcaption></figcaption></figure>

Now you can create and see your Google Maps API Key. It is suggested that you limit the Traffic by a Domain or IP Range.

<figure><img src="../../../.gitbook/assets/Google Maps APIs API Key.png" alt=""><figcaption></figcaption></figure>
