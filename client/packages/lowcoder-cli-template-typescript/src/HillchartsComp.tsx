import {
  UICompBuilder,
  NameConfig,
  NumberControl,
  Section,
  withDefault,
  withExposingConfigs,
  eventHandlerControl,
  styleControl,
  toJSONObjectArray,
  jsonControl,
  AutoHeightControl,
  EditorContext,
} from "lowcoder-sdk";

import styles from "./styles.module.css";

import { i18nObjs, trans } from "./i18n/comps";

import { Chart } from './vendors'
import { useContext, useEffect, useRef, useState } from "react";


export const CompStyles = [
  {	
    name: "margin",	
    label: trans("style.margin"),
    margin: "margin",	
  },
  {	
    name: "padding",	
    label: trans("style.padding"),
    padding: "padding",	
  },
  {	
    name: "textSize",
    label: trans("style.textSize"),
    textSize: "textSize",	
  },
  {	
    name: "backgroundColor",
    label: trans("style.backgroundColor"),
    backgroundColor: "backgroundColor",	
  },
  {	
    name: "border",
    label: trans("style.border"),
    border: "border",	
  },
  {
    name : "radius",
    label : trans("style.borderRadius"),
    radius : "radius",
  },
  {
    name : "borderWidth",
    label : trans("style.borderWidth"),
    borderWidth : "borderWidth",
  }
] as const;



// const HillchartsCompBase = new UICompBuilder(childrenMap, (props: any) => {
let HillchartsCompBase = (function () {

  const childrenMap = {
    styles: styleControl(CompStyles),
    autoHeight: withDefault(AutoHeightControl, "auto"),
    data: jsonControl(toJSONObjectArray, i18nObjs.defaultData),
    onEvent: eventHandlerControl([
      {
        label: "onChange",
        value: "change",
        description: "Triggers when Chart data changes",
      },
    ]),
  };
  
  return new UICompBuilder(childrenMap, (props: { onEvent: (arg0: string) => void; styles: { backgroundColor: any; border: any; radius: any; borderWidth: any; margin: any; padding: any; textSize: any; }; data: any[] | null | undefined; }) => {
  const handleDataChange = () => {
    props.onEvent("change");
  };

  const conRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 250 });

  useEffect(() => {
    if (conRef.current) {
      setDimensions({
        width: conRef.current.clientWidth,
        height: conRef.current.clientHeight
      });
    }
  }, []);

  return (
      <div ref={conRef} className={styles.wrapper} style={{
          display: "flex",
          justifyContent: "center",
          height: `100%`,
          width: `100%`,
          backgroundColor: `${props.styles.backgroundColor}`,
          borderColor: `${props.styles.border}`,
          borderRadius: `${props.styles.radius}`,
          borderWidth: `${props.styles.borderWidth}`,
          margin: `${props.styles.margin}`,
          padding: `${props.styles.padding}`,
          fontSize: `${props.styles.textSize}`,
        }}>
        <Chart data={props.data} height={dimensions.height} width={dimensions.width} onDataChange={handleDataChange}/>
      </div>
  );
})
.setPropertyViewFn((children: any) => {
  return (
    <>
      <Section name="Basic">
        {children.data.propertyView({ label: "Data" })}
      </Section>
      <Section name="Interaction">
        {children.onEvent.propertyView()}
      </Section>
      <Section name="Styles">
        {children.autoHeight.getPropertyView()}
        {children.styles.getPropertyView()}
      </Section>
    </>
  );
})
.build();
})();

HillchartsCompBase = class extends HillchartsCompBase {
  autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }
};

export default withExposingConfigs(HillchartsCompBase, [
  new NameConfig("data", trans("component.data")),
]);
