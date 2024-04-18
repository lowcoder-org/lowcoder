import { ChildrenTypeToDepsKeys, depsConfig } from "../../generators/withExposing";
import { isEmpty } from "lodash";
import { RecordConstructorToComp } from "lowcoder-core";
import { stringExposingStateControl } from "../../controls/codeStateControl";
import { trans } from "i18n";
import { useEffect, useRef, useState } from "react";
import { refMethods } from "comps/generators/withMethodExposing";
import { blurMethod, focusWithOptions } from "comps/utils/methodUtils";
import { TourStepControl } from "@lowcoder-ee/comps/controls/tourStepControl";
//
// export const SelectInputValidationChildren = {
//   required: BoolControl,
//   customRule: CustomRuleControl,
// };
// type ValidationComp = RecordConstructorToComp<typeof SelectInputValidationChildren>;

type SelectValue = string | (string | number)[];
type ValidationParams = {
  defaultValue?: {
    value: SelectValue,
  };
  value: {
    value: SelectValue,
    onChange?: (value: any) => Promise<unknown>,
  };
  required: boolean;
  customRule: string;
  onEvent?: (eventName: string) => Promise<unknown[]>,
};

export const selectInputValidate = (
  props: ValidationParams
): {
  validateStatus: "success" | "warning" | "error";
  help?: string;
} => {
  if (props.customRule) {
    return { validateStatus: "error", help: props.customRule };
  }
  const value = props.value.value;
  if (props.required && isEmpty(value)) {
    return { validateStatus: "error", help: trans("prop.required") };
  }
  return { validateStatus: "success" };
};

export const useSelectInputValidate = (props: ValidationParams) => {
  const [validateState, setValidateState] = useState({});
  const changeRef = useRef(false);
  const propsRef = useRef<ValidationParams>(props);
  propsRef.current = props;

  const selectValue = props.value.value;
  const defaultValue = props.defaultValue?.value;

  const handleValidate = (value: string | (string | number)[]) => {
    setValidateState(
      selectInputValidate({
        ...propsRef.current,
        value: {
          value
        }
      })
    );
  };

  useEffect(() => {
    props.value.onChange?.(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (!changeRef.current) return;

    handleValidate(selectValue);
    props.onEvent?.("change");
    changeRef.current = false;
  }, [selectValue]);

  const handleChange = (value: any) => {
    props.value.onChange?.(value);
    changeRef.current = true;
  };

  return [
    validateState,
    // handleValidate,
    handleChange
  ] as const;
};

// type ValidationCompWithValue = ValidationComp & {
//   value: ConstructorToComp<
//     ReturnType<
//       | typeof stringExposingStateControl
//       | typeof arrayStringExposingStateControl
//       | typeof jsonExposingStateControl<(string | number)[]>
//     >
//   >;
// };
// export const TourInputInvalidConfig = depsConfig<
//   ValidationCompWithValue,
//   ChildrenTypeToDepsKeys<ValidationCompWithValue>
// >({
//   name: "invalid",
//   desc: trans("export.invalidDesc"),
//   depKeys: ["value", "required", "customRule"],
//   func: (input) =>
//     selectInputValidate({
//       ...input,
//       value: { value: input.value },
//     }).validateStatus !== "success",
// });

// export const SelectInputValidationSection = (children: ValidationComp) => (
//   <Section name={sectionNames.validation}>
//     {requiredPropertyView(children)}
//     {children.customRule.propertyView({})}
//   </Section>
// );

type ChildrenType = RecordConstructorToComp<{
  value: ReturnType<typeof stringExposingStateControl>;
  options: typeof TourStepControl;
}>;
export const TourInputCommonConfig = [
  depsConfig<ChildrenType, ChildrenTypeToDepsKeys<ChildrenType>>({
    name: "selectedIndex",
    desc: trans("selectInput.selectedIndexDesc"),
    depKeys: ["value", "options"],
    func: (input) => input.options.findIndex?.((o: any) => o.value === input.value)
  }),
  depsConfig<ChildrenType, ChildrenTypeToDepsKeys<ChildrenType>>({
    name: "selectedLabel",
    desc: trans("selectInput.selectedLabelDesc"),
    depKeys: ["value", "options"],
    func: (input) => input.options.find?.((o: any) => o.value === input.value)?.title
  })
];

export const selectDivRefMethods = refMethods<HTMLDivElement>([focusWithOptions, blurMethod]);
let styleExample = {
  "style": { "boxShadow": "inset 0 0 15px #fff" },
  "color": "rgba(40, 0, 255, .4)"
};

export const TourStepMaskTooltip = (
  <div>
    {trans("tour.options.mask.tooltip")}:
    <br />
    <br />
    {trans("tour.options.mask.tooltipValidTypes")}
    <br />
    <br />
    <h3>Example:</h3>
    <code>
      {JSON.stringify(styleExample, null, 1)}
    </code>
  </div>
);
