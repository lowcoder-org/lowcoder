// client/packages/lowcoder/src/comps/comps/chatComp/chatPropertyView.tsx
import React from "react";
import { Section, sectionNames } from "lowcoder-design";

export const ChatPropertyView = React.memo((props: any) => {
  const { children } = props;

  return (
    <Section name={sectionNames.basic}>
      {children.text.propertyView({ label: "Text" })}
      {children.modelHost.propertyView({ label: "Model Host URL" })}
      {children.modelType.propertyView({ label: "Model Type" })}
      {children.streaming.propertyView({ label: "Streaming Responses" })}
      {children.systemPrompt.propertyView({ label: "System Prompt" })}
      {children.agent.propertyView({ label: "Agent Mode" })}
      {children.maxInteractions.propertyView({ label: "Max Interactions" })}
    </Section>
  );
});

ChatPropertyView.displayName = 'ChatPropertyView';