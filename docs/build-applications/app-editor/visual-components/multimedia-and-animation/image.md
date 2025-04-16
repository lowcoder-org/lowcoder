# Image

Use the **Image** component to present information in your apps in a vivic way. Lowcoder supports you adding an image via URL and base64 encoded data.

## URL

Drag the **Image** component onto the canvas or into a **Container**. Click the **Image** component, and the **Properties** tab is displayed on the right. You can set the URL to display an image.

## Base64 encoded data

You can also insert an image via base64 encoded data. Ensure that the encoded image source starts with `data:image/PICTURE_FORMAT;base64,` or simply`data:image;base64,`.

{% hint style="warning" %}
Don't miss the comma at the end of the prefix:

<mark style="background-color:yellow;">`data:image/PICTURE_FORMAT;base64`</mark><mark style="background-color:yellow;">**`,`**</mark><mark style="background-color:yellow;">`YOUR_BASE64_ENCODED_IMAGE_DATA`</mark>

<mark style="background-color:yellow;">`data:image;base64`</mark><mark style="background-color:yellow;">**`,`**</mark><mark style="background-color:yellow;">`YOUR_BASE64_ENCODED_IMAGE_DATA`</mark>
{% endhint %}

### Demo: upload and display an image

One common use case for base64 image display would be combining a **File Upload** component with an **Image** component.

Here is JS code that concatenates the prefix with the encoded base64 data of the uploaded file via `file1.value[0]`.

```javascript
{{"data:image/jpeg;base64," + file1.value[0]}} 
```

## Set click preview for an image

Toggle **Support click preview** in the **Properties** tab to allow users to preview the image in its full size. Hover your mouse over the image, and you see **👁 Preview**. Then, you can click to preview.

## Set the style of an image

In **Properties** > **Style**, change border color and set **Border radius** in pixels or by percentage.

### Component Playground

On Component Playground, you can interact with the Image component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Image component.

{% embed url="https://app.lowcoder.cloud/playground/image/1" %}

### Component Auto-Docs

In the Auto-Docs of Image component, we have shown how to use different properties of the Image component. It also includes the Styling properties of the Image component.

{% embed url="https://app.lowcoder.cloud/components/image" %}

#### Properties of the Image Component <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="176.38671875">Property Name</th><th width="114.9921875">Type</th><th>Description</th></tr></thead><tbody><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Modal  component is hidden or not</td></tr><tr><td>src</td><td>String</td><td>Returns String which contains the Image source</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="152.5625">Event Name</th><th width="495.39453125">Description</th></tr></thead><tbody><tr><td>Click</td><td>Triggers when a User "clicks" on the Image</td></tr></tbody></table>

## Insert/Retrieve an Image into/from Database

{% embed url="https://demos.lowcoder.cloud/demo/clzilkh8x1ozt9x77uabp0vfa" %}
