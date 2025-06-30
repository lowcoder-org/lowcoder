import { StringControl } from "comps/controls/codeControl";
import { UICompBuilder, withDefault } from "comps/generators";
import { NameConfig, withExposingConfigs } from "comps/generators/withExposing";
import { Section, sectionNames } from "lowcoder-design";
import { trans } from "i18n";
import React from "react";

// Simple children map with just basic properties
const childrenMap = {
  text: withDefault(StringControl, "Chat Component Placeholder"),
};

// Basic view - just a simple div for now
const ChatView = React.memo((props: any) => {
  return (
    <div
      style={{
        height: "100%",
        border: "1px solid #ccc",
        padding: "16px",
        borderRadius: "4px",
      }}
    >
      {props.text}
    </div>
  );
});

// Basic property view
const ChatPropertyView = React.memo((props: any) => {
  return (
    <Section name={sectionNames.basic}>
      {props.children.text.propertyView({
        label: "Text",
      })}
    </Section>
  );
});

// Build the component
const ChatTmpComp = new UICompBuilder(childrenMap, (props) => (
  <ChatView {...props} />
))
  .setPropertyViewFn((children) => <ChatPropertyView children={children} />)
  .build();

// Export the component
export const ChatComp = withExposingConfigs(ChatTmpComp, [
  new NameConfig("text", "Chat component text"),
]);
