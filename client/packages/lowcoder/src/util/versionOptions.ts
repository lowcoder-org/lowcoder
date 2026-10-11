import { CheckboxOptionType } from "antd";

export function getVersionOptions(version?: string): Array<CheckboxOptionType> {
  if (!version) {
    return [
      { label: "v1.0.0", value: "v1.0.0" },
      { label: "v0.1.0", value: "v0.1.0" },
    ];
  }
  const [major, minor, patch] = version.slice(1).split(".");
  return [
    {
      label: ["v" + (Number(major) + 1), 0, 0].join("."),
      value: ["v" + (Number(major) + 1), 0, 0].join("."),
    },
    {
      label: ["v" + major, Number(minor) + 1, 0].join("."),
      value: ["v" + major, Number(minor) + 1, 0].join("."),
    },
    {
      label: ["v" + major, minor, Number(patch) + 1].join("."),
      value: ["v" + major, minor, Number(patch) + 1].join("."),
    },
  ];
}
