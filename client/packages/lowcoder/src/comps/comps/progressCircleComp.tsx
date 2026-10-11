import { default as Progress } from "antd/es/progress";
import { styleControl } from "comps/controls/styleControl";
import { AnimationStyle, AnimationStyleType, CircleProgressStyle, CircleProgressType, heightCalculator, widthCalculator } from "comps/controls/styleControlConstants";
import styled, { css } from "styled-components";
import { Section, sectionNames } from "lowcoder-design";
import { numberExposingStateControl, stringExposingStateControl } from "../controls/codeStateControl";
import { UICompBuilder } from "../generators";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "../generators/withExposing";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { BoolControl } from "../controls/boolControl";
import { dropdownControl } from "../controls/dropdownControl";
import { NumberControl } from "../controls/codeControl";
import { useEditorStore } from "comps/editorStore";
import { 
  ProgressTypeOptions, 
  StrokeLinecapOptions, 
  GapPositionOptions 
} from "./progressCircleConstants";

const getStyle = (style: CircleProgressType) => {
  return css`
    width: ${widthCalculator(style.margin)};	
    height: ${heightCalculator(style.margin)};	
    margin: ${style.margin};	
    padding: ${style.padding};
    border-radius: ${style.radius};
    .ant-progress-text {
      color: ${style.text} !important;
      font-family: ${style.fontFamily};
      font-style: ${style.fontStyle};
      font-size: ${style.textSize} !important;
      font-weight: ${style.textWeight};
    }
    .ant-progress-circle-trail {
      stroke: ${style.track};
    }
    .ant-progress-inner .ant-progress-circle-path {
      stroke: ${style.fill} !important;
    }
    &.ant-progress-status-success {
      .ant-progress-inner .ant-progress-circle-path {
        stroke: ${style.success} !important;
      }
      .ant-progress-text {
        color: ${style.success} !important;
      }
    }
  `;
};

export const StyledProgressCircle = styled(Progress)<{
  $style: CircleProgressType;
  $animationStyle?: AnimationStyleType;
}>`
  ${(props) => props.$animationStyle}
  width: 100%;
  height: 100%;
  padding: 2px;
  .ant-progress-inner {
    width: 100% !important;
    height: 100% !important;
  }

  .ant-progress-circle {
    width: 100%;
    height: 100%;
  }
  ${(props) => props.$style && getStyle(props.$style)}
`;

let ProgressCircleTmpComp = (function () {
  const childrenMap = {
    value: numberExposingStateControl("value", 60),
    progressType: dropdownControl(ProgressTypeOptions, "circle"),
    showInfo: BoolControl.DEFAULT_TRUE,
    strokeWidth: NumberControl,
    strokeLinecap: dropdownControl(StrokeLinecapOptions, "round"),
    gapDegree: NumberControl,
    gapPosition: dropdownControl(GapPositionOptions, "bottom"),
    customFormat: stringExposingStateControl("customFormat", ""),
    // Steps configuration for segmented progress
    stepsEnabled: BoolControl,
    stepsCount: NumberControl,
    stepsGap: NumberControl,
    // Style controls
    style: styleControl(CircleProgressStyle, 'style'),
    animationStyle: styleControl(AnimationStyle, 'animationStyle'),
  };

  return new UICompBuilder(childrenMap, (props) => {
    const percent = Math.round(props.value.value);
    const customFormatValue = props.customFormat.value?.trim();
    
    // Simple format function - just returns the custom text if provided
    const formatFunction = customFormatValue ? () => customFormatValue : undefined;

    // Build steps configuration if enabled
    const stepsConfig = props.stepsEnabled && props.stepsCount > 0
      ? { count: props.stepsCount, gap: props.stepsGap || 2 }
      : undefined;

    return (
      <StyledProgressCircle
        $style={props.style}
        $animationStyle={props.animationStyle}
        percent={percent}
        type={props.progressType}
        showInfo={props.showInfo}
        strokeWidth={props.strokeWidth || 6}
        strokeLinecap={props.strokeLinecap}
        gapDegree={props.progressType === "dashboard" ? (props.gapDegree || 75) : undefined}
        gapPosition={props.progressType === "dashboard" ? props.gapPosition : undefined}
        format={formatFunction}
        steps={stepsConfig}
      />
    );
  })
    .setPropertyViewFn((children) => {
      const editorModeStatus = useEditorStore((state) => state.editorModeStatus);
      const progressType = children.progressType.getView();
      const stepsEnabled = children.stepsEnabled.getView();
      
      return (
        <>
          <Section name={sectionNames.basic}>
            {children.value.propertyView({
              label: trans("progress.value"),
              tooltip: trans("progress.valueTooltip"),
            })}
            {children.progressType.propertyView({
              label: trans("progressCircle.progressType"),
              tooltip: trans("progressCircle.progressTypeTooltip"),
            })}
          </Section>

          <Section name={trans("progressCircle.appearance")}>
            {children.showInfo.propertyView({
              label: trans("progress.showInfo"),
            })}
            {children.customFormat.propertyView({
              label: trans("progressCircle.customFormat"),
              tooltip: trans("progressCircle.customFormatTooltip"),
            })}
            {children.strokeWidth.propertyView({
              label: trans("progressCircle.strokeWidth"),
              tooltip: trans("progressCircle.strokeWidthTooltip"),
              placeholder: "6",
            })}
            {children.strokeLinecap.propertyView({
              label: trans("progressCircle.strokeLinecap"),
              tooltip: trans("progressCircle.strokeLinecapTooltip"),
            })}
          </Section>

          <Section name={trans("progressCircle.segments")}>
            {children.stepsEnabled.propertyView({
              label: trans("progressCircle.stepsEnabled"),
              tooltip: trans("progressCircle.stepsEnabledTooltip"),
            })}
            {stepsEnabled && children.stepsCount.propertyView({
              label: trans("progressCircle.stepsCount"),
              tooltip: trans("progressCircle.stepsCountTooltip"),
              placeholder: "5",
            })}
            {stepsEnabled && children.stepsGap.propertyView({
              label: trans("progressCircle.stepsGap"),
              tooltip: trans("progressCircle.stepsGapTooltip"),
              placeholder: "2",
            })}
          </Section>

          {progressType === "dashboard" && (
            <Section name={trans("progressCircle.dashboardSettings")}>
              {children.gapDegree.propertyView({
                label: trans("progressCircle.gapDegree"),
                tooltip: trans("progressCircle.gapDegreeTooltip"),
                placeholder: "75",
              })}
              {children.gapPosition.propertyView({
                label: trans("progressCircle.gapPosition"),
                tooltip: trans("progressCircle.gapPositionTooltip"),
              })}
            </Section>
          )}

          {["logic", "both"].includes(editorModeStatus) && (
            <Section name={sectionNames.interaction}>
              {hiddenPropertyView(children)}
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
    .build();
})();

ProgressCircleTmpComp = class extends ProgressCircleTmpComp {
  override autoHeight(): boolean {
    return false;
  }
};

export const ProgressCircleComp = withExposingConfigs(ProgressCircleTmpComp, [
  new NameConfig("value", trans("progress.valueDesc")),
  new NameConfig("customFormat", trans("progressCircle.customFormatDesc")),
  NameConfigHidden,
]);
