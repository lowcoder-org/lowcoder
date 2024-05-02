import { ChartCompWithDefault } from "./comps/chartComp/chartComp";
import { ImageEditorComp } from "./comps/imageEditorComp/index";
import { CalendarComp } from "./comps/calendarComp/calendarComp";
import { MermaidComp } from "comps/mermaidComp"; 
import { MapCompWithDefault } from "comps/mapComp/mapComp";
import { FunnelChartCompWithDefault } from "comps/chartComp/funnelChartComp/funnelChartComp";
import { GaugeChartCompWithDefault } from "comps/chartComp/gaugeChartComp/gaugeChartComp";
import { SankeyChartCompWithDefault } from "comps/chartComp/sankeyChartComp/sankeyChartComp";

export default {
  chart: ChartCompWithDefault,
  map: MapCompWithDefault,
  funnelChart: FunnelChartCompWithDefault,
  gaugeChart: GaugeChartCompWithDefault,
  sankeyChart: SankeyChartCompWithDefault,
  imageEditor: ImageEditorComp,
  calendar: CalendarComp,
  mermaid: MermaidComp,
};
