# Video

## 🎬 Video Component in Lowcoder

The **Video** component in Lowcoder enables seamless integration of video content into your applications, enhancing user engagement through multimedia elements.

<figure><img src="../../../../.gitbook/assets/frame_generic_light (7) (5).png" alt=""><figcaption></figcaption></figure>

### 🔧 Key Features

* **Versatile Source Support**: Play videos from various sources, including URLs and embedded streams.
* **Playback Controls**: Users can play, pause, and seek within the video.
* **Autoplay and Looping**: Configure videos to start automatically and loop continuously.
* **Responsive Design**: Adjusts to different screen sizes for optimal viewing on all devices.

### 🛠 Configuration Options

* **Video Source**: Specify the URL or path to the video file.
* **Autoplay**: Enable or disable automatic playback upon loading.
* **Loop**: Set the video to replay automatically after it ends.
* **Controls Visibility**: Choose whether to display playback controls to the user.
* **Muted**: Start the video with sound muted or unmuted.
* **Styling**: Customize dimensions, borders, and other visual aspects to match your application's design.

### ⚙️ Integration Tips

* **Dynamic Source Binding**: Use Lowcoder's data binding to dynamically set the video source based on user interactions or data queries.
* **Event Handling**: Implement event handlers to trigger actions when the video starts, pauses, or ends.
* **Responsive Layout**: Combine with layout components to ensure the video scales appropriately across devices.

### Component Playground

On Component Playground, you can interact with the Video component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Video component.

{% embed url="https://app.lowcoder.cloud/playground/video/1" %}

### Component Auto-Docs

In the Auto-Docs of Video component, we have shown how to use different properties of the Video component. It also includes the Styling properties of the Video component.

{% embed url="https://app.lowcoder.cloud/components/video" %}

#### Properties of the Dropdown components <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="175.97265625">Property Name</th><th width="114.05859375">Type</th><th>Description</th></tr></thead><tbody><tr><td>src</td><td>String</td><td>Returns the Source value of the video component</td></tr><tr><td>duration</td><td>Number</td><td>Returns the total duration of the Video in the Video component ( In Seconds )</td></tr><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the video component is hidden or not</td></tr><tr><td>currentTimeStamp</td><td>Number</td><td>Returns the current time of the Video being played in the the Video component ( Current running second of the Video )</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="166.04296875">Event Name</th><th width="458.8515625">Description</th></tr></thead><tbody><tr><td>Play</td><td>Triggers, when a User Plays the Video in Video component</td></tr><tr><td>Pause</td><td>Triggers, when a User Pauses the Video in Video component</td></tr><tr><td>Load</td><td>Triggers, when Video loads in the Video component</td></tr><tr><td>Ended</td><td>Triggers, when the Video has ended</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

**setDuration() :**&#x20;

video1.setDuration() method sets the Video component's Duration property.

```javascript
video1.setDuration(100);
```

**clearDuration() :**&#x20;

video1.clearDuration(); clears the Video component's Duration property.

```javascript
video1.clearDuration();
```

**resetDuration() :**&#x20;

video1.resetDuration() method resets the Video component's Duration property to the default Duration of the Video component.

```javascript
video1.resetDuration();
```

**setCurrentTimeStamp() :**&#x20;

video1.setCurrentTimeStamp() method sets the Video component's CurrentTimeStamp property.

```javascript
video1.setCurrentTimeStamp(10);
```

**clearCurrentTimeStamp() :**&#x20;

video1.clearCurrentTimeStamp() clears the Video component's CurrentTimeStamp property.

```javascript
video1.clearCurrentTimeStamp();
```

**resetCurrentTimeStamp() :**&#x20;

video1.resetCurrentTimeStamp() method resets the Video component's CurrentTimeStamp property to the default CurrentTimeStamp of the Video component.

```javascript
video1.resetCurrentTimeStamp();
```

**seekTo() :**&#x20;

video1.seekTo() method moves the Video of the Video component to the given second of the Video.

```javascript
video1.seekTo(10);
```

**showPreview() :**&#x20;

video1.showPreview() method shows the Preview of the Video in the Video component.

```javascript
video1.showPreview();
```

### 📌 Use Cases

* **Tutorials and Demonstrations**: Embed instructional videos to guide users through processes.
* **Product Showcases**: Highlight product features and benefits through engaging video content.
* **Customer Testimonials**: Share client feedback and success stories in a compelling format.
* **Marketing Campaigns**: Enhance promotional efforts with dynamic video presentations.

***

By leveraging the Video component in Lowcoder, developers can enrich their applications with multimedia content, providing users with an interactive and informative experience.

***
