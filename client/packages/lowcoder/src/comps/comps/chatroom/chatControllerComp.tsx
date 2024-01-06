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
import { changeChildAction, CompAction } from "lowcoder-core";
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

import {
  JSONObject,
  JSONValue,
  stateComp,
  withDefault,
} from "@lowcoder-ee/index.sdk";
import { getData } from "../listViewComp/listViewUtils";
import { MatrixClient } from "matrix-js-sdk";

const EventOptions = [closeEvent] as const;

const DEFAULT_SIZE = 378;
const DEFAULT_PADDING = 16;

export const matrixClient: MatrixClient = sdk.createClient({
  baseUrl: "https://matrix.safiricabs.com",
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
  roomAlias: withDefault(StringControl, ""),
  roomData: jsonObjectExposingStateControl(""),
  messages: stateComp<JSONValue>([]),
  participants: stateComp<JSONValue>([]),
  roomLists: stateComp<JSONValue>([]),
  matrixAuthData: jsonObjectExposingStateControl(""),
  currentRoomData: jsonObjectExposingStateControl(""),
  joinedRoom: withDefault(BooleanStateControl, "false"),
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

      function printRoomInfo(room: { currentState: { events: any } }) {
        var eventMap = room.currentState.events;
        var eTypeHeader = "    Event Type(state_key)    ";
        var sendHeader = "        Sender        ";
        // pad content to 100
        var restCount =
          100 -
          "Content".length -
          " | ".length -
          " | ".length -
          eTypeHeader.length -
          sendHeader.length;
        var padSide = new Array(Math.floor(restCount / 2)).join(" ");
        var contentHeader = padSide + "Content" + padSide;
        console.log(eTypeHeader + sendHeader + contentHeader);
        console.log(new Array(100).join("-"));
        eventMap.keys().forEach(function (eventType: string) {
          if (eventType === "m.room.member") {
            return;
          } // use /members instead.
          var eventEventMap = eventMap.get(eventType);
          eventEventMap.keys().forEach(function (stateKey: string | any[]) {
            var typeAndKey =
              eventType + (stateKey.length > 0 ? "(" + stateKey + ")" : "");
            var typeStr = fixWidth(typeAndKey, eTypeHeader.length);
            var event = eventEventMap.get(stateKey);
            var sendStr = fixWidth(event.getSender(), sendHeader.length);
            var contentStr = fixWidth(
              JSON.stringify(event.getContent()),
              contentHeader.length
            );
            console.log(typeStr + " | " + sendStr + " | " + contentStr);
          });
        });
      }

      useEffect(() => {
        if (props.matrixAuthData.value.access_token == null) return;
        resourcesInit();
      }, [props.matrixAuthData.value]);

      useEffect(() => {
        if (props.roomData.value.roomId) {
          matrixClient
            .joinRoom(`${props.roomData.value.roomId}`)
            .then(async (room) => {
              let members = room.getMembers();
              console.log("members ", members);
              let participants: any = [];
              members.forEach((element: sdk.RoomMember) => {
                participants.push({
                  user: element.membership,
                  name: element.name,
                });
              });
              dispatch(
                changeChildAction(
                  "participants",
                  getData(participants).data,
                  false
                )
              );

              matrixClient.scrollback(room, 10).then(
                function (room) {
                  let messagesdata: any = [];
                  var events = room.getLiveTimeline().getEvents();
                  for (var i = 0; i < events.length; i++) {
                    let event = events[i];
                    let text = event.getContent().body;
                    var name = event.sender
                      ? event.sender.name
                      : event.getSender();
                    if (event.getContent().body) {
                      messagesdata.push({
                        user: {
                          name,
                          avatar:
                            "https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png",
                        },
                        value: text,
                        createdAt: new Date(event.localTimestamp).toISOString(),
                        key: event.localTimestamp + "_" + Math.random(),
                      });
                      // dispatch(
                      //   changeChildAction(
                      //     "messages",
                      //     getData(
                      //       [...messagesdata].sort(
                      //         (b: { key: any }, a: { key: any }) =>
                      //           b.key.toString().split("_")[0] -
                      //           a.key.toString().split("_")[0]
                      //       )
                      //     ).data,
                      //     false
                      //   )
                      // );
                    }
                  }

                  dispatchMessages(messagesdata);
                },
                function (err) {
                  console.log("/more Error: %s", err);
                }
              );
            })
            .catch((e) => console.log(e));
          let messagesdata: any = [];
          matrixClient.on(
            "Room.timeline" as sdk.EmittedEvents,
            function (event: any, room: any, toStartOfTimeline: any) {
              if (toStartOfTimeline) {
                return;
              }
              if (event.getType() !== "m.room.message") {
                return;
              }
              messagesdata.push({
                user: {
                  name: event.getSender(),
                  avatar:
                    "https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png",
                },
                value: event.getContent().body,
                createdAt: new Date(event.localTimestamp).toISOString(),
                key: event.localTimestamp + "_" + Math.random(),
              });
              dispatchMessages(messagesdata);
            }
          );
        }
      }, [props.roomData.value]);

      var roomList: any = [];
      var CLEAR_CONSOLE = "\x1B[2J";
      var viewingRoom: any = null;

      let resourcesInit = () => {
        // show the room list after syncing.
        matrixClient.on(
          "sync" as sdk.EmittedEvents,
          function (state: any, prevState: any, data: any) {
            switch (state) {
              case "PREPARED":
                if (props.matrixAuthData.value !== undefined) {
                  let rooms = props.matrixAuthData.value.rooms as
                    | number
                    | JSONObject[];
                  dispatch(
                    changeChildAction("roomLists", getData(rooms).data, false)
                  );
                }
                break;
            }
          }
        );

        // matrixClient.on("Room" as sdk.EmittedEvents, function () {
        //   // setRoomList();
        //   if (!viewingRoom) {
        //     // printRoomList();
        //   }
        // });
        // matrixClient.on(
        //   "Room.timeline" as sdk.EmittedEvents,
        //   function (event: any, room: { roomId: any }, toStartOfTimeline: any) {
        //     if (toStartOfTimeline) {
        //       return; // don't print paginated results
        //     }
        //     // printLine(event);
        //   }
        // );
      };

      // let messagesdata: any = [];
      function printLine(event: {
        sender: { name: any };
        getSender: () => any;
        getTs: () => string | number | Date;
        status: sdk.EventStatus;
        getType: () => string;
        getContent: () => { (): any; new (): any; body: string };
        isState: () => any;
        getStateKey: () => string;
      }) {
        var name = event.sender ? event.sender.name : event.getSender();
        var maxNameWidth = 15;
        if (name.length > maxNameWidth) {
          name = name.slice(0, maxNameWidth - 1) + "\u2026";
        }
        // messagesdata.push({
        //   user: {
        //     name: name,
        //     avatar:
        //       "https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png",
        //   },
        //   value: name,
        //   createdAt: new Date(event.getTs()).toISOString(),
        //   key: event.getTs() + "_" + Math.random(),
        // });
        // console.log("messagesdata", messagesdata);
        // dispatchMessages(messagesdata);
      }

      function setRoomList() {
        roomList = matrixClient.getRooms();
        console.log("roomList one", roomList.length);
        roomList.sort(function (
          a: { timeline: string | any[] },
          b: { timeline: string | any[] }
        ) {
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
        console.log(CLEAR_CONSOLE);
        console.log("Room List:");
        let rooms = [];
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
          if (myMembership) {
            // fmt = fmts[myMembership];
          }
          var roomName = fixWidth(roomList[i].name, 25);
          console.log(
            "[%s] %s (%s members)  %s",
            i,
            roomName,
            roomList[i].getJoinedMembers().length,
            dateStr
          );
          rooms.push({
            roomName: roomName,
            membersCount: roomList[i].getJoinedMembers().length,
          });
        }
        if (roomList.length > 0) {
          viewingRoom = roomList[0];
          props.currentRoomData.onChange({ roomName: roomList[0].name });
        }

        console.log(rooms);
        dispatch(changeChildAction("roomLists", getData(rooms).data, false));
      }
      function fixWidth(str: string, len: number) {
        if (str.length > len) {
          return str.substring(0, len - 2) + "\u2026";
        } else if (str.length < len) {
          return str + new Array(len - str.length).join(" ");
        }
        return str;
      }

      function printHelp() {
        // var hlp = clc.italic.white;
        console.log("Global commands:");
        console.log("  '/help' : Show this help.");
        console.log("Room list index commands:");
        console.log("  '/join <index>' Join a room, e.g. '/join 5'");
        console.log("Room commands:");
        console.log("  '/exit' Return to the room list index.");
        console.log("  '/members' Show the room member list.");
        console.log("  '/invite @foo:bar' Invite @foo:bar to the room.");
        console.log("  '/more 15' Scrollback 15 events");
        console.log(
          "  '/resend' Resend the oldest event which failed to send."
        );
        console.log("  '/roominfo' Display room info e.g. name, topic.");
      }

      let handleMatrixOperations = async (room: any) => {
        matrixClient
          .joinRoom(`#${room}:matrix.safiricabs.com`)
          .then(async (room) => {
            props.roomData.onChange({ roomId: room.roomId });
            let members = room.getMembers();
          })
          .catch((e) => console.log(e));
        let messagesdata: any = [];

        matrixClient.on(
          "RoomState.members" as sdk.EmittedEvents,
          function (event: any, state: any, member: any) {
            const roomm = matrixClient.getRoom(room.roomId);
            if (!roomm) {
              return;
            }
            const memberList = state.getMembers();
            getMembers(memberList);
          }
        );
      };
      const dispatchMessages = (messagesdata: any) => {
        dispatch(
          changeChildAction(
            "messages",
            getData(
              [...messagesdata].sort(
                (b: { key: any }, a: { key: any }) =>
                  b.key.toString().split("_")[0] -
                  a.key.toString().split("_")[0]
              )
            ).data,
            false
          )
        );
      };

      const getMembers = (memberList: any) => {
        let participants: any = [];
        for (var i = 0; i < memberList.length; i++) {
          console.log("(%s) %s", memberList[i].membership, memberList[i].name);
          participants.push({
            user: memberList[i].membership,
            name: memberList[i].name,
            // key: event.localTimestamp + "_" + Math.random(),
          });
        }

        dispatch(
          changeChildAction(
            "participants",
            getData([...participants]).data,
            false
          )
        );
      };

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
      name: "createRoom",
      description: trans("drawer.openDrawerDesc"),
      params: [],
    },
    execute: async (comp, values) => {
        console.log(values);
      if (values && values.length > 0) {
        const firstValue = values[0];
        if (
          typeof firstValue === "object" &&
          firstValue !== null &&
          "name" in firstValue
        ) {
          console.log(firstValue);
          const name: any = firstValue.name;
          const topic: any = firstValue.topic;
          // Create a room
          matrixClient
            .createRoom({
              visibility: sdk.Visibility.Public,
              name: name,
              topic: topic,
            })
            .then((response) => {
              const roomId = response.room_id;
              console.log(`Created room: ${roomId}`); 
            })
            .catch((error) => {
              console.error(`Failed to create room: ${error.message}`);
            });
        } else {
          console.error(
            "The first element of values is not an object or doesn't have a 'name' property"
          );
        }
      } else {
        console.error("The values array is null, undefined, or empty");
      }
    },
  },
  {
    method: {
      name: "leaveRoom",
      description: trans("drawer.openDrawerDesc"),
      params: [],
    },
    execute: async (comp, values) => {
      if (values && values.length > 0) {
        const firstValue = values[0];
        if (
          typeof firstValue === "object" &&
          firstValue !== null &&
          "name" in firstValue
        ) {
          console.log(firstValue);
          const name: any = firstValue.roomId;
          matrixClient
            .leave(name)
            .then(() => {
              console.log(`Left room: ${name}`);
            })
            .catch((error) => {
              console.error(`Failed to leave room: ${error.message}`);
            });
        } else {
          console.error(
            "The first element of values is not an object or doesn't have a 'name' property"
          );
        }
      } else {
        console.error("The values array is null, undefined, or empty");
      }
    },
  },
  {
    method: {
      name: "joinRoom",
      description: trans("drawer.openDrawerDesc"),
      params: [],
    },
    execute: async (comp, values) => {
      if (values && values.length > 0) {
        const firstValue = values[0];
        if (
          typeof firstValue === "object" &&
          firstValue !== null &&
          "name" in firstValue
        ) {
          const name = firstValue.name;
          comp.children.roomData.change({
            roomId: firstValue.roomId,
            name: name,
          });
        } else {
          console.error(
            "The first element of values is not an object or doesn't have a 'name' property"
          );
        }
      } else {
        console.error("The values array is null, undefined, or empty");
      }
    },
  },
  {
    method: {
      name: "initMatrix",
      description: trans("drawer.openDrawerDesc"),
      params: [],
    },
    execute: async (comp, values) => {
      let response = await matrixClient.login("org.matrix.login.jwt", {
        token: values[0],
      });
      await matrixClient.startClient(); 

      let allRooms = await matrixClient.publicRooms();
      
      let rooms: any = [];
      allRooms.chunk.forEach((room) => {
        rooms.push({
          name: room.name,
          roomId: room.room_id,
          membersCount: room.num_joined_members.toString(),
        });
      });

      comp.children.matrixAuthData.change({
        access_token: response.access_token,
        user_id: response.user_id,
        rooms,
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

export const ChatControllerComp = withExposingConfigs(MTComp, [
  new NameConfig("visible", trans("export.visibleDesc")),
  new NameConfig("credentials", trans("chat.credentials")),
  new NameConfig("roomData", trans("chat.roomData")),
  new NameConfig("messages", ""),
  new NameConfig("participants", ""),
  new NameConfig("roomLists", ""),
]);
