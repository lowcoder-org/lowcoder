# Lowcoder v3.0.0

**Build faster. Run faster. Stay in control.**

You choose Lowcoder because you want to understand, shape, and own the apps you build. As those apps grow, that control should keep helping you move forward.

Lowcoder 3.0.0 brings months of work together around that promise: a faster foundation, a new way to build with AI, and Templates that change how complex apps take shape. Alongside them come rich chat experiences, portable themes, more reliable video meetings, and a broad round of community fixes.

This is one of the biggest steps forward in Lowcoder’s history. Here is what makes it matter.

## Faster apps and a more responsive builder

Performance has been a burning topic in the community for a long time. We took it down to the foundations.

We fixed memory leaks, reduced unnecessary re-renders, and reworked how editor state reaches components. That includes improvements to editor history, component selection, dragging, and repeated content in List Views.

The result is less wasted work as you build and use your apps, with particular attention to the complex screens and longer sessions where that overhead hurts most.

## Templates change how you build complex apps

A polished app needs a coherent layout: navigation, headers, sidebars, and the structure connecting its screens. Building every part of that structure out of nested low-code containers adds work for the builder and overhead for the app.

**Templates let you build that structure once, then build your app inside it.**

Start with a prepared layout, such as a dashboard, portal, landing page, or admin panel. Its design and layout live in a reusable package. Inside it, **drop-zones** accept ordinary Lowcoder components: tables, forms, charts, buttons, and everything that makes the app yours.

For developers, this means you can adapt a React app layout into a compatible Lowcoder template and define exactly where visual building belongs. For app builders, it means starting with a designed framework of screens and focusing on the data, logic, and interactions that matter.

Fewer nested containers. Less repeated layout work. A structure your team can maintain, with the freedom to keep building visually.

[Explore Templates](https://github.com/lowcoder-org/lowcoder/blob/main/docs/build-applications/app-editor/npm-template-plugins.md)

## AI Automator brings speed you can still control

Describe what you want to build. Automator can create and update components, arrange layouts, configure properties, and work with queries directly in the Lowcoder editor.

**The result remains a Lowcoder app you can inspect, edit, and maintain.**

Underneath Automator is a new JSON language for robotic app-building automation: an ordered recipe of actions that Lowcoder executes. AI can write the recipe, and you can inspect or adapt it through **See the JSON recipe**. With **Build with JSON**, you can also create recipes yourself or generate them from a JavaScript query, without an LLM.

That opens up a useful combination: natural language for getting started, reusable recipes for repeated work, and the visual editor for precise control.

You choose the model connection through Lowcoder queries. Automator requires an active **AI Robot** subscription for the workspace; model-provider usage is billed separately.

[Meet Automator](https://github.com/lowcoder-org/lowcoder/blob/main/docs/build-applications/app-editor/automator.md)

## Bring full chat experiences into your apps

Your published Lowcoder apps can now give users a rich conversational interface.

**AI Chat** brings familiar assistant interactions into your app: multiple conversation threads, history, attachments, message editing, and response regeneration. Connect it to your chosen LLM through Lowcoder queries to build a ChatGPT-style experience around your own workflows.

**Chat Box and Chat Controller** support room-based conversations, typing indicators, online presence, mentions, and shared realtime state. Your queries connect the interface to the message and room data you manage.

Build a support workspace, a team discussion area, or an assistant alongside the business process it helps with. The conversation can live where the work happens.

[AI Chat guide](https://github.com/lowcoder-org/lowcoder/blob/main/docs/build-applications/app-editor/visual-components/ai-chat.md) · [Chat Box guide](https://github.com/lowcoder-org/lowcoder/blob/main/docs/build-applications/app-editor/visual-components/chat-box.md)

## Take your themes with you

**Theme import and export are here.**

Download a theme, move it between workspaces, or share it with another Lowcoder builder. Bring an existing theme into a new workspace and carry your visual identity with it.

This long-requested feature also lays the groundwork for sharing Lowcoder App Themes through the marketplace. Theme exchange is the next step; import and export arrive with 3.0.0.

## Reuse components across apps

Copy components from one app to another through the clipboard, including support for copying modals and their nested content.

When you have already built the right piece, bring it with you.

## More reliable video meetings

We renewed the Agora-based meeting integration, upgraded the SDK, and improved screen-sharing playback and the handling of audio and video tracks.

The work focuses on making meetings inside Lowcoder apps more stable, including support for joining without video.

## Get Enterprise licenses directly in Lowcoder

Enterprise licensing is now available through Lowcoder itself, with an integrated request and checkout flow.

No more “talk to Falk” as a required step. Falk remains available for actual conversations.

## Community fixes that improve everyday building

Alongside the headline features, 3.0.0 addresses many of the details that make an app dependable:

- **Data and queries:** fixes for datasource access control and JavaScript Prepared Data Queries. [#2133](https://github.com/lowcoder-org/lowcoder/issues/2133), [#2177](https://github.com/lowcoder-org/lowcoder/issues/2177)
- **Forms and dates:** corrected form defaults across controls and date-format handling. [#2172](https://github.com/lowcoder-org/lowcoder/issues/2172), [#2135](https://github.com/lowcoder-org/lowcoder/issues/2135)
- **Tables:** column filtering, programmatic row clicks, download-event handling, and cell colors that survive row selection. [#1658](https://github.com/lowcoder-org/lowcoder/issues/1658), [#2134](https://github.com/lowcoder-org/lowcoder/issues/2134), [#2107](https://github.com/lowcoder-org/lowcoder/issues/2107), [#2118](https://github.com/lowcoder-org/lowcoder/issues/2118), [#1868](https://github.com/lowcoder-org/lowcoder/issues/1868)
- **Layouts and navigation:** tab alignment and spacing, hidden-column behavior, Step Control formatting, and theme and canvas settings for Navigation Apps. [#1291](https://github.com/lowcoder-org/lowcoder/issues/1291), [#1758](https://github.com/lowcoder-org/lowcoder/issues/1758), [#2119](https://github.com/lowcoder-org/lowcoder/issues/2119), [#2123](https://github.com/lowcoder-org/lowcoder/issues/2123), [#2145](https://github.com/lowcoder-org/lowcoder/issues/2145)
- **Files and feedback:** filename validation, removal of individual uploaded files, toast-dismissal actions, and custom Progress Circle labels. [#2100](https://github.com/lowcoder-org/lowcoder/issues/2100), [#2099](https://github.com/lowcoder-org/lowcoder/issues/2099), [#2113](https://github.com/lowcoder-org/lowcoder/issues/2113), [#2124](https://github.com/lowcoder-org/lowcoder/issues/2124)
- **Organization and editing:** nested folders, more room for editing scripts and styles, and copying modals. [#1077](https://github.com/lowcoder-org/lowcoder/issues/1077), [#1938](https://github.com/lowcoder-org/lowcoder/issues/1938), [#1755](https://github.com/lowcoder-org/lowcoder/issues/1755)
- **Embedded apps:** fixes for apps containing Navigation components and for timers in the embedded SDK. [#2149](https://github.com/lowcoder-org/lowcoder/issues/2149), [#2153](https://github.com/lowcoder-org/lowcoder/issues/2153)

## Getting started with 3.0.0

Try a Template, drop in your own components, and let Automator help with the next part. AI Help is also available in supported editor fields for focused assistance with queries, expressions, and configuration.

For self-hosted installations, use the updated deployment configuration. Realtime chat needs the Hocuspocus collaboration service; video meetings need Agora configuration and a reachable token service. Chat Box message and room persistence stays connected through your queries.

[Realtime setup](https://github.com/lowcoder-org/lowcoder/blob/main/docs/build-applications/realtime-collaboration.md) · [Video meeting setup](https://github.com/lowcoder-org/lowcoder/blob/main/docs/build-applications/app-editor/collaborative-video-apps.md)

To everyone who reported a bug, shared an app, tested a fix, contributed code, or kept pushing us to make Lowcoder better: **thank you**. Your real-world use shaped this release.

Months of work brought us here. What comes next is what you build with it.

**Welcome to Lowcoder 3.0.0.**
