import { default as Tooltip } from "antd/es/tooltip";
import { getThemeDetailName, isThemeColorKey, ThemeDetail } from "api/commonSettingApi";
import { ControlItemCompBuilder } from "comps/generators/controlCompBuilder";
import { childrenToProps, ToConstructor } from "comps/generators/multi";
import { BackgroundColorContext } from "comps/utils/backgroundColorContext";
import { ThemeContext } from "comps/utils/themeContext";
import { trans } from "i18n";
import _, { omit, values } from "lodash";
import {
  controlItem,
  IconReset,
  ExpandIcon,
  CompressIcon,
  TextSizeIcon,
  TextTransformationIcon,
  FontFamilyIcon,
  TextWeightIcon,
  ShowBorderIcon,
  BorderWidthIcon,
  ImageCompIconSmall,
  RotationIcon,
  TextDecorationIcon,
  BorderStyleIcon,
  BorderRadiusIcon,
  TextStyleIcon,
  StarSmileIcon,
  TimerFlashIcon,
  Timer2Icon,
  RefreshLineIcon,
  ShadowIcon,
  OpacityIcon,
  LineHeightIcon
} from 'lowcoder-design';
import { useContext } from "react";
import styled from "styled-components";
import { useIsMobile } from "util/hooks";
import { CSSCodeControl, ObjectControl, RadiusControl, StringControl } from "./codeControl";
import { ColorControl } from "./colorControl";
import {
  DepColorConfig,
  DEP_TYPE,
  RadiusConfig,
  SimpleColorConfig,
  SingleColorConfig,
  MarginConfig,
  DirectionConfig,
  DetailSizeConfig,
  ChartOpacityConfig,
  ChartBoxShadowConfig,
  ChartBorderStyleConfig,
  ChartBorderRadiusConfig,
  ChartBorderWidthConfig,
  ChartTextSizeConfig,
  ChartTextWeightConfig,
  ChartFontFamilyConfig,
  ChartFontStyleConfig,
  PaddingConfig,
  TextSizeConfig,
  TextWeightConfig,
  FontFamilyConfig,
  FontStyleConfig,
  BorderWidthConfig,
  RotationConfig,
  BackgroundImageConfig,
  BackgroundImageRepeatConfig,
  BackgroundImageSizeConfig,
  BackgroundImagePositionConfig,
  BackgroundImageOriginConfig,
  HeaderBackgroundImageConfig,
  HeaderBackgroundImageRepeatConfig,
  HeaderBackgroundImageSizeConfig,
  HeaderBackgroundImagePositionConfig,
  HeaderBackgroundImageOriginConfig,
  FooterBackgroundImageConfig,
  FooterBackgroundImageRepeatConfig,
  FooterBackgroundImageSizeConfig,
  FooterBackgroundImagePositionConfig,
  FooterBackgroundImageOriginConfig,
  TextTransformConfig,
  TextDecorationConfig,
  borderStyleConfig,
  BoxShadowConfig,
  BoxShadowColorConfig,
  ChartBackgroundColorConfig,
  ChartGradientColorConfig,
  ChartShadowColorConfig,
  ChartBorderColorConfig,
  ChartTextColorConfig,
  AnimationIterationCountConfig,
  OpacityConfig,
  AnimationConfig,
  AnimationDelayConfig,
  AnimationDurationConfig,
  LineHeightConfig,


} from "./styleControlConstants";
import { faTextWidth } from "@fortawesome/free-solid-svg-icons";
import appSelectControl from "./appSelectControl";
import { JSONObject, JSONValue } from "@lowcoder-ee/util/jsonTypes";
import { CompTypeContext } from "../utils/compTypeContext";
import { defaultTheme } from "@lowcoder-ee/constants/themeConstants";
import { CompContext } from "../utils/compContext";
import { EditorContext } from "../editorState";
import { inputFieldComps } from "@lowcoder-ee/constants/compConstants";

function isSimpleColorConfig(config: SingleColorConfig): config is SimpleColorConfig {
  return config.hasOwnProperty("color");
}
function isLineHeightConfig(config: SingleColorConfig): config is LineHeightConfig {
  return config.hasOwnProperty("lineHeight");
}
function isTextSizeConfig(config: SingleColorConfig): config is TextSizeConfig {
  return config.hasOwnProperty("textSize");
}

function isDepColorConfig(config: SingleColorConfig): config is DepColorConfig {
  return config.hasOwnProperty("depName") || config.hasOwnProperty("depTheme");
}

function isRadiusConfig(config: SingleColorConfig): config is RadiusConfig {
  return config.hasOwnProperty("radius");
}

function isBorderWidthConfig(config: SingleColorConfig): config is BorderWidthConfig {
  return config.hasOwnProperty("borderWidth");
}

function isRotationConfig(config: SingleColorConfig): config is RotationConfig {
  return config.hasOwnProperty("rotation");
}

function isBackgroundImageConfig(config: SingleColorConfig): config is BackgroundImageConfig {
  return config.hasOwnProperty("backgroundImage");
}

function isBackgroundImageRepeatConfig(config: SingleColorConfig): config is BackgroundImageRepeatConfig {
  return config.hasOwnProperty("backgroundImageRepeat");
}

function isBackgroundImageSizeConfig(config: SingleColorConfig): config is BackgroundImageSizeConfig {
  return config.hasOwnProperty("backgroundImageSize");
}

function isBackgroundImagePositionConfig(config: SingleColorConfig): config is BackgroundImagePositionConfig {
  return config.hasOwnProperty("backgroundImagePosition");
}

function isBackgroundImageOriginConfig(config: SingleColorConfig): config is BackgroundImageOriginConfig {
  return config.hasOwnProperty("backgroundImageOrigin");
}

function isHeaderBackgroundImageConfig(config: SingleColorConfig): config is HeaderBackgroundImageConfig {
  return config.hasOwnProperty("headerBackgroundImage");
}
function isHeaderBackgroundImageRepeatConfig(config: SingleColorConfig): config is HeaderBackgroundImageRepeatConfig {
  return config.hasOwnProperty("headerBackgroundImageRepeat");
}
function isHeaderBackgroundImageSizeConfig(config: SingleColorConfig): config is HeaderBackgroundImageSizeConfig {
  return config.hasOwnProperty("headerBackgroundImageSize");
}
function isHeaderBackgroundImagePositionConfig(config: SingleColorConfig): config is HeaderBackgroundImagePositionConfig {
  return config.hasOwnProperty("headerBackgroundImagePosition");
}
function isHeaderBackgroundImageOriginConfig(config: SingleColorConfig): config is HeaderBackgroundImageOriginConfig {
  return config.hasOwnProperty("headerBackgroundImageOrigin");
}
function isFooterBackgroundImageConfig(config: SingleColorConfig): config is FooterBackgroundImageConfig {
  return config.hasOwnProperty("footerBackgroundImage");
}
function isFooterBackgroundImageRepeatConfig(config: SingleColorConfig): config is FooterBackgroundImageRepeatConfig {
  return config.hasOwnProperty("footerBackgroundImageRepeat");
}
function isFooterBackgroundImageSizeConfig(config: SingleColorConfig): config is FooterBackgroundImageSizeConfig {
  return config.hasOwnProperty("footerBackgroundImageSize");
}
function isFooterBackgroundImagePositionConfig(config: SingleColorConfig): config is FooterBackgroundImagePositionConfig {
  return config.hasOwnProperty("footerBackgroundImagePosition");
}
function isFooterBackgroundImageOriginConfig(config: SingleColorConfig): config is FooterBackgroundImageOriginConfig {
  return config.hasOwnProperty("footerBackgroundImageOrigin");
}


function isTextWeightConfig(config: SingleColorConfig): config is TextWeightConfig {
  return config.hasOwnProperty("textWeight");
}

function isFontFamilyConfig(config: SingleColorConfig): config is FontFamilyConfig {
  return config.hasOwnProperty("fontFamily");
}
function isFontStyleConfig(config: SingleColorConfig): config is FontStyleConfig {
  return config.hasOwnProperty("fontStyle");
}
function isTextTransformConfig(config: SingleColorConfig): config is TextTransformConfig {
  return config.hasOwnProperty("textTransform");
}
function isTextDecorationConfig(config: SingleColorConfig): config is TextDecorationConfig {
  return config.hasOwnProperty("textDecoration");
}
function isBorderStyleConfig(config: SingleColorConfig): config is borderStyleConfig {
  return config.hasOwnProperty("borderStyle");
}

function isMarginConfig(config: SingleColorConfig): config is MarginConfig {
  return config.hasOwnProperty("margin");
}

function isDirectionConfig(config: SingleColorConfig): config is DirectionConfig {
  return config.hasOwnProperty("direction");
}

function isDetailSizeConfig(config: SingleColorConfig): config is DetailSizeConfig {
  return config.hasOwnProperty("detailSize");
}

function isChartOpacityConfig(config: SingleColorConfig): config is ChartOpacityConfig {
  return config.hasOwnProperty("chartOpacity");
}

function isChartBoxShadowConfig(config: SingleColorConfig): config is ChartBoxShadowConfig {
  return config.hasOwnProperty("chartBoxShadow");
}

function isChartBorderStyleConfig(config: SingleColorConfig): config is ChartBorderStyleConfig {
  return config.hasOwnProperty("chartBorderStyle");
}

function isChartBorderRadiusConfig(config: SingleColorConfig): config is ChartBorderRadiusConfig {
  return config.hasOwnProperty("chartBorderRadius");
}

function isChartBorderWidthConfig(config: SingleColorConfig): config is ChartBorderWidthConfig {
  return config.hasOwnProperty("chartBorderWidth");
}

function isChartTextSizeConfig(config: SingleColorConfig): config is ChartTextSizeConfig {
  return config.hasOwnProperty("chartTextSize");
}

function isChartTextWeightConfig(config: SingleColorConfig): config is ChartTextWeightConfig {
  return config.hasOwnProperty("chartTextWeight");
}

function isChartFontFamilyConfig(config: SingleColorConfig): config is ChartFontFamilyConfig {
  return config.hasOwnProperty("chartFontFamily");
}

function isChartFontStyleConfig(config: SingleColorConfig): config is ChartFontStyleConfig {
  return config.hasOwnProperty("chartFontStyle");
}

function isBoxShadowConfig(
  config: SingleColorConfig
): config is BoxShadowConfig {
  return config.hasOwnProperty('boxShadow');
}

function isBoxShadowColorConfig(
  config: SingleColorConfig
): config is BoxShadowColorConfig {
  return config.hasOwnProperty('boxShadowColor');
}

function isChartBackgroundColorConfig(
  config: SingleColorConfig
): config is ChartBackgroundColorConfig {
  return config.hasOwnProperty('chartBackgroundColor');
}
function isChartGradientColorConfig(
  config: SingleColorConfig
): config is ChartGradientColorConfig {
  return config.hasOwnProperty('chartGradientColor');
}
function isChartShadowColorConfig(
  config: SingleColorConfig
): config is ChartShadowColorConfig {
  return config.hasOwnProperty('chartShadowColor');
}
function isChartBorderColorConfig(
  config: SingleColorConfig
): config is ChartBorderColorConfig {
  return config.hasOwnProperty('chartBorderColor');
}
function isChartTextColorConfig(
  config: SingleColorConfig
): config is ChartTextColorConfig {
  return config.hasOwnProperty('chartTextColor');
}

function isAnimationIterationCountConfig(
  config: SingleColorConfig
): config is AnimationIterationCountConfig {
  return config.hasOwnProperty('animationIterationCount');
}

function isOpacityConfig(config: SingleColorConfig): config is OpacityConfig {
  return config.hasOwnProperty('opacity');
}

function isAnimationConfig(
  config: SingleColorConfig
): config is AnimationConfig {
  return config.hasOwnProperty('animation');
}

function isAnimationDelayConfig(
  config: SingleColorConfig
): config is AnimationDelayConfig {
  return config.hasOwnProperty('animationDelay');
}

function isAnimationDurationConfig(
  config: SingleColorConfig
): config is AnimationDurationConfig {
  return config.hasOwnProperty('animationDuration');
}

function isPaddingConfig(config: SingleColorConfig): config is PaddingConfig {
  return config.hasOwnProperty("padding");
}

// function styleControl(colorConfig: Array<SingleColorConfig>) {
type Names<T extends readonly SingleColorConfig[]> = T[number]["name"];
export type StyleConfigType<T extends readonly SingleColorConfig[]> = { [K in Names<T>]: string };

// Options[number]["value"]
function isEmptyColor(color: string) {
  return _.isEmpty(color);
}
function isEmptyLineHeight(lineHeight: string) {
  return _.isEmpty(lineHeight);
}
function isEmptyTextSize(textSize: string) {
  return _.isEmpty(textSize);
}
function isEmptyRadius(radius: string) {
  return _.isEmpty(radius);
}
function isEmptyBorderWidth(borderWidth: string) {
  return _.isEmpty(borderWidth);
}
function isEmptyRotation(rotation: string) {
  return _.isEmpty(rotation);
}
function isEmptyBackgroundImageConfig(backgroundImage: string) {
  return _.isEmpty(backgroundImage);
}
function isEmptyBackgroundImageRepeatConfig(backgroundImageRepeat: string) {
  return _.isEmpty(backgroundImageRepeat);
}
function isEmptyBackgroundImageSizeConfig(backgroundImageSize: string) {
  return _.isEmpty(backgroundImageSize);
}
function isEmptyBackgroundImagePositionConfig(backgroundImagePosition: string) {
  return _.isEmpty(backgroundImagePosition);
}
function isEmptyBackgroundImageOriginConfig(backgroundImageOrigin: string) {
  return _.isEmpty(backgroundImageOrigin);
}
function isEmptyHeaderBackgroundImageConfig(headerBackgroundImage: string) {
  return _.isEmpty(headerBackgroundImage);
}
function isEmptyHeaderBackgroundImageRepeatConfig(headerBackgroundImageRepeat: string) {
  return _.isEmpty(headerBackgroundImageRepeat);
}
function isEmptyHeaderBackgroundImageSizeConfig(headerBackgroundImageSize: string) {
  return _.isEmpty(headerBackgroundImageSize);
}
function isEmptyHeaderBackgroundImagePositionConfig(headerBackgroundImagePosition: string) {
  return _.isEmpty(headerBackgroundImagePosition);
}
function isEmptyHeaderBackgroundImageOriginConfig(headerBackgroundImageOrigin: string) {
  return _.isEmpty(headerBackgroundImageOrigin);
}
function isEmptyFooterBackgroundImageConfig(footerBackgroundImage: string) {
  return _.isEmpty(footerBackgroundImage);
}
function isEmptyFooterBackgroundImageRepeatConfig(footerBackgroundImageRepeat: string) {
  return _.isEmpty(footerBackgroundImageRepeat);
}
function isEmptyFooterBackgroundImageSizeConfig(footerBackgroundImageSize: string) {
  return _.isEmpty(footerBackgroundImageSize);
}
function isEmptyFooterBackgroundImagePositionConfig(footerBackgroundImagePosition: string) {
  return _.isEmpty(footerBackgroundImagePosition);
}
function isEmptyFooterBackgroundImageOriginConfig(footerBackgroundImageOrigin: string) {
  return _.isEmpty(footerBackgroundImageOrigin);
}


function isEmptyTextWeight(textWeight: string) {
  return _.isEmpty(textWeight);
}
function isEmptyFontFamily(fontFamily: string) {
  return _.isEmpty(fontFamily);
}
function isEmptyFontStyle(fontStyle: string) {
  return _.isEmpty(fontStyle);
}
function isEmptyTextTransform(textTransform: string) {
  return _.isEmpty(textTransform);
}
function isEmptyTextDecoration(textDecoration: string) {
  return _.isEmpty(textDecoration);
}
function isEmptyBorderStyle(borderStyle: string) {
  return _.isEmpty(borderStyle);
}

function isEmptyMargin(margin: string) {
  return _.isEmpty(margin);
}
function isEmptyDirection(direction: string) {
  return _.isEmpty(direction);
}
function isEmptyDetailSize(detailSize: string) {
  return _.isEmpty(detailSize);
}
function isEmptyChartOpacity(chartOpacity: string) {
  return _.isEmpty(chartOpacity);
}
function isEmptyChartBoxShadow(chartBoxShadow: string) {
  return _.isEmpty(chartBoxShadow);
}
function isEmptyChartBorderStyle(chartBorderStyle: string) {
  return _.isEmpty(chartBorderStyle);
}
function isEmptyChartBorderRadius(chartBorderRadius: string) {
  return _.isEmpty(chartBorderRadius);
}
function isEmptyChartBorderWidth(chartBorderWidth: string) {
  return _.isEmpty(chartBorderWidth);
}
function isEmptyChartTextSize(chartTextSize: string) {
  return _.isEmpty(chartTextSize);
}
function isEmptyChartTextWeight(chartTextWeight: string) {
  return _.isEmpty(chartTextWeight);
}
function isEmptyChartFontFamily(chartFontFamily: string) {
  return _.isEmpty(chartFontFamily);
}
function isEmptyChartFontStyle(chartFontStyle: string) {
  return _.isEmpty(chartFontStyle);
}
function isEmptyPadding(padding: string) {
  return _.isEmpty(padding);
}
function isEmptyAnimationIterationCount(animationIterationCount: string) {
  return _.isEmpty(animationIterationCount);
}

function isEmptyOpacity(opacity: string) {
  return _.isEmpty(opacity);
}

function isEmptyBoxShadow(boxShadow: string) {
  return _.isEmpty(boxShadow);
}

function isEmptyBoxShadowColor(boxShadowColor: string) {
  return _.isEmpty(boxShadowColor);
}

function isEmptyChartBackgroundColor(chartBackgroundColor: string) {
  return _.isEmpty(chartBackgroundColor);
}
function isEmptyChartGradientColor(chartGradientColor: string) {
  return _.isEmpty(chartGradientColor);
}
function isEmptyChartShadowColor(chartShadowColor: string) {
  return _.isEmpty(chartShadowColor);
}
function isEmptyChartBorderColor(chartBorderColor: string) {
  return _.isEmpty(chartBorderColor);
}
function isEmptyChartTextColor(chartTextColor: string) {
  return _.isEmpty(chartTextColor);
}

function isEmptyAnimation(animation: string) {
  return _.isEmpty(animation);
}

function isEmptyAnimationDelay(animationDelay: string) {
  return _.isEmpty(animationDelay);
}

function isEmptyAnimationDuration(animationDuration: string) {
  return _.isEmpty(animationDuration);
}
/**
 * Calculate the actual used color from the dsl color
 */
function calcColors<ColorMap extends Record<string, string>>(
  props: ColorMap,
  colorConfigs: readonly SingleColorConfig[],
  theme?: ThemeDetail,
  bgColor?: string,
  compTheme?: Record<string, string>,
  compType?: string,
  styleKey?: string,
) {
  // let themeWithDefault = (theme || defaultTheme) as unknown as Record<string, string>;
  let themeWithDefault = {
    // ...defaultTheme,
    ...(theme || {}),
    ...(compTheme || {}),
  } as unknown as Record<string, string>;
  if (compType && styleKey && inputFieldComps.includes(compType) && styleKey !== 'inputFieldStyle') {
    const style = theme?.components?.[compType]?.[styleKey] as Record<string, string>;
    themeWithDefault['borderWidth'] = style?.['borderWidth'] || '0px';
  }

  // Cover what is not there for the first pass
  let res: Record<string, string> = {};
  colorConfigs.forEach((config) => {
    const name = config.name;
    if (!isEmptyLineHeight(props[name]) && isLineHeightConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyTextSize(props[name]) && isTextSizeConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyRadius(props[name]) && isRadiusConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyBorderWidth(props[name]) && isBorderWidthConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyRotation(props[name]) && isRotationConfig(config)) {
      res[name] = props[name];
      return;
    }

    if (!isEmptyBackgroundImageConfig(props[name]) && isBackgroundImageConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyBackgroundImageRepeatConfig(props[name]) && isBackgroundImageRepeatConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyBackgroundImageSizeConfig(props[name]) && isBackgroundImageSizeConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyBackgroundImagePositionConfig(props[name]) && isBackgroundImagePositionConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyBackgroundImageOriginConfig(props[name]) && isBackgroundImageOriginConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyHeaderBackgroundImageConfig(props[name]) && isHeaderBackgroundImageConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyHeaderBackgroundImageRepeatConfig(props[name]) && isHeaderBackgroundImageRepeatConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyHeaderBackgroundImageSizeConfig(props[name]) && isHeaderBackgroundImageSizeConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyHeaderBackgroundImagePositionConfig(props[name]) && isHeaderBackgroundImagePositionConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyHeaderBackgroundImageOriginConfig(props[name]) && isHeaderBackgroundImageOriginConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyFooterBackgroundImageConfig(props[name]) && isFooterBackgroundImageConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyFooterBackgroundImageRepeatConfig(props[name]) && isFooterBackgroundImageRepeatConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyFooterBackgroundImageSizeConfig(props[name]) && isFooterBackgroundImageSizeConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyFooterBackgroundImagePositionConfig(props[name]) && isFooterBackgroundImagePositionConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyFooterBackgroundImageOriginConfig(props[name]) && isFooterBackgroundImageOriginConfig(config)) {
      res[name] = props[name];
      return;
    }
  
    if (!isEmptyTextWeight(props[name]) && isTextWeightConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyFontFamily(props[name]) && isFontFamilyConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyFontStyle(props[name]) && isFontStyleConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyTextTransform(props[name]) && isTextTransformConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyTextDecoration(props[name]) && isTextDecorationConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyBorderStyle(props[name]) && isBorderStyleConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyMargin(props[name]) && isMarginConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyDirection(props[name]) && isDirectionConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyDetailSize(props[name]) && isDetailSizeConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyChartOpacity(props[name]) && isChartOpacityConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyChartBoxShadow(props[name]) && isChartBoxShadowConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyChartBorderStyle(props[name]) && isChartBorderStyleConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyChartBorderRadius(props[name]) && isChartBorderRadiusConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyChartBorderWidth(props[name]) && isChartBorderWidthConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyChartTextSize(props[name]) && isChartTextSizeConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyChartTextWeight(props[name]) && isChartTextWeightConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyChartFontFamily(props[name]) && isChartFontFamilyConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyChartFontStyle(props[name]) && isChartFontStyleConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyPadding(props[name]) && isPaddingConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyBoxShadow(props[name]) && isBoxShadowConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyBoxShadowColor(props[name]) && isBoxShadowColorConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyChartBackgroundColor(props[name]) && isChartBackgroundColorConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyChartGradientColor(props[name]) && isChartGradientColorConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyChartShadowColor(props[name]) && isChartShadowColorConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyChartBorderColor(props[name]) && isChartBorderColorConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyChartTextColor(props[name]) && isChartTextColorConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (
      !isEmptyAnimationIterationCount(props[name]) &&
      isAnimationIterationCountConfig(config)
    ) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyOpacity(props[name]) && isOpacityConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyAnimation(props[name]) && isAnimationConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyAnimationDelay(props[name]) && isAnimationDelayConfig(config)) {
      res[name] = props[name];
      return;
    }
    if (
      !isEmptyAnimationDuration(props[name]) &&
      isAnimationDurationConfig(config)
    ) {
      res[name] = props[name];
      return;
    }
    if (!isEmptyColor(props[name])) {
      if (isThemeColorKey(props[name])) {
        res[name] = themeWithDefault[props[name]];
      } else {
        res[name] = props[name];
      }
      return;
    }
    if (isSimpleColorConfig(config)) {
      res[name] = config.color;
    }
    if (isRadiusConfig(config)) {
      res[name] = themeWithDefault[config.radius];
    }
    if (isBorderWidthConfig(config)) {
      res[name] = themeWithDefault[config.borderWidth] || '0px';
    }
    if (isRotationConfig(config)) {
      res[name] = themeWithDefault[config.rotation] || '0deg';
    }
    if (isBackgroundImageConfig(config)) {
      res[name] = themeWithDefault[config.backgroundImage] || '';
    }
    if (isBackgroundImageRepeatConfig(config)) {
      res[name] = themeWithDefault[config.backgroundImageRepeat] || 'no-repeat';
    }
    if (isBackgroundImageSizeConfig(config)) {
      res[name] = themeWithDefault[config.backgroundImageSize] || 'cover';
    }
    if (isBackgroundImagePositionConfig(config)) {
      res[name] = themeWithDefault[config.backgroundImagePosition] || 'center';
    }
    if (isBackgroundImageOriginConfig(config)) {
      res[name] = themeWithDefault[config.backgroundImageOrigin] || 'padding-box';
    }
    if (isHeaderBackgroundImageConfig(config)) {
      res[name] = themeWithDefault[config.headerBackgroundImage] || '';
    }
    if (isHeaderBackgroundImageRepeatConfig(config)) {
      res[name] = themeWithDefault[config.headerBackgroundImageRepeat] || 'no-repeat';
    }
    if (isHeaderBackgroundImageSizeConfig(config)) {
      res[name] = themeWithDefault[config.headerBackgroundImageSize] || 'cover';
    }
    if (isHeaderBackgroundImagePositionConfig(config)) {
      res[name] = themeWithDefault[config.headerBackgroundImagePosition] || 'center';
    }
    if (isHeaderBackgroundImageOriginConfig(config)) {
      res[name] = themeWithDefault[config.headerBackgroundImageOrigin] || 'padding-box';
    }
    if (isFooterBackgroundImageConfig(config)) {
      res[name] = themeWithDefault[config.footerBackgroundImage] || '';
    }
    if (isFooterBackgroundImageRepeatConfig(config)) {
      res[name] = themeWithDefault[config.footerBackgroundImageRepeat] || 'no-repeat';
    }
    if (isFooterBackgroundImageSizeConfig(config)) {
      res[name] = themeWithDefault[config.footerBackgroundImageSize] || 'cover';
    }
    if (isFooterBackgroundImagePositionConfig(config)) {
      res[name] = themeWithDefault[config.footerBackgroundImagePosition] || 'center';
    }
    if (isFooterBackgroundImageOriginConfig(config)) {
      res[name] = themeWithDefault[config.footerBackgroundImageOrigin] || 'padding-box';
    }
    if (isTextSizeConfig(config)) {
      // TODO: remove default textSize after added in theme in backend.
      res[name] = themeWithDefault[config.textSize] || '14px';
    }
    if (isTextWeightConfig(config)) {
      // TODO: remove default textWeight after added in theme in backend.
      res[name] = themeWithDefault[config.textWeight] || 'normal';
    }
    if (isFontFamilyConfig(config)) {
      res[name] = themeWithDefault[config.fontFamily] || 'sans-serif';
    }
    if (isFontStyleConfig(config)) {
      res[name] = themeWithDefault[config.fontStyle] || 'normal'
    }
    if(isTextTransformConfig(config)){
      res[name] = themeWithDefault[config.textTransform] || 'none'
    }
    if(isTextDecorationConfig(config)){
      res[name] = themeWithDefault[config.textDecoration] || 'none'
    }
    if(isBorderStyleConfig(config)){
      res[name] = themeWithDefault[config.borderStyle] || 'solid'
    }
    if (isMarginConfig(config)) {
      res[name] = themeWithDefault[config.margin];
    }
    if (isDirectionConfig(config)) {
      res[name] = themeWithDefault[config.direction] || '0 0 1 1';
    }
    if (isDetailSizeConfig(config)) {
      res[name] = themeWithDefault[config.detailSize] || '24px 12px';
    }
    if (isChartOpacityConfig(config)) {
      res[name] = themeWithDefault[config.chartOpacity] || '1';
    }
    if (isChartBoxShadowConfig(config)) {
      res[name] = themeWithDefault[config.chartBoxShadow] || '1px 1px 1px';
    }
    if (isChartBorderStyleConfig(config)) {
      res[name] = themeWithDefault[config.chartBorderStyle] || 'solid';
    }
    if (isChartBorderRadiusConfig(config)) {
      res[name] = themeWithDefault[config.chartBorderRadius] || '1px';
    }
    if (isChartBorderWidthConfig(config)) {
      res[name] = themeWithDefault[config.chartBorderWidth] || '1px';
    }
    if (isChartTextSizeConfig(config)) {
      res[name] = themeWithDefault[config.chartTextSize] || '14px';
    }
    if (isChartTextWeightConfig(config)) {
      res[name] = themeWithDefault[config.chartTextWeight] || 'normal';
    }
    if (isChartFontFamilyConfig(config)) {
      res[name] = themeWithDefault[config.chartFontFamily] || 'Arial';
    }
    if (isChartFontStyleConfig(config)) {
      res[name] = themeWithDefault[config.chartFontStyle] || 'normal';
    }
    if (isPaddingConfig(config)) {
      res[name] = themeWithDefault[config.padding];
    }
    if (isBoxShadowConfig(config)) {
      res[name] = themeWithDefault[config.boxShadow] || '0px 0px 0px';
    }
    if (isBoxShadowColorConfig(config)) {
      res[name] = themeWithDefault[config.boxShadowColor];
    }
    if (isChartBackgroundColorConfig(config)) {
      res[name] = themeWithDefault[config.chartBackgroundColor];
    }
    if (isChartGradientColorConfig(config)) {
      res[name] = themeWithDefault[config.chartGradientColor];
    }
    if (isChartShadowColorConfig(config)) {
      res[name] = themeWithDefault[config.chartShadowColor];
    }
    if (isChartBorderColorConfig(config)) {
      res[name] = themeWithDefault[config.chartBorderColor];
    }
    if (isChartTextColorConfig(config)) {
      res[name] = themeWithDefault[config.chartTextColor];
    }
    if (isAnimationIterationCountConfig(config)) {
      res[name] = themeWithDefault[config.animationIterationCount] || '0';
    }
    if (isOpacityConfig(config)) {
      res[name] = themeWithDefault[config.opacity];
    }
    if (isAnimationConfig(config)) {
      res[name] = themeWithDefault[config.animation] || 'none';
    }
    if (isAnimationDelayConfig(config)) {
      res[name] = themeWithDefault[config.animationDelay] || '0s';
    }
    if (isAnimationDurationConfig(config)) {
      res[name] = themeWithDefault[config.animationDuration] || '0s';
    }
    if (isLineHeightConfig(config)) {

      res[name] = themeWithDefault[config.lineHeight] || '20px';
    }
  });
  // The second pass calculates dep
  colorConfigs.forEach((config) => {
    const name = config.name;
    if (!isEmptyColor(props[name])) {
      return;
    }
    if (isDepColorConfig(config)) {
      if (config.depType && config.depType === DEP_TYPE.CONTRAST_TEXT) {
        if (compTheme?.[name]) {
          res[name] = compTheme[name];
          return;
        }
        // bgColor is the background color of the container component, equivalent to canvas
        let depKey = config.depName ? res[config.depName] : themeWithDefault[config.depTheme!];
        if (bgColor && config.depTheme === "canvas") {
          depKey = bgColor;
        }
        res[name] = config.transformer(
          depKey,
          themeWithDefault.textDark,
          themeWithDefault.textLight
        );
      } else if ((config?.depType || config?.depName) && compTheme?.[name]) {
        res[name] = compTheme[name];
      } else if (config?.depType === DEP_TYPE.SELF && config.depTheme === "canvas" && bgColor) {
        res[name] = bgColor;
      } else {
        const rest = [];
        config.depName && rest.push(res[config.depName]);
        config.depTheme && rest.push(themeWithDefault[config.depTheme]);
        res[name] = config.transformer(rest[0], rest[1]);
      }
    } else {
      res[name] = themeWithDefault[config.name]
    }
  });
  return res as ColorMap;
}

const TitleDiv = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  line-height: 1;

  span:nth-of-type(2) {
    cursor: pointer;
    color: #8b8fa3;
    display: inline-flex;
    align-items: center;
  }
`;

const StyleContent = styled.div`
  border: 1.07px solid #d7d9e0;
  border-radius: 6px;

  .cm-editor,
  .cm-editor:hover,
  .cm-editor.cm-focused {
    border: none;
    box-shadow: none;
  }

  > div {
    padding: 1px 0 1px 12px;
    border-bottom: 1px solid #d7d9e0;

    &:hover,
    &:focus {
      background: #fafafa;

      .cm-content {
        background: #fafafa;
      }
    }

    > div {
      align-items: center;
      flex-direction: row;
      gap: 0;

      > div:nth-of-type(1) {
        flex: 0 0 96px;

        div {
          line-height: 30px;
        }
      }

      > svg {
        height: 30px;
      }

      > div:nth-of-type(2) {
        flex: 1 1 auto;
      }
    }
  }

  > div:nth-of-type(1) {
    border-radius: 6px 6px 0 0;
  }

  > div:nth-last-of-type(1) {
    border: none;
    border-radius: 0 0 6px 6px;
  }
`;
const LineHeightPropIcon = styled(LineHeightIcon)`
  margin: 0 8px 0 -3px;
  padding: 3px;
  color: #888;
`;

const MarginIcon = styled(ExpandIcon)` margin: 0 8px 0 2px; color: #888`;
const DirectionIcon = styled(ExpandIcon)` margin: 0 13px 0 2px; color: #888`;
const PaddingIcon = styled(CompressIcon)`	margin: 0 8px 0 2px; color: #888`;
const RadiusPropIcon = styled(BorderRadiusIcon)` width: 24px; margin: 0 11px 0 0px; color: #888`;
const BorderPropIcon = styled(BorderWidthIcon)` margin: 0 8px 0 -3px; padding: 3px; color: #888`;
const BorderStylePropIcon = styled(BorderStyleIcon)` margin: 0 8px 0 -3px; padding: 3px; color: #888`;

const StyledBackgroundImageIcon = styled(ImageCompIconSmall)` margin: 0 10px 0 0; padding: 2px; color: #888`;
const AnimationIterationCountPropIcon = styled(RefreshLineIcon)`
  margin: 0 8px 0 -3px;
  padding: 3px;
  color: #888;
`;

const OpacityPropIcon = styled(OpacityIcon)`
  margin: 0 8px 0 -3px;
  padding: 3px;
  color: #888;
`;

const BoxShadowColorPropIcon = styled(BorderWidthIcon)`
  margin: 0 8px 0 -3px;
  padding: 3px;
  color: #888;
`;

const ChartBackgroundColorPropIcon = styled(BorderWidthIcon)`
  margin: 0 8px 0 -3px;
  padding: 13px;
  color: #888;
`;
const ChartGradientColorPropIcon = styled(BorderWidthIcon)`
  margin: 0 8px 0 -3px;
  padding: 3px;
  color: #888;
`;
const ChartShadowColorPropIcon = styled(BorderWidthIcon)`
  margin: 0 8px 0 -3px;
  padding: 3px;
  color: #888;
`;
const ChartBorderColorPropIcon = styled(BorderWidthIcon)`
  margin: 0 8px 0 -3px;
  padding: 3px;
  color: #888;
`;
const ChartTextColorPropIcon = styled(BorderWidthIcon)`
  margin: 0 8px 0 -3px;
  padding: 3px;
  color: #888;
`;

const BoxShadowPropIcon = styled(ShadowIcon)`
  margin: 0 8px 0 -3px;
  padding: 3px;
  color: #888;
`;
const AnimationPropIcon = styled(StarSmileIcon)`
  margin: 0 8px 0 -3px;
  padding: 3px;
  color: #888;
`;
const AnimationDelayPropIcon = styled(TimerFlashIcon)`
  margin: 0 8px 0 -3px;
  padding: 3px;
  color: #888;
`;

const AnimationDurationPropIcon = styled(Timer2Icon)`
  margin: 0 8px 0 -3px;
  padding: 3px;
  color: #888;
`;

const RotationPropIcon = styled(RotationIcon)` margin: 0 8px 0 -3px; padding: 3px; color: #888`;

const StyledTextSizeIcon = styled(TextSizeIcon)` margin: 0 8px 0 -3px; padding: 3px; color: #888`;
const StyledTextTransformIcon = styled(TextTransformationIcon)` margin: 0 8px 0 -3px; padding: 3px; color: #888`;
const StyledFontFamilyIcon = styled(FontFamilyIcon)` margin: 0 8px 0 -3px; padding: 3px; color: #888`;
const StyledFontStyleIcon = styled(TextStyleIcon)` margin: 0 8px 0 -3px; padding: 3px; color: #888`;
const StyledTextWeightIcon = styled(TextWeightIcon)` margin: 0 8px 0 -3px; padding: 3px; color: #888`;
const StyledTextStyleIcon = styled(TextStyleIcon)` margin: 0 8px 0 -3px; padding: 3px; color: #888`;
const StyledTextDecorationPropIcon = styled(TextDecorationIcon)` margin: 0 8px 0 -3px; padding: 3px; color: #888`;


const ResetIcon = styled(IconReset)`
  &:hover g g {
    stroke: #315efb;
  }
`;

const useThemeStyles = (
  styleKey: string,
  props: Record<string, string | undefined>,
) => {
  const editorState = useContext(EditorContext);
  const {comp, compType} = useContext(CompContext);
  const theme = useContext(ThemeContext);
  const bgColor = useContext(BackgroundColorContext);
  const { themeId } = theme || {};
  const isPreviewTheme = themeId === 'preview-theme';
  const isDefaultTheme = themeId === 'default-theme-id';

  const appSettingsComp = editorState?.getAppSettingsComp();
  const preventAppStylesOverwriting = appSettingsComp?.getView()?.preventAppStylesOverwriting;
  const { appliedThemeId, preventStyleOverwriting } = (comp?.comp || {});
  const appTheme = isPreviewTheme || isDefaultTheme || (!preventStyleOverwriting && !preventAppStylesOverwriting)
    ? theme?.theme
    : defaultTheme;
  let compTheme: JSONValue|undefined = {};
  if (appliedThemeId !== themeId) {
    compTheme = isPreviewTheme || isDefaultTheme || (compType && !preventStyleOverwriting && !preventAppStylesOverwriting)
      ? {
          ...(omit(defaultTheme, 'components', 'chart')),
          ...defaultTheme.components?.[compType]?.[styleKey] as unknown as Record<string, string>,
          ...(omit(theme?.theme, 'components', 'chart')),
          ...theme?.theme?.components?.[compType]?.[styleKey] as unknown as Record<string, string>,
        }
      : defaultTheme.components?.[compType]?.[styleKey];
  }
  const styleProps = (!comp && !compType) || preventStyleOverwriting || preventAppStylesOverwriting || appliedThemeId === themeId
    ? props
    : {};

  return {
    appTheme,
    styleProps,
    bgColor,
    compTheme,
    compType,
  }
};

export function styleControl<T extends readonly SingleColorConfig[]>(
  colorConfigs: T,
  styleKey: string = '',
) {
  type ColorMap = { [K in Names<T>]: string };
  const childrenMap: any = {};
  colorConfigs.map((config) => {
    const name: Names<T> = config.name;
    if (
      name === 'radius' ||
      name === 'borderWidth' ||
      name === 'boxShadow' ||
      name === 'animationIterationCount' ||
      name === 'opacity' ||
      name === 'animation' ||
      name === 'animationDelay' ||
      name === 'animationDuration' ||
      name === 'rotation' ||
      name === 'cardRadius' ||
      name === 'textSize' ||
      name === 'textWeight' ||
      name === 'textTransform' ||
      name === 'textDecoration' ||
      name === 'fontFamily' ||
      name === 'borderStyle' ||
      name === 'fontStyle' ||
      name === 'backgroundImage' ||
      name === 'backgroundImageRepeat' ||
      name === 'backgroundImageSize' ||
      name === 'backgroundImagePosition' ||
      name === 'backgroundImageOrigin' ||
      name === 'headerBackgroundImage' ||
      name === 'headerBackgroundImageRepeat' ||
      name === 'headerBackgroundImageSize' ||
      name === 'headerBackgroundImagePosition' ||
      name === 'headerBackgroundImageOrigin' ||
      name === 'footerBackgroundImage' ||
      name === 'footerBackgroundImageRepeat' ||
      name === 'footerBackgroundImageSize' ||
      name === 'footerBackgroundImagePosition' ||
      name === 'footerBackgroundImageOrigin' ||
      name === 'margin' ||
      name === 'direction' ||
      name === 'detailSize' ||
      name === 'chartOpacity' ||
      name === 'chartBoxShadow' ||
      name === 'chartBorderStyle' ||
      name === 'chartBorderRadius' ||
      name === 'chartBorderWidth' ||
      name === 'chartTextSize' ||
      name === 'chartTextWeight' ||
      name === 'chartFontFamily' ||
      name === 'chartFontStyle' ||
      name === 'padding' ||
      name === 'containerHeaderPadding' ||
      name === 'containerSiderPadding' ||
      name === 'containerFooterPadding' ||
      name === 'containerBodyPadding' ||
      name === 'lineHeight'
    ) {
      childrenMap[name] = StringControl;
    } else {
      childrenMap[name] = ColorControl;
    }
  });
  // [K in Names<T>]: new (params: CompParams<any>) => ColorControl;
  const label = trans("prop.style");
  return new ControlItemCompBuilder(
    childrenMap as ToConstructor<{ [K in Names<T>]: ColorControl }>,
    (props) => {
      const {
        styleProps,
        appTheme,
        bgColor,
        compTheme,
        compType,
      } = useThemeStyles(styleKey, props as Record<string, string>);

      return calcColors(
        styleProps as ColorMap,
        colorConfigs,
        appTheme,
        bgColor,
        compTheme as Record<string, string> | undefined,
        compType,
        styleKey,
      );
    }
  )
    .setControlItemData({ filterText: label, searchChild: true })
    .setPropertyViewFn((children) => {
      const isMobile = useIsMobile();
      const childrenProps = childrenToProps(children) as Record<string, string>;
      const {
        styleProps,
        appTheme,
        bgColor,
        compTheme,
        compType,
      } = useThemeStyles(styleKey, childrenProps);

      const props = calcColors(
        styleProps as ColorMap,
        colorConfigs,
        appTheme,
        bgColor,
        compTheme as Record<string, string> | undefined,
        compType,
        styleKey,
      );

      const showReset = Object.values(childrenToProps(children)).findIndex((item) => item) > -1;

      // helper function to build the tooltip automatically - but check if there is a translation existing at least.
      const getTooltip = (name: string) => {
        const tooltipKey = `style.${name}Tip`;
        const tooltip = trans(tooltipKey);
        return !tooltip.includes("oups!") ? tooltip : false;
      };

      return (
        <>
          <TitleDiv>
            <span>{label}</span>
            {showReset && (
              <span
                onClick={() => {
                  colorConfigs.map((item) => {
                    const name: Names<T> = item.name;
                    if (
                      name === 'radius' ||
                      name === 'margin' ||
                      name === 'direction' ||
                      name === 'detailSize' ||
                      name === 'chartOpacity' ||
                      name === 'chartBoxShadow' ||
                      name === 'chartBorderStyle' ||
                      name === 'chartBorderRadius' ||
                      name === 'chartBorderWidth' ||
                      name === 'chartTextSize' ||
                      name === 'chartTextWeight' ||
                      name === 'chartFontFamily' ||
                      name === 'chartFontStyle' ||
                      name === 'padding' ||
                      name === 'containerHeaderPadding' ||
                      name === 'containerSiderPadding' ||
                      name === 'containerFooterPadding' ||
                      name === 'containerBodyPadding' ||
                      name === 'borderWidth' ||
                      name === 'animationIterationCount' ||
                      name === 'opacity' ||
                      name === 'boxShadowColor' ||
                      name === 'chartBackgroundColor' ||
                      name === 'chartGradientColor' ||
                      name === 'chartShadowColor' ||
                      name === 'chartBorderColor' ||
                      name === 'chartTextColor' ||
                      name === 'boxShadow' ||
                      name === 'animation' ||
                      name === 'animationDelay' ||
                      name === 'animationDuration' ||
                      name === 'rotation' ||
                      name === 'backgroundImage' ||
                      name === 'backgroundImageRepeat' ||
                      name === 'backgroundImageSize' ||
                      name === 'backgroundImagePosition' ||
                      name === 'backgroundImageOrigin' ||
                      name === 'headerBackgroundImage' ||
                      name === 'headerBackgroundImageRepeat' ||
                      name === 'headerBackgroundImageSize' ||
                      name === 'headerBackgroundImagePosition' ||
                      name === 'headerBackgroundImageOrigin' ||
                      name === 'footerBackgroundImage' ||
                      name === 'footerBackgroundImageRepeat' ||
                      name === 'footerBackgroundImageSize' ||
                      name === 'footerBackgroundImagePosition' ||
                      name === 'footerBackgroundImageOrigin' ||
                      name === 'lineHeight'
                    ) {
                      children[name]?.dispatchChangeValueAction('');
                    } else {
                      children[name] &&
                        children[name].dispatch(
                          children[name].changeValueAction('')
                        );
                    }
                  });
                }}
              >
                <Tooltip placement="topRight" title={trans("style.resetTooltip")}>
                  <ResetIcon title=""/>
                </Tooltip>
              </span>
            )}
          </TitleDiv>
          <StyleContent>
            {colorConfigs
              .filter(
                (config) =>
                  !config.platform ||
                  (isMobile && config.platform === "mobile") ||
                  (!isMobile && config.platform === "pc")
              )
              .map((config, index) => {
                const name: Names<T> = config.name;
                let depMsg = (config as SimpleColorConfig)["color"];
                if (isDepColorConfig(config)) {
                  if (config.depType === DEP_TYPE.CONTRAST_TEXT) {
                    depMsg = trans("style.contrastText");
                  } else if (config.depType === DEP_TYPE.SELF && config.depTheme) {
                    depMsg = getThemeDetailName(config.depTheme);
                  } else {
                    depMsg = trans("style.generated");
                  }
                }
                return controlItem(
                  {filterText: config.label},
                  <div key={index}>
                    {name === 'radius' ||
                    name === 'gap' ||
                    name === 'cardRadius'
                      ? (
                          children[name] as InstanceType<typeof StringControl>
                        ).propertyView({
                          label: config.label,
                          preInputNode: <RadiusPropIcon title="Radius" />,
                          placeholder: props[name],
                          tooltip: getTooltip(name),
                        })
                      : name === 'borderWidth'
                        ? (
                            children[name] as InstanceType<typeof StringControl>
                          ).propertyView({
                            label: config.label,
                            preInputNode: (
                              <BorderPropIcon title="Border-Width" />
                            ),
                            placeholder: props[name],
                            tooltip: getTooltip(name),
                          })
                        : name === 'borderStyle'
                          ? (
                              children[name] as InstanceType<
                                typeof StringControl
                              >
                            ).propertyView({
                              label: config.label,
                              preInputNode: (
                                <BorderStylePropIcon title="Border-Style" />
                              ),
                              placeholder: props[name],
                              tooltip: getTooltip(name),
                            })
                          : name === 'margin'
                            ? (
                                children[name] as InstanceType<
                                  typeof StringControl
                                >
                              ).propertyView({
                                label: config.label,
                                preInputNode: <MarginIcon title="Margin" />,
                                placeholder: props[name],
                                tooltip: getTooltip(name),
                              })
                            : name === 'direction'
                              ? (
                                children[name] as InstanceType<
                                  typeof StringControl
                                >
                              ).propertyView({
                                label: config.label,
                                preInputNode: <DirectionIcon title="direction" />,
                                placeholder: props[name],
                                tooltip: getTooltip(name),
                              })
                              : name === 'detailSize'
                                ? (
                                  children[name] as InstanceType<
                                    typeof StringControl
                                  >
                                ).propertyView({
                                  label: config.label,
                                  preInputNode: <DirectionIcon title="detailSize" />,
                                  placeholder: props[name],
                                  tooltip: getTooltip(name),
                                })
                              : name === 'chartOpacity'
                                ? (
                                  children[name] as InstanceType<
                                    typeof StringControl
                                  >
                                ).propertyView({
                                  label: config.label,
                                  preInputNode: <OpacityPropIcon title="chartOpacity" />,
                                  placeholder: props[name],
                                  tooltip: getTooltip(name),
                                })
                                : name === 'chartBoxShadow'
                                  ? (
                                    children[name] as InstanceType<
                                      typeof StringControl
                                    >
                                  ).propertyView({
                                    label: config.label,
                                    preInputNode: <BoxShadowPropIcon title="chartBoxShadow" />,
                                    placeholder: props[name],
                                    tooltip: getTooltip(name),
                                  })
                                  : name === 'chartBorderStyle'
                                    ? (
                                      children[name] as InstanceType<
                                        typeof StringControl
                                      >
                                    ).propertyView({
                                      label: config.label,
                                      preInputNode: <BorderStylePropIcon title="chartBorderStyle" />,
                                      placeholder: props[name],
                                      tooltip: getTooltip(name),
                                    })
                                    : name === 'chartBorderRadius'
                                      ? (
                                        children[name] as InstanceType<
                                          typeof StringControl
                                        >
                                      ).propertyView({
                                        label: config.label,
                                        preInputNode: <RadiusPropIcon title="chartBorderRadius" />,
                                        placeholder: props[name],
                                        tooltip: getTooltip(name),
                                      })
                                      : name === 'chartBorderWidth'
                                        ? (
                                          children[name] as InstanceType<
                                            typeof StringControl
                                          >
                                        ).propertyView({
                                          label: config.label,
                                          preInputNode: <BorderPropIcon title="chartBorderWidth" />,
                                          placeholder: props[name],
                                          tooltip: getTooltip(name),
                                        })
                                        : name === 'chartTextSize'
                                          ? (
                                            children[name] as InstanceType<
                                              typeof StringControl
                                            >
                                          ).propertyView({
                                            label: config.label,
                                            preInputNode: <StyledTextSizeIcon title="chartTextSize" />,
                                            placeholder: props[name],
                                            tooltip: getTooltip(name),
                                          })
                                          : name === 'chartTextWeight'
                                            ? (
                                              children[name] as InstanceType<
                                                typeof StringControl
                                              >
                                            ).propertyView({
                                              label: config.label,
                                              preInputNode: <StyledTextWeightIcon title="chartTextWeight" />,
                                              placeholder: props[name],
                                              tooltip: getTooltip(name),
                                            })
                                            : name === 'chartFontFamily'
                                              ? (
                                                children[name] as InstanceType<
                                                  typeof StringControl
                                                >
                                              ).propertyView({
                                                label: config.label,
                                                preInputNode: <StyledFontFamilyIcon title="chartFontFamily" />,
                                                placeholder: props[name],
                                                tooltip: getTooltip(name),
                                              })
                                              : name === 'chartFontStyle'
                                                ? (
                                                  children[name] as InstanceType<
                                                    typeof StringControl
                                                  >
                                                ).propertyView({
                                                  label: config.label,
                                                  preInputNode: <StyledFontStyleIcon title="chartFontStyle" />,
                                                  placeholder: props[name],
                                                  tooltip: getTooltip(name),
                                                })
                                                : name === 'animationIterationCount'
                                                  ? (
                                                      children[name] as InstanceType<
                                                        typeof StringControl
                                                      >
                                                    ).propertyView({
                                                      label: config.label,
                                                      preInputNode: (
                                                        <AnimationIterationCountPropIcon title="AnimationIterationCount-Type" />
                                                      ),
                                                      placeholder: props[name],
                                                      tooltip: getTooltip(name),
                                                    })
                                                  : name === 'opacity'
                                                    ? (
                                                        children[name] as InstanceType<
                                                          typeof StringControl
                                                        >
                                                      ).propertyView({
                                                        label: config.label,
                                                        preInputNode: (
                                                          <OpacityPropIcon title="Opacity-Type" />
                                                        ),
                                                        placeholder: props[name],
                                                        tooltip: getTooltip(name),
                                                      })
                                                    : name === 'boxShadowColor'
                                                      ? (
                                                          children[name] as InstanceType<
                                                            typeof StringControl
                                                          >
                                                        ).propertyView({
                                                          label: config.label,
                                                          preInputNode: (
                                                            <BoxShadowColorPropIcon title="BoxShadowColor-Type" />
                                                          ),
                                                          placeholder: props[name],
                                                          tooltip: getTooltip(name),
                                                        })
                                                      : name === 'chartBackgroundColor'
                                                        ? (
                                                          children[name] as InstanceType<
                                                            typeof StringControl
                                                          >
                                                        ).propertyView({
                                                          label: config.label,
                                                          preInputNode: (
                                                            <ChartBackgroundColorPropIcon title="BoxShadowColor-Type" />
                                                          ),
                                                          placeholder: props[name],
                                                          tooltip: getTooltip(name),
                                                        })
                                                        : name === 'chartGradientColor'
                                                          ? (
                                                            children[name] as InstanceType<
                                                              typeof StringControl
                                                            >
                                                          ).propertyView({
                                                            label: config.label,
                                                            preInputNode: (
                                                              <ChartGradientColorPropIcon title="BoxShadowColor-Type" />
                                                            ),
                                                            placeholder: props[name],
                                                            tooltip: getTooltip(name),
                                                          })
                                                          : name === 'chartShadowColor'
                                                            ? (
                                                              children[name] as InstanceType<
                                                                typeof StringControl
                                                              >
                                                            ).propertyView({
                                                              label: config.label,
                                                              preInputNode: (
                                                                <ChartShadowColorPropIcon title="BoxShadowColor-Type" />
                                                              ),
                                                              placeholder: props[name],
                                                              tooltip: getTooltip(name),
                                                            })
                                                            : name === 'chartBorderColor'
                                                              ? (
                                                                children[name] as InstanceType<
                                                                  typeof StringControl
                                                                >
                                                              ).propertyView({
                                                                label: config.label,
                                                                preInputNode: (
                                                                  <ChartBorderColorPropIcon title="BoxShadowColor-Type" />
                                                                ),
                                                                placeholder: props[name],
                                                                tooltip: getTooltip(name),
                                                              })
                                                              : name === 'chartTextColor'
                                                                ? (
                                                                  children[name] as InstanceType<
                                                                    typeof StringControl
                                                                  >
                                                                ).propertyView({
                                                                  label: config.label,
                                                                  preInputNode: (
                                                                    <ChartTextColorPropIcon title="BoxShadowColor-Type" />
                                                                  ),
                                                                  placeholder: props[name],
                                                                  tooltip: getTooltip(name),
                                                                })
                                                                  : name === 'boxShadow'
                                                                    ? (
                                                                        children[name] as InstanceType<
                                                                          typeof StringControl
                                                                        >
                                                                      ).propertyView({
                                                                        label: config.label,
                                                                        preInputNode: (
                                                                          <BoxShadowPropIcon title="BoxShadow-Type" />
                                                                        ),
                                                                        placeholder: props[name],
                                                                        tooltip: getTooltip(name),
                                                                      })
                                                                    : name === 'animation'
                                                                      ? (
                                                                          children[name] as InstanceType<
                                                                            typeof StringControl
                                                                          >
                                                                        ).propertyView({
                                                                          label: config.label,
                                                                          preInputNode: (
                                                                            <AnimationPropIcon title="Animation-Type" />
                                                                          ),
                                                                          placeholder: props[name],
                                                                          tooltip: getTooltip(name),
                                                                        })
                                                                      : name === 'animationDelay'
                                                                        ? (
                                                                            children[name] as InstanceType<
                                                                              typeof StringControl
                                                                            >
                                                                          ).propertyView({
                                                                            label: config.label,
                                                                            preInputNode: (
                                                                              <AnimationDelayPropIcon title="AnimationDelay-Type" />
                                                                            ),
                                                                            placeholder: props[name],
                                                                            tooltip: getTooltip(name),
                                                                          })
                                                                        : name === 'animationDuration'
                                                                          ? (
                                                                              children[name] as InstanceType<
                                                                                typeof StringControl
                                                                              >
                                                                            ).propertyView({
                                                                              label: config.label,
                                                                              preInputNode: (
                                                                                <AnimationDurationPropIcon title="AnimationDuration-Type" />
                                                                              ),
                                                                              placeholder: props[name],
                                                                              tooltip: getTooltip(name),
                                                                            })
                                                                            : name === 'padding' ||
                                                                                name ===
                                                                                  'containerHeaderPadding' ||
                                                                                name ===
                                                                                  'containerSiderPadding' ||
                                                                                name ===
                                                                                  'containerFooterPadding' ||
                                                                                name === 'containerBodyPadding'
                                                                              ? (
                                                                                  children[name] as InstanceType<
                                                                                    typeof StringControl
                                                                                  >
                                                                                ).propertyView({
                                                                                  label: config.label,
                                                                                  preInputNode: (
                                                                                    <PaddingIcon title="Padding" />
                                                                                  ),
                                                                                  placeholder: props[name],
                                                                                  tooltip: getTooltip(name),
                                                                                })
                                                                              : name === 'textSize'
                                                                                ? (
                                                                                    children[
                                                                                      name
                                                                                    ] as InstanceType<
                                                                                      typeof StringControl
                                                                                    >
                                                                                  ).propertyView({
                                                                                    label: config.label,
                                                                                    preInputNode: (
                                                                                      <StyledTextSizeIcon title="Font Size" />
                                                                                    ),
                                                                                    placeholder: props[name],
                                                                                    tooltip: getTooltip(name),
                                                                                  })
                                                                                : name === 'textWeight'
                                                                                  ? (
                                                                                      children[
                                                                                        name
                                                                                      ] as InstanceType<
                                                                                        typeof StringControl
                                                                                      >
                                                                                    ).propertyView({
                                                                                      label: config.label,
                                                                                      preInputNode: (
                                                                                        <StyledTextWeightIcon title="Font Weight" />
                                                                                      ),
                                                                                      placeholder: props[name],
                                                                                      tooltip: getTooltip(name),
                                                                                    })
                                                                                  : name === 'fontFamily'
                                                                                    ? (
                                                                                        children[
                                                                                          name
                                                                                        ] as InstanceType<
                                                                                          typeof StringControl
                                                                                        >
                                                                                      ).propertyView({
                                                                                        label: config.label,
                                                                                        preInputNode: (
                                                                                          <StyledFontFamilyIcon title="Font Family" />
                                                                                        ),
                                                                                        placeholder: props[name],
                                                                                        tooltip: getTooltip(name),
                                                                                      })
                                                                                    : name === 'textDecoration'
                                                                                      ? (
                                                                                          children[
                                                                                            name
                                                                                          ] as InstanceType<
                                                                                            typeof StringControl
                                                                                          >
                                                                                        ).propertyView({
                                                                                          label: config.label,
                                                                                          preInputNode: (
                                                                                            <StyledTextDecorationPropIcon title="Text Decoration" />
                                                                                          ),
                                                                                          placeholder: props[name],
                                                                                          tooltip: getTooltip(name),
                                                                                        })
                                                                                      : name === 'textTransform'
                                                                                        ? (
                                                                                            children[
                                                                                              name
                                                                                            ] as InstanceType<
                                                                                              typeof StringControl
                                                                                            >
                                                                                          ).propertyView({
                                                                                            label: config.label,
                                                                                            preInputNode: (
                                                                                              <StyledTextTransformIcon title="Text Transform" />
                                                                                            ),
                                                                                            placeholder: props[name],
                                                                                            tooltip: getTooltip(name),
                                                                                          })
                                                                                        : name === 'fontStyle'
                                                                                          ? (
                                                                                              children[
                                                                                                name
                                                                                              ] as InstanceType<
                                                                                                typeof StringControl
                                                                                              >
                                                                                            ).propertyView({
                                                                                              label: config.label,
                                                                                              preInputNode: (
                                                                                                <StyledTextStyleIcon title="Font Style" />
                                                                                              ),
                                                                                              placeholder: props[name],
                                                                                              tooltip: getTooltip(name),
                                                                                            })
                                                                                          : name ===
                                                                                                'backgroundImage' ||
                                                                                              name ===
                                                                                                'headerBackgroundImage' ||
                                                                                              name ===
                                                                                                'footerBackgroundImage'
                                                                                            ? (
                                                                                                children[
                                                                                                  name
                                                                                                ] as InstanceType<
                                                                                                  typeof StringControl
                                                                                                >
                                                                                              ).propertyView({
                                                                                                label:
                                                                                                  config.label,
                                                                                                preInputNode: (
                                                                                                  <StyledBackgroundImageIcon title="Background Image" />
                                                                                                ),
                                                                                                placeholder: props[name],
                                                                                                tooltip: getTooltip(name),
                                                                                              })
                                                                                            : name === 'backgroundImageRepeat' || name === 'headerBackgroundImageRepeat' || name === 'footerBackgroundImageRepeat'
                                                                                              ? (
                                                                                                  children[
                                                                                                    name
                                                                                                  ] as InstanceType<
                                                                                                    typeof StringControl
                                                                                                  >
                                                                                                ).propertyView({
                                                                                                  label:
                                                                                                    config.label,
                                                                                                  preInputNode: (
                                                                                                    <StyledBackgroundImageIcon title="Background Image Repeat" />
                                                                                                  ),
                                                                                                  placeholder: props[name],
                                                                                                  tooltip: getTooltip(name),
                                                                                                })
                                                                                                : name === 'backgroundImageSize' ||
                                                                                                name === 'headerBackgroundImageSize' ||
                                                                                                name === 'footerBackgroundImageSize'
                                                                                                ? (children[name] as InstanceType<typeof StringControl>).propertyView({
                                                                                                    label: config.label,
                                                                                                    preInputNode: <StyledBackgroundImageIcon title="Background Image Size" />,
                                                                                                    placeholder: props[name],
                                                                                                    tooltip: getTooltip(name),
                                                                                                  })
                                                                                                : name === 'backgroundImagePosition' ||
                                                                                                  name === 'headerBackgroundImagePosition' ||
                                                                                                  name === 'footerBackgroundImagePosition'
                                                                                                  ? (children[name] as InstanceType<typeof StringControl>).propertyView({
                                                                                                      label: config.label,
                                                                                                      preInputNode: <StyledBackgroundImageIcon title="Background Image Position" />,
                                                                                                      placeholder: props[name],
                                                                                                      tooltip: getTooltip(name),
                                                                                                    })
                                                                                                  : name === 'backgroundImageOrigin' ||
                                                                                                    name === 'headerBackgroundImageOrigin' ||
                                                                                                    name === 'footerBackgroundImageOrigin'
                                                                                                    ? (children[name] as InstanceType<typeof StringControl>).propertyView({
                                                                                                        label: config.label,
                                                                                                        preInputNode: <StyledBackgroundImageIcon title="Background Image Origin" />,
                                                                                                        placeholder: props[name],
                                                                                                        tooltip: getTooltip(name),
                                                                                                      })

                                                                                                      : name ===
                                                                                                          'rotation'
                                                                                                        ? (
                                                                                                            children[
                                                                                                              name
                                                                                                            ] as InstanceType<
                                                                                                              typeof StringControl
                                                                                                            >
                                                                                                          ).propertyView({
                                                                                                            label:
                                                                                                              config.label,
                                                                                                            preInputNode:
                                                                                                              (
                                                                                                                <RotationPropIcon title="Rotation" />
                                                                                                              ),
                                                                                                            placeholder: props[name],
                                                                                                            tooltip: getTooltip(name),
                                                                                                          })
                                                                                                          : name === 'lineHeight'  // Added lineHeight here
                                                                                                          ? (
                                                                                                            children[name] as InstanceType<typeof StringControl>
                                                                                                          ).propertyView({
                                                                                                          label: config.label,
                                                                                                          preInputNode: <LineHeightPropIcon title="Line Height" />,
                                                                                                          placeholder: props[name],
                                                                                                          tooltip: getTooltip(name),
                                                                                                        })
                                                                                                        : children[
                                                                                                            name
                                                                                                          ].propertyView({
                                                                                                            label:
                                                                                                              config.label,
                                                                                                            panelDefaultColor:
                                                                                                              props[name],
                                                                                                            // isDep: isDepColorConfig(config),
                                                                                                            isDep: true,
                                                                                                            depMsg:
                                                                                                              depMsg,
                                                                                                            allowGradient: config.name.includes('background'),
                                                                                                          })}
                  </div>
                );
              })}
          </StyleContent>
        </>
      );
    })
    .build();
}

export function useStyle<T extends readonly SingleColorConfig[]>(colorConfigs: T) {
  const theme = useContext(ThemeContext);
  const bgColor = useContext(BackgroundColorContext);
  type ColorMap = { [K in Names<T>]: string };
  const props = {} as ColorMap;
  colorConfigs.forEach((config) => {
    props[config.name as Names<T>] = "";
  });
  return calcColors(props, colorConfigs, theme?.theme, bgColor);

}
