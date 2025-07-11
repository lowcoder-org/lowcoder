// client/packages/lowcoder/src/comps/comps/chatComp/chatPropertyView.tsx

import React from "react";
import { Section, sectionNames } from "lowcoder-design";

// ============================================================================
// CLEAN PROPERTY VIEW - FOCUSED ON ESSENTIAL CONFIGURATION
// ============================================================================

export const ChatPropertyView = React.memo((props: any) => {
  const { children } = props;

  return (
    <>
      {/* Basic Configuration */}
      <Section name={sectionNames.basic}>
        {children.placeholder.propertyView({ 
          label: "Placeholder Text",
          placeholder: "Enter placeholder text..."
        })}
        
        {children.databaseName.propertyView({ 
          label: "Database Name",
          placeholder: "Database will be auto-generated...",
          tooltip: "Read-only: Auto-generated database name for data persistence. You can reference this in queries if needed.",
          disabled: true
        })}
        
      </Section>

      {/* Message Handler Configuration */}
      <Section name="Message Handler">
        {children.handlerType.propertyView({ 
          label: "Handler Type",
          tooltip: "How messages are processed"
        })}
        
        {/* Show chatQuery field only for "query" handler */}
        {children.handlerType.value === "query" && (
          children.chatQuery.propertyView({ 
            label: "Chat Query",
            placeholder: "Select a query to handle messages"
          })
        )}
        
        {/* Show modelHost field only for "n8n" handler */}
        {children.handlerType.value === "n8n" && (
          children.modelHost.propertyView({ 
            label: "N8N Webhook URL",
            placeholder: "http://localhost:5678/webhook/...",
            tooltip: "N8N webhook endpoint for processing messages"
          })
        )}
        
        {children.systemPrompt.propertyView({ 
          label: "System Prompt",
          placeholder: "You are a helpful assistant...",
          tooltip: "Initial instructions for the AI"
        })}
        
        {children.streaming.propertyView({ 
          label: "Enable Streaming",
          tooltip: "Stream responses in real-time (when supported)"
        })}
      </Section>

    </>
  );
});

ChatPropertyView.displayName = 'ChatPropertyView';