import { trans } from "i18n";

export const ModeOptions = [
  { label: trans("navLayout.modeInline"), value: "inline" },
  { label: trans("navLayout.modeVertical"), value: "vertical" },
] as const;

export const DataOption = {
  Manual: 'manual',
  Json: 'json',
}
export const DataOptionType = [
  {
    label: trans("prop.manual"),
    value: DataOption.Manual,
  },
  {
    label: trans("prop.json"),
    value: DataOption.Json,
  },
];

export const menuItemStyleOptions = [
  {
    value: "normal",
    label: "Normal",
  },
  {
    value: "hover",
    label: "Hover",
  },
  {
    value: "active",
    label: "Active",
  }
];

export const jsonMenuItems = [
  {
    label: "Menu Item 1",
    key: 'menu-item-1',
    icon: "https://cdn-icons-png.flaticon.com/128/149/149338.png",
    action: {
      url: "https://www.lowcoder.cloud",
      newTab: false,
    },
    children: [
      {
        label: "Submenu Item 1",
        key: 'submenu-item-11',
        icon: "",
        action: {
          url: "https://www.lowcoder.cloud",
          newTab: false,
        },
      },
      {
        label: "Submenu Item 2",
        key: 'submenu-item-12',
        icon: "",
        action: {
          url: "https://www.lowcoder.cloud",
          newTab: false,
        },
      },
    ]
  },
  {
    label: "Menu Item 2",
    key: 'menu-item-2',
    icon: "https://cdn-icons-png.flaticon.com/128/149/149206.png",
    action: {
      url: "https://www.lowcoder.cloud",
      newTab: true,
    },
  }
]