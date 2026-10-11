# Lowcoder v3.0.0

**Build faster. Run faster. Stay in control.**

Lowcoder v3.0.0 brings months of work into one of the most significant releases we have built: a faster foundation for your apps, AI that helps you build while keeping the result in your hands, and Templates that change how you approach complex applications.

You choose Lowcoder because you want control over your apps, your data, and the way your software works. With 3.0.0, that control comes with more powerful ways to move quickly.

**More than 340 commits since v2.7.6. Deep performance work. New building blocks. Long-awaited community requests delivered.**

Here is what you can build with it.

## Faster apps and a more responsive builder

Performance has been a burning topic for a long time. We heard it in your feedback, saw it in complex apps, and spent this release working on the foundations.

We fixed memory leaks, reduced unnecessary re-renders, and reworked how editor state reaches components. The work includes editor history, component selection, dragging, repeated content in List Views, and the way changes propagate through the editor.

That means less wasted work during everyday interactions and less accumulated overhead in longer editing sessions. It matters especially as your apps grow: more components, more screens, more data, and more people depending on them.

**The time you spend building should go into your application.**

## Templates give complex apps a better starting point

A professional app needs navigation, headers, sidebars, and a consistent structure across its screens. Recreating that entire structure with nested low-code containers takes time and adds overhead as the app grows.

**Templates let you start with a complete, designed application layout and build inside it.**

A developer can turn a React app layout into a compatible Lowcoder Template, with clearly defined **drop-zones**. App builders then place ordinary Lowcoder components inside those zones: tables, forms, charts, buttons, and the data and logic behind them.

The surrounding design stays coherent. Your team has a reusable structure it can maintain. You keep the flexibility of visual app building where you need it.

Use a dashboard, landing page, sidebar layout, card grid, or admin panel as your starting point. Spend your time on the application your users need, with fewer layers of containers to assemble and maintain.

<img width="640" alt="Lowcoder Templates with a designed sidebar layout and editable component drop-zones" src="https://github.com/user-attachments/assets/44ae88ba-cfe2-49b7-b503-d8df4e4bfdf9" />

<details>
<summary>Watch the Templates demo</summary>

https://github.com/user-attachments/assets/3b28288e-3c3a-4f11-8d12-4a76a3de3449

</details>

[Build with Templates](https://github.com/lowcoder-org/lowcoder/blob/main/docs/build-applications/app-editor/npm-template-plugins.md)

## AI Automator helps you build and keeps you in control

Describe the app you want. Automator can create and update components, arrange layouts, configure properties, and work with queries directly in the Lowcoder editor.

**What it builds remains a Lowcoder app you can inspect, adjust, and continue developing visually.** You can review the components, understand their configuration, and make the next change yourself.

Underneath Automator is a new **JSON language for robotic app-building automation**. An ordered recipe tells Lowcoder which building actions to execute. That opens up three ways to work:

- **Describe your idea.** Let AI turn it into actions in the editor.
- **Inspect the recipe.** Use **See the JSON recipe** to understand and adapt the instructions.
- **Build with JSON.** Write reusable recipes yourself or generate them from a JavaScript query, without an LLM.

This gives teams a practical way to combine AI assistance, repeatable automation, and precise manual editing. Reuse a recipe for familiar structures; let AI help with the next idea; refine the result in the editor.

**AI Help** also brings focused assistance to supported editor fields for queries, expressions, and configuration.

<img width="640" alt="AI Automator building a Lowcoder app from a natural-language request" src="https://github.com/user-attachments/assets/86a2e3c3-55d8-4aec-b117-cb425201686c" />

<details>
<summary>Watch the AI Automator demo</summary>

https://github.com/user-attachments/assets/6d0212ef-3d25-49ff-bf3f-c6d57aa36e78

</details>

Automator requires an active **AI Robot** subscription for the workspace. You choose the model connection through Lowcoder queries; model-provider usage is billed separately.

[Explore Automator and JSON recipes](https://github.com/lowcoder-org/lowcoder/blob/main/docs/build-applications/app-editor/automator.md)

## Bring full chat experiences into your published apps

Lowcoder apps can now give their users a rich conversational interface, including assistants connected to an LLM.

**AI Chat** brings familiar assistant interactions into your app: multiple conversation threads, history, attachments, message editing, and response regeneration. Connect your chosen model through Lowcoder queries and build a ChatGPT-style experience around your own application and workflows.

**Chat Box and Chat Controller** support room-based conversations, typing indicators, online presence, mentions, and shared realtime state. Your queries connect the interface to the message and room data you manage.

Put an assistant next to a business process. Add discussion to a customer portal. Build a support workspace where conversation and the relevant application live together.

<img width="640" alt="AI Chat with conversation threads, message history, and an attachment-enabled composer inside a Lowcoder app" src="https://github.com/user-attachments/assets/dcb3c7d8-1715-423a-ab31-b4aa32549650" />

<details>
<summary>Watch the AI Chat demo</summary>

https://github.com/user-attachments/assets/ed440aa8-add7-4e14-af9e-88d38cef2877

</details>

[AI Chat guide](https://github.com/lowcoder-org/lowcoder/blob/main/docs/build-applications/app-editor/visual-components/ai-chat.md) · [Chat Box guide](https://github.com/lowcoder-org/lowcoder/blob/main/docs/build-applications/app-editor/visual-components/chat-box.md)

## Theme import and export are here

A theme is work worth keeping: the colors, styling, and visual identity that make your apps feel like yours.

You can now **export a Lowcoder theme and import it into another workspace**. Download it, reuse it, or share it with another builder. Carry your design into the next app without recreating it by hand.

This long-awaited feature also lays the groundwork for exchanging Lowcoder App Themes through the marketplace. Import and export arrive in 3.0.0; marketplace theme exchange is the next step.

<img width="640" alt="Lowcoder theme management with Import Theme and Export Theme controls" src="https://github.com/user-attachments/assets/195a398b-5803-48a8-8420-941caefd0d5a" />

<details>
<summary>Watch theme export in action</summary>

https://github.com/user-attachments/assets/1ef522fb-3d2a-458f-862c-26e0cf135b22

</details>

## Bring your best components into the next app

Copy components between apps through the clipboard, including modals and their nested content.

A useful form, a carefully configured table, a familiar interaction: once you have built the right piece, bring it with you. Reuse becomes part of your everyday building workflow.

<img width="640" alt="Copying components between two Lowcoder apps" src="https://github.com/user-attachments/assets/987a40a6-84c7-4e68-9325-86eccd86022a" />

<details>
<summary>Watch the component-copying demo</summary>

https://github.com/user-attachments/assets/36ec0de8-8169-4683-ade2-0e65bef37b5e

</details>

## More reliable video meetings

We renewed the Agora-based meeting integration, upgraded the SDK, and improved screen-sharing playback and the handling of audio and video tracks.

The focus is more stable meetings inside your apps, including support for joining without video. The deployment configuration also includes the supporting Agora token service.

[Video meeting setup](https://github.com/lowcoder-org/lowcoder/blob/main/docs/build-applications/app-editor/collaborative-video-apps.md)

## Enterprise licensing directly inside Lowcoder

Enterprise license requests and checkout are now available within Lowcoder itself.

No more “talk to Falk” as a required step. Falk remains available for actual conversations.

## The everyday improvements behind the milestone

The headline features are only part of 3.0.0. This release also addresses the details you encounter while building real apps: forms that should keep their defaults, tables that should respect your styling, queries that should run, and layouts that should behave as configured.

The community work spans **data access, prepared queries, forms, dates, tables, navigation, file uploads, notifications, embedded apps, and editor usability**. Alongside it come improvements such as single-row table expansion, chart theming, nested folders, resizable script and style editors, and logout cookie cleanup.

<details>
<summary>Explore the community fixes and improvements</summary>

### Data and queries

- Correct datasource access-control behavior. [#2133](https://github.com/lowcoder-org/lowcoder/issues/2133)
- Fix execution of JavaScript Prepared Data Queries. [#2177](https://github.com/lowcoder-org/lowcoder/issues/2177)

### Forms and dates

- Honor form default values across controls, including forms inside modals. [#2172](https://github.com/lowcoder-org/lowcoder/issues/2172)
- Honor date display and input formats. [#2135](https://github.com/lowcoder-org/lowcoder/issues/2135)

### Tables

- Add searchable column filters and control which columns can be filtered. [#1658](https://github.com/lowcoder-org/lowcoder/issues/1658), [#2134](https://github.com/lowcoder-org/lowcoder/issues/2134)
- Expose programmatic row-click behavior. [#2107](https://github.com/lowcoder-org/lowcoder/issues/2107)
- Let custom download handlers override the default CSV download. [#2118](https://github.com/lowcoder-org/lowcoder/issues/2118)
- Preserve cell styling when a row is selected. [#1868](https://github.com/lowcoder-org/lowcoder/issues/1868)

### Layouts and navigation

- Improve tab overflow/menu alignment and spacing. [#1291](https://github.com/lowcoder-org/lowcoder/issues/1291)
- Improve vertical-tab spacing and formatting. [#1758](https://github.com/lowcoder-org/lowcoder/issues/1758)
- Honor Hide Column in Column Layout. [#2119](https://github.com/lowcoder-org/lowcoder/issues/2119)
- Correct Step Control icon and label formatting. [#2123](https://github.com/lowcoder-org/lowcoder/issues/2123)
- Add theme and canvas settings to Navigation Apps. [#2145](https://github.com/lowcoder-org/lowcoder/issues/2145)

### Files and feedback

- Validate uploaded filenames. [#2100](https://github.com/lowcoder-org/lowcoder/issues/2100)
- Remove individual uploaded files with clearValueAt. [#2099](https://github.com/lowcoder-org/lowcoder/issues/2099)
- Add toast-dismissal events and query actions. [#2113](https://github.com/lowcoder-org/lowcoder/issues/2113)
- Support custom Progress Circle labels. [#2124](https://github.com/lowcoder-org/lowcoder/issues/2124)

### Organization and editing

- Create nested folders in the app browser. [#1077](https://github.com/lowcoder-org/lowcoder/issues/1077)
- Resize script and style editor windows. [#1938](https://github.com/lowcoder-org/lowcoder/issues/1938)
- Copy modals and their nested content. [#1755](https://github.com/lowcoder-org/lowcoder/issues/1755)

### Embedded apps

- Fix startup of embedded apps containing Navigation components. [#2149](https://github.com/lowcoder-org/lowcoder/issues/2149)
- Fix timers in embedded apps. [#2153](https://github.com/lowcoder-org/lowcoder/issues/2153)

The release cleanup also closes the remaining completed requests tracked under Awaiting Release, including ListView item access [#2101](https://github.com/lowcoder-org/lowcoder/issues/2101) and the separately distributed Gantt component’s task-array update issue [#2111](https://github.com/lowcoder-org/lowcoder/issues/2111).

</details>

## Getting started with 3.0.0

Start with a Template. Drop in your own data and components. Let Automator help with the next part, inspect the JSON recipe, and refine the result in the editor. Add a conversation where it helps your users, then bring your theme and reusable components into the next app.

For self-hosted installations, use the updated deployment configuration. Realtime chat needs the Hocuspocus collaboration service; video meetings need Agora configuration and a reachable token service. Chat Box message and room persistence connects through your queries. Update independently installed components and embedded SDK bundles alongside your application where required.

[Realtime setup](https://github.com/lowcoder-org/lowcoder/blob/main/docs/build-applications/realtime-collaboration.md) · [Full changelog from 2.7.6 to 3.0.0](https://github.com/lowcoder-org/lowcoder/compare/2.7.6...3.0.0)

To everyone who reported a bug, shared an app, tested a fix, contributed code, or kept pushing us to make Lowcoder better: **thank you**. Your real-world work shaped this release, including the long-standing requests that deserved the time to get right.

We have spent months getting Lowcoder to this point. We are excited to see what you build from here.

**Welcome to Lowcoder 3.0.0.**
