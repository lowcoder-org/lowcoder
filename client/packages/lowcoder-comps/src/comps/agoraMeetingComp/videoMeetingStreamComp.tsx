import {
  NameConfig,
  withDefault,
  withExposingConfigs,
  StringControl,
  Section,
  sectionNames,
  AutoHeightControl,
  EditorContext,
  styled,
  MeetingEventHandlerControl,
  BoolCodeControl,
  RefControl,
  stringExposingStateControl,
  StringStateControl,
  UICompBuilder, 
  CommonNameConfig,
} from "lowcoder-sdk";
import { ButtonStyleControl } from "./videobuttonCompConstants";
import { trans } from "../../i18n/comps";

import { client } from "./meetingControllerComp";
import type { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { useEffect, useRef, useState } from "react";
import ReactResizeDetector from "react-resize-detector";

const VideoContainer = styled.video`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-around;
`;

const meetingStreamChildren = {
  autoHeight: withDefault(AutoHeightControl, "auto"),
  profilePadding: withDefault(StringControl, "0px"),
  profileBorderRadius: withDefault(StringControl, "0px"),
  videoAspectRatio: withDefault(StringControl, "1 / 1"),
  onEvent: MeetingEventHandlerControl,
  disabled: BoolCodeControl,
  loading: BoolCodeControl,
  style: ButtonStyleControl,
  viewRef: RefControl,
  userId: withDefault(stringExposingStateControl(""), "{{meeting1.localUser}}"),
  profileImageUrl: withDefault(
    StringStateControl,
    "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Peanut&radius=50&backgroundColor=transparent&randomizeIds=true&eyes=wink,sleepClose"
  ),
  noVideoText: stringExposingStateControl(trans("meeting.noVideo")),
};

let VideoCompBuilder = (function () {
  return new UICompBuilder(meetingStreamChildren, (props: any) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const conRef = useRef<HTMLDivElement>(null);
    const [userId, setUserId] = useState();
    const [userName, setUsername] = useState("");
    const [showVideo, setVideo] = useState(true);

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
            // console.log("user-unpublished");

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
        setVideo(userData.streamingVideo);
      }
    }, [props.userId.value]);
    // console.log("userId", userId);
    

    return (
      <EditorContext.Consumer>
        {(editorState: any) => (
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
                    display: `${showVideo ? "flex" : "none"}`,
                    aspectRatio: props.videoAspectRatio,
                    borderRadius: props.style.radius,
                    width: "auto",
                  }}
                  id={userId}
                ></VideoContainer>
              ) : (
                <></>
              )}
              <div
                style={{
                  flexDirection: "column",
                  alignItems: "center",
                  display: `${!showVideo || userId ? "flex" : "none"}`,
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
    .setPropertyViewFn((children: any) => (
      <>
        <Section name={sectionNames.basic}>
          {children.userId.propertyView({ label: trans("meeting.videoId") })}

          {children.profileImageUrl.propertyView({
            label: trans("meeting.profileImageUrl"),
            placeholder:
              "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Peanut&radius=50&backgroundColor=transparent&randomizeIds=true&eyes=wink,sleepClose",
          })}
        </Section>

        {/* {(useContext(EditorContext).editorModeStatus === "logic" ||
          useContext(EditorContext).editorModeStatus === "both") && (
          <Section name={sectionNames.interaction}>
            {children.onEvent.getPropertyView()}
            {hiddenPropertyView(children)}
          </Section>
        )}

        {(useContext(EditorContext).editorModeStatus === "layout" ||
          useContext(EditorContext).editorModeStatus === "both") && (
          <> */}
        <Section name={sectionNames.layout}>
          {children.autoHeight.getPropertyView()}
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
        {/* </> */}
        {/* )} */}
      </>
    ))
    .build();
})();

VideoCompBuilder = class extends VideoCompBuilder {
  autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }
};

export const VideoMeetingStreamComp = withExposingConfigs(VideoCompBuilder, [
  new NameConfig("loading", trans("meeting.loadingDesc")),
  new NameConfig("profileImageUrl", trans("meeting.profileImageUrl")),

  ...CommonNameConfig, 
]);
