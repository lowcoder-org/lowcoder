import type { ThemeConfig } from "antd";
import type { BrandingSettings } from "api/enterpriseApi";
import { colord, extend } from "colord";
import a11y from "colord/plugins/a11y";
import mix from "colord/plugins/mix";
import names from "colord/plugins/names";

extend([a11y, mix, names]);

const defaultFont = "'Lowcoder Ubuntu', Ubuntu, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const onColor = (background: string) =>
  colord(background).contrast("#fff") >= colord(background).contrast("#000000") ? "#ffffff" : "#000000";

// Keep the configured primary color exact. Links need a readable variant on white,
// including when a company's primary color is yellow or another very light color.
function linkColor(color: string) {
  let result = colord(color);
  for (let i = 0; i < 20 && result.contrast("#fff") < 4.5; i++) result = result.darken(0.05);
  return result.toHex();
}

export function getAdminAppearance(branding: BrandingSettings = {}) {
  const customAccent = colord(branding.mainBrandingColor || "").isValid();
  const accent = customAccent ? branding.mainBrandingColor! : "#8050a0";
  const foreground = onColor(accent);
  const link = customAccent ? linkColor(accent) : "#754394";
  const tint = (white: number) => colord(accent).mix("#fff", white).toHex();
  const font = branding.font?.trim().replace(/\+/g, " ");
  const fontFamily = font ? `${JSON.stringify(font)}, sans-serif` : defaultFont;
  const palette = {
    accent,
    accentHover: (foreground === "#ffffff" ? colord(accent).darken(0.08) : colord(accent).lighten(0.08)).toHex(),
    onAccent: foreground,
    link,
    linkHover: colord(link).darken(0.06).toHex(),
    ink: customAccent ? "#24252a" : "#281a30",
    muted: customAccent ? "#6e7078" : "#786a80",
    line: customAccent ? tint(0.84) : "#e9e0ee",
    lineHover: customAccent ? tint(0.55) : "#c7a8dc",
    paper: customAccent ? tint(0.98) : "#faf7fc",
    surface: "#ffffff",
    tint: customAccent ? tint(0.92) : "#f3eaf9",
    hover: customAccent ? tint(0.96) : "#faf6fd",
    focus: colord(link).alpha(0.6).toRgbString(),
    header: branding.appHeaderColor || "#201329",
    sidebar: branding.adminSidebarColor || (customAccent ? tint(0.97) : "#f8f3fb"),
    sidebarActive: branding.adminSidebarActiveBgColor || (customAccent ? tint(0.87) : "#eadcf3"),
    cover: customAccent ? colord(accent).mix("#171717", 0.65).toHex() : "#231629",
  };
  const colors = {
    ...palette,
    headerText: onColor(palette.header),
    sidebarText: branding.adminSidebarFontColor || (colord(palette.sidebar).isDark() ? "#ffffff" : palette.ink),
    sidebarActiveText: branding.adminSidebarActiveFontColor ||
      (branding.adminSidebarActiveBgColor ? onColor(palette.sidebarActive) : palette.link),
    coverText: onColor(palette.cover),
  };
  const variables: Record<string, string> = { "--admin-font": fontFamily, "--admin-radius": "16px" };
  Object.entries(colors).forEach(([key, value]) => {
    variables[`--admin-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`] = value;
  });
  const theme: ThemeConfig = {
    // Scope Ant styles too: a nested Admin provider must not recolor the editor.
    hashed: true,
    token: {
      colorPrimary: colors.accent,
      colorLink: colors.link,
      colorLinkHover: colors.linkHover,
      colorTextLightSolid: colors.onAccent,
      colorPrimaryText: colors.link,
      colorPrimaryTextHover: colors.linkHover,
      colorText: colors.ink,
      colorTextSecondary: colors.muted,
      colorBorder: colors.line,
      colorBgLayout: colors.paper,
      borderRadius: 10,
      fontFamily,
    },
    components: {
      Button: {
        primaryShadow: "0 3px 8px #00000012", primaryColor: colors.onAccent,
        defaultHoverColor: colors.link, defaultActiveColor: colors.linkHover,
        colorPrimaryHover: colors.accentHover,
      },
      Pagination: { colorPrimary: colors.link, colorPrimaryHover: colors.linkHover },
      Table: { headerBg: colors.paper, headerColor: colors.muted, rowHoverBg: colors.hover, cellPaddingBlock: 16 },
      Menu: {
        itemColor: colors.ink,
        itemSelectedBg: colors.tint,
        itemSelectedColor: colors.link,
        itemHoverBg: colors.hover,
        itemHoverColor: colors.link,
        itemBorderRadius: 10,
      },
      Card: { borderRadiusLG: 16 },
    },
  };
  return { colors, variables, theme, fontFamily };
}
