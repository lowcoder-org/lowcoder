import "comps/comps/layout/navLayout";
import "comps/comps/layout/mobileTabLayout";

import cnchar from "cnchar";
import { trans } from "i18n";
import { remoteComp } from "./comps/remoteComp/remoteComp";
import {
  registerComp,
  type UICompManifest,
  type UICompType,
} from "./uiCompRegistry";
import { RemoteCompInfo } from "types/remoteComp";

import {
  AvatarCompIcon,
  AvatarGroupCompIcon,
  AudioCompIcon,
  ButtonCompIcon,
  IconButtonCompIcon,
  CardCompIcon,
  CalendarCompIcon,
  CarouselCompIcon,
  CascaderCompIcon,
  ChartCompIcon,
  CheckboxCompIcon,
  ColorPickerCompIcon,
  CollapsibleContainerCompIcon,
  ColumnLayoutCompIcon,
  ContainerCompIcon,
  CustomCompIcon,
  DateCompIcon,
  DateRangeCompIcon,
  DividerCompIcon,
  DrawerCompIcon,
  DropdownCompIcon,
  FileViewerCompIcon,
  FloatingButtonCompIcon,
  FormCompIcon,
  GridCompIcon,
  IFrameCompIcon,
  ImageCompIcon,
  ImageEditorCompIcon,
  InputCompIcon,
  JsonEditorCompIcon,
  JsonExplorerCompIcon,
  JsonFormCompIcon,
  LinkCompIcon,
  ListViewCompIcon,
  ModalCompIcon,
  MultiSelectCompIcon,
  NavComIcon,
  NumberInputCompIcon,
  PasswordCompIcon,
  ProcessCircleCompIcon,
  ProgressCompIcon,
  QRCodeCompIcon,
  RadioCompIcon,
  RangeSliderCompIcon,
  RatingCompIcon,
  RichTextEditorCompIcon,
  ScannerCompIcon,
  SegmentedCompIcon,
  SelectCompIcon,
  SignatureCompIcon,
  SliderCompIcon,
  SwitchCompIcon,
  TabbedContainerCompIcon,
  TableCompIcon,
  TextAreaCompIcon,
  TextCompIcon,
  TimeCompIcon,
  TimerCompIcon,
  TimeRangeCompIcon,
  ToggleButtonCompIcon,
  TransferCompIcon,
  TreeDisplayCompIcon,
  TreeSelectCompIcon,
  UploadCompIcon,
  VideoCompIcon,
  VideoMeetingRoomCompIcon,
  VideoCameraStreamCompIcon,
  VideoScreenshareCompIcon,
  TimeLineCompIcon,
  LottieAnimationCompIcon,
  CommentCompIcon,
  MentionCompIcon,
  AutoCompleteCompIcon,
  ResponsiveLayoutCompIcon,
  SplitLayoutCompIcon,
  MermaidCompIcon,
  IconCompIcon,
  PageLayoutCompIcon,
  FloatingTextCompIcon,
  TourCompIcon,
  StepCompIcon,
  ShapesCompIcon,

  CandlestickChartCompIcon,
  FunnelChartCompIcon,
  HeatmapChartCompIcon,
  GaugeChartCompIcon,
  RadarChartCompIcon,
  SankeyChartCompIcon,
  SunburstChartCompIcon,
  ThemeriverChartCompIcon,
  TreeChartCompIcon,
  TreemapChartCompIcon,
  BPMNEditorCompIcon,
  GeoMapChartsCompIcon,
  GeoMapLayersCompIcon,
  HillchartCompIcon,
  TurnstileCaptchaCompIcon,
  PivotTableCompIcon,
  GraphChartCompIcon,
  GanttCompIcon,
  KanbanCompIcon,
  PieChartCompIcon,
  BarChartCompIcon,
  LineChartCompIcon,
  ScatterChartCompIcon
} from "lowcoder-design";
import { ModuleComp } from "./comps/moduleComp/moduleComp";
import { TableComp } from "./comps/tableComp/tableComp";
import { defaultTableData } from "./comps/tableComp/mockTableComp";
import { ContainerComp, defaultContainerData } from "./comps/containerComp/containerComp";
import { ColumnLayoutComp } from "./comps/columnLayout/columnLayout";
import { TabbedContainerComp } from "./comps/tabs/tabbedContainerComp";
import { ButtonComp } from "./comps/buttonComp/buttonComp";
import { TextComp } from "./comps/textComp";
import { SelectComp } from "./comps/selectInputComp/selectComp";
import { InputComp } from "./comps/textInputComp/inputComp";
import { TextAreaComp } from "./comps/textInputComp/textAreaComp";
import { AutoCompleteComp } from "./comps/autoCompleteComp/autoCompleteComp";
import { AvatarComp } from "./comps/avatar";
import { AvatarGroupComp } from "./comps/avatarGroup";
import { DropdownComp } from "./comps/buttonComp/dropdownComp";
import { FloatButtonComp } from "./comps/buttonComp/floatButtonComp";
import { LinkComp } from "./comps/buttonComp/linkComp";
import { ScannerComp } from "./comps/buttonComp/scannerComp";
import { ToggleButtonComp } from "./comps/buttonComp/toggleButtonComp";
import { CarouselComp } from "./comps/carouselComp";
import { CommentComp } from "./comps/commentComp/commentComp";
import { CardComp } from "./comps/containerComp/cardComp";
import { CustomComp } from "./comps/customComp/customComp";
import { DatePickerComp, DateRangeComp } from "./comps/dateComp/dateComp";
import { TimePickerComp, TimeRangeComp } from "./comps/dateComp/timeComp";
import { DividerComp } from "./comps/dividerComp";
import { FileComp } from "./comps/fileComp/fileComp";
import { FileViewerComp } from "./comps/fileViewerComp";
import { defaultFormData, FormComp } from "./comps/formComp/formComp";
import { IconComp } from "./comps/iconComp";
import { IFrameComp } from "./comps/iframeComp";
import { ImageComp } from "./comps/imageComp";
import { JsonEditorComp } from "./comps/jsonComp/jsonEditorComp";
import { JsonExplorerComp } from "./comps/jsonComp/jsonExplorerComp";
import { JsonLottieComp } from "./comps/jsonComp/jsonLottieComp";
import { JsonSchemaFormComp } from "./comps/jsonSchemaFormComp/jsonSchemaFormComp";
import { ListViewComp, GridComp, defaultListViewData, defaultGridData } from "./comps/listViewComp";
import { AudioComp } from "./comps/mediaComp/audioComp";
import { ColorPickerComp } from "./comps/mediaComp/colorPickerComp";
import { VideoComp } from "./comps/mediaComp/videoComp";
import { ControlButton } from "./comps/meetingComp/controlButton";
import { NavComp } from "./comps/navComp/navComp";
import { NumberInputComp } from "./comps/numberInputComp/numberInputComp";
import { RangeSliderComp } from "./comps/numberInputComp/rangeSliderComp";
import { SliderComp } from "./comps/numberInputComp/sliderComp";
import { defaultPageLayoutData, PageLayoutComp } from "./comps/containerComp/pageLayoutComp";
import { ProgressCircleComp } from "./comps/progressCircleComp";
import { ProgressComp } from "./comps/progressComp";
import { QRCodeComp } from "./comps/qrCodeComp";
import { RatingComp } from "./comps/ratingComp";
import { ResponsiveLayoutComp } from "./comps/responsiveLayout";
import { RichTextEditorComp } from "./comps/richTextEditorComp";
import { CascaderWithDefault } from "./comps/selectInputComp/cascaderComp";
import { CheckboxComp } from "./comps/selectInputComp/checkboxComp";
import { MultiSelectComp } from "./comps/selectInputComp/multiSelectComp";
import { RadioComp } from "./comps/selectInputComp/radioComp";
import { SegmentedControlComp } from "./comps/selectInputComp/segmentedControl";
import { StepComp } from "./comps/selectInputComp/stepControl";
import { ShapeComp } from "./comps/shapeComp/shapeComp";
import { SignatureComp } from "./comps/signatureComp";
import { SplitLayoutComp } from "./comps/splitLayout";
import { SwitchComp } from "./comps/switchComp";
import { MentionComp } from "./comps/textInputComp/mentionComp";
import { PasswordComp } from "./comps/textInputComp/passwordComp";
import { TimeLineComp } from "./comps/timelineComp/timelineComp";
import { TimerComp } from "./comps/timerComp";
import { TourComp } from "./comps/tourComp/tourComp";
import { transferComp } from "./comps/transferComp";
import { TreeComp } from "./comps/treeComp/treeComp";
import { TreeSelectComp } from "./comps/treeComp/treeSelectComp";
import { DrawerComp } from "./hooks/drawerComp";
import { ModalComp } from "./hooks/modalComp";
import { defaultCollapsibleContainerData } from "./comps/containerComp/collapsibleContainerComp";
import { ContainerComp as FloatTextContainerComp } from "./comps/containerComp/textContainerComp";

type Registry = {
  [key in UICompType]?: UICompManifest;
};

const builtInRemoteComps: Omit<RemoteCompInfo, "compName"> = {
  // source: !!REACT_APP_BUNDLE_BUILTIN_PLUGIN ? "bundle" : "npm",
  source: "npm",
  isRemote: true,
  packageName: "lowcoder-comps",
};

export var uiCompMap: Registry = {
  // Dashboards

  // charts
  chart: {
    name: trans("uiComp.chartCompName"),
    enName: "Chart",
    description: trans("uiComp.chartCompDesc"),
    categories: ["legacy"],
    icon: ChartCompIcon,
    comp: remoteComp({ ...builtInRemoteComps, compName: "chart" }),
    keywords: trans("uiComp.chartCompKeywords"),
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },

  basicChart: {
    name: trans("uiComp.basicChartCompName"),
    enName: "Basic Chart",
    description: trans("uiComp.basicChartCompDesc"),
    categories: ["legacy"],
    icon: ChartCompIcon,
    comp: remoteComp({ ...builtInRemoteComps, compName: "basicChart" }),
    keywords: trans("uiComp.basicChartCompKeywords"),
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },

  barChart: {
    name: trans("uiComp.barChartCompName"),
    enName: "Bar Chart",
    description: trans("uiComp.barChartCompDesc"),
    categories: ["dashboards"],
    icon: BarChartCompIcon,
    comp: remoteComp({ ...builtInRemoteComps, compName: "barChart" }),
    keywords: trans("uiComp.barChartCompKeywords"),
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },

  lineChart: {
    name: trans("uiComp.lineChartCompName"),
    enName: "Line Chart",
    description: trans("uiComp.lineChartCompDesc"),
    categories: ["dashboards"],
    icon: LineChartCompIcon,
    comp: remoteComp({ ...builtInRemoteComps, compName: "lineChart" }),
    keywords: trans("uiComp.lineChartCompKeywords"),
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },

  pieChart: {
    name: trans("uiComp.pieChartCompName"),
    enName: "Pie Chart",
    description: trans("uiComp.piehartCompDesc"),
    categories: ["dashboards"],
    icon: PieChartCompIcon,
    comp: remoteComp({ ...builtInRemoteComps, compName: "pieChart" }),
    keywords: trans("uiComp.pieChartCompKeywords"),
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },

  scatterChart: {
    name: trans("uiComp.scatterChartCompName"),
    enName: "Scatter Chart",
    description: trans("uiComp.scatterChartCompDesc"),
    categories: ["dashboards"],
    icon: ScatterChartCompIcon,
    comp: remoteComp({ ...builtInRemoteComps, compName: "scatterChart" }),
    keywords: trans("uiComp.scatterChartCompKeywords"),
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },

  candleStickChart: {
    name: trans("uiComp.candleStickChartCompName"),
    enName: "Candlestick Chart",
    description: trans("uiComp.candleStickChartCompDesc"),
    categories: ["dashboards"],
    icon: CandlestickChartCompIcon,
    keywords: trans("uiComp.candleStickChartCompKeywords"),
    comp: remoteComp({ ...builtInRemoteComps, compName: "candleStickChart" }),
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },
  funnelChart: {
    name: trans("uiComp.funnelChartCompName"),
    enName: "Sankey Chart",
    description: trans("uiComp.funnelChartCompDesc"),
    categories: ["dashboards"],
    icon: FunnelChartCompIcon,
    keywords: trans("uiComp.funnelChartCompKeywords"),
    comp: remoteComp({ ...builtInRemoteComps, compName: "funnelChart" }),
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },
  gaugeChart: {
    name: trans("uiComp.gaugeChartCompName"),
    enName: "Candlestick Chart",
    description: trans("uiComp.gaugeChartCompDesc"),
    categories: ["dashboards"],
    icon: GaugeChartCompIcon,
    keywords: trans("uiComp.gaugeChartCompKeywords"),
    comp: remoteComp({ ...builtInRemoteComps, compName: "gaugeChart" }),
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },
  graphChart: {
    name: trans("uiComp.graphChartCompName"),
    enName: "Graph Chart",
    description: trans("uiComp.graphChartCompDesc"),
    categories: ["dashboards"],
    icon: GraphChartCompIcon,
    keywords: trans("uiComp.graphChartCompKeywords"),
    comp: remoteComp({ ...builtInRemoteComps, compName: "graphChart" }),
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },
  heatmapChart: {
    name: trans("uiComp.heatmapChartCompName"),
    enName: "Heatmap Chart",
    description: trans("uiComp.heatmapChartCompDesc"),
    categories: ["dashboards"],
    icon: HeatmapChartCompIcon,
    keywords: trans("uiComp.heatmapChartCompKeywords"),
    comp: remoteComp({ ...builtInRemoteComps, compName: "heatmapChart" }),
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },
  radarChart: {
    name: trans("uiComp.radarChartCompName"),
    enName: "Radar Chart",
    description: trans("uiComp.radarChartCompDesc"),
    categories: ["dashboards"],
    icon: RadarChartCompIcon,
    keywords: trans("uiComp.radarChartCompKeywords"),
    comp: remoteComp({ ...builtInRemoteComps, compName: "radarChart" }),
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },
  sankeyChart: {
    name: trans("uiComp.sankeyChartCompName"),
    enName: "Sankey Chart",
    description: trans("uiComp.sankeyChartCompDesc"),
    categories: ["dashboards"],
    icon: SankeyChartCompIcon,
    keywords: trans("uiComp.sankeyChartCompKeywords"),
    comp: remoteComp({ ...builtInRemoteComps, compName: "sankeyChart" }),
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },
  sunburstChart: {
    name: trans("uiComp.sunburstChartCompName"),
    enName: "Sunburst Chart",
    description: trans("uiComp.sunburstChartCompDesc"),
    categories: ["dashboards"],
    icon: SunburstChartCompIcon,
    keywords: trans("uiComp.sunburstChartCompKeywords"),
    comp: remoteComp({ ...builtInRemoteComps, compName: "sunburstChart" }),
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },
  themeriverChart: {
    name: trans("uiComp.themeriverChartCompName"),
    enName: "Theme River Chart",
    description: trans("uiComp.themeriverChartCompDesc"),
    categories: ["dashboards"],
    icon: ThemeriverChartCompIcon,
    keywords: trans("uiComp.themeriverChartCompKeywords"),
    comp: remoteComp({ ...builtInRemoteComps, compName: "themeriverChart" }),
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },
  treeChart: {
    name: trans("uiComp.treeChartCompName"),
    enName: "Tree Chart",
    description: trans("uiComp.treeChartCompDesc"),
    categories: ["dashboards"],
    icon: TreeChartCompIcon,
    keywords: trans("uiComp.treeChartCompKeywords"),
    comp: remoteComp({ ...builtInRemoteComps, compName: "treeChart" }),
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },
  treemapChart: {
    name: trans("uiComp.treemapChartCompName"),
    enName: "Treemap Chart",
    description: trans("uiComp.treemapChartCompDesc"),
    categories: ["dashboards"],
    icon: TreemapChartCompIcon,
    keywords: trans("uiComp.treemapChartCompKeywords"),
    comp: remoteComp({ ...builtInRemoteComps, compName: "treemapChart" }),
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },

  // GeoMap

  openLayersGeoMap: {
    name: trans("uiComp.openLayersGeoMapCompName"),
    enName: "OpenLayersGeoMap",
    description: trans("uiComp.openLayersGeoMapCompDesc"),
    categories: ["dashboards"],
    icon: GeoMapLayersCompIcon,
    keywords: trans("uiComp.openLayersGeoMapCompKeywords"),
    comp: remoteComp({
      compName: "geo",
      packageName: "lowcoder-comp-geo",
      source: "npm",
      isRemote: true,
    }),
    compName: "lowcoder-comp-geo",
    layoutInfo: {
      w: 12,
      h: 50,
    },
  },
  chartsGeoMap: {
    name: trans("uiComp.chartsGeoMapCompName"),
    enName: "GeoMap",
    description: trans("uiComp.chartsGeoMapCompDesc"),
    categories: ["dashboards"],
    icon: GeoMapChartsCompIcon,
    keywords: trans("uiComp.chartsGeoMapCompKeywords"),
    comp: remoteComp({ ...builtInRemoteComps, compName: "chartsGeoMap" }),
    layoutInfo: {
      w: 19,
      h: 60,
    },
  },

  table: {
    name: trans("uiComp.tableCompName"),
    enName: "Table",
    description: trans("uiComp.tableCompDesc"),
    categories: ["dashboards", "projectmanagement"],
    icon: TableCompIcon,
    keywords: trans("uiComp.tableCompKeywords"),
    comp: TableComp,
    layoutInfo: {
      w: 12,
      h: 40,
    },
    withoutLoading: true,
    defaultDataFn: defaultTableData,
  },

  pivotTable: {
    name: trans("uiComp.pivotTableCompName"),
    enName: "pivotTable",
    description: trans("uiComp.pivotTableCompDesc"),
    categories: ["dashboards"],
    icon: PivotTableCompIcon,
    keywords: trans("uiComp.pivotTableCompKeywords"),
    comp: remoteComp({
      compName: "pivottable",
      packageName: "lowcoder-comp-reactpivottable",
      source: "npm",
      isRemote: true,
    }),
    compName: "lowcoder-comp-reactpivottable",
    layoutInfo: {
      w: 12,
      h: 50,
    },
  },

  mermaid: {
    name: trans("uiComp.mermaidCompName"),
    enName: "Mermaid Charts",
    comp: remoteComp({ ...builtInRemoteComps, compName: "mermaid" }),
    description: trans("uiComp.mermaidCompDesc"),
    categories: ["dashboards"],
    icon: MermaidCompIcon,
    keywords: trans("uiComp.mermaidCompKeywords"),
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },
  timeline: {
    name: trans("uiComp.timelineCompName"),
    enName: "timeline",
    description: trans("uiComp.timelineCompDesc"),
    categories: ["dashboards"],
    icon: TimeLineCompIcon,
    keywords: trans("uiComp.timelineCompKeywords"),
    comp: TimeLineComp,
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },

  // Layout

  responsiveLayout: {
    name: trans("uiComp.responsiveLayoutCompName"),
    enName: "Responsive Layout",
    description: trans("uiComp.responsiveLayoutCompDesc"),
    categories: ["layout"],
    icon: ResponsiveLayoutCompIcon,
    keywords: trans("uiComp.responsiveLayoutCompKeywords"),
    comp: ResponsiveLayoutComp,
    withoutLoading: true,
    layoutInfo: {
      w: 24,
      h: 25,
      delayCollision: true,
    },
  },
  pageLayout: {
    name: trans("uiComp.pageLayoutCompName"),
    enName: "Page Layout Container",
    description: trans("uiComp.pageLayoutCompDesc"),
    categories: ["layout"],
    icon: PageLayoutCompIcon,
    keywords: trans("uiComp.pageLayoutCompKeywords"),
    comp: PageLayoutComp,
    withoutLoading: true,
    layoutInfo: {
      w: 12,
      h: 50,
      // static: true,
      delayCollision: true,
    },
    defaultDataFn: defaultPageLayoutData,
  },
  columnLayout: {
    name: "Column Layout",
    enName: "Column Layout",
    description: trans("uiComp.responsiveLayoutCompDesc"),
    categories: ["layout"],
    icon: ColumnLayoutCompIcon,
    keywords: trans("uiComp.responsiveLayoutCompKeywords"),
    comp: ColumnLayoutComp,
    withoutLoading: true,
    layoutInfo: {
      w: 24,
      h: 25,
      delayCollision: true,
    },
  },
  splitLayout: {
    name: trans("uiComp.splitLayoutCompName"),
    enName: "Split Layout",
    description: trans("uiComp.splitLayoutCompDesc"),
    categories: ["layout"],
    icon: SplitLayoutCompIcon,
    keywords: trans("uiComp.splitLayoutCompKeywords"),
    comp: SplitLayoutComp,
    withoutLoading: true,
    layoutInfo: {
      w: 24,
      h: 25,
      delayCollision: true,
    },
  },
  floatTextContainer: {
    name: trans("uiComp.floatTextContainerCompName"),
    enName: "Container",
    description: trans("uiComp.floatTextContainerCompDesc"),
    categories: ["layout"],
    icon: FloatingTextCompIcon,
    keywords: trans("uiComp.floatTextContainerCompKeywords"),
    comp: FloatTextContainerComp,
    withoutLoading: true,
    layoutInfo: {
      w: 12,
      h: 25,
      // static: true,
      delayCollision: true,
    },
    defaultDataFn: defaultContainerData,
  },
  card: {
    name: trans("uiComp.cardCompName"),
    enName: "card",
    icon: CardCompIcon,
    description: trans("uiComp.cardCompDesc"),
    categories: ["layout"],
    keywords: trans("uiComp.cardCompKeywords"),
    comp: CardComp,
    layoutInfo: {
      h: 44,
      w: 6,
    },
  },
  tabbedContainer: {
    name: trans("uiComp.tabbedContainerCompName"),
    enName: "Tabbed Container",
    description: trans("uiComp.tabbedContainerCompDesc"),
    categories: ["layout"],
    icon: TabbedContainerCompIcon,
    keywords: trans("uiComp.tabbedContainerCompKeywords"),
    comp: TabbedContainerComp,
    withoutLoading: true,
    layoutInfo: {
      w: 12,
      h: 25,
      // static: true,
      delayCollision: true,
    },
  },
  collapsibleContainer: {
    name: trans("uiComp.collapsibleContainerCompName"),
    enName: "Collapsible Container",
    description: trans("uiComp.collapsibleContainerCompDesc"),
    categories: ["layout"],
    icon: CollapsibleContainerCompIcon,
    keywords: trans("uiComp.collapsibleContainerCompKeywords"),
    comp: ContainerComp,
    withoutLoading: true,
    layoutInfo: {
      w: 12,
      h: 25,
      // static: true,
      delayCollision: true,
    },
    defaultDataFn: defaultCollapsibleContainerData,
  },
  container: {
    name: trans("uiComp.containerCompName"),
    enName: "Container",
    description: trans("uiComp.containerCompDesc"),
    categories: ["layout"],
    icon: ContainerCompIcon,
    keywords: trans("uiComp.containerCompKeywords"),
    comp: ContainerComp,
    withoutLoading: true,
    layoutInfo: {
      w: 12,
      h: 25,
      // static: true,
      delayCollision: true,
    },
    defaultDataFn: defaultContainerData,
  },
  listView: {
    name: trans("uiComp.listViewCompName"),
    enName: "List View",
    icon: ListViewCompIcon,
    description: trans("uiComp.listViewCompDesc"),
    categories: ["layout"],
    keywords: trans("uiComp.listViewCompKeywords"),
    comp: ListViewComp,
    layoutInfo: {
      w: 12,
      h: 40,
      delayCollision: true,
    },
    defaultDataFn: defaultListViewData,
  },
  grid: {
    name: trans("uiComp.gridCompName"),
    enName: "Grid",
    icon: GridCompIcon,
    description: trans("uiComp.gridCompDesc"),
    categories: ["layout"],
    keywords: trans("uiComp.gridCompKeywords"),
    comp: GridComp,
    layoutInfo: {
      w: 12,
      h: 40,
      delayCollision: true,
    },
    defaultDataFn: defaultGridData,
  },
  modal: {
    name: trans("uiComp.modalCompName"),
    enName: "Modal",
    icon: ModalCompIcon,
    description: trans("uiComp.modalCompDesc"),
    categories: ["layout"],
    keywords: trans("uiComp.modalCompKeywords"),
    comp: ModalComp,
    withoutLoading: true,
  },
  drawer: {
    name: trans("uiComp.drawerCompName"),
    enName: "Drawer",
    description: trans("uiComp.drawerCompDesc"),
    categories: ["layout"],
    icon: DrawerCompIcon,
    keywords: trans("uiComp.drawerCompKeywords"),
    comp: DrawerComp,
    withoutLoading: true,
  },
  divider: {
    name: trans("uiComp.dividerCompName"),
    enName: "Divider",
    description: trans("uiComp.dividerCompDesc"),
    categories: ["layout"],
    icon: DividerCompIcon,
    keywords: trans("uiComp.dividerCompKeywords"),
    comp: DividerComp,
    layoutInfo: {
      w: 12,
      h: 1,
    },
  },
  navigation: {
    name: trans("uiComp.navigationCompName"),
    enName: "Navigation",
    description: trans("uiComp.navigationCompDesc"),
    icon: NavComIcon,
    categories: ["layout"],
    keywords: trans("uiComp.navigationCompKeywords"),
    comp: NavComp,
    layoutInfo: {
      w: 24,
      h: 5,
    },
  },
  step: {
    name: trans("uiComp.stepControlCompName"),
    enName: "Steps Control",
    description: trans("uiComp.stepControlCompDesc"),
    categories: ["layout"],
    icon: StepCompIcon,
    keywords: trans("uiComp.stepControlCompKeywords"),
    comp: StepComp,
    layoutInfo: {
      w: 19,
      h: 6,
    },
  },
  cascader: {
    name: trans("uiComp.cascaderCompName"),
    enName: "Cascader",
    description: trans("uiComp.cascaderCompDesc"),
    categories: ["layout"],
    icon: CascaderCompIcon,
    keywords: trans("uiComp.cascaderCompKeywords"),
    comp: CascaderWithDefault,
    layoutInfo: {
      w: 9,
      h: 5,
    },
  },
  link: {
    name: trans("uiComp.linkCompName"),
    enName: "Link",
    description: trans("uiComp.linkCompDesc"),
    categories: ["layout"],
    icon: LinkCompIcon,
    keywords: trans("uiComp.linkCompKeywords"),
    comp: LinkComp,
    layoutInfo: {
      w: 6,
      h: 5,
    },
  },
  floatingButton: {
    name: trans("uiComp.floatButtonCompName"),
    enName: "floatingButton",
    description: trans("uiComp.floatButtonCompDesc"),
    categories: ["layout"],
    icon: FloatingButtonCompIcon,
    keywords: trans("uiComp.floatButtonCompKeywords"),
    comp: FloatButtonComp,
    layoutInfo: {
      w: 1,
      h: 1,
    },
    withoutLoading: true,
  },

  // Scheduling

  calendar: {
    name: trans("uiComp.calendarCompName"),
    enName: "Calendar",
    description: trans("uiComp.calendarCompDesc"),
    categories: ["scheduling", "projectmanagement"],
    icon: CalendarCompIcon,
    keywords: trans("uiComp.calendarCompKeywords"),
    comp: remoteComp({ ...builtInRemoteComps, compName: "calendar" }),
    layoutInfo: {
      w: 19,
      h: 60,
    },
  },
  timer: {
    name: trans("uiComp.timerCompName"),
    enName: "timer",
    icon: TimerCompIcon,
    description: trans("uiComp.timerCompDesc"),
    categories: ["scheduling", "projectmanagement"],
    keywords: trans("uiComp.timerCompKeywords"),
    comp: TimerComp,
    layoutInfo: {
      h: 14,
      w: 6,
    },
  },

  // Meeting & Collaboration

  sharingcomponent: {
    name: trans("meeting.sharingCompName"),
    enName: "Sharing",
    description: trans("meeting.sharingCompName"),
    categories: ["collaboration"],
    icon: VideoScreenshareCompIcon,
    keywords: trans("meeting.meetingCompKeywords"),
    comp: remoteComp({ ...builtInRemoteComps, compName: "meetingSharing" }),
    withoutLoading: true,
    layoutInfo: {
      w: 12,
      h: 50,
    },
  },
  videocomponent: {
    name: trans("meeting.videoCompName"),
    enName: "Video",
    description: trans("meeting.videoCompName"),
    categories: ["collaboration"],
    icon: VideoCameraStreamCompIcon,
    keywords: trans("meeting.meetingCompKeywords"),
    comp: remoteComp({ ...builtInRemoteComps, compName: "meetingStream" }),
    withoutLoading: true,
    layoutInfo: {
      w: 6,
      h: 32,
    },
  },
  meeting: {
    name: trans("meeting.meetingCompName"),
    enName: "Drawer",
    comp: remoteComp({ ...builtInRemoteComps, compName: "meetingController" }),
    description: trans("meeting.meetingCompDesc"),
    categories: ["collaboration"],
    icon: VideoMeetingRoomCompIcon,
    keywords: trans("meeting.meetingCompKeywords"),
    withoutLoading: true,
  },

  // added by Mousheng
  avatar: {
    name: trans("uiComp.avatarCompName"),
    enName: "avatar",
    description: trans("uiComp.avatarCompDesc"),
    categories: ["collaboration"],
    icon: AvatarCompIcon,
    keywords: trans("uiComp.avatarCompKeywords"),
    comp: AvatarComp,
    layoutInfo: {
      w: 6,
      h: 6,
    },
  },

  avatarGroup: {
    name: trans("uiComp.avatarGroupCompName"),
    enName: "avatarGroup",
    icon: AvatarGroupCompIcon,
    description: trans("uiComp.avatarGroupCompDesc"),
    categories: ["collaboration"],
    keywords: trans("uiComp.avatarGroupCompKeywords"),
    comp: AvatarGroupComp,
    withoutLoading: true,
    layoutInfo: {
      w: 6,
      h: 6,
    },
  },

  comment: {
    name: trans("uiComp.commentCompName"),
    enName: "comment",
    description: trans("uiComp.commentCompDesc"),
    categories: ["collaboration"],
    icon: CommentCompIcon,
    keywords: trans("uiComp.commentCompKeywords"),
    comp: CommentComp,
    layoutInfo: {
      w: 12,
      h: 55,
    },
  },
  mention: {
    name: trans("uiComp.mentionCompName"),
    enName: "mention",
    description: trans("uiComp.mentionCompDesc"),
    categories: ["collaboration"],
    icon: MentionCompIcon,
    keywords: trans("uiComp.mentionCompKeywords"),
    comp: MentionComp,
  },

  // Forms

  form: {
    name: trans("uiComp.formCompName"),
    enName: "Form",
    description: trans("uiComp.formCompDesc"),
    categories: ["forms"],
    icon: FormCompIcon,
    keywords: trans("uiComp.formCompKeywords"),
    comp: FormComp,
    withoutLoading: true,
    layoutInfo: {
      w: 12,
      h: 50,
      // static: true,
      delayCollision: true,
    },
    defaultDataFn: defaultFormData,
  },
  jsonSchemaForm: {
    name: trans("uiComp.jsonSchemaFormCompName"),
    enName: "JSON Schema Form",
    description: trans("uiComp.jsonSchemaFormCompDesc"),
    categories: ["forms"],
    icon: JsonFormCompIcon,
    keywords: trans("uiComp.jsonSchemaFormCompKeywords"),
    comp: JsonSchemaFormComp,
    layoutInfo: {
      w: 12,
      h: 50,
    },
  },
  jsonEditor: {
    name: trans("uiComp.jsonEditorCompName"),
    enName: "JSON Editor",
    description: trans("uiComp.jsonEditorCompDesc"),
    categories: ["forms"],
    icon: JsonEditorCompIcon,
    keywords: trans("uiComp.jsonEditorCompKeywords"),
    comp: JsonEditorComp,
    layoutInfo: {
      w: 12,
      h: 50,
    },
  },
  jsonExplorer: {
    name: trans("uiComp.jsonExplorerCompName"),
    enName: "JSON Explorer",
    description: trans("uiComp.jsonExplorerCompDesc"),
    categories: ["forms"],
    icon: JsonExplorerCompIcon,
    keywords: trans("uiComp.jsonExplorerCompKeywords"),
    comp: JsonExplorerComp,
    layoutInfo: {
      w: 12,
      h: 50,
    },
  },
  richTextEditor: {
    name: trans("uiComp.richTextEditorCompName"),
    enName: "Rich Text Editor",
    categories: ["forms"],
    description: trans("uiComp.richTextEditorCompDesc"),
    icon: RichTextEditorCompIcon,
    keywords: trans("uiComp.richTextEditorCompKeywords"),
    comp: RichTextEditorComp,
    layoutInfo: {
      w: 12,
      h: 50,
    },
  },
  input: {
    name: trans("uiComp.inputCompName"),
    enName: "Input",
    description: trans("uiComp.inputCompDesc"),
    categories: ["forms"],
    icon: InputCompIcon,
    keywords: trans("uiComp.inputCompKeywords"),
    comp: InputComp,
    layoutInfo: {
      w: 6,
      h: 6,
    },
  },
  password: {
    name: trans("uiComp.passwordCompName"),
    enName: "Password",
    description: trans("uiComp.passwordCompDesc"),
    categories: ["forms"],
    icon: PasswordCompIcon,
    keywords: trans("uiComp.passwordCompKeywords"),
    comp: PasswordComp,
    layoutInfo: {
      w: 6,
      h: 6,
    },
  },
  numberInput: {
    name: trans("uiComp.numberInputCompName"),
    enName: "Number Input",
    description: trans("uiComp.numberInputCompDesc"),
    categories: ["forms"],
    icon: NumberInputCompIcon,
    keywords: trans("uiComp.numberInputCompKeywords"),
    comp: NumberInputComp,
    layoutInfo: {
      w: 6,
      h: 6,
    },
  },
  textArea: {
    name: trans("uiComp.textAreaCompName"),
    enName: "Text Area",
    description: trans("uiComp.textAreaCompDesc"),
    categories: ["forms"],
    icon: TextAreaCompIcon,
    keywords: trans("uiComp.textAreaCompKeywords"),
    comp: TextAreaComp,
    layoutInfo: {
      w: 6,
      h: 12,
    },
  },
  autocomplete: {
    name: trans("uiComp.autoCompleteCompName"),
    enName: "autoComplete",
    description: trans("uiComp.autoCompleteCompDesc"),
    categories: ["forms"],
    icon: AutoCompleteCompIcon,
    keywords: cnchar
      .spell(trans("uiComp.autoCompleteCompName"), "first", "low")
      .toString(),
    comp: AutoCompleteComp,
    //   lazyLoad: true,
    // compName: "AutoCompleteComp",
    // compPath: "comps/autoCompleteComp/autoCompleteComp",
    layoutInfo: {
      w: 6,
      h: 5,
    },
  },
  switch: {
    name: trans("uiComp.switchCompName"),
    enName: "Switch",
    description: trans("uiComp.switchCompDesc"),
    categories: ["forms"],
    icon: SwitchCompIcon,
    keywords: trans("uiComp.switchCompKeywords"),
    comp: SwitchComp,
    layoutInfo: {
      w: 6,
      h: 6,
    },
  },
  checkbox: {
    name: trans("uiComp.checkboxCompName"),
    enName: "Checkbox",
    description: trans("uiComp.checkboxCompDesc"),
    categories: ["forms"],
    icon: CheckboxCompIcon,
    keywords: trans("uiComp.checkboxCompKeywords"),
    comp: CheckboxComp,
    layoutInfo: {
      w: 6,
      h: 6,
    },
  },
  radio: {
    name: trans("uiComp.radioCompName"),
    enName: "Radio",
    description: trans("uiComp.radioCompDesc"),
    categories: ["forms"],
    icon: RadioCompIcon,
    keywords: trans("uiComp.radioCompKeywords"),
    comp: RadioComp,
    layoutInfo: {
      w: 6,
      h: 6,
    },
  },
  date: {
    name: trans("uiComp.dateCompName"),
    enName: "Date",
    description: trans("uiComp.dateCompDesc"),
    categories: ["forms", "scheduling"],
    icon: DateCompIcon,
    keywords: trans("uiComp.dateCompKeywords"),
    comp: DatePickerComp,
    layoutInfo: {
      w: 6,
      h: 6,
    },
  },
  dateRange: {
    name: trans("uiComp.dateRangeCompName"),
    enName: "Date Range",
    description: trans("uiComp.dateRangeCompDesc"),
    categories: ["forms", "scheduling"],
    icon: DateRangeCompIcon,
    keywords: trans("uiComp.dateRangeCompKeywords"),
    comp: DateRangeComp,
    layoutInfo: {
      w: 12,
      h: 6,
    },
  },
  time: {
    name: trans("uiComp.timeCompName"),
    enName: "Time",
    description: trans("uiComp.timeCompDesc"),
    categories: ["forms", "scheduling"],
    icon: TimeCompIcon,
    keywords: trans("uiComp.timeCompKeywords"),
    comp: TimePickerComp,
    layoutInfo: {
      w: 6,
      h: 6,
    },
  },
  timeRange: {
    name: trans("uiComp.timeRangeCompName"),
    enName: "Time Range",
    categories: ["forms", "scheduling"],
    description: trans("uiComp.timeRangeCompDesc"),
    icon: TimeRangeCompIcon,
    keywords: trans("uiComp.timeRangeCompKeywords"),
    comp: TimeRangeComp,
    layoutInfo: {
      w: 12,
      h: 6,
    },
  },

  slider: {
    name: trans("uiComp.sliderCompName"),
    enName: "Slider",
    description: trans("uiComp.sliderCompDesc"),
    categories: ["forms"],
    icon: SliderCompIcon,
    keywords: trans("uiComp.sliderCompKeywords"),
    comp: SliderComp,
    layoutInfo: {
      w: 6,
      h: 5,
    },
  },
  rangeSlider: {
    name: trans("uiComp.rangeSliderCompName"),
    enName: "Range Slider",
    description: trans("uiComp.rangeSliderCompDesc"),
    categories: ["forms"],
    icon: RangeSliderCompIcon,
    keywords: trans("uiComp.rangeSliderCompKeywords"),
    comp: RangeSliderComp,
    layoutInfo: {
      w: 6,
      h: 5,
    },
  },

  button: {
    name: trans("uiComp.buttonCompName"),
    enName: "Button",
    description: trans("uiComp.buttonCompDesc"),
    categories: ["forms"],
    icon: ButtonCompIcon,
    keywords: trans("uiComp.buttonCompKeywords"),
    comp: ButtonComp,
    layoutInfo: {
      w: 6,
      h: 6,
    },
    withoutLoading: true,
  },
  controlButton: {
    name: trans("uiComp.meetingControlCompName"),
    enName: "Controls",
    description: trans("uiComp.meetingCompDesc"),
    categories: ["forms", "collaboration"],
    icon: IconButtonCompIcon,
    keywords: trans("uiComp.meetingCompKeywords"),
    comp: ControlButton,
    withoutLoading: true,
    layoutInfo: {
      w: 3,
      h: 6,
    },
  },
  dropdown: {
    name: trans("uiComp.dropdownCompName"),
    enName: "Dropdown",
    description: trans("uiComp.dropdownCompDesc"),
    categories: ["forms"],
    icon: DropdownCompIcon,
    keywords: trans("uiComp.dropdownCompKeywords"),
    comp: DropdownComp,
    layoutInfo: {
      w: 6,
      h: 6,
    },
  },
  toggleButton: {
    name: trans("uiComp.toggleButtonCompName"),
    enName: "Toggle Button",
    description: trans("uiComp.toggleButtonCompDesc"),
    categories: ["forms"],
    icon: ToggleButtonCompIcon,
    keywords: trans("uiComp.toggleButtonCompKeywords"),
    comp: ToggleButtonComp,
    layoutInfo: {
      w: 3,
      h: 6,
    },
  },
  segmentedControl: {
    name: trans("uiComp.segmentedControlCompName"),
    enName: "Segmented Control",
    description: trans("uiComp.segmentedControlCompDesc"),
    categories: ["forms"],
    icon: SegmentedCompIcon,
    keywords: trans("uiComp.segmentedControlCompKeywords"),
    comp: SegmentedControlComp,
    layoutInfo: {
      w: 6,
      h: 6,
    },
  },

  rating: {
    name: trans("uiComp.ratingCompName"),
    enName: "Rating",
    description: trans("uiComp.ratingCompDesc"),
    categories: ["forms"],
    icon: RatingCompIcon,
    keywords: trans("uiComp.ratingCompKeywords"),
    comp: RatingComp,
    layoutInfo: {
      w: 6,
      h: 6,
    },
  },

  // Project Management

  ganttChart: {
    name: trans("uiComp.ganttChartCompName"),
    enName: "ganttChart",
    description: trans("uiComp.ganttChartCompDesc"),
    categories: ["projectmanagement"],
    icon: GanttCompIcon,
    keywords: trans("uiComp.ganttChartCompKeywords"),
    comp: remoteComp({
      compName: "ganttchart",
      packageName: "lowcoder-comp-gantt-chart",
      source: "npm",
      isRemote: true,
    }),
    compName: "lowcoder-comp-gantt-chart",
    layoutInfo: {
      w: 20,
      h: 60,
    },
  },

  kanban: {
    name: trans("uiComp.kanbanCompName"),
    enName: "Kanban",
    description: trans("uiComp.kanbanCompDesc"),
    categories: ["projectmanagement"],
    icon: KanbanCompIcon,
    keywords: trans("uiComp.kanbanCompKeywords"),
    comp: remoteComp({
      compName: "kanban",
      packageName: "lowcoder-comp-kanban",
      source: "npm",
      isRemote: true,
    }),
    compName: "lowcoder-comp-kanban",
    layoutInfo: {
      w: 20,
      h: 60,
    },
  },

  hillchart: {
    name: trans("uiComp.hillchartCompName"),
    enName: "Hillchart",
    description: trans("uiComp.hillchartCompDesc"),
    categories: ["projectmanagement"],
    icon: HillchartCompIcon,
    keywords: trans("uiComp.hillchartCompKeywords"),
    comp: remoteComp({
      compName: "hillcharts",
      packageName: "lowcoder-comp-hillcharts",
      source: "npm",
      isRemote: true,
    }),
    compName: "lowcoder-comp-hillcharts",
    layoutInfo: {
      w: 12,
      h: 50,
    },
  },
  bpmnEditor: {
    name: trans("uiComp.bpmnEditorCompName"),
    enName: "BPMN Editor",
    description: trans("uiComp.bpmnEditorCompDesc"),
    categories: ["projectmanagement", "documents"],
    icon: BPMNEditorCompIcon,
    keywords: trans("uiComp.bpmnEditorCompKeywords"),
    comp: remoteComp({
      compName: "bpmn",
      packageName: "lowcoder-comp-bpmn-io",
      source: "npm",
      isRemote: true,
    }),
    compName: "lowcoder-comp-bpmn-io",
    layoutInfo: {
      w: 19,
      h: 60,
    },
  },
  progress: {
    name: trans("uiComp.progressCompName"),
    enName: "Progress",
    description: trans("uiComp.progressCompDesc"),
    categories: ["dashboards", "projectmanagement"],
    icon: ProgressCompIcon,
    keywords: trans("uiComp.progressCompKeywords"),
    comp: ProgressComp,
    layoutInfo: {
      w: 6,
      h: 5,
    },
  },
  progressCircle: {
    name: trans("uiComp.progressCircleCompName"),
    enName: "Process Circle",
    description: trans("uiComp.progressCircleCompDesc"),
    categories: ["dashboards", "projectmanagement"],
    icon: ProcessCircleCompIcon,
    keywords: trans("uiComp.progressCircleCompKeywords"),
    comp: ProgressCircleComp,
    layoutInfo: {
      w: 6,
      h: 20,
    },
  },

  // Document handling

  file: {
    name: trans("uiComp.fileUploadCompName"),
    enName: "File Upload",
    description: trans("uiComp.fileUploadCompDesc"),
    categories: ["documents"],
    icon: UploadCompIcon,
    keywords: trans("uiComp.fileUploadCompKeywords"),
    comp: FileComp,
    layoutInfo: {
      w: 6,
      h: 5,
    },
  },
  fileViewer: {
    name: trans("uiComp.fileViewerCompName"),
    enName: "File Viewer",
    description: trans("uiComp.fileViewerCompDesc"),
    categories: ["documents"],
    icon: FileViewerCompIcon,
    keywords: trans("uiComp.fileViewerCompKeywords"),
    comp: FileViewerComp,
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },

  // Multimedia

  image: {
    name: trans("uiComp.imageCompName"),
    enName: "Image",
    description: trans("uiComp.imageCompDesc"),
    categories: ["multimedia"],
    icon: ImageCompIcon,
    keywords: trans("uiComp.imageCompKeywords"),
    comp: ImageComp,
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },
  carousel: {
    name: trans("uiComp.carouselCompName"),
    enName: "Carousel",
    description: trans("uiComp.carouselCompDesc"),
    categories: ["multimedia"],
    icon: CarouselCompIcon,
    keywords: trans("uiComp.drawerCompKeywords"),
    comp: CarouselComp,
    withoutLoading: true,
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },
  audio: {
    name: trans("uiComp.audioCompName"),
    enName: "Audio",
    description: trans("uiComp.audioCompDesc"),
    categories: ["multimedia"],
    icon: AudioCompIcon,
    keywords: trans("uiComp.audioCompKeywords"),
    comp: AudioComp,
    layoutInfo: {
      w: 6,
      h: 5,
    },
  },
  video: {
    name: trans("uiComp.videoCompName"),
    enName: "Video",
    description: trans("uiComp.videoCompDesc"),
    categories: ["multimedia"],
    icon: VideoCompIcon,
    keywords: trans("uiComp.videoCompKeywords"),
    comp: VideoComp,
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },

  shape: {
    name: trans("uiComp.shapeCompName"),
    enName: "Shape",
    description: trans("uiComp.shapeCompDesc"),
    categories: ["multimedia", "dashboards"],
    icon: ShapesCompIcon,
    keywords: trans("uiComp.shapeCompKeywords"),
    comp: ShapeComp,
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },

  jsonLottie: {
    name: trans("uiComp.jsonLottieCompName"),
    enName: "Lottie Animation",
    description: trans("uiComp.jsonLottieCompDesc"),
    categories: ["multimedia"],
    icon: LottieAnimationCompIcon,
    keywords: trans("uiComp.jsonLottieCompKeywords"),
    comp: JsonLottieComp,
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },
  icon: {
    name: trans("uiComp.iconCompName"),
    enName: "icon",
    description: trans("uiComp.iconCompDesc"),
    categories: ["multimedia"],
    icon: IconCompIcon,
    keywords: trans("uiComp.iconCompKeywords"),
    comp: IconComp,
    layoutInfo: {
      w: 2,
      h: 10,
    },
  },
  imageEditor: {
    name: trans("uiComp.imageEditorCompName"),
    enName: "Image Editor",
    comp: remoteComp({ ...builtInRemoteComps, compName: "imageEditor" }),
    description: trans("uiComp.imageEditorCompDesc"),
    categories: ["multimedia"],
    icon: ImageEditorCompIcon,
    keywords: trans("uiComp.imageEditorCompKeywords"),
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },

  // added by Mousheng
  colorPicker: {
    name: trans("uiComp.colorPickerCompName"),
    enName: "colorPicker",
    description: trans("uiComp.colorPickerCompDesc"),
    categories: ["multimedia"],
    icon: ColorPickerCompIcon,
    keywords: trans("uiComp.colorPickerCompKeywords"),
    comp: ColorPickerComp,
  },

  // item Handling

  qrCode: {
    name: trans("uiComp.qrCodeCompName"),
    enName: "QR Code",
    description: trans("uiComp.qrCodeCompDesc"),
    categories: ["itemHandling", "documents"],
    icon: QRCodeCompIcon,
    keywords: trans("uiComp.qrCodeCompKeywords"),
    comp: QRCodeComp,
    layoutInfo: {
      w: 6,
      h: 32,
    },
  },
  scanner: {
    name: trans("uiComp.scannerCompName"),
    enName: "Scanner",
    description: trans("uiComp.scannerCompDesc"),
    categories: ["itemHandling"],
    icon: ScannerCompIcon,
    keywords: trans("uiComp.scannerCompKeywords"),
    comp: ScannerComp,
    layoutInfo: {
      w: 6,
      h: 5,
    },
  },
  signature: {
    name: trans("uiComp.signatureCompName"),
    enName: "Signature",
    description: trans("uiComp.signatureCompDesc"),
    categories: ["itemHandling"],
    icon: SignatureCompIcon,
    keywords: trans("uiComp.signatureCompKeywords"),
    comp: SignatureComp,
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },
  select: {
    name: trans("uiComp.selectCompName"),
    enName: "Select",
    description: trans("uiComp.selectCompDesc"),
    categories: ["forms", "itemHandling"],
    icon: SelectCompIcon,
    keywords: trans("uiComp.selectCompKeywords"),
    comp: SelectComp,
    layoutInfo: {
      w: 6,
      h: 5,
    },
  },
  tour: {
    name: trans("uiComp.tourCompName"),
    enName: "Tour",
    description: trans("uiComp.tourCompDesc"),
    categories: ["multimedia", "itemHandling"],
    icon: TourCompIcon,
    keywords: trans("uiComp.tourCompKeywords"),
    comp: TourComp,
    layoutInfo: {
      w: 1,
      h: 1,
    },
  },
  multiSelect: {
    name: trans("uiComp.multiSelectCompName"),
    enName: "Multiselect",
    description: trans("uiComp.multiSelectCompDesc"),
    categories: ["forms", "itemHandling"],
    icon: MultiSelectCompIcon,
    keywords: trans("uiComp.multiSelectCompKeywords"),
    comp: MultiSelectComp,
    layoutInfo: {
      w: 6,
      h: 5,
    },
  },
  tree: {
    name: trans("uiComp.treeCompName"),
    enName: "Tree",
    description: trans("uiComp.treeCompDesc"),
    categories: ["layout", "itemHandling", "documents"],
    icon: TreeDisplayCompIcon,
    keywords: trans("uiComp.treeCompKeywords"),
    comp: TreeComp,
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },
  treeSelect: {
    name: trans("uiComp.treeSelectCompName"),
    enName: "Tree Select",
    description: trans("uiComp.treeSelectCompDesc"),
    categories: ["layout", "itemHandling", "documents"],
    icon: TreeSelectCompIcon,
    keywords: trans("uiComp.treeSelectCompKeywords"),
    comp: TreeSelectComp,
    layoutInfo: {
      w: 12,
      h: 5,
    },
  },
  transfer: {
    name: trans("uiComp.transferName"),
    enName: "transfer",
    icon: TransferCompIcon,
    description: trans("uiComp.transferDesc"),
    categories: ["itemHandling", "documents"],
    keywords: trans("uiComp.transferKeywords"),
    comp: transferComp,
    layoutInfo: {
      w: 12,
      h: 50,
    },
  },
  turnstileCaptcha: {
    name: trans("uiComp.turnstileCaptchaCompName"),
    enName: "Cloudflare Turnstile",
    description: trans("uiComp.turnstileCaptchaCompDesc"),
    categories: ["itemHandling"],
    icon: TurnstileCaptchaCompIcon,
    keywords: trans("uiComp.turnstileCaptchaCompKeywords"),
    comp: remoteComp({
      compName: "cloudflareTurnstile",
      packageName: "lowcoder-comp-cf-turnstile",
      source: "npm",
      isRemote: true,
    }),
    compName: "lowcoder-comp-cf-turnstile",
    layoutInfo: {
      w: 8,
      h: 20,
    },
  },

  // Integration

  iframe: {
    name: trans("uiComp.iframeCompName"),
    enName: "IFrame",
    description: trans("uiComp.iframeCompDesc"),
    icon: IFrameCompIcon,
    categories: ["integration"],
    keywords: trans("uiComp.iframeCompKeywords"),
    comp: IFrameComp,
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },
  custom: {
    name: trans("uiComp.customCompName"),
    enName: "Custom Component",
    description: trans("uiComp.customCompDesc"),
    icon: CustomCompIcon,
    categories: ["integration"],
    keywords: trans("uiComp.customCompKeywords"),
    comp: CustomComp,
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },
  module: {
    name: trans("uiComp.moduleCompName"),
    enName: "Module",
    icon: CustomCompIcon,
    description: trans("uiComp.moduleCompDesc"),
    categories: [],
    keywords: trans("uiComp.moduleCompKeywords"),
    comp: ModuleComp,
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },

  // mixed

  text: {
    name: trans("uiComp.textCompName"),
    enName: "Text",
    description: trans("uiComp.textCompDesc"),
    categories: ["dashboards", "layout", "multimedia"],
    icon: TextCompIcon,
    keywords: trans("uiComp.textCompKeywords"),
    comp: TextComp,
    layoutInfo: {
      w: 6,
      h: 24,
    },
  },
};

export function loadComps() {
  if (!uiCompMap) return;
  const entries = Object.entries(uiCompMap);
  for (const [compType, manifest] of entries) {
    registerComp(compType as UICompType, manifest);
  }
}
