import { BoolCodeControl } from "comps/controls/codeControl";
import { dropdownControl } from "comps/controls/dropdownControl";
// import { IconControl } from "comps/controls/iconControl";
import { CompNameContext, EditorContext, EditorState } from "comps/editorState";
import { withDefault } from "comps/generators";
import { UICompBuilder } from "comps/generators/uiCompBuilder";
import ReactResizeDetector from "react-resize-detector";
// import _ from "lodash";
import {
  CommonBlueLabel,
  controlItem,
  Dropdown,
  Section,
  sectionNames,
} from "lowcoder-design";
import { trans } from "i18n";

import styled, { css } from "styled-components";
import {
  CommonNameConfig,
  NameConfig,
  withExposingConfigs,
} from "../../generators/withExposing";
import { IForm } from "../formComp/formDataConstants";
import { SimpleNameComp } from "../simpleNameComp";
import { ButtonStyleControl } from "./videobuttonCompConstants";
import { RefControl } from "comps/controls/refControl";
import { useEffect, useRef, useState } from "react";

import { AutoHeightControl } from "comps/controls/autoHeightControl";
import { client } from "./videoMeetingControllerComp";

import { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";

import {
  MeetingEventHandlerControl,
  StringControl,
  StringStateControl,
  hiddenPropertyView,
  stringExposingStateControl,
} from "@lowcoder-ee/index.sdk";
import { BoolShareVideoControl } from "./meetingControlerUtils";

const FormLabel = styled(CommonBlueLabel)`
  font-size: 13px;
  margin-right: 4px;
`;

function getFormOptions(editorState: EditorState) {
  return editorState
    .uiCompInfoList()
    .filter((info) => info.type === "form")
    .map((info) => ({
      label: info.name,
      value: info.name,
    }));
}

const VideoContainer = styled.video`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-around;
`;

function getForm(editorState: EditorState, formName: string) {
  const comp = editorState?.getUICompByName(formName);
  if (comp && comp.children.compType.getView() === "form") {
    return comp.children.comp as unknown as IForm;
  }
}

function getFormEventHandlerPropertyView(
  editorState: EditorState,
  formName: string
) {
  const form = getForm(editorState, formName);
  if (!form) {
    return undefined;
  }

  return (
    <CompNameContext.Provider value={formName}>
      {form.onEventPropertyView(
        <>
          <FormLabel
            onClick={() =>
              editorState.setSelectedCompNames(
                new Set([formName]),
                "rightPanel"
              )
            }
          >
            {formName}
          </FormLabel>
          {trans("button.formButtonEvent")}
        </>
      )}
    </CompNameContext.Provider>
  );
}

class SelectFormControl extends SimpleNameComp {
  override getPropertyView() {
    const label = trans("button.formToSubmit");
    return controlItem(
      { filterText: label },
      <EditorContext.Consumer>
        {(editorState) => (
          <>
            <Dropdown
              label={label}
              value={this.value}
              options={getFormOptions(editorState)}
              onChange={(value) => this.dispatchChangeValueAction(value)}
              allowClear={true}
            />
            {getFormEventHandlerPropertyView(editorState, this.value)}
          </>
        )}
      </EditorContext.Consumer>
    );
  }
}

const typeOptions = [
  {
    label: trans("button.default"),
    value: "",
  },
  {
    label: trans("button.submit"),
    value: "submit",
  },
] as const;

export const meetingStreamChildren = {
  autoHeight: withDefault(AutoHeightControl, "fixed"),
  profilePadding: withDefault(StringControl, "0px"),
  profileBorderRadius: withDefault(StringControl, "0px"),
  videoAspectRatio: withDefault(StringControl, "1 / 1"),
  type: dropdownControl(typeOptions, ""),
  onEvent: MeetingEventHandlerControl,
  disabled: BoolCodeControl,
  loading: BoolCodeControl,
  form: SelectFormControl,
  // prefixIcon: IconControl,
  // suffixIcon: IconControl,
  style: ButtonStyleControl,
  viewRef: RefControl<HTMLElement>,
  userId: stringExposingStateControl(""),
  profileImageUrl: withDefault(
    StringStateControl,
    "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Peanut&radius=50&backgroundColor=transparent&randomizeIds=true&eyes=wink,sleepClose"
  ),
  noVideoText: stringExposingStateControl("No Video"),
};

let SharingCompBuilder = (function (props) {
  return new UICompBuilder(meetingStreamChildren, (props) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const conRef = useRef<HTMLDivElement>(null);
    const [userId, setUserId] = useState();
    const [userName, setUsername] = useState("");
    const [showVideoSharing, setVideoSharing] = useState(true);

    useEffect(() => {
      if (props.userId.value !== "") {
        let userData = JSON.parse(props.userId?.value);
        client.on(
          "user-published",
          async (user: IAgoraRTCRemoteUser, mediaType: "video" | "audio") => {
            if (mediaType === "video") {
              const remoteTrack = await client.subscribe(user, mediaType);
              let userId = user.uid + "";
              if (
                user.hasVideo &&
                user.uid + "" !== userData.user &&
                userData.user !== ""
              ) {
                props.onEvent("videoOn");
              }
              const element = document.getElementById(userId);

              if (element) {
                remoteTrack.play(userId);
              }
            }
            if (mediaType === "audio") {
              const remoteTrack = await client.subscribe(user, mediaType);
              if (
                user.hasAudio &&
                user.uid + "" !== userData.user &&
                userData.user !== ""
              ) {
                userData.audiostatus = user.hasVideo;

                props.onEvent("audioUnmuted");
              }
              remoteTrack.play();
            }
          }
        );
        client.on(
          "user-unpublished",
          (user: IAgoraRTCRemoteUser, mediaType: "video" | "audio") => {
            console.log("user-unpublished");

            if (mediaType === "audio") {
              if (
                !user.hasAudio &&
                user.uid + "" !== userData.user &&
                userData.user !== ""
              ) {
                userData.audiostatus = user.hasVideo;
                props.onEvent("audioMuted");
              }
            }
            if (mediaType === "video") {
              if (videoRef.current && videoRef.current?.id === user.uid + "") {
                videoRef.current.srcObject = null;
              }
              if (
                !user.hasVideo &&
                user.uid + "" !== userData.user &&
                userData.user !== ""
              ) {
                props.onEvent("videoOff");
              }
            }
          }
        );

        setUserId(userData.user);
        setUsername(userData.userName);
        setVideoSharing(userData.streamingSharing);
      }
    }, [props.userId.value]);

    return (
      <EditorContext.Consumer>
        {(editorState) => (
          <ReactResizeDetector>
            <div
              ref={conRef}
              style={{
                display: "flex",
                alignItems: "center",
                height: "100%",
                overflow: "hidden",
                borderRadius: props.style.radius,
                aspectRatio: props.videoAspectRatio,
                backgroundColor: props.style.background,
                padding: props.style.padding,
                margin: props.style.margin,
              }}
            >
              {userId ? (
                <VideoContainer
                  onClick={() => props.onEvent("videoClicked")}
                  ref={videoRef}
                  style={{
                    display: `${showVideoSharing ? "flex" : "none"}`,
                    aspectRatio: props.videoAspectRatio,
                    borderRadius: props.style.radius,
                    width: "auto",
                  }}
                  id="share-screen"
                ></VideoContainer>
              ) : (
                <></>
              )}
              <div
                style={{
                  flexDirection: "column",
                  alignItems: "center",
                  display: `${!showVideoSharing || userId ? "flex" : "none"}`,
                  margin: "0 auto",
                  padding: props.profilePadding,
                }}
              >
                <img
                  alt=""
                  style={{
                    borderRadius: props.profileBorderRadius,
                    width: "100%",
                    overflow: "hidden",
                  }}
                  src={props.profileImageUrl.value}
                />
                <p style={{ margin: "0" }}>{userName ?? ""}</p>
              </div>
            </div>
          </ReactResizeDetector>
        )}
      </EditorContext.Consumer>
    );
  })
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.userId.propertyView({ label: trans("meeting.videoId") })}
          {children.autoHeight.getPropertyView()}
          {children.profileImageUrl.propertyView({
            label: trans("meeting.profileImageUrl"),
            placeholder: "https://via.placeholder.com/120",
          })}
        </Section>

        <Section name={sectionNames.interaction}>
          {children.onEvent.getPropertyView()}
        </Section>
        <Section name={sectionNames.layout}>
          {hiddenPropertyView(children)}
        </Section>
        <Section name={sectionNames.style}>
          {children.profilePadding.propertyView({
            label: "Profile Image Padding",
          })}
          {children.profileBorderRadius.propertyView({
            label: "Profile Image Border Radius",
          })}
          {children.videoAspectRatio.propertyView({
            label: "Video Aspect Ratio",
          })}
          {children.style.getPropertyView()}
        </Section>
      </>
    ))
    .build();
})();

SharingCompBuilder = class extends SharingCompBuilder {
  override autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }
};

export const VideoSharingStreamComp = withExposingConfigs(SharingCompBuilder, [
  new NameConfig("loading", trans("button.loadingDesc")),
  new NameConfig("profileImageUrl", trans("meeting.profileImageUrl")),

  ...CommonNameConfig,
]);
