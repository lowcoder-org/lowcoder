import { ValueFromOption } from "lowcoder-design";
import { dropdownControl } from "./dropdownControl";
import {MultiIconDisplay} from "@lowcoder-ee/comps/comps/multiIconDisplay";

const AlignOptions = [
  { label: <MultiIconDisplay identifier="/icon:svg/AlignLeft" />, value: "left" },
  { label: <MultiIconDisplay identifier="/icon:svg/AlignCenter" />, value: "center" },
  { label: <MultiIconDisplay identifier="/icon:svg/AlignRight" />, value: "right" },
] as const;

export function alignControl(defaultValue: ValueFromOption<typeof AlignOptions> = "left") {
  return dropdownControl(AlignOptions, defaultValue);
}

const AlignOptionsWithJustify = [
  ...AlignOptions,
  { label: <MultiIconDisplay identifier="/icon:svg/AlignJustify" />, value: "justify" },
] as const;

export function alignWithJustifyControl(
  defaultValue: ValueFromOption<typeof AlignOptions> = "left"
) {
  return dropdownControl(AlignOptionsWithJustify, defaultValue);
}
