import { styleControl } from "@lowcoder-ee/comps/controls/styleControl";
import { ButtonStyle } from "@lowcoder-ee/comps/controls/styleControlConstants";
import { migrateOldData } from "@lowcoder-ee/comps/generators/simpleGenerators";
import { refMethods } from "@lowcoder-ee/comps/generators/withMethodExposing";
import { blurMethod, clickMethod, focusWithOptions } from "@lowcoder-ee/comps/utils/methodUtils";
import { default as Button } from "antd/es/button";
import { genActiveColor, genHoverColor } from "components/colorSelect/colorUtils";
import styled, { css } from "styled-components";
// import { genActiveColor, genHoverColor } from "lowcoder-design";

export function getButtonStyle(buttonStyle: any) {
  const hoverColor = buttonStyle.background && genHoverColor(buttonStyle.background);
  const activeColor = buttonStyle.background && genActiveColor(buttonStyle.background);
  return css`
    &&& {
      border-radius: ${buttonStyle.radius};
      margin: ${buttonStyle.margin};
      padding: ${buttonStyle.padding};
      &:not(:disabled) {
        // click animation color
        --antd-wave-shadow-color: ${buttonStyle.border};
        border-color: ${buttonStyle.border};
        color: ${buttonStyle.text};
        background: ${buttonStyle.background};
        border-radius: ${buttonStyle.radius};
        margin: ${buttonStyle.margin};
        padding: ${buttonStyle.padding};

        &:hover,
        &:focus {
          color: ${buttonStyle.text};
          background-color: ${hoverColor};
          border-color: ${buttonStyle.border === buttonStyle.background
            ? hoverColor
            : buttonStyle.border};
        }

        &:active {
          color: ${buttonStyle.text};
          background-color: ${activeColor};
          border-color: ${buttonStyle.border === buttonStyle.background
            ? activeColor
            : buttonStyle.border};
        }
      }
    }
  `;
}

export const Button100 = styled(Button)<{ $buttonStyle?: any }>`
  ${(props) => props.$buttonStyle && getButtonStyle(props.$buttonStyle)}
  width: 100%;
  height: auto;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  span {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  gap: 6px;
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
export const ButtonStyleControl = migrateOldData(
  ButtonTmpStyleControl,
  fixOldData
);

export const buttonRefMethods = refMethods([
  focusWithOptions,
  blurMethod,
  clickMethod,
]);
