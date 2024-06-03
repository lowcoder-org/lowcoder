import _ from "lodash";
import { useEffect, useState } from "react";
import { ConfigItem, Radius, Margin, Padding, GridColumns, BorderWidth, BorderStyle } from "../pages/setting/theme/styledComponents";
import { isValidColor, toHex } from "components/colorSelect/colorUtils";
import { ColorSelect } from "components/colorSelect";
import { TacoInput } from "components/tacoInput";
import { Slider } from "antd";
import { 
  ExpandIcon, 
  CompressIcon,
  BorderRadiusIcon,
  BorderWidthIcon,
  BorderStyleIcon,
  TableCellsIcon,
  RefreshLineIcon,
  OpacityIcon,
  ShadowIcon,
  StarSmileIcon,
  TimerFlashIcon,
  Timer2Icon,
  TextSizeIcon,
  TextWeightIcon,
  FontFamilyIcon,
  TextTransformationIcon,
  TextDecorationIcon,
  TextStyleIcon,
  ImageCompIconSmall,
  RotationIcon,
 } from "lowcoder-design/src/icons";
import { trans } from "i18n";

export type configChangeParams = {
  themeSettingKey: string;
  color?: string;
  radius?: string;
  chart?: string;
  margin?: string;  
  padding?: string;
  gridColumns?: string; // Added By Aqib Mirza
  borderStyle?: string;
  borderColor?: string;
  borderWidth?: string;
  fontFamily?: string;
};

type ColorConfigProps = {
  className?: string;
  themeSettingKey: string;
  name?: string;
  desc?: string;
  color?: string;
  
  configChange: (params: configChangeParams) => void;
  showVarName?: boolean;
  radius?: string;
  borderStyle?: string;
  borderWidth?: string;
  borderColor?: string;
  fontFamily?: string;
  margin?: string;  
  padding?: string;
  gridColumns?: string; // Added By Aqib Mirza
};

const isColorStyle = (styleKey: string) => {
  return styleKey !== 'radius' &&
    styleKey !== 'borderWidth' &&
    styleKey !== 'boxShadow' &&
    styleKey !== 'animationIterationCount' &&
    styleKey !== 'opacity' &&
    styleKey !== 'animation' &&
    styleKey !== 'animationDelay' &&
    styleKey !== 'animationDuration' &&
    styleKey !== 'rotation' &&
    styleKey !== 'cardRadius' &&
    styleKey !== 'textSize' &&
    styleKey !== 'textWeight' &&
    styleKey !== 'textTransform' &&
    styleKey !== 'textDecoration' &&
    styleKey !== 'fontFamily' &&
    styleKey !== 'borderStyle' &&
    styleKey !== 'fontStyle' &&
    styleKey !== 'backgroundImage' &&
    styleKey !== 'backgroundImageRepeat' &&
    styleKey !== 'backgroundImageSize' &&
    styleKey !== 'backgroundImagePosition' &&
    styleKey !== 'backgroundImageOrigin' &&
    styleKey !== 'headerBackgroundImage' &&
    styleKey !== 'headerBackgroundImageRepeat' &&
    styleKey !== 'headerBackgroundImageSize' &&
    styleKey !== 'headerBackgroundImagePosition' &&
    styleKey !== 'headerBackgroundImageOrigin' &&
    styleKey !== 'footerBackgroundImage' &&
    styleKey !== 'footerBackgroundImageRepeat' &&
    styleKey !== 'footerBackgroundImageSize' &&
    styleKey !== 'footerBackgroundImagePosition' &&
    styleKey !== 'footerBackgroundImageOrigin' &&
    styleKey !== 'margin' &&
    styleKey !== 'padding' &&
    styleKey !== 'containerHeaderPadding' &&
    styleKey !== 'containerSiderPadding' &&
    styleKey !== 'containerFooterPadding' &&
    styleKey !== 'containerBodyPadding';
}


type CompStyleProps = {
  styleOptions: string[];
  defaultStyle: Record<string, string>;
  configChange: (params: any) => void;
}

export default function ThemeSettingsCompStyles(props: CompStyleProps) {
  const { defaultStyle, styleOptions, configChange } = props;
  const [compStyle, setCompStyle] = useState(defaultStyle)
  
  console.log('defaultStyle', defaultStyle);

  const handleChange = (styleKey: string, styleValue: string) => {
    setCompStyle((style) => {
      const updateStyles = {
        ...style,
        [styleKey]: styleValue,
      };
      configChange(updateStyles);
      return updateStyles;
    });
  }

  const configChangeWithDebounce = _.debounce(configChange, 0);
  const handleChangeWithDebounce = _.debounce(handleChange, 0);

  useEffect(() => {
    console.log(compStyle);
  }, [compStyle]);


  const getLabelByStyle = (styleKey: string) => {
    let label = styleKey;
    switch(styleKey) {
      case 'radius': 
      case 'cardRadius':
      case 'gap': {
        label = trans("style.borderRadius");
        break;
      }
      // case 'borderWidth':
      // case 'borderStyle':
      // case 'margin': 
      // case 'padding':
      // case 'containerHeaderPadding':
      // case 'containerSiderPadding':
      // case 'containerFooterPadding':
      // case 'containerBodyPadding':
      // case 'opacity':
      // case 'boxShadowColor':
      // case 'boxShadow':
      // case 'animationIterationCount':
      // case 'animation':
      // case 'animationDelay':
      // case 'animationDuration':
      // case 'textSize':
      // case 'textWeight':
      // case 'fontFamily':
      // case 'textDecoration':
      // case 'textTransform':
      // case 'fontStyle':
      // case 'backgroundImage':
      // case 'headerBackgroundImage':
      // case 'footerBackgroundImage':
      // case 'backgroundImageRepeat':
      // case 'headerBackgroundImageRepeat':
      // case 'footerBackgroundImageRepeat':
      // case 'rotation': {
      //   label = trans(`style.${styleKey}`);
      //   break;
      // }
      default: {
        label = trans(`style.${styleKey}`);
        break;
      }
    }
    return label;
  }

  const getPlaceholderByStyle = (styleKey: string) => {
    let placeholder = '';
    switch(styleKey) {
      case 'radius':
      case 'cardRadius':
      case 'gap': {
        placeholder = '';
        break;
      }
      case 'borderWidth': {
        placeholder = '';
        break;
      }
      case 'borderStyle': {
        placeholder = '';
        break;
      }
      case 'margin': {
        placeholder = '';
        break;
      }
      case 'padding':
      case 'containerHeaderPadding':
      case 'containerSiderPadding':
      case 'containerFooterPadding':
      case 'containerBodyPadding': {
        placeholder = '';
        break;
      }
      case 'opacity': {
        placeholder = '';
        break;
      }
      case 'boxShadowColor': {
        placeholder = '';
        break;
      }
      case 'boxShadow': {
        placeholder = '';
        break;
      }
      case 'animationIterationCount': {
        placeholder = '';
        break;
      }
      case 'animation': {
        placeholder = '';
        break;
      }
      case 'animationDelay': {
        placeholder = '';
        break;
      }
      case 'animationDuration': {
        placeholder = '';
        break;
      }
      case 'textSize': {
        placeholder = '';
        break;
      }
      case 'textWeight': {
        placeholder = '';
        break;
      }
      case 'fontFamily': {
        placeholder = '';
        break;
      }
      case 'textDecoration': {
        placeholder = '';
        break;
      }
      case 'textTransform': {
        placeholder = '';
        break;
      }
      case 'fontStyle': {
        placeholder = '';
        break;
      }
      case 'backgroundImage':
      case 'headerBackgroundImage':
      case 'footerBackgroundImage': {
        placeholder = '';
        break;
      }
      case 'backgroundImageRepeat':
      case 'headerBackgroundImageRepeat':
      case 'footerBackgroundImageRepeat': {
        placeholder = '';
        break;
      }
      case 'rotation': {
        placeholder = '';
        break;
      }
    }
    return placeholder;
  }

  const getIconByStyle = (styleKey: string) => {
    let icon = null;
    switch(styleKey) {
      case 'radius':
      case 'cardRadius':
      case 'gap': {
        icon = <BorderRadiusIcon style={{width: "16px", margin: "-2px 0 2px -2px", padding: "0px"}}/>;
        break;
      }
      case 'borderWidth': {
        icon = <BorderWidthIcon style={{width: "16px", margin: "2px 0 0 2px", padding: "0px"}}/>;
        break;
      }
      case 'borderStyle': {
        icon = <BorderStyleIcon style={{width: "16px", margin: "2px 0 0 2px", padding: "0px"}}/>;
        break;
      }
      case 'margin': {
        icon = <ExpandIcon style={{width: "16px", margin: "2px 0 0 2px", padding: "0px"}}/>;
        break;
      }
      case 'padding':
      case 'containerHeaderPadding':
      case 'containerSiderPadding':
      case 'containerFooterPadding':
      case 'containerBodyPadding': {
        icon = <CompressIcon style={{width: "16px", margin: "2px 0 0 2px", padding: "0px"}}/>;
        break;
      }
      case 'opacity': {
        icon = <OpacityIcon style={{width: "16px", margin: "2px 0 0 2px", padding: "0px"}}/>;
        break;
      }
      case 'boxShadowColor': {
        icon = <BorderWidthIcon style={{width: "16px", margin: "2px 0 0 2px", padding: "0px"}}/>;
        break;
      }
      case 'boxShadow': {
        icon = <ShadowIcon style={{width: "16px", margin: "2px 0 0 2px", padding: "0px"}}/>;
        break;
      }
      case 'animationIterationCount': {
        icon = <RefreshLineIcon style={{width: "16px", margin: "2px 0 0 2px", padding: "0px"}}/>;
        break;
      }
      case 'animation': {
        icon = <StarSmileIcon style={{width: "16px", margin: "2px 0 0 2px", padding: "0px"}}/>;
        break;
      }
      case 'animationDelay': {
        icon = <TimerFlashIcon style={{width: "16px", margin: "2px 0 0 2px", padding: "0px"}}/>;
        break;
      }
      case 'animationDuration': {
        icon = <Timer2Icon style={{width: "16px", margin: "2px 0 0 2px", padding: "0px"}}/>;
        break;
      }
      case 'textSize': {
        icon = <TextSizeIcon style={{width: "16px", margin: "2px 0 0 2px", padding: "0px"}}/>;
        break;
      }
      case 'textWeight': {
        icon = <TextWeightIcon style={{width: "16px", margin: "2px 0 0 2px", padding: "0px"}}/>;
        break;
      }
      case 'fontFamily': {
        icon = <FontFamilyIcon style={{width: "16px", margin: "2px 0 0 2px", padding: "0px"}}/>;
        break;
      }
      case 'textDecoration': {
        icon = <TextDecorationIcon style={{width: "16px", margin: "2px 0 0 2px", padding: "0px"}}/>;
        break;
      }
      case 'textTransform': {
        icon = <TextTransformationIcon style={{width: "16px", margin: "2px 0 0 2px", padding: "0px"}}/>;
        break;
      }
      case 'fontStyle': {
        icon = <TextStyleIcon style={{width: "16px", margin: "2px 0 0 2px", padding: "0px"}}/>;
        break;
      }
      case 'backgroundImage':
      case 'headerBackgroundImage':
      case 'footerBackgroundImage': {
        icon = <ImageCompIconSmall style={{width: "16px", margin: "2px 0 0 2px", padding: "0px"}}/>;
        break;
      }
      case 'backgroundImageRepeat':
      case 'headerBackgroundImageRepeat':
      case 'footerBackgroundImageRepeat': {
        icon = <ImageCompIconSmall style={{width: "16px", margin: "2px 0 0 2px", padding: "0px"}}/>;
        break;
      }
      case 'rotation': {
        icon = <RotationIcon style={{width: "16px", margin: "2px 0 0 2px", padding: "0px"}}/>;
        break;
      }
    }
    return icon;
  }

  return (
    <div style={{
      border: "1px solid lightgray",
      borderRadius: "6px",
      marginBottom: "16px",
    }}>
      {styleOptions.map((styleKey: string) => (
        <ConfigItem style={{
          flexDirection: "row",
          alignItems: "center",
          margin: "0",
          padding: "6px",
          borderBottom: "1px solid lightgray",
        }}>
          <div className="text-desc" style={{
            width: "100px",
            minWidth: "auto",
            marginRight: "10px",
          }}>
            <div className="name">
              { getLabelByStyle(styleKey) }
            </div>
          </div>
          { isColorStyle(styleKey) ? (
            <div className="config-input" style={{minWidth: "auto", margin: "0"}}>
              <ColorSelect
                // changeColor={_.debounce(setColor, 500, {
                //   leading: true,
                //   trailing: true,
                // })}
                color={compStyle[styleKey]!}
                trigger="hover"
              />
              <TacoInput
                value={compStyle[styleKey]}
                onChange={(e) => {
                  handleChangeWithDebounce(styleKey, e.target.value);
                }}
                // onChange={(e) => setColor(e.target.value)}
                // onBlur={colorInputBlur}
                // onKeyUp={(e) => e.nativeEvent.key === "Enter" && colorInputBlur()}
              />
            </div>
          ): (
            <div className="config-input" style={{minWidth: "auto"}}>
              {/* <Radius $radius={compStyle[styleKey] || "0"}> */}
                <div>
                  {getIconByStyle(styleKey)}
                </div>
              {/* </Radius> */}
              <TacoInput
                placeholder={getPlaceholderByStyle(styleKey)}
                value={compStyle[styleKey]}
                onChange={(e) => {
                  handleChangeWithDebounce(styleKey, e.target.value);
                  // setCompStyle((style) => ({
                  //   ...style,
                  //   [styleKey]: e.target.value,
                  // }))
                }}
                // onBlur={(e) => radiusInputBlur(e.target.value)}
                // onKeyUp={(e) => e.nativeEvent.key === "Enter" && radiusInputBlur(e.currentTarget.value)}
              />
            </div>
          )}
        </ConfigItem>
      ))}
    </div>
  )
}
