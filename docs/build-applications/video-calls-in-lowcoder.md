# Video Calls in Lowcoder

Collaboration features, especially interactive video calls, in customer-facing and internal employee apps are crucial for modern Applications.&#x20;

For customer-facing apps, this enhances engagement, provides immediate support, and personalizes the user experience, fostering customer satisfaction and loyalty.&#x20;

For internal apps, it streamlines communication, enables real-time problem-solving, and promotes team cohesion, boosting productivity and innovation. Combining these collaboration tools ensures seamless interaction, reduces response times, and creates a more connected and efficient workflow, which is essential for maintaining a competitive edge and achieving business success.

We wanted to give you, as an application developer, the maximum freedom at the smallest cost possible. After a research phase, we decided to integrate Agora SDK in Lowcoder so that you can build Video-Meeting Experiences inside your Apps.

{% embed url="https://agora.io/" %}

{% hint style="info" %}
To make the docs readable, we will name the user who is in a Video Meeting "**You**" and other users who are in the same Meeting Room "**Attendees**".
{% endhint %}

## Preparation

To use Video Meetings based on Agora SDKs in Lowcoder, you need to create an Account with Agora.&#x20;

{% embed url="https://console.agora.io" %}

#### Step 1: Create an Agora Account

1. **Sign Up**: Go to [Agora Console](https://console.agora.io/) and sign up for a new account if you don't already have one.
2. **Log In**: After creating your account, log in to the Agora Console.

<figure><img src="../.gitbook/assets/Agora Meetings  Login to Agora.png" alt=""><figcaption></figcaption></figure>

{% hint style="success" %}
The first steps and even some meeting hours are free. Only if you have a higher volume of meeting hours than your app users spend do you need to purchase a plan. This allows you to get to know and test intensely - free of charge.
{% endhint %}

#### Step 2: Create a New Project

1. **Navigate to Projects**: Once logged in, go to the "Projects" section on the Agora Console.
2. **Create a Project**:
   * Click on "Create" to start a new project.
   * Enter a name for your project (e.g., "MeetingProject").
   * Select "App ID without Certificate" or "App ID with Certificate" based on your security needs. For production environments, it is recommended to use "App ID with Certificate".

<figure><img src="../.gitbook/assets/Agora Meetings  Create Project.png" alt=""><figcaption></figcaption></figure>

{% hint style="info" %}
If you use App ID with Certificate, you will need the additional component to install, which is the Agora Token Server.
{% endhint %}

#### Step 3: Obtain App ID

1. **App ID**: After creating the project, you will see your newly created project listed. Click on the project name to view its details.
2. **Copy the App ID**: In the project details, you will find your App ID. Copy this App ID as you will need it for integrating Agora SDKs.

<figure><img src="../.gitbook/assets/Agora Meetings  Copy App ID.png" alt=""><figcaption></figcaption></figure>

#### Step 4: Enable Required Services

1. **RTM Service**: Ensure that the Real-Time Messaging (RTM) service is enabled for your project. This can be done from the "Projects" settings.
2. **RTC Service**: Ensure that the Real-Time Communication (RTC) service is enabled for your project.

#### Step 5: Set Up Token Generation (Optional but Recommended)

1. **Enable App Certificate**: If you opted for "App ID with Certificate," you need to enable the App Certificate.
   * Go to the "Security" tab in your project settings.
   * Enable the App Certificate.
   * Copy the App Certificate as it will be used to generate tokens.\


To use the App Certificate (a token-based additional security layer for your meetings and real-time communication), you will need to operate your own Token Server. This is easy, based on the prepared standard Docker image.

{% embed url="https://github.com/AgoraIO-Community/agora-token-service" %}

You can read more details about Agora [Token Management here](https://docs.agora.io/en/video-calling/get-started/authentication-workflow?platform=web). However, the public docker image and the ready integration in Lowcoder make it truly easy.

The public Standard Docker Image of the Token Server needs 3 ENV Variables:&#x20;

```
APP_CERTIFICATE // the key, copied from the Agora Project Console
APP_ID // your Agora Ap Project ID, copied from the Agora Project Console
CORS_ALLOW_ORIGIN // control which domains can have CORS access
```

As soon as the Token Server is up and running, you can create a Rest Data Query like this:

```
HTTP GET
https://<tokenServerAddress>/rte/{{meetingController.meetingName}}/publisher/userAccount/{{meetingController.localUserID}}/
```

As a Response, you will get back a JSON, which contains 2 Tokens.

```json
{
  "rtcToken": "007eJxSYC ... wACAAD//+loLdY=",
  "rtmToken": "007eJxSYH ... MPCAAA//+1IzWK"
}
```

{% hint style="warning" %}
If you have activated "App Certificates" in the Agora Project Settings and so use the Agora Token Server, then you will need both Tokens to Start a Meeting at the Agora Meeting Controller Component.
{% endhint %}

{% hint style="success" %}
We strongly recommend to use Agora Meeting Tokens to ensure a secure Meeting and Realtime Messages Experience for your Users.
{% endhint %}

### Agora Token Handling

The flow of the Agora Tokens for Meetings is like this:

1. **User clicks 'Start Meeting' button**:
   * The user initiates the process by clicking the "Start Meeting" button in the application.
2. **Token Server is Requested**:
   * The application sends a request to the Token Server to obtain the necessary tokens for the session.
3. **Token Server responds with rtcToken and rtmToken**:
   * The Token Server responds with the required `rtcToken` and `rtmToken` for the session.
4. **App Developer binds Data Query Response using Handlebars**:
   * The response data containing the tokens is processed and bound to the application using Handlebars templating.
5. **Tokens are assigned to Agora Meeting Controller Component**:
   * The tokens are assigned to the appropriate fields in the Agora Meeting Controller Component, enabling the meeting session to start.
6. Call the function startMeeting by JavaScript or Event Handler
   * By the help of an Event Handler or by JavaScript the App Creator can now call the yourMeetingController.startMeeting() Function of the Meeting Controller. _(before that, a single Agora Meeting Controller Component must be placed in the App)_

<figure><img src="../.gitbook/assets/Agora Meetings  Start Meeting.png" alt=""><figcaption></figcaption></figure>

## Video Meeting Components

<figure><img src="../.gitbook/assets/Agora Meetings  Components.png" alt=""><figcaption><p>3 Dedicated Components for Video Meetings</p></figcaption></figure>

There are 3 components to build a Video-Call Meeting experience.

* Agora Meeting Controller - the central controlling component
* Camera Stream - show the camera stream of you or the attendees
* Screen Share Stream - shows the screen share stream of you

### Agora Meeting Controller

The Agora Meeting Controller is the central Component that controls all aspects of the meeting and provides the necessary data objects and functions.

We built the Agora Meeting Controller around the "Drawer" Component, so you can have a visual space where the App Creator can display Meeting Configuration Settings.

<figure><img src="../.gitbook/assets/Agora Meetings  Meeting Controller Drawer.png" alt=""><figcaption></figcaption></figure>

The following settings are mandatory:

* Agora Application ID (copied from the Agora Project Console. Must be identical to the one used at the Agora Token Server)
* Meeting Name: This is the Meeting Room Name. Everyone who knows this name can attend the Meeting. It should be a dynamic value, and you need to manage in your own Backend / Database the management of the Meeting Room Names
* Host User ID: This is the Unique Identifier for a User in Agora Meetings. It _could_ be the UserID of Lowcoder Users - if your scenario offers Meetings only for Lowcoder Users. It should be a dynamic value, and you need to manage it in your own Backend / Database the management of the User IDs.
* RTM and RTC Token are used when an Agore App Certificate and a Token Server is used. For each meeting instance, you need a fresh Token Pair.

{% hint style="warning" %}
A Meeting Room can be used for multiple Meetings. The Room is "open" as soon as created. Users who specify the same _channel name_ (In Lowcoder: "Meeting Name") join a common channel and interact with each other. "A channel is created when the first user joins. It ceases to exist when the last user leaves." The [Agora Docs](https://docs.agora.io/en/video-calling/overview/core-concepts?platform=web) can give more & deeper information to it.
{% endhint %}

{% hint style="warning" %}
Tokens have to be generated at each start of a meeting for a meeting attendee. When the Tokens are fetched and bound to the Meeting Controller, the Meeting Controller Function startMeeting() can be called.
{% endhint %}

{% hint style="warning" %}
Meeting Name (Meeting Room) & Host User ID have to be managed in your own Backend / Database. In regards to the Lowcoder App, they must be dynamic - as multiple Users may want to join the meeting - which is based on the same single Lowcoder App.
{% endhint %}

### Meeting Controller Data & Functions

#### Main Data Objects

1. **localUser**: An object representing the local user, including properties like `user`, `audiostatus`, `streamingVideo`, `speaking`, etc.
2. **participants**: An array of objects representing the "remote" participants in the meeting, each with properties like `user`, `audiostatus`, `streamingVideo`, etc.
3. **messages**: An array of messages exchanged in the RTM channel.
4. **meetingActive**: A boolean indicating whether the meeting is currently active.
5. **meetingName**: The name of the meeting.

#### Functions

1. **openDrawer()**: Opens the meeting drawer (UI component).
2. **startSharing()**: Toggles screen sharing on and off.
3. **audioControl()**: Toggles the microphone on and off.
4. **videoControl()**: Toggles the local camera on and off.
5. **startMeeting()**: Initiates the meeting, joins the RTC and RTM channels, and sets up the local user.
6. **startSharing()**: Initiates the Screen Sharing at the local User
7. **broadCast()**: Sends a message to the RTM channel or to specific peers.
8. **setMeetingName()**: Sets the name of the meeting.
9. **setUserName()**: Sets the name of the local user.
10. **setRTCToken()**: Sets the RTC token for the session.
11. **setRTMToken()**: Sets the RTM token for the session.
12. **endMeeting()**: Ends the meeting, leaves the RTC and RTM channels, and updates the local user's state.

### Camera Stream

The Camera Stream allows you to show your own Camera Stream or the Video Stream of the Cameras of the other Attendees. You can place this component like any other on the canvas.

<figure><img src="../.gitbook/assets/Agora Meetings  Camera Stream Component.png" alt="" width="563"><figcaption></figcaption></figure>

The Camera Stream Component has 2 special features to enable good styling options.

* Vide Aspect Ratio - a CSS property that, in combination with Auto-Height, makes sure that you have perfect squares/circles of the Camera Streams.
* Profile Image URL - Here you can set an actual user Profile Image - or a Profile Image Generator like in our Example [https://www.dicebear.com/playground](https://www.dicebear.com/playground/). The Profile image is displayed as long as the Camera Video Stream is not active.&#x20;

The Video Stream ID is the Meeting User ID.

* To set the video Stream of the local user (you), you can bind the value of **localUser.** `{{meetingController.localUser}}`
* To set the video Stream of the Attendee user, you can make use of the **participants** Array. You would need a repeater component like the List Component for example to keep the meeting attendee display dynamic. In the listItem (**currentItem**) you would set then for example: `{{meetingController.participants[currentItem]}}`

{% hint style="info" %}
The Video Stream get's automatic visible, as soon as the respective Camera is ready and active.
{% endhint %}

{% hint style="danger" %}
The incoming Sharing Screen Stream, unfortunately, is currently in Agora Meeting tight connected to the Camera Stream (in fact, there is only a single stream per attendee). That means, that the control of the displayed Stream (Camera or Screen Sharing) has to be managed by the App Creator
{% endhint %}

### Screen Share Stream

The Screen Share Stream Component is almost identical to the Camera Stream component. It is meant to enable you to choose a place where to display Shareing Stream. Often this will be in a bigger content area.&#x20;

To set (display) the Sharing Stream of the local user (you), you can bind the value of **localUser.** `{{meetingController.localUser}}.`

## Realtime Messages

In a Meeting Room, you can send and receive messages, either to all Attendees or to selected Users (selected Attendees).&#x20;

You can send messages as soon as the meeting has started. To do so, you can use the JavaScript Query and use, for example, a function call like this:

```javascript
const message = {
  text: "Hello everyone!",
  sender: userId // you can send this to understand the Sender.
  data: {...} // // you also can send a complex nested JSON Object. 
};
meetingController.broadCast(message);
```

Messages sent in the Meeting Room (Channel) are collected for each Meeting Attendee at the local Data Object **messages** (`meetingController.messages`f.e.) as an Array.

{% hint style="danger" %}
the Data Object **messages** will contain only the latest 100 Messages. As App Creator you are responsible for any further storage of these Messages.
{% endhint %}



## Why Video Meetings in Lowcoder?

<figure><img src="../.gitbook/assets/Agora Meetings  The Big Picture.png" alt=""><figcaption></figcaption></figure>

A picture says more than 100 words. Or?&#x20;

Despite all the amazing Developments in IT, the bridge between Meeting and "Working" or "Shopping," "Learning," or any other online Activity is not made.

We encourage you to use Lowcoder and the first fully Lowcode Meeting App Generator in it, to create completely new and useful experiences for your App Users and Customers.

* Face-to-face online Support
* Social Shopping - but together
* Meetings, where people can actually work together within - not only talk about
* Customer Relationship Management with real-time alignment
* A new style of eLearning - interactive content + face-to-face with the Tutors
* Business Apps with enabled Collaboration to speed up business processes

MIX IT! Shake the World and enable the Future for your Users!
