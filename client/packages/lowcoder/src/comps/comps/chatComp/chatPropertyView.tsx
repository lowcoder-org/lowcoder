// client/packages/lowcoder/src/comps/comps/chatComp/chatPropertyView.tsx
import React from "react";
import { Section, sectionNames } from "lowcoder-design";
import { trans } from "i18n";

export const ChatPropertyView = React.memo((props: any) => {
  const { children } = props;

  return (
    <>
      <Section name={sectionNames.basic}>
        {children.modelType.propertyView({ label: "Model Type" })}
        {children.modelHost.propertyView({ label: "Model Host" })}
        {/* {children.text.propertyView({ label: "Text" })}
        {children.chatQuery.propertyView({ label: "Chat Query" })} */}
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
      <Section name={sectionNames.layout}>
        {children.autoHeight.propertyView({ label: trans("prop.height") })}
      </Section>
    </>
  );
});

ChatPropertyView.displayName = 'ChatPropertyView';