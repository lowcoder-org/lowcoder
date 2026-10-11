import { Steps } from "antd";
import type { StepProps, StepsProps } from "antd/es/steps";
import { BoolCodeControl, RadiusControl } from "comps/controls/codeControl";
import { BoolControl } from "comps/controls/boolControl";
import {
  stringExposingStateControl,
  numberExposingStateControl,
} from "comps/controls/codeStateControl";
import { ChangeEventHandlerControl } from "comps/controls/eventHandlerControl";
import { StepOptionControl } from "comps/controls/optionsControl";
import { styleControl } from "comps/controls/styleControl";
import {
  StepsStyle,
  StepsStyleType,
  heightCalculator,
  widthCalculator,
  AnimationStyle,
  AnimationStyleType,
} from "comps/controls/styleControlConstants";
import styled from "styled-components";
import { UICompBuilder, withDefault } from "../../generators";
import {
  CommonNameConfig,
  NameConfig,
  withExposingConfigs,
} from "../../generators/withExposing";
import { selectDivRefMethods } from "./selectInputConstants";
import { ScrollBar, Section, sectionNames } from "lowcoder-design";
import {
  hiddenPropertyView,
  disabledPropertyView,
} from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { hasIcon } from "comps/utils";
import { RefControl } from "comps/controls/refControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { useEditorStore } from "comps/editorStore";
import { getBackgroundStyle } from "@lowcoder-ee/util/styleUtils";
import { AutoHeightControl } from "@lowcoder-ee/comps/controls/autoHeightControl";

const sizeOptions = [
  {
    label: trans("step.sizeSmall"),
    value: "small",
  },
  {
    label: trans("step.sizeDefault"),
    value: "default",
  },
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
  },
] as const;

const directionOptions = [
  {
    label: trans("step.directionHorizontal"),
    value: "horizontal",
  },
  {
    label: trans("step.directionVertical"),
    value: "vertical",
  },
] as const;

const statusOptions = [
  {
    label: trans("step.statusProcess"),
    value: "process",
  },
  {
    label: trans("step.statusWait"),
    value: "wait",
  },
  {
    label: trans("step.statusFinish"),
    value: "finish",
  },
  {
    label: trans("step.statusError"),
    value: "error",
  },
];

type StepStatus = NonNullable<StepProps["status"]>;
type StepsType = NonNullable<StepsProps["type"]>;

const validStepStatuses: StepStatus[] = ["wait", "process", "finish", "error"];

const getFiniteNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getStepStatus = (status: unknown): StepStatus | undefined => {
  return validStepStatuses.includes(status as StepStatus)
    ? (status as StepStatus)
    : undefined;
};

const getCurrentStepIndex = (
  currentValue: unknown,
  initialValue: number,
  options: Array<{ value: number }>,
) => {
  const parsedValue = Number(currentValue);
  if (!Number.isFinite(parsedValue) || options.length === 0) {
    return 0;
  }

  const optionIndex = options.findIndex(
    (option) => Number(option.value) === parsedValue,
  );
  if (optionIndex >= 0) {
    return optionIndex;
  }

  const offsetIndex = parsedValue - initialValue;
  return Number.isInteger(offsetIndex) &&
    offsetIndex >= 0 &&
    offsetIndex < options.length
    ? offsetIndex
    : 0;
};

const StyledWrapper = styled.div<{
  $style: StepsStyleType;
  $animationStyle: AnimationStyleType;
  $autoHeight: boolean;
  $disabled: boolean;
}>`
  ${(props) => props.$animationStyle}
  width: 100%;
  height: ${(props) => (props.$autoHeight ? "auto" : "100%")};
  min-height: 24px;
  max-width: ${(props) => widthCalculator(props.$style.margin)};
  max-height: ${(props) => heightCalculator(props.$style.margin)};
  overflow: hidden;
  box-sizing: border-box;
  margin: ${(props) => props.$style.margin};
  rotate: ${(props) => props.$style.rotation};
  padding: ${(props) => props.$style.padding};
  border: ${(props) => props.$style.borderWidth}
    ${(props) => props.$style.borderStyle} ${(props) => props.$style.border};
  border-radius: ${(props) => props.$style.radius};
  opacity: ${(props) => props.$style.opacity};
  box-shadow: ${(props) =>
    `${props.$style.boxShadow} ${props.$style.boxShadowColor}`};
  cursor: ${(props) => (props.$disabled ? "not-allowed" : "inherit")};
  ${(props) => getBackgroundStyle(props.$style)}

  .ant-steps-item-title,
  .ant-steps-item-subtitle,
  .ant-steps-item-description {
    font-family: ${(props) => props.$style.fontFamily};
    font-size: ${(props) => props.$style.textSize};
    font-weight: ${(props) => props.$style.textWeight};
    font-style: ${(props) => props.$style.fontStyle};
    text-transform: ${(props) => props.$style.textTransform};
    text-decoration: ${(props) => props.$style.textDecoration};
  }

  .ant-steps-item-title {
    color: ${(props) => props.$style.stepTitleColor} !important;
  }

  .ant-steps-item-subtitle,
  .ant-steps-item-description {
    color: ${(props) => props.$style.stepDescriptionColor} !important;
  }

  .ant-steps-item-tail::after,
  .ant-steps-item-title::after {
    background-color: ${(props) => props.$style.stepLineColor} !important;
  }

  /* Icon backgrounds */
  .ant-steps-item-process .ant-steps-item-icon {
    background-color: ${(props) => props.$style.stepActiveColor} !important;
    border-color: ${(props) => props.$style.stepActiveColor} !important;
  }

  .ant-steps-item-finish .ant-steps-item-icon,
  .ant-steps-item-wait .ant-steps-item-icon,
  .ant-steps-item-disabled .ant-steps-item-icon {
    background-color: ${(props) => props.$style.stepIconBackground} !important;
  }

  .ant-steps-item-finish .ant-steps-item-icon {
    border-color: ${(props) => props.$style.stepActiveColor} !important;
  }

  .ant-steps-item-wait .ant-steps-item-icon,
  .ant-steps-item-disabled .ant-steps-item-icon {
    border-color: ${(props) => props.$style.stepLineColor} !important;
  }

  .ant-steps-item-error .ant-steps-item-icon {
    background-color: ${(props) => props.$style.stepErrorColor} !important;
    border-color: ${(props) => props.$style.stepErrorColor} !important;
  }

  /* Icon text colors */
  .ant-steps-item-process .ant-steps-item-icon > .ant-steps-icon,
  .ant-steps-item-error .ant-steps-item-icon > .ant-steps-icon {
    color: ${(props) => props.$style.stepIconTextColor} !important;
  }

  .ant-steps-item-finish .ant-steps-item-icon > .ant-steps-icon {
    color: ${(props) => props.$style.stepActiveColor} !important;
  }

  .ant-steps-item-wait .ant-steps-item-icon > .ant-steps-icon,
  .ant-steps-item-disabled .ant-steps-item-icon > .ant-steps-icon {
    color: ${(props) => props.$style.stepDisabledColor} !important;
  }

  /* Completed/error line connectors */
  .ant-steps-item-finish .ant-steps-item-tail::after,
  .ant-steps-item-finish .ant-steps-item-title::after {
    background-color: ${(props) => props.$style.stepActiveColor} !important;
  }

  .ant-steps-item-error .ant-steps-item-tail::after,
  .ant-steps-item-error .ant-steps-item-title::after,
  .ant-steps-item.ant-steps-next-error .ant-steps-item-title::after {
    background-color: ${(props) => props.$style.stepErrorColor} !important;
  }

  /* Custom icons need explicit circle shape */
  .ant-steps-item-custom .ant-steps-icon {
    width: 32px;
    height: 32px;
    border-radius: 50% !important;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ant-steps-item-custom .ant-steps-item-icon > .ant-steps-icon {
    line-height: 1;
  }

  /* Wait/disabled/error text overrides */
  .ant-steps-item-wait .ant-steps-item-title,
  .ant-steps-item-wait .ant-steps-item-subtitle,
  .ant-steps-item-wait .ant-steps-item-description,
  .ant-steps-item-disabled .ant-steps-item-title,
  .ant-steps-item-disabled .ant-steps-item-subtitle,
  .ant-steps-item-disabled .ant-steps-item-description {
    color: ${(props) => props.$style.stepDisabledColor} !important;
  }

  .ant-steps-item-error .ant-steps-item-title,
  .ant-steps-item-error .ant-steps-item-subtitle,
  .ant-steps-item-error .ant-steps-item-description {
    color: ${(props) => props.$style.stepErrorColor} !important;
  }

  /* Progress circle */
  .ant-steps-progress-icon .ant-progress-circle-trail {
    stroke: ${(props) => props.$style.stepIconBackground} !important;
  }

  .ant-steps-progress-icon .ant-progress-circle-path {
    stroke: ${(props) => props.$style.stepActiveColor} !important;
  }

  /* Navigation variant */
  .ant-steps-navigation .ant-steps-item::before {
    background-color: ${(props) => props.$style.stepActiveColor} !important;
  }

  .ant-steps-navigation .ant-steps-item::after {
    border-color: ${(props) => props.$style.stepLineColor} !important;
  }
`;

const StepsChildrenMap = {
  autoHeight: AutoHeightControl,
  initialValue: numberExposingStateControl("1"),
  value: stringExposingStateControl("value"),
  stepStatus: stringExposingStateControl("process"),
  stepPercent: numberExposingStateControl("60"),
  size: dropdownControl(sizeOptions, "default"),
  displayType: dropdownControl(typeOptions, "default"),
  direction: dropdownControl(directionOptions, "horizontal"),
  showDots: BoolControl,
  showIcons: BoolControl,
  selectable: BoolControl,
  responsive: withDefault(BoolControl, true),
  labelPlacement: dropdownControl(directionOptions, "horizontal"),
  disabled: BoolCodeControl,
  onEvent: ChangeEventHandlerControl,
  options: StepOptionControl,
  style: styleControl(StepsStyle, "style"),
  viewRef: RefControl<HTMLDivElement>,
  animationStyle: styleControl(AnimationStyle, "animationStyle"),
  showScrollBars: withDefault(BoolControl, false),
  minHorizontalWidth: withDefault(RadiusControl, "180px"),
};

let StepControlBasicComp = (function () {
  return new UICompBuilder(StepsChildrenMap, (props) => {
    const initialValue = Math.max(
      1,
      Math.floor(getFiniteNumber(props.initialValue.value, 1)),
    );
    const visibleOptions = props.options.filter((option) => !option.hidden);
    const current = getCurrentStepIndex(
      props.value.value,
      initialValue,
      visibleOptions,
    );
    const percent = Math.min(
      100,
      Math.max(0, getFiniteNumber(props.stepPercent.value, 0)),
    );
    const displayType = props.displayType as StepsType;
    const currentStatus = getStepStatus(props.stepStatus.value) ?? "process";
    const progressDot = displayType !== "inline" && props.showDots;
    const showPercent =
      displayType === "default" &&
      currentStatus === "process" &&
      !progressDot &&
      !props.showIcons;

    const onChange = (index: number) => {
      const selectedOption = visibleOptions[index];
      if (!selectedOption || selectedOption.disabled) {
        return;
      }
      const selectedValue = Number.isFinite(Number(selectedOption.value))
        ? selectedOption.value
        : index + initialValue;

      props.value.onChange(String(selectedValue));
      props.onEvent("change");
    };

    const items: StepProps[] = visibleOptions.map((option) => ({
      title: option.label,
      subTitle:
        displayType === "inline" ? undefined : option.subTitle || undefined,
      description: option.description || undefined,
      disabled: props.disabled || option.disabled,
      status: getStepStatus(option.status),
      icon:
        displayType !== "inline" && props.showIcons && hasIcon(option.icon)
          ? option.icon
          : undefined,
      style: props.minHorizontalWidth
        ? { minWidth: props.minHorizontalWidth }
        : undefined,
    }));
    return (
      <StyledWrapper
        ref={props.viewRef}
        $style={props.style}
        $animationStyle={props.animationStyle}
        $autoHeight={props.autoHeight}
        $disabled={props.disabled}
        aria-disabled={props.disabled}
      >
        <ScrollBar
          style={{
            height: props.autoHeight ? "auto" : "100%",
            width: "100%",
            minWidth: props.minHorizontalWidth,
            margin: "0px",
            padding: "0px",
          }}
          overflow="scroll"
          hideScrollbar={!props.showScrollBars}
        >
          <Steps
            initial={initialValue - 1}
            current={current}
            onChange={props.selectable && !props.disabled ? onChange : undefined}
            percent={showPercent ? percent : undefined}
            status={currentStatus}
            type={displayType}
            size={props.size}
            labelPlacement={props.labelPlacement}
            progressDot={progressDot}
            direction={props.direction}
            responsive={props.responsive}
            items={items}
          />
        </ScrollBar>
      </StyledWrapper>
    );
  })
    .setPropertyViewFn((children) => {
      const editorModeStatus = useEditorStore((state) => state.editorModeStatus);
      return (
      <>
        <Section name={sectionNames.basic}>
          {children.options.propertyView({})}
          {children.initialValue.propertyView({
            label: trans("step.initialValue"),
            tooltip: trans("step.initialValueTooltip"),
          })}
        </Section>

        {["logic", "both"].includes(editorModeStatus) && (
          <>
            <Section name={sectionNames.interaction}>
              {children.onEvent.getPropertyView()}
              {disabledPropertyView(children)}
              {hiddenPropertyView(children)}
              {children.stepStatus.propertyView({
                label: trans("step.status"),
              })}
              {children.displayType.getView() == "default" &&
                children.stepStatus.getView().value == "process" &&
                !children.showDots.getView() &&
                !children.showIcons.getView() &&
                children.stepPercent.propertyView({
                  label: trans("step.percent"),
                })}
              {children.selectable.propertyView({
                label: trans("step.selectable"),
              })}
            </Section>
          </>
        )}

        {["layout", "both"].includes(editorModeStatus) && (
          <Section name={sectionNames.layout}>
            {children.autoHeight.getPropertyView()}
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
            {children.responsive.propertyView({
              label: trans("step.responsive"),
            })}
            {children.direction.getView() == "horizontal" &&
              children.labelPlacement.propertyView({
                label: trans("step.labelPlacement"),
                radioButton: true,
              })}
            {children.direction.getView() == "horizontal" &&
              children.minHorizontalWidth.propertyView({
                label: trans("prop.minHorizontalWidth"),
                placeholder: "100px",
              })}
            {!children.autoHeight.getView() &&
              children.showScrollBars.propertyView({
                label: trans("prop.scrollbar"),
              })}
            {children.displayType.getView() != "inline" &&
              !children.showIcons.getView() &&
              children.showDots.propertyView({ label: trans("step.showDots") })}
            {children.displayType.getView() != "inline" &&
              !children.showDots.getView() &&
              children.showIcons.propertyView({
                label: trans("step.showIcons"),
              })}
          </Section>
        )}

        {["layout", "both"].includes(editorModeStatus) && (
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
    );
    })
    .setExposeMethodConfigs(selectDivRefMethods)
    .build();
})();

StepControlBasicComp = class extends StepControlBasicComp {
  override autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }
};

export const StepComp = withExposingConfigs(StepControlBasicComp, [
  new NameConfig("value", trans("step.valueDesc")),
  new NameConfig("stepStatus", trans("step.status")),
  new NameConfig("stepPercent", trans("step.percent")),
  ...CommonNameConfig,
]);
