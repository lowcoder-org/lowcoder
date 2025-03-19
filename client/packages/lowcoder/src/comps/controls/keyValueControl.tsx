import { OptionsType } from "lowcoder-design";
import { ReactNode } from "react";
import styled from "styled-components";
import { MultiCompBuilder } from "../generators";
import { StringControl } from "./codeControl";
import { ControlParams } from "./controlParams";
import { dropdownControl } from "./dropdownControl";
import { ParamsStringControl } from "./paramsControl";
import { SimpleNameComp } from "../comps/simpleNameComp";

const KeyValueWrapper = styled.div`
  display: flex;
  width: 424px;
  flex-grow: 1;

  .cm-editor {
    margin-top: 0;
  }
`;

const KeyWrapper = styled.div<{ $flexBasics?: number }>`
  display: flex;
  margin-right: 8px;
  flex: 1;
  flex-basis: ${(props) => (props.$flexBasics ? props.$flexBasics + "px" : "0%")};

  & > div:first-child {
    flex-grow: 1;
    display: block;
  }
`;

const TypeWrapper = styled.div`
  margin-left: 8px;
  width: 25%;
  flex-shrink: 0;
`;

const ValueWrapper = styled.div<{ $flexBasics?: number }>`
  flex: 1;
  flex-basis: ${(props) => (props.$flexBasics ? props.$flexBasics + "px" : "0%")};
`;

export type KeyValueControlParams = ControlParams & {
  showType?: boolean;
  typeTooltip?: ReactNode;
  keyFlexBasics?: number;
  valueFlexBasics?: number;
  isStatic?: boolean;
  keyFixed?: boolean;
  indicatorForAll?: boolean;
};

/**
 * Provide two input boxes for kv
 * controlType: params output: {key: {"1+2": () => "3"}, value: {"-1": () => "-1"}}
 * controlType: string output: {key: "xxx", value: "xxxx"}
 */
export function keyValueControl<T extends OptionsType>(
  hasType: boolean = false,
  types: T,
  controlType: "params" | "string" | "variable" = "params"
) {
  let childrenMap = {
    key: controlType === "params" ? ParamsStringControl : StringControl,
    value: controlType === "params" ? ParamsStringControl : StringControl,
    type: dropdownControl(types, types[0]?.value),
  };
  if(controlType === "variable") {
    childrenMap = {
      key: SimpleNameComp as any,
      value: StringControl,
      type: dropdownControl(types, types[0]?.value),
    };
  }
  return class extends new MultiCompBuilder(childrenMap, (props) => {
    return hasType
      ? {
          key: props.key,
          value: props.value,
          type: props.type,
        }
      : {
          key: props.key,
          value: props.value,
        };
  })
    .setPropertyViewFn(() => <></>)
    .build() {
    propertyView(params: KeyValueControlParams) {
      return (
        <KeyValueWrapper>
          <KeyWrapper $flexBasics={params.keyFlexBasics}>
            {params.keyFixed?
              <>{this.children.key.getView()}</>
            :<>
              {this.children.key.propertyView({ placeholder: "key", indentWithTab: false })}
              {hasType && params.showType && (
                <TypeWrapper>
                  {this.children.type.propertyView({
                    placeholder: "key",
                    indentWithTab: false,
                    tooltip: params.typeTooltip,
                  })}
                </TypeWrapper>
              )}
            </>}
          </KeyWrapper>
          <ValueWrapper $flexBasics={params.valueFlexBasics}>
            {this.children.value.propertyView({
              placeholder: "value",
              indentWithTab: false,
            })}
          </ValueWrapper>
        </KeyValueWrapper>
      );
    }
  };
}

