import _ from "lodash";
import { useEffect, useState } from "react";
import { ConfigItem, Radius, Margin, Padding } from "../pages/setting/theme/styledComponents";
import { isValidColor, toHex } from "components/colorSelect/colorUtils";
import { ColorSelect } from "components/colorSelect";
import { TacoInput } from "components/tacoInput";

import { ExpandIcon, CompressIcon } from "lowcoder-design";

export type configChangeParams = {
  colorKey: string;
  color?: string;
  radius?: string;
  chart?: string;
  margin?: string;	
  padding?: string;
};

type ColorConfigProps = {
  className?: string;
  colorKey: string;
  name?: string;
  desc?: string;
  color?: string;
  radius?: string;
  configChange: (params: configChangeParams) => void;
  showVarName?: boolean;
  margin?: string;	
  padding?: string;
};

export default function ColorPicker(props: ColorConfigProps) {
  const {
    colorKey,
    name,
    desc,
    color: defaultColor,
    radius: defaultRadius,
    configChange,
    showVarName = true,
    margin: defaultMargin,	
    padding: defaultPadding,
  } = props;
  const configChangeWithDebounce = _.debounce(configChange, 0);
  const [color, setColor] = useState(defaultColor);
  const [radius, setRadius] = useState(defaultRadius);

  const [margin, setMargin] = useState(defaultMargin);	
  const [padding, setPadding] = useState(defaultPadding);

  const varName = `(${colorKey})`;

  const colorInputBlur = () => {
    if (!color || !isValidColor(color)) {
      setColor(defaultColor);
    } else {
      setColor(toHex(color));
      configChange({ colorKey, color: toHex(color) });
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
    configChange({ colorKey, radius: result });
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
    configChange({ colorKey, margin: result });	
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
    configChange({ colorKey, padding: result });	
  };

  useEffect(() => {
    if (color && isValidColor(color)) {
      configChangeWithDebounce({ colorKey, color });
    }
  }, [color]);

  // reset
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

  return (
    <ConfigItem className={props.className}>
      <div className="text-desc">
        <div className="name">
          {name} {showVarName && <span>{varName}</span>}
        </div>
        <div className="desc">{desc}</div>
      </div>
      {colorKey !== "borderRadius" &&	
        colorKey !== "margin" &&	
        colorKey !== "padding" && (
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
      {colorKey === "borderRadius" && (
        <div className="config-input">
          <Radius radius={defaultRadius || "0"}>
            <div>
              <div />
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
      {colorKey === "margin" && (	
        <div className="config-input">	
          <Margin margin={defaultMargin || "3px"}>	
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
      {colorKey === "padding" && (	
        <div className="config-input">	
          <Padding padding={defaultPadding || "3px"}>	
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
    </ConfigItem>
  );
}
