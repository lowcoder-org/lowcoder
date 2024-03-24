import { BoolCodeControl, jsonControl } from "comps/controls/codeControl";
import { check } from "util/convertUtils";
import {timelineNode} from './timelineConstants'

export function convertTimeLineData(data: any) {
  return data === "" ? [] : checkDataNodes(data) ?? [];
}

function checkDataNodes(value: any, key?: string): timelineNode[] | undefined {
  return check(value, ["array", "undefined"], key, (node, k) => {
    check(node, ["object"], k);
    check(node["title"], ["string"], "title");
    check(node["subTitle"], ["string", "undefined"], "subTitle");
    check(node["label"], ["string", "undefined"], "label");
    check(node["color"], ["string", "undefined"], "color");
    check(node["titleColor"], ["string", "undefined"], "titleColor");
    check(node["subTitleColor"], ["string", "undefined"], "subTitleColor");
    check(node["labelColor"], ["string", "undefined"], "labelColor");
    check(node["dot"], ["string", "undefined"], "dot");
    return node;
  });
}
