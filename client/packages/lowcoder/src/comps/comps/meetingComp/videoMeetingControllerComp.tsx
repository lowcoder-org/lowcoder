import { CloseOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { ContainerCompBuilder } from "comps/comps/containerBase/containerCompBuilder";
import {
  gridItemCompToGridItems,
  InnerGrid,
} from "comps/comps/containerComp/containerView";
import { AutoHeightControl } from "comps/controls/autoHeightControl";
import { BoolControl } from "comps/controls/boolControl";
import { StringControl } from "comps/controls/codeControl";
import {
  booleanExposingStateControl,
  BooleanStateControl,
  jsonObjectExposingStateControl,
  stringStateControl,
} from "comps/controls/codeStateControl";
import { PositionControl } from "comps/controls/dropdownControl";
import {
  closeEvent,
  eventHandlerControl,
} from "comps/controls/eventHandlerControl";
import { styleControl } from "comps/controls/styleControl";
import { DrawerStyle } from "comps/controls/styleControlConstants";
import { stateComp, withDefault } from "comps/generators";
import { withMethodExposing } from "comps/generators/withMethodExposing";
import { BackgroundColorContext } from "comps/utils/backgroundColorContext";
import { CanvasContainerID } from "constants/domLocators";
import { Layers } from "constants/Layers";
import { trans } from "i18n";
import { changeChildAction } from "lowcoder-core";
import {
  Drawer,
  HintPlaceHolder,
  Section,
  sectionNames,
} from "lowcoder-design";
import { useCallback, useEffect, useState } from "react";
import { ResizeHandle } from "react-resizable";
import styled from "styled-components";
import { useUserViewMode } from "util/hooks";
import { isNumeric } from "util/stringUtils";
import { NameConfig, withExposingConfigs } from "../../generators/withExposing";

import axios from "axios";
import AgoraRTC, {
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  UID,
  ILocalVideoTrack,
} from "agora-rtc-sdk-ng";

import { JSONValue } from "@lowcoder-ee/index.sdk";
import { getData } from "../listViewComp/listViewUtils";
import AgoraRTM, { RtmChannel, RtmClient } from "agora-rtm-sdk";

const EventOptions = [closeEvent] as const;

const DEFAULT_SIZE = 378;
const DEFAULT_PADDING = 16;

const DrawerWrapper = styled.div`
  // Shield the mouse events of the lower layer, the mask can be closed in the edit mode to prevent the lower layer from sliding
  pointer-events: auto;
`;

const ButtonStyle = styled(Button)`
  position: absolute;
  left: 0;
  top: 0;
  z-index: 10;
  font-weight: 700;
  box-shadow: none;
  color: rgba(0, 0, 0, 0.45);
  height: 54px;
  width: 54px;

  svg {
    width: 16px;
    height: 16px;
  }

  &,
  :hover,
  :focus {
    background-color: transparent;
    border: none;
  }

  :hover,
  :focus {
    color: rgba(0, 0, 0, 0.75);
  }
`;

// If it is a number, use the px unit by default
function transToPxSize(size: string | number) {
  return isNumeric(size) ? size + "px" : (size as string);
}

export const client: IAgoraRTCClient = AgoraRTC.createClient({
  mode: "rtc",
  codec: "vp8",
});
AgoraRTC.setLogLevel(3);

let audioTrack: IMicrophoneAudioTrack;
let videoTrack: ICameraVideoTrack;
let screenShareStream: ILocalVideoTrack;
let userId: UID | null | undefined;
let rtmChannelResponse: RtmChannel;
let rtmClient: RtmClient;
const agoraTokenUrl = `https://sandbox.wiggolive.com/token/rtc`;

const generateToken = async (
  appId: any,
  certificate: any,
  channelName: any
) => {
  let response = await axios.post(agoraTokenUrl, {
    appId,
    certificate,
    channelName,
  });
  return response.data;
};

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
    if (sharing == false) {
      await client.unpublish(screenShareStream);
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
  if (videoTrack) {
    await client.unpublish(videoTrack);
    await turnOnCamera(false);
  }

  if (audioTrack) {
    await turnOnMicrophone(false);
  }
  await client.leave();
  await rtmChannelResponse.leave();
};

const hostChanged = (users: any) => {};

const publishVideo = async (
  appId: string,
  channel: any,
  height: any,
  certifiCateKey: string
) => {
  let token = null;
  if (certifiCateKey) {
    token = await generateToken(appId, certifiCateKey, channel);
  }
  await turnOnCamera(true);
  await client.join(appId, channel, token, userId);
  await client.publish(videoTrack);

  await rtmInit(appId, userId, channel);
};

const sendMessageRtm = (message: any) => {
  rtmChannelResponse.sendMessage({ text: JSON.stringify(message) });
};

const sendPeerMessageRtm = (message: any, toId: string) => {
  rtmClient.sendMessageToPeer({ text: JSON.stringify(message) }, toId);
};

const rtmInit = async (appId: any, uid: any, channel: any) => {
  rtmClient = AgoraRTM.createInstance(appId);
  let options = {
    uid: String(uid),
  };
  await rtmClient.login(options);

  rtmChannelResponse = rtmClient.createChannel(channel);

  await rtmChannelResponse.join();
};

export const meetingControllerChildren = {
  visible: withDefault(BooleanStateControl, "visible"),
  onEvent: eventHandlerControl(EventOptions),
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
  meetingName: stringStateControl("meetingName"),
  certifiCateKey: stringStateControl(""),
  messages: stateComp<JSONValue>([]),
};
let MTComp = (function () {
  return new ContainerCompBuilder(
    meetingControllerChildren,
    (props, dispatch) => {
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
          let userData = {
            user: userJoined.uid,
            host: false,
            audiostatus: userJoined.hasAudio,
            streamingVideo: true,
          };
          setUserIds((userIds: any) => [...userIds, userData]);
          if (userIds.length == 0) {
            userData.host = true;
          } else {
            userData.host = false;
          }
          dispatch(
            changeChildAction(
              "participants",
              removeDuplicates(getData([...userIds, userData]).data, "user"),
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
            hostChanged(newUsers);
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
            changeChildAction("participants", getData(updatedItems).data, false)
          );
        }
      }, [updateVolume]);

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
            setRtmMessages(message.text);
          });
          rtmChannelResponse.on("ChannelMessage", function (message, memberId) {
            setRtmMessages(message.text);
            dispatch(
              changeChildAction("messages", getData(rtmMessages).data, false)
            );
          });
        }
      }, [rtmChannelResponse]);

      useEffect(() => {
        if (client) {
          client.enableAudioVolumeIndicator();
          client.on("user-joined", (user: IAgoraRTCRemoteUser) => {
            setUserJoined(user);
          });
          client.on("user-left", (user: IAgoraRTCRemoteUser, reason: any) => {
            setUserLeft(user);
          });
          client.on("volume-indicator", (volumeInfos: any) => {
            if (volumeInfos.length == 0) return;
            volumeInfos.map((volumeInfo: any) => {
              const speaking = volumeInfo.level >= 30;
              if (
                volumeInfo.uid == userId &&
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
            async (user: IAgoraRTCRemoteUser, mediaType: "video" | "audio") => {
              setLocalUserVideo(user);
            }
          );
          client.on(
            "user-unpublished",
            (user: IAgoraRTCRemoteUser, mediaType: "video" | "audio") => {
              console.log("user-unpublished");

              setLocalUserVideo(user);
            }
          );
        }
      }, [client]);

      return (
        <BackgroundColorContext.Provider value={props.style.background}>
          <DrawerWrapper>
            <Drawer
              resizable={resizable}
              onResizeStop={onResizeStop}
              rootStyle={
                props.visible.value
                  ? { overflow: "auto", pointerEvents: "auto" }
                  : {}
              }
              contentWrapperStyle={{ maxHeight: "100%", maxWidth: "100%" }}
              bodyStyle={{
                padding: 0,
                backgroundColor: props.style.background,
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
              onClose={(e) => {
                props.visible.onChange(false);
              }}
              afterOpenChange={(visible) => {
                if (!visible) {
                  props.onEvent("close");
                }
              }}
              zIndex={Layers.drawer}
              maskClosable={props.maskClosable}
              mask={props.showMask}
            >
              <ButtonStyle
                onClick={() => {
                  props.visible.onChange(false);
                }}
              >
                <CloseOutlined />
              </ButtonStyle>
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
          </DrawerWrapper>
        </BackgroundColorContext.Provider>
      );
    }
  )
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.appId.propertyView({ label: trans("meeting.appid") })}
          {children.certifiCateKey.propertyView({
            label: trans("meeting.certifiCateKey"),
          })}

          {children.meetingName.propertyView({
            label: trans("meeting.meetingName"),
          })}

          {children.placement.propertyView({
            label: trans("drawer.placement"),
            radioButton: true,
          })}
          {["top", "bottom"].includes(children.placement.getView())
            ? children.autoHeight.getPropertyView()
            : children.width.propertyView({
                label: trans("drawer.width"),
                tooltip: trans("drawer.widthTooltip"),
                placeholder: DEFAULT_SIZE + "",
              })}
          {!children.autoHeight.getView() &&
            ["top", "bottom"].includes(children.placement.getView()) &&
            children.height.propertyView({
              label: trans("drawer.height"),
              tooltip: trans("drawer.heightTooltip"),
              placeholder: DEFAULT_SIZE + "",
            })}
          {children.maskClosable.propertyView({
            label: trans("prop.maskClosable"),
          })}
          {children.showMask.propertyView({
            label: trans("prop.showMask"),
          })}
        </Section>
        <Section name={sectionNames.interaction}>
          {children.onEvent.getPropertyView()}
        </Section>
        <Section name={sectionNames.style}>
          {children.style.getPropertyView()}
        </Section>
      </>
    ))
    .build();
})();

MTComp = class extends MTComp {
  override autoHeight(): boolean {
    return false;
  }
};

MTComp = withMethodExposing(MTComp, [
  {
    method: {
      name: "openDrawer",
      description: trans("drawer.openDrawerDesc"),
      params: [],
    },
    execute: (comp, values) => {
      comp.children.visible.getView().onChange(true);
    },
  },
  {
    method: {
      name: "startSharing",
      description: trans("drawer.openDrawerDesc"),
      params: [],
    },
    execute: async (comp, values) => {
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
    execute: async (comp, values) => {
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
    execute: async (comp, values) => {
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
    execute: async (comp, values) => {
      userId = Math.floor(100000 + Math.random() * 900000);
      comp.children.localUser.change({
        user: userId + "",
        audiostatus: false,
        speaking: false,
        streamingVideo: true,
      });

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
        comp.children.meetingName.getView().value == ""
          ? "_meetingId"
          : comp.children.meetingName.getView().value,
        comp.children,
        comp.children.certifiCateKey.getView().value
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
    execute: async (comp, values) => {
      if (!comp.children.meetingActive.getView().value) return;
      let otherData =
        values != undefined && values[1] !== undefined ? values[1] : "";
      let toUsers: any =
        values != undefined && values[0] !== undefined ? values[0] : "";

      let message: any = {
        time: Date.now(),
        from: comp.children.localUser.getView().value,
      };
      message["data"] = otherData;

      if (toUsers.length > 0 && toUsers[0] !== undefined) {
        let peers = toUsers?.map((u: any) => u.user);
        peers.forEach((p: any) => {
          sendPeerMessageRtm(message, String(p));
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
    execute: async (comp, values) => {
      let meetingName: any = values[0];
      comp.children.meetingName.change(meetingName);
    },
  },
  {
    method: {
      name: "setUserName",
      description: trans("meeting.meetingName"),
      params: [],
    },
    execute: async (comp, values) => {
      let userName: any = values[0];
      let userLocal = comp.children.localUser.getView().value;
      comp.children.localUser.change({ ...userLocal, userName: userName });
    },
  },
  {
    method: {
      name: "endMeeting",
      description: trans("meeting.actionBtnDesc"),
      params: [],
    },
    execute: async (comp, values) => {
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
  {
    method: {
      name: "closeDrawer",
      description: trans("drawer.closeDrawerDesc"),
      params: [],
    },
    execute: (comp, values) => {
      comp.children.visible.getView().onChange(false);
    },
  },
]);

export const VideoMeetingControllerComp = withExposingConfigs(MTComp, [
  new NameConfig("visible", trans("export.visibleDesc")),
  new NameConfig("appId", trans("meeting.appid")),
  new NameConfig("localUser", trans("meeting.host")),
  new NameConfig("participants", trans("meeting.participants")),
  new NameConfig("meetingActive", trans("meeting.meetingName")),
  new NameConfig("meetingName", trans("meeting.meetingName")),
  new NameConfig("messages", trans("meeting.meetingName")),
]);
