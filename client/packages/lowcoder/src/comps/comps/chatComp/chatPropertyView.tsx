// client/packages/lowcoder/src/comps/comps/chatComp/chatPropertyView.tsx

import React, { useMemo } from "react";
import { Section, sectionNames, DocLink } from "lowcoder-design";
import { placeholderPropertyView } from "../../utils/propertyUtils";

// ============================================================================
// CLEAN PROPERTY VIEW - FOCUSED ON ESSENTIAL CONFIGURATION
// ============================================================================

export const ChatPropertyView = React.memo((props: any) => {
  const { children } = props;

  return useMemo(() => (
    <>
      {/* Help & Documentation - Outside of Section */}
      <div style={{ padding: "8px 16px", marginBottom: "16px", borderBottom: "1px solid #f0f0f0" }}>
        <DocLink 
          style={{ marginTop: 8 }} 
          href="https://docs.lowcoder.cloud/lowcoder-documentation" 
          title="Open Lowcoder Documentation"
        >
          📖 View Documentation
        </DocLink>
      </div>

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

      {/* UI Configuration */}
      <Section name="UI Configuration">
        {placeholderPropertyView(children)}
      </Section>

      {/* Database Information */}
      <Section name="Database">
        {children.databaseName.propertyView({ 
          label: "Database Name",
          tooltip: "Auto-generated database name for this chat component (read-only)"
        })}
      </Section>

      {/* STANDARD EVENT HANDLERS SECTION */}
      <Section name={sectionNames.interaction}>
        {children.onEvent.getPropertyView()}
      </Section>

    </>
  ), [children]);
});

ChatPropertyView.displayName = 'ChatPropertyView';