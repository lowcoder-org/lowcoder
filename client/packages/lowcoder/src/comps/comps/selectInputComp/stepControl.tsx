import { ConfigProvider, Steps} from "antd";
import { BoolCodeControl } from "comps/controls/codeControl";
import { BoolControl } from "comps/controls/boolControl";
import { stringExposingStateControl, numberExposingStateControl } from "comps/controls/codeStateControl";
import { ChangeEventHandlerControl } from "comps/controls/eventHandlerControl";
import { StepOptionControl } from "comps/controls/optionsControl";
import { styleControl } from "comps/controls/styleControl";
import { StepsStyle, StepsStyleType, heightCalculator, widthCalculator, marginCalculator, AnimationStyle, AnimationStyleType } from "comps/controls/styleControlConstants";
import styled, { css } from "styled-components";
import { UICompBuilder, withDefault } from "../../generators";
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
  initialValue: numberExposingStateControl("1"),
  value: stringExposingStateControl("value"),
  stepStatus : stringExposingStateControl("process"),
  stepPercent: numberExposingStateControl("60"),
  size: dropdownControl(sizeOptions, "default"),
  displayType : dropdownControl(typeOptions, "default"),
  direction: dropdownControl(directionOptions, "horizontal"),
  showDots : BoolControl,
  showIcons : BoolControl,
  selectable : BoolControl,
  labelPlacement: dropdownControl(directionOptions, "horizontal"),
  disabled: BoolCodeControl,
  onEvent: ChangeEventHandlerControl,
  options: StepOptionControl,
  style: withDefault( styleControl(StepsStyle), {text:'#D7D9E0'}),
  viewRef: RefControl<HTMLDivElement>,
  animationStyle: styleControl(AnimationStyle)
};

let StepControlBasicComp = (function () {
  return new UICompBuilder(StepsChildrenMap, (props) => {

    const StyledWrapper = styled.div<{ style: StepsStyleType, $animationStyle: AnimationStyleType }>`
    ${props=>props.$animationStyle}
      min-height: 24px;
      max-width: ${widthCalculator(props.style.margin)};
      max-height: ${heightCalculator(props.style.margin)};
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-decoration: ${props.style.textDecoration};
      font-style: ${props.style.fontStyle};
      font-weight: ${props.style.textWeight};
      font-size: ${props.style.textSize};
      text-transform: ${props.style.textTransform};
      margin: ${props.style.margin};
      rotate: ${props.style.rotation};
      padding: ${props.style.padding};
      background-color: ${props.style.background};
      border: ${props.style.borderWidth} solid ${props.style.border};
      border-radius: ${props.style.radius};
      background-image: url(${props.style.backgroundImage});
      background-repeat: ${props.style.backgroundImageRepeat};
      background-size: ${props.style.backgroundImageSize};
      background-position: ${props.style.backgroundImagePosition};
      background-origin: ${props.style.backgroundImageOrigin};
      .ant-steps-item { padding-top: 5px !important; }
      .ant-steps.ant-steps-label-vertical.ant-steps-small .ant-steps-item-icon { margin-top: 17px !important; }
      .ant-steps.ant-steps-label-vertical.ant-steps-default .ant-steps-item-icon { margin-top: 12px !important; }
      .ant-steps.ant-steps-dot .ant-steps-item-process .ant-steps-icon .ant-steps-icon-dot { margin-top: 4px !important; }
      .ant-steps.ant-steps-default .ant-steps-item-icon .ant-steps-icon-dot { margin-top: 9px !important; }
      .ant-steps.ant-steps-small .ant-steps-item-icon .ant-steps-icon-dot { margin-top: 4px !important; }
      .ant-steps.ant-steps-dot .ant-steps-item-title { margin-top: 10px !important; }
      .ant-steps.ant-steps-default.ant-steps-with-progress.ant-steps-label-horizontal .ant-steps-item.ant-steps-item-custom div.ant-steps-item-icon { margin-top:4px !important; }
      .ant-steps.ant-steps-default.ant-steps-with-progress.ant-steps-label-vertical .ant-steps-item.ant-steps-item-custom div.ant-steps-item-icon { margin-top:17px !important; }
      .ant-steps.ant-steps-dot.ant-steps-small.ant-steps-with-progress .ant-steps-item-icon .ant-progress { inset-block-start: -8px !important; inset-inline-start: -11px !important; }
      .ant-steps.ant-steps-dot.ant-steps-default.ant-steps-with-progress .ant-steps-item-icon .ant-progress { inset-block-start: -7px !important; inset-inline-start: -13px !important; }
      .ant-steps.ant-steps-small.ant-steps-with-progress .ant-steps-item:not(.ant-steps-item-custom) .ant-progress { inset-block-start: -5px !important; inset-inline-start: -5px !important; }
      .ant-steps.ant-steps-default.ant-steps-with-progress .ant-steps-item:not(.ant-steps-item-custom) .ant-progress { inset-block-start: -5px !important; inset-inline-start: -5px !important; }
      .ant-steps.ant-steps-small.ant-steps-with-progress .ant-steps-item.ant-steps-item-custom .ant-progress { inset-block-start: -5px !important; inset-inline-start: -10px !important; }
      .ant-steps.ant-steps-default.ant-steps-with-progress .ant-steps-item.ant-steps-item-custom .ant-progress { inset-block-start: -4px !important; inset-inline-start: -13px !important; }
    `;

    const [current, setCurrent] = useState(props.initialValue.value - 1); // Convert 1-based index to 0-based.

    useEffect(() => {
      const newValue = Number(props.value.value);
      setCurrent(newValue - 1); // Adjust for 0-based index.
    }, [props.value.value]);

    const onChange = (index: number) => {
      if (props.selectable == false) return;
      const newIndex = Math.max(0, index);
      setCurrent(newIndex);
      if (props.options[newIndex]?.value !== undefined) {
        props.value.onChange(newIndex + 1 + ""); // Convert back to 1-based index for display.
        props.onEvent("change");
      }
    };

    return (
        <ConfigProvider
            theme={{
              token: { 
                colorPrimary: props.style.activeBackground,
                colorText: props.style.titleText,
                colorTextDescription: props.style.text,
                fontFamily: props.style.fontFamily,
              }
            }}
          >
          <StyledWrapper style={props.style} $animationStyle={props.animationStyle}>
            <Steps 
              initial={props.initialValue.value -1}
              current={current}
              onChange={onChange}
              percent={props.stepPercent.value}
              status={props.stepStatus.value as "error" | "finish" | "process" | "wait"}
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
          </StyledWrapper>
        </ConfigProvider>
    );

  })
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.options.propertyView({})}
          {children.initialValue.propertyView({ label: trans("step.initialValue"), tooltip : trans("step.initialValueTooltip")})}
        </Section>

        {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <>
          <Section name={sectionNames.interaction}>
            {children.onEvent.getPropertyView()}
            {disabledPropertyView(children)}
            {hiddenPropertyView(children)}
            {children.stepStatus.propertyView({label: trans("step.status")})}
            {children.stepPercent.propertyView({label: trans("step.percent")})}
            {children.selectable.propertyView({label: trans("step.selectable")})}
          </Section></>
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
            { children.direction.getView() == "horizontal" && 
              children.labelPlacement.propertyView({
                label: trans("step.labelPlacement"),
                radioButton: true,
              })
            }
            { children.displayType.getView() != "inline" && !children.showIcons.getView() && (
              children.showDots.propertyView({label: trans("step.showDots")}
            ))}
            { children.displayType.getView() != "inline" && !children.showDots.getView() && (
              children.showIcons.propertyView({label: trans("step.showIcons")}
            ))}
          </Section>
        )}

        {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <>
          <Section name={sectionNames.style}>
            {children.style.getPropertyView()}
          </Section>
          <Section name={sectionNames.animationStyle} hasTooltip={true}>
            {children.animationStyle.getPropertyView()}
          </Section>
          </>
        )}
      </>
    ))
    .setExposeMethodConfigs(selectDivRefMethods)
    .build();
})();

export const StepComp = withExposingConfigs(StepControlBasicComp, [
  new NameConfig("value", trans("step.valueDesc")),
  new NameConfig("stepStatus", trans("step.status") ),
  new NameConfig("stepPercent", trans("step.percent")),
  ...CommonNameConfig,
]);
