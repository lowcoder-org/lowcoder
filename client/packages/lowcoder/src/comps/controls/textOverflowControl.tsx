import { trans } from "i18n";
import { ControlParams } from "./controlParams";
import { dropdownAbstractControl } from "./dropdownControl";

const overflowOptions = [
  {
    label: trans("textOverflowProp.ellipsis"),
    value: "ellipsis",
  },
  {
    label: trans("textOverflowProp.wrap"),
    value: "wrap",
  },
] as const;

const TextOverflowTmpControl = dropdownAbstractControl(overflowOptions, "ellipsis");
export class TextOverflowControl extends TextOverflowTmpControl {
  override getView() {
    return this.value !== "ellipsis";
  }

  override getPropertyView() {
    return this.propertyView({ label: trans("prop.textOverflow") });
  }

  override propertyView(params: ControlParams) {
    return super.propertyView({ radioButton: true, ...params });
  }
}
