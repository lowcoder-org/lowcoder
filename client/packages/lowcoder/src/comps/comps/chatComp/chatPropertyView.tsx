// client/packages/lowcoder/src/comps/comps/chatComp/chatPropertyView.tsx
import React from "react";
import { Section, sectionNames } from "lowcoder-design";
import { trans } from "i18n";

export const ChatPropertyView = React.memo((props: any) => {
  const { children } = props;

  return (
    <Section name={sectionNames.basic}>
      {children.text.propertyView({ label: "Text" })}
      {children.chatQuery.propertyView({ label: "Chat Query" })}
      {children.currentMessage.propertyView({ 
        label: "Current Message (Dynamic)", 
        placeholder: "Shows the current user message",
        disabled: true 
      })}
      {children.modelType.propertyView({ label: "Model Type" })}
      {children.streaming.propertyView({ label: "Enable Streaming" })}
      {children.systemPrompt.propertyView({ 
        label: "System Prompt",
        placeholder: "Enter system prompt...",
        enableSpellCheck: false,
      })}
      {children.agent.propertyView({ label: "Enable Agent Mode" })}
      {children.maxInteractions.propertyView({ 
        label: "Max Interactions",
        placeholder: "10",
      })}
    </Section>
  );
});

ChatPropertyView.displayName = 'ChatPropertyView';