import { ChartCompWithDefault } from "./comps/chartComp/chartComp";
import { ImageEditorComp } from "./comps/imageEditorComp/index";
import { CalendarComp } from "./comps/calendarComp/calendarComp";
import { MermaidComp } from "comps/mermaidComp"; 
import { MapCompWithDefault } from "comps/mapComp/mapComp";
import { FunnelChartCompWithDefault } from "comps/funnelChartComp/funnelChartComp";
import { GaugeChartCompWithDefault } from "comps/gaugeChartComp/gaugeChartComp";
import { SankeyChartCompWithDefault } from "comps/sankeyChartComp/sankeyChartComp";
import { CandleStickChartCompWithDefault } from "comps/candleStickChartComp/candleStickChartComp";

export default {
  chart: ChartCompWithDefault,
  map: MapCompWithDefault,
  funnelChart: FunnelChartCompWithDefault,
  gaugeChart: GaugeChartCompWithDefault,
  sankeyChart: SankeyChartCompWithDefault,
  candleStickChart: CandleStickChartCompWithDefault,
  imageEditor: ImageEditorComp,
  calendar: CalendarComp,
  mermaid: MermaidComp,
};
