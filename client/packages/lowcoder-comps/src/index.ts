import { ChartCompWithDefault } from "./comps/chartComp/chartComp";
import { ImageEditorComp } from "./comps/imageEditorComp/index";
import { CalendarComp } from "./comps/calendarComp/calendarComp";
import { MermaidComp } from "comps/mermaidComp";
import { AgoraMeetingControllerComp } from "comps/agoraMeetingComp/agorameetingControllerComp";

export default {
  chart: ChartCompWithDefault,
  imageEditor: ImageEditorComp,
  calendar: CalendarComp,
  mermaid: MermaidComp,
  agoraMeetingComp: AgoraMeetingControllerComp,
};
