// This file is only used in unit tests //

import "comps/comps/layout/navLayout";
import "comps/comps/layout/mobileTabLayout";
import cnchar from "cnchar";
import { ModalComp } from "comps/hooks/modalComp";
import { ButtonComp } from "./comps/buttonComp/buttonComp";
import { DropdownComp } from "./comps/buttonComp/dropdownComp";
import { LinkComp } from "./comps/buttonComp/linkComp";
import {
  ContainerComp,
  defaultContainerData,
} from "./comps/containerComp/containerComp";
import { CustomComp } from "./comps/customComp/customComp";
import { DatePickerComp, DateRangeComp } from "./comps/dateComp/dateComp";
import { DividerComp } from "./comps/dividerComp";
import { FileComp } from "./comps/fileComp/fileComp";
import { FileViewerComp } from "./comps/fileViewerComp";
import { ImageComp } from "./comps/imageComp";
import { JsonSchemaFormComp } from "./comps/jsonSchemaFormComp/jsonSchemaFormComp";
import { NumberInputComp } from "./comps/numberInputComp/numberInputComp";
import { RangeSliderComp } from "./comps/numberInputComp/rangeSliderComp";
import { SliderComp } from "./comps/numberInputComp/sliderComp";
import { ProgressCircleComp } from "./comps/progressCircleComp";
import { ProgressComp } from "./comps/progressComp";
import { RatingComp } from "./comps/ratingComp";
import { RichTextEditorComp } from "./comps/richTextEditorComp";
import { CascaderWithDefault } from "./comps/selectInputComp/cascaderComp";
import { CheckboxComp } from "./comps/selectInputComp/checkboxComp";
import { MultiSelectComp } from "./comps/selectInputComp/multiSelectComp";
import { RadioComp } from "./comps/selectInputComp/radioComp";
import { SegmentedControlComp } from "./comps/selectInputComp/segmentedControl";
import { SelectComp } from "./comps/selectInputComp/selectComp";
import { SwitchComp } from "./comps/switchComp";
import { defaultTableData } from "./comps/tableComp/mockTableComp";
import { TabbedContainerComp } from "./comps/tabs";
import { TextComp } from "./comps/textComp";
import { InputComp } from "./comps/textInputComp/inputComp";
import { PasswordComp } from "./comps/textInputComp/passwordComp";
import { TextAreaComp } from "./comps/textInputComp/textAreaComp";
import { TimePickerComp, TimeRangeComp } from "./comps/dateComp/timeComp";
import { defaultFormData, FormComp } from "./comps/formComp/formComp";
import { IFrameComp } from "./comps/iframeComp";
import {
  defaultGridData,
  defaultListViewData,
  GridComp,
  ListViewComp,
} from "./comps/listViewComp";
import { ModuleComp } from "./comps/moduleComp/moduleComp";
import { NavComp } from "./comps/navComp/navComp";
import { TableComp } from "./comps/tableComp";
import { registerComp, UICompManifest, UICompType } from "./uiCompRegistry";
import { QRCodeComp } from "./comps/qrCodeComp";
import { JsonExplorerComp } from "./comps/jsonComp/jsonExplorerComp";
import { JsonEditorComp } from "./comps/jsonComp/jsonEditorComp";
import { TreeComp } from "./comps/treeComp/treeComp";
import { TreeSelectComp } from "./comps/treeComp/treeSelectComp";
import { trans } from "i18n";
import { remoteComp } from "./comps/remoteComp/remoteComp";
import { AudioComp } from "./comps/mediaComp/audioComp";
import { VideoComp } from "./comps/mediaComp/videoComp";
import { DrawerComp } from "./hooks/drawerComp";
import { CarouselComp } from "./comps/carouselComp";
import { ToggleButtonComp } from "./comps/buttonComp/toggleButtonComp";
import { defaultCollapsibleContainerData } from "./comps/containerComp/collapsibleContainerComp";
import { RemoteCompInfo } from "types/remoteComp";
import { ScannerComp } from "./comps/buttonComp/scannerComp";
import { SignatureComp } from "./comps/signatureComp";
import { TimeLineComp } from "./comps/timelineComp/timelineComp";
import { CommentComp } from "./comps/commentComp/commentComp";
import { MentionComp } from "./comps/textInputComp/mentionComp";
import { AutoCompleteComp } from "./comps/autoCompleteComp/autoCompleteComp";
import { JsonLottieComp } from "./comps/jsonComp/jsonLottieComp";
import { ResponsiveLayoutComp } from "./comps/responsiveLayout";
import { ControlButton } from "./comps/meetingComp/controlButton";
import {MultiIconDisplay} from "@lowcoder-ee/comps/comps/multiIconDisplay";

type Registry = {
  [key in UICompType]?: UICompManifest;
};

const builtInRemoteComps: Omit<RemoteCompInfo, "compName"> = {
  source: !!REACT_APP_BUNDLE_BUILTIN_PLUGIN ? "bundle" : "npm",
  isRemote: true,
  packageName: "lowcoder-comps",
};

var uiCompMap: Registry = {
  // Dashboards
  chart: {
    name: trans("uiComp.chartCompName"),
    enName: "Chart",
    description: trans("uiComp.chartCompDesc"),
    categories: ["dashboards"],
    icon: () => <MultiIconDisplay identifier="/icono:svg/ChartCompIcon"/>,
    comp: remoteComp({ ...builtInRemoteComps, compName: "chart" }),
    keywords: trans("uiComp.chartCompKeywords"),
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },
  sharingcomponent: {
    name: trans("meeting.sharingCompName"),
    enName: "Sharing",
    description: trans("meeting.sharingCompName"),
    categories: ["collaboration"],
    icon: () => <MultiIconDisplay identifier="/icono:svg/VideoCompIcon"/>,
    keywords: trans("meeting.meetingCompKeywords"),
    // comp: VideoSharingStreamComp,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/VideoCompIcon"/>,
    keywords: trans("meeting.meetingCompKeywords"),
    // comp: VideoMeetingStreamComp,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/DrawerCompIcon"/>,
    keywords: trans("meeting.meetingCompKeywords"),
    // comp: VideoMeetingControllerComp,
    withoutLoading: true,
  },
  mermaid: {
    name: trans("uiComp.mermaidCompName"),
    enName: "Mermaid Charts",
    comp: remoteComp({ ...builtInRemoteComps, compName: "mermaid" }),
    description: trans("uiComp.mermaidCompDesc"),
    categories: ["dashboards"],
    icon: () => <MultiIconDisplay identifier="/icono:svg/MermaidCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/TimeLineCompIcon"/>,
    keywords: trans("uiComp.timelineCompKeywords"),
    comp: TimeLineComp,
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },
  table: {
    name: trans("uiComp.tableCompName"),
    enName: "Table",
    description: trans("uiComp.tableCompDesc"),
    categories: ["dashboards", "projectmanagement"],
    icon:() => <MultiIconDisplay identifier="/icon:svg/TableCompIcon" />,
    keywords: trans("uiComp.tableCompKeywords"),
    comp: TableComp,
    layoutInfo: {
      w: 12,
      h: 40,
    },
    withoutLoading: true,
    defaultDataFn: defaultTableData,
  },
  slider: {
    name: trans("uiComp.sliderCompName"),
    enName: "Slider",
    description: trans("uiComp.sliderCompDesc"),
    categories: ["dashboards"],
    icon: () => <MultiIconDisplay identifier="/icono:svg/SliderCompIcon"/>,
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
    categories: ["dashboards"],
    icon: () => <MultiIconDisplay identifier="/icono:svg/RangeSliderCompIcon"/>,
    keywords: trans("uiComp.rangeSliderCompKeywords"),
    comp: RangeSliderComp,
    layoutInfo: {
      w: 6,
      h: 5,
    },
  },

  // Layout

  responsiveLayout: {
    name: trans("uiComp.responsiveLayoutCompName"),
    enName: "Responsive Layout",
    description: trans("uiComp.responsiveLayoutCompDesc"),
    categories: ["layout"],
    icon: () => <MultiIconDisplay identifier="/icono:svg/ResponsiveLayoutCompIcon"/>,
    keywords: trans("uiComp.responsiveLayoutCompKeywords"),
    comp: ResponsiveLayoutComp,
    withoutLoading: true,
    layoutInfo: {
      w: 24,
      h: 25,
      delayCollision: true,
    },
  },
  container: {
    name: trans("uiComp.containerCompName"),
    enName: "Container",
    description: trans("uiComp.containerCompDesc"),
    categories: ["layout"],
    icon: () => <MultiIconDisplay identifier="/icono:svg/ContainerCompIcon"/>,
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
  tabbedContainer: {
    name: trans("uiComp.tabbedContainerCompName"),
    enName: "Tabbed Container",
    description: trans("uiComp.tabbedContainerCompDesc"),
    categories: ["layout"],
    icon: () => <MultiIconDisplay identifier="/icono:svg/TabbedContainerCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/CollapsibleContainerCompIcon"/>,
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
  listView: {
    name: trans("uiComp.listViewCompName"),
    enName: "List View",
    icon: () => <MultiIconDisplay identifier="/icono:svg/ListViewCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/GridCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/ModalCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/DrawerCompIcon"/>,
    keywords: trans("uiComp.drawerCompKeywords"),
    comp: DrawerComp,
    withoutLoading: true,
  },
  navigation: {
    name: trans("uiComp.navigationCompName"),
    enName: "Navigation",
    description: trans("uiComp.navigationCompDesc"),
    icon: () => <MultiIconDisplay identifier="/icono:svg/NavComIcon"/>,
    categories: ["layout"],
    keywords: trans("uiComp.navigationCompKeywords"),
    comp: NavComp,
    layoutInfo: {
      w: 24,
      h: 5,
    },
  },
  cascader: {
    name: trans("uiComp.cascaderCompName"),
    enName: "Cascader",
    description: trans("uiComp.cascaderCompDesc"),
    categories: ["layout"],
    icon: () => <MultiIconDisplay identifier="/icono:svg/CascaderCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/LinkCompIcon"/>,
    keywords: trans("uiComp.linkCompKeywords"),
    comp: LinkComp,
    layoutInfo: {
      w: 6,
      h: 5,
    },
  },
  divider: {
    name: trans("uiComp.dividerCompName"),
    enName: "Divider",
    description: trans("uiComp.dividerCompDesc"),
    categories: ["layout"],
    icon: () => <MultiIconDisplay identifier="/icono:svg/DividerCompIcon"/>,
    keywords: trans("uiComp.dividerCompKeywords"),
    comp: DividerComp,
    layoutInfo: {
      w: 12,
      h: 1,
    },
  },

  // Scheduling

  calendar: {
    name: trans("uiComp.calendarCompName"),
    enName: "Calendar",
    description: trans("uiComp.calendarCompDesc"),
    categories: ["scheduling", "projectmanagement"],
    icon: () => <MultiIconDisplay identifier="/icono:svg/CalendarCompIcon"/>,
    keywords: trans("uiComp.calendarCompKeywords"),
    comp: remoteComp({ ...builtInRemoteComps, compName: "calendar" }),
    layoutInfo: {
      w: 19,
      h: 60,
    },
  },

  // Collaboration

  // sharingcomponent: {
  //   name: trans("meeting.sharingCompName"),
  //   enName: "Sharing",
  //   description: trans("meeting.sharingCompName"),
  //   categories: ["collaboration"],
  //   icon: () => <MultiIconDisplay identifier="/icono:svg/VideoCompIcon"/>,
  //   keywords: trans("meeting.meetingCompKeywords"),
  //   comp: VideoSharingStreamComp,
  //   withoutLoading: true,
  //   layoutInfo: {
  //     w: 12,
  //     h: 50,
  //   },
  // },
  // videocomponent: {
  //   name: trans("meeting.videoCompName"),
  //   enName: "Video",
  //   description: trans("meeting.videoCompName"),
  //   categories: ["collaboration"],
  //   icon: () => <MultiIconDisplay identifier="/icono:svg/VideoCompIcon"/>,
  //   keywords: trans("meeting.meetingCompKeywords"),
  //   comp: VideoMeetingStreamComp,
  //   withoutLoading: true,
  //   layoutInfo: {
  //     w: 6,
  //     h: 32,
  //   },
  // },
  // meeting: {
  //   name: trans("meeting.meetingCompName"),
  //   enName: "Drawer",
  //   description: trans("meeting.meetingCompDesc"),
  //   categories: ["collaboration"],
  //   icon: () => <MultiIconDisplay identifier="/icono:svg/DrawerCompIcon"/>,
  //   keywords: trans("meeting.meetingCompKeywords"),
  //   comp: VideoMeetingControllerComp,
  //   withoutLoading: true,
  // },
  comment: {
    name: trans("uiComp.commentCompName"),
    enName: "comment",
    description: trans("uiComp.commentCompDesc"),
    categories: ["forms", "collaboration"],
    icon: () => <MultiIconDisplay identifier="/icono:svg/CommentCompIcon"/>,
    keywords: trans("uiComp.commentCompKeywords"),
    comp: CommentComp,
    layoutInfo: {
      w: 13,
      h: 55,
    },
  },
  mention: {
    name: trans("uiComp.mentionCompName"),
    enName: "mention",
    description: trans("uiComp.mentionCompDesc"),
    categories: ["forms", "collaboration"],
    icon: () => <MultiIconDisplay identifier="/icono:svg/MentionCompIcon"/>,
    keywords: trans("uiComp.mentionCompKeywords"),
    comp: MentionComp,
  },

  // Forms

  form: {
    name: trans("uiComp.formCompName"),
    enName: "Form",
    description: trans("uiComp.formCompDesc"),
    categories: ["forms"],
    icon: () => <MultiIconDisplay identifier="/icono:svg/FormCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/JsonFormCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/JsonEditorCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/JsonExplorerCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/RichTextEditorCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/InputCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/PasswordCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/NumberInputCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/TextAreaCompIcon"/>,
    keywords: trans("uiComp.textAreaCompKeywords"),
    comp: TextAreaComp,
    layoutInfo: {
      w: 6,
      h: 12,
    },
  },
  switch: {
    name: trans("uiComp.switchCompName"),
    enName: "Switch",
    description: trans("uiComp.switchCompDesc"),
    categories: ["forms"],
    icon: () => <MultiIconDisplay identifier="/icono:svg/SwitchCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/CheckboxCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/RadioCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/DateCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/DateRangeCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/TimeCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/TimeRangeCompIcon"/>,
    keywords: trans("uiComp.timeRangeCompKeywords"),
    comp: TimeRangeComp,
    layoutInfo: {
      w: 12,
      h: 6,
    },
  },
  button: {
    name: trans("uiComp.buttonCompName"),
    enName: "Button",
    description: trans("uiComp.buttonCompDesc"),
    categories: ["forms"],
    icon: () => <MultiIconDisplay identifier="/icono:svg/ButtonCompIcon"/>,
    keywords: trans("uiComp.buttonCompKeywords"),
    comp: ButtonComp,
    layoutInfo: {
      w: 6,
      h: 6,
    },
    withoutLoading: true,
  },
  controlButton: {
    name: trans("meeting.meetingControlCompName"),
    enName: "Controls",
    description: trans("meeting.meetingCompDesc"),
    categories: ["forms", "collaboration"],
    icon: () => <MultiIconDisplay identifier="/icono:svg/ButtonCompIcon"/>,
    keywords: trans("meeting.meetingCompKeywords"),
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/DropdownCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/ToggleButtonCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/SegmentedCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/RatingCompIcon"/>,
    keywords: trans("uiComp.ratingCompKeywords"),
    comp: RatingComp,
    layoutInfo: {
      w: 6,
      h: 6,
    },
  },
  autocomplete: {
    name: trans("uiComp.autoCompleteCompName"),
    enName: "autoComplete",
    description: trans("uiComp.autoCompleteCompDesc"),
    categories: ["forms", "collaboration"],
    icon: () => <MultiIconDisplay identifier="/icono:svg/AutoCompleteCompIcon"/>,
    keywords: cnchar
        .spell(trans("uiComp.autoCompleteCompName"), "first", "low")
        .toString(),
    comp: AutoCompleteComp,
    layoutInfo: {
      w: 6,
      h: 5,
    },
  },

  // Project Management

  progress: {
    name: trans("uiComp.progressCompName"),
    enName: "Progress",
    description: trans("uiComp.progressCompDesc"),
    categories: ["dashboards", "projectmanagement"],
    icon: () => <MultiIconDisplay identifier="/icono:svg/ProgressCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/ProcessCircleCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/UploadCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/FileViewerCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/ImageCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/CarouselCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/AudioCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/VideoCompIcon"/>,
    keywords: trans("uiComp.videoCompKeywords"),
    comp: VideoComp,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/LottieAnimationCompIcon"/>,
    keywords: trans("uiComp.jsonLottieCompKeywords"),
    comp: JsonLottieComp,
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },
  imageEditor: {
    name: trans("uiComp.imageEditorCompName"),
    enName: "Image Editor",
    comp: remoteComp({ ...builtInRemoteComps, compName: "imageEditor" }),
    description: trans("uiComp.imageEditorCompDesc"),
    categories: ["multimedia"],
    icon: () => <MultiIconDisplay identifier="/icono:svg/ImageEditorCompIcon"/>,
    keywords: trans("uiComp.imageEditorCompKeywords"),
    layoutInfo: {
      w: 12,
      h: 40,
    },
  },

  // item Handling

  qrCode: {
    name: trans("uiComp.qrCodeCompName"),
    enName: "QR Code",
    description: trans("uiComp.qrCodeCompDesc"),
    categories: ["itemHandling", "documents"],
    icon: () => <MultiIconDisplay identifier="/icono:svg/QRCodeCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/ScannerCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/SignatureCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/SelectCompIcon"/>,
    keywords: trans("uiComp.selectCompKeywords"),
    comp: SelectComp,
    layoutInfo: {
      w: 6,
      h: 5,
    },
  },
  multiSelect: {
    name: trans("uiComp.multiSelectCompName"),
    enName: "Multiselect",
    description: trans("uiComp.multiSelectCompDesc"),
    categories: ["forms", "itemHandling"],
    icon: () => <MultiIconDisplay identifier="/icono:svg/MultiSelectCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/TreeDisplayCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/TreeSelectCompIcon"/>,
    keywords: trans("uiComp.treeSelectCompKeywords"),
    comp: TreeSelectComp,
    layoutInfo: {
      w: 12,
      h: 5,
    },
  },

  // Integration

  iframe: {
    name: trans("uiComp.iframeCompName"),
    enName: "IFrame",
    description: trans("uiComp.iframeCompDesc"),
    icon: () => <MultiIconDisplay identifier="/icono:svg/IFrameCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/CustomCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/CustomCompIcon"/>,
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
    icon: () => <MultiIconDisplay identifier="/icono:svg/TextCompIcon"/>,
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
