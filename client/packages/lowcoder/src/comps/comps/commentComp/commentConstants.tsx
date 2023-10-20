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

export const commentDate = [
  {
    user: {
      name: "Li Lei",
      avatar:
        "https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png",
    },
    value: "What is the use of this component?",
    createdAt: "2023-06-15T08:40:41.658Z",
  },
  {
    user: { name: "mou" },
    value: "This component allows you to post or delete comments, as well as mention people who appear in the chat.",
    createdAt: "2023-06-16T08:43:42.658Z",
  },
  {
    user: { name: "Han Meimei", displayName: "Han" },
    value: "I want to give it a try",
    createdAt: "2023-06-17T08:49:01.658Z",
  },
  {
    user: { name: "mou" },
    value: "Enter the content in the input box below and press shift+enter to send it immediately",
    createdAt: "2023-06-18T08:50:11.658Z",
  },
];

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