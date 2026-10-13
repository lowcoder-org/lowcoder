import App from "antd/es/app";
import ConfigProvider from "antd/es/config-provider";
import { PropsWithChildren, useMemo } from "react";
import { useSelector } from "react-redux";
import { getBrandingSetting } from "redux/selectors/enterpriseSelectors";
import styled, { ThemeProvider } from "styled-components";
import GlobalInstances from "lowcoder-design/src/components/GlobalInstances";
import { getAdminAppearance } from "./adminAppearance";
import { adminThemeVariables } from "lowcoder-design/src/components/adminThemeVariables";
import ubuntuRegular from "assets/fonts/ubuntu-400.woff2";
import ubuntuMedium from "assets/fonts/ubuntu-500.woff2";
import ubuntuBold from "assets/fonts/ubuntu-700.woff2";

const ThemeScope = styled.div`
  ${adminThemeVariables};
  @font-face { font-family: 'Lowcoder Ubuntu'; src: url('${ubuntuRegular}') format('woff2'); font-weight: 400; font-display: swap; }
  @font-face { font-family: 'Lowcoder Ubuntu'; src: url('${ubuntuMedium}') format('woff2'); font-weight: 500; font-display: swap; }
  @font-face { font-family: 'Lowcoder Ubuntu'; src: url('${ubuntuBold}') format('woff2'); font-weight: 700; font-display: swap; }
  font-family: var(--admin-font);
  color: var(--admin-ink);
  min-width: 0;
  height: 100%;

  .main-content { background: var(--admin-paper); min-width: 0; scrollbar-gutter: stable; }
  .top-header { background-color: var(--admin-header); border-bottom: 1px solid #ffffff14; }
  @media (max-width: 720px) {
    .top-header { padding-left: 60px; padding-right: 16px; }
    .top-header .ant-row { gap: 12px; margin: 0 !important; flex-wrap: nowrap; }
    .top-header .ant-col { padding: 0 !important; }
  }
  .admin-brand-name { display: flex; align-items: center; gap: 10px; color: var(--admin-header-text); font-size: 20px; font-weight: 500; min-width: 0; }
  .admin-brand-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .admin-brand-mark { display: flex; flex-shrink: 0; }
  .top-header > div:first-child, .top-header > div:first-child > a { min-width: 0; }
  .top-header > div:last-child { flex-shrink: 0; margin-left: 16px; }
  .admin-brand-mark svg { width: 24px; height: 26px; }
  @media (max-width: 360px) {
    .top-header { padding-left: 54px; padding-right: 12px; }
    .top-header .ant-row { gap: 8px; }
    .admin-brand-name { font-size: 16px !important; gap: 6px !important; }
    .admin-brand-mark svg { width: 20px; height: 24px; }
  }
  .ant-card { box-shadow: 0 4px 20px #00000004; }
  .ant-card-head { border-color: var(--admin-line); }
  .ant-table { color: var(--admin-ink); }
  && .ant-table-thead > tr > th { background: var(--admin-paper); color: var(--admin-muted); font-size: 12px; font-weight: 500; height: 44px; }
  && .ant-table-column-title { font-size: 12px; font-weight: 500; }
  && .ant-table-tbody > tr:hover > td { background: var(--admin-hover); }
  .ant-table-tbody > tr > td { border-color: var(--admin-line); }
  && .ant-table-tbody button:not(:disabled) { opacity: 1; }
  .ant-table-row:focus-within .home-datasource-edit-button { opacity: 1; }
  .ant-pagination { flex-wrap: wrap; row-gap: 8px; }
  :where(button, a, [role='button'], [tabindex='0']):focus-visible {
    outline: 3px solid var(--admin-focus);
    outline-offset: 3px;
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; }
  }
`;

export function AdminTheme({ children }: PropsWithChildren) {
  const branding = useSelector(getBrandingSetting)?.config_set;
  const appearance = useMemo(() => getAdminAppearance(branding), [branding]);
  return (
    <ConfigProvider theme={appearance.theme}>
      <ThemeProvider theme={(outer) => ({ ...outer, admin: appearance })}>
        <ThemeScope className="lowcoder-admin">
          <App component={false}>
            <GlobalInstances priority={1} />
            {children}
          </App>
        </ThemeScope>
      </ThemeProvider>
    </ConfigProvider>
  );
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
  background: var(--admin-surface);
  min-width: 0;
  box-shadow: 0 6px 30px #00000004;
`;

export const AdminCover = styled.div`
  position: relative;
  overflow: hidden;
  padding: 28px 32px;
  margin-bottom: 24px;
  border-radius: 18px;
  color: var(--admin-cover-text);
  background: var(--admin-cover);
  h1 { position: relative; color: var(--admin-cover-text); font-weight: 500; font-size: clamp(26px, 2.5vw, 36px); line-height: 1.2; letter-spacing: -0.035em; margin: 0; }
  p { color: var(--admin-cover-text); opacity: 0.8; margin: 10px 0 0; max-width: 670px; line-height: 1.6; }
  @media (max-width: 720px) { padding: 24px; }
`;
