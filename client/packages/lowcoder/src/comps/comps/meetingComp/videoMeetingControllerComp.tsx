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
  jsonObjectExposingStateControl,
  jsonValueExposingStateControl,
  numberExposingStateControl,
} from "comps/controls/codeStateControl";
import { PositionControl } from "comps/controls/dropdownControl";
import {
  closeEvent,
  eventHandlerControl,
} from "comps/controls/eventHandlerControl";
import { styleControl } from "comps/controls/styleControl";
import { DrawerStyle } from "comps/controls/styleControlConstants";
import { withDefault } from "comps/generators";
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
import { useCallback, useEffect } from "react";
import { ResizeHandle } from "react-resizable";
import styled from "styled-components";
import { useUserViewMode } from "util/hooks";
import { isNumeric } from "util/stringUtils";
import { NameConfig, withExposingConfigs } from "../../generators/withExposing";

import AgoraRTC, {
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";

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

let client: IAgoraRTCClient = AgoraRTC.createClient({
  mode: "rtc",
  codec: "vp8",
});

let audioTrack: IMicrophoneAudioTrack;
let videoTrack: ICameraVideoTrack;

const turnOnCamera = async (flag?: boolean) => {
  if (videoTrack) {
    return videoTrack.setEnabled(flag!);
  }
  videoTrack = await AgoraRTC.createCameraVideoTrack();
  videoTrack.play("camera-video");
};

const turnOnMicrophone = async (flag?: boolean) => {
  if (audioTrack) {
    return audioTrack.setEnabled(flag!);
  }
  audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  audioTrack.play();
};

const leaveChannel = async () => {
  if (!client) {
    console.error("Agora client is not initialized");
    return;
  }

  if (!client.localTracks.length) {
    console.error("No local tracks to unpublish");
    return;
  }
  if (videoTrack) {
    await turnOnCamera(false);
    await client.unpublish(videoTrack);
    videoTrack.stop();
  }

  if (audioTrack) {
    await turnOnMicrophone(false);
    await client.unpublish(audioTrack);
    audioTrack.stop();
  }

  await client.leave();
  isJoined = false;
};
let isJoined = false;

const joinChannel = async (appId: any, channel: any, token: any) => {
  if (!channel) {
    channel = "react-room";
  }

  if (isJoined) {
    await leaveChannel();
  }

  await client.join(
    appId,
    channel,
    token || null,
    Math.floor(100000 + Math.random() * 900000)
  );

  isJoined = true;
};

const publishVideo = async (appId: any, channel: any, height: any) => {
  await turnOnCamera(true);
  console.log(appId, channel);

  if (!isJoined) {
    await joinChannel(appId, channel, null);
  }

  await client.publish(videoTrack);
  const mediaStreamTrack = videoTrack.getMediaStreamTrack();

  if (mediaStreamTrack) {
    const videoSettings = mediaStreamTrack.getSettings();
    const videoWidth = videoSettings.width;
    const videoHeight = videoSettings.height;
    console.log("videoHeight ", videoHeight);

    height.videoWidth.change(videoWidth);
    height.videoHeight.change(videoHeight);
    console.log(`Video width: ${videoWidth}px, height: ${videoHeight}px`);
  } else {
    console.error("Media stream track not found");
  }
};

const onUserPublish = async (
  user: IAgoraRTCRemoteUser,
  mediaType: "video" | "audio"
) => {
  if (mediaType === "video") {
    const remoteTrack = await client.subscribe(user, mediaType);
    remoteTrack.play("remote-video");
  }
  if (mediaType === "audio") {
    const remoteTrack = await client.subscribe(user, mediaType);
    remoteTrack.play();
  }
};

let MTComp = (function () {
  const childrenMap = {
    visible: booleanExposingStateControl("visible"),
    onEvent: eventHandlerControl(EventOptions),
    width: StringControl,
    height: StringControl,
    autoHeight: AutoHeightControl,
    style: styleControl(DrawerStyle),
    placement: PositionControl,
    maskClosable: withDefault(BoolControl, true),
    showMask: withDefault(BoolControl, true),
    audioControl: booleanExposingStateControl("false"),
    videoControl: booleanExposingStateControl("true"),
    endCall: booleanExposingStateControl("false"),
    videoSettings: jsonObjectExposingStateControl(""),
    videoWidth: numberExposingStateControl("videoWidth", 200),
    videoHeight: numberExposingStateControl("videoHeight", 200),
    appId: withDefault(StringControl, trans("prop.appid")),
    participants: jsonValueExposingStateControl("participants"),
  };
  return new ContainerCompBuilder(childrenMap, (props, dispatch) => {
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

    useEffect(() => {
      console.log("nnnn ", props.participants);
    }, [props.participants.value]);

    useEffect(() => {
      if (client) {
        client.on(
          "user-published",
          async (user: IAgoraRTCRemoteUser, mediaType: "video" | "audio") => {
            if (mediaType === "video") {
              const remoteTrack = await client.subscribe(user, mediaType);
              remoteTrack.play("remote-video");
            }
            if (mediaType === "audio") {
              const remoteTrack = await client.subscribe(user, mediaType);
              remoteTrack.play();
            }
          }
        );

        client.on("user-joined", (user: IAgoraRTCRemoteUser) => {});
        client.on("user-offline", (uid: any, reason: any) => {
          console.log(`User  ${uid} left the channel.`);
        });
        client.on("user-published", (user, mediaType) => {
          console.log(`User ${user.uid} published ${user.videoTrack} stream.`);
        });
        client.on("stream-removed", (user: IAgoraRTCRemoteUser) => {
          console.log(`Stream from user ${user.uid} removed.`);
        });
        client.on("stream-added", (user: IAgoraRTCRemoteUser) => {
          console.log("stream-added");
        });
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
  })
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.appId.propertyView({ label: trans("prop.appid") })}
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
      name: "audioControl",
      description: trans("meeting.actionBtnDesc"),
      params: [],
    },
    execute: (comp, values) => {
      let value = !comp.children.audioControl.getView().value;
      turnOnMicrophone(value);
      comp.children.audioControl.change(value);
    },
  },
  {
    method: {
      name: "videoControl",
      description: trans("meeting.actionBtnDesc"),
      params: [],
    },
    execute: (comp, values) => {
      let value = !comp.children.videoControl.getView().value;
      turnOnCamera(value);
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
      await publishVideo(
        comp.children.appId.getView(),
        "testsdaadasdsa",
        comp.children
      );
    },
  },
  {
    method: {
      name: "endCall",
      description: trans("meeting.actionBtnDesc"),
      params: [],
    },
    execute: async (comp, values) => {
      let value = !comp.children.endCall.getView().value;
      await leaveChannel();
      comp.children.endCall.change(value);
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
  new NameConfig("appId", trans("prop.appid")),
  new NameConfig("participants", trans("prop.participants")),
]);
