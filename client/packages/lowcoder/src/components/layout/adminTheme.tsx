import { ConfigProvider, ThemeConfig } from "antd";
import { CSSProperties, PropsWithChildren, useMemo } from "react";
import { useSelector } from "react-redux";
import { getBrandingSetting } from "redux/selectors/enterpriseSelectors";
import styled from "styled-components";
import ubuntuRegular from "assets/fonts/ubuntu-400.woff2";
import ubuntuMedium from "assets/fonts/ubuntu-500.woff2";
import ubuntuBold from "assets/fonts/ubuntu-700.woff2";

// Website brand tokens, scoped to the management area. The app canvas and editor
// keep their own theme; enterprise branding continues to override the shell.
export const adminTheme: ThemeConfig = {
  token: {
    colorPrimary: "#8050a0",
    colorLink: "#754394",
    colorText: "#281a30",
    colorTextSecondary: "#786a80",
    colorBorder: "#e5dce9",
    colorBgLayout: "#faf7fc",
    borderRadius: 10,
    fontFamily: "'Lowcoder Ubuntu', Ubuntu, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  components: {
    Button: { primaryShadow: "0 3px 8px #683e8618" },
    Table: { headerBg: "#faf7fc", headerColor: "#786a80", rowHoverBg: "#faf6fd", cellPaddingBlock: 16 },
    Menu: { itemSelectedBg: "#efe3f7", itemSelectedColor: "#683e86", itemBorderRadius: 10 },
    Card: { borderRadiusLG: 16 },
  },
};

const ThemeScope = styled.div`
  @font-face { font-family: 'Lowcoder Ubuntu'; src: url('${ubuntuRegular}') format('woff2'); font-weight: 400; font-display: swap; }
  @font-face { font-family: 'Lowcoder Ubuntu'; src: url('${ubuntuMedium}') format('woff2'); font-weight: 500; font-display: swap; }
  @font-face { font-family: 'Lowcoder Ubuntu'; src: url('${ubuntuBold}') format('woff2'); font-weight: 700; font-display: swap; }
  --admin-ink: #281a30;
  --admin-muted: #786a80;
  --admin-accent: #8050a0;
  --admin-line: #e9e0ee;
  --admin-paper: #faf7fc;
  --admin-tint: #f3eaf9;
  --admin-radius: 16px;
  font-family: 'Lowcoder Ubuntu', Ubuntu, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--admin-ink);
  min-width: 0;
  height: 100%;

  .main-content { background: var(--admin-paper); min-width: 0; scrollbar-gutter: stable; }
  .top-header { background-color: #201329; border-bottom: 1px solid #ffffff14; }
  @media (max-width: 720px) {
    .top-header { padding-left: 60px; padding-right: 16px; }
    .top-header .ant-row { gap: 12px; margin: 0 !important; flex-wrap: nowrap; }
    .top-header .ant-col { padding: 0 !important; }
  }
  .admin-brand-mark { display: flex; }
  .admin-brand-mark svg { width: 24px; height: 26px; }
  @media (max-width: 360px) {
    .top-header { padding-left: 54px; padding-right: 12px; }
    .top-header .ant-row { gap: 8px; }
    .admin-brand-name { font-size: 16px !important; gap: 6px !important; }
    .admin-brand-mark svg { width: 20px; height: 24px; }
  }
  .ant-card { box-shadow: 0 4px 20px #39204e04; }
  .ant-card-head { border-color: var(--admin-line); }
  .ant-table { color: var(--admin-ink); }
  && .ant-table-thead > tr > th { background: #faf7fc; color: var(--admin-muted); font-size: 12px; font-weight: 500; height: 44px; }
  && .ant-table-column-title { font-size: 12px; font-weight: 500; }
  && .ant-table-tbody > tr:hover > td { background: #faf6fd; }
  .ant-table-tbody > tr > td { border-color: #f0eaf3; }
  && .ant-table-tbody button:not(:disabled) { opacity: 1; }
  .ant-table-row:focus-within .home-datasource-edit-button { opacity: 1; }
  &&& [data-button-type='primary']:not(:disabled) {
    background: var(--admin-accent);
    border-color: var(--admin-accent);
    color: white;
  }
  &&& [data-button-type='primary']:not(:disabled):hover { filter: brightness(0.92); }
  .ant-pagination { flex-wrap: wrap; row-gap: 8px; }
  :where(button, a, [role='button'], [tabindex='0']):focus-visible {
    outline: 3px solid #b480de99;
    outline-offset: 3px;
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; }
  }
`;

export function AdminTheme({ children }: PropsWithChildren) {
  const branding = useSelector(getBrandingSetting)?.config_set;
  const theme = useMemo(() => ({
    ...adminTheme,
    token: { ...adminTheme.token,
      ...(branding?.font ? { fontFamily: branding.font } : {}),
      ...(branding?.mainBrandingColor ? { colorPrimary: branding.mainBrandingColor } : {}),
    },
  }), [branding?.font, branding?.mainBrandingColor]);
  return <ConfigProvider theme={theme}><ThemeScope className="lowcoder-admin" style={{
    fontFamily: branding?.font,
    ...(branding?.mainBrandingColor ? { "--admin-accent": branding.mainBrandingColor } : {}),
  } as CSSProperties}>{children}</ThemeScope></ConfigProvider>;
}

export const AdminPage = styled.div`
  width: 100%;
  max-width: 1800px;
  margin: 0 auto;
  padding: 32px 36px 40px;
  min-width: 0;
  @media (max-width: 1100px) { padding: 24px; }
  @media (max-width: 720px) { padding: 20px 16px 32px; }
`;

export const AdminPageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 24px;
  h1 { color: var(--admin-ink); font-size: clamp(25px, 2.4vw, 34px); line-height: 1.2; font-weight: 500; letter-spacing: -0.035em; margin: 0; }
  p { color: var(--admin-muted); font-size: 14px; line-height: 1.6; margin: 10px 0 0; max-width: 650px; }
`;

export const AdminSurface = styled.div`
  border: 1px solid var(--admin-line);
  border-radius: var(--admin-radius);
  background: white;
  min-width: 0;
  box-shadow: 0 6px 30px #39204e04;
`;

export const AdminCover = styled.div`
  position: relative;
  overflow: hidden;
  padding: 28px 32px;
  margin-bottom: 24px;
  border-radius: 18px;
  color: white;
  background: radial-gradient(ellipse at 95% 10%, #754394 0%, transparent 60%), #231629;
  h1 { position: relative; color: white; font-weight: 500; font-size: clamp(26px, 2.5vw, 36px); line-height: 1.2; letter-spacing: -0.035em; margin: 0; }
  p { color: #e0cde9; margin: 10px 0 0; max-width: 670px; line-height: 1.6; }
  @media (max-width: 720px) { padding: 24px; }
`;
