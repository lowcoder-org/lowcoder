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
import { BooleanStateControl } from "comps/controls/codeStateControl";
import { PositionControl } from "comps/controls/dropdownControl";
import {
  closeEvent,
  eventHandlerControl,
} from "comps/controls/eventHandlerControl";
import { styleControl } from "comps/controls/styleControl";
import { DrawerStyle } from "comps/controls/styleControlConstants";
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

import { createClient } from "matrix-js-sdk";

import { withDefault } from "@lowcoder-ee/index.sdk";

const EventOptions = [closeEvent] as const;

const DEFAULT_SIZE = 378;
const DEFAULT_PADDING = 16;

const matrixClient = createClient({
  baseUrl: "https://matrix.org",
});

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
  credentials: withDefault(StringControl, trans("chat.credentials")),
  username: withDefault(StringControl, trans("chat.username")),
  password: withDefault(StringControl, trans("chat.password")),
  roomAlias: withDefault(StringControl, ""),
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

      useEffect(() => {
        const handleMatrixOperations = async () => {
          try {
            console.log(props.roomAlias);
            
            if (props.roomAlias)
              matrixClient
                .login("m.login.password", {
                  user: props.username,
                  password: props.password,
                })
                .then(async (response) => {
                  const room = await matrixClient.joinRoom(
                    `#${props.roomAlias}:matrix.org`
                  );
                  const publicRoom = room.getMembers();
                  console.log("publicRoom ", publicRoom);

                  const content: any = {
                    body: "message text b bb",
                    msgtype: "m.text",
                  };
                  matrixClient.sendEvent(
                    room.roomId,
                    "m.room.message",
                    content,
                    (err: any, res: any) => {
                      console.log(err);
                    }
                  );

                  console.log(room);

                  // const content = {
                  //   body: "message text",
                  //   msgtype: "m.text",
                  // };
                  // matrixClient.sendEvent(
                  //   "roomId",
                  //   "m.room.message",
                  //   content,
                  //   "",
                  //   (err, res) => {
                  //     console.log(err);
                  //   }
                  // );
                })
                .catch((error) => {
                  // Handle login error
                });

            // Step 2: Log in to the created account
            //   const loginDetails = {
            //     user: "freddy254",
            //     password: "1122,.Fred",
            //   };

            //   const loginResponse = await client.login(
            //     "m.login.password",
            //     loginDetails
            //   );

            //   const accessToken = loginResponse.access_token;
            //   console.log("Access Token:", accessToken);

            //   // Step 2: Get public room information
            //   const publicRoomAlias = "#fredtestung254:matrix.org"; // Replace with your desired public room alias or ID

            //   try {
            //     await client.joinRoom(publicRoomAlias);
            //   } catch (joinError) {
            //     console.error("Error joining room:", joinError);
            //     return;
            //   }

            //   const publicRoom = client.getRoom(publicRoomAlias);
            //   console.log("publicRoom", publicRoom);

            //   if (publicRoom) {
            //     console.log("Public Room ID:", publicRoom.roomId);
            //     console.log(
            //       "Public Room Members:",
            //       publicRoom.getJoinedMembers()
            //     );
            //     console.log(
            //       "Public Room Messages:",
            //       publicRoom.getLiveTimeline().getEvents()
            //     );
            //   } else {
            //     console.error("Public room not found.");
            //   }
          } catch (error) {
            console.error("Matrix operation error:", error);
          }
        };

        // Call the Matrix operations function
        handleMatrixOperations();
      }, [matrixClient]);

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
        <Section name={sectionNames.chats}>
          {children.username.propertyView({
            label: trans("chat.username"),
          })}
          {children.password.propertyView({
            label: trans("chat.password"),
          })}
          {children.roomAlias.propertyView({
            label: trans("chat.roomalias"),
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
      name: "closeDrawer",
      description: trans("drawer.closeDrawerDesc"),
      params: [],
    },
    execute: (comp, values) => {
      comp.children.visible.getView().onChange(false);
    },
  },
]);

export const ChatControllerComp = withExposingConfigs(MTComp, [
  new NameConfig("visible", trans("export.visibleDesc")),
  new NameConfig("credentials", trans("chat.credentials")),
]);
