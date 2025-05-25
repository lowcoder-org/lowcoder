import _, { isObject } from "lodash";
import { QueryApi, QueryExecuteRequest } from "../../api/queryApi";
import { QueryResult, TriggerType } from "./queryComp";
import { Comp } from "lowcoder-core";
import { MultiCompBuilder, ToConstructor } from "../generators/multi";
import { Fragment } from "react";
import { ParamsControlType, ValueFunction } from "../controls/paramsControl";
import { getGlobalSettings } from "comps/utils/globalSettings";
import { ResourceType } from "@lowcoder-ee/constants/queryConstants";
import { evalFunc } from "lowcoder-core";
import { QUERY_EXECUTION_ERROR, QUERY_EXECUTION_OK } from "../../constants/queryConstants";
import type { SandBoxOption } from "lowcoder-core/src/eval/utils/evalScript";

export type FunctionProperty = {
  key: string;
  value: ValueFunction;
};

/**
 * public method for query request
 */
export function toQueryView(params: FunctionProperty[]) {
  /**
   * FIXME: queryComp unified plus timeout parameter
   */
  return async (props: {
    queryId: string;
    applicationId: string;
    applicationPath: string[];
    args?: Record<string, unknown>;
    variables?: any;
    timeout: InstanceType<ParamsControlType>;
  }): Promise<QueryResult> => {
    const { applicationId, isViewMode } = getGlobalSettings();

    // Check if this is a JS query
    const isJsQuery = props.queryId?.startsWith("js:");
    if (isJsQuery) {
      try {
        const { orgCommonSettings } = getGlobalSettings();
        const runInHost = !!orgCommonSettings?.runJavaScriptInHost;
        const timer = performance.now();
        const script = props.args?.script || "";
        const options: SandBoxOption = { disableLimit: runInHost };
        const data = await evalFunc(`return (${script}\n);`, props.args || {}, undefined, options);
        return {
          data: data,
          code: QUERY_EXECUTION_OK,
          success: true,
          runTime: Number((performance.now() - timer).toFixed()),
        };
      } catch (e) {
        return {
          success: false,
          data: "",
          code: QUERY_EXECUTION_ERROR,
          message: (e as any).message || "",
        };
      }
    }

    let mappedVariables: Array<{key: string, value: string}> = [];
    Object.keys(props.variables)
      .filter(k => k !== "$queryName")
      .forEach(key => {
        const value = Object.hasOwn(props.variables[key], 'value') ? props.variables[key].value : props.variables[key];
        mappedVariables.push({
          key: `${key}.value`,
          value: value || ""
        })
        mappedVariables.push({
          key: `${props.args?.$queryName}.variables.${key}`,
          value: value || ""
        })
      })

    let request: QueryExecuteRequest = {
      path: props.applicationPath,
      params: [
        ...params.filter(param => {
          return !mappedVariables.map(v => v.key).includes(param.key);
        }).map(({ key, value }) => ({ key, value: value(props.args) })),
        ...Object.entries(props.timeout.getView()).map(([key, value]) => ({
          key,
          value: value(props.args),
        })),
        ...mappedVariables,
      ],
      viewMode: !!isViewMode,
    };
    if (!applicationId) {
      request = { ...request, libraryQueryId: props.queryId, libraryQueryRecordId: "latest" };
    } else {
      request = { ...request, applicationId: props.applicationId, queryId: props.queryId };
    }

    const response = await QueryApi.executeQuery(
      request,
      props.timeout.children.text.getView() as number
    );

    return {
      ...response.data,
      code: response.data.queryCode,
      extra: _.omit(response.data, ["code", "message", "data", "success", "runTime", "queryCode"]),
    };
  };
}

export function buildQueryCommand<ChildrenCompMap extends Record<string, Comp<unknown>>>(
  childrenMap: ToConstructor<ChildrenCompMap>
) {
  return new MultiCompBuilder(
    childrenMap,
    (props) =>
      Object.values(props)
        .filter((prop) => isObject(prop))
        .reduce(
          (result: FunctionProperty[], prop) => [
            ...result,
            ...Object.entries(prop).map((kv) => ({
              key: kv[0],
              value: kv[1],
            })),
          ],
          []
        ) as FunctionProperty[]
  )
    .setPropertyViewFn((children) => (
      <>
        {Object.entries(children).map((e) => (
          <Fragment key={e[0]}>{e[1].getPropertyView()}</Fragment>
        ))}
      </>
    ))
    .build();
}

export function onlyManualTrigger(type: ResourceType) {
  return false;
}

export function getTriggerType(comp: any): TriggerType {
  return comp.children.triggerType.getView();
}
