// client/packages/lowcoder/src/comps/comps/chatComp/chatView.tsx
import React from "react";
import { ChatCompProps } from "./chatCompTypes";

// Import assistant-ui components and proper runtime
import { 
  AssistantRuntimeProvider,
  ThreadPrimitive, 
  ComposerPrimitive
} from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import "@assistant-ui/styles/index.css";
import "@assistant-ui/styles/markdown.css";

export const ChatView = React.memo((props: ChatCompProps) => {
  // Create proper runtime using useChatRuntime
  const runtime = useChatRuntime({
    api: "/api/chat", // We'll create this endpoint later
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div style={{ 
        height: '100%', 
        padding: '16px',
        backgroundColor: '#f5f5f5'
      }}>
        <div className="aui-root">
          <h3 style={{ marginBottom: '16px' }}>🚀 Assistant-UI with Vercel AI SDK!</h3>
          
          {/* Test Thread with real runtime */}
          <div className="aui-thread-root" style={{ 
            background: 'white', 
            borderRadius: '8px', 
            padding: '16px',
            marginBottom: '16px',
            border: '1px solid #e0e0e0',
            minHeight: '200px'
          }}>
            <ThreadPrimitive.Empty>
              <div className="aui-thread-welcome-root">
                <div className="aui-thread-welcome-center">
                  <p className="aui-thread-welcome-message">
                      {props.text} - Runtime Working! 🎉
                  </p>
                </div>
              </div>
            </ThreadPrimitive.Empty>
          </div>

          {/* Test Composer with real runtime */}
          <div className="aui-composer-root" style={{
            background: 'white',
            borderRadius: '8px',
            padding: '12px',
            border: '1px solid #e0e0e0'
          }}>
            <ComposerPrimitive.Input
              placeholder={props.text}
              disabled={false}
              className="aui-composer-input"
              rows={1}
            />
          </div>

          {/* Property status */}
          <div style={{ 
            marginTop: '16px', 
            fontSize: '12px', 
            color: '#666',
            background: 'white',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #e0e0e0'
          }}>
            <strong>✅ Test Status:</strong><br/>
            Text: {props.text}<br/>
            Runtime: Vercel AI SDK ✅
          </div>
        </div>
      </div>
    </AssistantRuntimeProvider>
  );
});

ChatView.displayName = 'ChatView';