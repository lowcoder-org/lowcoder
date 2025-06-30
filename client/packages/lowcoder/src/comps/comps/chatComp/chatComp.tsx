// client/packages/lowcoder/src/comps/comps/chatComp/chatComp.tsx
import { UICompBuilder } from "comps/generators";
import { NameConfig, withExposingConfigs } from "comps/generators/withExposing";
import { chatChildrenMap } from "./chatCompTypes";
import { ChatView } from "./chatView";
import { ChatPropertyView } from "./chatPropertyView";

// Build the component
const ChatTmpComp = new UICompBuilder(
  chatChildrenMap, 
  (props) => <ChatView {...props} />
)
  .setPropertyViewFn((children) => <ChatPropertyView children={children} />)
  .build();

// Export the component
export const ChatComp = withExposingConfigs(ChatTmpComp, [
  new NameConfig("text", "Chat component text"),
]);