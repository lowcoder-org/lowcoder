# Native embed SDK

The key advantage for React developers using Lowcoder is the ease of embedding Lowcoder apps directly into the React component hierarchy. This native integration means that Lowcoder apps can be treated as part of the React tree, ensuring a smooth and cohesive user experience. Developers can place Lowcoder apps within their existing React components, maintaining the structural and stylistic consistency of their applications.

Moreover, the interaction between React components and Lowcoder apps is exceptionally fluid. React developers can directly manipulate the state of Lowcoder apps, invoke methods, and handle events, creating a highly interactive and responsive environment. This direct interaction is a game-changer, as it allows for real-time data exchange and dynamic behavior within the application.

For instance, a React developer can easily update the state of a Lowcoder app based on user interactions or external data changes in their React components. This two-way communication ensures that the embedded Lowcoder apps are not just static elements but integral, interactive parts of the overall application.

The ability to interact with Lowcoder apps through state management, method calls, and event handling in React also simplifies the development process. Developers can leverage their existing knowledge of React's ecosystem to control and customize Lowcoder apps, reducing the learning curve and accelerating development timelines.

## Lowcoder SDK usable imports&#x20;

This is an overview list of exports available for developers using the Lowcoder SDK.&#x20;



{% hint style="warning" %}
It is important to keep in mind, that this List was build during a reverse engineering attempt. We cannot guarantee the completeness. Also you will find at many Items that the description was guessed (by ChatGPT). \
\
We try step by step to add missing Items and optimize the documentation.
{% endhint %}

### External Libraries

```plaintext
numbro - A library for formatting and manipulating numbers.
Papa - A robust CSV parsing library for in-browser use.
uuid - A library for generating unique identifiers.
```

### Redux Store

```plaintext
redux/store/store - Exports from Redux store for state management.
```

### Utilities

Utilities provide a wide range of functionality, from application utilities to hooks and performance utilities.

* **util/appUtils** - General application utilities.
* **util/bottomResUtils** - Utilities for bottom resolution management.
* **util/cacheUtils** - Caching mechanisms for performance optimization.
* **util/commonUtils** - Commonly used utilities across applications.
* **util/convertUtils** - Data type conversion utilities.
* **util/dateTimeUtils** - Utilities for handling dates and times.
* **util/editoryHistory** - Utilities for managing editor history.
* **util/envUtils** - Environment interaction utilities.
* **util/fileUtils** - File operation utilities.
* **util/history** - Navigation history management utilities.
* **util/historyManager** - Utilities for managing history instances.
* **util/hooks** - Custom React hooks.
* **util/hotkeys** - Keyboard shortcut utilities.
* **util/jsonTypes** - JSON data type handling utilities.
* **util/keyUtils** - Key management and operation utilities.
* **util/localStorageUtil** - Local storage interaction utilities.
* **util/memoize** - Memoization utilities for performance optimization.
* **util/objectUtils** - Object manipulation and operation utilities.
* **util/perfUtils** - Performance monitoring and optimization utilities.
* **util/permissionUtils** - User permission management utilities.
* **util/reducerUtils** - Redux reducer utilities.
* **util/scheduleUtils** - Scheduled task management utilities.
* **util/stringUtils** - String manipulation and operation utilities.
* **util/tutorialUtils** - Tutorial creation and management utilities.
* **util/uaUtils** - User agent detection utilities.
* **util/urlUtils** - URL manipulation and parsing utilities.
* **util/context/ExternalEditorContext** - Context for external editor integration. With the help of the EditorContext Object you can access also EditorState and understand the current usage of the Editor / Canvas.

### Constants

```plaintext
constants/domLocators/CanvasContainerID - Identifier for the canvas container element.
```

### Components and Component Utilities

Components and utilities for building and managing UI components.

```plaintext

comps/comps/rootComp - Root component structure.
comps/utils/useCompInstance - Utilities for component instance management.
comps/utils/idGenerator - Unique identifier generator for components.
comps/utils/propertyUtils - Component property management utilities.
comps/utils/globalSettings - Global settings management utilities.
comps/utils/themeContext - Theme management context.
```

### Design and Core

```plaintext
lowcoder-design - Core design elements for building applications.
lowcoder-core - Core functionalities for application development.
```

### Wrappers

Wrappers play crucial roles in structuring the UI and UX of the SDK's components, ensuring that complex functionalities are manageable and that the interface remains user-friendly.

* **ControlPropertyViewWrapper** - A wrapper for property views within control components, likely enhancing layout or providing additional UI context for control settings.
* **ModalFooterWrapper** - A wrapper specifically for the footer section of modal dialogs, potentially standardizing layout or spacing for action buttons.
* **SecondStepPropertyViewWrapper** - A wrapper used for the second step in a multi-step property configuration process, possibly organizing or grouping properties for clarity.
* **GlobalShortcutsWrapper** - A wrapper for global shortcut configurations, ensuring shortcut keys are managed or displayed in a consistent format across the application.
* **QueryConfigItemWrapper** - A wrapper for individual items within query configuration settings, providing a consistent UI structure for each query parameter or option.
* **QueryConfigWrapper** - A more general wrapper for the entire set of query configuration settings, encapsulating all query config items for cohesive presentation.
* **QueryPropertyViewWrapper** - A wrapper for property views related to queries, likely organizing and displaying query-related settings in a user-friendly manner.
* **QuerySectionWrapper** - A wrapper for sections within a query configuration or editor, segmenting the query UI into logical parts for better user navigation.
* **ShortcutsWrapper** - A wrapper for shortcut configurations, similar to GlobalShortcutsWrapper, but potentially for a more specific context or component.
* **SuspensionBoxWrapper** - A wrapper that might be used to suspend or temporarily hold components, possibly for lazy loading or conditional rendering scenarios.
* **SwitchWrapper** - A wrapper for switch components, providing additional styling or context for toggle switches within the UI.
* **ValueAndMsgWrapper** - A wrapper for components or UI elements that display both a value and a message, ensuring consistent formatting and presentation.
* **WrapContextNodeV2Wrapper** - A wrapper for context nodes in a version 2 format, possibly providing a new or enhanced way to manage context in component trees.
* **WrapNodeWrapper** - A general wrapper for nodes, likely used to encapsulate components or elements within additional logic or styling context.
* **WrapperToControlItem** - A wrapper that converts generic components or elements into control items, likely for use in a control panel or settings menu.

### Controls

Controls for managing Properties for UI elements and interactions.

* **ActionSelectorControl** - Enables selection from a list of predefined actions.
* **ArrayControl** - Manages arrays, allowing users to add, remove, and edit array items.
* **ArrayNumberControl** - Specifically for arrays of numbers, facilitating their management.
* **ArrayOrJSONObjectControl** - Allows input to be either an array or a JSON object, supporting flexible data structures.
* **ArrayStringControl** - Designed for arrays of strings, enabling easy manipulation of string lists.
* **ArrayStringOrNumberControl** - Accepts arrays composed of either strings or numbers, offering versatility in data handling.
* **BooleanStateControl** - Toggles a boolean state, useful for settings that can be switched on or off.
* **ButtonEventHandlerControl** - Configures event handlers for button components, customizing their behavior.
* **ColorCodeControl** - Inputs color codes (e.g., HEX, RGB), providing a precise method for color selection.
* **ColorControl** - Offers a color picker for intuitive color selection.
* **ColumnOptionControl** - Selects options for table columns, such as visibility and sorting.
* **DropdownOptionControl** - Manages options within a dropdown, allowing for the organization of selectable items.
* **FunctionControl** - Defines functions, enabling custom logic or calculations.
* **JSONObjectArrayControl** - Manages arrays of JSON objects, facilitating complex data structures.
* **JSONObjectControl** - Inputs JSON objects, allowing users to define key-value pairs.
* **JSONValueControl** - Inputs values in JSON format, supporting various data types.
* **NumberControl** - Inputs numeric values, often with validation for specific ranges.
* **NumberOrJSONObjectArrayControl** - Allows either a single number or an array of JSON objects as input.
* **NumberStateControl** - Manages numeric state properties, useful for numeric configurations.
* **ObjectControl** - Inputs generic objects, providing a flexible interface for defining properties.
* **ParamsArrayStringControl** - Manages string arrays as parameters, useful for multiple text inputs.
* **ParamsBooleanCodeControl** - Inputs boolean parameters with code support, allowing dynamic logic.
* **ParamsBooleanControl** - Inputs boolean parameters, typically for toggling settings.
* **ParamsJsonControl** - Inputs parameters in JSON format, supporting complex configurations.
* **ParamsNumberControl** - Inputs numeric parameters, with support for range constraints.
* **ParamsPositiveNumberControl** - Specifically for positive numeric parameters, ensuring positive inputs.
* **ParamsStringControl** - Inputs string parameters, allowing text input for configurations.
* **ParamsStringJsonControl** - Inputs string parameters with JSON support, offering flexible text inputs.
* **SelectEventHandlerControl** - Selects event handlers, customizing interactive component responses.
* **SelectInputOptionControl** - Configures options within select components, enhancing dropdown functionality.
* **SelectOptionControl** - Manages options in select components, facilitating choice organization.
* **TransformerCodeControl** - Inputs transformation code, used for data modification.
* **IconControl** - Enables the selection of icons from a predefined set, useful for visually representing actions or statuses.
* **InputEventHandlerControl** - Configures event handlers for input fields, enabling custom reactions to user inputs.
* **KeyValueControl** - Allows users to input key-value pairs, facilitating the management of object properties or configurations.
* **LabelControl** - A control for inputting and editing text labels, often used for form fields, buttons, or other interactive elements.
* **OptionsControl** - Manages selectable options across various components, enhancing configurability.
* **PositionControl** - Allows users to specify the position of elements, useful for layout and design settings.
* **QuerySelectControl** - Enables the selection of queries from a list, often used in data-binding or API-related configurations.
* **RadiusControl** - Inputs radius values, controlling the curvature of borders or other circular elements.
* **RangeControl** - Provides a UI for selecting a range of values, typically represented by a slider with two handles.
* **RefControl** - Manages references to other components or data sources, facilitating complex data interactions.
* **RegexControl** - Inputs regular expressions, allowing for pattern matching and validation settings.

### Generators

Generators for creating components and enhancing them with additional functionalities.

* **changeDataType** - Generator for changing data types.
* **hookToComp** - Generator for converting hooks to components.
* **index** - Base generator exports.
* **list** - Generator for list components.
* **multi** - Generator for multi-component structures.
* **sameTypeMap** - Generator for mapping same type components.
* **simpleGenerators** - Simple component generators.
* **uiCompBuilder** - UI component builder generator.
* **withContext** - Generator for adding context to components.
* **withDispatchHook** - Generator for adding dispatch hooks.
* **withErrorBoundary** - Generator for adding error boundaries.
* **withExposing** - Generator for exposing component functionalities.
* **withIsLoading** - Generator for loading state management.
* **withMethodExposing** - Generator to expose methods on a component.
* **withType** - Generator for type management.

### Components

Components cover a wide range of functionalities, from input and selection to display and multimedia, facilitating the development of interactive and dynamic web applications.

* **AbstractComp** - Represents an abstract component, likely serving as a base or common interface for other components.
* **AudioComp** - Component for audio playback functionality.
* **AutoCompleteComp** - Component for autocomplete functionality, allowing users to quickly find and select from a list of values as they type.
* **CalendarComp** - Component for displaying and interacting with a calendar, typically used for date selection.
* **CascaderComp** - Component that provides a cascading select interface, where the selection in one level determines the options available in the next.
* **CheckboxComp** - Component for checkbox functionality, allowing users to select one or more options from a set.
* **CollapsibleContainerComp** - Component that can expand and collapse to show or hide its content.
* **ContainerComp** - Generic container component, used to group other components together.
* **DateComp** - Component for date input, allowing users to select a date.
* **DateRangeComp** - Component for selecting a range of dates, from a start date to an end date.
* **DropdownComp** - Component for dropdown selection functionality, allowing users to select an option from a dropdown menu.
* **FileViewerComp** - Component for viewing files, potentially supporting various file types.
* **FormComp** - Component for form functionality, allowing users to input and submit data.
* **HookComp** - Likely a component designed to utilize React hooks for state management or side effects.
* **IFrameComp** - Component for embedding an IFrame, allowing for the inclusion of another HTML page within the current page.
* **InputComp** - Component for text input, allowing users to enter and edit text.
* **JsonEditorComp** - Component for editing JSON data, providing a user-friendly interface for modifying JSON structures.
* **JsonFormComp** - Component for generating forms based on JSON data, allowing dynamic form creation and manipulation.
* **ListViewComp** - Component for displaying a list of items, potentially supporting scrolling, selection, and other list interactions.
* **ModalComp** - Component for modal dialog functionality, allowing for pop-up dialogs that overlay the main content.
* **NumberInputComp** - Component for number input, allowing users to enter numeric values.
* **PasswordComp** - Component for password input, typically hiding the entered characters for security.
* **ProcessCircleComp** - Component likely representing a process or progress indicator in the form of a circle.
* **ProgressComp** - Component for displaying progress, such as a progress bar.
* **QRCodeComp** - Component for displaying QR codes.
* **RadioComp** - Component for radio button functionality, allowing users to select a single option from a set.
* **RatingComp** - Component for rating functionality, allowing users to provide a rating, typically represented by stars or similar indicators.
* **RichTextEditorComp** - Component for rich text editing, providing a user interface for formatting text with options like bold, italic, lists, etc.
* **SliderComp** - Component for slider functionality, allowing users to select a value from a range by sliding a handle.
* **SwitchComp** - Component for switch functionality, allowing users to toggle between two states, such as on/off.
* **TableComp** - Component for table functionality, displaying data in rows and columns.
* **TextAreaComp** - Component for multi-line text input, allowing users to enter text over multiple lines.
* **TextComp** - Component for displaying text.
* **ToggleButtonComp** - Component for a toggle button that can switch between two states.
* **VideoComp** - Component for video playback functionality.

### Styles

```
styled - An object combining default and named Styles 
so you can use it like "const YourDiv = styled.div`... {your CSS}`;
```

* **BigButtonStyle** - Style definition for large buttons, likely specifying size, padding, and possibly color.
* **BlockGrayLabelStyle** - Style for a label component with a block display and gray background, typically used for categorization or emphasis.
* **BlockLabelStyle** - General style for label components that are displayed as blocks, focusing on background color, margin, and padding.
* **BlueButtonStyle** - Style specifically for blue buttons, defining the color scheme and possibly hover states for buttons.
* **ButtonStyle** - General style for button components, including padding, font size, and color.
* **CalendarStyle** - Style for calendar components, affecting the layout, colors, and typography of the calendar UI.
* **CarouselStyle** - Style for carousel components, which may include settings for transitions, navigation buttons, and pagination indicators.
* **CascaderStyle** - Style for cascader components, affecting how nested options are displayed and interacted with.
* **CheckboxStyle** - Style for checkbox components, including the box size, checkmark appearance, and spacing.
* **CommentStyle** - Style for comment sections or components, focusing on typography, spacing, and background color.
* **ContainerBodyStyle** - Style specifically for the body of container components, affecting padding, margin, and background color.
* **ContainerFooterStyle** - Style for the footer area of container components, which may include padding, border, and background color settings.
* **ContainerHeaderStyle** - Style for the header part of container components, typically defining background color, typography, and padding.
* **ContainerStyle** - General style for container components, affecting overall layout, padding, and border properties.
* **DividerStyle** - Style for divider components, focusing on line color, thickness, and margin.
* **DropdownContainerStyle** - Style for the container part of dropdown components, affecting the dropdown list's appearance and positioning.
* **DropdownMenuStyle** - Style for dropdown menu components, including item spacing, background color, and typography.
* **FormCheckboxItemStyle** - Style for checkbox items within forms, specifying the layout and appearance of checkboxes in form contexts.
* **FormInputItemStyle** - Style for input items within forms, focusing on border, padding, and typography for form inputs.
* **FormSectionStyle** - Style for sections within forms, used to group related form items and visually separate different parts of a form.
* **GridIconStyle** - Likely a style for icons within a grid layout, focusing on size and spacing of icons.
* **IconWrapperStyle** - Style for a wrapper around icons, potentially affecting size, padding, or background color to enhance icon presentation.
* **IframeStyle** - Style for iframe components, affecting border, size, and possibly responsiveness.
* **ImageStyle** - General style for image components, including size, border-radius, and object-fit properties.
* **InputLikeStyle** - Style for components that resemble input fields, focusing on border, background color, and typography to match the appearance of standard inputs.
* **JsonEditorStyle** - Style for JSON editor components, affecting the layout, color scheme, and typography of the editor interface.
* **JsonFormCompStyle** - Style for components that generate forms based on JSON data, likely affecting the layout and appearance of dynamically created forms.
* **ListViewStyle** - Style for list view components, focusing on item spacing, scroll behavior, and possibly item hover states.
* **ModalStyle** - Style for modal dialog components, including background overlay, modal positioning, and content padding.
* **MultiSelectStyle** - Style for multi-select components, affecting how selected items are displayed and how the selection list is presented.
* **NavLayoutItemStyle** - Style for items within a navigation layout, specifying the appearance of navigation links or buttons.
* **ProgressStyle** - Style for progress bar components, including bar color, height, and border-radius.
* **RatingStyle** - Style for rating components, such as star ratings, including size, color, and spacing of rating icons.
* **ResponsiveLayoutColStyle** - Style for columns in responsive layouts, affecting width, padding, and breakpoint behaviors.
* **ResponsiveLayoutRowStyle** - Style for rows in responsive layouts, focusing on spacing between columns and alignment within the row.
* **RichTextEditorStyle** - Style for rich text editor components, affecting the toolbar, typography, and editor area appearance.
* **SegmentStyle** - Style for segment controls or segmented buttons, including border, background color, and selected state appearance.
* **SelectStyle** - Style for select dropdown components, focusing on dropdown appearance, item spacing, and hover states.
* **SignatureStyle** - Style for signature components, likely affecting the canvas area where signatures are drawn.
* **SliderStyle** - Style for slider components, including track and handle appearance, as well as responsive behavior.
* **SwitchStyle** - Style for switch components, focusing on the toggle appearance, color, and size.
* **TableStyle** - General style for table components, affecting cell padding, border, and header styling.
* **TextWrapperStyle** - Style for text wrapper components, potentially affecting typography, line-height, and text alignment.
* **TimeLineStyle** - Style for timeline components, focusing on line color, event marker appearance, and spacing.
* **ToggleButtonStyle** - Style for toggle button components, including the appearance of the toggle state and transition effects.
* **TreeStyle** - Style for tree view components, affecting node spacing, indentation, and expand/collapse icons.
* **VideoStyle** - Style for video components, including controls appearance, aspect ratio, and border.

### Labels

* **BlockGrayLabel** - A style or component for displaying labels with a gray background, typically used for subtle emphasis.
* **BlockLabel** - A component or style for block-level labels, used for headings or important textual information.
* **CommonGrayLabel** - A predefined style for labels with a common gray theme, likely used for neutral or secondary information.
* **DropdownOptionLabelWithDesc** - A component for dropdown options that includes both a label and a description for more detailed selections.
* **CollapseLabel** - Likely a label used within a collapsible component to indicate the section or content that can be expanded or collapsed.
* **IconWrapperLabel** - A label associated with an icon wrapper, possibly used for tooltips or descriptions of icons.
* **QueryConfigLabel** - A label used within query configuration settings, possibly to identify different query parameters or options.
* **TooltipLabel** - A label specifically designed for use within tooltips, providing brief descriptions or additional information on hover.
* **ShowBorderLabel** - A label that might be used to toggle or indicate the visibility of borders in a UI component or layout section.
* **TextLabel** - A general-purpose label for text, used across various components and contexts to display information.
* **FormSectionLabel** - A label used to title or describe sections within a form, helping to organize and categorize form fields.
* **DropdownOptionLabel** - Similar to DropdownOptionLabelWithDesc but possibly without the description, used for simpler dropdown selections.
* **InputLabel** - A label typically used for input fields, indicating the type of information expected from the user.
* **MenuItemLabel** - A label used within menu items, providing clear identification of the menu option.
* **OptionLabel** - A label used for options in select dropdowns, checkboxes, or radio buttons, providing clear identification of each choice.

### Options

* **ActionOptions** - Likely refers to configurations or settings related to actions that can be performed within the application, such as button actions or event triggers.
* **AlignOptions** - Configurations for alignment properties, possibly including options for text or element alignment within a UI component (e.g., left, right, center).

### Checkers

* **CheckEmailValid** - A utility or function designed to validate email addresses, ensuring they meet a specific format or criteria.
* **CheckIsMobile** - A function or method to determine if the user's device is a mobile device, based on screen size, user agent, or other factors.
* **CheckOtpValid** - A validation function for one-time passwords (OTPs), ensuring that the inputted OTP is correct and valid within a given context or timeframe.
* **CheckPhoneValid** - A utility designed to validate phone numbers, verifying their format and possibly their authenticity or region-specific characteristics.

### Constants / Patterns

* **CACHE\_PREFIX** - Likely a constant used as a prefix in caching mechanisms to differentiate or namespace cached items.
* **COLOR\_PALETTE** - A predefined set of colors available for use throughout the application, ensuring consistency in the UI's color scheme.
* **DATE\_FORMAT** - A constant representing the default format for displaying dates within the application.
* **DATE\_FORMAT\_EN** - Specifies the date format specifically for English locales, ensuring dates are presented in a region-appropriate manner.
* **DATE\_TIME\_12\_FORMAT** - Represents a date and time format that includes a 12-hour clock, possibly with AM/PM indicators.
* **DATE\_TIME\_FORMAT** - A general constant for the format used to display both date and time information.
* **DEFAULT\_IMG\_URL** - A fallback URL for images, used when a specific image is not available or cannot be loaded.
* **DEP\_TYPE** - Likely denotes the type of dependency, possibly used in the context of module imports or external library dependencies.
* **EMAIL\_PATTERN** - A regular expression pattern used for validating email addresses in form inputs or data processing.
* **SURFACE\_COLOR** - A constant that might define a default or primary surface color used in the UI, part of a theme or design system.
* **TIME\_FORMAT** - Specifies the format for displaying time within the application, potentially in a 24-hour clock format.
* **TIME\_FORMAT\_MINUTES** - A more specific time format constant, possibly focusing on displaying time with minute precision.
* **TIMESTAMP\_FORMAT** - Defines the format for displaying timestamps, which include both date and time information.
* **TIME\_12\_FORMAT** - Similar to **DATE\_TIME\_12\_FORMAT**, representing a time format using a 12-hour clock.
* **URL\_PATTERN** - A regular expression pattern for validating URLs, ensuring that input or linked URLs are in a correct format.

### Application View and IDE

```plaintext
appView/bootstrapAt - Bootstrap utility for application initialization.
appView/LowcoderAppView - Main application view component.
appView/AppViewInstance - Application view instance management.
ide/CompIde - Component IDE for development.
ide/CompPlayground - Component playground for testing.
```

### Ant Design

```plaintext
antd - Exports from Ant Design for comprehensive UI design utilities and components.
```

## Event Handler & Trigger

Event Handlers enable Application Creators to use visually guided Handler Creation for Events that may occur in Visual Components. Use these Event handlers to trigger Events and ensure a good UI.

The event handler itself does not contain any application logic. It manages only the display of the Event handler. For you as Developer, you can use them to prepare a good visual user interface for Application Creators.

<figure><img src="../../../.gitbook/assets/App Editor  Event Handlers.webp" alt=""><figcaption><p>Meeting related Event Handlers. Developers can bind logical triggers in their component code to this visual Event Handlers.</p></figcaption></figure>

### Importing Event Handlers

To utilize an event handler, first import it from the designated module:

```javascript
import { InputEventHandlerControl } from "path/to/eventHandlerControl";
```

You can then attach this handler directly to component events or use intermediary functions for specific user actions.

### Using Event Handlers

A typical use of event handlers is in combination with the childrenmap of a component.

<pre class="language-typescript"><code class="lang-typescript">const childrenMap = {
    ... 
    onEvent: InputEventHandlerControl,
    ...
}

// other code

return new UICompBuilder(childrenMap, (props: { 
    ... 
    onFocus: () => props.onEvent("focus"),
    onBlur: () => props.onEvent("blur"),
<strong>    onPressEnter: () => props.onEvent("submit"),
</strong>    ...
}) => {
... 
</code></pre>

{% hint style="info" %}
The further code examples are just abstract examples to list the event handlers.
{% endhint %}

### Available Event Handlers

#### **Input Events**

Handles text-input related events, including changes, focus, blur, and submit actions.

**Module Import:**

```javascript
import { InputEventHandlerControl } from "path/to/eventHandlerControl";
```

**Usage:**

```javascript
<Component
  onEvent={InputEventHandlerControl}
  onFocus={() => InputEventHandlerControl("focus")}
  onBlur={() => InputEventHandlerControl("blur")}
  onPressEnter={() => InputEventHandlerControl("submit")}
/>
```

**Exposed Events:**

* `change`
* `focus`
* `blur`
* `submit`

#### **Button Events**

Manages click events for button components.

**Module Import:**

```javascript
import { ButtonEventHandlerControl } from "path/to/eventHandlerControl";
```

**Usage:**

```javascript
<Button
  onClick={() => ButtonEventHandlerControl("click")}
/>
```

**Exposed Events:**

* `click`

#### **Change Events**

Dedicated to handling change events primarily from user-inputs.

**Module Import:**

```javascript
import { ChangeEventHandlerControl } from "path/to/eventHandlerControl";
```

**Usage:**

```javascript
<Input
  onChange={() => ChangeEventHandlerControl("change")}
/>
```

**Exposed Events:**

* `change`

#### **Click Events**

Handles single click, double click, and right click events.

**Module Import:**

```javascript
import { ClickEventHandlerControl } from "path/to/eventHandlerControl";
```

**Usage:**

```javascript
<Component
  onClick={() => ClickEventHandlerControl("click")}
  onDoubleClick={() => ClickEventHandlerControl("doubleClick")}
  onContextMenu={() => ClickEventHandlerControl("rightClick")}
/>
```

**Exposed Events:**

* `click`
* `doubleClick`
* `rightClick`

#### **Checkbox Events**

Controls checkbox interactions, including check and uncheck actions.

**Module Import:**

```javascript
import { CheckboxEventHandlerControl } from "path/to/eventHandlerControl";
```

**Usage:**

```javascript
<Checkbox
  onChange={(e) => CheckboxEventHandlerControl(e.target.checked ? "checked" : "unchecked")}
/>
```

**Exposed Events:**

* `checked`
* `unchecked`

#### **Drag and Drop Events**

Facilitates drag-and-drop operations across draggable components.

**Module Import:**

```javascript
import { DragEventHandlerControl } from "path/to/eventHandlerControl";
```

**Usage:**

```javascript
<DraggableComponent
  onDragStart={() => DragEventHandlerControl("drag")}
  onDrop={() => DragEventHandlerControl("drop")}
/>
```

**Exposed Events:**

* `drag`
* `drop`

#### **Media Control Events**

Handles media controls like play, pause, and end events for media components.

**Module Import:**

```javascript
import { MediaEventHandlerControl } from "path/to/eventHandlerControl";
```

**Usage:**

```javascript
<MediaComponent
  onPlay={() => MediaEventHandlerControl("play")}
  onPause={() => MediaEventHandlerControl("pause")}
  onNext={() => MediaEventHandlerControl("next")}
  onEnded={() => MediaEventHandlerControl("ended")}
/>
```

**Exposed Events:**

* `play`
* `pause`
* `next`
* `ended`

#### **Collaboration Events**

Manages events related to screen- and content-sharing features.

**Module Import:**

```javascript
import { CollaborationEventHandlerControl } from "path/to/eventHandlerControl";
```

**Usage:**

```javascript
<CollaborationComponent
  onStartShare={() => CollaborationEventHandlerControl("shareScreen")}
  onStopShare={() => CollaborationEventHandlerControl("shareScreenEnd")}
/>
```

**Exposed Events:**

* `shareScreen`
* `shareScreenEnd`
* `shareControl`
* `shareControlEnd`
* `shareContent`
* `shareContentEnd`

#### **Element Events**

It handles events related to general element interactions, such as open, edit, close, save, and delete actions.

**Module Import:**

```javascript
import { ElementEventHandlerControl } from "path/to/eventHandlerControl";
```

**Usage:**

<pre class="language-javascript"><code class="lang-javascript"><strong>&#x3C;ElementComponent
</strong>  onOpen={() => ElementEventHandlerControl("open")}
  onEdit={() => ElementEventHandlerControl("edited")}
  onClose={() => ElementEventHandlerControl("close")}
  onSave={() => ElementEventHandlerControl("saved")}
  onDelete={() => ElementEventHandlerControl("delete")}
/>
</code></pre>

**Exposed Events:**

* `open`
* `edited`
* `close`
* `saved`
* `delete`

#### **GeoMap Events**

Manages events related to geographical map interactions such as move, zoom, and select.

**Module Import:**

```javascript
import { GeoMapEventHandlerControl } from "path/to/eventHandlerControl";
```

**Usage:**

```javascript
javascriptCopy code<GeoMapComponent
  onMove={() => GeoMapEventHandlerControl("geoMapMove")}
  onZoom={() => GeoMapEventHandlerControl("geoMapZoom")}
  onSelect={() => GeoMapEventHandlerControl("geoMapSelect")}
/>
```

**Exposed Events:**

* `geoMapMove`
* `geoMapZoom`
* `geoMapSelect`

#### **Chart Events**

Controls events related to chart interactions including zoom, hover, select, and deselect.

**Module Import:**

```javascript
import { ChartEventHandlerControl } from "path/to/eventHandlerControl";
```

**Usage:**

```javascript
<ChartComponent
  onZoom={() => ChartEventHandlerControl("chartZoom")}
  onHover={() => ChartEventHandlerControl("chartHover")}
  onSelect={() => ChartEventHandlerControl("chartSelect")}
  onDeselect={() => ChartEventHandlerControl("chartDeselect")}
/>
```

**Exposed Events:**

* `chartZoom`
* `chartHover`
* `chartSelect`
* `chartDeselect`

#### **Meeting Events**

Handles events specific to meeting interactions such as start, end, join, leave, and camera control.

**Module Import:**

```javascript
import { MeetingEventHandlerControl } from "path/to/eventHandlerControl";
```

**Usage:**

```javascript
<MeetingComponent
  onStart={() => MeetingEventHandlerControl("meetingStart")}
  onEnd={() => MeetingEventHandlerControl("meetingEnd")}
  onJoin={() => MeetingEventHandlerControl("meetingJoin")}
  onLeave={() => MeetingEventHandlerControl("meetingLeave")}
  onCameraOn={() => MeetingEventHandlerControl("showCamera")}
  onCameraOff={() => MeetingEventHandlerControl("hideCamera")}
/>
```

**Exposed Events:**

* `meetingStart`
* `meetingEnd`
* `meetingJoin`
* `meetingLeave`
* `showCamera`
* `hideCamera`

#### **Scanner Events**

Manages scanner interaction events such as success, error, and related operational controls.

**Module Import:**

```javascript
import { ScannerEventHandlerControl } from "path/to/eventHandlerControl";
```

**Usage:**

```javascript
<ScannerComponent
  onSuccess={() => ScannerEventHandlerControl("scannerSuccess")}
  onError={() => ScannerEventHandlerControl("scannerError")}
/>
```

**Exposed Events:**

* `scannerSuccess`
* `scannerError`

#### **Step Events**

Controls step-based interactions, suitable for workflows or guided processes.

**Module Import:**

```javascript
import { StepEventHandlerControl } from "path/to/eventHandlerControl";
```

**Usage:**

```javascript
<StepComponent
  onNext={() => StepEventHandlerControl("next")}
  onStep={() => StepEventHandlerControl("step")}
  onFinish={() => StepEventHandlerControl("finished")}
/>
```

**Exposed Events:**

* `step`
* `next`
* `finished`

#### **Share Content Events**

Handles events related to content sharing within collaborative environments.

**Module Import:**

```javascript
import { ShareContentEventHandlerControl } from "path/to/eventHandlerControl";
```

**Usage:**

```javascript
<ContentSharingComponent
  onStartShare={() => ShareContentEventHandlerControl("shareContent")}
  onEndShare={() => ShareContentEventHandlerControl("shareContentEnd")}
/>
```

**Exposed Events:**

* `shareContent`
* `shareContentEnd`
