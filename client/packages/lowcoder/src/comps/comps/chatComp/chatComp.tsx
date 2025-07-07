// client/packages/lowcoder/src/comps/comps/chatComp/chatComp.tsx
import { UICompBuilder } from "comps/generators";
import { NameConfig, withExposingConfigs } from "comps/generators/withExposing";
import { chatChildrenMap } from "./chatCompTypes";
import { ChatView } from "./chatView";
import { ChatPropertyView } from "./chatPropertyView";
import { useEffect, useState } from "react";
import { changeChildAction } from "lowcoder-core";

// Build the component
let ChatTmpComp = new UICompBuilder(
  chatChildrenMap, 
  (props, dispatch) => {
    useEffect(() => {
      if (Boolean(props.tableName)) return;

      // Generate a unique database name for this ChatApp instance
      const generateUniqueTableName = () => {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        return `TABLE_${timestamp}`;
      };
      
      const tableName = generateUniqueTableName();
      dispatch(changeChildAction('tableName', tableName, true));
    }, [props.tableName]);
    
    if (!props.tableName) {
      return null; // Don't render until we have a unique DB name
    }
    return <ChatView {...props} chatQuery={props.chatQuery.value} />;
  }
)
  .setPropertyViewFn((children) => <ChatPropertyView children={children} />)
  .build();

ChatTmpComp = class extends ChatTmpComp {
  override autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }
};

// Export the component
export const ChatComp = withExposingConfigs(ChatTmpComp, [
  new NameConfig("text", "Chat component text"),
]);