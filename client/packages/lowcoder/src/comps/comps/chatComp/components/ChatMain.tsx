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
import { ChatCompProps } from "../chatCompTypes";
import { message } from "antd";
import { EditorContext } from "@lowcoder-ee/comps/editorState";
import { addComponentAction } from "../../preLoadComp/actions/componentManagement";

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

const callYourAPI = async (params: {
  text: string,
  modelHost: string,
  modelType: string,
  sessionId: string,
}) => {
  const { text, modelHost, modelType, sessionId } = params;

  let url = modelHost;
  if (modelType === "direct-llm") {
    url = `${modelHost}/api/chat/completions`;
  }

  const response = await fetch(`${url}`, {
    method: "POST",
    body: JSON.stringify({
      text,
      sessionId,
    }),
  });

  return response.json();
  // Simulate API delay
  // await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simple responses
  // return {
  //   content: "This is a mock response from your backend. You typed: " + text
  // };
};

export function ChatMain(props: ChatCompProps) {
  const { state, actions } = useChatContext();
  const [isRunning, setIsRunning] = useState(false);
  const editorState = useContext(EditorContext);
  const editorStateRef = useRef(editorState);

  // Keep the ref updated with the latest editorState
  useEffect(() => {
    console.log("EDITOR STATE CHANGE ---> ", editorState);
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

    for (const action of actions) {
      const { action_name, action_parameters, action_payload } = action;

      switch (action_name) {
        case "place_component":
          await addComponentAction.execute({
            actionKey: action_name,
            actionValue: "",
            actionPayload: action_payload,
            selectedComponent: action_parameters,
            selectedEditorComponent: null,
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
    
    // Update current thread with new user message
    await actions.addMessage(state.currentThreadId, userMessage);
    setIsRunning(true);

    try {
      // Call mock API
      const response = await callYourAPI({
        text: userMessage.text,
        modelHost: props.modelHost!,
        modelType: props.modelType!,
        sessionId: state.currentThreadId,
      });
      const {reply, actions: editorActions} = JSON.parse(response?.output);
      performAction(editorActions);

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

    // Update messages using the new context action
    await actions.updateMessages(state.currentThreadId, newMessages);
    setIsRunning(true);

    try {
      // Generate new response
      const response = await callYourAPI({
        text: editedMessage.text,
        modelHost: props.modelHost!,
        modelType: props.modelType!,
        sessionId: state.currentThreadId,
      });
    
      const {reply, actions: editorActions} = JSON.parse(response?.output);
      performAction(editorActions);

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

