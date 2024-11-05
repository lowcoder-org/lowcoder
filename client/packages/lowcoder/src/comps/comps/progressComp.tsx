import { default as Progress } from "antd/es/progress";
import { numberExposingStateControl } from "../controls/codeStateControl";
import { BoolControl } from "../controls/boolControl";
import { UICompBuilder } from "../generators";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "../generators/withExposing";
import { styleControl } from "comps/controls/styleControl";
import { AnimationStyle, AnimationStyleType, ProgressStyle, ProgressStyleType, heightCalculator, widthCalculator } from "comps/controls/styleControlConstants";
import styled, { css } from "styled-components";
import { trans } from "i18n";
import React from "react";
import {viewMode} from "@lowcoder-ee/util/editor";
const PropertyView =  React.lazy( async () => await import("@lowcoder-ee/comps/comps/propertyView/progressComp"));

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
  let builder = new UICompBuilder(childrenMap, (props) => {
    return (
      <ProgressStyled
        percent={Math.round(props.value.value)}
        showInfo={props.showInfo}
        $style={props.style}
        $animationStyle={props.animationStyle}
      />
    );
  })
  if (viewMode() === "admin") {
    builder.setPropertyViewFn((children) => <PropertyView {...children}></PropertyView>);
  }
      return builder
    .build();
})();

export const ProgressComp = withExposingConfigs(ProgressBasicComp, [
  new NameConfig("value", trans("progress.valueDesc")),
  new NameConfig("showInfo", trans("progress.showInfoDesc")),
  NameConfigHidden,
]);
