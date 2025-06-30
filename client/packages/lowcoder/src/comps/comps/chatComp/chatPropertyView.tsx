// client/packages/lowcoder/src/comps/comps/chatComp/chatPropertyView.tsx
import React from "react";
import { Section, sectionNames } from "lowcoder-design";

export const ChatPropertyView = React.memo((props: any) => {
  return (
    <Section name={sectionNames.basic}>
      {props.children.text.propertyView({ 
        label: "Text" 
      })}
    </Section>
  );
});

ChatPropertyView.displayName = 'ChatPropertyView';