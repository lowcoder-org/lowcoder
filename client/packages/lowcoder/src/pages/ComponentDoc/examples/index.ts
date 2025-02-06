import { UICompType } from "comps/uiCompRegistry";
import ButtonExample from "./ButtonComp/Button";
import IconButtonExample from "./ButtonComp/IconButton";
import ToggleButtonExample from "./ButtonComp/ToggleButton";
import InputExample from "./textInputComp/Input";
import PasswordExample from "./textInputComp/Password";
import TextAreaExample from "./textInputComp/TextArea";
import RichTextEditorComp from "./textInputComp/RichTextEditor";
import NumberInputExample from "./numberInputComp/NumberInput";
import SliderExample from "./numberInputComp/Slider";
import RangeSliderExample from "./numberInputComp/RangeSlider";
import RatingExample from "./numberInputComp/Rating";
import SwitchExample from "./selectInputComp/Switch";
import SelectExample from "./selectInputComp/Select";
import MultiSelectExample from "./selectInputComp/MultiSelect";
import CascaderExample from "./selectInputComp/Cascader";
import CheckboxExample from "./selectInputComp/CheckBox";
import RadioExample from "./selectInputComp/Radio";
import SegmentedControlExample from "./selectInputComp/SegmentedControl";
import FileExample from "./selectInputComp/File";
import LinkExample from "./ButtonComp/LinkButton";
import DropdownExample from "./ButtonComp/DropDownButton";
import TextExample from "./presentationComp/text";
import TableExample from "./presentationComp/table";
import ImageExample from "./presentationComp/image";
import ProgressCircleExample from "./presentationComp/progressCircle";
import ProgressExample from "./presentationComp/progress";
import ChartExample from "./presentationComp/chart";
import FileViewerExample from "./presentationComp/fileViewer";
import DividerExample from "./presentationComp/divider";
import DateExample from "./CalendarInputComp/Date";
import TimeExample from "./CalendarInputComp/Time";
import DateRangeExample from "./CalendarInputComp/DateRange";
import TimeRangeExample from "./CalendarInputComp/TimeRange";
import jsonSchemaFormExample from "./formComp/JSONSchemaform";
import NavigationExample from "./Navigation";
import IFrameExample from "./IFrame";
import FloatButtonExample from "./ButtonComp/FloatButton";
import AvatarExample from "./presentationComp/avatar";
import AvatarGroupExample from "./presentationComp/avatarGroup";
import TimerExample from "./CalendarInputComp/Timer";
import AudioExample from "./MediaComp/Audio";
import VideoExample from "./MediaComp/Video";
import TreeExample from "./selectInputComp/Tree";
import TreeSelectExample from "./selectInputComp/TreeSelect";
import AutoCompleteExample from "./selectInputComp/AutoComplete";
import ListViewExample from "./presentationComp/listView";
import TimeLineExample from "./presentationComp/timeline";
import CommentExample from "./presentationComp/comment";
import ColorPickerExample from "./MediaComp/ColorPicker";
import SignatureExample from "./MediaComp/Signature";
import TransferExample from "./MediaComp/Transfer";
import ResponsiveLayoutExample from "./ContainersComp/ResponsiveLayout";
import PageLayoutExample from "./ContainersComp/PageLayout";
import ColumnLayoutExample from "./ContainersComp/ColumnLayout";
import TabbedContainerExample from "./ContainersComp/TabbedContainer";
import ContainerExample from "./ContainersComp/Container";
import ContentCardExample from "./MediaComp/ContentCard";
import ImageCarouselExample from "./presentationComp/imageCarousel";
import FormExample from "./formComp/Form";
import JsonEditorExample from "./formComp/JSONEditor";
import JsonExplorerExample from "./formComp/JSONExplorer";
import ShapeExample from "./MediaComp/Shape";
import JsonLottieAnimationExample from "./MediaComp/LottieAnimation";
import IconExample from "./MediaComp/Icons";
import TourExample from "./MediaComp/Tour";
import QRCodeExample from "./MediaComp/QRCode";
import StepControlExample from "./selectInputComp/StepControl";
import CustomCompExample from "./presentationComp/customComponent";
import ScannerExample from "./MediaComp/Scanner";
import CandleStickChartExample from "./ChartsComp/CandleStickChart";
import GridViewExample from "./presentationComp/gridView";
import ModalExample from "./ChartsComp/Modal";
import FunnelChartExample from "./ChartsComp/FunnelChart";
import GaugeChartExample from "./ChartsComp/GaugeChart";
import GraphChartExample from "./ChartsComp/GraphChart";
import HeatmapChartExample from "./ChartsComp/HeatmapChart";
import RadarChartExample from "./ChartsComp/RadarChart";
import SankeyChartExample from "./ChartsComp/SankeyChart";
import SunburstChartExample from "./ChartsComp/SunburstChart";
import ThemeRiverChartExample from "./ChartsComp/ThemeRiverChart";
import TreeChartExample from "./ChartsComp/TreeChart";
import TreemapChartExample from "./ChartsComp/TreemapChart";
import OpenLayersGeoMapChartExample from "./ChartsComp/OpenLayersGeoMap";
import GeoMapChartExample from "./ChartsComp/GeoMapChart";
import MermaidChartExample from "./ChartsComp/MermaidChart";
import MentionCompExample from "./MediaComp/Mention";
import CalendarExample from "./CalendarInputComp/Calendar";
import PivotTableExample from "./presentationComp/pivotTable";
import TurnstileCaptchaExample from "./MediaComp/TurnstileCaptcha";
import GanttChartExample from "./ChartsComp/GanttChart";
import KanbanExample from "./presentationComp/Kanban";
import HillChartExample from "./ChartsComp/HillChart";
import BPMNEditorExample from "./MediaComp/BPMNEditor";
import ImageEditorExample from "./presentationComp/imageEditor";
import DrawerExample from "./ChartsComp/Drawer";
import CollapsibleContainerExample from "./ContainersComp/CollapsibleContainer";
import FloatTextContainerExample from "./ContainersComp/FloatTextContainer";

const examples: { [key in UICompType]?: React.FunctionComponent } = {
  button: ButtonExample,
  controlButton: IconButtonExample,
  toggleButton: ToggleButtonExample,
  floatingButton: FloatButtonExample,
  input: InputExample,
  textArea: TextAreaExample,
  password: PasswordExample,
  richTextEditor: RichTextEditorComp,
  numberInput: NumberInputExample,
  slider: SliderExample,
  rangeSlider: RangeSliderExample,
  rating: RatingExample,
  switch: SwitchExample,
  select: SelectExample,
  multiSelect: MultiSelectExample,
  cascader: CascaderExample,
  checkbox: CheckboxExample,
  radio: RadioExample,
  segmentedControl: SegmentedControlExample,
  file: FileExample,
  date: DateExample,
  dateRange: DateRangeExample,
  time: TimeExample,
  timeRange: TimeRangeExample,
  link: LinkExample,
  dropdown: DropdownExample,
  text: TextExample,
  table: TableExample,
  image: ImageExample,
  progressCircle: ProgressCircleExample,
  progress: ProgressExample,
  chart: ChartExample,
  fileViewer: FileViewerExample,
  divider: DividerExample,
  jsonSchemaForm: jsonSchemaFormExample,
  navigation: NavigationExample,
  iframe: IFrameExample,
  avatar: AvatarExample,
  avatarGroup: AvatarGroupExample,
  timer: TimerExample,
  audio: AudioExample,
  video: VideoExample,
  tree: TreeExample,
  treeSelect: TreeSelectExample,
  autocomplete: AutoCompleteExample,
  listView: ListViewExample,
  timeline: TimeLineExample,
  comment: CommentExample,
  colorPicker: ColorPickerExample,
  signature: SignatureExample,
  transfer: TransferExample,
  responsiveLayout: ResponsiveLayoutExample,
  pageLayout: PageLayoutExample,
  columnLayout: ColumnLayoutExample,
  tabbedContainer: TabbedContainerExample,
  container: ContainerExample,
  card: ContentCardExample,
  carousel: ImageCarouselExample,
  form: FormExample,
  jsonEditor: JsonEditorExample,
  jsonExplorer: JsonExplorerExample,
  shape: ShapeExample,
  jsonLottie: JsonLottieAnimationExample,
  icon: IconExample,
  tour: TourExample,
  qrCode: QRCodeExample,
  step: StepControlExample,
  custom: CustomCompExample,
  scanner: ScannerExample,
  candleStickChart: CandleStickChartExample,
  grid: GridViewExample,
  modal: ModalExample,
  funnelChart: FunnelChartExample,
  gaugeChart: GaugeChartExample,
  graphChart: GraphChartExample,
  heatmapChart: HeatmapChartExample,
  radarChart: RadarChartExample,
  sankeyChart: SankeyChartExample,
  sunburstChart: SunburstChartExample,
  themeriverChart: ThemeRiverChartExample,
  treeChart: TreeChartExample,
  treemapChart: TreemapChartExample,
  openLayersGeoMap: OpenLayersGeoMapChartExample,
  chartsGeoMap: GeoMapChartExample,
  mermaid: MermaidChartExample,
  mention: MentionCompExample,
  calendar: CalendarExample,
  pivotTable: PivotTableExample,
  turnstileCaptcha: TurnstileCaptchaExample,
  ganttChart: GanttChartExample,
  kanban: KanbanExample,
  hillchart: HillChartExample,
  bpmnEditor: BPMNEditorExample,
  imageEditor: ImageEditorExample,
  drawer: DrawerExample,
  collapsibleContainer: CollapsibleContainerExample,
  floatTextContainer: FloatTextContainerExample,
};

export default examples;
