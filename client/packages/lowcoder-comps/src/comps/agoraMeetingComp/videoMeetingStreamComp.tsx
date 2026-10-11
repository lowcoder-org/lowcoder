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
  StringStateControl,
  UICompBuilder, 
  CommonNameConfig,
} from "lowcoder-sdk";
import { ButtonStyleControl } from "./videobuttonCompConstants";
import { trans } from "../../i18n/comps";

import { client } from "./meetingControllerComp";
import { parseMeetingParticipant } from "./meetingStreamUtils";
import type { IAgoraRTCRemoteUser, ILocalVideoTrack } from "agora-rtc-sdk-ng";
import type { CSSProperties, RefObject } from "react";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useResizeDetector } from "react-resize-detector";

const VideoContainer = styled.div`
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

function meetingStreamTargetUid(raw: string): string {
  if (!raw) return "";
  try {
    const d = JSON.parse(raw);
    if (d == null || d.user == null) return "";
    return String(d.user);
  } catch {
    return "";
  }
}

type MeetingStreamViewProps = {
  videoRef: RefObject<HTMLVideoElement>;
  conRef: RefObject<HTMLDivElement>;
  containerStyle: CSSProperties;
  videoStyle: CSSProperties;
  profileWrapStyle: CSSProperties;
  imgStyle: CSSProperties;
  userId: string | number | undefined;
  userName: string;
  profileImageUrl: string;
  onVideoClick: () => void;
};

const MeetingStreamView = memo(function MeetingStreamView({
  videoRef,
  conRef,
  containerStyle,
  videoStyle,
  profileWrapStyle,
  imgStyle,
  userId,
  userName,
  profileImageUrl,
  onVideoClick,
}: MeetingStreamViewProps) {
  return (
    <div ref={conRef} style={containerStyle}>
      <VideoContainer
        onClick={onVideoClick}
        ref={videoRef}
        style={videoStyle}
        id={userId != null ? String(userId) : undefined}
      />
      <div style={profileWrapStyle}>
        <img alt="" style={imgStyle} src={profileImageUrl} />
        {/* <p style={{ margin: "0" }}>{userName ?? ""}</p> */}
      </div>
    </div>
  );
});

let VideoCompBuilder = (function () {
  return new UICompBuilder(meetingStreamChildren, (props: any) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const conRef = useRef<HTMLDivElement>(null);
    const [userId, setUserId] = useState<string | number | undefined>();
    const [userName, setUsername] = useState("");
    const [showVideo, setVideo] = useState(true);

    const streamTargetUid = useMemo(
      () => meetingStreamTargetUid(props.userId.value),
      [props.userId.value]
    );

    const isScreenSharing = useMemo(
      () => !!parseMeetingParticipant(props.userId.value)?.streamingSharing,
      [props.userId.value]
    );

    useEffect(() => {
      if (props.userId.value === "") {
        return;
      }
      try {
        const d = JSON.parse(props.userId.value);
        setUserId(d.user);
        setUsername(d.userName ?? "");
        setVideo(d.streamingVideo !== false && !d.streamingSharing);
      } catch {
        /* ignore */
      }
    }, [props.userId.value]);

    useEffect(() => {
      if (!streamTargetUid || isScreenSharing) {
        return;
      }

      let cancelled = false;

      const targetUidStr = streamTargetUid;

      const playLocalVideo = async () => {
        const videoTrack = client.localTracks.find(
          (t) => t.trackMediaType === "video"
        ) as ILocalVideoTrack | undefined;
        if (!videoTrack) {
          return;
        }
        try {
          if (cancelled) {
            return;
          }
          const element = document.getElementById(targetUidStr);
          if (element) {
            videoTrack.play(targetUidStr);
          }
        } catch {
          // play race — ignore
        }
      };

      const playRemoteVideo = async (user: IAgoraRTCRemoteUser) => {
        const uidStr = user.uid + "";
        if (!user.hasVideo) {
          return;
        }
        try {
          const track =
            user.videoTrack ?? (await client.subscribe(user, "video"));
          if (cancelled) {
            return;
          }
          const element = document.getElementById(uidStr);
          if (element) {
            try {
              track.stop();
            } catch {
              /* ignore */
            }
            track.play(uidStr);
          }
        } catch {
          // Already subscribed, user left, or subscribe race — ignore
        }
      };

      const playRemoteAudio = async (user: IAgoraRTCRemoteUser) => {
        if (!user.hasAudio) {
          return;
        }
        try {
          const track =
            user.audioTrack ?? (await client.subscribe(user, "audio"));
          if (cancelled) {
            return;
          }
          track.play();
        } catch {
          // ignore
        }
      };

      const resyncTracksForThisTile = async () => {
        if (isScreenSharing) {
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
          const remote = client.remoteUsers.find(
            (u) => String(u.uid) === targetUidStr
          );
          try {
            remote?.videoTrack?.stop();
          } catch {
            /* ignore */
          }
          return;
        }
        if (
          client.uid !== undefined &&
          targetUidStr !== "" &&
          String(client.uid) === targetUidStr
        ) {
          await playLocalVideo();
          return;
        }
        const user = client.remoteUsers.find(
          (u) => String(u.uid) === targetUidStr
        );
        if (!user) {
          return;
        }
        if (user.hasVideo) {
          await playRemoteVideo(user);
        }
        if (user.hasAudio) {
          await playRemoteAudio(user);
        }
      };

      const isRemotePublisher = (uid: string | number) =>
        String(uid) !== String(client.uid ?? "");

      const onUserPublished = async (
        user: IAgoraRTCRemoteUser,
        mediaType: "video" | "audio"
      ) => {
        if (String(user.uid) !== targetUidStr) {
          return;
        }
        if (mediaType === "video") {
          if (isScreenSharing) {
            return;
          }
          if (user.hasVideo && isRemotePublisher(user.uid)) {
            props.onEvent("videoOn");
          }
          await playRemoteVideo(user);
        }
        if (mediaType === "audio") {
          if (user.hasAudio && isRemotePublisher(user.uid)) {
            props.onEvent("audioUnmuted");
          }
          await playRemoteAudio(user);
        }
      };

      const onUserUnpublished = (
        user: IAgoraRTCRemoteUser,
        mediaType: "video" | "audio"
      ) => {
        if (String(user.uid) !== targetUidStr) {
          return;
        }
        if (mediaType === "audio") {
          if (!user.hasAudio && isRemotePublisher(user.uid)) {
            props.onEvent("audioMuted");
          }
        }
        if (mediaType === "video") {
          if (videoRef.current && videoRef.current.id === user.uid + "") {
            videoRef.current.srcObject = null;
          }
          if (!user.hasVideo && isRemotePublisher(user.uid)) {
            props.onEvent("videoOff");
          }
        }
      };

      client.on("user-published", onUserPublished);
      client.on("user-unpublished", onUserUnpublished);

      // user-published does not fire for the local publisher; remoteUsers never
      // includes the local uid. After paint, attach the correct track (local or remote).
      const rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          void resyncTracksForThisTile();
        });
      });

      const retryTimers: number[] = [];
      if (targetUidStr) {
        [300, 1000, 2000].forEach((ms) => {
          retryTimers.push(
            window.setTimeout(() => {
              if (!cancelled) {
                void resyncTracksForThisTile();
              }
            }, ms)
          );
        });
      }

      return () => {
        cancelled = true;
        cancelAnimationFrame(rafId);
        retryTimers.forEach((id) => window.clearTimeout(id));
        client.off("user-published", onUserPublished);
        client.off("user-unpublished", onUserUnpublished);
      };
    }, [streamTargetUid, isScreenSharing]);

    const containerStyle = useMemo(
      () =>
        ({
          display: "flex",
          alignItems: "center",
          height: "100%",
          overflow: "hidden",
          borderRadius: props.style.radius,
          aspectRatio: props.videoAspectRatio,
          backgroundColor: props.style.background,
          padding: props.style.padding,
          margin: props.style.margin,
          borderColor: props.style.border,
          borderWidth: props.style.borderWidth,
          borderStyle: props.style.borderStyle,
        }) as CSSProperties,
      [
        props.style.radius,
        props.style.background,
        props.style.padding,
        props.style.margin,
        props.videoAspectRatio,
        props.style.borderWidth,
        props.style.borderStyle,
        props.style.border,
      ]
    );

    const videoStyle = useMemo(
      () =>
        ({
          display: showVideo ? "flex" : "none",
          aspectRatio: props.videoAspectRatio,
          borderRadius: props.style.radius,
          width: "auto",
        }) as CSSProperties,
      [showVideo, props.videoAspectRatio, props.style.radius]
    );

    const profileWrapStyle = useMemo(
      () =>
        ({
          flexDirection: "column",
          alignItems: "center",
          display: !showVideo || userId ? "flex" : "none",
          margin: "0 auto",
          padding: props.profilePadding,
        }) as CSSProperties,
      [showVideo, userId, props.profilePadding]
    );

    const imgStyle = useMemo(
      () =>
        ({
          borderRadius: props.profileBorderRadius,
          width: "100%",
          overflow: "hidden",
        }) as CSSProperties,
      [props.profileBorderRadius]
    );

    const onVideoClick = useCallback(() => {
      props.onEvent("videoClicked");
    }, [props.onEvent]);

    useResizeDetector({
      targetRef: conRef,
    });

    return (
      // <EditorContext.Consumer>
      //   {() => (
          <MeetingStreamView
            videoRef={videoRef}
            conRef={conRef}
            containerStyle={containerStyle}
            videoStyle={videoStyle}
            profileWrapStyle={profileWrapStyle}
            imgStyle={imgStyle}
            userId={userId}
            userName={userName}
            profileImageUrl={props.profileImageUrl.value}
            onVideoClick={onVideoClick}
          />
      //   )}
      // </EditorContext.Consumer>
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
