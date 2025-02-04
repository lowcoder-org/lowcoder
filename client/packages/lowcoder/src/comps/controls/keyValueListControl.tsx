import { ControlPropertyViewWrapper, KeyValueList, OptionsType } from "lowcoder-design";
import { ReactNode } from "react";
import styled from "styled-components";
import { list } from "../generators/list";
import { ControlParams } from "./controlParams";
import { ParamsControlType, ParamsStringControl } from "./paramsControl";
import { FunctionProperty } from "../queries/queryCompUtils";
import { keyValueControl, KeyValueControlParams } from "./keyValueControl"

/**
 * Provides a list of kv input boxes with add and delete buttons
 * output [{key: "", value: ""}, {key: "", value: ""}]
 */
export function keyValueListControl<T extends OptionsType>(
  hasType: boolean = false,
  types: T | OptionsType = [],
  controlType: "params" | "string" = "params"
) {
  return class extends list(keyValueControl(hasType, types, controlType)) {
    getQueryParams() {
      if (controlType === "params") {
        return this.getView().reduce(
          (result: FunctionProperty[], kv) => [
            ...result,
            ...(kv.children.key as InstanceType<ParamsControlType>).getQueryParams(),
            ...(kv.children.value as InstanceType<ParamsControlType>).getQueryParams(),
          ],
          []
        );
      }
      return [];
    }

    propertyView(params: KeyValueControlParams): ReactNode {
      return (
        <ControlPropertyViewWrapper {...params}>
          <KeyValueList
            list={this.getView().map((child) => child.propertyView(params))}
            onAdd={() => this.dispatch(this.pushAction({}))}
            onDelete={(item, index) => this.dispatch(this.deleteAction(index))}
            isStatic={params.isStatic}
            indicatorForAll={params.indicatorForAll}
          />
        </ControlPropertyViewWrapper>
      );
    }
  };
}
