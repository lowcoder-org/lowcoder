import { default as Progress } from "antd/es/progress";
import { Section, sectionNames } from "lowcoder-design";
import { numberExposingStateControl } from "../controls/codeStateControl";
import { BoolControl } from "../controls/boolControl";
import { UICompBuilder } from "../generators";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "../generators/withExposing";
import { styleControl } from "comps/controls/styleControl";
import { AnimationStyle, AnimationStyleType, ProgressStyle, ProgressStyleType, heightCalculator, widthCalculator } from "comps/controls/styleControlConstants";
import styled, { css } from "styled-components";
import { hiddenPropertyView, showDataLoadingIndicatorsPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";

import { useContext } from "react";
import { EditorContext } from "comps/editorState";

const getStyle = (style: ProgressStyleType) => {
  return css`
    line-height: 2;
    .ant-progress-text {
      color: ${style.text};
      font-style:${style.fontStyle};
        font-family:${style.fontFamily};
        font-weight:${style.textWeight};
        font-size:${style.textSize};
    }
    width: ${widthCalculator(style.margin)};	
    height: ${heightCalculator(style.margin)};	
    margin: ${style.margin};	
    padding: ${style.padding};
    .ant-progress-inner {
      background-color: ${style.track};
      .ant-progress-bg {
        background-color: ${style.fill};
      }
    }
    &.ant-progress-status-success {
      .ant-progress-bg {
        background-color: ${style.success};
      }
      .ant-progress-text {
        color: ${style.success};
      }
    }
  `;
};

export const ProgressStyled = styled(Progress)<{ $style: ProgressStyleType,$animationStyle?: AnimationStyleType}>`
  ${(props) => props.$style && getStyle(props.$style)}
  ${props=>props.$animationStyle}
`;

const ProgressBasicComp = (function () {
  const childrenMap = {
    value: numberExposingStateControl('value', 60),
    showInfo: BoolControl,
    style: styleControl(ProgressStyle, 'style'),
    animationStyle: styleControl(AnimationStyle, 'animationStyle'),
  };
  return new UICompBuilder(childrenMap, (props) => {
    return (
      <ProgressStyled
        percent={Math.round(props.value.value)}
        showInfo={props.showInfo}
        $style={props.style}
        $animationStyle={props.animationStyle}
      />
    );
  })
    .setPropertyViewFn((children) => {
      return (
        <>
          <Section name={sectionNames.basic}>
            {children.value.propertyView({
              label: trans("progress.value"),
              tooltip: trans("progress.valueTooltip"),
            })}
          </Section>

          {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
            <Section name={sectionNames.interaction}>
              {hiddenPropertyView(children)}
              {children.showInfo.propertyView({
                label: trans("progress.showInfo"),
              })}
              {showDataLoadingIndicatorsPropertyView(children)}
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
      );
    })
    .build();
})();

export const ProgressComp = withExposingConfigs(ProgressBasicComp, [
  new NameConfig("value", trans("progress.valueDesc")),
  new NameConfig("showInfo", trans("progress.showInfoDesc")),
  NameConfigHidden,
]);
