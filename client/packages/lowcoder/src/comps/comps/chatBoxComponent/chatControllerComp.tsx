import React, { useCallback, useEffect, useRef, useState } from "react";
import { ResizeHandle } from "react-resizable";
import { v4 as uuidv4 } from "uuid";
import { chatCompChildrenMap, ChatCompChildrenType, ChatPropertyView } from "./chatUtils";
import { trans } from "i18n";
import { ToViewReturn } from "@lowcoder-ee/comps/generators/multi";
import Form from "antd/es/form";
import { useCompClickEventHandler } from "@lowcoder-ee/comps/utils/useCompClickEventHandler";
import { useChatManager, UseChatManagerReturn } from "./hooks/useChatManager";
import { ContainerChildren, ContainerCompBuilder } from "../containerBase/containerCompBuilder";
import { withMethodExposing } from "@lowcoder-ee/comps/generators/withMethodExposing";
import { BackgroundColorContext } from "@lowcoder-ee/comps/utils/backgroundColorContext";
import Drawer from "antd/es/drawer";
import { isNumeric } from "@lowcoder-ee/util/stringUtils";
import { gridItemCompToGridItems, InnerGrid } from "../containerComp/containerView";
import { HintPlaceHolder } from "components/container";
import { NameConfig, withExposingConfigs } from "@lowcoder-ee/comps/generators/withExposing";
import { BooleanStateControl } from "@lowcoder-ee/comps/controls/codeStateControl";
import { StringControl } from "@lowcoder-ee/comps/controls/codeControl";
import { stateComp, withDefault } from "@lowcoder-ee/comps/generators/simpleGenerators";
import { PositionControl } from "@lowcoder-ee/comps/controls/dropdownControl";
import { BoolControl } from "@lowcoder-ee/comps/controls/boolControl";
import { NewChildren } from "@lowcoder-ee/comps/generators/uiCompBuilder";
import { changeChildAction, ConstructorToComp, DispatchType, RecordConstructorToComp } from "lowcoder-core";
import { Layers } from "@lowcoder-ee/constants/Layers";
import { JSONObject } from "@lowcoder-ee/util/jsonTypes";

const DEFAULT_SIZE = 378;
const DEFAULT_PADDING = 16;
function transToPxSize(size: string | number) {
  return isNumeric(size) ? size + "px" : (size as string);
}

const handleCreateRoom = async (
  comp: ConstructorToComp<typeof ChatControllerComp>,
  roomData: {
    name: string,
    description: string,
    private: boolean,
  },
) => {
  const chatManager = comp.children.chatManager.getView() as unknown as UseChatManagerReturn;
  const userId = comp.children.userId.getView();
  const userName = comp.children.userName.getView();

  try {
    const newRoom = await chatManager.createRoomFromRequest({
      name: roomData.name.trim(),
      type: roomData.private ? "private" : "public",
      description: roomData.description || `Created by ${userName}`
    });
    
    if (newRoom) {
      console.log('[ChatBox] ✅ Created room:', newRoom.name);
      
      // Automatically join the room as the creator
      const joinSuccess = await chatManager.joinRoom(newRoom.id);
      return joinSuccess;
    }
  } catch (error) {
    console.error('Failed to create room:', error);
  }
};

const handleJoinRoom = async (
  comp: ConstructorToComp<typeof ChatControllerComp>,
  roomId: string,
) => {
  const chatManager = comp.children.chatManager.getView() as unknown as UseChatManagerReturn;
  try {
    const success = await chatManager.joinRoom(roomId);
    if (!success) {
      console.error('[ChatBox] ❌ Failed to join room:', roomId);
    }
  } catch (error) {
    console.error('[ChatBox] 💥 Error joining room:', error);
  }
};


const handleLeaveRoom = async (
  comp: ConstructorToComp<typeof ChatControllerComp>,
  roomId: string,
) => {
  try {
    const chatManager = comp.children.chatManager.getView() as unknown as UseChatManagerReturn;
    console.log('[ChatBox] 🚪 Attempting to leave room:', roomId);

    const success = await chatManager.leaveRoom(roomId);
    return success;
  } catch (error) {
    console.error('[ChatBox] 💥 Error leaving room:', error);
  }
};

const handleSetCurrentRoom = async (
  comp: ConstructorToComp<typeof ChatControllerComp>,
  roomId: string,
) => {
  try {
    const chatManager = comp.children.chatManager.getView() as unknown as UseChatManagerReturn;
    await chatManager.setCurrentRoom(roomId);
  } catch (error) {
    console.error('Failed to set current room:', error);
  }
};

const handleSendMessage = async (
  comp: ConstructorToComp<typeof ChatControllerComp>,
  currentMessage: string,
) => {
  try {
    const chatManager = comp.children.chatManager.getView() as unknown as UseChatManagerReturn;
    if (currentMessage.trim()) {
      const success = await chatManager.sendMessage(currentMessage.trim());
      return success;
    }
  } catch (error) {
    console.error('[ChatBox] 💥 Error sending message:', error);
  }
};

const handleStartTyping = (
  comp: ConstructorToComp<typeof ChatControllerComp>,
) => {
  try {
    const chatManager = comp.children.chatManager.getView() as unknown as UseChatManagerReturn;
    chatManager.startTyping();
  } catch (error) {
    console.error('[ChatBox] 💥 Error starting typing:', error);
  }
};

const handleStopTyping = (
  comp: ConstructorToComp<typeof ChatControllerComp>,
) => {
  try {
    const chatManager = comp.children.chatManager.getView() as unknown as UseChatManagerReturn;
    chatManager.stopTyping();
  } catch (error) {
    console.error('[ChatBox] 💥 Error stopping typing:', error);
  }
};

const handleJoinUser = async (
  comp: ConstructorToComp<typeof ChatControllerComp>,
  userId: string,
  userName: string,
) => {
  try {
    // Update the component's internal state with public user credentials
    comp.children.userId.getView().onChange(userId);
    comp.children.userName.getView().onChange(userName);
    
    console.log('[ChatController] 👤 Public user joined as:', { userId, userName });
    
    // The chat manager will automatically reconnect with new credentials
    // due to the useEffect that watches for userId/userName changes
    return true;
  } catch (error) {
    console.error('[ChatBox] 💥 Error joining as public user:', error);
    return false;
  }
};

const childrenMap = {
  ...chatCompChildrenMap,
  visible: withDefault(BooleanStateControl, "false"),
  width: StringControl,
  height: StringControl,
  placement: PositionControl,
  maskClosable: withDefault(BoolControl, true),
  showMask: withDefault(BoolControl, true),
  rooms: stateComp<JSONObject[]>([]),
  messages: stateComp<JSONObject[]>([]),
  chatManager: stateComp<JSONObject>({}),
  participants: stateComp<JSONObject[]>([]),
  currentRoom: stateComp<JSONObject | null>(null),
  typingUsers: stateComp<JSONObject[]>([]),
}

type ChatControllerChildrenType = NewChildren<RecordConstructorToComp<typeof childrenMap>>;

const CanvasContainerID = "__canvas_container__";

const ChatBoxView = React.memo((
  props: ToViewReturn<ContainerChildren<ChatControllerChildrenType>> & { dispatch: DispatchType },
) => {
  const { dispatch } = props;
  const { items, ...otherContainerProps } = props.container;
  const isTopBom = ["top", "bottom"].includes(props.placement);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [joinedRooms, setJoinedRooms] = useState<any[]>([]);
  const [currentRoomParticipants, setCurrentRoomParticipants] = useState<Array<{ id: string; name: string }>>([]);
  const handleClickEvent = useCompClickEventHandler({onEvent: props.onEvent});

  // Initialize chat manager  
  const modeValue = props.mode as 'local' | 'collaborative' | 'hybrid';
  
  // Only initialize chat manager if userId and userName are provided
  const shouldInitialize = !!(props.userId.value && props.userName.value);
  
  const chatManager = useChatManager({
    userId: props.userId.value,
    userName: props.userName.value,
    applicationId: props.applicationId.value, 
    roomId: props.roomId.value,
    mode: modeValue, // Use mode from props
    autoConnect: shouldInitialize, // Only auto-connect if credentials are provided
  });

  useEffect(() => {
    if (!chatManager.isConnected) return;

    dispatch(
      changeChildAction("chatManager", chatManager as any, false)
    )
  }, [chatManager.isConnected]);

  const loadRooms = useCallback(async () => {
    if (!chatManager.isConnected) return;
    try {
      const allRooms = await chatManager.getAvailableRooms();
      
      if (!allRooms || !Array.isArray(allRooms)) {
        // Keep existing joined rooms if API fails
        return;
      }
      console.log('[ChatBox] 📋 Found joined rooms:', allRooms.map((r: any) => r.name));
      
      setJoinedRooms(allRooms);
      dispatch(
        changeChildAction("rooms", allRooms as any, false)
      )
    } catch (error) {
      console.error('[ChatBox] 💥 Failed to load joined rooms:', error);
    }
  }, [chatManager.isConnected, dispatch]);

  // Load joined rooms when connected
  useEffect(() => {
    if (chatManager.isConnected) {
      loadRooms();
    }
  }, [chatManager.isConnected, props.userId.value, loadRooms]);

  // Handle reconnection when userId or userName changes
  useEffect(() => {
    if (props.userId.value && props.userName.value) {
      if (chatManager.isConnected) {
        // Disconnect and let the chat manager reconnect with new credentials
        chatManager.disconnect().then(() => {
          console.log('[ChatController] 🔄 Reconnecting with new user credentials');
        });
      } else {
        // If not connected and we have credentials, trigger connection
        console.log('[ChatController] 🔌 Connecting with user credentials');
      }
    }
  }, [props.userId.value, props.userName.value]);

  // Refresh joined rooms periodically
  useEffect(() => {
    if (!chatManager.isConnected) return;
    
    const refreshInterval = setInterval(async () => {
      loadRooms();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(refreshInterval);
  }, [chatManager.isConnected, props.userId.value, loadRooms]);

  const { 
    isConnected, 
    isLoading, 
    error, 
    currentRoom, 
    messages, 
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    getRoomParticipants
  } = chatManager;

  useEffect(() => {
    if (!isConnected) return;

    dispatch(
      changeChildAction("messages", messages as any, false)
    )
  }, [isConnected, messages]);

  // Load participants when current room changes
  useEffect(() => {
    const loadParticipants = async () => {
      if (currentRoom && getRoomParticipants) {
        try {
          const participants = await getRoomParticipants(currentRoom.id);
          setCurrentRoomParticipants(participants);
          console.log('[ChatController] 👥 Loaded participants for room:', currentRoom.name, participants);
        } catch (error) {
          console.error('[ChatController] Failed to load participants:', error);
        }
      }
    };

    loadParticipants();
  }, [currentRoom, getRoomParticipants]);

  // Update participants state
  useEffect(() => {
    if (!chatManager.isConnected) return;

    dispatch(
      changeChildAction("participants", currentRoomParticipants as any, false)
    );
  }, [currentRoomParticipants]);

  // Update currentRoom state
  useEffect(() => {
    if (!chatManager.isConnected) return;

    dispatch(
      changeChildAction("currentRoom", currentRoom as any, false)
    );
  }, [currentRoom]);

  // Update typingUsers state
  useEffect(() => {
    if (!chatManager.isConnected) return;

    dispatch(
      changeChildAction("typingUsers", typingUsers as any, false)
    );
  }, [typingUsers]);

  return (
    <BackgroundColorContext.Provider value={props.style.background}>
      {/* <DrawerWrapper> */}
      <Drawer
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
    </BackgroundColorContext.Provider>
  );
});

let ChatControllerComp = new ContainerCompBuilder(
  childrenMap,
  (props, dispatch) => <ChatBoxView {...props} dispatch={dispatch} />
)
  .setPropertyViewFn((children) => <ChatPropertyView children={children} />)
  .build();

ChatControllerComp = class extends ChatControllerComp {
  autoHeight(): boolean {
    return false;
  }


};

ChatControllerComp = withMethodExposing(ChatControllerComp, [
  {
    method: {
      name: "createRoom",
      params: [
        {
          name: "name",
          type: "string",
        },
        {
          name: "description",
          type: "string",
        },
        {
          name: "private",
          type: "boolean",
        },
      ],
    },
    execute: async (comp: ConstructorToComp<typeof ChatControllerComp>, values: any) => {
      handleCreateRoom(comp, {
        name: values?.[0],
        private: values?.[1],
        description: values?.[2],
      });
    },
  },
  {
    method: {
      name: "setCurrentRoom",
      params: [
        {
          name: "roomId",
          type: "string",
        },
      ],
    },
    execute: async (comp: ConstructorToComp<typeof ChatControllerComp>, values: any) => {
      handleSetCurrentRoom(comp, values?.[0]);
    },
  },
  {
    method: {
      name: "joinRoom",
      params: [
        {
          name: "roomId",
          type: "string",
        },
      ],
    },
    execute: async (comp: ConstructorToComp<typeof ChatControllerComp>, values: any) => {
      handleJoinRoom(comp, values?.[0]);
    },
  },
  {
    method: {
      name: "leaveRoom",
      params: [
        {
          name: "roomId",
          type: "string",
        },
      ],
    },
    execute: async (comp: ConstructorToComp<typeof ChatControllerComp>, values: any) => {
      handleLeaveRoom(comp, values?.[0]);
    },
  },
  {
    method: {
      name: "startTyping",
      params: [],
    },
    execute: async (comp: ConstructorToComp<typeof ChatControllerComp>, values: any) => {
      handleStartTyping(comp);
    },
  },
  {
    method: {
      name: "stopTyping",
      params: [],
    },
    execute: async (comp: ConstructorToComp<typeof ChatControllerComp>, values: any) => {
      handleStopTyping(comp);
    },
  },
  {
    method: {
      name: "sendMessage",
      params: [
        {
          name: "message",
          type: "string",
        },
      ],
    },
    execute: async (comp: ConstructorToComp<typeof ChatControllerComp>, values: any) => {
      handleSendMessage(comp, values?.[0]);
    },
  },
  {
    method: {
      name: "joinUser",
      description: "Allow users to join the chat server with their own credentials",
      params: [
        {
          name: "userId",
          type: "string",
        },
        {
          name: "userName",
          type: "string",
        },
      ],
    },
    execute: async (comp: ConstructorToComp<typeof ChatControllerComp>, values: any) => {
      return await handleJoinUser(comp, values?.[0], values?.[1]);
    },
  },
]);

ChatControllerComp = withExposingConfigs(ChatControllerComp, [
  new NameConfig("chatName", trans("chatBox.chatName")),
  new NameConfig("rooms", trans("chatBox.rooms")),
  new NameConfig("messages", trans("chatBox.messages")),
  new NameConfig("participants", trans("chatBox.participants")),
  new NameConfig("currentRoom", trans("chatBox.currentRoom")),
  new NameConfig("typingUsers", trans("chatBox.typingUsers")),
  new NameConfig("allowRoomCreation", trans("chatBox.allowRoomCreation")),
  new NameConfig("allowRoomJoining", trans("chatBox.allowRoomJoining")),
  new NameConfig("roomPermissionMode", trans("chatBox.roomPermissionMode")),
  new NameConfig("userId", trans("chatBox.userId")),
  new NameConfig("userName", trans("chatBox.userName")),
]);

export { ChatControllerComp };
