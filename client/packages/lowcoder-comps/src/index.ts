import { ChartCompWithDefault } from "./comps/chartComp/chartComp";
import { ImageEditorComp } from "./comps/imageEditorComp/index";
import { CalendarComp } from "./comps/calendarComp/calendarComp";
import { MermaidComp } from "comps/mermaidComp"; 
import { EChartsCompWithDefault } from "comps/eChartsComp/echartsComp";
import { MapCompWithDefault } from "comps/mapComp/mapComp";

export default {
  chart: ChartCompWithDefault,
  map: MapCompWithDefault,
  eCharts: EChartsCompWithDefault,
  imageEditor: ImageEditorComp,
  calendar: CalendarComp,
  mermaid: MermaidComp,
};
