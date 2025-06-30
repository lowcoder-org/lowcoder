// client/packages/lowcoder/src/comps/comps/chatComp/chatCompTypes.ts
import { StringControl } from "comps/controls/codeControl";
import { withDefault } from "comps/generators";

export const chatChildrenMap = {
  text: withDefault(StringControl, "Chat Component Placeholder"),
};

export type ChatCompProps = {
  text: string;
};