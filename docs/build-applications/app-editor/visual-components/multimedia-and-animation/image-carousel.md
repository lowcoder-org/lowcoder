# Image Carousel

## 🎠 Carousel Component in Lowcoder

The **Carousel** component in Lowcoder enables the display of a series of images or content in a rotating, slideshow format. It's ideal for showcasing featured items, image galleries, testimonials, or any content that benefits from sequential presentation.

<figure><img src="../../../../.gitbook/assets/Screenshot 2025-05-05 at 4.37.30 PM.png" alt=""><figcaption></figcaption></figure>

### 🔧 Key Features

* **Sequential Display**: Automatically or manually cycle through a set of items.
* **Customisable Content**: Each slide can contain images, text, or other components.
* **Navigation Controls**: Includes arrows and indicators for user navigation.
* **Autoplay and Looping**: Configure slides to advance automatically and loop continuously.
* **Responsive Design**: Adapts to various screen sizes for optimal viewing on all devices.

### 🛠 Configuration Options

* **Data Binding**: Bind the carousel to a data source to dynamically generate slides.
* **Slide Interval**: Set the duration each slide is displayed before transitioning.
* **Transition Effects**: Choose between different animation styles for slide transitions.
* **Navigation Settings**: Enable or disable navigation arrows and indicators.
* **Styling**: Customize the appearance of the carousel, including dimensions, colors, and fonts.

### ⚙️ Integration Tips

* **Dynamic Content**: Use queries to fetch and display dynamic content within the carousel slides.
* **Event Handling**: Implement event handlers to trigger actions when slides change or are clicked.
* **Responsive Layout**: Ensure the carousel scales appropriately by configuring responsive design settings.

### Component Playground

On Component Playground, you can interact with the Image Carousel component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Image Carousel component.

{% embed url="https://app.lowcoder.cloud/playground/carousel/1" %}

### Component Auto-Docs

In the Auto-Docs of Image Carousel component, we have shown how to use different properties of the Image Carousel component. It also includes the Styling properties of the Image Carousel component.

{% embed url="https://app.lowcoder.cloud/components/carousel" %}

#### Properties of the Dropdown components <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="175.97265625">Property Name</th><th width="114.05859375">Type</th><th>Description</th></tr></thead><tbody><tr><td>data</td><td>Array</td><td>Returns the data of the Carousel component which contains the array of URLs/Data of the images</td></tr><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Carousel component is hidden or not</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="166.04296875">Event Name</th><th width="458.8515625">Description</th></tr></thead><tbody><tr><td>Change</td><td>Triggers, when anything changes on the Carousel component</td></tr></tbody></table>

### 📌 Use Cases

* **Image Galleries**: Showcase a collection of images in a compact, interactive format.
* **Featured Content**: Highlight important announcements, products, or articles.
* **Testimonials**: Present customer feedback or reviews in a rotating display.
* **Product Showcases**: Display multiple products or features in a single, navigable component.
