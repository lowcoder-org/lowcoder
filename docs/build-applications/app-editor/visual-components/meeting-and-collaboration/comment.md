# Comment

## 💬 Comment Component in Lowcoder

The **Comment** component in Lowcoder facilitates user engagement by enabling the display and management of user-generated comments. It is ideal for applications requiring feedback, discussions, or threaded conversations.

<figure><img src="../../../../.gitbook/assets/frame_generic_light (8) (3).png" alt=""><figcaption></figcaption></figure>

### 🔧 Key Features

* **User Information Display**: Showcases user avatars, names, and timestamps alongside comments.
* **Nested Replies**: Supports threaded discussions by allowing replies to comments.
* **Interactive Actions**: Includes options for actions like replying, editing, or deleting comments.
* **Dynamic Data Binding**: Integrates seamlessly with data sources for real-time updates.
* **Customisable Styling**: Offers flexibility in appearance to match application themes.

### 🛠 Configuration Options

* **Data Source Integration**: Bind comments to APIs or databases for dynamic content.
* **Avatar and User Details**: Customize the display of user information associated with each comment.
* **Action Handlers**: Define behaviors for actions like reply, edit, or delete.
* **Styling Options**: Adjust layout, colors, and fonts to align with your application's design.

### ⚙️ Integration Tips

* **Data Binding**: Utilize Lowcoder's data binding syntax (`{{ }}`) to connect comment data to dynamic sources.
* **Event Handling**: Implement event handlers to perform actions when users interact with comments, such as submitting a reply or deleting a comment.
* **Combining with Other Components**: Integrate the Comment component with forms or user profiles to enhance user interaction.

### Component Playground

On Component Playground, you can interact with the Comment component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Comment component.

{% embed url="https://app.lowcoder.cloud/playground/comment/1" %}

### Component Auto-Docs

In the Auto-Docs of Comment component, we have shown how to use different properties of the Comment component. It also includes the Styling properties of the Comment component.

{% embed url="https://app.lowcoder.cloud/components/comment" %}

#### Properties of the Comment component <a href="#properties-of-the-table" id="properties-of-the-table"></a>

These properties are accessible in \{{ \}} notations, as well as in JavaScript Queries.

<table><thead><tr><th width="175.97265625">Property Name</th><th width="114.05859375">Type</th><th>Description</th></tr></thead><tbody><tr><td>commentList</td><td>Array</td><td>Returns an Array of Objects containing the list of Comments along with User details of the Comment component</td></tr><tr><td>deletedItem</td><td>Array</td><td>Returns an Array of Objects containing the most latest deleted comment of the Comment component</td></tr><tr><td>hidden</td><td>Boolean</td><td>Returns True or False based on whether the Comment component is hidden or not</td></tr><tr><td>mentionName</td><td>String</td><td>Returns a String containing the name of the most recently tagged Person of the Rating component</td></tr><tr><td>submittedItem</td><td>Object</td><td>Returns an Object containing the most recent Comment along with User details of the Comment component</td></tr></tbody></table>

#### Events <a href="#events" id="events"></a>

Events give you the ability to trigger further actions (with Event-Handlers).

<table><thead><tr><th width="166.04296875">Event Name</th><th width="458.8515625">Description</th></tr></thead><tbody><tr><td>Click</td><td>Triggers, when a User clicks on the User name or Avatar  on the Comment component</td></tr><tr><td>Submit</td><td>Triggers, when a User submits a new Comment</td></tr><tr><td>Delete</td><td>Triggers, when a User deletes a Comment</td></tr><tr><td>Mention</td><td>Triggers, when a User mentions anyone in the Comment</td></tr></tbody></table>

#### Methods <a href="#methods" id="methods"></a>

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

**setCommentList() :**&#x20;

comment1.setCommentList() method sets the Comment component's CommentList property, which gets shown in the Comment component.

```javascript
comment1.setCommentList([
    {
        "user": {
            "name": "John Doe",
            "avatar": "https://ui-avatars.com/api/?name=John+Doe"
        },
        "value": "Has anyone tried using Lowcode for our new internal tool yet?",
        "createdAt": "2024-09-20T10:15:41.658Z"
    },
    {
        "user": {
            "name": "Jane Smith",
            "avatar": "https://ui-avatars.com/api/?name=Jane+Smith"
        },
        "value": "Yes, I’ve been experimenting with it for automating our workflows. It's super quick to set up.",
        "createdAt": "2024-09-20T10:17:12.658Z"
    }
]);
```

**clearCommentList() :**&#x20;

comment1.clearCommentList() clears the Comment component's CommentList property and empties the Comments from the Comment component.

```javascript
comment1.clearCommentList();
```

**resetCommentList() :**&#x20;

comment1.resetCommentList()  method resets the Comment component's CommentList property to the default CommentList of the Comment component.

```javascript
comment1.resetCommentList();
```

**setDeletedItem() :**&#x20;

comment1.setDeletedItem method sets the Comment component's DeletedItem property.

```javascript
comment1.setDeletedItem([
    {
        "user": {
            "name": "Angel Maria",
            "displayName": "Angel",
            "avatar": "https://ui-avatars.com/api/?name=Michael+Brown"
        },
        "value": "That sounds interesting! What kind of automation are you building?",
        "createdAt": "2024-09-20T10:18:45.658Z"
    }
]);
```

**clearDeletedItem() :**&#x20;

comment1.clearDeletedItem() clears the Comment component's DeletedItem property and empties the DeletedItem property from the Comment component.

```javascript
comment1.clearDeletedItem();
```

**resetDeletedItem() :**&#x20;

comment1.resetDeletedItem() method resets the Comment component's DeletedItem property to the default DeletedItem property of the Comment component.

```javascript
comment1.resetDeletedItem();
```

**setSubmitedItem() :**&#x20;

comment1.setSubmitedItem() method sets the Comment component's SubmitedItem property.

```javascript
comment1.setSubmitedItem({
    "user": {
        "name": "Tom Cruise",
        "email": "tom@gmail.com"
    },
    "value": "This is a Test comment",
    "createdAt": "2025-05-13T19:48:35+05:00"
});
```

**clearSubmitedItem() :**&#x20;

comment1.clearSubmitedItem() clears the Comment component's SubmitedItem property and empties the SubmitedItem property from the Comment component.

```javascript
comment1.clearSubmitedItem();
```

**resetSubmitedItem() :**&#x20;

comment1.resetSubmitedItem method resets the Comment component's SubmitedItem property to the default SubmitedItem property of the Comment component.

```javascript
comment1.resetSubmitedItem();
```

### 📌 Use Cases

* **Feedback Sections**: Collect user feedback on products or services.
* **Discussion Forums**: Facilitate conversations among users on various topics.
* **Support Threads**: Enable users to ask questions and receive answers in a threaded format.
* **Content Comments**: Allow users to comment on articles, blogs, or media content.
