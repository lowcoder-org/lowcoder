import _, { isObject } from "lodash";
import { QueryApi, QueryExecuteRequest } from "../../api/queryApi";
import { QueryResult, TriggerType } from "./queryComp";
import { Comp } from "lowcoder-core";
import { MultiCompBuilder, ToConstructor } from "../generators/multi";
import { Fragment } from "react";
import { ParamsControlType, ValueFunction } from "../controls/paramsControl";
import { getGlobalSettings } from "comps/utils/globalSettings";
import { ResourceType } from "@lowcoder-ee/constants/queryConstants";

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
    console.log("toQueryView props", props, params);
    const { applicationId, isViewMode } = getGlobalSettings();

    const mappedVariables = Object.keys(props.variables).map(key => ({key: `${props.args?.$queryName}.variables.${key}`, value: props.variables[key]}));
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
