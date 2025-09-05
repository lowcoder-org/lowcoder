import { COLUMN_CHILDREN_KEY, OB_ROW_ORI_INDEX } from "../tableUtils";
import { JSONObject } from "util/jsonTypes";

export function indexKeyToRecord(data: JSONObject[], key: string) {
  const keyPath = (key + "").split("-");
  let currentData = data;
  let res: any = undefined;
  for (const k of keyPath) {
    const index = Number(k);
    if (index >= 0 && Array.isArray(currentData) && index < currentData.length) {
      res = currentData[index];
      currentData = (res as any)[COLUMN_CHILDREN_KEY] as JSONObject[];
    }
  }
  return res;
}

export function toDisplayIndex(displayData: JSONObject[], selectRowKey: string) {
  const keyPath = selectRowKey.split("-");
  const originSelectKey = keyPath[0];
  if (!originSelectKey) {
    return "";
  }
  let displayIndex: any;
  displayData.forEach((data, index) => {
    if ((data as any)[OB_ROW_ORI_INDEX] === originSelectKey) {
      displayIndex = index;
    }
  });
  if (displayIndex !== undefined && keyPath.length > 1) {
    return [displayIndex, ...keyPath.slice(1)].join("-");
  }
  return displayIndex;
} 