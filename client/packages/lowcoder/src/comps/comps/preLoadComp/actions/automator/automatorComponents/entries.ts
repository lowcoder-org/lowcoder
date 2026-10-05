import type { AutomatorComponentEntry } from "./types";
import {
  ALIGN_HORIZONTAL,
  AUTO_HEIGHT,
  COMMON_STYLE_KEYS,
  CONTAINER_STYLE_KEYS,
  DISABLED,
  HIDDEN,
  IMAGE_STYLE_KEYS,
  INPUT_LIKE_STYLE_KEYS,
  LABEL_OBJECT,
  LABEL_STYLE_KEYS,
  LOADING,
  NAVIGATION_STYLE_KEYS,
  TEXT_HORIZONTAL_ALIGNMENT,
  VERTICAL_ALIGNMENT,
} from "./presets";

const TEXT: AutomatorComponentEntry = {
  type: "text",
  defaultLayout: { w: 12, h: 4 },
  required: ["text"],
  optional: [
    "type",
    "horizontalAlignment",
    "verticalAlignment",
    "autoHeight",
    "contentScrollBar",
    "hidden",
  ],
  example: { text: "## Hello", type: "markdown" },
  notes:
    "Use type:'markdown' for headings, links, formatted text. For text alignment INSIDE the component, set the `horizontalAlignment` property (NOT the `align_component` action — that one moves the component on the canvas grid).",
  layoutProperties: {
    type: {
      description: "Render mode for the value.",
      enum: ["markdown", "text"],
    },
    horizontalAlignment: TEXT_HORIZONTAL_ALIGNMENT,
    verticalAlignment: VERTICAL_ALIGNMENT,
    autoHeight: AUTO_HEIGHT,
    contentScrollBar: {
      description: "Show scrollbars when content overflows (only when autoHeight=fixed).",
      type: "boolean",
    },
    hidden: HIDDEN,
  },
  styleProperties: {
    style: [...COMMON_STYLE_KEYS, "links"],
  },
};

const BUTTON: AutomatorComponentEntry = {
  type: "button",
  defaultLayout: { w: 6, h: 5 },
  required: ["text"],
  optional: [
    "type",
    "disabled",
    "loading",
    "form",
    "prefixIcon",
    "suffixIcon",
    "tooltip",
    "tabIndex",
    "hidden",
  ],
  example: { text: "Submit", type: "" },
  notes:
    "Set type:'submit' and form:'<formName>' to submit a form. Leave type:'' for a default click-handler button.",
  layoutProperties: {
    type: {
      description: "'' for default click-handler button, 'submit' for a form-submit button.",
      enum: ["", "submit"],
    },
    disabled: DISABLED,
    loading: LOADING,
    hidden: HIDDEN,
    prefixIcon: {
      description:
        "Icon path string ('/icon:solid/check') shown before the text. Empty string clears it.",
      type: "string",
    },
    suffixIcon: {
      description: "Icon shown after the text.",
      type: "string",
    },
    tooltip: { description: "Hover tooltip text.", type: "string" },
    tabIndex: { description: "Tab order for keyboard navigation.", type: "number" },
  },
  styleProperties: {
    style: [...COMMON_STYLE_KEYS],
  },
};

const INPUT: AutomatorComponentEntry = {
  type: "input",
  defaultLayout: { w: 12, h: 6 },
  required: ["label", "placeholder"],
  optional: [
    "value",
    "validationType",
    "required",
    "allowClear",
    "showCount",
    "readOnly",
    "disabled",
    "hidden",
    "prefixIcon",
    "suffixIcon",
  ],
  example: {
    label: { text: "Name", position: "row", align: "left" },
    placeholder: "Enter name",
    allowClear: true,
  },
  layoutProperties: {
    label: LABEL_OBJECT,
    placeholder: { description: "Placeholder text.", type: "string" },
    disabled: DISABLED,
    hidden: HIDDEN,
    showCount: { description: "Show character counter.", type: "boolean" },
    allowClear: { description: "Show a clear button.", type: "boolean" },
    readOnly: { description: "Read-only field.", type: "boolean" },
    required: { description: "Mark as required for form validation.", type: "boolean" },
  },
  styleProperties: {
    style: [...CONTAINER_STYLE_KEYS],
    labelStyle: [...LABEL_STYLE_KEYS],
    inputFieldStyle: [...INPUT_LIKE_STYLE_KEYS],
  },
};

const NUMBER_INPUT: AutomatorComponentEntry = {
  type: "numberInput",
  defaultLayout: { w: 12, h: 6 },
  required: ["label"],
  optional: [
    "value",
    "min",
    "max",
    "step",
    "placeholder",
    "disabled",
    "hidden",
    "readOnly",
  ],
  example: {
    label: { text: "Quantity", position: "row" },
    value: 1,
    min: 0,
    max: 100,
  },
  layoutProperties: {
    label: LABEL_OBJECT,
    placeholder: { description: "Placeholder text.", type: "string" },
    disabled: DISABLED,
    hidden: HIDDEN,
    readOnly: { description: "Read-only field.", type: "boolean" },
  },
  styleProperties: {
    style: [...CONTAINER_STYLE_KEYS],
    labelStyle: [...LABEL_STYLE_KEYS],
    inputFieldStyle: [...INPUT_LIKE_STYLE_KEYS],
  },
};

const DROPDOWN: AutomatorComponentEntry = {
  type: "select",
  defaultLayout: { w: 12, h: 6 },
  required: ["label", "options", "value"],
  optional: ["allowClear", "disabled", "hidden", "showSearch", "placeholder"],
  example: {
    label: { text: "Status", position: "row" },
    options: {
      optionType: "manual",
      manual: {
        manual: [
          { value: "pending", label: "Pending" },
          { value: "done", label: "Done" },
        ],
      },
    },
    value: "pending",
  },
  layoutProperties: {
    label: LABEL_OBJECT,
    placeholder: { description: "Placeholder text.", type: "string" },
    disabled: DISABLED,
    hidden: HIDDEN,
    allowClear: { description: "Show a clear button.", type: "boolean" },
    showSearch: { description: "Enable search filter.", type: "boolean" },
  },
  styleProperties: {
    style: [...COMMON_STYLE_KEYS, "accent", "validate"],
    labelStyle: [...LABEL_STYLE_KEYS],
    childrenInputFieldStyle: [...INPUT_LIKE_STYLE_KEYS],
  },
};

const CHECKBOX: AutomatorComponentEntry = {
  type: "checkbox",
  defaultLayout: { w: 8, h: 5 },
  required: ["label"],
  optional: ["value", "options", "disabled", "hidden", "layout"],
  example: {
    label: { text: "I agree", position: "row" },
    value: false,
  },
  layoutProperties: {
    label: LABEL_OBJECT,
    disabled: DISABLED,
    hidden: HIDDEN,
    layout: {
      description: "Group layout direction for multi-option checkboxes.",
      enum: ["horizontal", "vertical", "autoColumns"],
    },
  },
  styleProperties: {
    style: [...COMMON_STYLE_KEYS],
    labelStyle: [...LABEL_STYLE_KEYS],
    inputFieldStyle: [...INPUT_LIKE_STYLE_KEYS, "checkedBackground", "uncheckedBackground", "uncheckedBorder", "hoverBackground"],
  },
};

const FORM: AutomatorComponentEntry = {
  type: "form",
  isContainer: true,
  defaultLayout: { w: 12, h: 30 },
  required: ["container"],
  optional: ["hidden", "disabled"],
  example: {
    container: {
      header: {},
      body: { "0": { view: {} } },
      footer: {},
      showHeader: false,
      showBody: true,
      showFooter: true,
      autoHeight: "auto",
      horizontalGridCells: 24,
      scrollbars: false,
      showVerticalScrollbar: false,
      style: {},
    },
  },
  notes:
    "Nest input/select/etc. under '<formName>.container.body.0.view'. Submit button goes under '<formName>.container.footer' with type:'submit', form:'<formName>'.",
  layoutProperties: {
    hidden: HIDDEN,
    disabled: DISABLED,
  },
  styleProperties: {
    style: [...CONTAINER_STYLE_KEYS],
    headerStyle: [...CONTAINER_STYLE_KEYS],
    bodyStyle: [...CONTAINER_STYLE_KEYS],
    footerStyle: [...CONTAINER_STYLE_KEYS],
  },
};

const CONTAINER: AutomatorComponentEntry = {
  type: "container",
  isContainer: true,
  defaultLayout: { w: 12, h: 20 },
  required: ["container"],
  optional: ["hidden"],
  example: {
    container: {
      header: {},
      body: { "0": { view: {} } },
      footer: {},
      showHeader: false,
      showBody: true,
      showFooter: false,
      autoHeight: "auto",
      horizontalGridCells: 24,
      style: {},
    },
  },
  notes:
    "Nest under '<containerName>.container.body.0.view'.",
  layoutProperties: {
    hidden: HIDDEN,
  },
  styleProperties: {
    style: [...CONTAINER_STYLE_KEYS],
    headerStyle: [...CONTAINER_STYLE_KEYS],
    bodyStyle: [...CONTAINER_STYLE_KEYS],
    footerStyle: [...CONTAINER_STYLE_KEYS],
  },
};

const MODAL: AutomatorComponentEntry = {
  type: "modal",
  isContainer: true,
  defaultLayout: { w: 12, h: 40 },
  required: ["title", "container"],
  optional: ["open", "showMask", "maskClosable", "width", "hidden"],
  example: {
    title: "Add Item",
    open: false,
    container: {},
  },
  notes:
    "container MUST be empty {}. Children are nested under '<modalName>.container' (no body/header/footer paths).",
  layoutProperties: {
    open: { description: "Whether the modal is visible.", type: "boolean" },
    showMask: { description: "Render the dim background mask.", type: "boolean" },
    maskClosable: { description: "Allow closing by clicking the mask.", type: "boolean" },
    width: { description: 'Modal width, e.g. "600px" or "60%".', type: "string" },
    hidden: HIDDEN,
  },
  styleProperties: {
    style: [...CONTAINER_STYLE_KEYS],
  },
};

const DRAWER: AutomatorComponentEntry = {
  type: "drawer",
  isContainer: true,
  defaultLayout: { w: 12, h: 40 },
  required: ["title", "container"],
  optional: ["open", "placement", "showMask", "maskClosable", "width", "hidden"],
  example: { title: "Edit", open: false, container: {} },
  notes:
    "Same flat-container rule as modal. Nest under '<drawerName>.container'.",
  layoutProperties: {
    open: { description: "Whether the drawer is visible.", type: "boolean" },
    placement: {
      description: "Edge from which the drawer slides in.",
      enum: ["top", "right", "bottom", "left"],
    },
    showMask: { description: "Render the dim background mask.", type: "boolean" },
    maskClosable: { description: "Allow closing by clicking the mask.", type: "boolean" },
    width: { description: 'Drawer width, e.g. "400px".', type: "string" },
    hidden: HIDDEN,
  },
  styleProperties: {
    style: [...CONTAINER_STYLE_KEYS],
  },
};

const TABLE: AutomatorComponentEntry = {
  type: "table",
  defaultLayout: { w: 24, h: 30 },
  required: ["columns", "data"],
  optional: [
    "pagination",
    "showRowGridBorder",
    "showHeader",
    "size",
    "hidden",
    "rowAutoHeight",
  ],
  layoutProperties: {
    showHeader: { description: "Render the column header row.", type: "boolean" },
    showRowGridBorder: { description: "Outline each row.", type: "boolean" },
    size: { description: "Row density.", enum: ["small", "middle", "large"] },
    rowAutoHeight: { description: "Auto-size each row to content.", type: "boolean" },
    hidden: HIDDEN,
  },
  styleProperties: {
    style: [...CONTAINER_STYLE_KEYS],
    headerStyle: [...COMMON_STYLE_KEYS],
    rowStyle: [...COMMON_STYLE_KEYS],
    cellStyle: [...COMMON_STYLE_KEYS],
  },
  example: {
    columns: [
      {
        title: "Task",
        dataIndex: "task",
        render: { compType: "text", comp: { text: "{{currentCell}}" } },
      },
      {
        title: "Status",
        dataIndex: "status",
        render: { compType: "text", comp: { text: "{{currentCell}}" } },
      },
    ],
    data: '[{"task":"Buy groceries","status":"Pending"},{"task":"Call Alice","status":"Done"}]',
    pagination: { pageSizeOptions: "[5, 10, 20, 50]" },
    showRowGridBorder: true,
  },
  notes:
    "`data` MUST be a stringified JSON array. Use {{currentCell}} in render unless told otherwise.",
};

const LIST_VIEW: AutomatorComponentEntry = {
  type: "listView",
  isContainer: true,
  defaultLayout: { w: 24, h: 30 },
  required: ["container"],
  optional: [
    "noOfRows",
    "itemIndexName",
    "itemDataName",
    "noOfColumns",
    "horizontal",
    "scrollbars",
    "hidden",
  ],
  layoutProperties: {
    noOfColumns: { description: "Columns per row in the grid.", type: "number" },
    horizontal: { description: "Render rows horizontally.", type: "boolean" },
    scrollbars: { description: "Always show scrollbars.", type: "boolean" },
    hidden: HIDDEN,
  },
  styleProperties: {
    style: [...CONTAINER_STYLE_KEYS],
  },
  example: {
    container: {},
    noOfRows: "3",
    itemIndexName: "i",
    itemDataName: "currentItem",
  },
  notes:
    "container is the per-item template. Nest item components directly under '<listViewName>.container' (flat). Do NOT use body/header/footer.",
};

const IMAGE: AutomatorComponentEntry = {
  type: "image",
  defaultLayout: { w: 8, h: 12 },
  required: ["src"],
  optional: [
    "autoHeight",
    "placement",
    "enableOverflow",
    "aspectRatio",
    "supportPreview",
    "hidden",
    "clipPath",
  ],
  example: { src: "https://images.unsplash.com/photo-1518770660439-4636190af475" },
  notes: "src MUST be a real, publicly accessible URL.",
  layoutProperties: {
    autoHeight: AUTO_HEIGHT,
    placement: {
      description: "Where the image sits inside the cell.",
      enum: [
        "top",
        "bottom",
        "left",
        "right",
        "top-left",
        "top-right",
        "bottom-left",
        "bottom-right",
      ],
    },
    enableOverflow: { description: "Crop image to fit instead of contain.", type: "boolean" },
    aspectRatio: { description: 'CSS aspect-ratio (e.g. "16 / 9").', type: "string" },
    supportPreview: { description: "Allow click-to-preview at full size.", type: "boolean" },
    hidden: HIDDEN,
    clipPath: { description: "CSS clip-path string.", type: "string" },
  },
  styleProperties: {
    style: [...IMAGE_STYLE_KEYS],
  },
};

const DIVIDER: AutomatorComponentEntry = {
  type: "divider",
  defaultLayout: { w: 24, h: 2 },
  required: [],
  optional: ["title", "align", "type", "dashed", "hidden"],
  example: {},
  layoutProperties: {
    title: { description: "Optional label rendered in the divider.", type: "string" },
    align: ALIGN_HORIZONTAL,
    type: { description: "Orientation.", enum: ["horizontal", "vertical"] },
    dashed: { description: "Render with a dashed line.", type: "boolean" },
    hidden: HIDDEN,
  },
  styleProperties: {
    style: [...COMMON_STYLE_KEYS],
  },
};

const DATE: AutomatorComponentEntry = {
  type: "date",
  defaultLayout: { w: 12, h: 6 },
  required: ["label"],
  optional: ["value", "format", "placeholder", "disabled", "hidden", "showTime"],
  example: {
    label: { text: "Due date", position: "row" },
    format: "YYYY-MM-DD",
  },
  layoutProperties: {
    label: LABEL_OBJECT,
    placeholder: { description: "Placeholder text.", type: "string" },
    disabled: DISABLED,
    hidden: HIDDEN,
    showTime: { description: "Include time picker.", type: "boolean" },
    format: { description: 'Display/parse format, e.g. "YYYY-MM-DD".', type: "string" },
  },
  styleProperties: {
    style: [...COMMON_STYLE_KEYS, "accent", "validate"],
    labelStyle: [...LABEL_STYLE_KEYS],
    inputFieldStyle: [...INPUT_LIKE_STYLE_KEYS],
  },
};

const SWITCH: AutomatorComponentEntry = {
  type: "switch",
  defaultLayout: { w: 6, h: 5 },
  required: ["label"],
  optional: ["value", "disabled", "hidden"],
  example: {
    label: { text: "Enabled", position: "row" },
    value: true,
  },
  layoutProperties: {
    label: LABEL_OBJECT,
    disabled: DISABLED,
    hidden: HIDDEN,
  },
  styleProperties: {
    style: ["handle", "unchecked", "checked", "margin", "padding"],
    labelStyle: [...LABEL_STYLE_KEYS],
  },
};

const TEXT_AREA: AutomatorComponentEntry = {
  type: "textArea",
  defaultLayout: { w: 12, h: 8 },
  required: ["label"],
  optional: [
    "placeholder",
    "value",
    "autoHeight",
    "disabled",
    "hidden",
    "readOnly",
    "showCount",
    "allowClear",
  ],
  example: {
    label: { text: "Description", position: "row" },
    placeholder: "Enter description...",
  },
  layoutProperties: {
    label: LABEL_OBJECT,
    placeholder: { description: "Placeholder text.", type: "string" },
    autoHeight: AUTO_HEIGHT,
    disabled: DISABLED,
    hidden: HIDDEN,
    readOnly: { description: "Read-only field.", type: "boolean" },
    showCount: { description: "Show character counter.", type: "boolean" },
    allowClear: { description: "Show a clear button.", type: "boolean" },
  },
  styleProperties: {
    style: [...CONTAINER_STYLE_KEYS],
    labelStyle: [...LABEL_STYLE_KEYS],
    inputFieldStyle: [...INPUT_LIKE_STYLE_KEYS],
  },
};

const PASSWORD: AutomatorComponentEntry = {
  type: "password",
  defaultLayout: { w: 12, h: 6 },
  required: ["label"],
  optional: ["placeholder", "disabled", "hidden", "visibilityToggle"],
  example: {
    label: { text: "Password", position: "row" },
    placeholder: "Enter password",
  },
  layoutProperties: {
    label: LABEL_OBJECT,
    placeholder: { description: "Placeholder text.", type: "string" },
    disabled: DISABLED,
    hidden: HIDDEN,
    visibilityToggle: { description: "Show the eye toggle to reveal the password.", type: "boolean" },
  },
  styleProperties: {
    style: [...CONTAINER_STYLE_KEYS],
    labelStyle: [...LABEL_STYLE_KEYS],
    inputFieldStyle: [...INPUT_LIKE_STYLE_KEYS],
  },
};

const CHART: AutomatorComponentEntry = {
  type: "chart",
  defaultLayout: { w: 12, h: 20 },
  required: ["chartType", "data"],
  optional: ["title", "xAxisKey", "hidden", "showLegend"],
  example: {
    chartType: "bar",
    data: '[{"category":"A","value":30},{"category":"B","value":50},{"category":"C","value":20}]',
    title: "Sales by Category",
    xAxisKey: "category",
  },
  notes: "chartType: 'bar', 'line', 'pie', 'scatter'. data is a stringified JSON array.",
  layoutProperties: {
    chartType: {
      description: "Visualisation kind.",
      enum: ["bar", "line", "pie", "scatter"],
    },
    title: { description: "Chart title.", type: "string" },
    showLegend: { description: "Display the legend.", type: "boolean" },
    hidden: HIDDEN,
  },
  styleProperties: {
    style: [
      "chartBackgroundColor",
      "chartGradientColor",
      "chartShadowColor",
      "chartBorderColor",
      "chartTextColor",
      "chartTextSize",
      "chartTextWeight",
      "chartFontFamily",
      "chartFontStyle",
      "chartBorderStyle",
      "chartBorderRadius",
      "chartBorderWidth",
      "chartOpacity",
      "chartBoxShadow",
      "margin",
      "padding",
    ],
  },
};

const CARD: AutomatorComponentEntry = {
  type: "card",
  isContainer: true,
  defaultLayout: { w: 8, h: 15 },
  required: ["title"],
  optional: [
    "size",
    "showTitle",
    "extraTitle",
    "cardType",
    "CoverImg",
    "imgSrc",
    "imgHeight",
    "showMeta",
    "metaTitle",
    "metaDesc",
    "hoverable",
    "showActionIcon",
    "hidden",
  ],
  example: {
    title: "Card Title",
    cardType: "common",
    CoverImg: true,
    imgSrc: "https://images.unsplash.com/photo-1518770660439-4636190af475",
    imgHeight: "180px",
    showMeta: true,
    metaTitle: "Project name",
    metaDesc: "Short project description",
  },
  notes:
    "Nest content inside '<cardName>.container'. For the built-in card cover image, use `set_properties` on the card with `imgSrc` (not `src`) and set `CoverImg: true`; `src` is only for standalone Image components.",
  layoutProperties: {
    size: { description: "Card density.", enum: ["default", "small"] },
    showTitle: { description: "Render the title bar.", type: "boolean" },
    extraTitle: { description: "Text rendered in the card header extra link.", type: "string" },
    cardType: { description: "Card mode. Built-in cover/meta fields require common.", enum: ["common", "custom"] },
    CoverImg: { description: "Show the built-in cover image.", type: "boolean" },
    imgSrc: { description: "Built-in card cover image URL. Use this for card cover image edits.", type: "string" },
    imgHeight: { description: 'Built-in card cover image height, e.g. "180px" or "auto".', type: "string" },
    showMeta: { description: "Show built-in card meta title and description.", type: "boolean" },
    metaTitle: { description: "Built-in card meta title.", type: "string" },
    metaDesc: { description: "Built-in card meta description.", type: "string" },
    hoverable: { description: "Lift on hover.", type: "boolean" },
    showActionIcon: { description: "Show built-in card action icons.", type: "boolean" },
    hidden: HIDDEN,
  },
  styleProperties: {
    style: [...CONTAINER_STYLE_KEYS, "IconColor", "activateColor"],
    headerStyle: [...COMMON_STYLE_KEYS],
    bodyStyle: [...CONTAINER_STYLE_KEYS],
  },
};

const TABBED_CONTAINER: AutomatorComponentEntry = {
  type: "tabbedContainer",
  isContainer: true,
  defaultLayout: { w: 24, h: 30 },
  required: ["container"],
  optional: ["tabs", "tabPosition", "showHeader", "hidden"],
  example: { container: {} },
  notes: "Nest content per tab. Tabs are managed via properties.",
  layoutProperties: {
    tabPosition: {
      description: "Tab bar placement.",
      enum: ["top", "right", "bottom", "left"],
    },
    showHeader: { description: "Show the tabs bar.", type: "boolean" },
    hidden: HIDDEN,
  },
  styleProperties: {
    style: [...CONTAINER_STYLE_KEYS],
    headerStyle: [...COMMON_STYLE_KEYS],
    bodyStyle: [...CONTAINER_STYLE_KEYS],
    tabsStyle: [...COMMON_STYLE_KEYS],
  },
};

const VIDEO: AutomatorComponentEntry = {
  type: "video",
  defaultLayout: { w: 12, h: 15 },
  required: ["src"],
  optional: ["controls", "autoPlay", "loop", "muted", "hidden"],
  example: { src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", controls: true },
  notes: "src must be a real URL. Set layout.h >= 10.",
  layoutProperties: {
    controls: { description: "Show native player controls.", type: "boolean" },
    autoPlay: { description: "Auto-play on mount (often requires muted=true).", type: "boolean" },
    loop: { description: "Loop the video.", type: "boolean" },
    muted: { description: "Start muted.", type: "boolean" },
    hidden: HIDDEN,
  },
  styleProperties: {
    style: ["margin", "padding"],
  },
};

const AVATAR: AutomatorComponentEntry = {
  type: "avatar",
  defaultLayout: { w: 6, h: 6 },
  required: ["icon", "iconSize"],
  optional: ["src", "avatarLabel", "avatarCatption", "shape", "hidden"],
  example: {
    icon: "/icon:solid/user",
    iconSize: "40",
    shape: "circle",
    avatarLabel: "John Doe",
  },
  layoutProperties: {
    shape: { description: "Avatar shape.", enum: ["circle", "square"] },
    iconSize: { description: "Icon pixel size as a string, e.g. '40'.", type: "string" },
    hidden: HIDDEN,
  },
  styleProperties: {
    style: ["background", "fill"],
    avatarLabelStyle: [...COMMON_STYLE_KEYS],
    avatarContainerStyle: [...CONTAINER_STYLE_KEYS],
  },
};

const PROGRESS: AutomatorComponentEntry = {
  type: "progress",
  defaultLayout: { w: 12, h: 4 },
  required: ["value"],
  optional: ["showInfo", "hidden"],
  example: { value: "75" },
  layoutProperties: {
    showInfo: { description: "Display the percentage label.", type: "boolean" },
    hidden: HIDDEN,
  },
  styleProperties: {
    style: ["text", "textSize", "textWeight", "fontFamily", "fontStyle", "radius", "margin", "padding", "lineHeight", "track", "fill", "success"],
  },
};

const RATING: AutomatorComponentEntry = {
  type: "rating",
  defaultLayout: { w: 8, h: 5 },
  required: ["label"],
  optional: ["value", "max", "allowHalf", "disabled", "hidden"],
  example: {
    label: { text: "Rating", position: "row" },
    value: "3",
    max: "5",
  },
  layoutProperties: {
    label: LABEL_OBJECT,
    allowHalf: { description: "Allow half-star ratings.", type: "boolean" },
    disabled: DISABLED,
    hidden: HIDDEN,
  },
  styleProperties: {
    style: ["checked", "unchecked", "margin", "padding"],
    labelStyle: [...LABEL_STYLE_KEYS],
  },
};

const SLIDER: AutomatorComponentEntry = {
  type: "slider",
  defaultLayout: { w: 12, h: 5 },
  required: ["label"],
  optional: ["value", "min", "max", "step", "disabled", "hidden", "vertical"],
  example: {
    label: { text: "Volume", position: "row" },
    value: "50",
    min: "0",
    max: "100",
  },
  layoutProperties: {
    label: LABEL_OBJECT,
    disabled: DISABLED,
    hidden: HIDDEN,
    vertical: { description: "Render vertically.", type: "boolean" },
  },
  styleProperties: {
    style: ["fill", "thumb", "thumbBorder", "track", "margin", "padding"],
    labelStyle: [...LABEL_STYLE_KEYS],
  },
};

const NAVIGATION: AutomatorComponentEntry = {
  type: "navigation",
  defaultLayout: { w: 24, h: 5 },
  required: ["items"],
  optional: ["logoUrl", "horizontalAlignment", "hidden"],
  example: {
    items: [
      { label: "Home", hidden: false },
      { label: "About", hidden: false },
    ],
  },
  layoutProperties: {
    horizontalAlignment: ALIGN_HORIZONTAL,
    hidden: HIDDEN,
    logoUrl: { description: "Optional logo image URL.", type: "string" },
  },
  styleProperties: {
    style: [...NAVIGATION_STYLE_KEYS],
  },
};

const TIMELINE: AutomatorComponentEntry = {
  type: "timeline",
  defaultLayout: { w: 12, h: 15 },
  required: ["value"],
  optional: ["mode", "reverse", "hidden"],
  example: {
    value: '[{"title":"Step 1","subTitle":"Started"},{"title":"Step 2","subTitle":"In Progress"}]',
  },
  notes: "value must be a stringified JSON array of timeline entries.",
  layoutProperties: {
    mode: {
      description: "Layout mode for entries.",
      enum: ["left", "alternate", "right"],
    },
    reverse: { description: "Reverse entry order.", type: "boolean" },
    hidden: HIDDEN,
  },
  styleProperties: {
    style: [
      "background",
      "titleColor",
      "subTitleColor",
      "labelColor",
      "margin",
      "padding",
      "radius",
    ],
  },
};

const STEP: AutomatorComponentEntry = {
  type: "step",
  defaultLayout: { w: 24, h: 6 },
  required: ["value", "options"],
  optional: ["initialValue", "direction", "size", "hidden"],
  layoutProperties: {
    direction: {
      description: "Step bar orientation.",
      enum: ["horizontal", "vertical"],
    },
    size: { description: "Step density.", enum: ["default", "small"] },
    hidden: HIDDEN,
  },
  styleProperties: {
    style: [...COMMON_STYLE_KEYS],
  },
  example: {
    value: "1",
    initialValue: "1",
    options: {
      optionType: "manual",
      manual: {
        manual: [
          { value: "1", label: "Step 1" },
          { value: "2", label: "Step 2" },
          { value: "3", label: "Step 3" },
        ],
      },
    },
  },
  notes: "Step values must be numbers starting from 1.",
};

const RADIO: AutomatorComponentEntry = {
  type: "radio",
  defaultLayout: { w: 12, h: 5 },
  required: ["label", "options"],
  optional: ["value", "disabled", "hidden", "layout"],
  example: {
    label: { text: "Priority", position: "row" },
    options: {
      optionType: "manual",
      manual: {
        manual: [
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" },
        ],
      },
    },
    value: "medium",
  },
  layoutProperties: {
    label: LABEL_OBJECT,
    disabled: DISABLED,
    hidden: HIDDEN,
    layout: {
      description: "Group layout direction.",
      enum: ["horizontal", "vertical", "autoColumns"],
    },
  },
  styleProperties: {
    style: [...COMMON_STYLE_KEYS],
    labelStyle: [...LABEL_STYLE_KEYS],
    inputFieldStyle: [...INPUT_LIKE_STYLE_KEYS, "checkedBackground", "uncheckedBackground", "uncheckedBorder", "hoverBackground"],
  },
};

const CHAT: AutomatorComponentEntry = {
  type: "chat",
  defaultLayout: { w: 12, h: 20 },
  required: [],
  optional: ["chatQuery", "tableName", "placeholder"],
  example: {
    tableName: "LC_AI",
    placeholder: "Ask anything...",
  },
  notes: "AI chat component for embedding a conversational assistant in the app.",
};

const CHAT_BOX: AutomatorComponentEntry = {
  type: "chatBox",
  defaultLayout: { w: 12, h: 24 },
  required: [],
  optional: ["messages", "controller", "placeholder"],
  example: {},
  notes: "Chat UI for displaying messages and sending user input. Pair with chatController for realtime typing/presence.",
};

const CHAT_CONTROLLER: AutomatorComponentEntry = {
  type: "chatController",
  defaultLayout: { w: 12, h: 5 },
  required: [],
  optional: ["roomId"],
  example: {},
  notes: "Realtime chat controller hook. Use with chatBox for presence and typing indicators.",
};

export const AUTOMATOR_COMPONENTS: AutomatorComponentEntry[] = [
  TEXT,
  BUTTON,
  INPUT,
  NUMBER_INPUT,
  TEXT_AREA,
  PASSWORD,
  DROPDOWN,
  CHECKBOX,
  RADIO,
  SWITCH,
  SLIDER,
  RATING,
  DATE,
  FORM,
  CONTAINER,
  MODAL,
  DRAWER,
  TABLE,
  LIST_VIEW,
  CARD,
  TABBED_CONTAINER,
  IMAGE,
  VIDEO,
  AVATAR,
  CHART,
  PROGRESS,
  NAVIGATION,
  TIMELINE,
  STEP,
  DIVIDER,
  CHAT,
  CHAT_BOX,
  CHAT_CONTROLLER,
];
