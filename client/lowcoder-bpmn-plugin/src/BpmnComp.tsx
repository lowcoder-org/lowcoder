import {
  UICompBuilder,
  NameConfig,
  BoolControl,
  stringSimpleControl,
  JSONObjectControl,
  Section,
  withDefault,
  withExposingConfigs,
  eventHandlerControl,
  styleControl,
  stringExposingStateControl,
} from "lowcoder-sdk";
import styles from "./styles.module.css";
import { trans } from "./i18n/comps";
import { Bpmn } from "./vendors";


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


let BpmnComp = (function () {
  //Function to prevent unneeded redraws
  var _skipRedraw = false
  const skipRedraw = function(){
    var ret = _skipRedraw
    _skipRedraw = false
    return ret
  }

  const childrenMap = {
    styles: styleControl(CompStyles),
    xml : stringExposingStateControl("xml"),
    values: withDefault(JSONObjectControl),
    svgDownload : withDefault(BoolControl,false),
    imageName : stringSimpleControl(""), 
    designer : withDefault(BoolControl,false),
    showLogo : withDefault(BoolControl,true),
    onEvent: eventHandlerControl([
      {
        label: "onChange",
        value: "change",
        description: "Triggers when bpmn data changes",
      },
    ] as const),
  };
  
  return new UICompBuilder(childrenMap, (props: {
    onEvent: any;
    styles: { backgroundColor: any; border: any; radius: any; borderWidth: any; 
              margin: any; padding: any; textSize: any; };
    xml: any;
    values: object | null | undefined;
    svgDownload: boolean;
    imageName : string;
    designer: boolean;
    showLogo : boolean;
    autoHeight: boolean;
  }) => {
  const handleDataChange = (xml: string) => {
    if (props.onEvent) {
      _skipRedraw = true //We should not redraw the component
      props.xml.onChange(xml);
      props.onEvent("change");
      return false
    }
  };
  return (
    <div className={styles.wrapper} style={{
      height: "100%",
      width: "100%",
      backgroundColor: `${props.styles.backgroundColor}`,
      borderColor: `${props.styles.border}`,
      borderRadius: `${props.styles.radius}`,
      borderWidth: `${props.styles.borderWidth}`,
      margin: `${props.styles.margin}`,
      padding: `${props.styles.padding}`,
      fontSize: `${props.styles.textSize}`,
    }}>
      <Bpmn
        xml={props.xml.value}
        values={props.values}
        svgDownload={props.svgDownload}
        imageName={props.imageName}
        designer={props.designer}
        showLogo={props.showLogo}
        onDataChange={handleDataChange}
        skipRedraw={skipRedraw}
      />
    </div>
  );
})
.setPropertyViewFn((children: any) => {
  return (
    <>
      <Section name="Config">
        {children.xml.propertyView({ label: "xml" })}
        {children.values.propertyView({ label: "values" })}
        {children.svgDownload.propertyView({ label: "Download Image" })}
        {children.imageName.propertyView({ label: "Download Name" })}
        {children.designer.propertyView({ label: "Designer mode" })}
        {children.showLogo.propertyView({ label: "Show BPMN.io logo" })}
      </Section>
      <Section name="Interaction">
        {children.onEvent.propertyView()}
      </Section>
      <Section name="Styles">
        {children.styles.getPropertyView()}
      </Section>
    </>
  );
})
.build();
})();

export default withExposingConfigs(BpmnComp, [
   new NameConfig("xml", trans("component.xml")),
   new NameConfig("values", trans("component.values")),
   new NameConfig("svgDownload", trans("component.svgDownload")),
   new NameConfig("imageName", trans("component.imageName")),
   new NameConfig("designer", trans("component.designer")),
   new NameConfig("showLogo", trans("component.showLogo")),
]);
