import React, {useEffect, useState, useRef, useContext, Suspense} from "react";
import {
  changeChildAction,
  CompAction,
  RecordConstructorToView,
} from "lowcoder-core";
import { trans } from "i18n";
import { UICompBuilder, withDefault } from "../../generators";
import { BoolControl } from "comps/controls/boolControl";
import { styleControl } from "comps/controls/styleControl"; //样式输入框
import { jsonValueExposingStateControl } from "comps/controls/codeStateControl";
import { jsonControl, StringControl } from "comps/controls/codeControl";
import {
  clickEvent,
  submitEvent,
  eventHandlerControl,
  deleteEvent,
  mentionEvent,
} from "comps/controls/eventHandlerControl";


import {
  AnimationStyle,
  CommentStyle,
  heightCalculator,
  widthCalculator,
} from "comps/controls/styleControlConstants";
import { valueComp } from "comps/generators/simpleGenerators";
import {
  NameConfig,
  NameConfigHidden,
  withExposingConfigs,
} from "comps/generators/withExposing";

import {
  commentDate,
  commentDataTYPE,
  convertCommentData,
  checkUserInfoData,
  checkMentionListData,
} from "./commentConstants";
import { default as Avatar } from "antd/es/avatar";
import { default as List } from "antd/es/list";
import { default as Button } from "antd/es/button";
import { default as Mentions } from "antd/es/mentions";
import { default as Tooltip } from "antd/es/tooltip";
import VirtualList from "rc-virtual-list";
import _ from "lodash";
import relativeTime from "dayjs/plugin/relativeTime";
import dayjs from "dayjs";
import { getInitialsAndColorCode } from "util/stringUtils";
import { default as CloseOutlined } from "@ant-design/icons/CloseOutlined";
import {viewMode} from "@lowcoder-ee/util/editor";
const PropertyView =  React.lazy( async () => await import("./propertyView"));

dayjs.extend(relativeTime);
// dayjs.locale("zh-cn");

// TODO: Fixed header
// TODO: scroll area only for messages - but not including commend input and button
// TODO: free positioning of the comment input and button (eventually to adapt from Container component?)
// TODO: extens styling for chat messages
// TODO: add reactions to messages
// TODO: add attachments to messages
// TODO: add replies to messages

const EventOptions = [
  clickEvent,
  submitEvent,
  deleteEvent,
  mentionEvent,
] as const;

const childrenMap = {
  value: jsonControl(convertCommentData, commentDate),
  title: withDefault(StringControl, trans("comment.titledDefaultValue")),
  placeholder: withDefault(StringControl, trans("comment.placeholder")),
  buttonText: withDefault(StringControl, trans("comment.buttonText")),
  sendCommentAble: BoolControl.DEFAULT_TRUE,
  deleteAble: BoolControl,
  userInfo: jsonControl(checkUserInfoData, {
    name: "{{currentUser.name}}",
    email: "{{currentUser.email}}",
  }),
  mentionList: jsonControl(checkMentionListData, {"@":["John Doe","Jane Doe","Michael Smith","Emily Davis","Robert Johnson","Patricia Brown","William Jones","Jennifer Miller","David Wilson","Linda Moore"],"#":["#lowcode","#automation","#appbuilder","#nocode","#workflow","#draganddrop","#rapiddevelopment","#digitaltransformation","#integration","#api"]}),
  onEvent: eventHandlerControl(EventOptions),
  style: styleControl(CommentStyle , 'style'),
  animationStyle: styleControl(AnimationStyle , 'animationStyle'),
  commentList: jsonValueExposingStateControl("commentList", []),
  deletedItem: jsonValueExposingStateControl("deletedItem", []),
  submitedItem: jsonValueExposingStateControl("submitedItem", []),
  mentionName: valueComp<string>(""),
};

const CommentCompBase = (
  props: RecordConstructorToView<typeof childrenMap> & {
    dispatch: (action: CompAction) => void;
  }
) => {
  // const VirtualListRef = useRef<ListRef>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const {
    value,
    dispatch,
    style,
    title,
    sendCommentAble,
    buttonText,
    onEvent,
    mentionList,
    userInfo,
    placeholder,
    deleteAble,
    animationStyle,
  } = props;
  type PrefixType = "@" | keyof typeof mentionList;
  // Used to save the consolidated list of mentions
  const [MentionListData, setMentionList] = useState<typeof mentionList>([]);
  const [commentListData, setCommentListData] = useState<commentDataTYPE[]>([]);
  const [prefix, setPrefix] = useState<PrefixType>("@");
  const [context, setContext] = useState<string>("");
  // Integrate the comment list with the names in the original mention list
  const mergeAllMentionList = (mentionList: any) => {
    setMentionList(
      _.merge(mentionList, {
        "@": _.union(
          _.concat(
            mentionList["@"],
            _.map(commentListData, (item, index) => {
              return item?.user?.name;
            })
          )
        ),
      })
    );
  };
  useEffect(() => {
    setCommentListData(value);
  }, [value]);

  useEffect(() => {
    mergeAllMentionList(mentionList);
  }, [mentionList]);

  useEffect(() => {
    props.commentList.onChange(commentListData);
    mergeAllMentionList(mentionList);
    //   Used to scroll the list to the bottom after submission
    setTimeout(() => {
      // VirtualListRef?.current?.scrollTo(999999);
      if (divRef.current) divRef.current.scrollTop = 999999;
    }, 50);
  }, [commentListData]);

  // Get mentions of search keywords
  const onSearch = (_: string, newPrefix: PrefixType) => {
    setPrefix(newPrefix);
  };
  // Generate comment avatars
  const generateCommentAvatar = (item: commentDataTYPE) => {
    return (
      <Avatar
        onClick={() => props.onEvent("click")}
        // If there is an avatar, no background colour is set, and if displayName is not null, displayName is called using getInitialsAndColorCode
        style={{
          backgroundColor: item?.user?.avatar
            ? ""
            : getInitialsAndColorCode(
                item?.user?.displayName === undefined
                  ? item?.user?.name
                  : item?.user?.displayName
              )[1],
          verticalAlign: "middle",
        }}
        src={item?.user?.avatar}
      >
        {" "}
        {item?.user?.displayName
          ? item?.user?.displayName
          : /^([\u4e00-\u9fa5]{2,4})$/gi.test(item?.user?.name)
          ? item?.user?.name.slice(-2)
          : item?.user?.name[0]}
      </Avatar>
    );
  };
  const onChange = (value: string) => {
    setContext(value);
  };

  const handleSubmit = () => {
    let subObject = {
      user: userInfo,
      value: context,
      createdAt: dayjs().format(),
    };
    props.submitedItem.onChange(subObject);
    setCommentListData(_.concat(commentListData, [subObject]));
    setContext("");
    mergeAllMentionList(mentionList);
    props.onEvent("submit");
  };

  const handleDelete = (index: number) => {
    let temp = _.cloneDeep(commentListData);
    props.deletedItem.onChange(temp.splice(index, 1));
    setCommentListData(temp);
    props.onEvent("delete");
  };

  const onPressEnter = (e: any) => {
    if (e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  return (
    <div style={{
        margin: style.margin ?? "3px",
        padding: style.padding ?? "3px",
        width: widthCalculator(style.margin ?? "3px"),
        height: heightCalculator(style.margin ?? "3px"),
        background: style.background,
      borderRadius: style.radius,
      animation: animationStyle.animation,
      animationDelay: animationStyle.animationDelay,
      animationDuration: animationStyle.animationDuration,
        animationIterationCount:animationStyle.animationIterationCount
      }}>
      <div
        style={{
          overflow: "auto",
          overflowX: "hidden",
          height: "100%",
        }}
        ref={divRef}
      >
        <List
          header={
            title !== "" ? (
              <div style={{position: 'sticky', top:0, background: style.background}}>
                {commentListData.length > 1
                  ? title
                      .replaceAll("%d", commentListData.length.toString())
                      .replace("comment", "comments")
                  : title.replaceAll("%d", commentListData.length.toString())}
              </div>
            ) : (
              ""
            )
          }
          size="small"
        >
          <VirtualList
            data={commentListData}
            ////////////////////////////////////////////////////////////////
            // T_T , Frustrating, unable to obtain component height
            // height={height - (sendCommentAble ? 145 : 45) + (title === "" ? 40 : 0)}
            // ref={VirtualListRef}
            ////////////////////////////////////////////////////////////////
            itemKey="createdAt"
          >
            {(item, index) => (
              <List.Item
                key={item?.createdAt}
                actions={
                  deleteAble
                    ? [
                        <CloseOutlined
                          style={{ color: "#c32230" }}
                          onClick={() => handleDelete(index)}
                        />,
                      ]
                    : undefined
                }
              >
                <List.Item.Meta
                  avatar={generateCommentAvatar(item)}
                  title={
                    <div onClick={() => props.onEvent("click")}>
                      <a>{item?.user?.name}</a>
                      <Tooltip
                        title={
                          dayjs(item?.createdAt).isValid()
                            ? dayjs(item?.createdAt).format("YYYY/M/D HH:mm:ss")
                            : trans("comment.dateErr")
                        }
                        placement="bottom"
                      >
                        <span
                          style={{
                            paddingLeft: "5px",
                            color: "#999",
                            fontSize: "11px",
                          }}
                        >
                          {dayjs(item?.createdAt).isValid()
                            ? dayjs(item?.createdAt).fromNow()
                            : trans("comment.dateErr")}
                        </span>
                      </Tooltip>
                    </div>
                  }
                  description={<span>{item?.value}</span>}
                />
              </List.Item>
            )}
          </VirtualList>
        </List>
        {sendCommentAble ? (
          <div style={{position: "sticky", bottom: 0, background: style.background}}>
            <Mentions
              style={{
                width: "100%",
                height: 50,
              }}
              onSearch={onSearch}
              prefix={Object.keys(MentionListData)}
              onChange={onChange}
              onSelect={(option: any) => {
                dispatch(changeChildAction("mentionName", option?.value, false));
                props.onEvent("mention");
              }}
              value={context}
              rows={2}
              onPressEnter={onPressEnter}
              placeholder={placeholder}
            >
              {(MentionListData[prefix] || []).map(
                (value: string, index: number) => (
                  <Mentions.Option key={index.toString()} value={value}>
                    {value}
                  </Mentions.Option>
                )
              )}
            </Mentions>
            <Button
              type="primary"
              style={{
                width: "100%",
                marginTop: "10px",
              }}
              onClick={handleSubmit}
              disabled={context === ""}
            >
              {buttonText}
            </Button>
          </div>
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

let CommentBasicComp = (function () {
  let builder = new UICompBuilder(childrenMap, (props, dispatch) => {
    return (
    <CommentCompBase {...props} dispatch={dispatch} />
  )})
  if (viewMode() === "edit") {
    builder.setPropertyViewFn((children) => <PropertyView {...children}></PropertyView>);
  }
  return builder
    .build();
})();

CommentBasicComp = class extends CommentBasicComp {
  override autoHeight(): boolean {
    return false;
  }
};
export const CommentComp = withExposingConfigs(CommentBasicComp, [
  new NameConfig("commentList", trans("comment.commentList")),
  new NameConfig("deletedItem", trans("comment.deletedItem")),
  new NameConfig("submitedItem", trans("comment.submitedItem")),
  new NameConfig("mentionName", trans("comment.submitedItem")),
  NameConfigHidden,
]);
