import { AutoHeightControl } from "@lowcoder-ee/comps/controls/autoHeightControl";
import { BoolControl } from "@lowcoder-ee/comps/controls/boolControl";
import { StringControl } from "@lowcoder-ee/comps/controls/codeControl";
import { stringExposingStateControl } from "@lowcoder-ee/comps/controls/codeStateControl";
import { dropdownControl } from "@lowcoder-ee/comps/controls/dropdownControl";
import { clickEvent, doubleClickEvent, eventHandlerControl } from "@lowcoder-ee/comps/controls/eventHandlerControl";
import { styleControl } from "@lowcoder-ee/comps/controls/styleControl";
import { AnimationStyle, TextStyle } from "@lowcoder-ee/comps/controls/styleControlConstants";
import { EditorContext } from "@lowcoder-ee/comps/editorState";
import { withDefault } from "@lowcoder-ee/comps/generators/simpleGenerators";
import { NewChildren } from "@lowcoder-ee/comps/generators/uiCompBuilder";
import { hiddenPropertyView } from "@lowcoder-ee/comps/utils/propertyUtils";
import { RecordConstructorToComp } from "lowcoder-core";
import { ScrollBar, Section, sectionNames } from "lowcoder-design";
import React, { useContext, useMemo } from "react";
import { trans } from "i18n";

// Event options for the chat component
const EventOptions = [
  clickEvent, 
  doubleClickEvent,
  { label: trans("chatBox.connected"), value: "connected", description: trans("chatBox.connectedDesc") },
  { label: trans("chatBox.disconnected"), value: "disconnected", description: trans("chatBox.disconnectedDesc") },
  { label: trans("chatBox.messageReceived"), value: "messageReceived", description: trans("chatBox.messageReceivedDesc") },
  { label: trans("chatBox.messageSent"), value: "messageSent", description: trans("chatBox.messageSentDesc") },
  { label: trans("chatBox.userJoined"), value: "userJoined", description: trans("chatBox.userJoinedDesc") },
  { label: trans("chatBox.userLeft"), value: "userLeft", description: trans("chatBox.userLeftDesc") },
  { label: trans("chatBox.typingStarted"), value: "typingStarted", description: trans("chatBox.typingStartedDesc") },
  { label: trans("chatBox.typingStopped"), value: "typingStopped", description: trans("chatBox.typingStoppedDesc") },
  { label: trans("chatBox.roomJoined"), value: "roomJoined", description: trans("chatBox.roomJoinedDesc") },
  { label: trans("chatBox.roomLeft"), value: "roomLeft", description: trans("chatBox.roomLeftDesc") },
  { label: trans("chatBox.error"), value: "error", description: trans("chatBox.errorDesc") },
] as const;

// Define the component's children map
export const chatCompChildrenMap = {
  chatName: stringExposingStateControl("chatName", "Chat Room"),
  userId: stringExposingStateControl("userId", "user_1"),
  userName: stringExposingStateControl("userName", "User"),
  applicationId: stringExposingStateControl("applicationId", "lowcoder_app"),
  roomId: stringExposingStateControl("roomId", "general"),
  mode: dropdownControl([
    { label: "🌐 Collaborative (Real-time)", value: "collaborative" },
    { label: "🔀 Hybrid (Local + Real-time)", value: "hybrid" },
    { label: "📱 Local Only", value: "local" }
  ], "collaborative"),
  
  // Room Management Configuration
  allowRoomCreation: withDefault(BoolControl, true),
  allowRoomJoining: withDefault(BoolControl, true),
  roomPermissionMode: dropdownControl([
    { label: "🌐 Open (Anyone can join public rooms)", value: "open" },
    { label: "🔐 Invite Only (Admin invitation required)", value: "invite" },
    { label: "👤 Admin Only (Only admins can manage)", value: "admin" }
  ], "open"),
  showAvailableRooms: withDefault(BoolControl, true),
  maxRoomsDisplay: withDefault(StringControl, "10"),
  
  // UI Configuration  
  leftPanelWidth: withDefault(StringControl, "200px"),
  showRooms: withDefault(BoolControl, true),
  autoHeight: AutoHeightControl,
  onEvent: eventHandlerControl(EventOptions),
  style: styleControl(TextStyle, 'style'),
  animationStyle: styleControl(AnimationStyle, 'animationStyle'),
};

export type ChatCompChildrenType = NewChildren<RecordConstructorToComp<typeof chatCompChildrenMap>>;

// Property view component
export const ChatPropertyView = React.memo((props: {
  children: ChatCompChildrenType
}) => {
  const editorContext = useContext(EditorContext);
  const editorModeStatus = useMemo(() => editorContext.editorModeStatus, [editorContext.editorModeStatus]);

  const basicSection = useMemo(() => (
    <Section name={sectionNames.basic}>
      {props.children.chatName.propertyView({
        label: "Chat Name",
        tooltip: "Name displayed in the chat header"
      })}
      {props.children.userId.propertyView({
        label: "User ID",
        tooltip: "Unique identifier for the current user"
      })}
      {props.children.userName.propertyView({
        label: "User Name",
        tooltip: "Display name for the current user"
      })}
      {props.children.applicationId.propertyView({
        label: "Application ID",
        tooltip: "Unique identifier for this Lowcoder application - all chat components with the same Application ID can discover each other's rooms"
      })}
      {props.children.roomId.propertyView({
        label: "Initial Room",
        tooltip: "Default room to join when the component loads (within the application scope)"
      })}
      {props.children.mode.propertyView({
        label: "Sync Mode",
        tooltip: "Choose how messages are synchronized: Collaborative (real-time), Hybrid (local + real-time), or Local only"
      })}
    </Section>
  ), [props.children]);

  const roomManagementSection = useMemo(() => (
    <Section name="Room Management">
      {props.children.allowRoomCreation.propertyView({
        label: "Allow Room Creation",
        tooltip: "Allow users to create new chat rooms"
      })}
      {props.children.allowRoomJoining.propertyView({
        label: "Allow Room Joining",
        tooltip: "Allow users to join existing rooms"
      })}
      {props.children.roomPermissionMode.propertyView({
        label: "Permission Mode",
        tooltip: "Control how users can join rooms"
      })}
      {props.children.showAvailableRooms.propertyView({
        label: "Show Available Rooms",
        tooltip: "Display list of available rooms to join"
      })}
      {props.children.maxRoomsDisplay.propertyView({
        label: "Max Rooms to Display",
        tooltip: "Maximum number of rooms to show in the list"
      })}
    </Section>
  ), [props.children]);

  const interactionSection = useMemo(() => 
    ["logic", "both"].includes(editorModeStatus) && (
      <Section name={sectionNames.interaction}>
        {hiddenPropertyView(props.children)}
        {props.children.onEvent.getPropertyView()}
      </Section>
    ), [editorModeStatus, props.children]);

  const layoutSection = useMemo(() => 
    ["layout", "both"].includes(editorModeStatus) && (
      <>
        <Section name={sectionNames.layout}>
          {props.children.autoHeight.getPropertyView()}
          {props.children.leftPanelWidth.propertyView({
            label: "Left Panel Width",
            tooltip: "Width of the rooms/people panel (e.g., 300px, 25%)"
          })}
          {props.children.showRooms.propertyView({
            label: "Show Rooms"
          })}
        </Section>
        <Section name={sectionNames.style}>
          {props.children.style.getPropertyView()}
        </Section>
        <Section name={sectionNames.animationStyle} hasTooltip={true}>
          {props.children.animationStyle.getPropertyView()}
        </Section>
      </>
    ), [editorModeStatus, props.children]);

  return (
    <>
      {basicSection}
      {roomManagementSection}
      {interactionSection}
      {layoutSection}
    </>
  );
});