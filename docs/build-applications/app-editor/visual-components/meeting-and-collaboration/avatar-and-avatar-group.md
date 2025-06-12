# Avatar & Avatar Group

## 🧑‍💼 Avatar & Avatar Group Components in Lowcoder

Lowcoder provides versatile components for displaying user avatars, enhancing user interfaces with visual representations of individuals or groups.

### 🧍 Avatar Component

The **Avatar** component displays a single user's image, initials, or icon, commonly used to represent user profiles or identities within the application.

<figure><img src="../../../../.gitbook/assets/frame_generic_light (10).png" alt=""><figcaption></figcaption></figure>

#### 🔧 Key Features

* **Image Display**: Supports displaying user profile pictures.
* **Initials Fallback**: Automatically displays user initials when an image is not provided.
* **Icon Support**: Allows the use of icons as avatars.
* **Customisable Size and Shape**: Adjust the avatar's size and shape (e.g., circle, square) to fit the application's design.

#### 🛠 Configuration Options

* **Image Source**: Set the URL of the user's profile picture.
* **Fallback Text**: Define the text to display when the image is unavailable.
* **Icon Selection**: Choose an icon to represent the user.
* **Size Settings**: Specify the avatar's dimensions.
* **Shape Selection**: Choose between circular or square avatars.

#### ⚙️ Integration Tips

* **Dynamic Binding**: Bind the avatar's image source to user data dynamically.
* **Event Handling**: Implement event handlers to respond to user interactions with the avatar.

#### Components Playground

On Component Playground, you can interact with the Avatar component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Avatar component.

{% embed url="https://app.lowcoder.cloud/playground/avatar/1" %}

#### Components Auto-Docs

In the Auto-Docs of Avatar component, we have shown how to use different properties of the Avatar component. It also includes the Styling properties of the Avatar component.

{% embed url="https://app.lowcoder.cloud/components/avatar" %}

#### Properties of the Avatar Component <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="176.38671875">Property Name</th><th width="114.9921875">Type</th><th>Description</th></tr></thead><tbody><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Avatar  component is hidden or not</td></tr><tr><td>badgeCount</td><td>Number</td><td>Returns Number which contains the badge count</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="175.01953125">Event Name</th><th width="442.3671875">Description</th></tr></thead><tbody><tr><td>Click</td><td>Triggers, when a User "Clicks" on the Component</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

**setTitle() :**

avatar1.setTitle() method sets the Avatar's Title property, which sets the Title of the Avatar component.

```javascript
avatar1.setTitle("Avatar Title");
```

**clearTitle() :**&#x20;

avatar1.clearTitle() clears the Avatar's Title property and empties the Title value from the Avatar component.

```javascript
avatar1.clearTitle();
```

**resetTitle() :**&#x20;

avatar1.resetTitle()  method resets the Avatar's Title property to the default value of the Avatar component.

```javascript
avatar1.resetTitle();
```

**setSrc() :**

avatar1.setSrc() method sets the Avatar's Source property, which takes the URL of the Avatar to be shown in the Avatar component.

```javascript
avatar1.setSrc("https://i.pravatar.cc/300");
```

**clearSrc() :**&#x20;

avatar1.clearSrc() clears the Avatar's Source property and empties the Source value from the Avatar component.

```javascript
avatar1.clearSrc();
```

**resetSrc() :**&#x20;

avatar1.resetSrc()  method resets the Avatar's Source property to the default value of the Avatar component.

```javascript
avatar1.resetSrc();
```

**setBadgeCount() :**

avatar1.setBadgeCount() method sets the Avatar's Badge Count property, which sets the Badge Count of the Avatar component.

```javascript
avatar1.setBadgeCount(5)
```

**clearBadgeCount() :**&#x20;

avatar1.clearBadgeCount() clears the Avatar's Badge Count property and empties the Badge Count value from the Avatar component.

```javascript
avatar1.clearBadgeCount();
```

**resetBadgeCount() :**&#x20;

avatar1.resetBadgeCount()  method resets the Avata's Badge Count property to the default value of the Avatar component.

```javascript
avatar1.resetBadgeCount();
```

**setAvatarCatption() :**

avatar1.setAvatarCatption() method sets the Avatar's Caption property, which sets the Caption of the Avatar component.

```javascript
avatar1.setAvatarCatption("johnibrahim@gmail.com");
```

**clearAvatarCatption() :**&#x20;

avatar1.clearAvatarCatption() clears the Avatar's Caption property and empties the Caption value from the Avatar component.

```javascript
avatar1.clearAvatarCatption();
```

**resetAvatarCatption() :**&#x20;

avatar1.resetAvatarCatption()  method resets the Avatar's Caption property to the default value of the Avatar component.

```javascript
avatar1.resetAvatarCatption();
```

**setAvatarLabel() :**

avatar1.setAvatarLabel() method sets the Avatar's Label property, which sets the Label of the Avatar component.

```javascript
avatar1.setAvatarLabel("John");
```

**clearAvatarLabel() :**&#x20;

avatar1.clearAvatarLabel() clears the Avatar's Label property and empties the Label value from the Avatar component.

```javascript
avatar1.clearAvatarLabel();
```

**resetAvatarLabel() :**&#x20;

avatar1.resetTitle()  method resets the Avatar's Label property to the default Label value of the Avatar component.

```javascript
avatar1.resetAvatarLabel();
```

### 👥 Avatar Group Component

The **Avatar Group** component displays a collection of avatars, representing multiple users or entities, often used to show group memberships or participants.

<figure><img src="../../../../.gitbook/assets/frame_generic_light (11).png" alt=""><figcaption></figcaption></figure>

#### 🔧 Key Features

* **Multiple Avatars**: Display a set of avatars in a compact group.
* **Overflow Handling**: Automatically handles cases where the number of avatars exceeds the display limit, often showing a "+N" indicator.
* **Customisable Layout**: Adjust spacing and alignment of avatars within the group.

#### 🛠 Configuration Options

* **Data Source**: Provide an array of user data to generate avatars.
* **Display Limit**: Set the maximum number of avatars to display before showing an overflow indicator.
* **Spacing Settings**: Adjust the spacing between avatars in the group.
* **Alignment Options**: Align avatars horizontally or vertically as needed.

#### ⚙️ Integration Tips

* **Dynamic Data Binding**: Bind the avatar group to dynamic user data sources.
* **Event Handling**: Implement event handlers to respond to interactions with individual avatars within the group.

### 🎨 Styling and Customisation

Both Avatar and Avatar Group components support extensive styling options to match the application's design requirements. Customize aspects such as:

* **Colors**: Set background and text colors.
* **Borders**: Define border styles and colors.
* **Shadows**: Add shadows for depth effects.
* **Hover Effects**: Implement visual changes on hover interactions.

#### Components Playground

On Component Playground, you can interact with the Avatar Group component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Avatar Group component.

{% embed url="https://app.lowcoder.cloud/playground/avatargroup/1" %}

#### Components Auto-Docs

In the Auto-Docs of Avatar Group component, we have shown how to use different properties of the Avatar Group component. It also includes the Styling properties of the Avatar Group component.

{% embed url="https://app.lowcoder.cloud/components/avatarGroup" %}

#### Properties of the Avatar Group Component <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="176.38671875">Property Name</th><th width="114.9921875">Type</th><th>Description</th></tr></thead><tbody><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Avatar Group component is hidden or not</td></tr><tr><td>currentAvatar</td><td>Object</td><td>Returns Object which contains the current Avatar object of the Avatar Group component</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="175.01953125">Event Name</th><th width="442.3671875">Description</th></tr></thead><tbody><tr><td>Click</td><td>Triggers, when a User "Clicks" on the Component</td></tr><tr><td>Refresh</td><td>Triggers, when Avatar Group component is refreshed</td></tr></tbody></table>
