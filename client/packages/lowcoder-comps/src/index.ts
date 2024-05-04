import { ChartCompWithDefault } from "./comps/chartComp/chartComp";
import { ImageEditorComp } from "./comps/imageEditorComp/index";
import { CalendarComp } from "./comps/calendarComp/calendarComp";
import { MermaidComp } from "comps/mermaidComp"; 
import { MapCompWithDefault } from "comps/mapComp/mapComp";
import { FunnelChartCompWithDefault } from "comps/funnelChartComp/funnelChartComp";
import { GaugeChartCompWithDefault } from "comps/gaugeChartComp/gaugeChartComp";
import { SankeyChartCompWithDefault } from "comps/sankeyChartComp/sankeyChartComp";
import { CandleStickChartCompWithDefault } from "comps/candleStickChartComp/candleStickChartComp";
import { RadarChartCompWithDefault } from "comps/radarChartComp/radarChartComp";
import { HeatmapChartCompWithDefault } from "comps/heatmapChartComp/heatmapChartComp";
import { GraphChartCompWithDefault } from "comps/graphChartComp/graphChartComp";
import { TreeChartCompWithDefault } from "comps/treeChartComp/treechartComp";
import { TreemapChartCompWithDefault } from "comps/treemapChartComp/treemapChartComp";
import { SunburstChartCompWithDefault } from "comps/sunburstChartComp/sunburstChartComp";

export default {
  chart: ChartCompWithDefault,
  map: MapCompWithDefault,
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
  imageEditor: ImageEditorComp,
  calendar: CalendarComp,
  mermaid: MermaidComp,
};
