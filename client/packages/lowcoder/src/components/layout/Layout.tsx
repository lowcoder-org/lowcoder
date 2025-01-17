import { Route, Switch } from "react-router-dom";
import { default as AntdLayout } from "antd/es/layout";
import { AppHeader } from "pages/common/header";
import * as React from "react";
import { ReactElement, useState, useEffect } from "react";
import { HelpDropdown } from "pages/common/help";
import MainContent from "components/layout/MainContent";
import SideBar from "components/layout/SideBar";
import { CNMainContent, CNSidebar } from "constants/styleSelectors";
import { SideBarSection, SideBarSectionProps } from "./SideBarSection";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { getBrandingSettings } from "@lowcoder-ee/redux/selectors/commonSettingSelectors";
import { MenuOutlined } from "@ant-design/icons";
import { Drawer, Button } from "antd";

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

const MobileMenuButton = styled(Button)`
  display: none;
  position: fixed;
  top: 75px;
  right: 22px;
  z-index: 1000;

  @media screen and (max-width: 720px) {
    display: block;
  }
`;

const DrawerContentWrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

export function Layout(props: LayoutProps) {
  const brandingSettings = useSelector(getBrandingSettings);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const toggleDrawer = () => {
    setDrawerVisible(!drawerVisible);
  };

  const handleMenuClick = () => {
    setDrawerVisible(false); // Close the drawer
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 720);
    handleResize(); // Check on initial render
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const mobileSections = props.sections.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.mobileVisible !== false), // Filter mobile-visible items
  }));

  const desktopSections = props.sections;

  const routes: ReactElement[] = [];
  desktopSections.forEach((section) => {
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

      {/* Mobile Hamburger Button */}
      {isMobile && (
        <MobileMenuButton
          type="primary"
          shape="circle"
          icon={<MenuOutlined />}
          onClick={toggleDrawer}
        />
      )}

      {/* Drawer for Mobile Sidebar */}
      <Drawer
        width={"240px"}
        placement="right"
        closable={true}
        onClose={toggleDrawer}
        visible={drawerVisible}
        bodyStyle={{ padding: "0px" }}
        destroyOnClose // Ensure drawer content is removed when closed
      >
        <DrawerContentWrapper>
          <SideBarV2 className={CNSidebar}>
            {mobileSections
              .filter((section) => section.items.length > 0)
              .map((section, index) => (
                <SideBarSection
                  key={index}
                  {...section}
                  onItemClick={handleMenuClick} // Pass handler to close the drawer
                />
              ))}
          </SideBarV2>
        </DrawerContentWrapper>
      </Drawer>

      {/* Desktop Layout */}
      <AntdLayout>
        {!isMobile && (
          <SideBarV2 className={`${CNSidebar} desktop-only`}>
            {desktopSections
              .filter((section) => section.items.length > 0)
              .map((section, index) => (
                <SideBarSection key={index} {...section} />
              ))}
          </SideBarV2>
        )}
        <MainContent className={CNMainContent}>
          <Switch>{routes}</Switch>
        </MainContent>
      </AntdLayout>
    </AntdLayout>
  );
}