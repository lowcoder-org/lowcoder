import { default as Button } from "antd/es/button";
import { styleControl } from "comps/controls/styleControl";
import { ButtonStyleType, ButtonStyle } from "comps/controls/styleControlConstants";
import { migrateOldData } from "comps/generators/simpleGenerators";
import styled, { css } from "styled-components";
import { genActiveColor, genHoverColor } from "lowcoder-design";
import { refMethods } from "comps/generators/withMethodExposing";
import { blurMethod, clickMethod, focusWithOptions } from "comps/utils/methodUtils";

export function getButtonStyle(buttonStyle: ButtonStyleType) {
  const hoverColor = genHoverColor(buttonStyle.background);
  const activeColor = genActiveColor(buttonStyle.background);
  return css`
    &&& {
      border-radius: ${buttonStyle.radius};
      border-width:${buttonStyle.borderWidth};
      margin: ${buttonStyle.margin};
      padding: ${buttonStyle.padding};
      rotate: ${buttonStyle.rotation&&buttonStyle.rotation};
      &:not(:disabled) {
        --antd-wave-shadow-color: ${buttonStyle.border};
        border-color: ${buttonStyle.border};
        color: ${buttonStyle.text};
        font-size: ${buttonStyle.textSize};
        font-weight: ${buttonStyle.textWeight};
        font-family: ${buttonStyle.fontFamily};
        font-style: ${buttonStyle.fontStyle};
        text-transform:${buttonStyle.textTransform};
        text-decoration:${buttonStyle.textDecoration};
        background-color: ${buttonStyle.background};
        border-radius: ${buttonStyle.radius};
        margin: ${buttonStyle.margin};
        padding: ${buttonStyle.padding};

        &:hover,
        &:focus {
          color: ${buttonStyle.text};
          background-color: ${hoverColor};
          border-color: ${buttonStyle.border === buttonStyle.background
            ? hoverColor
            : buttonStyle.border} !important;
        }
        &:active {
          color: ${buttonStyle.text};
          background-color: ${activeColor};
          border-color: ${buttonStyle.border === buttonStyle.background
            ? activeColor
            : buttonStyle.border} !important;
        }
      }
    }
  `;
}

export const Button100 = styled(Button)<{ $buttonStyle?: ButtonStyleType }>`
  ${(props) => props.$buttonStyle && getButtonStyle(props.$buttonStyle)}
  width: 100%;
  height: auto;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  gap: 6px; 
  span {
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

export const ButtonCompWrapper = styled.div<{ disabled: boolean }>`
  // The button component is disabled but can respond to drag & select events
  ${(props) =>
    props.disabled &&
    `
    cursor: not-allowed;
    button:disabled {
      pointer-events: none;
    }
  `};
`;

/**
 * Compatible with old data 2022-08-05
 */
function fixOldData(oldData: any) {
  if (
    oldData &&
    (oldData.hasOwnProperty("backgroundColor") ||
      oldData.hasOwnProperty("borderColor") ||
      oldData.hasOwnProperty("color"))
  ) {
    return {
      background: oldData.backgroundColor,
      border: oldData.borderColor,
      text: oldData.color,
    };
  }
  return oldData;
}
const ButtonTmpStyleControl = styleControl(ButtonStyle);
export const ButtonStyleControl = migrateOldData(ButtonTmpStyleControl, fixOldData);

export const buttonRefMethods = refMethods<HTMLElement>([
  focusWithOptions,
  blurMethod,
  clickMethod,
]);
