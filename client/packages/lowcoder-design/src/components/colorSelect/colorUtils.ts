import { colord, extend } from "colord";
import namesPlugin from "colord/plugins/names";
import { generate } from "@ant-design/colors/es";

extend([namesPlugin]);

export const gradientColors = [
  "linear-gradient(90deg, #1CB5E0 0%, #000851 100%)",
  "linear-gradient(90deg, #00C9FF 0%, #92FE9D 100%)",
  "linear-gradient(90deg, #FC466B 0%, #3F5EFB 100%)",
  "linear-gradient(90deg, #3F2B96 0%, #A8C0FF 100%)",
  "linear-gradient(90deg, #FDBB2D 0%, #22C1C3 100%)",
  "linear-gradient(90deg, #FDBB2D 0%, #3A1C71 100%)",
  "linear-gradient(90deg, #e3ffe7 0%, #d9e7ff 100%)",
  "linear-gradient(90deg, #4b6cb7 0%, #182848 100%)",
  "linear-gradient(90deg, #9ebd13 0%, #008552 100%)",
  "linear-gradient(90deg, #0700b8 0%, #00ff88 100%)",
  "linear-gradient(90deg, #d53369 0%, #daae51 100%)",
  "linear-gradient(90deg, #efd5ff 0%, #515ada 100%)",
  "linear-gradient(90deg, #00d2ff 0%, #3a47d5 100%)",
  "linear-gradient(90deg, #f8ff00 0%, #3ad59f 100%)",
  "linear-gradient(90deg, #fcff9e 0%, #c67700 100%)",
];

// Color Palette
export const constantColors = [
  "#6D83F2",
  "#5589F2",
  "#36B389",
  "#E68E50",
  "#E67373",
  "#F5FFF7",
  "#F3FAFF",
  "#FFF6E6",
  "#F5F5F6",
  "#FFFFFF",
];

export const chartColorPalette = [
  "#4C64D9",
  "#30A1F2",
  "#fac858",
  "#ee6666",
  "#3ba272",
  "#fc8452",
  "#9a60b4",
  "#ea7ccc",
  "#91cc75",
];

const toRGBA = (color: string) => {
  return colord(color).toRgbString();
};
const toHex = (color: string) => {
  return colord(color).toHex().toUpperCase();
};
const alphaOfRgba = (rgba: string) => {
  return colord(rgba).alpha().toString();
};

const isValidGradient = (color?: string) => {
  if (!color) return false;

  const linearGradientRegex = /^linear-gradient\((\d+deg|to\s+(top|right|bottom|left)(\s+(top|right|bottom|left))?)\s*,\s*((#[0-9a-fA-F]{3,6}|rgba?\(\d+,\s*\d+,\s*\d+(,\s*\d+(\.\d+)?)?\)|[a-zA-Z]+)(\s+\d+%?)?,?\s*)+\)$/i;
  const radialGradientRegex = /^radial-gradient\(\s*(circle|ellipse)?\s*,\s*((#[0-9a-fA-F]{3,6}|rgba?\(\d+,\s*\d+,\s*\d+(,\s*\d+(\.\d+)?)?\)|[a-zA-Z]+)(\s+\d+%?)?,?\s*)+\)$/i;
  
  return linearGradientRegex.test(color) || radialGradientRegex.test(color);
}

const isValidColor = (str?: string) => {
  if (!str) return false;
  return colord(str).isValid();
};

export const isDarkColor = (colorStr: string) => {
  return brightnessCompare(colorStr, 0.75);
};

// judge color is bright
const brightnessCompare = (colorStr: string, intensity: number) => {
  const color = colord(colorStr);
  return color.brightness() < intensity;
};

/**
 * generate active color.
 * @remarks
 * get the 7th color according to the antd design
 * @see {@link https://ant-design.antgroup.com/docs/spec/colors}
 */
export const genActiveColor = (color: string) => {
  return (generate(color)[6] || darkenColor(color, 0.1)).toUpperCase();
};

/**
 * generate hover color
 * @remark
 * get the 5th color according to the antd desgin
 * @see {@link https://ant-design.antgroup.com/docs/spec/colors}
 */
export const genHoverColor = (color: string) => {
  return (generate(color)[4] || lightenColor(color, 0.1)).toUpperCase();
};

// make color lighter
export const lightenColor = (colorStr: string, intensity: number) => {
  const color = colord(colorStr);
  return color.lighten(intensity).toHex().toUpperCase();
};

export const fadeColor = (colorStr: string, alpha: number) => {
  const color = colord(colorStr);
  return color.alpha(alpha).toHex().toUpperCase();
};

// make color darker
export const darkenColor = (colorStr: string, intensity: number) => {
  const color = colord(colorStr);
  return color.darken(intensity).toHex().toUpperCase();
};

export { toRGBA, toHex, alphaOfRgba, isValidColor, isValidGradient };
