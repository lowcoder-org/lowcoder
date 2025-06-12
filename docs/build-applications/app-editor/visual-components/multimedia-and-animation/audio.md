# Audio

## 🔊 Audio Component in Lowcoder

The **Audio** component in Lowcoder allows seamless integration of audio playback functionality into your applications. It supports embedding audio content with playback controls, enhancing user engagement through auditory elements.

<figure><img src="../../../../.gitbook/assets/frame_generic_light (8) (6).png" alt=""><figcaption></figcaption></figure>

### 🔧 Key Features

* **Audio Playback**: Embed audio files (e.g., MP3, WAV) with built-in controls for play, pause, and volume adjustment.
* **Autoplay and Looping**: Configure audio to start automatically and/or loop continuously.
* **Responsive Design**: Adapts to various screen sizes, ensuring consistent user experience across devices.
* **Customizable Styling**: Modify appearance to align with your application's design aesthetics.([app.lowcoder.cloud](https://app.lowcoder.cloud/components/audio?utm_source=chatgpt.com))

### 🛠 Configuration Options

* **Source URL**: Specify the path or URL to the audio file you wish to embed.
* **Autoplay**: Enable or disable automatic playback upon component load.
* **Loop**: Set the audio to replay automatically after it ends.
* **Controls Visibility**: Choose whether to display playback controls to the user.
* **Muted**: Start the audio with sound muted or unmuted.
* **Styling**: Customize dimensions, borders, and other visual aspects to match your application's design.([docs.lowcoder.cloud](https://docs.lowcoder.cloud/lowcoder-documentation/build-applications/create-a-new-app/modules?utm_source=chatgpt.com))

### ⚙️ Integration Tips

* **Dynamic Source Binding**: Utilize Lowcoder's data binding to dynamically set the audio source based on user interactions or data queries.
* **Event Handling**: Implement event handlers to trigger actions when the audio starts, pauses, or ends.
* **Responsive Layout**: Combine with layout components to ensure the audio player scales appropriately across devices.

### Component Playground

On Component Playground, you can interact with the Audio component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Audio component.

{% embed url="https://app.lowcoder.cloud/playground/audio/1" %}

### Component Auto-Docs

In the Auto-Docs of Audio component, we have shown how to use different properties of the Audio component. It also includes the Styling properties of the Audio component.

{% embed url="https://app.lowcoder.cloud/components/audio" %}

#### Properties of the Dropdown components <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="175.97265625">Property Name</th><th width="114.05859375">Type</th><th>Description</th></tr></thead><tbody><tr><td>src</td><td>String</td><td>Returns the Source value of the Audio component</td></tr><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Audio component is hidden or not</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="166.04296875">Event Name</th><th width="458.8515625">Description</th></tr></thead><tbody><tr><td>Play</td><td>Triggers, when a User Plays the Audio in Audio component</td></tr><tr><td>Pause</td><td>Triggers, when a User Pauses the Audio in Audio component</td></tr><tr><td>Ended</td><td>Triggers, when the Audio has ended</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

**seekTo() :**&#x20;

audio1.seekTo() method moves the Audio of the Audio component to the given second of the Audio.

```javascript
audio1.seekTo(10);
```

**showPreview() :**&#x20;

audio1.showPreview() method shows the Preview of the Audio in the Audio component.

```javascript
audioo1.showPreview();
```

### 📌 Use Cases

* **Podcasts and Interviews**: Embed audio content for users to listen to directly within the application.
* **Language Learning**: Provide pronunciation guides or listening exercises.
* **Background Music**: Enhance user experience with ambient sounds or music.
* **Accessibility**: Offer audio descriptions or narrations for visually impaired users.
