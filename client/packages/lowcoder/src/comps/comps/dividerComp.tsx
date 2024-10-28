import { default as Divider, DividerProps } from "antd/es/divider";
import { StringControl } from "comps/controls/codeControl";
import { BoolControl } from "comps/controls/boolControl";
import { alignControl } from "comps/controls/alignControl";
import { UICompBuilder, withDefault } from "comps/generators";
import { NameConfig, NameConfigHidden } from "comps/generators/withExposing";
import styled from "styled-components";
import { styleControl } from "comps/controls/styleControl";
import { AnimationStyle, AnimationStyleType, DividerStyle, DividerStyleType, heightCalculator, widthCalculator } from "comps/controls/styleControlConstants";
import { migrateOldData } from "comps/generators/simpleGenerators";
import { trans } from "i18n";
import { AutoHeightControl } from "comps/controls/autoHeightControl";
import React from "react";
import {viewMode} from "@lowcoder-ee/util/editor";
const SetPropertyViewFn =  React.lazy( async () => await import("./setProperty/dividerComp"));
type IProps = DividerProps & {
    $style: DividerStyleType;
    $animationStyle:AnimationStyleType;
    type?: 'vertical' | 'horizontal';
};

const StyledDivider = styled(Divider)<IProps>`
 
  margin-top: 3.5px;
  rotate: ${(props) => props.type === 'vertical' ? '0deg' : props.$style.rotation};
  .ant-divider-inner-text {
    height: 32px;
    display: flex;
    align-items: center;
    font-size: ${(props) => props.$style.textSize};
    font-weight: ${(props) => props.$style.textWeight};
    font-family: ${(props) => props.$style.fontFamily};
    text-transform: ${(props) => props.$style.textTransform};
    ${(props) => props.$style.textDecoration !== undefined ? `text-decoration: ${props.$style.textDecoration};` : ''}
    font-style: ${(props) => props.$style.fontStyle};
  }

  ${(props) => props.$animationStyle}
  min-width: 1px;
  width: ${(props) => widthCalculator(props.$style.margin)};
  min-height: ${(props) => heightCalculator(props.$style.margin)};
  margin: ${(props) => props.$style.margin};
  padding: ${(props) => props.$style.padding};
  border-radius: ${(props) => props.$style.radius};
  border-top: ${(props) => props.$style.borderWidth && props.$style.borderWidth !== "0px" ? props.$style.borderWidth : "1px"} 
              ${(props) => props.$style.borderStyle} 
              ${(props) => props.$style.border};

  .ant-divider-inner-text::before,
  .ant-divider-inner-text::after {
    border-block-start: ${(props) => props.$style.borderWidth && props.$style.borderWidth !== "0px" ? props.$style.borderWidth : "1px"} 
                      ${(props) => props.$style.border} !important;
    border-block-start-color: inherit;
    border-block-end: 0;
    border-block-start-radius: inherit;
  }

  &.ant-divider-horizontal.ant-divider-with-text {
    margin: 0;
    border-top-color: ${(props) => props.$style.color};
    color: ${(props) => props.$style.text};
  }

  &.ant-divider-horizontal.ant-divider-with-text::before,
  &.ant-divider-horizontal.ant-divider-with-text::after {
    border-top-color: ${(props) => props.$style.color};
    border-radius: ${(props) => props.$style.radius};
    border-top: ${(props) => props.$style.borderWidth && props.$style.borderWidth !== "0px" ? props.$style.borderWidth : "1px"} 
               ${(props) => props.$style.borderStyle} 
               ${(props) => props.$style.border};
  }
  &.ant-divider-vertical {
    height:  ${(props) =>  props.type === 'vertical' && '200px'}; 
    border-left: ${(props) => props.$style.borderWidth && props.$style.borderWidth !== "0px" ? props.$style.borderWidth : "1px"} 
                ${(props) => props.$style.borderStyle} 
                ${(props) => props.$style.border};
    border-top: none;
  }
`;

const childrenMap = {
    title: StringControl,
    align: alignControl(),
    type: BoolControl,
    autoHeight: withDefault(AutoHeightControl, "auto"),
    style: styleControl(DividerStyle , 'style'),
    animationStyle: styleControl(AnimationStyle ,'animationStyle'),
};

function fixOldStyleData(oldData: any) {
    if (oldData && oldData.hasOwnProperty("color")) {
        return {
            ...oldData,
            style: {
                color: oldData.color,
                text: "",
            },
        };
    }
    return oldData;
}



// Compatible with historical style data 2022-8-26
const DividerTempComp = migrateOldData(
    new UICompBuilder(childrenMap, (props) => {
        const dividerType = props.type ? 'vertical' : 'horizontal';

        return (
            <StyledDivider
                orientation={props.align}
                type={dividerType}
                $style={props.style}
                $animationStyle={props.animationStyle}
            >
                {dividerType === 'horizontal' && props.title}
            </StyledDivider>
        );
    })
        .setPropertyViewFn((children) => {
            return (
                 viewMode() === "edit" ? <SetPropertyViewFn {...children}></SetPropertyViewFn> : <></>
        );
        })
        .setExposeStateConfigs([
            new NameConfig("title", trans("divider.titleDesc")),
            new NameConfig("align", trans("divider.alignDesc")),
            NameConfigHidden,
        ])
        .build(),
    fixOldStyleData
);

export const DividerComp = class extends DividerTempComp {
    override autoHeight(): boolean {
        return this.children.autoHeight.getView();
    }
};
