import {
  NameConfig,
  BoolControl,
  withDefault,
  withExposingConfigs,
  StringControl,
  Section,
  sectionNames,
  styleControl,
  BooleanStateControl,
  AutoHeightControl,
  stringStateControl,
  InnerGrid,
  useUserViewMode,
  getData,
  gridItemCompToGridItems,
  Layers,
  isNumeric,
  withMethodExposing,
  eventHandlerControl,
  DrawerStyle,
  PositionControl,
  jsonObjectExposingStateControl,
  stateComp,
  Drawer,
  changeChildAction,
  HintPlaceHolder,
  // styledm,
  // DrawerWrapper,
  BackgroundColorContext,
  ContainerCompBuilder,
  closeEvent,
  MeetingEventHandlerControl,
} from "lowcoder-sdk";
import { default as CloseOutlined } from "@ant-design/icons/CloseOutlined";
// import { default as Button } from "antd/es/button";

const EventOptions = [closeEvent] as const;
import { trans } from "../../i18n/comps";
// const DrawerWrapper = styledm.div`
//   // Shield the mouse events of the lower layer, the mask can be closed in the edit mode to prevent the lower layer from sliding
//   pointer-events: auto;
// `;
import AgoraRTC, {
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
  type IAgoraRTCClient,
  type IAgoraRTCRemoteUser,
  type UID,
  type ILocalVideoTrack,
  type IRemoteVideoTrack,
} from "agora-rtc-sdk-ng";

import AgoraRtmSdk, { RTMEvents } from "agora-rtm-sdk";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ResizeHandle } from "react-resizable";
import { v4 as uuidv4 } from "uuid";
import { meetingShareElementId } from "./meetingStreamUtils";

const DEFAULT_SIZE = 378;
const DEFAULT_PADDING = 16;
function transToPxSize(size: string | number) {
  return isNumeric(size) ? size + "px" : (size as string);
}

export const client: IAgoraRTCClient = AgoraRTC.createClient({
  mode: "rtc",
  codec: "vp8",
});

AgoraRTC.setLogLevel(4);

/* 
0: DEBUG. Output all API logs.
1: INFO. Output logs of the INFO, WARNING and ERROR level.
2: WARNING. Output logs of the WARNING and ERROR level.
3: ERROR. Output logs of the ERROR level.
4: NONE. Do not output any log. 
*/

let audioTrack: IMicrophoneAudioTrack | undefined;
let videoTrack: ICameraVideoTrack | undefined;
let screenShareStream: ILocalVideoTrack | undefined;
let screenShareTrackEndedHandler: (() => void) | null = null;
let screenShareTeardownInFlight = false;
let userId: UID | null | undefined;
let rtmClient: InstanceType<typeof AgoraRtmSdk.RTM> | undefined;
/** Serializes leave/join across app navigations (singleton RTC client). */
let channelLeavePromise: Promise<void> = Promise.resolve();
/** MESSAGE channel name subscribed after login (same as RTC channel / meeting name). */
let rtmSubscribedChannelName: string | null = null;
/** RTM channel payload: sync local mic/camera to other clients (setEnabled may not fire user-unpublished). */
const RTM_MEETING_USER_STATE = "meetingUserState" as const;
/** Ask everyone on the channel to re-send meetingUserState (joiner may have missed earlier RTM). */
const RTM_MEETING_REQUEST_PRESENCE = "meetingRequestPresence" as const;

const rtmMessageSinkRef: {
  current: null | ((event: RTMEvents.MessageEvent) => void);
} = { current: null };

function onRtmMessage(event: RTMEvents.MessageEvent) {
  rtmMessageSinkRef.current?.(event);
}

/** Invokes broadcastLocalMeetingUserState with latest mic/video/name snapshot (see React effect). */
const presenceRequestSinkRef: { current: null | (() => void) } = {
  current: null,
};

/** Sync sharing control + RTM when the browser stops screen capture (track-ended). */
const screenShareEndedSinkRef: { current: null | (() => void) } = {
  current: null,
};

/** Dedupe by stringified id so RTC numeric uid and RTM string uid stay one row. */
function meetingParticipantsDedupe(arr: any[], prop: string) {
  const byKey = new Map<string, any>();
  for (const obj of arr) {
    if (obj == null || obj[prop] === undefined || obj[prop] === null) {
      continue;
    }
    const key = String(obj[prop]);
    const prev = byKey.get(key);
    byKey.set(key, prev ? { ...prev, ...obj } : { ...obj });
  }
  return Array.from(byKey.values());
}

// const ButtonStyle = styledm(Button)`
//   position: absolute;
//   left: 0;
//   top: 0;
//   z-index: 10;
//   font-weight: 700;
//   box-shadow: none;
//   color: rgba(0, 0, 0, 0.45);
//   height: 54px;
//   width: 54px;

//   svg {
//     width: 16px;
//     height: 16px;
//   }

//   &,
//   :hover,
//   :focus {
//     background-color: transparent;
//     border: none;
//   }

//   :hover,
//   :focus {
//     color: rgba(0, 0, 0, 0.75);
//   }
// `;
function isClientInChannel(): boolean {
  const state = client.connectionState;
  return (
    state === "CONNECTED" ||
    state === "CONNECTING" ||
    state === "RECONNECTING" ||
    state === "DISCONNECTING"
  );
}

function isCameraTrackUsable(
  track: ICameraVideoTrack | undefined
): track is ICameraVideoTrack {
  return !!track && !(track as { closed?: boolean }).closed;
}

function isAudioTrackUsable(
  track: IMicrophoneAudioTrack | undefined
): track is IMicrophoneAudioTrack {
  return !!track && !(track as { closed?: boolean }).closed;
}

const turnOnCamera = async (flag?: boolean) => {
  if (isCameraTrackUsable(videoTrack)) {
    return videoTrack.setEnabled(flag!);
  }
  videoTrack = await AgoraRTC.createCameraVideoTrack();
  if (userId != null && userId !== "") {
    videoTrack.play(userId + "");
  }
};

const turnOnMicrophone = async (flag?: boolean) => {
  if (isAudioTrackUsable(audioTrack)) {
    await audioTrack.setEnabled(flag!);
    if (flag) {
      try {
        await client.publish(audioTrack);
      } catch {
        /* already published */
      }
    } else {
      try {
        await client.unpublish(audioTrack);
      } catch {
        /* already unpublished */
      }
    }
    return;
  }
  audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  if (flag) {
    await client.publish(audioTrack);
  }
};
function playTrackWhenElementReady(
  track: ILocalVideoTrack,
  elementId: string,
  attempt = 0
) {
  const el = document.getElementById(elementId);
  if (el) {
    try {
      track.stop();
    } catch {
      /* not playing yet */
    }
    track.play(elementId);
    return;
  }
  if (attempt < 30) {
    requestAnimationFrame(() =>
      playTrackWhenElementReady(track, elementId, attempt + 1)
    );
  }
}

type ScreenShareAttachState = {
  elementId: string;
  track: ILocalVideoTrack | IRemoteVideoTrack;
};

const screenShareAttachByUid = new Map<string, ScreenShareAttachState>();

function clearScreenShareAttach(targetUid: string) {
  screenShareAttachByUid.delete(targetUid);
}

function isScreenShareAttached(
  targetUid: string,
  elementId: string,
  track: ILocalVideoTrack | IRemoteVideoTrack
): boolean {
  const prev = screenShareAttachByUid.get(targetUid);
  return (
    prev?.elementId === elementId &&
    prev.track === track &&
    track.isPlaying
  );
}

/** Attach local or remote screen-share video to the tile for `targetUid`. */
export async function playScreenShareToElement(
  targetUid: string,
  isLocalPublisher: boolean
): Promise<boolean> {
  const elementId = meetingShareElementId(targetUid);
  const el = document.getElementById(elementId);
  if (!el) {
    return false;
  }

  try {
    if (isLocalPublisher) {
      const track =
        screenShareStream ??
        (client.localTracks.find(
          (t) => t.trackMediaType === "video"
        ) as ILocalVideoTrack | undefined);
      if (!track) {
        clearScreenShareAttach(targetUid);
        return false;
      }
      if (isScreenShareAttached(targetUid, elementId, track)) {
        return true;
      }
      try {
        track.stop();
      } catch {
        /* ignore */
      }
      track.play(elementId);
      screenShareAttachByUid.set(targetUid, { elementId, track });
      return true;
    }

    const user = client.remoteUsers.find((u) => String(u.uid) === targetUid);
    if (!user?.hasVideo) {
      clearScreenShareAttach(targetUid);
      return false;
    }
    const track =
      user.videoTrack ?? (await client.subscribe(user, "video"));
    if (isScreenShareAttached(targetUid, elementId, track)) {
      return true;
    }
    try {
      track.stop();
    } catch {
      /* ignore */
    }
    track.play(elementId);
    screenShareAttachByUid.set(targetUid, { elementId, track });
    return true;
  } catch {
    clearScreenShareAttach(targetUid);
    return false;
  }
}

function unbindScreenShareTrackEnded() {
  if (screenShareStream && screenShareTrackEndedHandler) {
    try {
      screenShareStream.off("track-ended", screenShareTrackEndedHandler);
    } catch {
      /* ignore */
    }
  }
  screenShareTrackEndedHandler = null;
}

function bindScreenShareTrackEnded(track: ILocalVideoTrack) {
  unbindScreenShareTrackEnded();
  screenShareTrackEndedHandler = () => {
    void handleScreenShareStoppedByBrowser();
  };
  track.on("track-ended", screenShareTrackEndedHandler);
}

async function teardownScreenShareTrack(): Promise<void> {
  unbindScreenShareTrackEnded();
  const track = screenShareStream;
  if (!track) {
    return;
  }
  screenShareStream = undefined;
  try {
    await client.unpublish(track);
  } catch {
    /* already unpublished when the browser ended capture */
  }
  try {
    track.close();
  } catch {
    /* ignore */
  }
  if (userId != null && userId !== "") {
    clearScreenShareAttach(String(userId));
  }
}

async function republishCameraAfterScreenShare(): Promise<void> {
  if (!videoTrack) {
    return;
  }
  try {
    await client.publish(videoTrack);
    if (userId != null && userId !== "") {
      videoTrack.play(userId + "");
    }
  } catch {
    /* ignore */
  }
}

async function handleScreenShareStoppedByBrowser(): Promise<void> {
  if (screenShareTeardownInFlight) {
    return;
  }
  screenShareTeardownInFlight = true;
  try {
    await teardownScreenShareTrack();
    await republishCameraAfterScreenShare();
    screenShareEndedSinkRef.current?.();
  } finally {
    screenShareTeardownInFlight = false;
  }
}

const shareScreen = async (sharing: boolean) => {
  try {
    if (sharing === false) {
      await teardownScreenShareTrack();
      await republishCameraAfterScreenShare();
    } else {
      screenShareStream = await AgoraRTC.createScreenVideoTrack(
        {
          screenSourceType: "screen",
        },
        "disable"
      );
      bindScreenShareTrackEnded(screenShareStream);
      if (videoTrack) {
        await client.unpublish(videoTrack);
      }
      await client.publish(screenShareStream);
      if (userId != null && userId !== "") {
        playTrackWhenElementReady(
          screenShareStream,
          meetingShareElementId(userId)
        );
      }
    }
  } catch (error) {
    console.error("Failed to create screen share stream:", error);
    screenShareStream = undefined;
    unbindScreenShareTrackEnded();
  }
};
async function closeLocalMediaTracks(): Promise<void> {
  unbindScreenShareTrackEnded();

  if (screenShareStream) {
    try {
      await client.unpublish(screenShareStream);
    } catch {
      /* ignore */
    }
    try {
      screenShareStream.close();
    } catch {
      /* ignore */
    }
    screenShareStream = undefined;
  }

  if (videoTrack) {
    try {
      await client.unpublish(videoTrack);
    } catch {
      /* ignore */
    }
    try {
      videoTrack.stop();
      videoTrack.close();
    } catch {
      /* ignore */
    }
    videoTrack = undefined;
  }

  if (audioTrack) {
    try {
      await client.unpublish(audioTrack);
    } catch {
      /* ignore */
    }
    try {
      audioTrack.stop();
      audioTrack.close();
    } catch {
      /* ignore */
    }
    audioTrack = undefined;
  }

  screenShareAttachByUid.clear();
}

async function teardownRtmClient(): Promise<void> {
  if (rtmClient && rtmSubscribedChannelName) {
    try {
      await rtmClient.unsubscribe(rtmSubscribedChannelName);
    } catch {
      /* ignore */
    }
    rtmSubscribedChannelName = null;
  }
  if (rtmClient) {
    try {
      rtmClient.removeEventListener("message", onRtmMessage);
    } catch {
      /* ignore */
    }
    try {
      await rtmClient.logout();
    } catch {
      /* ignore */
    }
    rtmClient = undefined;
  }
}

async function leaveChannelInternal(): Promise<void> {
  await closeLocalMediaTracks();
  if (isClientInChannel()) {
    try {
      await client.leave();
    } catch {
      /* ignore */
    }
  }
  await teardownRtmClient();
}

const leaveChannel = async () => {
  channelLeavePromise = channelLeavePromise
    .catch(() => {})
    .then(() => leaveChannelInternal());
  return channelLeavePromise;
};

async function ensureChannelLeft(): Promise<void> {
  await channelLeavePromise.catch(() => {});
  if (isClientInChannel()) {
    await leaveChannel();
    await channelLeavePromise.catch(() => {});
  }
};

/** Joins RTC + RTM; publishes camera only if creation succeeds (e.g. permission granted). */
const publishVideo = async (
  appId: string,
  channel: string,
  rtmToken: string,
  rtcToken: string
): Promise<boolean> => {
  await ensureChannelLeft();
  videoTrack = undefined;
  audioTrack = undefined;
  await client.join(appId, channel, rtcToken, userId);
  let videoPublished = false;
  try {
    await turnOnCamera(true);
    if (isCameraTrackUsable(videoTrack)) {
      await client.publish(videoTrack);
      videoPublished = true;
    }
  } catch (error) {
    console.warn(
      "Meeting: camera unavailable (permission denied or no device); joining without video.",
      error
    );
  }
  await rtmInit(appId, userId, rtmToken, channel);
  return videoPublished;
};

const sendMessageRtm = (message: any) => {
  if (!rtmClient || !rtmSubscribedChannelName) return;
  void rtmClient
    .publish(rtmSubscribedChannelName, JSON.stringify(message))
    .catch(() => {});
};

function broadcastLocalMeetingUserState(payload: {
  user: string;
  audiostatus: boolean;
  streamingVideo: boolean;
  streamingSharing?: boolean;
  speaking?: boolean;
  userName?: string;
}) {
  sendMessageRtm({
    type: RTM_MEETING_USER_STATE,
    time: Date.now(),
    user: payload.user,
    audiostatus: payload.audiostatus,
    streamingVideo: payload.streamingVideo,
    streamingSharing: payload.streamingSharing ?? false,
    speaking: payload.speaking ?? false,
    userName: payload.userName ?? "",
  });
}

function sendMeetingPresenceRequest() {
  sendMessageRtm({
    type: RTM_MEETING_REQUEST_PRESENCE,
    time: Date.now(),
  });
}

const sendPeerMessageRtm = (message: any, toId: string) => {
  if (!rtmClient) return;
  void rtmClient
    .publish(String(toId), JSON.stringify(message), { channelType: "USER" })
    .catch(() => {});
};

const rtmInit = async (appId: any, uid: any, token: any, channel: any) => {
  rtmClient = new AgoraRtmSdk.RTM(String(appId), String(uid));
  await rtmClient.login({ token: token ? String(token) : undefined });
  const channelName = String(channel);
  await rtmClient.subscribe(channelName);
  rtmSubscribedChannelName = channelName;
  rtmClient.addEventListener("message", onRtmMessage);
};

const CanvasContainerID = "__canvas_container__";
const meetingControllerChildren = {
  visible: withDefault(BooleanStateControl, "false"),
  onEvent: eventHandlerControl(EventOptions),
  onMeetingEvent: MeetingEventHandlerControl,
  width: StringControl,
  height: StringControl,
  autoHeight: AutoHeightControl,
  style: styleControl(DrawerStyle),
  placement: PositionControl,
  maskClosable: withDefault(BoolControl, true),
  showMask: withDefault(BoolControl, true),
  meetingActive: withDefault(BooleanStateControl, "false"),
  audioControl: withDefault(BooleanStateControl, "false"),
  videoControl: withDefault(BooleanStateControl, "true"),
  endCall: withDefault(BooleanStateControl, "false"),
  sharing: withDefault(BooleanStateControl, "false"),
  appId: withDefault(StringControl, trans("meeting.appid")),
  participants: (stateComp as any)([]) as ReturnType<typeof stateComp>,
  usersScreenShared: (stateComp as any)([]) as ReturnType<typeof stateComp>,
  localUser: jsonObjectExposingStateControl(""),
  localUserID: withDefault(
    stringStateControl(trans("meeting.localUserID")),
    uuidv4() + ""
  ),
  localUserName: withDefault(
    stringStateControl(trans("meeting.localUserName")),
    ""
  ),
  meetingName: withDefault(
    stringStateControl(trans("meeting.meetingName")),
    uuidv4() + ""
  ),
  rtmToken: stringStateControl(trans("meeting.rtmToken")),
  rtcToken: stringStateControl(trans("meeting.rtcToken")),
  messages: (stateComp as any)([]) as ReturnType<typeof stateComp>,
};

let MeetingControllerComp = () => (
  <div>
    Meeting Component is not available. It needs Lowcoder from Version v2.4
  </div>
);

if (typeof ContainerCompBuilder === "function") {
  let MTComp = (function () {
    return new ContainerCompBuilder(
      meetingControllerChildren,
      (props: any, dispatch: any) => {
        const isTopBom = ["top", "bottom"].includes(props.placement);
        const { items, ...otherContainerProps } = props.container;
        const userViewMode = useUserViewMode();
        const resizable = !userViewMode && (!isTopBom || !props.autoHeight);
        const onResizeStop = useCallback(
          (
            e: React.SyntheticEvent,
            node: HTMLElement,
            size: { width: number; height: number },
            handle: ResizeHandle
          ) => {
            isTopBom
              ? dispatch(changeChildAction("height", size.height, true))
              : dispatch(changeChildAction("width", size.width, true));
          },
          [dispatch, isTopBom]
        );
        const [localParticipants, setLocalParticipants] = useState<any[]>(
          () => {
            const p = props.participants as any;
            return Array.isArray(p) ? [...p] : [];
          }
        );
        const [updateVolume, setUpdateVolume] = useState<any>({
          update: false,
          userid: null,
        });
        const [rtmMessages, setRtmMessages] = useState<any>([]);
        const [localUserSpeaking, setLocalUserSpeaking] = useState<any>(false);
        const [localUserVideo, setLocalUserVideo] =
          useState<IAgoraRTCRemoteUser>();

        const sharingUserIdsRef = useRef<string[]>([]);

        const latestMeetingBroadcastRef = useRef({
          meetingActive: false,
          audiostatus: false,
          streamingVideo: false,
          streamingSharing: false,
          speaking: false,
          userName: "",
        });

        useEffect(() => {
          latestMeetingBroadcastRef.current = {
            meetingActive: !!props.meetingActive.value,
            audiostatus: !!props.audioControl.value,
            streamingVideo: !!props.videoControl.value,
            streamingSharing: !!props.sharing.value,
            speaking: !!localUserSpeaking,
            userName: String(props.localUserName.value ?? ""),
          };
        }, [
          props.meetingActive.value,
          props.audioControl.value,
          props.videoControl.value,
          props.sharing.value,
          props.localUserName.value,
          localUserSpeaking,
        ]);

        useEffect(() => {
          screenShareEndedSinkRef.current = () => {
            if (!props.sharing.value) {
              return;
            }
            props.sharing.onChange(false);
            setLocalParticipants((prevUsers) =>
              prevUsers.map((userInfo: any) => {
                if (
                  userId != null &&
                  userId !== "" &&
                  String(userInfo.user) === String(userId)
                ) {
                  return { ...userInfo, streamingSharing: false };
                }
                return userInfo;
              })
            );
            const localObject = {
              user: userId + "",
              audiostatus: props.audioControl.value,
              streamingVideo: props.videoControl.value,
              streamingSharing: false,
              speaking: localUserSpeaking,
              userName: props.localUserName.value,
            };
            props.localUser.onChange(localObject);
            if (
              props.meetingActive.value &&
              userId != null &&
              userId !== ""
            ) {
              broadcastLocalMeetingUserState({
                user: String(userId),
                audiostatus: props.audioControl.value,
                streamingVideo: props.videoControl.value,
                streamingSharing: false,
                speaking: !!localUserSpeaking,
                userName: props.localUserName.value,
              });
            }
          };
          return () => {
            screenShareEndedSinkRef.current = null;
          };
        }, [
          props.sharing,
          props.audioControl.value,
          props.videoControl.value,
          props.meetingActive.value,
          props.localUserName.value,
          localUserSpeaking,
        ]);

        useEffect(() => {
          presenceRequestSinkRef.current = () => {
            const snap = latestMeetingBroadcastRef.current;
            if (
              !snap.meetingActive ||
              userId == null ||
              userId === ""
            ) {
              return;
            }
            broadcastLocalMeetingUserState({
              user: String(userId),
              audiostatus: snap.audiostatus,
              streamingVideo: snap.streamingVideo,
              streamingSharing: snap.streamingSharing,
              speaking: snap.speaking,
              userName: snap.userName,
            });
          };
          return () => {
            presenceRequestSinkRef.current = null;
          };
        }, []);

        useEffect(() => {
          if (
            !props.meetingActive.value ||
            userId == null ||
            userId === ""
          ) {
            return;
          }
          if (!rtmClient || !rtmSubscribedChannelName) {
            return;
          }
          sendMeetingPresenceRequest();
        }, [props.meetingActive.value]);

        useEffect(() => {
          const exposed =
            userId != null && userId !== ""
              ? localParticipants.filter(
                  (u: any) => String(u.user) !== String(userId)
                )
              : localParticipants;
          dispatch(
            changeChildAction(
              "participants",
              getData(exposed).data,
              false
            )
          );
        }, [localParticipants, dispatch]);

        const sharingUserIdsKey = useMemo(
          () =>
            localParticipants
              .filter((p: any) => p.streamingSharing)
              .map((p: any) => String(p.user))
              .sort()
              .join(","),
          [localParticipants]
        );

        useEffect(() => {
          sharingUserIdsRef.current = sharingUserIdsKey
            ? sharingUserIdsKey.split(",")
            : [];
        }, [sharingUserIdsKey]);

        // Re-attach only when who is sharing changes — not on every speaking/RTM tick.
        useEffect(() => {
          const ids = sharingUserIdsRef.current;
          if (ids.length === 0) {
            return;
          }

          const syncSharingTiles = () => {
            for (const uid of ids) {
              void playScreenShareToElement(
                uid,
                userId != null &&
                  userId !== "" &&
                  String(userId) === uid
              );
            }
          };

          syncSharingTiles();
          const timers = [300, 1000, 2000].map((ms) =>
            window.setTimeout(syncSharingTiles, ms)
          );
          return () => timers.forEach((id) => window.clearTimeout(id));
        }, [sharingUserIdsKey]);

        // console.log("sharing", props.sharing);

        useEffect(() => {
          if (!updateVolume.userid) return;
          setLocalParticipants((prevUsers) =>
            prevUsers.map((userInfo: any) => {
              if (
                String(userInfo.user) === String(updateVolume.userid) &&
                userInfo.speaking != updateVolume.update
              ) {
                return { ...userInfo, speaking: updateVolume.update };
              }
              return userInfo;
            })
          );
        }, [updateVolume]);

        useEffect(() => {
          setLocalParticipants((prevUsers) =>
            prevUsers.map((userInfo: any) => {
              if (
                localUserVideo?.uid != null &&
                String(userInfo.user) === String(localUserVideo.uid)
              ) {
                return { ...userInfo, streamingSharing: props.sharing.value };
              }
              return userInfo;
            })
          );

          let localObject = {
            user: userId + "",
            audiostatus: props.audioControl.value,
            streamingVideo: props.videoControl.value,
            streamingSharing: props.sharing.value,
            speaking: localUserSpeaking,
            userName: props.localUserName.value,
          };
          props.localUser.onChange(localObject);

          if (props.meetingActive.value && userId != null && userId !== "") {
            broadcastLocalMeetingUserState({
              user: String(userId),
              audiostatus: props.audioControl.value,
              streamingVideo: props.videoControl.value,
              streamingSharing: props.sharing.value,
              speaking: localUserSpeaking,
              userName: props.localUserName.value,
            });
          }
        }, [props.sharing.value, props.localUserName.value]);

        // console.log("participants ", props.participants);

        useEffect(() => {
          setLocalParticipants((prevUsers) =>
            prevUsers.map((userInfo: any) => {
              if (
                localUserVideo?.uid != null &&
                String(userInfo.user) === String(localUserVideo.uid)
              ) {
                return {
                  ...userInfo,
                  streamingVideo: localUserVideo?.hasVideo,
                };
              }
              return userInfo;
            })
          );
        }, [localUserVideo?.hasVideo]);

        useEffect(() => {
          if (rtmMessages) {
            dispatch(
              changeChildAction("messages", getData(rtmMessages).data, false)
            );
          }
        }, [rtmMessages]);

        useEffect(() => {
          if (localUserSpeaking === true || localUserVideo) {
            let localObject = {
              user: userId + "",
              audiostatus: props.audioControl.value,
              streamingVideo: props.videoControl.value,
              streamingSharing: props.sharing.value,
              speaking: localUserSpeaking,
              userName: props.localUserName.value,
            };
            props.localUser.onChange(localObject);
          }
        }, [localUserSpeaking, props.localUserName.value]);

        useEffect(() => {
          if (!props.meetingActive.value || userId == null || userId === "") {
            return;
          }
          broadcastLocalMeetingUserState({
            user: String(userId),
            audiostatus: props.audioControl.value,
            streamingVideo: props.videoControl.value,
            streamingSharing: props.sharing.value,
            speaking: !!props.localUser.value?.speaking,
            userName: props.localUserName.value,
          });
        }, [props.localUserName.value]);

        useEffect(() => {
          rtmMessageSinkRef.current = (event: RTMEvents.MessageEvent) => {
            try {
              const raw =
                typeof event.message === "string"
                  ? event.message
                  : new TextDecoder().decode(event.message);
              const parsed = raw ? JSON.parse(raw) : null;
              if (event.channelType === "USER") {
                setRtmMessages((prevMessages: any[]) => {
                  const next = [...prevMessages];
                  if (next.length >= 500) next.shift();
                  return [
                    ...next,
                    { peermessage: parsed, from: event.publisher },
                  ];
                });
              } else if (
                event.channelType === "MESSAGE" &&
                rtmSubscribedChannelName &&
                event.channelName === rtmSubscribedChannelName
              ) {
                if (
                  parsed &&
                  typeof parsed === "object" &&
                  parsed.type === RTM_MEETING_REQUEST_PRESENCE
                ) {
                  presenceRequestSinkRef.current?.();
                }
                if (
                  parsed &&
                  typeof parsed === "object" &&
                  parsed.type === RTM_MEETING_USER_STATE &&
                  parsed.user != null
                ) {
                  const skipParticipantsUpdate =
                    userId != null &&
                    userId !== "" &&
                    String(parsed.user) === String(userId);
                  if (!skipParticipantsUpdate) {
                  setLocalParticipants((prev) => {
                    const uid = parsed.user;
                    let matched = false;
                    const next = prev.map((u: any) => {
                      if (String(u.user) === String(uid)) {
                        matched = true;
                        return {
                          ...u,
                          audiostatus: !!parsed.audiostatus,
                          streamingVideo:
                            parsed.streamingVideo !== undefined
                              ? parsed.streamingVideo
                              : u.streamingVideo,
                          speaking:
                            parsed.speaking !== undefined
                              ? parsed.speaking
                              : u.speaking,
                          userName:
                            parsed.userName !== undefined
                              ? parsed.userName
                              : u.userName,
                          streamingSharing:
                            parsed.streamingSharing !== undefined
                              ? parsed.streamingSharing
                              : u.streamingSharing,
                        };
                      }
                      return u;
                    });
                    const merged = matched
                      ? next
                      : [
                          ...next,
                          {
                            user: uid,
                            audiostatus: !!parsed.audiostatus,
                            streamingVideo:
                              parsed.streamingVideo !== undefined
                                ? parsed.streamingVideo
                                : true,
                            streamingSharing:
                              parsed.streamingSharing !== undefined
                                ? parsed.streamingSharing
                                : false,
                            speaking:
                              parsed.speaking !== undefined
                                ? parsed.speaking
                                : false,
                            userName:
                              parsed.userName !== undefined
                                ? parsed.userName
                                : "",
                          },
                        ];
                    return meetingParticipantsDedupe(
                      getData(merged).data,
                      "user"
                    );
                  });
                  }
                }
                if (
                  parsed == null ||
                  typeof parsed !== "object" ||
                  parsed.type !== RTM_MEETING_REQUEST_PRESENCE
                ) {
                  setRtmMessages((prevMessages: any[]) => {
                    const next = [...prevMessages];
                    if (next.length >= 500) next.shift();
                    return [
                      ...next,
                      {
                        channelmessage: parsed,
                        from: event.publisher,
                      },
                    ];
                  });
                }
              }
            } catch {
              /* ignore malformed payloads */
            }
          };
          return () => {
            rtmMessageSinkRef.current = null;
          };
        }, []);
        useEffect(() => {
          if (!client) {
            return;
          }

          client.enableAudioVolumeIndicator();

          const onUserJoined = (user: IAgoraRTCRemoteUser) => {
            if (
              userId != null &&
              userId !== "" &&
              String(user.uid) === String(userId)
            ) {
              return;
            }
            const userData = {
              user: user.uid,
              audiostatus: user.hasAudio,
              streamingVideo: true,
              streamingSharing: false,
              userName: "",
            };
            setLocalParticipants((prev) =>
              meetingParticipantsDedupe(
                getData([...prev, userData]).data,
                "user"
              )
            );
            const snap = latestMeetingBroadcastRef.current;
            if (snap.meetingActive && userId != null && userId !== "") {
              broadcastLocalMeetingUserState({
                user: String(userId),
                audiostatus: snap.audiostatus,
                streamingVideo: snap.streamingVideo,
                streamingSharing: snap.streamingSharing,
                speaking: snap.speaking,
                userName: snap.userName,
              });
            }
          };

          const onUserLeft = (user: IAgoraRTCRemoteUser) => {
            setLocalParticipants((prev) => {
              let newUsers = prev.filter(
                (item: any) => String(item.user) !== String(user.uid)
              );
              const hostExists = newUsers.some((f: any) => f.host === true);
              if (!hostExists && newUsers.length > 0) {
                newUsers = [
                  { ...newUsers[0], host: true },
                  ...newUsers.slice(1),
                ];
              }
              return meetingParticipantsDedupe(getData(newUsers).data, "user");
            });
          };

          const onVolumeIndicator = (volumeInfos: any) => {
            if (volumeInfos.length === 0) return;
            volumeInfos.map((volumeInfo: any) => {
              const speaking = volumeInfo.level >= 30;
              if (
                volumeInfo.uid === userId &&
                props.localUser.value.speaking != speaking
              ) {
                setLocalUserSpeaking(speaking);
              } else {
                setUpdateVolume({ update: speaking, userid: volumeInfo.uid });
              }
            });
          };

          const onUserPublished = async (
            user: IAgoraRTCRemoteUser,
            mediaType: "video" | "audio"
          ) => {
            setTimeout(() => {
              setLocalUserVideo(user);
            }, 1000);
            if (mediaType !== "video") {
              return;
            }
            const uid = String(user.uid);
            if (!sharingUserIdsRef.current.includes(uid)) {
              return;
            }
            const attachShare = () => {
              void playScreenShareToElement(
                uid,
                userId != null && userId !== "" && String(userId) === uid
              );
            };
            attachShare();
            [300, 1000, 2000].forEach((ms) =>
              window.setTimeout(attachShare, ms)
            );
          };

          const onUserUnpublished = (
            user: IAgoraRTCRemoteUser,
            mediaType: "video" | "audio"
          ) => {
            setLocalUserVideo(user);
            if (mediaType === "video") {
              clearScreenShareAttach(String(user.uid));
            }
          };

          client.on("user-joined", onUserJoined);
          client.on("user-left", onUserLeft);
          client.on("volume-indicator", onVolumeIndicator);
          client.on("user-published", onUserPublished);
          client.on("user-unpublished", onUserUnpublished);

          return () => {
            client.off("user-joined", onUserJoined);
            client.off("user-left", onUserLeft);
            client.off("volume-indicator", onVolumeIndicator);
            client.off("user-published", onUserPublished);
            client.off("user-unpublished", onUserUnpublished);
          };
        }, [client]);

        return (
          <BackgroundColorContext.Provider value={props.style.background}>
            {/* <DrawerWrapper> */}
            <Drawer
              resizable={resizable}
              onResizeStop={onResizeStop}
              rootStyle={
                props.visible.value
                  ? { overflow: "auto", pointerEvents: "auto" }
                  : {}
              }
              styles={{
                wrapper: {
                  maxHeight: "100%",
                  maxWidth: "100%",
                },
                body: {
                  padding: 0,
                  backgroundColor: props.style.background,
                },
              }}
              closable={false}
              placement={props.placement}
              open={props.visible.value}
              getContainer={() =>
                document.querySelector(`#${CanvasContainerID}`) || document.body
              }
              footer={null}
              width={transToPxSize(props.width || DEFAULT_SIZE)}
              height={
                !props.autoHeight
                  ? transToPxSize(props.height || DEFAULT_SIZE)
                  : ""
              }
              onClose={(e: any) => {
                props.visible.onChange(false);
              }}
              afterOpenChange={(visible: any) => {
                if (!visible) {
                  props.onEvent("close");
                }
              }}
              zIndex={Layers.drawer}
              maskClosable={props.maskClosable}
              mask={props.showMask}
            >
              {/* <ButtonStyle
                onClick={() => {
                  props.visible.onChange(false);
                }}
              >
                <CloseOutlined />
              </ButtonStyle> */}
              <InnerGrid
                {...otherContainerProps}
                items={gridItemCompToGridItems(items)}
                autoHeight={props.autoHeight}
                minHeight={isTopBom ? DEFAULT_SIZE + "px" : "100%"}
                style={{ height: "100%" }}
                containerPadding={[DEFAULT_PADDING, DEFAULT_PADDING]}
                hintPlaceholder={HintPlaceHolder}
                bgColor={props.style.background}
              />
            </Drawer>
            {/* </DrawerWrapper> */}
          </BackgroundColorContext.Provider>
        );
      }
    )
      .setPropertyViewFn((children: any) => (
        <>
          {/* {(EditorContext.editorModeStatus === "logic" ||
            EditorContext.editorModeStatus === "both") && (
            <> */}
          <Section name={sectionNames.meetings}>
            {children.appId.propertyView({
              label: trans("meeting.appid"),
            })}
            {children.meetingName.propertyView({
              label: trans("meeting.meetingName"),
            })}
            {children.localUserID.propertyView({
              label: trans("meeting.localUserID"),
            })}
            {children.localUserName.propertyView({
              label: trans("meeting.localUserName"),
            })}
            {children.rtmToken.propertyView({
              label: trans("meeting.rtmToken"),
            })}
            {children.rtcToken.propertyView({
              label: trans("meeting.rtcToken"),
            })}
          </Section>
          <Section name={sectionNames.interaction}>
            {children.onEvent.getPropertyView()}
            {children.onMeetingEvent.getPropertyView()}
          </Section>
          {/* </>
          )} */}

          {/* {(EditorContext.editorModeStatus === "layout" ||
            EditorContext.editorModeStatus === "both") && (
            <> */}
          {/* <Section name={sectionNames.layout}>
                {children.placement.propertyView({
                  label: trans("meeting.placement"),
                  radioButton: true,
                })}
                {["top", "bottom"].includes(children.placement.getView())
                  ? children.autoHeight.getPropertyView()
                  : children.width.propertyView({
                      label: trans("meeting.width"),
                      tooltip: trans("meeting.widthTooltip"),
                      placeholder: DEFAULT_SIZE + "",
                    })}
                {!children.autoHeight.getView() &&
                  ["top", "bottom"].includes(children.placement.getView()) &&
                  children.height.propertyView({
                    label: trans("meeting.height"),
                    tooltip: trans("meeting.heightTooltip"),
                    placeholder: DEFAULT_SIZE + "",
                  })}
                {children.maskClosable.propertyView({
                  label: trans("meeting.maskClosable"),
                })}
                {children.showMask.propertyView({
                  label: trans("meeting.showMask"),
                })}
              </Section>

              <Section name={sectionNames.style}>
                {children.style.getPropertyView()}
              </Section> */}
          {/* </> */}
          {/* )} */}
        </>
      ))
      .build();
  })();

  MTComp = class extends MTComp {
    autoHeight(): boolean {
      return false;
    }
  };

  MTComp = withMethodExposing(MTComp, [
    {
      method: {
        name: "openDrawer",
        params: [],
      },
      execute: (comp: any, values: any) => {
        comp.children.visible.getView().onChange(true);
      },
    },
    {
      method: {
        name: "startSharing",
        params: [],
      },
      execute: async (comp: any, values: any) => {
        if (!comp.children.meetingActive.getView().value) return;
        let sharing = !comp.children.sharing.getView().value;
        await shareScreen(sharing);
        comp.children.sharing.change(sharing);
        if (userId != null && userId !== "") {
          broadcastLocalMeetingUserState({
            user: String(userId),
            audiostatus: comp.children.audioControl.getView().value,
            streamingVideo: comp.children.videoControl.getView().value,
            streamingSharing: sharing,
            speaking: comp.children.localUser.getView().value?.speaking ?? false,
            userName: comp.children.localUserName.getView().value,
          });
        }
      },
    },
    {
      method: {
        name: "audioControl",
        description: trans("meeting.actionBtnDesc"),
        params: [],
      },
      execute: async (comp: any, values: any) => {
        if (!comp.children.meetingActive.getView().value) return;
        let value = !comp.children.audioControl.getView().value;
        comp.children.localUser.change({
          user: userId + "",
          audiostatus: value,
          streamingVideo: comp.children.videoControl.getView().value,
          streamingSharing: comp.children.sharing.getView().value,
          speaking: false,
          userName: comp.children.localUserName.getView().value,
        });
        await turnOnMicrophone(value);
        comp.children.audioControl.change(value);
        if (userId != null && userId !== "") {
          broadcastLocalMeetingUserState({
            user: String(userId),
            audiostatus: value,
            streamingVideo: comp.children.videoControl.getView().value,
            streamingSharing: comp.children.sharing.getView().value,
            speaking: false,
            userName: comp.children.localUserName.getView().value,
          });
        }
      },
    },
    {
      method: {
        name: "videoControl",
        description: trans("meeting.actionBtnDesc"),
        params: [],
      },
      execute: async (comp: any, values: any) => {
        //check if meeting is active
        if (!comp.children.meetingActive.getView().value) return;
        //toggle videoControl
        let value = !comp.children.videoControl.getView().value;
        if (isCameraTrackUsable(videoTrack)) {
          videoTrack.setEnabled(value);
        } else if (value) {
          try {
            await turnOnCamera(true);
            if (isCameraTrackUsable(videoTrack)) {
              await client.publish(videoTrack);
            }
          } catch {
            value = false;
          }
        }
        //change my local user data
        let localData = {
          user: userId + "",
          streamingVideo: value,
          audiostatus: comp.children.audioControl.getView().value,
          streamingSharing: comp.children.sharing.getView().value,
          speaking: comp.children.localUser.getView().value.speaking,
          userName: comp.children.localUserName.getView().value,
        };

        comp.children.localUser.change(localData);
        comp.children.videoControl.change(value);
        if (userId != null && userId !== "") {
          broadcastLocalMeetingUserState({
            user: String(userId),
            audiostatus: comp.children.audioControl.getView().value,
            streamingVideo: value,
            streamingSharing: comp.children.sharing.getView().value,
            speaking: comp.children.localUser.getView().value.speaking,
            userName: comp.children.localUserName.getView().value,
          });
        }
      },
    },
    {
      method: {
        name: "startMeeting",
        description: trans("meeting.actionBtnDesc"),
        params: [],
      },
      execute: async (comp: any, values: any) => {
        if (comp.children.meetingActive.getView().value) {
          if (isClientInChannel()) {
            return;
          }
          comp.children.meetingActive.change(false);
        }
        const resolvedUserName = String(
          comp.children.localUserName.getView().value ?? ""
        ).trim();
        /* console.log("startMeeting ", {
            // user: userId + "",
            audiostatus: false,
            speaking: false,
            streamingVideo: true,
          }); */
        userId =
          comp.children.localUserID.getView().value === ""
            ? uuidv4()
            : comp.children.localUserID.getView().value;
        const videoPublished = await publishVideo(
          comp.children.appId.getView(),
          comp.children.meetingName.getView().value === ""
            ? uuidv4()
            : comp.children.meetingName.getView().value,
          comp.children.rtmToken.getView().value,
          comp.children.rtcToken.getView().value
        );
        comp.children.videoControl.change(videoPublished);
        comp.children.localUser.change({
          user: userId + "",
          audiostatus: false,
          speaking: false,
          streamingVideo: videoPublished,
          streamingSharing: false,
          userName: resolvedUserName,
        });
        console.log("publishVideo ", {
          appId: comp.children.appId.getView(),
          meetingName: comp.children.meetingName.getView().value === ""
            ? uuidv4()
            : comp.children.meetingName.getView().value,
          rtmToken: comp.children.rtmToken.getView().value,
          rtcToken: comp.children.rtcToken.getView().value,
          videoPublished,
        });
        comp.children.meetingActive.change(true);
        if (userId != null && userId !== "") {
          broadcastLocalMeetingUserState({
            user: String(userId),
            audiostatus: false,
            streamingVideo: videoPublished,
            streamingSharing: false,
            speaking: false,
            userName: resolvedUserName,
          });
        }
      },
    },
    {
      method: {
        name: "broadCast",
        description: trans("meeting.broadCast"),
        params: [],
      },
      execute: async (comp: any, values: any) => {
        if (!comp.children.meetingActive.getView().value) return;
        let messagedata =
          values !== undefined && values[0] !== undefined ? values[0] : "";
        let toUsers: any =
          values !== undefined && values[1] !== undefined ? values[1] : "";

        let message: any = {
          time: Date.now(),
          message: messagedata,
        };

        if (toUsers.length > 0 && toUsers[0] !== undefined) {
          toUsers.forEach((peer: any) => {
            message.to = peer;
            sendPeerMessageRtm(message, String(peer));
          });
        } else {
          sendMessageRtm(message);
        }
      },
    },
    {
      method: {
        name: "setMeetingName",
        description: trans("meeting.meetingName"),
        params: [],
      },
      execute: async (comp: any, values: any) => {
        let meetingName: any = values[0];
        comp.children.meetingName.change(meetingName);
      },
    },
    {
      method: {
        name: "setUserName",
        description: trans("meeting.userName"),
        params: [],
      },
      execute: async (comp: any, values: any) => {
        let userName: any = values[0];
        const nameStr =
          userName != null && String(userName).trim() !== ""
            ? String(userName).trim()
            : "";
        comp.children.localUserName.change(nameStr);
        let userLocal = comp.children.localUser.getView().value;
        comp.children.localUser.change({ ...userLocal, userName: nameStr });
      },
    },
    {
      method: {
        name: "setRTCToken",
        description: trans("meeting.rtcToken"),
        params: [],
      },
      execute: async (comp: any, values: any) => {
        let rtcToken: any = values[0];
        comp.children.rtcToken.change(rtcToken);
      },
    },
    {
      method: {
        name: "setRTMToken",
        description: trans("meeting.rtmToken"),
        params: [],
      },
      execute: async (comp: any, values: any) => {
        let rtmToken: any = values[0];
        comp.children.rtmToken.change(rtmToken);
      },
    },
    {
      method: {
        name: "endMeeting",
        description: trans("meeting.actionBtnDesc"),
        params: [],
      },
      execute: async (comp: any, values: any) => {
        if (!comp.children.meetingActive.getView().value) return;

        let value = !comp.children.endCall.getView().value;
        comp.children.endCall.change(value);
        comp.children.meetingActive.change(false);
        comp.children.sharing.change(false);

        await leaveChannel();

        comp.children.localUser.change({
          user: userId + "",
          streamingVideo: false,
          userName: comp.children.localUserName.getView().value,
        });
      },
    },
  ]);

  MeetingControllerComp = withExposingConfigs(MTComp, [
    new NameConfig("appId", trans("meeting.appid")),
    new NameConfig("localUser", trans("meeting.host")),
    new NameConfig("participants", trans("meeting.participants")),
    new NameConfig("meetingActive", trans("meeting.meetingActive")),
    new NameConfig("meetingName", trans("meeting.meetingName")),
    new NameConfig("localUserID", trans("meeting.localUserID")),
    new NameConfig("localUserName", trans("meeting.localUserName")),
    new NameConfig("messages", trans("meeting.messages")),
    new NameConfig("rtmToken", trans("meeting.rtmToken")),
    new NameConfig("rtcToken", trans("meeting.rtcToken")),
  ]);
} else {
  console.error(
    "ContainerCompBuilder for Meeting Comp is not available. Please ensure that Lowcoder SDK version v2.4 or higher is installed."
  );
}

export { MeetingControllerComp };
