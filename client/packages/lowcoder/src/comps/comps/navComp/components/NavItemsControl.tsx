import { BoolCodeControl, StringControl } from "comps/controls/codeControl";
import { clickEvent, eventHandlerControl } from "comps/controls/eventHandlerControl";
import { MultiCompBuilder } from "comps/generators/multi";
import { dropdownControl } from "comps/controls/dropdownControl";
import { mapOptionsControl } from "comps/controls/optionsControl";
import { trans } from "i18n";
import { navListComp } from "../navItemComp";
import { controlItem } from "lowcoder-design";
import { menuPropertyView } from "./MenuItemList";

export function createNavItemsControl() {
  const OptionTypes = [
    { label: trans("prop.manual"), value: "manual" },
    { label: trans("prop.map"), value: "map" },
  ] as const;

  const NavMapOption = new MultiCompBuilder(
    {
      label: StringControl,
      hidden: BoolCodeControl,
      disabled: BoolCodeControl,
      active: BoolCodeControl,
      onEvent: eventHandlerControl([clickEvent]),
    },
    (props) => props
  )
    .setPropertyViewFn((children) => (
      <>
        {children.label.propertyView({ label: trans("label"), placeholder: "{{item}}" })}
        {children.active.propertyView({ label: trans("navItemComp.active") })}
        {children.hidden.propertyView({ label: trans("hidden") })}
        {children.disabled.propertyView({ label: trans("disabled") })}
        {children.onEvent.getPropertyView()}
      </>
    ))
    .build();

  const TmpNavItemsControl = new MultiCompBuilder(
    {
      optionType: dropdownControl(OptionTypes, "manual"),
      manual: navListComp(),
      mapData: mapOptionsControl(NavMapOption),
    },
    (props) => {
      return props.optionType === "manual" ? props.manual : props.mapData;
    }
  )
    .setPropertyViewFn(() => {
      throw new Error("Method not implemented.");
    })
    .build();

  return class NavItemsControl extends TmpNavItemsControl {
    exposingNode() {
      return this.children.optionType.getView() === "manual"
        ? (this.children.manual as any).exposingNode()
        : (this.children.mapData as any).exposingNode();
    }

    propertyView() {
      const isManual = this.children.optionType.getView() === "manual";
      const content = isManual
        ? menuPropertyView(this.children.manual as any)
        : this.children.mapData.getPropertyView();

      return controlItem(
        { searchChild: true },
        <>
          {this.children.optionType.propertyView({ radioButton: true, type: "oneline" })}
          {content}
        </>
      );
    }
  };
}


