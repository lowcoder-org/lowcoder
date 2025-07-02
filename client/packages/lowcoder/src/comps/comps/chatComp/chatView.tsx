// client/packages/lowcoder/src/comps/comps/chatComp/chatView.tsx
import React, { useState, useContext } from "react";
import { ChatCompProps } from "./chatCompTypes";
import { Thread } from "./components/assistant-ui/thread";

// Import assistant-ui components for external store runtime
import { 
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  ThreadMessageLike,
  AppendMessage
} from "@assistant-ui/react";
import "@assistant-ui/styles/index.css";
import "@assistant-ui/styles/markdown.css";

// Import Lowcoder query execution
import { EditorContext } from "comps/editorState";
import { executeQueryAction, routeByNameAction } from "lowcoder-core";

const convertMessage = (message: ThreadMessageLike) => {
  return message;
};

export const ChatView = React.memo((props: ChatCompProps) => {
  const [messages, setMessages] = useState<readonly ThreadMessageLike[]>([]);
  const editorState = useContext(EditorContext);

  const onNew = async (message: AppendMessage) => {
    if (message.content.length !== 1 || message.content[0]?.type !== "text") {
      throw new Error("Only text content is supported");
    }

    // Add user message immediately
    const userMessage: ThreadMessageLike = {
      role: "user",
      content: [{ type: "text", text: message.content[0].text }],
    };
    setMessages((currentMessages) => [...currentMessages, userMessage]);

    try {
      // Execute the selected Lowcoder query
      if (props.chatQuery) {
        // Prepare query arguments with chat context
        const queryArgs = {
          message: message.content[0].text,
          systemPrompt: props.systemPrompt,
          streaming: props.streaming,
          agent: props.agent,
          maxInteractions: props.maxInteractions,
          modelType: props.modelType,
                     // Pass entire conversation history for context
           messages: messages.concat([userMessage]).map(msg => ({
             role: msg.role,
             content: Array.isArray(msg.content) && msg.content[0] && typeof msg.content[0] === "object" && "text" in msg.content[0] 
               ? msg.content[0].text 
               : typeof msg.content === "string" ? msg.content : ""
           }))
        };

        // Execute the query through Lowcoder's query system
        const result = await new Promise((resolve, reject) => {
          const queryComp = editorState?.getQueriesComp()
            .getView()
            .find(q => q.children.name.getView() === props.chatQuery);

          if (!queryComp) {
            reject(new Error(`Query "${props.chatQuery}" not found`));
            return;
          }

          queryComp.dispatch(
            executeQueryAction({
              args: queryArgs,
              afterExecFunc: () => {
                const queryResult = queryComp.children.data.getView();
                resolve(queryResult);
              }
            })
          );
        });

                 // Add assistant response
         const assistantMessage: ThreadMessageLike = {
           role: "assistant",
           content: [{ 
             type: "text", 
             text: typeof result === "string" 
               ? result 
               : (result as any)?.message || (result as any)?.response || "No response"
           }],
         };
        setMessages((currentMessages) => [...currentMessages, assistantMessage]);
        
      } else {
        // Fallback response when no query is selected
        const assistantMessage: ThreadMessageLike = {
          role: "assistant",
          content: [{ type: "text", text: "Please select a chat query in the component properties." }],
        };
        setMessages((currentMessages) => [...currentMessages, assistantMessage]);
      }
    } catch (error) {
      // Error handling
      const errorMessage: ThreadMessageLike = {
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`
        }],
      };
      setMessages((currentMessages) => [...currentMessages, errorMessage]);
    }
  };

  const runtime = useExternalStoreRuntime<ThreadMessageLike>({
    messages,
    setMessages,
    onNew,
    convertMessage,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread />
    </AssistantRuntimeProvider>
  );
});

ChatView.displayName = 'ChatView';