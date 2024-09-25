import { trans } from "i18n";
import { check } from "util/convertUtils";

export type userTYPE = {
  name: string;
  avatar?: string;
  displayName?: string;
  email?: string;
};
export type commentDataTYPE = {
  user: userTYPE;
  value?: string;
  createdAt?: string;
};

export type userInfoType = Record<string, string[]>;

export const CommentDataTooltip = (
  <li>
    {trans("comment.Introduction")}:
    <br />
    1. user - {trans("comment.helpUser")}
    <br />
    &nbsp;.name - {trans("comment.helpname")}
    <br />
    &nbsp;.avatar - {trans("comment.helpavatar")}
    <br />
    &nbsp;.displayName - {trans("comment.helpdisplayName")}
    <br />
    2. value - {trans("comment.helpvalue")}
    <br />
    3. createdAt - {trans("comment.helpcreatedAt")}
  </li>
);

export const CommentUserDataTooltip = (
  <li>
    {trans("comment.Introduction")}:
    <br />
    1.name - {trans("comment.helpname")}
    <br />
    2.avatar - {trans("comment.helpavatar")}
    <br />
    3.displayName - {trans("comment.helpdisplayName")}
  </li>
)

export const commentDate = [{"user":{"name":"John Doe","avatar":"https://ui-avatars.com/api/?name=John+Doe"},"value":"Has anyone tried using Lowcode for our new internal tool yet?","createdAt":"2024-09-20T10:15:41.658Z"},{"user":{"name":"Jane Smith","avatar":"https://ui-avatars.com/api/?name=Jane+Smith"},"value":"Yes, I’ve been experimenting with it for automating our workflows. It's super quick to set up.","createdAt":"2024-09-20T10:17:12.658Z"},{"user":{"name":"Michael Brown","displayName":"Michael","avatar":"https://ui-avatars.com/api/?name=Michael+Brown"},"value":"That sounds interesting! What kind of automation are you building?","createdAt":"2024-09-20T10:18:45.658Z"},{"user":{"name":"Jane Smith","avatar":"https://ui-avatars.com/api/?name=Jane+Smith"},"value":"Mostly automating form submissions and integrating them with our CRM. It's easy to drag-and-drop components.","createdAt":"2024-09-20T10:20:30.658Z"},{"user":{"name":"John Doe","avatar":"https://ui-avatars.com/api/?name=John+Doe"},"value":"We should look into using it for API integrations as well. Lowcode could save a lot of development time.","createdAt":"2024-09-20T10:22:05.658Z"},{"user":{"name":"Michael Brown","displayName":"Michael","avatar":"https://ui-avatars.com/api/?name=Michael+Brown"},"value":"I agree. Let’s plan a session next week to dive deeper into the possibilities.","createdAt":"2024-09-20T10:23:55.658Z"}];

export function convertCommentData(data: any) {
  return data === "" ? [] : checkDataNodes(data) ?? [];
}

function checkDataNodes(
  value: any,
  key?: string
): commentDataTYPE[] | undefined {
  return check(value, ["array", "undefined"], key, (node, k) => {
    check(node, ["object"], k);
    check(node["user"], ["object"], "user");
    check(node["value"], ["string", "undefined"], "value");
    check(node["createdAt"], ["string", "undefined"], "createdAt");
    return node;
  });
}
export function checkUserInfoData(data: any) {
  check(data?.name, ["string"], "name")
  check(data?.avatar, ["string","undefined"], "avatar")
  return data
}

export function checkMentionListData(data: any) {
  if(data === "") return {}
  for(const key in data) {
    check(data[key], ["array"], key,(node)=>{
      check(node, ["string"], );
      return node
    })
  }
  return data
}