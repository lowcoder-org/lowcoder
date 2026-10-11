import { trans } from "i18n";

export const ModeOptions = [
  { label: trans("navLayout.modeInline"), value: "inline" },
  { label: trans("navLayout.modeVertical"), value: "vertical" },
  { label: trans("navLayout.modeHorizontal"), value: "horizontal" },
] as const;

// Desktop navigation position
export const NavPosition = {
  Top: "top",
  Left: "left",
  Bottom: "bottom",
  Right: "right",
} as const;

export const NavPositionOptions = [
  { label: "Top", value: NavPosition.Top },
  { label: "Left", value: NavPosition.Left },
  { label: "Bottom", value: NavPosition.Bottom },
  { label: "Right", value: NavPosition.Right },
] as const;

// Mobile navigation specific modes and options
export const MobileMode = {
  Vertical: "vertical",
  Hamburger: "hamburger",
} as const;

export const MobileModeOptions = [
  { label: "Normal", value: MobileMode.Vertical },
  { label: "Hamburger", value: MobileMode.Hamburger },
];

export const HamburgerPosition = {
  BottomRight: "bottom-right",
  BottomLeft: "bottom-left",
  TopRight: "top-right",
  TopLeft: "top-left",
} as const;

export const HamburgerPositionOptions = [
  { label: "Bottom Right", value: HamburgerPosition.BottomRight },
  { label: "Bottom Left", value: HamburgerPosition.BottomLeft },
  { label: "Top Right", value: HamburgerPosition.TopRight },
  { label: "Top Left", value: HamburgerPosition.TopLeft },
] as const;

export const DrawerPlacement = {
  Bottom: "bottom",
  Top: "top",
  Left: "left",
  Right: "right",
} as const;

export const DrawerPlacementOptions = [
  { label: "Bottom", value: DrawerPlacement.Bottom },
  { label: "Top", value: DrawerPlacement.Top },
  { label: "Left", value: DrawerPlacement.Left },
  { label: "Right", value: DrawerPlacement.Right },
];

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

export const mobileNavJsonMenuItems = [
  {
    label: "Option 1",
    icon: "https://cdn-icons-png.flaticon.com/128/149/149338.png",
    app: {
      appId: "",
    },
    hidden: false,
  },
  {
    label: "Option 2",
    icon: "https://cdn-icons-png.flaticon.com/128/149/149206.png",
    app: {
      appId: "",
    },
    hidden: false,
  },
  {
    label: "Option 2",
    icon: "https://cdn-icons-png.flaticon.com/128/149/149206.png",
    app: {
      appId: "",
    },
    hidden: true,
  }
]