# Build Collaborative Video Apps

Lowcoder can combine a live Agora meeting with the rest of an application. Participants can talk, share a screen, chat, exchange files, ask an AI assistant for help, review a Google document, or explore a form or website together without leaving the meeting.

This guide shows how to build and bind those features in Lowcoder. It focuses on the application setup: which components, queries, states, module inputs, module outputs, and events to create. You can build only the sections your app needs.

## What You Can Build

The same meeting shell can support several experiences:

| Experience | What participants can do |
| --- | --- |
| **AI meeting room** | Meet by video, see who is online or typing, use persistent room chat, attach files, mention people, and explicitly ask an AI assistant about the conversation or attachments. |
| **Document workspace** | Meet by video, browse permitted Google Drive files, and invite everyone to open the same document. Google continues to provide the document editing and permissions. |
| **Explore Together** | Meet by video while one participant guides others through a Typeform, Google Form, or supported public website. Depending on the page, participants can share form values, navigation, pointers, or caret positions. |

## Recommended App Structure

You can build everything on one Lowcoder page. For a larger application, reusable modules make the app easier to understand and maintain.

Create:

* a main **Meeting App** containing the Agora Meeting Controller and meeting controls;
* an optional **Header** module for profile, navigation, notifications, and sign-out;
* a **Stage** module for chat, documents, forms, or websites; and
* a **Backstage** module for the local camera and participant strip.

The main app owns the meeting. It passes meeting data into the modules:

| Module input | Binding in the main app |
| --- | --- |
| `participants` | `{{ meetingParticipants.value }}` |
| `messages` | `{{ meetingController.messages }}` |
| `currentUser` | `{{ meetingUser.value }}` |

The document and Explore Together modules return a selected document or session through a module output. Their module event tells the main app when to broadcast it.

The examples use `meetingUser.value` when the components are on the main page. If you place them inside a module, create the `currentUser` input shown above and use `currentUser.value` inside that module.

> **Tip:** Build the common meeting shell first and test it with two users. Add chat, AI, documents, or Explore Together only after the meeting works.

## Understand What Stores Each Kind of Data

| Part | Use it for | Do not use it for |
| --- | --- | --- |
| **Agora Meeting Controller** | Audio, video, screen sharing, meeting participants, and short meeting signals | Persistent chat or business records |
| **Chat Controller** | Online users, typing, AI-thinking state, and live change notifications | Permanent message storage |
| **Your datasource** | Users, rooms, messages, mentions, and notifications | Camera or microphone streams |
| **Object storage** | Uploaded images and documents | Chat presence |
| **AI query** | Generating an optional assistant response | Storing the conversation |
| **Lowcoder proxy** | Loading supported forms and websites into an Explore Together session | General unrestricted web browsing |

Save anything users expect to find later in a durable datasource.

“Presence” has three separate bindings in these apps:

* meeting presence comes from `meetingController.localUser` and `meetingController.participants`;
* chat presence comes from `chatController.onlineUsers` and `chatController.typingUsers`; and
* page presence, such as pointers and carets, appears only inside a supported Explore Together page.

Adding the Agora meeting does not automatically add persistent chat or shared form fields.

## Before You Start

Prepare the services needed by your chosen experience:

1. An [Agora account and project](https://console.agora.io/) with an App ID and enabled App Certificate.
2. A trusted server that issues Agora RTC and RTM tokens.
3. Authentication that gives every participant a stable user ID and display name.
4. Hocuspocus when you need Chat Controller or Explore Together.
5. A datasource for durable users, messages, rooms, and notifications.
6. Object storage when users can attach files.
7. An AI provider when the app includes an assistant.
8. Google or Typeform authorization when users browse private provider content.

Use HTTPS and WSS in production. Browsers require a secure context for camera, microphone, and screen capture.

## 1. Bind the Signed-In User

Authenticate the user before they enter the meeting. The pattern is not tied to one identity provider.

After sign-in, make one user object available to the app. In the examples below, a Temporary State named `meetingUser` contains:

```javascript
{
  id: "user-42",
  name: "Alex Morgan",
  email: "alex@example.com",
  picture: "https://example.com/alex.png"
}
```

Adapt the field names to your identity provider. The important requirements are:

* `meetingUser.value.id` is stable and unique;
* `meetingUser.value.name` is safe to show to other users; and
* the app redirects unauthenticated users to sign-in.

Create or update the signed-in user in your datasource. That record can also populate mention suggestions and receive notifications.

For a suite of meeting apps, add a home or navigation page linking to the AI room, document workspace, and Explore Together workspace. A reusable header can show:

* `{{ meetingUser.value.picture }}` as the avatar;
* `{{ meetingUser.value.name }}` as the display name;
* `{{ (loadUnreadNotifications.data || []).length }}` as an unread badge; and
* a sign-out event that ends the meeting before closing the user session.

Create `loadUnreadNotifications` with a filter for the signed-in recipient and unread status. You can run it periodically, for example every 15 seconds, and after a notification is marked as read. Bind a notification click to your mark-read query and then navigate to the destination stored in the notification record.

## 2. Build the Common Agora Meeting

### Add the Meeting Controller

Drag an **Agora Meeting Controller** into the main app and rename it `meetingController`.

Bind its properties:

| Meeting Controller property | Example binding |
| --- | --- |
| **App ID** | Your public Agora App ID |
| **Meeting Name** | `{{ url.query.meetingId || "demo-room" }}` |
| **Local User ID** | `{{ meetingUser.value.id }}` |
| **Local User Name** | `{{ meetingUser.value.name }}` |
| **RTC Token** | `{{ getMeetingTokens.data.rtcToken }}` |
| **RTM Token** | `{{ getMeetingTokens.data.rtmToken }}` |

Use a dynamic meeting ID from your booking, event, or URL instead of using one fixed room for every meeting.

Never place the Agora App Certificate in a Lowcoder app, JavaScript query, browser storage, or application export. Generate tokens on a trusted server.

Lowcoder's multi-container setup maps these deployment variables into its token service:

```text
AGORA_APP_ID
AGORA_APP_CERTIFICATE
AGORA_CORS_ALLOW_ORIGIN
```

A meeting name routes users to a channel; it is not a password. The token service must check that the signed-in user is allowed to join the requested meeting.

### Create the Token Query

Create a REST query named `getMeetingTokens`.

| Setting | Value |
| --- | --- |
| Method | `GET` |
| URL | `https://tokens.example.com/rte/{{ meetingController.meetingName }}/publisher/userAccount/{{ meetingController.localUserID }}/` |
| Run when page loads | Off |

Replace `https://tokens.example.com` with the address of your token service. The response must contain:

```json
{
  "rtcToken": "...",
  "rtmToken": "..."
}
```

Add a success event to `getMeetingTokens` that runs:

```javascript
meetingController.startMeeting()
```

Add a **Join meeting** button whose click event runs `getMeetingTokens`. This order matters: first fetch current tokens, then join.

Add a **Leave meeting** button whose click event runs:

```javascript
meetingController.endMeeting()
```

Also run `meetingController.endMeeting()` from a Before unload query so the participant leaves cleanly when the page closes.

### Create a Combined Participant List

`meetingController.participants` contains the other participants. The current participant is available separately as `meetingController.localUser`.

Create a Transformer named `meetingParticipants`:

```javascript
if (!meetingController.meetingActive) return [];

return [
  { ...meetingController.localUser, localUser: true },
  ...(meetingController.participants || []),
];
```

Use `{{ meetingParticipants.value }}` everywhere the app or a module needs the complete participant list.

Each item can contain:

```javascript
{
  user: "user-42",
  userName: "Alex Morgan",
  audiostatus: false,
  streamingVideo: true,
  streamingSharing: false,
  speaking: false,
  localUser: true
}
```

Only the current participant has `localUser: true`, because the transformer adds it.

### Display Participant Cameras

Add a **List View** to the stage or backstage module.

Set its **No. of rows** to:

```javascript
{{ participants.value }}
```

If you did not use a module, bind it directly to:

```javascript
{{ meetingParticipants.value }}
```

Inside the first List View item, add a **Camera Stream** and bind **Video Stream ID** to:

```javascript
{{ currentItem }}
```

Add a Text component for the participant name:

```javascript
{{ currentItem.userName || "User" }}
```

Useful optional bindings include:

| UI | Binding |
| --- | --- |
| Muted icon | `{{ currentItem.audiostatus ? "/icon:solid/microphone" : "/icon:solid/microphone-slash" }}` |
| Speaking border | `{{ currentItem.speaking ? "#1A237E" : "transparent" }}` |
| Camera-off indicator | `{{ !currentItem.streamingVideo }}` |
| “You” label | `{{ currentItem.localUser ? "You" : "" }}` |

Bind **Profile Image URL** to an avatar found by `currentItem.user`, or use a generated fallback:

```javascript
{{
  "https://api.dicebear.com/7.x/initials/svg?seed=" + currentItem.userName
}}
```

The participant object does not automatically contain your user database profile. If you want stored profile images, add a `users` module input and look up the matching record by `currentItem.user`.

### Display Screen Sharing

Add a **Screen Share Stream** to the main content area. Bind **Video Stream ID** to:

```javascript
{{
  meetingParticipants.value.find(
    participant => participant.streamingSharing
  ) || {}
}}
```

Hide the empty screen-share area when no participant is sharing:

```javascript
{{ !meetingParticipants.value.some(participant => participant.streamingSharing) }}
```

### Add Meeting Controls

Connect buttons to these methods:

| Button | Click action |
| --- | --- |
| Mute | `meetingController.audioControl()` |
| Camera | `meetingController.videoControl()` |
| Share screen | `meetingController.startSharing()` |
| Leave | `meetingController.endMeeting()` |

Disable or hide the controls while:

```javascript
{{ !meetingController.meetingActive }}
```

### Bind Stage and Backstage Modules

Create a `participants` data input on both modules, with an empty-array default. In the parent Meeting App, bind each Module component input to:

```javascript
{{ meetingParticipants.value }}
```

If the stage responds to meeting signals, also create a `messages` data input and bind it to:

```javascript
{{ meetingController.messages }}
```

This is the shared contract used by the document and Explore Together examples later in this guide.

## 3. Add Persistent Chat and Live Presence

Add one **Chat Controller** and one **Chat Box** to your chat stage.

Rename them `chatController` and `chatBox`.

### Prepare the Chat Queries

Create datasource queries with these responsibilities:

| Query | Responsibility |
| --- | --- |
| `loadRooms` | Return rooms the signed-in user may access |
| `loadMessages` | Return messages for `chatController.currentRoomId` |
| `saveMessage` | Save the user's message and attachment metadata |
| `loadUsers` | Return users for the mention picker |
| `loadInvites` | Optional private-room invitations |
| `saveMentionNotifications` | Optional notifications for mentioned users |

A minimal room record looks like:

```javascript
{
  id: "general",
  name: "General",
  type: "public"
}
```

An AI room can include:

```javascript
{
  id: "assistant",
  name: "Meeting Assistant",
  type: "llm",
  llmQueryName: "runMeetingAssistant"
}
```

A minimal message record looks like:

```javascript
{
  id: "message-101",
  roomId: "general",
  text: "Please review the attached file.",
  authorId: "user-42",
  authorName: "Alex Morgan",
  authorType: "user",
  timestamp: 1710000000000,
  files: []
}
```

Suggested datasource fields are:

| Record | Useful fields |
| --- | --- |
| User | `id`, `name`, `email`, `picture` |
| Room | `id`, `name`, `type`, optional `llmQueryName` |
| Message | `id`, `roomId`, `text`, `authorId`, `authorName`, `authorType`, `timestamp`, `files` |
| Notification | `id`, `recipientUserId`, `title`, `body`, `destination`, `read`, `createdAt` |

### Bind Chat Controller

| Chat Controller property | Binding |
| --- | --- |
| **Application ID** | A stable collaboration namespace such as `meeting-suite-v1` |
| **User ID** | `{{ meetingUser.value.id }}` |
| **User Name** | `{{ meetingUser.value.name }}` |

Do not generate a different Application ID per browser. Users can see each other's presence only when they connect to the same Application ID.

For a connection indicator, bind a Text component to `{{ chatController.connectionStatus }}`. Do not enable realtime-only actions until `{{ chatController.ready }}` is true. See [Realtime Shared State and Presence](../realtime-collaboration.md) if the controller remains offline.

### Bind Chat Box

| Chat Box property | Binding |
| --- | --- |
| **Messages** | `{{ loadMessages.data || [] }}` |
| **Current User ID** | `{{ chatController.userId }}` |
| **Current User Name** | `{{ chatController.userName }}` |
| **Rooms** | `{{ loadRooms.data || [] }}` |
| **Current Room ID** | `{{ chatController.currentRoomId }}` |
| **Pending Invites** | `{{ loadInvites.data || [] }}` |
| **Typing Users** | `{{ chatController.typingUsers }}` |
| **Online Users** | `{{ chatController.onlineUsers }}` |
| **AI Is Thinking** | `{{ !!chatController.aiThinkingRooms?.[chatController.currentRoomId] }}` |
| **Mention Candidates** | `{{ (loadUsers.data || []).map(user => ({ id: user.id, label: user.name })) }}` |

Enable **Show Rooms Panel** when users should change rooms from Chat Box.

If you do not support private-room invitations, bind **Pending Invites** to `{{ [] }}` instead of creating `loadInvites`.

### Bind Chat Events

| Chat Box event | Action |
| --- | --- |
| `startTyping` | Run `chatController.startTyping(chatController.currentRoomId)` |
| `stopTyping` | Run `chatController.stopTyping()` |
| `roomSwitch` | Run `chatController.switchRoom(chatBox.pendingRoomId)`, then `loadMessages` |
| `messageSent` | Run the `sendChatMessage` JavaScript query below |
| `fileUpload` | Run the attachment upload flow from the next section |

Create a JavaScript query named `sendChatMessage`:

```javascript
const sendMessageFlow = async () => {
  const attachments = pendingAttachments.value || [];

  await saveMessage.run({
    roomId: chatController.currentRoomId,
    text: chatBox.lastSentMessageText,
    authorId: meetingUser.value.id,
    authorName: meetingUser.value.name,
    authorType: "user",
    files: attachments,
  });

  chatController.setRoomData(
    chatController.currentRoomId,
    "messagePing",
    {
      roomId: chatController.currentRoomId,
      authorId: meetingUser.value.id,
      timestamp: Date.now(),
    }
  );

  await loadMessages.run();
  chatController.stopTyping();
  pendingAttachments.setValue([]);
};

sendMessageFlow();
```

The values passed to `.run(...)` must match the variables used by your `saveMessage` query.

On Chat Controller's `roomDataChanged` event, run `loadMessages`. This lets another participant's saved message appear without refreshing the page.

> **Important:** Chat Controller tells clients that room data changed; it is not the message database. `loadMessages` must still read from your datasource.

### Add Mention Notifications

After `saveMessage` succeeds:

1. Compare the message text with the names in `loadUsers.data`.
2. Ignore the signed-in user and the AI mention.
3. Insert one unread notification for each matched user.
4. Let the header reload unread notifications.

A notification record should contain at least the recipient user ID, message or room ID, title, preview text, read status, and creation time. Store an app or page destination if clicking a notification should reopen the room.

## 4. Bind File Attachments

In Chat Box:

* enable **Allow File Upload**;
* set **Max Files** to a sensible limit; and
* optionally restrict **File Type**, for example `{{ [".png", ".jpg", ".pdf"] }}`.

Create a Temporary State named `pendingAttachments` with the initial value `[]`.

When `fileUpload` runs, Chat Box exposes two aligned arrays:

* `chatBox.files` contains file names, types, and sizes; and
* `chatBox.value` contains the file contents.

Upload each file with your storage query. Store the returned metadata in `pendingAttachments`:

```javascript
[
  {
    name: "requirements.pdf",
    type: "application/pdf",
    url: "https://storage.example.com/..."
  }
]
```

Bind the Chat Box `fileUpload` event to a JavaScript query such as `uploadPendingFiles`. That query should:

1. loop over `chatBox.files` and `chatBox.value` by index;
2. run the upload query for each file;
3. collect the authorized URLs returned by storage; and
4. call `pendingAttachments.setValue(uploadedFiles)`.

For example, adapt this query to the variables and response returned by your storage query:

```javascript
const uploadFiles = async () => {
  const uploadedFiles = [];

  for (let index = 0; index < chatBox.files.length; index += 1) {
    const file = chatBox.files[index];
    const result = await uploadChatFile.run({
      fileName: file.name,
      contentType: file.type,
      fileData: chatBox.value[index],
    });

    uploadedFiles.push({
      name: file.name,
      type: file.type,
      url: result.url,
    });
  }

  pendingAttachments.setValue(uploadedFiles);
};

uploadFiles();
```

`sendChatMessage` then saves `pendingAttachments.value` in the message's `files` field.

> **Important:** Capture files during `fileUpload`. Do not wait until `messageSent` to read `chatBox.files`, because Chat Box clears its pending files when the message is sent.

Chat Box does not store files. Use private storage or short-lived signed URLs for non-public content and recheck authorization when users download an attachment.

## 5. Bind an AI Assistant

Use an `llm` room and invoke the AI only when the user explicitly mentions it, for example `@AI`.

Chat Box exposes:

```javascript
{{ chatBox.lastSentMessageTagsLlm }}
```

This becomes true when the last sent message mentioned the AI.

If the room includes an AI assistant, replace the basic `sendChatMessage` query from the previous section with this complete version. Keeping the user-message and AI-message steps in one async function also preserves attachment metadata until the AI request finishes:

```javascript
const sendMessageWithAi = async () => {
  const attachments = pendingAttachments.value || [];

  await saveMessage.run({
    roomId: chatController.currentRoomId,
    text: chatBox.lastSentMessageText,
    authorId: meetingUser.value.id,
    authorName: meetingUser.value.name,
    authorType: "user",
    files: attachments,
  });

  chatController.setRoomData(
    chatController.currentRoomId,
    "messagePing",
    { authorId: meetingUser.value.id, timestamp: Date.now() }
  );

  await loadMessages.run();
  chatController.stopTyping();

  const currentRoom = (loadRooms.data || []).find(
    room => room.id === chatController.currentRoomId
  );

  const shouldRunAi =
    currentRoom?.type === "llm" &&
    chatBox.lastSentMessageTagsLlm === true;

  if (!shouldRunAi) {
    pendingAttachments.setValue([]);
    return;
  }

  chatController.setAiThinking(chatController.currentRoomId, true);

  try {
    const aiResult = await runMeetingAssistant.run({
      roomId: chatController.currentRoomId,
      message: chatBox.lastSentMessageText,
      history: loadMessages.data || [],
      files: attachments,
    });

    await saveMessage.run({
      roomId: chatController.currentRoomId,
      text: aiResult.text,
      authorId: "__llm_bot__",
      authorName: "AI",
      authorType: "assistant",
      files: [],
    });

    chatController.setRoomData(
      chatController.currentRoomId,
      "messagePing",
      { authorId: "__llm_bot__", timestamp: Date.now() }
    );

    await loadMessages.run();
  } finally {
    chatController.setAiThinking(chatController.currentRoomId, false);
    pendingAttachments.setValue([]);
  }
};

sendMessageWithAi();
```

Adapt `aiResult.text` to the response shape returned by your AI query.

Run the AI request on a trusted server. Keep the provider key out of the Lowcoder app. Send only the authorized room history and attachments the user intended to share with the assistant.

If attachments are included, convert images and documents to the input format supported by your provider. Reject unsupported types before calling the AI.

## 6. Build a Shared Google Document Stage

Create a Module named `DocumentStage`.

### Create the Module Interface

Add these module inputs:

| Input | Type | Default |
| --- | --- | --- |
| `participants` | Data | `[]` |
| `messages` | Data | `[]` |
| `currentUserId` | Data | `""` |

Add:

* a Temporary State named `selectedDocument`, initially `null`;
* a module output named `documentToShare` with value `{{ selectedDocument.value }}`; and
* a module event named `onShareDocument`.

In the main app, bind the DocumentStage Module component:

| Input | Binding |
| --- | --- |
| `participants` | `{{ meetingParticipants.value }}` |
| `messages` | `{{ meetingController.messages }}` |
| `currentUserId` | `{{ meetingUser.value.id }}` |

### Authorize Google Drive

Use Google OAuth or an authorized Google datasource. Request only the scopes required by your app.

Create a REST query named `listDriveFiles`:

| Setting | Value |
| --- | --- |
| Method | `GET` |
| URL | `https://www.googleapis.com/drive/v3/files` |
| Header | `Authorization: Bearer {{ googleAccessToken.value }}` |
| `q` parameter | `'{{ currentFolderId.value }}' in parents and trashed=false` |
| `fields` parameter | `files(id,name,mimeType,modifiedTime,webViewLink,thumbnailLink,parents)` |
| `orderBy` parameter | `folder,name` |

Create `currentFolderId` with initial value `root`, and run `listDriveFiles` after Google sign-in and whenever the folder changes.

Bind a Table or List View to:

```javascript
{{ listDriveFiles.data.files || [] }}
```

When a user selects an item:

* if its MIME type is `application/vnd.google-apps.folder`, set `currentFolderId` to that item ID and run `listDriveFiles`;
* if it has a `webViewLink`, set `selectedDocument` to the item; and
* otherwise open the file using the provider's supported download or view action.

Bind an IFrame URL to:

```javascript
{{ selectedDocument.value?.webViewLink || "" }}
```

If Google or the selected file type refuses to load in an IFrame, show an **Open in Google** button using the same `webViewLink` instead.

Add a **View together** button. Its click event should first set `selectedDocument`, then use **Trigger module event** to trigger `onShareDocument`.

### Broadcast the Selected Document

On the DocumentStage Module component in the main app, bind `onShareDocument` to:

```javascript
meetingController.broadCast({
  type: "documentShare",
  senderId: meetingUser.value.id,
  document: documentStage.documentToShare,
});
```

The Meeting Controller places received channel messages in `meetingController.messages`. In `DocumentStage`, add a Data Responder watching:

```javascript
{{ JSON.stringify(messages.value) }}
```

Run:

```javascript
const allMessages = messages.value || [];
const received = allMessages[allMessages.length - 1];
const signal = received?.channelmessage?.message;

if (
  signal?.type === "documentShare" &&
  signal.senderId !== currentUserId.value
) {
  selectedDocument.setValue(signal.document);
}
```

> **Important:** Lowcoder synchronizes which document is open. Google provides the actual document collaboration. Every participant must have the correct Google account and file permission.

## 7. Build Explore Together Modules

Explore Together works best as one parent `ExploreStage` module containing three child modules:

* `TypeformStage`;
* `GoogleFormsStage`; and
* `WebsiteStage`.

A Tabbed Container in `ExploreStage` lets the user choose the provider.

### Give Every Provider Module the Same Interface

On each provider module, create:

| Item | Name | Value |
| --- | --- | --- |
| Input | `participants` | Data, default `[]` |
| Input | `messages` | Data, default `[]` |
| Output | `sessionToShare` | The driver query's `data.data.broadcast` |
| Event | `onExploreTogether` | Triggered after the driver session is created |
| Temporary State | `localParticipant` | `{}` |
| Temporary State | `sharedPageUrl` | `null` |
| Temporary State | `receivedSession` | `null` |

Add a Data Responder watching:

```javascript
{{ JSON.stringify(participants.value) }}
```

Run:

```javascript
const current = (participants.value || []).find(
  participant => participant.localUser
);

localParticipant.setValue(current || {});
```

Bind the provider module's IFrame URL to:

```javascript
{{ sharedPageUrl.value || "" }}
```

### Create the Driver Session Query

Create a REST query for the provider selected by the presenter:

| Provider | POST endpoint | Provider URL field |
| --- | --- | --- |
| Typeform | `/proxy/typeform/session` | `typeformUrl` |
| Google Forms | `/proxy/google-forms/session` | `googleFormUrl` |
| Website | `/proxy/website/session` | `websiteUrl` |

Set the method to `POST`, the body type to JSON, and the `Content-Type` header to `application/json`.

Use your Lowcoder proxy service as the base URL. For example:

```text
https://lowcoder.example.com/proxy/website/session
```

The driver request body follows this pattern:

```javascript
{
  websiteUrl: selectedWebsite.value.url,
  roomId: selectedWebsite.value.id,
  role: "driver",
  editorId: localParticipant.value.user,
  username: localParticipant.value.userName
}
```

For Typeform, replace `websiteUrl` with `typeformUrl`. For Google Forms, replace it with `googleFormUrl`.

For Google Forms, obtain the source URL from the selected Google Drive form's `webViewLink`. For Typeform, use the form's display URL returned by the Typeform API. For a website, use an approved HTTP(S) URL entered or selected by the user.

When a user enters a website manually, create the selected record before running the driver query:

```javascript
selectedWebsite.setValue({
  id: `website-${Date.now()}`,
  url: websiteUrlInput.value.trim(),
});
```

Run the driver session query after that state change.

On driver query success:

1. set `sharedPageUrl` to `{{ createDriverSession.data.data.proxiedUrl }}`; and
2. trigger the module event `onExploreTogether`.

Bind the module output `sessionToShare` to:

```javascript
{{ createDriverSession.data.data.broadcast }}
```

The exact query name may be `createTypeformSession`, `createGoogleFormsSession`, or `createWebsiteSession`; update the bindings accordingly.

### Re-Emit the Event from ExploreStage

Bind `participants` and `messages` from ExploreStage into all three child Module components:

```javascript
{{ participants.value }}
{{ messages.value }}
```

Create an ExploreStage output named `sessionToShare`. Return the active child module's output:

```javascript
{{
  providerTabs.selectedTabKey === "googleForms"
    ? googleFormsStage.sessionToShare
    : providerTabs.selectedTabKey === "website"
      ? websiteStage.sessionToShare
      : typeformStage.sessionToShare
}}
```

Add an ExploreStage event named `onExploreTogether`. When a child module triggers its event, use **Trigger module event** to re-emit `onExploreTogether` from ExploreStage.

### Broadcast the Session from the Main App

Bind the main app's ExploreStage Module event to:

```javascript
meetingController.broadCast({
  type: "exploreTogether",
  senderId: meetingUser.value.id,
  provider: exploreStage.selectedProvider,
  session: exploreStage.sessionToShare,
});
```

Expose the selected provider from ExploreStage as an output named `selectedProvider`, bound to `{{ providerTabs.selectedTabKey }}`.

### Join as a Follower

Each provider module should watch its `messages` input with a Data Responder:

```javascript
const allMessages = messages.value || [];
const received = allMessages[allMessages.length - 1];
const signal = received?.channelmessage?.message;

if (
  signal?.type === "exploreTogether" &&
  signal.provider === "website" &&
  signal.senderId !== localParticipant.value.user
) {
  receivedSession.setValue(signal.session);
}
```

The example above is for `WebsiteStage`. Use `typeform` in TypeformStage and `googleForms` in GoogleFormsStage. This prevents hidden provider modules from joining the wrong session.

Create a follower REST query using the provider's join endpoint:

| Provider | POST endpoint |
| --- | --- |
| Typeform | `/proxy/typeform/session/join` |
| Google Forms | `/proxy/google-forms/session/join` |
| Website | `/proxy/website/session/join` |

Example website follower body:

```javascript
{
  websiteUrl: receivedSession.value.websiteUrl,
  roomId: receivedSession.value.roomId,
  collab: receivedSession.value.collab,
  role: "follower",
  editorId: localParticipant.value.user,
  username: localParticipant.value.userName
}
```

Use `typeformUrl` or `googleFormUrl` for the other providers.

Add another Data Responder watching:

```javascript
{{ JSON.stringify(receivedSession.value) }}
```

When a valid session arrives, run the follower query. On success, set:

```javascript
sharedPageUrl.setValue(joinSession.data.data.proxiedUrl)
```

Both presenter and follower must display the returned `proxiedUrl`. Do not replace it with the original provider URL, because the original URL does not contain the Explore Together connection.

### Provider Selection Bindings

For Typeform, create an authorized `GET https://api.typeform.com/forms` query. Bind a Table or Select component to the returned forms and store the selected form's `id` and `_links.display` URL. Keep the Typeform token in a server-side datasource or query.

For Google Forms:

1. authorize Google;
2. query `GET https://www.googleapis.com/drive/v3/files` with `q=mimeType='application/vnd.google-apps.form'`;
3. bind the results to a Table or List View; and
4. use the selected form's ID and `webViewLink` in the driver session query.

For a generic website, use an Input component. Bind the **Disabled** property of the **Explore together** button to:

```javascript
{{
  !/^https?:\/\//i.test(websiteUrlInput.value || "")
}}
```

Only enable URLs permitted by your server's website allowlist.

### What Participants Can Share

| Workspace | Shared experience | Important behavior |
| --- | --- | --- |
| **Typeform** | Current step, next/back actions, text and choice values, answers, and live caret presence | Test every form you publish because provider markup can change. |
| **Google Forms** | Text and choice values, page navigation, and live caret presence | Remote submit is not applied automatically. Decide who submits and explain it in the app. |
| **Supported website** | Standard text/select/checkbox/radio fields, presenter scrolling, pointers, text selections, click highlights, and navigation offers | Followers can choose **Follow** or **Stay** when the presenter navigates. Password and file fields are not synchronized. |

Canvas content, media players, custom widgets, cross-origin content, and internal JavaScript state may not synchronize. Test each supported site before offering it to users.

## 8. Configure the Proxy for Production

External forms and websites must use the Lowcoder proxy for Explore Together.

Configure:

```text
LOWCODER_API_KEY_SECRET
LOWCODER_HOCUSPOCUS_URL
LOWCODER_HOCUSPOCUS_SECRET
LOWCODER_PROXY_ALLOWED_HOSTS
LOWCODER_GOOGLE_FORMS_ALLOWED_HOSTS
LOWCODER_WEBSITE_ALLOWED_HOSTS
```

Use the three allowlists for Typeform, Google Forms, and generic websites respectively. An empty generic website allowlist permits all public hosts, which is useful for local testing but usually too broad for production.

Keep Google, Typeform, AI, storage, and proxy credentials in server-side datasources or environment variables. Never copy access tokens from a test app into published documentation or exported applications.

## Complete Binding Checklist

Before testing, confirm these connections:

| From | To |
| --- | --- |
| Signed-in user | Meeting Controller user ID and name |
| Token query response | Meeting Controller RTC and RTM token properties |
| Token query success | `meetingController.startMeeting()` |
| Meeting Controller local user + participants | `meetingParticipants` Transformer |
| `meetingParticipants.value` | Stage and Backstage `participants` inputs |
| `meetingController.messages` | Document/Explore Stage `messages` input |
| Participant List View item | Camera Stream Video Stream ID |
| Sharing participant | Screen Share Stream Video Stream ID |
| Chat Controller presence | Chat Box typing and online properties |
| Chat Box `messageSent` | Save message, signal room, reload messages |
| Chat Box `fileUpload` | Upload files and fill `pendingAttachments` |
| Chat Controller `roomDataChanged` | Reload durable messages |
| AI mention flag | Run AI query only when explicitly mentioned |
| Document module event | Broadcast document session through Meeting Controller |
| Explore Stage event | Broadcast proxy session through Meeting Controller |
| Received meeting signal | Set selected document or run follower session query |
| Proxy response `proxiedUrl` | Provider IFrame URL |

## Test with Two Users

Use two browsers or one normal and one private window with different signed-in users.

Test in this order:

1. Both users receive tokens and join the same meeting.
2. Each user sees the other's camera, name, mute state, and speaking state.
3. Mute, camera, screen share, and leave controls work.
4. Chat online and typing presence updates.
5. Messages survive refresh and a Hocuspocus restart because they come from the datasource.
6. Attachments remain authorized and downloadable.
7. The AI runs only after an AI mention, shows thinking state, and saves its response.
8. Mentioned users receive the intended notifications.
9. Both users can access a shared Google document.
10. Explore Together creates one driver session and joins the same session for the follower.
11. Supported fields, pointers, steps, scrolling, and navigation synchronize as documented.
12. Form submission behavior is clear and does not create duplicate submissions.

Also test denied camera permissions, expired tokens, failed uploads, AI errors, inaccessible documents, blocked websites, refreshes, and participant disconnects.

## Troubleshooting Bindings

| Problem | Check |
| --- | --- |
| Meeting does not start | App ID, RTC token, RTM token, meeting name, user ID, and token query success event |
| One browser replaces another | Every participant must have a different stable Local User ID |
| Local user is missing from a module | The `meetingParticipants` Transformer adds `localUser: true` and is bound to the module input |
| Remote cameras have no place to render | List View is bound to participants and Camera Stream receives `{{ currentItem }}` |
| Screen share is active but blank | Screen Share Stream receives the participant whose `streamingSharing` value is true |
| Typing or online users never update | Chat Controller uses the same Application ID and can reach Hocuspocus |
| Chat disappears after refresh | Save and reload messages from a datasource rather than relying on shared state |
| Attachment URLs are missing | Capture and upload files on `fileUpload`, before `messageSent` clears them |
| AI replies to every message | Gate the AI query with `chatBox.lastSentMessageTagsLlm` |
| Shared document does not open | Module event fires, output contains the document, `messages` is bound, and receiver reads `channelmessage.message` |
| Follower opens a separate Explore Together session | Pass the driver's `roomId` and `collab` into the `/session/join` query |
| IFrame opens but nothing synchronizes | Bind the proxy response's `proxiedUrl`, not the original page URL |
| Google document is forbidden | Every participant needs permission from Google |
| Website is rejected | URL must be public HTTP(S) and permitted by the website allowlist |

## Production Checklist

* Keep Agora certificates, AI keys, storage credentials, provider tokens, and proxy secrets on trusted servers.
* Authenticate and authorize Agora token, upload, AI, Google, proxy-session, and download requests.
* Use stable user IDs, unguessable meeting IDs, and scoped, short-lived tokens.
* Use HTTPS/WSS and restrict CORS and proxy host allowlists.
* Store durable messages, users, notifications, and business records in your datasource.
* Use Chat Controller and Agora RTM only for presence and live signals.
* Apply file size/type limits, malware scanning where appropriate, and short-lived file URLs.
* Confirm provider permissions before sharing a document or form.
* Make it clear who is presenting, who may edit, who submits forms, and what data is sent to AI.
* Define retention and privacy rules for messages, attachments, AI prompts, and shared sessions.

## Related Documentation

* [Chat Box](visual-components/chat-box.md)
* [Chat Controller](visual-components/chat-controller.md)
* [Realtime Shared State and Presence](../realtime-collaboration.md)
* [Agora secure token authentication](https://docs.agora.io/en/realtime-media/rtm/build/connect-and-authenticate/authentication-workflow)
