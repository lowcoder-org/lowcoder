import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Section, sectionNames } from "lowcoder-design";
import { PropertyViewDocLink } from "comps/utils/propertyViewDocLink";
import {
  simpleMultiComp,
  stateComp,
  withPropertyViewFn,
  withViewFn,
} from "../generators";
import { NameConfig, withExposingConfigs } from "../generators/withExposing";
import { withMethodExposing } from "../generators/withMethodExposing";
import { stringExposingStateControl } from "comps/controls/codeStateControl";
import { eventHandlerControl } from "comps/controls/eventHandlerControl";
import { JSONObject } from "../../util/jsonTypes";
import { isEmpty, omit } from "lodash";
import { trans } from "i18n";
import {
  HocuspocusRoomProvider,
  useStorage,
  useMyPresence,
  useOthers,
  useConnection,
} from "../comps/chatBoxComponent/store";
import type {
  AiThinkingState,
  OnlineUser,
  TypingUser,
} from "../comps/chatBoxComponent/store";

// ─── Event definitions ──────────────────────────────────────────────────────

const ChatControllerEvents = [
  {
    label: trans("chatController.userJoined"),
    value: "userJoined",
    description: trans("chatController.userJoinedDesc"),
  },
  {
    label: trans("chatController.userLeft"),
    value: "userLeft",
    description: trans("chatController.userLeftDesc"),
  },
  {
    label: trans("chatController.roomSwitched"),
    value: "roomSwitched",
    description: trans("chatController.roomSwitchedDesc"),
  },
  {
    label: trans("chatController.connected"),
    value: "connected",
    description: trans("chatController.connectedDesc"),
  },
  {
    label: trans("chatController.disconnected"),
    value: "disconnected",
    description: trans("chatController.disconnectedDesc"),
  },
  {
    label: trans("chatController.error"),
    value: "error",
    description: trans("chatController.errorDesc"),
  },
  {
    label: trans("chatController.aiThinkingStarted"),
    value: "aiThinkingStarted",
    description: trans("chatController.aiThinkingStartedDesc"),
  },
  {
    label: trans("chatController.aiThinkingStopped"),
    value: "aiThinkingStopped",
    description: trans("chatController.aiThinkingStoppedDesc"),
  },
  {
    label: trans("chatController.sharedStateChanged"),
    value: "sharedStateChanged",
    description: trans("chatController.sharedStateChangedDesc"),
  },
  {
    label: trans("chatController.roomDataChanged"),
    value: "roomDataChanged",
    description: trans("chatController.roomDataChangedDesc"),
  },
] as const;

// ─── Children map ───────────────────────────────────────────────────────────

const childrenMap = {
  applicationId: stringExposingStateControl("applicationId", "lowcoder_app"),
  userId: stringExposingStateControl("userId", "user_1"),
  userName: stringExposingStateControl("userName", trans("chatController.userNameDefault")),

  onEvent: eventHandlerControl(ChatControllerEvents),

  ready: stateComp<boolean>(false),
  error: stateComp<string | null>(null),
  connectionStatus: stateComp<string>(trans("chatController.connectingStatus")),
  onlineUsers: stateComp<JSONObject[]>([]),
  typingUsers: stateComp<JSONObject[]>([]),
  currentRoomId: stateComp<string | null>(null),
  aiThinkingRooms: stateComp<JSONObject>({}),
  sharedState: stateComp<JSONObject>({}),
  roomData: stateComp<JSONObject>({}),

  _controllerActions: stateComp<JSONObject>({}),
};

// ─── Chat controller actions interface ───────────────────────────────────────

interface ChatControllerActions {
  startTyping: (roomId?: string) => void;
  stopTyping: () => void;
  switchRoom: (roomId: string) => void;
  setAiThinking: (roomId: string, isThinking: boolean) => void;
  setSharedState: (key: string, value: any) => void;
  deleteSharedState: (key: string) => void;
  setRoomData: (roomId: string, key: string, value: any) => void;
  deleteRoomData: (roomId: string, key?: string) => void;
}

// ─── Inner component that uses Hocuspocus hooks ─────────────────────────────

interface ChatControllerRuntimeProps {
  comp: any;
  userId: string;
  userName: string;
}

const ChatControllerRuntime = React.memo(
  ({ comp, userId, userName }: ChatControllerRuntimeProps) => {
    const connection = useConnection();
    const [, setMyPresence] = useMyPresence();
    const others = useOthers();
    const [aiActivity, aiActivityYMap] = useStorage("aiActivity");
    const [sharedStateData, sharedStateYMap] = useStorage("sharedState");
    const [roomDataData, roomDataYMap] = useStorage("roomData");

    const compRef = useRef(comp);
    compRef.current = comp;

    const triggerEvent = comp.children.onEvent.getView();
    const triggerEventRef = useRef(triggerEvent);
    triggerEventRef.current = triggerEvent;

    const prevRef = useRef<{
      ready: boolean;
      onlineCount: number;
      onlineInitialized: boolean;
      sharedStateInitialized: boolean;
      roomDataInitialized: boolean;
      aiThinkingInitialized: boolean;
      aiThinkingRooms: Record<string, boolean>;
    }>({
      ready: false,
      onlineCount: 0,
      onlineInitialized: false,
      sharedStateInitialized: false,
      roomDataInitialized: false,
      aiThinkingInitialized: false,
      aiThinkingRooms: {},
    });

    // ── Connection state ──────────────────────────────────────────────
    const ready = connection.state === "open";
    const connectionLabel = useMemo(() => {
      if (connection.state === "open") return trans("chatController.onlineStatus");
      if (connection.state === "connecting") return trans("chatController.connectingStatus");
      return trans("chatController.offlineStatus");
    }, [connection.state]);

    useEffect(() => {
      compRef.current.children.ready.dispatchChangeValueAction(ready);
      compRef.current.children.connectionStatus.dispatchChangeValueAction(connectionLabel);
      if (ready) {
        compRef.current.children.error.dispatchChangeValueAction(null);
      }
      if (ready && !prevRef.current.ready) {
        triggerEventRef.current("connected");
      }
      if (!ready && prevRef.current.ready) {
        triggerEventRef.current("disconnected");
      }
      prevRef.current.ready = ready;
    }, [ready, connectionLabel]);

    // ── Online users ──────────────────────────────────────────────────
    const onlineUsers = useMemo<OnlineUser[]>(() => {
      return others
        .filter((o: any) => o.presence != null)
        .map((o: any) => ({
          userId: o.presence.userId as string,
          userName: o.presence.userName as string,
          currentRoomId: (o.presence.currentRoomId as string) || null,
        }));
    }, [others]);

    useEffect(() => {
      compRef.current.children.onlineUsers.dispatchChangeValueAction(
        onlineUsers as unknown as JSONObject[],
      );
      if (prevRef.current.onlineInitialized) {
        if (onlineUsers.length > prevRef.current.onlineCount) {
          triggerEventRef.current("userJoined");
        } else if (onlineUsers.length < prevRef.current.onlineCount) {
          triggerEventRef.current("userLeft");
        }
      }
      prevRef.current.onlineCount = onlineUsers.length;
      prevRef.current.onlineInitialized = true;
    }, [onlineUsers]);

    // ── Typing users ──────────────────────────────────────────────────
    const currentRoomId = comp.children.currentRoomId.getView() as string | null;

    const typingUsers = useMemo<TypingUser[]>(() => {
      return others
        .filter((o: any) => {
          if (!o.presence?.typing) return false;
          if (o.presence.userId === userId) return false;
          if (currentRoomId && o.presence.currentRoomId !== currentRoomId)
            return false;
          return true;
        })
        .map((o: any) => ({
          userId: o.presence.userId as string,
          userName: o.presence.userName as string,
          roomId: o.presence.currentRoomId as string,
        }));
    }, [others, currentRoomId, userId]);

    useEffect(() => {
      compRef.current.children.typingUsers.dispatchChangeValueAction(
        typingUsers as unknown as JSONObject[],
      );
    }, [typingUsers]);

    // ── Watch AI activity (thinking state per room) ───────────────
    useEffect(() => {
      if (!aiActivity) return;
      const activityRecord = aiActivity as Record<string, AiThinkingState>;
      const nextThinking: Record<string, boolean> = {};

      for (const [roomId, state] of Object.entries(activityRecord)) {
        nextThinking[roomId] = state.isThinking;
        if (!prevRef.current.aiThinkingInitialized) {
          continue;
        }

        const prev = prevRef.current.aiThinkingRooms[roomId] ?? false;
        if (state.isThinking && !prev) {
          triggerEventRef.current("aiThinkingStarted");
        } else if (!state.isThinking && prev) {
          triggerEventRef.current("aiThinkingStopped");
        }
      }

      if (prevRef.current.aiThinkingInitialized) {
        for (const [roomId, wasThinking] of Object.entries(prevRef.current.aiThinkingRooms)) {
          if (wasThinking && !(roomId in nextThinking)) {
            triggerEventRef.current("aiThinkingStopped");
          }
        }
      }

      prevRef.current.aiThinkingRooms = nextThinking;
      prevRef.current.aiThinkingInitialized = true;
      compRef.current.children.aiThinkingRooms.dispatchChangeValueAction(
        nextThinking as unknown as JSONObject,
      );
    }, [aiActivity]);

    // ── Watch shared state ──────────────────────────────────────────
    useEffect(() => {
      if (!sharedStateData) return;
      compRef.current.children.sharedState.dispatchChangeValueAction(
        sharedStateData as unknown as JSONObject,
      );
      if (prevRef.current.sharedStateInitialized) {
        triggerEventRef.current("sharedStateChanged");
      }
      prevRef.current.sharedStateInitialized = true;
    }, [sharedStateData]);

    // ── Watch room data ──────────────────────────────────────────────
    useEffect(() => {
      if (!roomDataData) return;
      compRef.current.children.roomData.dispatchChangeValueAction(
        roomDataData as unknown as JSONObject,
      );
      if (prevRef.current.roomDataInitialized) {
        triggerEventRef.current("roomDataChanged");
      }
      prevRef.current.roomDataInitialized = true;
    }, [roomDataData]);

    // ── Actions for method invocation ─────────────────────────────────

    const startTyping = useCallback(
      (roomId?: string) => {
        setMyPresence({
          userId,
          userName,
          currentRoomId: roomId || currentRoomId || null,
          typing: true,
        });
      },
      [setMyPresence, userId, userName, currentRoomId],
    );

    const stopTyping = useCallback(() => {
      setMyPresence({
        userId,
        userName,
        currentRoomId: currentRoomId,
        typing: false,
      });
    }, [setMyPresence, userId, userName, currentRoomId]);

    const switchRoom = useCallback(
      (roomId: string) => {
        compRef.current.children.currentRoomId.dispatchChangeValueAction(roomId);
        setMyPresence({
          userId,
          userName,
          currentRoomId: roomId,
          typing: false,
        });
        triggerEventRef.current("roomSwitched");
      },
      [setMyPresence, userId, userName],
    );

    const setAiThinking = useCallback(
      (roomId: string, isThinking: boolean) => {
        if (!aiActivityYMap) return;
        const state: AiThinkingState = {
          roomId,
          isThinking,
          timestamp: Date.now(),
        };
        aiActivityYMap.set(roomId, state);
      },
      [aiActivityYMap],
    );

    // ── Shared state actions ─────────────────────────────────────────
    const setSharedState = useCallback(
      (key: string, value: any) => {
        if (!sharedStateYMap) return;
        sharedStateYMap.set(key, value);
      },
      [sharedStateYMap],
    );

    const deleteSharedState = useCallback(
      (key: string) => {
        if (!sharedStateYMap) return;
        sharedStateYMap.delete(key);
      },
      [sharedStateYMap],
    );

    // ── Room data actions ────────────────────────────────────────────
    const setRoomData = useCallback(
      (roomId: string, key: string, value: any) => {
        if (!roomDataYMap) return;
        const existing = (roomDataYMap.get(roomId) as Record<string, any>) || {};
        roomDataYMap.set(roomId, { ...existing, [key]: value });
      },
      [roomDataYMap],
    );

    const deleteRoomData = useCallback(
      (roomId: string, key?: string) => {
        if (!roomDataYMap) return;
        if (key) {
          const existing = (roomDataYMap.get(roomId) as Record<string, any>) || {};
          const remaining = omit(existing, key);
          if (isEmpty(remaining)) {
            roomDataYMap.delete(roomId);
          } else {
            roomDataYMap.set(roomId, remaining);
          }
        } else {
          roomDataYMap.delete(roomId);
        }
      },
      [roomDataYMap],
    );

    // ── Proxy ref for stable callbacks ────────────────────────────────
    const actionsRef = useRef<ChatControllerActions>({
      startTyping,
      stopTyping,
      switchRoom,
      setAiThinking,
      setSharedState,
      deleteSharedState,
      setRoomData,
      deleteRoomData,
    });
    actionsRef.current = {
      startTyping,
      stopTyping,
      switchRoom,
      setAiThinking,
      setSharedState,
      deleteSharedState,
      setRoomData,
      deleteRoomData,
    };

    useEffect(() => {
      const proxy: ChatControllerActions = {
        startTyping: (...args) => actionsRef.current.startTyping(...args),
        stopTyping: () => actionsRef.current.stopTyping(),
        switchRoom: (...args) => actionsRef.current.switchRoom(...args),
        setAiThinking: (...args) => actionsRef.current.setAiThinking(...args),
        setSharedState: (...args) => actionsRef.current.setSharedState(...args),
        deleteSharedState: (...args) => actionsRef.current.deleteSharedState(...args),
        setRoomData: (...args) => actionsRef.current.setRoomData(...args),
        deleteRoomData: (...args) => actionsRef.current.deleteRoomData(...args),
      };
      compRef.current.children._controllerActions.dispatchChangeValueAction(
        proxy as unknown as JSONObject,
      );
    }, []);

    // ── Set / restore presence on connect or peer changes ────────────
    useEffect(() => {
      if (!ready) return;
      const roomId = compRef.current.children.currentRoomId.getView() as string | null;
      setMyPresence({
        userId,
        userName,
        currentRoomId: roomId,
        typing: false,
      });
    }, [ready, others.length, setMyPresence, userId, userName]);

    return null;
  },
);

ChatControllerRuntime.displayName = "ChatControllerRuntime";

// ─── View function (wraps HocuspocusRoomProvider) ────────────────────────────

const ChatControllerBase = withViewFn(
  simpleMultiComp(childrenMap),
  (comp) => {
    const userId = comp.children.userId.getView().value;
    const userName = comp.children.userName.getView().value;
    const applicationId = comp.children.applicationId.getView().value;

    const roomName = `signal_${applicationId || "lowcoder_app"}`;

    return (
      <HocuspocusRoomProvider
        room={roomName}
        initialPresence={{
          userId: userId || "user_1",
          userName: userName || trans("chatController.userNameDefault"),
          currentRoomId: null,
          typing: false,
        }}
        onAuthenticationFailed={(error: any) => {
          console.error("[ChatController] Auth failed:", error);
          comp.children.error.dispatchChangeValueAction(
            error?.reason || error?.message || trans("chatController.authenticationFailed"),
          );
          comp.children.onEvent.getView()("error");
        }}
      >
        <ChatControllerRuntime
          comp={comp}
          userId={userId || "user_1"}
          userName={userName || trans("chatController.userNameDefault")}
        />
      </HocuspocusRoomProvider>
    );
  },
);

// ─── Property panel ─────────────────────────────────────────────────────────

const ChatControllerWithProps = withPropertyViewFn(
  ChatControllerBase,
  (comp) => (
    <>
      <PropertyViewDocLink href={trans("docUrls.githubChatController")} />
      <Section name={sectionNames.basic}>
        {comp.children.applicationId.propertyView({
          label: trans("chatController.applicationIdLabel"),
          tooltip: trans("chatController.applicationIdTooltip"),
        })}
        {comp.children.userId.propertyView({
          label: trans("chatController.userIdLabel"),
          tooltip: trans("chatController.userIdTooltip"),
        })}
        {comp.children.userName.propertyView({
          label: trans("chatController.userNameLabel"),
          tooltip: trans("chatController.userNameTooltip"),
        })}
      </Section>
      <Section name={sectionNames.interaction}>
        {comp.children.onEvent.getPropertyView()}
      </Section>
    </>
  ),
);

// ─── Expose state properties ────────────────────────────────────────────────

let ChatControllerComp = withExposingConfigs(ChatControllerWithProps, [
  new NameConfig("ready", trans("chatController.readyExposed")),
  new NameConfig("error", trans("chatController.errorExposed")),
  new NameConfig(
    "connectionStatus",
    trans("chatController.connectionStatusExposed"),
  ),
  new NameConfig(
    "onlineUsers",
    trans("chatController.onlineUsersExposed"),
  ),
  new NameConfig(
    "typingUsers",
    trans("chatController.typingUsersExposed"),
  ),
  new NameConfig("currentRoomId", trans("chatController.currentRoomIdExposed")),
  new NameConfig("userId", trans("chatController.userIdExposed")),
  new NameConfig("userName", trans("chatController.userNameExposed")),
  new NameConfig("applicationId", trans("chatController.applicationIdExposed")),
  new NameConfig(
    "aiThinkingRooms",
    trans("chatController.aiThinkingRoomsExposed"),
  ),
  new NameConfig(
    "sharedState",
    trans("chatController.sharedStateExposed"),
  ),
  new NameConfig(
    "roomData",
    trans("chatController.roomDataExposed"),
  ),
]);

// ─── Expose methods ─────────────────────────────────────────────────────────

ChatControllerComp = withMethodExposing(ChatControllerComp, [
  {
    method: {
      name: "startTyping",
      description: trans("chatController.startTypingMethodDesc"),
      params: [{ name: "roomId", type: "string" }],
    },
    execute: (comp, values) => {
      const actions = comp.children._controllerActions.getView() as unknown as ChatControllerActions;
      if (actions?.startTyping) {
        actions.startTyping(values?.[0] as string | undefined);
      }
    },
  },
  {
    method: {
      name: "stopTyping",
      description: trans("chatController.stopTypingMethodDesc"),
      params: [],
    },
    execute: (comp) => {
      const actions = comp.children._controllerActions.getView() as unknown as ChatControllerActions;
      if (actions?.stopTyping) {
        actions.stopTyping();
      }
    },
  },
  {
    method: {
      name: "switchRoom",
      description: trans("chatController.switchRoomMethodDesc"),
      params: [{ name: "roomId", type: "string" }],
    },
    execute: (comp, values) => {
      const actions = comp.children._controllerActions.getView() as unknown as ChatControllerActions;
      if (actions?.switchRoom) {
        actions.switchRoom(values?.[0] as string);
      }
    },
  },
  {
    method: {
      name: "setAiThinking",
      description: trans("chatController.setAiThinkingMethodDesc"),
      params: [
        { name: "roomId", type: "string" },
        { name: "isThinking", type: "string" },
      ],
    },
    execute: (comp, values) => {
      const actions = comp.children._controllerActions.getView() as unknown as ChatControllerActions;
      if (actions?.setAiThinking) {
        const isThinking = values?.[1] === true || values?.[1] === "true";
        actions.setAiThinking(values?.[0] as string, isThinking);
      }
    },
  },
  {
    method: {
      name: "setSharedState",
      description: trans("chatController.setSharedStateMethodDesc"),
      params: [
        { name: "key", type: "string" },
        { name: "value", type: "JSONValue" },
      ],
    },
    execute: (comp, values) => {
      const actions = comp.children._controllerActions.getView() as unknown as ChatControllerActions;
      if (actions?.setSharedState) {
        actions.setSharedState(values?.[0] as string, values?.[1]);
      }
    },
  },
  {
    method: {
      name: "deleteSharedState",
      description: trans("chatController.deleteSharedStateMethodDesc"),
      params: [{ name: "key", type: "string" }],
    },
    execute: (comp, values) => {
      const actions = comp.children._controllerActions.getView() as unknown as ChatControllerActions;
      if (actions?.deleteSharedState) {
        actions.deleteSharedState(values?.[0] as string);
      }
    },
  },
  {
    method: {
      name: "setRoomData",
      description: trans("chatController.setRoomDataMethodDesc"),
      params: [
        { name: "roomId", type: "string" },
        { name: "key", type: "string" },
        { name: "value", type: "JSONValue" },
      ],
    },
    execute: (comp, values) => {
      const actions = comp.children._controllerActions.getView() as unknown as ChatControllerActions;
      if (actions?.setRoomData) {
        actions.setRoomData(
          values?.[0] as string,
          values?.[1] as string,
          values?.[2],
        );
      }
    },
  },
  {
    method: {
      name: "deleteRoomData",
      description: trans("chatController.deleteRoomDataMethodDesc"),
      params: [
        { name: "roomId", type: "string" },
        { name: "key", type: "string" },
      ],
    },
    execute: (comp, values) => {
      const actions = comp.children._controllerActions.getView() as unknown as ChatControllerActions;
      if (actions?.deleteRoomData) {
        actions.deleteRoomData(
          values?.[0] as string,
          values?.[1] as string | undefined,
        );
      }
    },
  },
  {
    method: {
      name: "setUser",
      description: trans("chatController.setUserMethodDesc"),
      params: [
        { name: "userId", type: "string" },
        { name: "userName", type: "string" },
      ],
    },
    execute: (comp, values) => {
      if (values?.[0])
        comp.children.userId.getView().onChange(values[0] as string);
      if (values?.[1])
        comp.children.userName.getView().onChange(values[1] as string);
    },
  },
]);

export { ChatControllerComp };
