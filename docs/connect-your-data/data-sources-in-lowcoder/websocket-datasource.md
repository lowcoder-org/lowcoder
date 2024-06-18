---
description: Realtime Data Updates in Lowcoder
---

# Websocket Datasource

In the digital age, speed and immediacy are a key success factor. That's why we believe our **WebSocket Datasource** is a gread addition. But why is this such a game-changer?

* **Instant Updates:** Unlike traditional methods where you'd need to refresh or poll for new data via APIs, WebSockets push updates to the Browser of the Application Users the moment they happen. Imagine viewing a dashboard and watching data points, charts, and metrics update in real-time without additional API Call logic.
* **Enhanced Collaboration:** WebSockets don't just update data; they transform collaboration. When multiple users are viewing the same content, any change made by one user can be instantly seen by others. This means teams can work together seamlessly, making decisions based on real-time insights. This is possible thanks to the broadcast function we introduced.
* **Reduced Latency:** With WebSockets, the lag between sending a request and receiving a response is drastically reduced. This ensures that your apps feel snappier and more responsive, enhancing user experience.
* **Endless Possibilities:** From live chat applications to real-time gaming, tracking, and monitoring systems, the applications of WebSockets are vast. With our WebSocket Datasource, you're not just staying updated; you're unlocking a world of real-time possibilities for your apps.

### Using a WebSocket as Datasource.

First, select "Stream Query" as a new Query from the available Datasources. Stream Query is available from Lowcoder v2.1.0.

<figure><img src="../../.gitbook/assets/Screenshot 2023-10-24 at 13.33.13.png" alt=""><figcaption></figcaption></figure>

#### Connect to a WebSocket Server

As URL enter the WebSocket Server address ws:// (without) and wss:// (with SSL secured connection). From the moment you run this query, Lowcoder tries to establish a connection to the WebSocket Server. If successful, the specialty of WebSocket connections is, that they remain active and open till you disconnect the Dataquery / Lowcoder App.



{% hint style="info" %}
[https://www.piesocket.com](https://www.piesocket.com/) is a service that you can use to establish and use WebSocket Servers as a Service.
{% endhint %}

{% hint style="warning" %}
Each time a message arrives in the open connection, the Lowcoder Query will fire the event "success", so you can bind an Event-Handler to process these messages.
{% endhint %}

<figure><img src="../../.gitbook/assets/Screenshot 2023-10-24 at 13.33.02.png" alt=""><figcaption></figcaption></figure>

```
// for example wss://ws.kraken.com
```

#### Receive and Broadcast messages&#x20;

Now the connection is made and depending on the channel you may already receive data. Quite often it is however the case, that a Client needs to subscribe to a certain topic or room. To do so, but also simply to broadcast a message into the connection, you can use the new function broadcast(); This is a function of the WebSocket Datasource / Stream Query.

Here is an example as JavaScript, which is called as soon as the Stream Query is connected successfully to the WebSocket Server and listens in the channel.

Messages arrive and are broadcasted as JSON.

<figure><img src="../../.gitbook/assets/Screenshot 2023-10-24 at 13.41.50.png" alt=""><figcaption></figcaption></figure>

```javascript
// for example:

krakenStockTicker.broadcast({
  "event": "subscribe",
  "pair": [
    "EUR/USD"
  ],
  "subscription": {
    "name": "ohlc"
  }
});
```

#### Processing incoming Messages

We can now bind the messages that are incoming and trigger the "onSuccess" of the Stream Query to a Temporary state. This is exemplary and you may want to integrate it differently.

<figure><img src="../../.gitbook/assets/Screenshot 2023-10-24 at 13.46.39.png" alt=""><figcaption></figcaption></figure>

We use the "Success" trigger of the Stream Query and set a Temporary State with the value. In the special case of Kraken Websocket, we want to skip all "heartbeat messages", so we only set Temporary State, if there are payload data in the current message.

#### Collecting Messages

It may be useful in your application scenario to collect Messages, for example, to show a sliding Window Chart like this OHLC diagram of our example. To do so, we create for example an Array, which is available for the whole app.

```javascript
window.krakenStockTickerData = [];
```

<figure><img src="../../.gitbook/assets/Screenshot 2023-10-24 at 13.52.10.png" alt=""><figcaption></figcaption></figure>

Now we can bind a Javascript processing for each incoming message to the "Success" Trigger of the Stream Query and bind our chart to this data-array.

```javascript
// we take the string value of the Websocket Message and build an Array
const currentRawTickerData = currentTickerData.value.split(',');
// based on the array we can extract now the data we want and formulate an JSON Object
const currentCleanTickerData = {
  "time" : new Date(currentRawTickerData[0].substr(0,10) * 1000).toISOString().substr(11, 8),
  "duration" : new Date(currentRawTickerData[1].substr(0,10) * 1000).toISOString().substr(11, 8),
  "open" : currentRawTickerData[2],
  "high" : currentRawTickerData[3],
  "low" : currentRawTickerData[4],
  "close" : currentRawTickerData[5],
  "weighted_volume" : currentRawTickerData[6],
  "accumulated_volume" : currentRawTickerData[7],
  "trades" : currentRawTickerData[8]
}
// we push the new Object into the array, krakenStockTickerData
window.krakenStockTickerData.push(currentCleanTickerData);
// and we make sure that old data is deleted, so the array won't get too big
while (window.krakenStockTickerData.length > 30) {
  window.krakenStockTickerData.shift();
}
// Here we set a value in a temporary state, so the eCharts would update their visualization
// (the binding to the array on the window-object does not release a trigger for eCharts to re-render)
clockTickerData.setValue(currentCleanTickerData.time);
```

<figure><img src="../../.gitbook/assets/Screenshot 2023-10-24 at 13.56.32.png" alt=""><figcaption></figcaption></figure>
