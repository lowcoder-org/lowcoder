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
import { MenuOutlined } from "@ant-design/icons";
import { Drawer, Button } from "antd";
import { trans } from "i18n";
import { getBrandingSetting } from "@lowcoder-ee/redux/selectors/enterpriseSelectors";

type LayoutProps = {
  sections: SideBarSectionProps[];
};

const SideBarV2 = styled(SideBar)<{
  $bgColor?: string,
  $fontColor?: string,
  $activeBgColor?: string,
  $activeFontColor?: string,
}>`
  background: ${props => props.$bgColor ? props.$bgColor : '#f8f3fb'} !important;
  ${props => props.$fontColor && `color: ${props.$fontColor}`};
  padding: 20px 14px;
  overflow-y: auto;
  flex-shrink: 0;
  border-right: 1px solid #e9e0ee;

  .sidebar-section:not(:last-child)::after {
    content: "";
    display: block;
    width: calc(100% - 24px);
    height: 1px;
    background: #e9e0ee;
    margin: 12px auto;
  }
`;

const MobileMenuButton = styled(Button)`
  display: none;
  position: fixed;
  top: 12px;
  left: 12px;
  width: 36px;
  height: 36px;
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
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 720);
  const brandingSettings = useSelector(getBrandingSetting);

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
      <AppHeader showBrandName />
      <HelpDropdown />

      {/* Mobile Hamburger Button */}
      {isMobile && (
        <MobileMenuButton
          aria-label={trans("admin.navigation")}
          aria-expanded={drawerVisible}
          type="primary"
          shape="circle"
          icon={<MenuOutlined />}
          onClick={toggleDrawer}
        />
      )}

      {/* Drawer for Mobile Sidebar */}
      <Drawer
        title={trans("admin.navigation")}
        width={280}
        placement="left"
        closable={true}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        styles={{
          body: { padding: "0px" }
        }}
        destroyOnHidden // Ensure drawer content is removed when closed
      >
        <DrawerContentWrapper>
          <SideBarV2
            width="100%"
            style={{ height: "100%" }}
            className={CNSidebar}
            $bgColor={brandingSettings?.config_set?.adminSidebarColor}
            $fontColor={brandingSettings?.config_set?.adminSidebarFontColor}
            $activeBgColor={brandingSettings?.config_set?.adminSidebarActiveBgColor}
            $activeFontColor={brandingSettings?.config_set?.adminSidebarActiveFontColor}
          >
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
          <SideBarV2
            className={`${CNSidebar} desktop-only`}
            $bgColor={brandingSettings?.config_set?.adminSidebarColor}
            $fontColor={brandingSettings?.config_set?.adminSidebarFontColor}
            $activeBgColor={brandingSettings?.config_set?.adminSidebarActiveBgColor}
            $activeFontColor={brandingSettings?.config_set?.adminSidebarActiveFontColor}
          >
            {desktopSections
              .filter((section) => section.items.length > 0)
              .map((section, index) => (
                <SideBarSection key={index} {...section} />
              ))}
          </SideBarV2>
        )}
        <MainContent id="admin-main" tabIndex={-1} className={CNMainContent}>
          <Switch>{routes}</Switch>
        </MainContent>
      </AntdLayout>
    </AntdLayout>
  );
}
