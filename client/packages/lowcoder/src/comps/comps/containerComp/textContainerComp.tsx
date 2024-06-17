import { BoolCodeControl, StringControl } from "comps/controls/codeControl";
import { stringExposingStateControl } from "comps/controls/codeStateControl";
import { ToDataType } from "comps/generators/multi";
import {
  NameConfigHidden,
  withExposingConfigs,
} from "comps/generators/withExposing";
import { NameGenerator } from "comps/utils/nameGenerator";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { CompParams } from "lowcoder-core";
import { Section, sectionNames } from "lowcoder-design";
import { oldContainerParamsToNew } from "../containerBase";
import { toSimpleContainerData } from "../containerBase/simpleContainerComp";
import {
  ContainerChildren,
  ContainerCompBuilder,
} from "../triContainerComp/triContainerCompBuilder";
import { TriContainer } from "../triContainerComp/triFloatTextContainer";
import { dropdownControl } from "comps/controls/dropdownControl";
import { withDefault } from "comps/generators/simpleGenerators";
import { styleControl } from "comps/controls/styleControl";
import { AnimationStyle, TextContainerStyle } from "comps/controls/styleControlConstants";
import { useContext } from "react";
import { EditorContext } from "comps/editorState";
import { alignWithJustifyControl } from "comps/controls/alignControl";

const typeOptions = [
  {
    label: "Markdown",
    value: "markdown",
  },
  {
    label: trans("text"),
    value: "text",
  },
] as const;

const floatOptions = [
  {
    label: "None",
    value: "none",
  },
  {
    label: "Right",
    value: "right",
  },
  {
    label: "Left",
    value: "left",
  },
] as const;


export const ContainerBaseComp = (function () {
  const childrenMap = {
    disabled: BoolCodeControl,
    text: stringExposingStateControl(
      "text", "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi feugiat faucibus eleifend. Pellentesque eleifend, risus vel sagittis mattis, mauris ipsum tempor sapien, eu lobortis lacus libero a dui. Cras erat felis, rhoncus vestibulum consectetur et, ultrices ut purus. Sed a tortor orci. Vestibulum nec eleifend ante."
    ),
    type: dropdownControl(typeOptions, "markdown"),
    float: dropdownControl(floatOptions, "left"),
    horizontalAlignment: alignWithJustifyControl(),
    width: withDefault(StringControl, "40"),
    style: styleControl(TextContainerStyle),
    animationStyle: styleControl(AnimationStyle),
  };
  return new ContainerCompBuilder(childrenMap, (props, dispatch) => {
    return <TriContainer {...props} />;
  })
    .setPropertyViewFn((children) => {
      return (
        <>
          <Section name={sectionNames.basic}>
            {children.type.propertyView({label: trans("value"), tooltip: trans("textShow.valueTooltip"), radioButton: true,})}
            {children.text.propertyView({})}
          </Section>

          {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
            <Section name={sectionNames.interaction}>
              {hiddenPropertyView(children)}
            </Section>
          )}
          {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
            <>
              <Section name={sectionNames.layout}>
                {children.container.getPropertyView()}
                {children.width.propertyView({label: trans("container.flowWidth")})}
                {children.float.propertyView({ label: trans("container.floatType"), radioButton: true,
                })}
                {children.horizontalAlignment.propertyView({
                  label: trans("textShow.horizontalAlignment"),
                  radioButton: true,
                })}
              </Section>
              <Section name={"Floating Text Style"}>
                {children.style.getPropertyView()}
              </Section>
              <Section name={sectionNames.animationStyle} hasTooltip={true}>
                {children.animationStyle.getPropertyView()}
              </Section>
              <Section name={"Container Style"}>
                {children.container.stylePropertyView()}
              </Section>
              {children.container.children.showHeader.getView() && (
                <Section name={"Header Style"}>
                  { children.container.headerStylePropertyView() }
                </Section>
              )}
              {children.container.children.showBody.getView() && (
                <Section name={"Body Style"}>
                  { children.container.bodyStylePropertyView() }
                </Section>
              )}
              {children.container.children.showFooter.getView() && (
                <Section name={"Footer Style"}>
                  { children.container.footerStylePropertyView() }
                </Section>
              )}
            </>
          )}
        </>
      );
    })
    .build();
})();

// Compatible with old data
function convertOldContainerParams(params: CompParams<any>) {
  // convert older params to old params
  let tempParams = oldContainerParamsToNew(params);

  if (tempParams.value) {
    const container = tempParams.value.container;
    // old params
    if (
      container &&
      (container.hasOwnProperty("layout") || container.hasOwnProperty("items"))
    ) {
      const autoHeight = tempParams.value.autoHeight;
      return {
        ...tempParams,
        value: {
          container: {
            showHeader: false,
            body: { 0: { view: container } },
            showBody: true,
            showFooter: false,
            autoHeight: autoHeight,
          },
        },
      };
    }
  }
  return tempParams;
}

class ContainerTmpComp extends ContainerBaseComp {
  constructor(params: CompParams<any>) {
    super(convertOldContainerParams(params));
  }
}

export const ContainerComp = withExposingConfigs(ContainerTmpComp, [
  NameConfigHidden,
]);

type ContainerDataType = ToDataType<ContainerChildren<{}>>;

export function defaultContainerData(
  compName: string,
  nameGenerator: NameGenerator
): ContainerDataType {
  return {
    container: {
      header: toSimpleContainerData([
        {
          item: {
            compType: "text",
            name: nameGenerator.genItemName("containerTitle"),
            comp: {
              text: "### " + trans("container.title"),
            },
          },
          layoutItem: {
            i: "",
            h: 5,
            w: 24,
            x: 0,
            y: 0,
          },
        },
      ])
    },
  };
}
