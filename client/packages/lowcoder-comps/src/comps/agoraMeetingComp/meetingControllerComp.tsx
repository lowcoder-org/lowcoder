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
import type { JSONValue } from "../../../../lowcoder/src/util/jsonTypes";
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
} from "agora-rtc-sdk-ng";

import type { RtmChannel, RtmClient } from "agora-rtm-sdk";
import { useCallback, useEffect, useState } from "react";
import { ResizeHandle } from "react-resizable";
import { v4 as uuidv4 } from "uuid";

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

let audioTrack: IMicrophoneAudioTrack;
let videoTrack: ICameraVideoTrack;
let screenShareStream: ILocalVideoTrack;
let userId: UID | null | undefined;
let rtmChannelResponse: RtmChannel;
let rtmClient: RtmClient;
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
const turnOnCamera = async (flag?: boolean) => {
  if (videoTrack) {
    return videoTrack.setEnabled(flag!);
  }
  videoTrack = await AgoraRTC.createCameraVideoTrack();
  videoTrack.play(userId + "");
};

const turnOnMicrophone = async (flag?: boolean) => {
  if (audioTrack) {
    return audioTrack.setEnabled(flag!);
  }
  audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  if (!flag) {
    await client.unpublish(audioTrack);
  } else {
    await client.publish(audioTrack);
  }
};
const shareScreen = async (sharing: boolean) => {
  try {
    if (sharing === false) {
      await client.unpublish(screenShareStream);
      screenShareStream.close();
      await client.publish(videoTrack);
      videoTrack.play(userId + "");
    } else {
      screenShareStream = await AgoraRTC.createScreenVideoTrack(
        {
          screenSourceType: "screen",
        },
        "disable"
      );
      await client.unpublish(videoTrack);
      screenShareStream.play("share-screen");
      await client.publish(screenShareStream);
    }
  } catch (error) {
    console.error("Failed to create screen share stream:", error);
  }
};
const leaveChannel = async () => {
  //stops local sharing video
  if (screenShareStream) {
    screenShareStream.close();
  }

  //stops local video streaming and puts off the camera
  if (videoTrack) {
    await client.unpublish(videoTrack);
    await turnOnCamera(false);
  }

  //mutes and stops locla audio stream
  if (audioTrack) {
    await turnOnMicrophone(false);
  }
  await client.leave();
  await rtmChannelResponse.leave();
};

const publishVideo = async (
  appId: string,
  channel: string,
  rtmToken: string,
  rtcToken: string
) => {
  await turnOnCamera(true);
  await client.join(appId, channel, rtcToken, userId);
  await client.publish(videoTrack);
  await rtmInit(appId, userId, rtmToken, channel);
};

const sendMessageRtm = (message: any) => {
  rtmChannelResponse.sendMessage({ text: JSON.stringify(message) });
};

const sendPeerMessageRtm = (message: any, toId: string) => {
  rtmClient.sendMessageToPeer({ text: JSON.stringify(message) }, toId);
};

const rtmInit = async (appId: any, uid: any, token: any, channel: any) => {
  const AgoraRTM = (await import("agora-rtm-sdk")).default;
  rtmClient = AgoraRTM.createInstance(appId);
  let options = {
    uid: String(uid),
    token: token ? token : null,
  };
  await rtmClient.login(options);

  rtmChannelResponse = rtmClient.createChannel(channel);

  await rtmChannelResponse.join();
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
  participants: stateComp<JSONValue>([]),
  usersScreenShared: stateComp<JSONValue>([]),
  localUser: jsonObjectExposingStateControl(""),
  localUserID: withDefault(
    stringStateControl(trans("meeting.localUserID")),
    uuidv4() + ""
  ),
  meetingName: withDefault(
    stringStateControl(trans("meeting.meetingName")),
    uuidv4() + ""
  ),
  rtmToken: stringStateControl(trans("meeting.rtmToken")),
  rtcToken: stringStateControl(trans("meeting.rtcToken")),
  messages: stateComp<JSONValue>([]),
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
        const [userIds, setUserIds] = useState<any>([]);
        const [updateVolume, setUpdateVolume] = useState<any>({
          update: false,
          userid: null,
        });
        const [rtmMessages, setRtmMessages] = useState<any>([]);
        const [localUserSpeaking, setLocalUserSpeaking] = useState<any>(false);
        const [localUserVideo, setLocalUserVideo] =
          useState<IAgoraRTCRemoteUser>();
        const [userJoined, setUserJoined] = useState<IAgoraRTCRemoteUser>();
        const [userLeft, setUserLeft] = useState<IAgoraRTCRemoteUser>();

        useEffect(() => {
          if (userJoined) {
            // console.log("userJoined ", userJoined);

            let prevUsers: any[] = props.participants as [];
            // console.log("prevUsers ", prevUsers);
            let userData = {
              user: userJoined.uid,
              audiostatus: userJoined.hasAudio,
              streamingVideo: true,
            };
            // console.log("userData ", userData);
            setUserIds((userIds: any) => [...userIds, userData]);
            // console.log("userIds ", userIds);
            /* console.log(
            "removeDuplicates ",
            removeDuplicates(getData([...prevUsers, userData]).data, "user")
          ); */
            dispatch(
              changeChildAction(
                "participants",
                removeDuplicates(
                  getData([...prevUsers, userData]).data,
                  "user"
                ),
                false
              )
            );
          }
        }, [userJoined]);

        function removeDuplicates(arr: any, prop: any) {
          const uniqueObjects = [];
          const seenValues = new Set();

          for (const obj of arr) {
            const objValue = obj[prop];

            if (!seenValues.has(objValue)) {
              seenValues.add(objValue);
              uniqueObjects.push(obj);
            }
          }

          return uniqueObjects;
        }
        useEffect(() => {
          if (userLeft) {
            let newUsers = userIds.filter(
              (item: any) => item.user !== userLeft.uid
            );
            let hostExists = newUsers.filter((f: any) => f.host === true);
            if (hostExists.length == 0 && newUsers.length > 0) {
              newUsers[0].host = true;
            }
            setUserIds(newUsers);
            dispatch(
              changeChildAction(
                "participants",
                removeDuplicates(getData(newUsers).data, "user"),
                false
              )
            );
          }
        }, [userLeft]);

        // console.log("sharing", props.sharing);

        useEffect(() => {
          if (updateVolume.userid) {
            let prevUsers: [] = props.participants as [];

            const updatedItems = prevUsers.map((userInfo: any) => {
              if (
                userInfo.user === updateVolume.userid &&
                userInfo.speaking != updateVolume.update
              ) {
                return { ...userInfo, speaking: updateVolume.update };
              }
              return userInfo;
            });
            dispatch(
              changeChildAction(
                "participants",
                getData(updatedItems).data,
                false
              )
            );
          }
        }, [updateVolume]);

        useEffect(() => {
          let prevUsers: [] = props.participants as [];
          const updatedItems = prevUsers.map((userInfo: any) => {
            if (userInfo.user === localUserVideo?.uid) {
              return { ...userInfo, streamingSharing: props.sharing.value };
            }
            return userInfo;
          });
          dispatch(
            changeChildAction("participants", getData(updatedItems).data, false)
          );

          let localObject = {
            user: userId + "",
            audiostatus: props.audioControl.value,
            streamingVideo: props.videoControl.value,
            streamingSharing: props.sharing.value,
            speaking: localUserSpeaking,
          };
          props.localUser.onChange(localObject);
        }, [props.sharing.value]);

        // console.log("participants ", props.participants);

        useEffect(() => {
          let prevUsers: [] = props.participants as [];
          const updatedItems = prevUsers.map((userInfo: any) => {
            if (userInfo.user === localUserVideo?.uid) {
              return { ...userInfo, streamingVideo: localUserVideo?.hasVideo };
            }
            return userInfo;
          });
          dispatch(
            changeChildAction("participants", getData(updatedItems).data, false)
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
              speaking: localUserSpeaking,
            };
            props.localUser.onChange(localObject);
          }
        }, [localUserSpeaking]);

        useEffect(() => {
          if (rtmChannelResponse) {
            rtmClient.on("MessageFromPeer", function (message, peerId) {
              setRtmMessages((prevMessages: any[]) => {
                // Check if the messages array exceeds the maximum limit
                if (prevMessages.length >= 500) {
                  prevMessages.pop(); // Remove the oldest message
                }
                return [
                  ...prevMessages,
                  { peermessage: JSON.parse(message.text + ""), from: peerId },
                ];
              });
            });

            rtmChannelResponse.on(
              "ChannelMessage",
              function (message, memberId) {
                setRtmMessages((prevMessages: any[]) => {
                  // Check if the messages array exceeds the maximum limit
                  if (prevMessages.length >= 500) {
                    prevMessages.pop(); // Remove the oldest message
                  }
                  return [
                    ...prevMessages,
                    {
                      channelmessage: JSON.parse(message.text + ""),
                      from: memberId,
                    },
                  ];
                });

                dispatch(
                  changeChildAction(
                    "messages",
                    getData(rtmMessages).data,
                    false
                  )
                );
              }
            );
          }
        }, [rtmChannelResponse]);
        useEffect(() => {
          if (client) {
            //Enable Agora to send audio bytes
            client.enableAudioVolumeIndicator();
            //user activity listeners
            client.on("user-joined", (user: IAgoraRTCRemoteUser) => {
              setUserJoined(user);
            });
            client.on("user-left", (user: IAgoraRTCRemoteUser, reason: any) => {
              setUserLeft(user);
            });

            //listen to user speaking,
            client.on("volume-indicator", (volumeInfos: any) => {
              if (volumeInfos.length === 0) return;
              volumeInfos.map((volumeInfo: any) => {
                //when the volume is above 30, user is probably speaking
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
            });

            client.on(
              "user-published",
              async (
                user: IAgoraRTCRemoteUser,
                mediaType: "video" | "audio"
              ) => {
                setLocalUserVideo(user);
              }
            );
            client.on(
              "user-unpublished",
              (user: IAgoraRTCRemoteUser, mediaType: "video" | "audio") => {
                setLocalUserVideo(user);
              }
            );
          }
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
          speaking: false,
        });
        await turnOnMicrophone(value);
        comp.children.audioControl.change(value);
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
        if (videoTrack) {
          videoTrack.setEnabled(value);
        } else {
          await turnOnCamera(value);
        }
        //change my local user data
        let localData = {
          user: userId + "",
          streamingVideo: value,
          audiostatus: comp.children.audioControl.getView().value,
          speaking: comp.children.localUser.getView().value.speaking,
        };

        comp.children.localUser.change(localData);
        comp.children.videoControl.change(value);
      },
    },
    {
      method: {
        name: "startMeeting",
        description: trans("meeting.actionBtnDesc"),
        params: [],
      },
      execute: async (comp: any, values: any) => {
        /* console.log("startMeeting ", {
            // user: userId + "",
            audiostatus: false,
            speaking: false,
            streamingVideo: true,
          }); */
        if (comp.children.meetingActive.getView().value) return;
        userId =
          comp.children.localUserID.getView().value === ""
            ? uuidv4()
            : comp.children.localUserID.getView().value;
        comp.children.localUser.change({
          user: userId + "",
          audiostatus: false,
          speaking: false,
          streamingVideo: true,
        });
        /* console.log("startMeeting localUser ", {
            user: userId + "",
            audiostatus: false,
            speaking: false,
            streamingVideo: true,
          }); */

        comp.children.localUser.children.value.dispatch(
          changeChildAction(
            "localUser",
            {
              user: userId + "",
              audiostatus: false,
              speaking: false,
              streamingVideo: true,
            },
            false
          )
        );
        comp.children.videoControl.change(true);
        await publishVideo(
          comp.children.appId.getView(),
          comp.children.meetingName.getView().value === ""
            ? uuidv4()
            : comp.children.meetingName.getView().value,
          comp.children.rtmToken.getView().value,
          comp.children.rtcToken.getView().value
        );
        comp.children.meetingActive.change(true);
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
        let userLocal = comp.children.localUser.getView().value;
        comp.children.localUser.change({ ...userLocal, userName: userName });
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

        await leaveChannel();

        comp.children.localUser.change({
          user: userId + "",
          streamingVideo: false,
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
