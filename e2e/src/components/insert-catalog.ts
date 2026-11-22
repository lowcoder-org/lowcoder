/**
 * The 112 component types of the editor's Components pane, as S1 (the insert-every-tile smoke test) needs them: the
 * tile label the panel search finds each by, the five types that live in the DSL `hooks` instead of on the grid, and
 * the grid types that render no `data-testid`. Inventory taken from the pane of 3.0.0-e2e;
 * `tests/components/insert-catalog.spec.ts` keeps it in step with the recordings in `fixtures/dsl`.
 */

/** Component type -> the label of its tile (the panel search text is derived from it, see `searchTextOf`). */
export const INSERT_TILE_LABELS: Readonly<Record<string, string>> = {
  barChart: "Bar Chart",
  lineChart: "Line Chart",
  pieChart: "Pie Chart",
  scatterChart: "Scatter Chart",
  candleStickChart: "Candlestick Chart",
  funnelChart: "Funnel Chart",
  gaugeChart: "Gauge Chart",
  graphChart: "Graph Chart",
  heatmapChart: "Heatmap Chart",
  radarChart: "Radar Chart",
  sankeyChart: "Sankey Chart",
  sunburstChart: "Sunburst Chart",
  themeriverChart: "Theme River Chart",
  treeChart: "Tree Chart",
  treemapChart: "Treemap Chart",
  openLayersGeoMap: "Openlayers Geomap",
  chartsGeoMap: "Geo Map Charts",
  table: "Table",
  tableLite: "Table (Lite)",
  pivotTable: "Pivot Table",
  mermaid: "Mermaid Chart",
  timeline: "Timeline",
  progress: "Progress",
  progressCircle: "Progress Circle",
  shape: "Shapes",
  text: "Text Display",
  responsiveLayout: "Responsive Layout",
  pageLayout: "Page Layout",
  columnLayout: "Column Layout",
  splitLayout: "Split Layout",
  floatTextContainer: "Float Text Container",
  card: "Content Card",
  tabbedContainer: "Tabbed Container",
  collapsibleContainer: "Collapsible Container",
  container: "Container",
  listView: "List View",
  grid: "Grid",
  multiTags: "Tags",
  modal: "Modal",
  drawer: "Drawer",
  toast: "Toast",
  divider: "Divider",
  navigation: "Navigation",
  step: "Step Control",
  cascader: "Cascader",
  link: "Link",
  floatingButton: "Float Button",
  tree: "Tree",
  treeSelect: "Tree Select",
  form: "Form",
  jsonSchemaForm: "JSON Schema Form",
  jsonEditor: "JSON Editor",
  jsonExplorer: "JSON Explorer",
  richTextEditor: "Rich Text Editor",
  input: "Input",
  password: "Password",
  numberInput: "Number Input",
  textArea: "Text Area",
  autocomplete: "Auto Complete",
  switch: "Switch",
  checkbox: "Checkbox",
  radio: "Radio",
  date: "Date",
  dateRange: "Date Range",
  time: "Time",
  timeRange: "Time Range",
  slider: "Slider",
  rangeSlider: "Range Slider",
  button: "Form Button",
  controlButton: "Icon Button",
  dropdown: "Dropdown",
  toggleButton: "Toggle Button",
  segmentedControl: "Segmented Control",
  rating: "Rating",
  select: "Select",
  multiSelect: "Multiselect",
  sharingcomponent: "Screen Share Stream",
  videocomponent: "Camera Stream",
  meeting: "Agora Meeting Controller",
  avatar: "Avatar",
  avatarGroup: "Avatar Group",
  comment: "Comment",
  mention: "Mention",
  chatController: "Chat Controller",
  chatBox: "Chat Box",
  chat: "AI Chat",
  calendar: "Calendar",
  timer: "Timer",
  ganttChart: "Gantt Chart",
  kanban: "Kanban Board (preview!)",
  hillchart: "Hillchart",
  bpmnEditor: "BPMN Editor",
  file: "File Upload",
  fileViewer: "File Viewer",
  qrCode: "QR Code",
  transfer: "Transfer",
  scanner: "Scanner",
  signature: "Signature",
  tour: "Tour",
  turnstileCaptcha: "Turnstile Captcha",
  image: "Image",
  carousel: "Image Carousel",
  audio: "Audio",
  video: "Video",
  jsonLottie: "Lottie Animation",
  icon: "Icons",
  imageEditor: "Image Editor",
  colorPicker: "Color Picker",
  iframe: "IFrame",
  custom: "Custom Component",
  chart: "Chart (deprecated)",
  basicChart: "Multitype Chart",
};

/** Every type of the pane, in the pane's order. */
export const INSERT_TYPES: readonly string[] = Object.keys(INSERT_TILE_LABELS);

/**
 * The types that are not on the grid until something opens them: the DSL keeps them in `hooks` and the published view
 * shows no element of their own (no test id, no `data-comp-name`).
 */
export const HOOK_TYPES: ReadonlySet<string> = new Set(["modal", "drawer", "toast", "chatController", "meeting"]);

/**
 * Grid types whose rendered component carries no `data-testid` even when `dataTestId` is set: the
 * view is located by the component's name, `[data-comp-name=<name>]`.
 */
export const TYPES_WITHOUT_TEST_ID: ReadonlySet<string> = new Set([
  "barChart", "basicChart", "candleStickChart", "chart", "chartsGeoMap", "funnelChart", "gaugeChart", "graphChart",
  "grid", "heatmapChart", "kanban", "lineChart", "listView", "pieChart", "radarChart", "sankeyChart", "scatterChart",
  "sunburstChart", "themeriverChart", "treeChart", "treemapChart",
]);

/** The panel search text for a type: its label without spaces, lower case (the search the probe used for all 112). */
export function searchTextOf(compType: string): string {
  const label = INSERT_TILE_LABELS[compType];
  if (label === undefined) {
    throw new Error(`no tile label is known for the component type "${compType}"`);
  }
  return label.replace(/\s+/g, "").toLowerCase();
}
