import { JSONObject } from "lowcoder-sdk";

export type JSONValue = string | number | boolean | JSONObject | JSONArray | null;

export interface JSONObject {
  [x: string]: JSONValue | undefined;
}

export type I18nObjects = {
  defaultData: JSONObject[];
};

export type JSONArray = Array<JSONValue>;