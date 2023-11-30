import { Progress } from "antd";
import { styleControl } from "comps/controls/styleControl";
import { ProgressStyle, ProgressStyleType, heightCalculator, widthCalculator } from "comps/controls/styleControlConstants";
import styled, { css } from "styled-components";
import { Section, sectionNames } from "lowcoder-design";
import { numberExposingStateControl } from "../controls/codeStateControl";
import { UICompBuilder } from "../generators";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "../generators/withExposing";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";

import { useContext } from "react";
import { EditorContext } from "comps/editorState";

// TODO: after Update of ANTd, introduce Size attribute to ProgressCircle

const getStyle = (style: ProgressStyleType) => {
  return css`
    width: ${widthCalculator(style.margin)};	
    height: ${heightCalculator(style.margin)};	
    margin: ${style.margin};	
    padding: ${style.padding};
    .ant-progress-text {
      color: ${style.text};
    }
    .ant-progress-circle-trail {
      stroke: ${style.track};
    }
    .ant-progress-inner .ant-progress-circle-path {
      stroke: ${style.fill};
    }
    &.ant-progress-status-success {
      .ant-progress-inner .ant-progress-circle-path {
        stroke: ${style.success};
      }
      .ant-progress-text {
        color: ${style.success};
      }
    }
  `;
};

export const StyledProgressCircle = styled(Progress)<{ $style: ProgressStyleType }>`
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
    style: styleControl(ProgressStyle),
  };
  return new UICompBuilder(childrenMap, (props) => {
    return (
      <StyledProgressCircle
        $style={props.style}
        percent={Math.round(props.value.value)}
        type="circle"
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
            </Section>
          )}

          {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
            <Section name={sectionNames.style}>
              {children.style.getPropertyView()}
            </Section>
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
  NameConfigHidden,
]);
