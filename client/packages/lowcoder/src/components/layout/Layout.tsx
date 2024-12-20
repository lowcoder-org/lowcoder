import { Route, Switch } from "react-router-dom";
import { default as AntdLayout } from "antd/es/layout";
import { AppHeader } from "pages/common/header";
import * as React from "react";
import { ReactElement } from "react";
import { HelpDropdown } from "pages/common/help";
import MainContent from "components/layout/MainContent";
import SideBar from "components/layout/SideBar";
import { CNMainContent, CNSidebar } from "constants/styleSelectors";
import { SideBarSection, SideBarSectionProps } from "./SideBarSection";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { getBrandingSettings } from "@lowcoder-ee/redux/selectors/commonSettingSelectors";

type LayoutProps = {
  sections: SideBarSectionProps[];
};

const SideBarV2 = styled(SideBar)<{
  $bgColor?: string,
  $fontColor?: string,
  $activeBgColor?: string,
  $activeFontColor?: string,
}>`
  background: ${props => props.$bgColor ? props.$bgColor : '#f7f9fc'} !important;
  ${props => props.$fontColor && `color: ${props.$fontColor}`};
  padding: 28px 10px;
  border-right: 1px solid #ebebeb;

  .sidebar-section:not(:last-child)::after {
    content: "";
    display: block;
    width: 204px;
    height: 1px;
    background: #ebebeb !important;
    margin: 0 auto 4px;
  }
`;

export function Layout(props: LayoutProps) {
  const brandingSettings = useSelector(getBrandingSettings);

  const routes: ReactElement[] = [];
  props.sections.forEach((section) => {
    section.items.forEach((item) => {
      routes.push(
        <Route
          key={item.routePath}
          component={item.routeComp}
          exact={item.routePathExact ?? true}
          path={item.routePath}
        />
      );
    });
  });

  return (
    <AntdLayout style={{ height: "100%" }}>
      <AppHeader />
      <HelpDropdown />
      <AntdLayout>
        <SideBarV2
          className={CNSidebar}
          $bgColor={brandingSettings?.adminSidebarColor}
          $fontColor={brandingSettings?.adminSidebarFontColor}
          $activeBgColor={brandingSettings?.adminSidebarActiveBgColor}
          $activeFontColor={brandingSettings?.adminSidebarActiveFontColor}
        >
          {props.sections
            .filter((section) => section.items.length > 0)
            .map((section, index) => (
              <SideBarSection key={index} {...section} />
            ))}
        </SideBarV2>
        <MainContent className={CNMainContent}>
          <Switch>{routes} </Switch>
        </MainContent>
      </AntdLayout>
    </AntdLayout>
  );
}
