import React, { useContext, useState, useRef, useEffect } from "react";
import {
  useExternalStoreRuntime,
  ThreadMessageLike,
  AppendMessage,
  AssistantRuntimeProvider,
  ExternalStoreThreadListAdapter,
} from "@assistant-ui/react";
import { Thread } from "./assistant-ui/thread";
import { ThreadList } from "./assistant-ui/thread-list";
import { 
  useChatContext, 
  MyMessage, 
  ThreadData, 
  RegularThreadData, 
  ArchivedThreadData 
} from "./context/ChatContext";
import styled from "styled-components";
import { routeByNameAction, executeQueryAction, CompAction, changeChildAction } from "lowcoder-core";
import { getPromiseAfterDispatch } from "util/promiseUtils";

const ChatContainer = styled.div<{ $autoHeight?: boolean }>`
  display: flex;
  height: ${props => props.$autoHeight ? '500px' : '100%'};

  p {
    margin: 0;
  }

  .aui-thread-list-root {
    width: 250px;
    background-color: #fff;
    padding: 10px;
  }

  .aui-thread-root {
    flex: 1;
    background-color: #f9fafb;
  }

  .aui-thread-list-item {
    cursor: pointer;
    transition: background-color 0.2s ease;

    &[data-active="true"] {
      background-color: #dbeafe;
      border: 1px solid #bfdbfe;
    }
  }
`;

const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper to call the Lowcoder query system
const callQuery = async (
  queryName: string,
  prompt: string,
  dispatch?: (action: CompAction<any>) => void
) => {
  // If no query selected or dispatch unavailable, fallback with mock response
  if (!queryName || !dispatch) {
    await new Promise((res) => setTimeout(res, 500));
    return { content: "(mock) You typed: " + prompt };
  }

  try {
    const result: any = await getPromiseAfterDispatch(
      dispatch,
      routeByNameAction(
        queryName,
        executeQueryAction({
          // Send the user prompt as variable named 'prompt' by default
          args: { prompt: { value: prompt } },
        })
      )
    );

    // Extract reply text from the query result
    let reply: string;
    if (typeof result === "string") {
      reply = result;
    } else if (result && typeof result === "object") {
      reply =
        (result as any).response ??
        (result as any).message ??
        (result as any).content ??
        JSON.stringify(result);
    } else {
      reply = String(result);
    }

    return { content: reply };
  } catch (e: any) {
    throw new Error(e?.message || "Query execution failed");
  }
};

interface ChatMainProps {
  chatQuery: string;
  currentMessage: string;
  dispatch?: (action: CompAction<any>) => void;
}

export function ChatMain({ chatQuery, currentMessage, dispatch }: ChatMainProps) {
  const { state, actions } = useChatContext();
  const [isRunning, setIsRunning] = useState(false);
  const editorState = useContext(EditorContext);
  const editorStateRef = useRef(editorState);

  // Keep the ref updated with the latest editorState
  useEffect(() => {
    // console.log("EDITOR STATE CHANGE ---> ", editorState);
    editorStateRef.current = editorState;
  }, [editorState]);

  console.log("STATE", state);

  // Get messages for current thread
  const currentMessages = actions.getCurrentMessages();

  // Convert custom format to ThreadMessageLike
  const convertMessage = (message: MyMessage): ThreadMessageLike => ({
    role: message.role,
    content: [{ type: "text", text: message.text }],
    id: message.id,
    createdAt: new Date(message.timestamp),
  });

  const performAction = async (actions: any[]) => {
    const comp = editorStateRef.current.getUIComp().children.comp;
    if (!comp) {
      console.error("No comp found");
      return;
    }
    // const layout = comp.children.layout.getView();
    // console.log("LAYOUT", layout);

    for (const actionItem of actions) {
      const { action, component, ...action_payload } = actionItem;

      switch (action) {
        case "place_component":
          await addComponentAction.execute({
            actionKey: action,
            actionValue: "",
            actionPayload: action_payload,
            selectedComponent: component,
            selectedEditorComponent: null,
            selectedNestComponent: null,
            editorState: editorStateRef.current
          });
          break;
        case "nest_component":
          await nestComponentAction.execute({
            actionKey: action,
            actionValue: "",
            actionPayload: action_payload,
            selectedComponent: component,
            selectedEditorComponent: null,
            selectedNestComponent: null,
            editorState: editorStateRef.current
          });
          break;
        case "set_properties":
          debugger;
          await configureComponentAction.execute({
            actionKey: action,
            actionValue: component,
            actionPayload: action_payload,
            selectedEditorComponent: null,
            selectedComponent: null,
            selectedNestComponent: null,
            editorState: editorStateRef.current
          });
          break;
        default:
          break;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const onNew = async (message: AppendMessage) => {
    // Extract text from AppendMessage content array
    if (message.content.length !== 1 || message.content[0]?.type !== "text") {
      throw new Error("Only text content is supported");
    }

    // Add user message in custom format
    const userMessage: MyMessage = {
      id: generateId(),
      role: "user",
      text: message.content[0].text,
      timestamp: Date.now(),
    };
    
    // Update currentMessage state to expose to queries
    if (dispatch) {
      dispatch(changeChildAction("currentMessage", userMessage.text, false));
    }
    
    // Update current thread with new user message
    await actions.addMessage(state.currentThreadId, userMessage);
    setIsRunning(true);

    try {
      // Call selected query / fallback to mock
      const response = await callQuery(chatQuery, userMessage.text, dispatch);
      
      const assistantMessage: MyMessage = {
        id: generateId(),
        role: "assistant",
        text: reply,
        timestamp: Date.now(),
      };
      
      // Update current thread with assistant response
      await actions.addMessage(state.currentThreadId, assistantMessage);
    } catch (error) {
      // Handle errors gracefully
      const errorMessage: MyMessage = {
        id: generateId(),
        role: "assistant", 
        text: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
      };
      
      await actions.addMessage(state.currentThreadId, errorMessage);
    } finally {
      setIsRunning(false);
    }
  };

  // Add onEdit functionality
  const onEdit = async (message: AppendMessage) => {
    // Extract text from AppendMessage content array
    if (message.content.length !== 1 || message.content[0]?.type !== "text") {
      throw new Error("Only text content is supported");
    }

    // Find the index where to insert the edited message
    const index = currentMessages.findIndex((m) => m.id === message.parentId) + 1;

    // Keep messages up to the parent
    const newMessages = [...currentMessages.slice(0, index)];

    // Add the edited message in custom format
    const editedMessage: MyMessage = {
      id: generateId(),
      role: "user",
      text: message.content[0].text,
      timestamp: Date.now(),
    };
    newMessages.push(editedMessage);

    // Update currentMessage state to expose to queries
    if (dispatch) {
      dispatch(changeChildAction("currentMessage", editedMessage.text, false));
    }

    // Update messages using the new context action
    await actions.updateMessages(state.currentThreadId, newMessages);
    setIsRunning(true);

    try {
      const response = await callQuery(chatQuery, editedMessage.text, dispatch);
      
      const assistantMessage: MyMessage = {
        id: generateId(),
        role: "assistant",
        text: reply,
        timestamp: Date.now(),
      };
      
      newMessages.push(assistantMessage);
      await actions.updateMessages(state.currentThreadId, newMessages);
    } catch (error) {
      // Handle errors gracefully
      const errorMessage: MyMessage = {
        id: generateId(),
        role: "assistant", 
        text: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
      };
      
      newMessages.push(errorMessage);
      await actions.updateMessages(state.currentThreadId, newMessages);
    } finally {
      setIsRunning(false);
    }
  };

  // Thread list adapter for managing multiple threads
  const threadListAdapter: ExternalStoreThreadListAdapter = {
    threadId: state.currentThreadId,
    threads: state.threadList.filter((t): t is RegularThreadData => t.status === "regular"),
    archivedThreads: state.threadList.filter((t): t is ArchivedThreadData => t.status === "archived"),

    onSwitchToNewThread: async () => {
      const threadId = await actions.createThread("New Chat");
      actions.setCurrentThread(threadId);
    },

    onSwitchToThread: (threadId) => {
      actions.setCurrentThread(threadId);
    },

    onRename: async (threadId, newTitle) => {
      await actions.updateThread(threadId, { title: newTitle });
    },

    onArchive: async (threadId) => {
      await actions.updateThread(threadId, { status: "archived" });
    },

    onDelete: async (threadId) => {
      await actions.deleteThread(threadId);
    },
  };

  const runtime = useExternalStoreRuntime({
    messages: currentMessages,
    setMessages: (messages) => {
      actions.updateMessages(state.currentThreadId, messages);
    },
    convertMessage,
    isRunning,
    onNew,
    onEdit,
    adapters: {
      threadList: threadListAdapter,
    },
  });

  if (!state.isInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ChatContainer $autoHeight={props.autoHeight}>
        <ThreadList />
        <Thread />
      </ChatContainer>
    </AssistantRuntimeProvider>
  );
}

