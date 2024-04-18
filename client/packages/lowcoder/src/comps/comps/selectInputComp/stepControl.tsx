import { ConfigProvider, Steps} from "antd";
import { BoolCodeControl } from "comps/controls/codeControl";
import { BoolControl } from "comps/controls/boolControl";
import { stringExposingStateControl, numberExposingStateControl } from "comps/controls/codeStateControl";
import { ChangeEventHandlerControl } from "comps/controls/eventHandlerControl";
import { LabelControl } from "comps/controls/labelControl";
import { StepOptionControl } from "comps/controls/optionsControl";
import { styleControl } from "comps/controls/styleControl";
import { StepsStyle, StepsStyleType } from "comps/controls/styleControlConstants";
import styled, { css } from "styled-components";
import { UICompBuilder } from "../../generators";
import { CommonNameConfig, NameConfig, withExposingConfigs } from "../../generators/withExposing";
import { selectDivRefMethods, } from "./selectInputConstants";
import { Section, sectionNames } from "lowcoder-design";
import { hiddenPropertyView, disabledPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { hasIcon } from "comps/utils";
import { RefControl } from "comps/controls/refControl";
import { dropdownControl } from "comps/controls/dropdownControl";

import { useContext, useState, useEffect } from "react";
import { EditorContext } from "comps/editorState";


const sizeOptions = [
  {
    label: trans("step.sizeSmall"),
    value: "small",
  },
  {
    label: trans("step.sizeDefault"),
    value: "default",
  }
] as const;

const typeOptions = [
  {
    label: trans("step.typeDefault"),
    value: "default",
  },
  {
    label: trans("step.typeNavigation"),
    value: "navigation",
  },
  {
    label: trans("step.typeInline"),
    value: "inline",
  }
] as const;

const directionOptions = [
  {
    label: trans("step.directionHorizontal"),
    value: "horizontal",
  },
  {
    label: trans("step.directionVertical"),
    value: "vertical",
  }
] as const;

const statusOptions = [
  {
    label: trans("step.statusProcess"),
    value: "process"
  },
  {
    label: trans("step.statusWait"),
    value: "wait"
  },
  {
    label: trans("step.statusFinish"),
    value: "finish"
  },
  {
    label: trans("step.statusError"),
    value: "error"
  },
]

const StepsChildrenMap = {
  initialValue: numberExposingStateControl("0"),
  value: stringExposingStateControl("value"),
  stepsStatus : stringExposingStateControl("process"),
  size: dropdownControl(sizeOptions, "default"),
  displayType : dropdownControl(typeOptions, "default"),
  direction: dropdownControl(directionOptions, "horizontal"),
  showDots : BoolControl,
  showIcons : BoolControl,
  label: LabelControl,
  labelPlacement: dropdownControl(directionOptions, "horizontal"),
  disabled: BoolCodeControl,
  onEvent: ChangeEventHandlerControl,
  options: StepOptionControl,
  style: styleControl(StepsStyle),
  viewRef: RefControl<HTMLDivElement>
};

let StepControlBasicComp = (function () {
  return new UICompBuilder(StepsChildrenMap, (props) => {

    // enabling user interaction to change the current step
    const [current, setCurrent] = useState(0);

    // updating the state of current by the expose value
    useEffect(() => {
      setCurrent(Number(props.value.value));
    }, [props.value.value]);


    const onChange = (current: number) => {
      setCurrent(current);
      if (props.options[current]?.value !== undefined) {
        props.value.onChange(props.options[current].value+""); 
        props.onEvent("change");
      }
    };

    // margin-top: 17px; is important cause the dots where placed wrong.
    /* 
.ant-steps.ant-steps-small .ant-steps-item-icon {
      margin-top: 17px;
    }
    */
    const StepsWrapper = styled.div`
      width: 100%;
      min-height: 24px;
    
    `;

    return props.label({
      children: (
        <StepsWrapper ref={props.viewRef}>
          <ConfigProvider
              theme={{
                components: {
                  Steps: {
                    colorPrimary: '#00b96b',
                    algorithm: true, 
                  }
                },
              }}
            >
            <Steps 
              initial={Number(props.initialValue.value) - 1}
              current={current}
              onChange={(current) => {
                onChange(current);
              }}
              percent={60}
              status={props.stepsStatus.value as "error" | "finish" | "process" | "wait"}
              type={props.displayType}
              size={props.size}
              labelPlacement={props.labelPlacement}
              progressDot={props.showDots}
              direction={props.direction}
            >
              {props.options.map((option, index) => (
                <Steps.Step 
                  key={index}
                  title={option.label}
                  subTitle={option.subTitle}
                  description={option.description}
                  status={option.status as "error" | "finish" | "wait" | "process" | undefined}
                  icon={props.showIcons && hasIcon(option.icon) && option.icon || undefined}
                />
              ))}
            </Steps>
          </ConfigProvider>
        </StepsWrapper>
      ),
    });
  })
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.options.propertyView({})}
          {children.initialValue.propertyView({ label: trans("step.initialValue") })}
        </Section>

        {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <>
          <Section name={sectionNames.interaction}>
            {children.onEvent.getPropertyView()}
            {disabledPropertyView(children)}
            {hiddenPropertyView(children)}
            {children.stepsStatus.propertyView({label: trans("step.status")})}
          </Section></>
        )}

        {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          children.label.getPropertyView()
        )}

        {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <Section name={sectionNames.layout}>
            {children.size.propertyView({
              label: trans("step.size"),
              radioButton: true,
            })}
            {children.displayType.propertyView({
              label: trans("step.type"),
              radioButton: false,
            })}
            {children.direction.propertyView({
              label: trans("step.direction"),
              radioButton: true,
            })}
            {children.labelPlacement.propertyView({
              label: trans("step.labelPlacement"),
              radioButton: true,
            })}
            {children.showDots.propertyView({label: trans("step.showDots")})}
            {children.showIcons.propertyView({label: trans("step.showIcons")})}
          </Section>
        )}

        {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <Section name={sectionNames.style}>
            {children.style.getPropertyView()}
          </Section>
        )}
      </>
    ))
    .setExposeMethodConfigs(selectDivRefMethods)
    .build();
})();

export const StepComp = withExposingConfigs(StepControlBasicComp, [
  new NameConfig("value", trans("step.valueDesc")),
  ...CommonNameConfig,
]);
