import {ValueFromOption, AlignLeft, AlignCenter, AlignRight, AlignJustify} from "lowcoder-design";
import { dropdownControl } from "./dropdownControl";
import {MultiIconDisplay} from "@lowcoder-ee/comps/comps/multiIconDisplay";

const AlignOptions = [
  { label: <MultiIconDisplay identifier={AlignLeft} />, value: "left" },
  { label: <MultiIconDisplay identifier={AlignCenter} />, value: "center" },
  { label: <MultiIconDisplay identifier={AlignRight} />, value: "right" },
] as const;

export function alignControl(defaultValue: ValueFromOption<typeof AlignOptions> = "left") {
  return dropdownControl(AlignOptions, defaultValue);
}

const AlignOptionsWithJustify = [
  ...AlignOptions,
  { label: <MultiIconDisplay identifier={AlignJustify} />, value: "justify" },
] as const;

export function alignWithJustifyControl(
  defaultValue: ValueFromOption<typeof AlignOptions> = "left"
) {
  return dropdownControl(AlignOptionsWithJustify, defaultValue);
}
