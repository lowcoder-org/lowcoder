import {
  NameConfig,
  withDefault,
  withExposingConfigs,
  StringControl,
  Section,
  sectionNames,
  AutoHeightControl,
  styled,
  MeetingEventHandlerControl,
  BoolCodeControl,
  RefControl,
  stringExposingStateControl,
  UICompBuilder,
  CommonNameConfig,
} from "lowcoder-sdk";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import {
  client,
  playScreenShareToElement,
} from "./meetingControllerComp";
import { trans } from "../../i18n/comps";
import { useResizeDetector } from "react-resize-detector";
import { ButtonStyleControl } from "./videobuttonCompConstants";
import {
  meetingShareElementId,
  meetingStreamTargetUid,
  parseMeetingParticipant,
} from "./meetingStreamUtils";

const VideoContainer = styled.video`
  height: 100%;
  width: 100%;
  object-fit: contain;
`;

const sharingStreamChildren = {
  autoHeight: withDefault(AutoHeightControl, "fixed"),
  profilePadding: withDefault(StringControl, "0px"),
  profileBorderRadius: withDefault(StringControl, "0px"),
  videoAspectRatio: withDefault(StringControl, ""),
  onEvent: MeetingEventHandlerControl,
  disabled: BoolCodeControl,
  loading: BoolCodeControl,
  style: ButtonStyleControl,
  viewRef: RefControl,
  userId: withDefault(stringExposingStateControl(""), "{{meeting1.localUser}}"),
  noVideoText: stringExposingStateControl(trans("meeting.noVideo")),
};

let SharingCompBuilder = (function () {
  return new UICompBuilder(sharingStreamChildren, (props: any) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const conRef = useRef<HTMLDivElement>(null);

    const streamTargetUid = useMemo(
      () => meetingStreamTargetUid(props.userId.value),
      [props.userId.value]
    );

    const participant = useMemo(
      () => parseMeetingParticipant(props.userId.value),
      [props.userId.value]
    );

    const showVideoSharing = participant?.streamingSharing ?? false;
    const shareElementId = streamTargetUid
      ? meetingShareElementId(streamTargetUid)
      : "";

    const isLocalTarget =
      streamTargetUid !== "" &&
      client.uid != null &&
      String(client.uid) === streamTargetUid;

    // Mount the <video> first, then attach the Agora track (re-attach on publish only).
    useEffect(() => {
      if (!streamTargetUid || !showVideoSharing || !shareElementId) {
        return;
      }

      let cancelled = false;

      const attach = () => {
        if (cancelled) {
          return;
        }
        void playScreenShareToElement(streamTargetUid, isLocalTarget);
      };

      const onUserPublished = (
        user: IAgoraRTCRemoteUser,
        mediaType: "video" | "audio"
      ) => {
        if (mediaType !== "video" || String(user.uid) !== streamTargetUid) {
          return;
        }
        attach();
      };

      client.on("user-published", onUserPublished);

      const rafId = requestAnimationFrame(() => {
        requestAnimationFrame(attach);
      });
      const timers = [300, 1000, 2000].map((ms) =>
        window.setTimeout(attach, ms)
      );

      return () => {
        cancelled = true;
        cancelAnimationFrame(rafId);
        timers.forEach((id) => window.clearTimeout(id));
        client.off("user-published", onUserPublished);
      };
    }, [streamTargetUid, showVideoSharing, shareElementId, isLocalTarget]);

    const containerStyle = useMemo(
      () => ({
        display: showVideoSharing ? "flex" : "none",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        overflow: "hidden",
        borderRadius: props?.style?.radius,
        aspectRatio: props?.videoAspectRatio,
        backgroundColor: props.style?.background,
        padding: props.style?.padding,
        margin: props.style?.margin,
      }),
      [
        showVideoSharing,
        props?.style?.radius,
        props.style?.background,
        props.style?.padding,
        props.style?.margin,
        props.videoAspectRatio,
      ]
    );

    const videoStyle = useMemo(
      () => ({
        width: "100%",
        height: "100%",
        aspectRatio: props.videoAspectRatio,
        borderRadius: props.style.radius,
      }),
      [props.videoAspectRatio, props.style.radius]
    );

    const onVideoClick = useCallback(() => {
      props.onEvent("videoClicked");
    }, [props.onEvent]);

    useResizeDetector({
      targetRef: conRef,
    });

    return (
      <div ref={conRef} style={containerStyle}>
        {showVideoSharing && streamTargetUid ? (
          <VideoContainer
            onClick={onVideoClick}
            ref={videoRef}
            style={videoStyle}
            id={shareElementId}
          />
        ) : null}
      </div>
    );
  })
    .setPropertyViewFn((children: any) => (
      <>
        <Section name={sectionNames.basic}>
          {children.userId.propertyView({ label: trans("meeting.videoId") })}
        </Section>

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
          {children.style?.getPropertyView()}
        </Section>
      </>
    ))
    .build();
})();

SharingCompBuilder = class extends SharingCompBuilder {
  autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }
};

export const VideoSharingStreamComp = withExposingConfigs(SharingCompBuilder, [
  new NameConfig("loading", trans("meeting.loadingDesc")),
  ...CommonNameConfig,
]);
