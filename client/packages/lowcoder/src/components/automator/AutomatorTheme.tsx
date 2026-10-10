import type { ReactNode } from "react";
import { ConfigProvider, theme as antdTheme } from "antd";
import { useSelector } from "react-redux";
import { ThemeProvider, DefaultTheme } from "styled-components";
import { getBrandingSetting } from "@lowcoder-ee/redux/selectors/enterpriseSelectors";

// Use the same workspace/global branding selection as the editor's BrandedIcon.
// React context also reaches the connection popover and recipe/setup modal portals.
export function AutomatorTheme({ children }: { children: ReactNode }) {
  const branding = useSelector(getBrandingSetting);
  const { token } = antdTheme.useToken();
  const colorPrimary =
    branding?.config_set?.mainBrandingColor || token.colorPrimary;
  return (
    <ConfigProvider theme={{ hashed: true, token: { colorPrimary } }}>
      <AutomatorTokens>{children}</AutomatorTokens>
    </ConfigProvider>
  );
}

function AutomatorTokens({ children }: { children: ReactNode }) {
  const { token } = antdTheme.useToken();
  return (
    <ThemeProvider theme={(outer) => ({ ...outer, automator: token })}>
      {children}
    </ThemeProvider>
  );
}

type AccentToken =
  | "colorPrimary"
  | "colorPrimaryHover"
  | "colorPrimaryText"
  | "colorPrimaryBg"
  | "colorPrimaryBorder"
  | "colorTextLightSolid";
type AutomatorThemeValue = DefaultTheme & {
  automator?: Partial<Record<AccentToken, string>>;
};

const color =
  (key: AccentToken, fallback: string) =>
  ({ theme }: { theme: DefaultTheme }) =>
    (theme as AutomatorThemeValue).automator?.[key] || fallback;

export const automatorColor = {
  accent: color("colorPrimary", "#1677ff"),
  accentHover: color("colorPrimaryHover", "#4096ff"),
  accentText: color("colorPrimaryText", "#1677ff"),
  accentBg: color("colorPrimaryBg", "#e6f4ff"),
  accentBorder: color("colorPrimaryBorder", "#91caff"),
  onAccent: color("colorTextLightSolid", "#fff"),
};
