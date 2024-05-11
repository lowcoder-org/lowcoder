import { ChartCompWithDefault } from "./comps/chartComp/chartComp";
import { ImageEditorComp } from "./comps/imageEditorComp/index";
import { CalendarComp } from "./comps/calendarComp/calendarComp";
import { ChartsGeoMapComp } from "./comps/chartsGeoMapComp/chartsGeoMapComp";
import { FunnelChartCompWithDefault } from "./comps/funnelChartComp/funnelChartComp";
import { GaugeChartCompWithDefault } from "./comps/gaugeChartComp/gaugeChartComp";
import { SankeyChartCompWithDefault } from "./comps/sankeyChartComp/sankeyChartComp";
import { CandleStickChartCompWithDefault } from "./comps/candleStickChartComp/candleStickChartComp";
import { RadarChartCompWithDefault } from "./comps/radarChartComp/radarChartComp";
import { HeatmapChartCompWithDefault } from "./comps/heatmapChartComp/heatmapChartComp";
import { GraphChartCompWithDefault } from "./comps/graphChartComp/graphChartComp";
import { TreeChartCompWithDefault } from "./comps/treeChartComp/treechartComp";
import { TreemapChartCompWithDefault } from "./comps/treemapChartComp/treemapChartComp";
import { SunburstChartCompWithDefault } from "./comps/sunburstChartComp/sunburstChartComp";
import { ThemeriverChartCompWithDefault } from "./comps/themeriverChartComp/themeriverChartComp";

import { MermaidComp } from "./comps/mermaidComp";
import { MeetingControllerComp } from "./comps/agoraMeetingComp/meetingControllerComp";
import { VideoMeetingStreamComp } from "./comps/agoraMeetingComp/videoMeetingStreamComp";
import { VideoSharingStreamComp } from "./comps/agoraMeetingComp/videoSharingStreamComp";
import { BasicChartCompWithDefault } from "comps/basicChartComp/chartComp";

export default {
  chart: ChartCompWithDefault,
  basicChart: BasicChartCompWithDefault,
  chartsGeoMap: ChartsGeoMapComp,
  funnelChart: FunnelChartCompWithDefault,
  gaugeChart: GaugeChartCompWithDefault,
  sankeyChart: SankeyChartCompWithDefault,
  candleStickChart: CandleStickChartCompWithDefault,
  radarChart: RadarChartCompWithDefault,
  heatmapChart: HeatmapChartCompWithDefault,
  graphChart: GraphChartCompWithDefault,
  treeChart: TreeChartCompWithDefault,
  treemapChart: TreemapChartCompWithDefault,
  sunburstChart: SunburstChartCompWithDefault,
  themeriverChart: ThemeriverChartCompWithDefault,
  imageEditor: ImageEditorComp,
  calendar: CalendarComp,
  mermaid: MermaidComp,
  meetingController: MeetingControllerComp,
  meetingStream: VideoMeetingStreamComp,
  meetingSharing: VideoSharingStreamComp,
};
