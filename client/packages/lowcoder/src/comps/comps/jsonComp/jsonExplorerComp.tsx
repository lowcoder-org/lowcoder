import { ScrollBar } from "lowcoder-design";
import { UICompBuilder, withDefault } from "../../generators";
import { NameConfigHidden, NameConfig, withExposingConfigs } from "../../generators/withExposing";
import ReactJson, { type ThemeKeys } from "react-json-view";
import { defaultData } from "./jsonConstants";
import styled from "styled-components";
import { BoolControl } from "comps/controls/boolControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { ArrayOrJSONObjectControl, NumberControl } from "comps/controls/codeControl";
import { trans } from "i18n";
import React from "react";
import { AnimationStyle, AnimationStyleType } from "@lowcoder-ee/comps/controls/styleControlConstants";
import { styleControl } from "@lowcoder-ee/comps/controls/styleControl";
import { AutoHeightControl } from "@lowcoder-ee/comps/controls/autoHeightControl";
import {viewMode} from "@lowcoder-ee/util/editor";
const PropertyViewJsonExplorer =  React.lazy( async () => await import("./propertyView").then(module => ({default: module.PropertyViewJsonExplorer})))
/**
 * JsonExplorer Comp
 */

const themeOptions = [
  { label: trans("jsonExplorer.default"), value: "shapeshifter:inverted" },
  { label: trans("jsonExplorer.defaultDark"), value: "shapeshifter" },
  { label: trans("jsonExplorer.neutralLight"), value: "grayscale:inverted" },
  { label: trans("jsonExplorer.neutralDark"), value: "grayscale" },
  { label: trans("jsonExplorer.azure"), value: "apathy:inverted" },
  { label: trans("jsonExplorer.darkBlue"), value: "flat" },
];

const bgColorMap = {
  "shapeshifter:inverted": "#ffffff",
  shapeshifter: "#000000",
  "grayscale:inverted": "#ffffff",
  grayscale: "#000000",
  "apathy:inverted": "#efffff",
  flat: "#2c3e50",
};

const JsonExplorerContainer = styled.div<{
  $theme: keyof typeof bgColorMap;
  $animationStyle: AnimationStyleType;
}>`
  ${(props) => props.$animationStyle}
  height: 100%;
  overflow-y: scroll;
  background-color: ${(props) => bgColorMap[props.$theme] || '#ffffff'};
  border: 1px solid #d7d9e0;
  border-radius: 4px;
  padding: 10px;
`;

let JsonExplorerTmpComp = (function () {
  const childrenMap = {
    value: withDefault(ArrayOrJSONObjectControl, JSON.stringify(defaultData, null, 2)),
    autoHeight: withDefault(AutoHeightControl, 'auto'),
    showVerticalScrollbar:BoolControl,
    indent: withDefault(NumberControl, 4),
    expandToggle: BoolControl.DEFAULT_TRUE,
    theme: dropdownControl(themeOptions, 'shapeshifter:inverted'),
    animationStyle:styleControl(AnimationStyle, 'animationStyle'),
  };
  let builder = new UICompBuilder(childrenMap, (props) => {
    return (
      <JsonExplorerContainer
        $theme={props.theme as keyof typeof bgColorMap}
        $animationStyle={props.animationStyle}
      >
        <ScrollBar hideScrollbar={!props.showVerticalScrollbar}>
          <ReactJson
            name={false}
            src={props.value}
            theme={props.theme as ThemeKeys}
            collapsed={!props.expandToggle}
            displayDataTypes={false}
            indentWidth={props.indent}
          />
        </ScrollBar>
      </JsonExplorerContainer>
    );
  })
  if (viewMode() === "edit") {
    builder.setPropertyViewFn((children) => <PropertyViewJsonExplorer {...children}></PropertyViewJsonExplorer>);
  }
      return builder
    .build();
})();

JsonExplorerTmpComp = class extends JsonExplorerTmpComp {
  override autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }
};

export const JsonExplorerComp = withExposingConfigs(JsonExplorerTmpComp, [
  new NameConfig("value", trans("jsonExplorer.valueDesc")),
  NameConfigHidden,
]);
