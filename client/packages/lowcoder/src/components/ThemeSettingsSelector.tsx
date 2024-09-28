import _ from "lodash";
import { useEffect, useState } from "react";
import { ConfigItem, Radius, Margin, Padding, GridColumns, BorderWidth, BorderStyle } from "../pages/setting/theme/styledComponents";
import { isValidColor, toHex } from "components/colorSelect/colorUtils";
import { ColorSelect } from "components/colorSelect";
import { TacoInput } from "components/tacoInput";
import { Slider, Switch } from "antd";
import { 
  ExpandIcon, 
  CompressIcon,
  BorderRadiusIcon,
  BorderWidthIcon,
  BorderStyleIcon,
  TableCellsIcon,
 } from "lowcoder-design/src/icons";

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
  components?: Record<string, object>,
  showComponentLoadingIndicators?: boolean;
  showDataLoadingIndicators?: boolean;
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
  showComponentLoadingIndicators?: boolean;
  showDataLoadingIndicators?: boolean;
};

export default function ThemeSettingsSelector(props: ColorConfigProps) {
  const {
    themeSettingKey,
    name,
    desc,
    color: defaultColor,
    radius: defaultRadius,
    configChange,
    showVarName = true,
    margin: defaultMargin,  
    padding: defaultPadding,
    gridColumns: defaultGridColumns,
    borderStyle: defaultBorderStyle,
    borderWidth: defaultBorderWidth,
    borderColor: defaultBorderColor,
    fontFamily: defaultFontFamily,
    showComponentLoadingIndicators: defaultShowComponentLoaders,
    showDataLoadingIndicators: defaultShowDataLoaders,
  } = props;
  
  const configChangeWithDebounce = _.debounce(configChange, 0);
  const [color, setColor] = useState(defaultColor);
  const [radius, setRadius] = useState(defaultRadius);
  const [margin, setMargin] = useState(defaultMargin);  
  const [padding, setPadding] = useState(defaultPadding);
  const [gridColumns, setGridColumns] = useState(defaultGridColumns); 
  const [borderStyle, setBorderStyle] = useState(defaultBorderStyle);
  const [borderWidth, setBorderWidth] = useState(defaultBorderWidth);
  const [borderColor, setBorderColor] = useState(defaultBorderColor);
  const [fontFamily, setFontFamily] = useState(defaultFontFamily);
  const [showComponentLoaders, setComponentLoaders] = useState(defaultShowComponentLoaders);
  const [showDataLoaders, setDataLoaders] = useState(defaultShowDataLoaders);

  const varName = `(${themeSettingKey})`;

  const colorInputBlur = () => {
    if (!color || !isValidColor(color)) {
      setColor(defaultColor);
    } else {
      setColor(toHex(color));
      configChange({ themeSettingKey, color: toHex(color) });
    }
  };

  const radiusInputBlur = (radius: string) => {
    let result = "";
    if (!radius || Number(radius) === 0) {
      result = "0";
    } else if (/^[0-9]+$/.test(radius)) {
      result = Number(radius) + "px";
    } else if (/^[0-9]+(px|%)$/.test(radius)) {
      result = radius;
    } else {
      result = "0";
    }
    setRadius(result);
    configChange({ themeSettingKey, radius: result });
  };

  const marginInputBlur = (margin: string) => {  
    let result = "";  
    if (!margin || Number(margin) === 0) {  
      result = "0";  
    } else if (/^[0-9]+$/.test(margin)) {  
      result = Number(margin) + "px";  
    } else if (/^[0-9]+(px|%)$/.test(margin)) {  
      result = margin;  
    } else {  
      result = "3px";  
    }  
    setMargin(result);  
    configChange({ themeSettingKey, margin: result });  
  };

  const paddingInputBlur = (padding: string) => {  
    let result = "";  
    if (!padding || Number(padding) === 0) {  
      result = "0";  
    } else if (/^[0-9]+$/.test(padding)) {  
      result = Number(padding) + "px";  
    } else if (/^[0-9]+(px|%)$/.test(padding)) {  
      result = padding;  
    } else {  
      result = "3px";  
    }  
    setPadding(result);  
    configChange({ themeSettingKey, padding: result });  
  };

  const gridColumnsInputBlur = (gridColumns: string) => {
    let result = "";
    if (!gridColumns) {
      result = "24";
    } else {
      result = gridColumns;
    }
    setGridColumns(result);
    configChange({ themeSettingKey, gridColumns: result });
  };

  const borderStyleInputBlur = (borderStyle: string) => {
    let result = "";
    if (!borderStyle) {
      result = "solid";
    } else {
      result = borderStyle;
    }
    setBorderStyle(result);
    configChange({ themeSettingKey, borderStyle: result });
  };

  const borderWidthInputBlur = (borderWidth: string) => {
    let result = "";  
    if (!borderWidth || Number(borderWidth) === 0) {  
      result = "0";  
    } else if (/^[0-9]+$/.test(borderWidth)) {  
      result = Number(borderWidth) + "px";  
    } else if (/^[0-9]+(px|%)$/.test(borderWidth)) {  
      result = borderWidth;  
    } else {  
      result = "1px";  
    }  
    setBorderWidth(borderWidth);
    configChange({ themeSettingKey, borderWidth: result });
  };

  const borderColorInputBlur = (borderColor: string) => {
    setBorderColor(borderColor);
    configChange({ themeSettingKey, borderColor });
  };

  const fontFamilyInputBlur = (fontFamily: string) => {
    let result = "";
    if (!fontFamily) {
      result = "Roboto, sans-serif";
    } else {
      result = fontFamily;
    }
    setFontFamily(result);
    configChange({ themeSettingKey, fontFamily: result });
  };


  useEffect(() => {
    if (color && isValidColor(color)) {
      configChangeWithDebounce({ themeSettingKey, color });
    }
  }, [color]);

  useEffect(() => {
    setColor(defaultColor);
  }, [defaultColor]);

  useEffect(() => {
    setRadius(defaultRadius);
  }, [defaultRadius]);

  useEffect(() => {  
    setMargin(defaultMargin);  
  }, [defaultMargin]);  

  useEffect(() => {  
    setPadding(defaultPadding);  
  }, [defaultPadding]);

  useEffect(() => {
    setGridColumns(defaultGridColumns);
  }, [defaultGridColumns]);

  useEffect(() => {
    setBorderStyle(defaultBorderStyle);
  }, [defaultBorderStyle]);

  useEffect(() => {
    setBorderWidth(defaultBorderWidth);
  }, [defaultBorderWidth]);

  useEffect(() => {
    setBorderColor(defaultBorderColor);
  }, [defaultBorderColor]);

  useEffect(() => {
    setFontFamily(defaultFontFamily);
  }, [defaultFontFamily]);

  useEffect(() => {
    setComponentLoaders(defaultShowComponentLoaders);
  }, [defaultShowComponentLoaders]);

  useEffect(() => {
    setDataLoaders(defaultShowDataLoaders);
  }, [defaultShowDataLoaders]);

  return (
    <ConfigItem className={props.className}>
      {themeSettingKey !== "showDataLoadingIndicators"
      && themeSettingKey !== "showComponentLoadingIndicators"
      && (
        <div className="text-desc">
          <div className="name">
            {name} {showVarName && <span>{varName}</span>}
          </div>
          <div className="desc">{desc}</div>
        </div>
      )}
      
      {themeSettingKey !== "radius" &&  
        themeSettingKey !== "margin" &&  
        themeSettingKey !== "padding" && 
        themeSettingKey !== "gridColumns" &&
        themeSettingKey !== "borderStyle" &&
        themeSettingKey !== "borderWidth" &&
        themeSettingKey !== "fontFamily" && 
        themeSettingKey !== "showComponentLoadingIndicators" && 
        themeSettingKey !== "showDataLoadingIndicators" && (
        <div className="config-input">
          <ColorSelect
            changeColor={_.debounce(setColor, 500, {
              leading: true,
              trailing: true,
            })}
            color={color!}
            trigger="hover"
          />
          <TacoInput
            value={color}
            onChange={(e) => setColor(e.target.value)}
            onBlur={colorInputBlur}
            onKeyUp={(e) => e.nativeEvent.key === "Enter" && colorInputBlur()}
          />
        </div>
      )}

      {/* // border Styles */}

      {/* {themeSettingKey === "borderColor" && (
        <div className="config-input">
          <ColorSelect
            changeColor={_.debounce(setBorderColor, 500, {
              leading: true,
              trailing: true,
            })}
            color={borderColor!}
            trigger="hover"
          />
          <TacoInput
            value={borderColor}
            onChange={(e) => setBorderColor(e.target.value)}
            onBlur={(e) => borderColorInputBlur(e.target.value)}
            onKeyUp={(e) => e.nativeEvent.key === "Enter" && borderColorInputBlur(e.currentTarget.value)}
          />
        </div>
      )} */}
      {themeSettingKey === "radius" && (
        <div className="config-input">
          <Radius $radius={defaultRadius || "0"}>
            <div>
              <BorderRadiusIcon style={{width: "16px", margin: "-2px 0 2px -2px", padding: "0px"}}/>
            </div>
          </Radius>
          <TacoInput
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            onBlur={(e) => radiusInputBlur(e.target.value)}
            onKeyUp={(e) => e.nativeEvent.key === "Enter" && radiusInputBlur(e.currentTarget.value)}
          />
        </div>
      )}
       {themeSettingKey === "borderStyle" && (
        <div className="config-input">
          <BorderStyle $borderStyle={defaultBorderStyle || "solid"}>
            <div>
              <BorderStyleIcon style={{width: "16px", margin: "2px 0 0 2px", padding: "0px"}}/>
            </div>
          </BorderStyle>
          <TacoInput
            value={borderStyle}
            onChange={(e) => setBorderStyle(e.target.value)}
            onBlur={(e) => borderStyleInputBlur(e.target.value)}
            onKeyUp={(e) => e.nativeEvent.key === "Enter" && borderStyleInputBlur(e.currentTarget.value)}
          />
        </div>
      )}
      {themeSettingKey === "borderWidth" && (
        <div className="config-input">
          <BorderWidth $borderWidth={defaultBorderWidth || "1px"}>
            <div>
              <BorderWidthIcon style={{width: "16px", margin: "2px 0 0 2px", padding: "0px"}}/>
            </div>
          </BorderWidth>
          <TacoInput
            value={borderWidth}
            onChange={(e) => setBorderWidth(e.target.value)}
            onBlur={(e) => borderWidthInputBlur(e.target.value)}
            onKeyUp={(e) => e.nativeEvent.key === "Enter" && borderWidthInputBlur(e.currentTarget.value)}
          />
        </div>
      )}

      {themeSettingKey === "margin" && (  
        <div className="config-input">  
          <Margin $margin={defaultMargin || "4px"}>  
            <div>  
              <ExpandIcon title="" />  
            </div>  
          </Margin>  
          <TacoInput  
            value={margin}  
            onChange={(e) => setMargin(e.target.value)}  
            onBlur={(e) => marginInputBlur(e.target.value)}  
            onKeyUp={(e) =>  
              e.nativeEvent.key === "Enter" &&  
              marginInputBlur(e.currentTarget.value)  
            }  
          />  
        </div>
      )}  

      {themeSettingKey === "padding" && (  
        <div className="config-input">  
          <Padding $padding={defaultPadding || "4px"}>  
            <div>  
              <CompressIcon title="" />
            </div>  
          </Padding>  
          <TacoInput  
            value={padding}  
            onChange={(e) => setPadding(e.target.value)}  
            onBlur={(e) => paddingInputBlur(e.target.value)}  
            onKeyUp={(e) =>  
              e.nativeEvent.key === "Enter" &&  
              paddingInputBlur(e.currentTarget.value)  
            }  
          />  
        </div>
      )}

      {themeSettingKey === "gridColumns" && (
        <div className="config-input">
          <GridColumns $gridColumns={defaultGridColumns || "24"}>
            <div>
              <TableCellsIcon title="" />
            </div>
          </GridColumns>

          <Slider 
            style={{ width: "90%", margin: "8px 5% 0 5%"}}
            min={8}  // Define the minimum value for the slider
            max={48} // Define the maximum value for the slider
            value={parseInt(gridColumns || "24")}
            onChange={(value) => setGridColumns(value.toString())}
            onChangeComplete={(value) => gridColumnsInputBlur(value.toString())}
          />
        </div>
      )}

      {themeSettingKey === "fontFamily" && (
        <div className="config-input">
          <TacoInput
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            onBlur={(e) => fontFamilyInputBlur(e.target.value)}
            onKeyUp={(e) => e.nativeEvent.key === "Enter" && fontFamilyInputBlur(e.currentTarget.value)}
          />
        </div>
      )}
      {themeSettingKey === "showComponentLoadingIndicators" && (
        <div style={{
          display: 'flex',
          gap: '6px',
          lineHeight: 'normal',
        }}>
          <Switch
            size="small"
            checked={showComponentLoaders}
            onChange={(value) => {
              setComponentLoaders(value)
              configChange({ themeSettingKey, showComponentLoadingIndicators: value});
            }}
          />
          <span>{name}</span>
        </div>
      )}

      {themeSettingKey === "showDataLoadingIndicators" && (
        <div style={{
          display: 'flex',
          gap: '6px',
          lineHeight: 'normal',
        }}>
          <Switch
            size="small"
            checked={showDataLoaders}
            onChange={(value) => {
              setDataLoaders(value)
              configChange({ themeSettingKey, showDataLoadingIndicators: value});
            }}
          />
          <span>{name}</span>
        </div>
      )}
    </ConfigItem>
  );
}
