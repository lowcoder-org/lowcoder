import { trans } from "i18n";
import { check } from "util/convertUtils";
import { refMethods } from "comps/generators/withMethodExposing";
import { InputRef } from "antd/es/input";


import {
  blurMethod,
  focusWithOptions,
  selectMethod,
  setSelectionRangeMethod,
} from "comps/utils/methodUtils";

export const autoCompleteRefMethods = [
  ...refMethods<InputRef>([focusWithOptions, blurMethod, selectMethod, setSelectionRangeMethod]),
];


export type autoCompleteDataTYPE = {
  value: string;
  label: string;
};

export const autocompleteIconColor = [
  {
    label: trans("autoComplete.colorIcon"),
    value: 'blue',
  },
  {
    label: trans("autoComplete.grewIcon"),
    value: 'grew',
  },
] as const;

export const valueOrLabelOption = [
  {
    label: trans("autoComplete.selectLable"),
    value: "label",
  },
  {
    label: trans("autoComplete.selectKey"),
    value: "value",
  },
] as const;

export const componentSize = [
  {
    label: trans("autoComplete.small"),
    value: "small",
  },
  {
    label: trans("autoComplete.large"),
    value: "large",
  },
] as const;

export const autoCompleteType = [
  {
    label: trans("autoComplete.antDesign"),
    value: "AntDesign",
  },
  {
    label: trans("autoComplete.normal"),
    value: "normal",
  },
] as const;

export const itemsDataTooltip = (
  <li>
    {trans("autoComplete.Introduction")}:
    <br />
    1. label - {trans("autoComplete.helpLabel")}
    <br />
    2. value - {trans("autoComplete.helpValue")}
  </li>
);

export const autoCompleteDate = [
  {value: '1-BeiJing',label: '北京'},
  {value: '2-ShangHai',label: '上海'},
  {value: '3-GuangDong',label: '广东'},
  {value: '4-ShenZhen',label: '深圳'},
];

export function convertAutoCompleteData(data: any) {
  return data === "" ? [] : checkDataNodes(data) ?? [];
}

function checkDataNodes(
  value: any,
  key?: string
): autoCompleteDataTYPE[] | undefined {
  return check(value, ["array", "undefined"], key, (node, k) => {
    check(node["value"], ["string"], "value");
    check(node["label"], ["string"], "label");
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