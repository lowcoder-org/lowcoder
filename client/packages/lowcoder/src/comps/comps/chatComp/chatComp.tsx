// client/packages/lowcoder/src/comps/comps/chatComp/chatComp.tsx
import { UICompBuilder } from "comps/generators";
import { NameConfig, withExposingConfigs } from "comps/generators/withExposing";
import { chatChildrenMap } from "./chatCompTypes";
import { ChatView } from "./chatView";
import { ChatPropertyView } from "./chatPropertyView";
import { useEffect, useState } from "react";
import { changeChildAction } from "lowcoder-core";

// Build the component
const ChatTmpComp = new UICompBuilder(
  chatChildrenMap,
  (props, dispatch) => (
    <ChatView
      {...props}
      chatQuery={props.chatQuery.value}
      currentMessage={props.currentMessage.value}
      dispatch={dispatch}
    />
  )
)
  .setPropertyViewFn((children) => <ChatPropertyView children={children} />)
  .build();

// Export the component with exposed variables
export const ChatComp = withExposingConfigs(ChatTmpComp, [
  new NameConfig("text", "Chat component text"),
  new NameConfig("currentMessage", "Current user message"),
]);