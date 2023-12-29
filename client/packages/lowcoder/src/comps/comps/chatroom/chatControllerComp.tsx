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
  BooleanStateControl,
  jsonObjectExposingStateControl,
} from "comps/controls/codeStateControl";
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
import { useCallback, useEffect, useState } from "react";
import { ResizeHandle } from "react-resizable";
import styled from "styled-components";
import { useUserViewMode } from "util/hooks";
import { isNumeric } from "util/stringUtils";
import { NameConfig, withExposingConfigs } from "../../generators/withExposing";

import * as sdk from "matrix-js-sdk";

import { JSONValue, stateComp, withDefault } from "@lowcoder-ee/index.sdk";
import { getData } from "../listViewComp/listViewUtils";

const EventOptions = [closeEvent] as const;

const DEFAULT_SIZE = 378;
const DEFAULT_PADDING = 16;

export const matrixClient = sdk.createClient({
  baseUrl: "https://matrix.org",
  accessToken: "syt_ZnJlZGR5MjU0_DJVCzackXaImNUceaeUY_2Q2zwg",
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
  roomData: jsonObjectExposingStateControl(""),
  messages: stateComp<JSONValue>([]),
  participants: stateComp<JSONValue>([]),
};
let MTComp = (function () {
  return new ContainerCompBuilder(
    meetingControllerChildren,
    (props, dispatch) => {
      const isTopBom = ["top", "bottom"].includes(props.placement);
      const { items, ...otherContainerProps } = props.container;
      const userViewMode = useUserViewMode();
      const resizable = !userViewMode && (!isTopBom || !props.autoHeight);
      const [messages, setMessages] = useState<any>([]);
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
        var roomList: any = [];
        var viewingRoom: any = null;
        var numMessagesToShow = 20;

        // show the room list after syncing.
        matrixClient.on(
          "sync" as sdk.EmittedEvents,
          function (state: any, prevState: any, data: any) {
            switch (state) {
              case "PREPARED":
                setRoomList();
                printRoomList();
                break;
            }
          }
        );

        matrixClient.on("Room" as sdk.EmittedEvents, function () {
          setRoomList();
          if (!viewingRoom) {
            printRoomList();
          }
        });

        // print incoming messages.
        matrixClient.on(
          "Room.timeline" as sdk.EmittedEvents,
          function (event: any, room: any, toStartOfTimeline: any) {
            if (toStartOfTimeline) {
              return; // don't print paginated results
            }
            if (!viewingRoom || viewingRoom.roomId !== room.roomId) {
              return; // not viewing a room or viewing the wrong room.
            }
          }
        );

        function setRoomList() {
          roomList = matrixClient.getRooms();
          roomList.sort(function (a: any, b: any) {
            // < 0 = a comes first (lower index) - we want high indexes = newer
            var aMsg = a.timeline[a.timeline.length - 1];
            if (!aMsg) {
              return -1;
            }
            var bMsg = b.timeline[b.timeline.length - 1];
            if (!bMsg) {
              return 1;
            }
            if (aMsg.getTs() > bMsg.getTs()) {
              return 1;
            } else if (aMsg.getTs() < bMsg.getTs()) {
              return -1;
            }
            return 0;
          });
        }

        function printRoomList() {
          console.log("Room List:");
         
          for (var i = 0; i < roomList.length; i++) {
            var msg = roomList[i].timeline[roomList[i].timeline.length - 1];
            var dateStr = "---";
            var fmt;
            if (msg) {
              dateStr = new Date(msg.getTs())
                .toISOString()
                .replace(/T/, " ")
                .replace(/\..+/, "");
            }
            var myMembership = roomList[i].getMyMembership();
            
            
          }
        }



        matrixClient.startClient(
          
        ); // messages for each room.
      }, []);

      // useEffect(() => {
      //   let handleMatrixOperations = async () => {
      //     try {
      //       //check if room alias is available
      //       if (props.roomAlias)
      //         //init matrix client with username and password
      //         //TO BE CHANGED WITH THE SERVER TOKEN
      matrixClient
        .login("m.login.password", {
          user: props.username, 
          password: props.password,
        })
        .then(async (response) => { console.log(response);
         })
      //             matrixClient
      //               .joinRoom(`#${props.roomAlias}:matrix.org`)
      //               .then(async (room) => {
      //                 props.roomData.onChange({ roomId: room.roomId });
      //                 let members = room.getMembers();
      //                 console.log(members);
      //                 console.log("RoomState.members", members);

      //                 console.log(room);

      //               })
      //               .catch((e) => console.log(e));
      //             let messagesdata: any = [];

      //             matrixClient.on(
      //               "Room.timeline" as sdk.EmittedEvents,
      //               function (event: any, room: any, toStartOfTimeline: any) {
      //                 if (toStartOfTimeline) {
      //                   return;
      //                 }
      //                 if (event.getType() !== "m.room.message") {
      //                   return;
      //                 }
      //                 messagesdata.push({
      //                   user: {
      //                     name: event.getSender(),
      //                     avatar:
      //                       "https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png",
      //                   },
      //                   value: event.getContent().body,
      //                   createdAt: new Date(event.localTimestamp).toISOString(),
      //                   key: event.localTimestamp + "_" + Math.random(),
      //                 });
      //                 dispatch(
      //                   changeChildAction(
      //                     "messages",
      //                     getData(
      //                       [...messagesdata].sort(
      //                         (b: { key: any }, a: { key: any }) =>
      //                           b.key.toString().split("_")[0] -
      //                           a.key.toString().split("_")[0]
      //                       )
      //                     ).data,
      //                     false
      //                   )
      //                 );
      //               }
      //             );
      //                 matrixClient.on(
      //                   "RoomState.members" as sdk.EmittedEvents,
      //                   function (event: any, state: any, member: any) {
      //                     // console.log("participants", room.roomId);

      //                     // const roomm = matrixClient.getRoom(room.roomId);
      //                     // console.log("participants", roomm);
      //                     // if (!roomm) {
      //                     //   return;
      //                     // }
      //                     // const memberList = state.getMembers();
      //                     // console.log("participants", memberList);
      //                     // let participants: any = [];
      //                     // console.log(roomm.name);
      //                     // console.log(Array(roomm.name.length + 1).join("=")); // underline
      //                     // for (var i = 0; i < memberList.length; i++) {
      //                     //   console.log(
      //                     //     "(%s) %s",
      //                     //     memberList[i].membership,
      //                     //     memberList[i].name
      //                     //   );

      //                     //   participants.push({
      //                     //     user: memberList[i].membership,
      //                     //     name: memberList[i].name,
      //                     //     // key: event.localTimestamp + "_" + Math.random(),
      //                     //   });
      //                     // }
      //                     // console.log("participants", memberList);
      //                     // console.log("participants", participants);

      //                     // dispatch(
      //                     //   changeChildAction(
      //                     //     "participants",
      //                     //     getData([...participants]).data,
      //                     //     false
      //                     //   )
      //                     // );
      //                   }
      //                 );

      //             matrixClient.startClient();
      //           });

      //       // Step 2: Log in to the created account
      //       //   const loginDetails = {
      //       //     user: "freddy254",
      //       //     password: "1122,.Fred",
      //       //   };

      //       //   const loginResponse = await client.login(
      //       //     "m.login.password",
      //       //     loginDetails
      //       //   );

      //       //   const accessToken = loginResponse.access_token;
      //       //   console.log("Access Token:", accessToken);

      //       //   // Step 2: Get public room information
      //       //   const publicRoomAlias = "#fredtestung254:matrix.org"; // Replace with your desired public room alias or ID

      //       //   try {
      //       //     await client.joinRoom(publicRoomAlias);
      //       //   } catch (joinError) {
      //       //     console.error("Error joining room:", joinError);
      //       //     return;
      //       //   }

      //       //   const publicRoom = client.getRoom(publicRoomAlias);
      //       //   console.log("publicRoom", publicRoom);

      //       //   if (publicRoom) {
      //       //     console.log("Public Room ID:", publicRoom.roomId);
      //       //     console.log(
      //       //       "Public Room Members:",
      //       //       publicRoom.getJoinedMembers()
      //       //     );
      //       //     console.log(
      //       //       "Public Room Messages:",
      //       //       publicRoom.getLiveTimeline().getEvents()
      //       //     );
      //       //   } else {
      //       //     console.error("Public room not found.");
      //       //   }
      //     } catch (error) {
      //       console.error("Matrix operation error:", error);
      //     }
      //   };

      //   // Call the Matrix operations function
      //   handleMatrixOperations();
      // }, [matrixClient]);

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
  // {
  //   method: {
  //     name: "sendMessage",
  //     description: trans("drawer.openDrawerDesc"),
  //     params: [],
  //   },
  //   execute: (comp, values) => {
  //     comp.children.visible.getView().onChange(true);
  //   },
  // },
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
  new NameConfig("roomData", trans("chat.roomData")),
  new NameConfig("messages", ""),
  new NameConfig("participants", ""),
]);
