// client/packages/lowcoder/src/comps/comps/chatComp/chatPropertyView.tsx

import React, { useMemo } from "react";
import { Section, sectionNames, DocLink } from "lowcoder-design";
import { placeholderPropertyView } from "../../utils/propertyUtils";
import { trans } from "i18n";

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
      <Section name={trans("chat.messageHandler")}>
        {children.handlerType.propertyView({ 
          label: trans("chat.handlerType"),
          tooltip: trans("chat.handlerTypeTooltip"),
        })}

        {/* Conditional Query Selection */}
        {children.handlerType.getView() === "query" && (
          children.chatQuery.propertyView({ 
            label: trans("chat.chatQuery"),
            placeholder: trans("chat.chatQueryPlaceholder"),
          })
        )}

        {/* Conditional N8N Configuration */}
        {children.handlerType.getView() === "n8n" && (
          children.modelHost.propertyView({ 
            label: trans("chat.modelHost"),
            placeholder: trans("chat.modelHostPlaceholder"),
            tooltip: trans("chat.modelHostTooltip"),
          })
        )}

        {children.systemPrompt.propertyView({ 
          label: trans("chat.systemPrompt"),
          placeholder: trans("chat.systemPromptPlaceholder"),
          tooltip: trans("chat.systemPromptTooltip"),
        })}

          {children.streaming.propertyView({ 
          label: trans("chat.streaming"),
          tooltip: trans("chat.streamingTooltip"),
        })}
      </Section>

      {/* UI Configuration */}
      <Section name={trans("chat.uiConfiguration")}>
          {children.placeholder.propertyView({ 
            label: trans("chat.placeholderLabel"),
            placeholder: trans("chat.defaultPlaceholder"),
            tooltip: trans("chat.placeholderTooltip"),
          })}
      </Section>

      {/* Database Section */}
      <Section name={trans("chat.database")}>
        {children.databaseName.propertyView({ 
          label: trans("chat.databaseName"),
          tooltip: trans("chat.databaseNameTooltip"),
          readonly: true
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