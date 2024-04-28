import { ChartCompWithDefault } from "./comps/chartComp/chartComp";
import { ImageEditorComp } from "./comps/imageEditorComp/index";
import { CalendarComp } from "./comps/calendarComp/calendarComp";
import { MermaidComp } from "comps/mermaidComp";
import { MeetingControllerComp } from "comps/agoraMeetingComp/meetingControllerComp";
import { VideoMeetingStreamComp } from "comps/agoraMeetingComp/videoMeetingStreamComp";
import { VideoSharingStreamComp } from "comps/agoraMeetingComp/videoSharingStreamComp";
export default {
  chart: ChartCompWithDefault,
  imageEditor: ImageEditorComp,
  calendar: CalendarComp,
  mermaid: MermaidComp,
  meetingController: MeetingControllerComp,
  meetingStream: VideoMeetingStreamComp,
  meetingSharing: VideoSharingStreamComp,
};
