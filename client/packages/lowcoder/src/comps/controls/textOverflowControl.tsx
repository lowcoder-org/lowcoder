import { trans } from "i18n";
import { ControlParams } from "./controlParams";
import { dropdownAbstractControl } from "./dropdownControl";

const overflowOptions = [
  {
    label: "Ellipsis", // trans("autoHeightProp.auto"),
    value: "ellipsis",
  },
  {
    label: "Wrap", // trans("autoHeightProp.fixed"),
    value: "wrap",
  },
] as const;

const TextOverflowTmpControl = dropdownAbstractControl(overflowOptions, "ellipsis");
export class TextOverflowControl extends TextOverflowTmpControl {
  override getView() {
    return this.value !== "ellipsis";
  }

  override getPropertyView() {
    return this.propertyView({ label: "Text Overflow"/*trans("prop.height")*/ });
  }

  override propertyView(params: ControlParams) {
    return super.propertyView({ radioButton: true, ...params });
  }
}
