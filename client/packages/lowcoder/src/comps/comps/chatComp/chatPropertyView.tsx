// client/packages/lowcoder/src/comps/comps/chatComp/chatPropertyView.tsx

import React, { useMemo } from "react";
import { Section, sectionNames, controlItem } from "lowcoder-design";
import { trans } from "i18n";
import { PropertyViewDocLink } from "comps/utils/propertyViewDocLink";

// ============================================================================
//   PROPERTY VIEW 
// ============================================================================

export const ChatPropertyView = React.memo((props: any) => {
  const { children } = props;

  return useMemo(() => (
    <>
      <PropertyViewDocLink href={trans("docUrls.githubAiChat")} />

      {/* Message Handler Configuration */}
      <Section name={trans("chat.messageHandler")}>
        {children.chatQuery.propertyView({ 
          label: trans("chat.chatQuery"),
          placeholder: trans("chat.chatQueryPlaceholder"),
        })}

        {children.systemPrompt.propertyView({ 
          label: trans("chat.systemPrompt"),
          placeholder: trans("chat.systemPromptPlaceholder"),
          tooltip: trans("chat.systemPromptTooltip"),
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

      {/* Layout Section - Height Mode & Sidebar Width */}
      <Section name={sectionNames.layout}>
        {children.autoHeight.getPropertyView()}
        {children.leftPanelWidth.propertyView({
          label: trans("chat.leftPanelWidth"),
          tooltip: trans("chat.leftPanelWidthTooltip"),
        })}
      </Section>

      {/* Database Section */}
      <Section name={trans("chat.database")}>
        {controlItem(
          { filterText: trans("chat.databaseName") },
          <div style={{ padding: "8px 16px" }}>
            <div style={{ 
              fontSize: "13px", 
              color: "#8B8FA3", 
              marginBottom: "4px",
              fontWeight: 500
            }}>
              {trans("chat.databaseName")}
            </div>
            <div style={{ 
              fontSize: "13px", 
              color: "#222222",
              padding: "6px 12px",
              backgroundColor: "#F5F5F6",
              borderRadius: "4px",
              border: "1px solid #D7D9E0",
              fontFamily: "monospace"
            }}>
              {children.databaseName.getView() || "Not initialized"}
            </div>
            <div style={{ 
              fontSize: "12px", 
              color: "#8B8FA3", 
              marginTop: "4px"
            }}>
              {trans("chat.databaseNameTooltip")}
            </div>
          </div>
        )}
      </Section>

      {/* STANDARD EVENT HANDLERS SECTION */}
      <Section name={sectionNames.interaction}>
        {children.onEvent.getPropertyView()}
      </Section>

      {/* STYLE SECTIONS */}
      <Section name={sectionNames.style}>
        {children.style.getPropertyView()}
      </Section>

      <Section name={trans("chat.sidebarStyle")}>
        {children.sidebarStyle.getPropertyView()}
      </Section>

      <Section name={trans("chat.messagesStyle")}>
        {children.messagesStyle.getPropertyView()}
      </Section>

      <Section name={trans("chat.inputStyle")}>
        {children.inputStyle.getPropertyView()}
      </Section>

      <Section name={trans("chat.sendButtonStyle")}>
        {children.sendButtonStyle.getPropertyView()}
      </Section>

      <Section name={trans("chat.newThreadButtonStyle")}>
        {children.newThreadButtonStyle.getPropertyView()}
      </Section>

      <Section name={trans("chat.threadItemStyle")}>
        {children.threadItemStyle.getPropertyView()}
      </Section>

      <Section name={sectionNames.animationStyle} hasTooltip={true}>
        {children.animationStyle.getPropertyView()}
      </Section>

    </>
  ), [children]);
});

ChatPropertyView.displayName = 'ChatPropertyView';