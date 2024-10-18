import { isValidColor, isValidGradient } from "components/colorSelect/colorUtils"
import { css } from "styled-components";

const getBackgroundStyle = (style: Record<string, string | undefined>) => {
  return css`
    ${isValidColor(style.background) && `background-color: ${style.background}`};
    ${isValidGradient(style.background) && !Boolean(style.backgroundImage) && `background-image: ${style.background}`};
    ${!isValidGradient(style.background) && Boolean(style.backgroundImage) && `background-image: ${style.backgroundImage}`};
    ${isValidGradient(style.background) && Boolean(style.backgroundImage) && `background-image: url(${style.backgroundImage}), ${style.background}`};

    ${style.backgroundImageRepeat && `background-repeat: ${style.backgroundImageRepeat};`}; 
    ${style.backgroundImageSize && `background-size: ${style.backgroundImageSize};`}; 
    ${style.backgroundImageOrigin && `background-origin: ${style.backgroundImageOrigin};`}; 
    ${style.backgroundImagePosition && `background-position: ${style.backgroundImagePosition};`};
  `;
}

export {
  getBackgroundStyle,
}