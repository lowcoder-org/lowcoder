import React, { useEffect, useState, useRef } from "react";
// 渲染组件到编辑器
import {
  changeChildAction,
  CompAction,
  RecordConstructorToView,
} from "lowcoder-core";
// 文字国际化转换api
import { trans } from "i18n";
// 右侧属性栏总框架
import { UICompBuilder, withDefault } from "../../generators";
// 右侧属性子框架
import { Section, sectionNames } from "lowcoder-design";
// 指示组件是否隐藏的开关
import { hiddenPropertyView } from "comps/utils/propertyUtils";
// 右侧属性开关

import { BoolControl } from "comps/controls/boolControl";
import { styleControl } from "comps/controls/styleControl"; //样式输入框
import { jsonValueExposingStateControl } from "comps/controls/codeStateControl";
import { jsonControl, StringControl } from "comps/controls/codeControl";
// 事件控制
import {
  clickEvent,
  submitEvent,
  eventHandlerControl,
  deleteEvent,
  mentionEvent,
} from "comps/controls/eventHandlerControl";

// 引入样式
import {
  CommentStyle,
  heightCalculator,
  widthCalculator,
} from "comps/controls/styleControlConstants";
// 初始化暴露值
import { stateComp, valueComp } from "comps/generators/simpleGenerators";
// 组件对外暴露属性的api
import {
  NameConfig,
  NameConfigHidden,
  withExposingConfigs,
} from "comps/generators/withExposing";

import {
  commentDate,
  commentDataTYPE,
  CommentDataTooltip,
  CommentUserDataTooltip,
  convertCommentData,
  checkUserInfoData,
  checkMentionListData,
} from "./commentConstants";
import { Avatar, List, Button, Mentions, Tooltip } from "antd";
import VirtualList, { ListRef } from "rc-virtual-list";
import _ from "lodash";
import relativeTime from "dayjs/plugin/relativeTime";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import { getInitialsAndColorCode } from "util/stringUtils";
import { CloseOutlined } from "@ant-design/icons";
dayjs.extend(relativeTime);
dayjs.locale("zh-cn");

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
  mentionList: jsonControl(checkMentionListData, {
    "@": ["Li Lei", "Han Meimei"],
    "#": ["123", "456", "789"],
  }),
  onEvent: eventHandlerControl(EventOptions),
  style: styleControl(CommentStyle),
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
  } = props;
  type PrefixType = "@" | keyof typeof mentionList;
  // 用于保存整合后的提及列表
  const [MentionListData, setMentionList] = useState<typeof mentionList>([]);
  const [commentListData, setCommentListData] = useState<commentDataTYPE[]>([]);
  const [prefix, setPrefix] = useState<PrefixType>("@");
  const [context, setContext] = useState<string>("");
  // 将评论列表与原提及列表中的名字进行整合
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

  // 获取提及搜索关键字
  const onSearch = (_: string, newPrefix: PrefixType) => {
    setPrefix(newPrefix);
  };
  // 生成评论头像
  const generateCommentAvatar = (item: commentDataTYPE) => {
    return (
      <Avatar
        onClick={() => props.onEvent("click")}
        // 如果有头像，则不设置背景色，如果displayName不为空，则使用getInitialsAndColorCode调用displayName
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
    <div
      style={{
        margin: style.margin ?? "3px",
        padding: style.padding ?? "3px",
        width: widthCalculator(style.margin ?? "3px"),
        height: heightCalculator(style.margin ?? "3px"),
        background: style.background,
        overflow: "auto",
        overflowX: "hidden",
        borderRadius: style.radius,
      }}
      ref={divRef}
    >
      <List
        header={
          title !== "" ? (
            <div>
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
        <>
          <Mentions
            style={{
              width: "98%",
              height: 50,
              margin: "0px 10px 0px 5px",
              // position: "fixed",
              // bottom: "50px",
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
              width: "98%",
              margin: "10px 10px 10px 5px",
              // position: "fixed",
              // bottom: "0px",
            }}
            onClick={handleSubmit}
            disabled={context === ""}
          >
            {buttonText}
          </Button>
        </>
      ) : (
        ""
      )}
    </div>
  );
};

let CommentBasicComp = (function () {
  return new UICompBuilder(childrenMap, (props, dispatch) => (
    <CommentCompBase {...props} dispatch={dispatch} />
  ))
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.title.propertyView({
            label: trans("comment.title"),
          })}
          {children.value.propertyView({
            label: trans("comment.value"),
            tooltip: CommentDataTooltip,
            placeholder: "[]",
          })}
          {children.userInfo.propertyView({
            label: trans("comment.userInfo"),
            tooltip: CommentUserDataTooltip,
          })}
          {children.mentionList.propertyView({
            label: trans("comment.mentionList"),
            tooltip: trans("comment.mentionListDec"),
          })}
          {children.sendCommentAble.propertyView({
            label: trans("comment.showSendButton"),
          })}
          {children.sendCommentAble.getView() &&
            children.buttonText.propertyView({
              label: trans("comment.buttonTextDec"),
            })}
          {children.placeholder.propertyView({
            label: trans("comment.placeholderDec"),
          })}
          {children.deleteAble.propertyView({
            label: trans("comment.deleteAble"),
          })}
        </Section>
        <Section name={sectionNames.layout}>
          {children.onEvent.getPropertyView()}
          {hiddenPropertyView(children)}
        </Section>
        <Section name={sectionNames.style}>
          {children.style.getPropertyView()}
        </Section>
      </>
    ))
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
