// Local visual regression fixture. Not included in the production build inputs.
// Uses the real components with sample branding; never reads or writes an account.
import "antd/dist/reset.css";
import { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { createStore } from "redux";
import { MemoryRouter } from "react-router-dom";
import { Button, Card, Drawer, Input, Menu, Select, Space } from "antd";
import { AppstoreOutlined, SearchOutlined, SettingOutlined, UserOutlined } from "@ant-design/icons";
import type { BrandingSettings } from "api/enterpriseApi";
import { AdminTheme } from "components/layout/adminTheme";
import { AdminBrand } from "components/layout/AdminBrand";
import { AdminSidebar } from "components/layout/AdminSidebar";
import { SideBarItem } from "components/layout/SideBarItem";
import SubSideBar from "components/layout/SubSideBar";
import Header from "components/layout/Header";
import { TacoButton } from "lowcoder-design/src/components/button";
import { modalInstance } from "lowcoder-design/src/components/GlobalInstances";
import { MarketplaceShell, MarketplaceGrid } from "pages/ApplicationV2/marketplace/marketplaceStyles";
import { HomeLayout } from "pages/ApplicationV2/HomeLayout";
import type { FolderMeta } from "constants/applicationConstants";

const folders: FolderMeta[] = ["Sales dashboards", "Customer support", "Project trackers", "Operations"].map((name, i) => ({
  folderId: `sample-${i}`, orgId: "sample", name, createBy: "Alex Morgan", createAt: 1791849600000,
  manageable: true, lastViewTime: 0, folder: true,
}));

const brands: Record<string, BrandingSettings> = {
  Lowcoder: {},
  "Acme Green": {
    standardTitle: "Acme Operations", mainBrandingColor: "#007f68", font: "Open+Sans",
    appHeaderColor: "#102a26", adminSidebarColor: "#163a32", adminSidebarFontColor: "#e5f5ef",
    adminSidebarActiveBgColor: "#ccebdd", adminSidebarActiveFontColor: "#123b2d",
  },
  "OEM Blue": {
    standardTitle: "Northstar Company Operations", mainBrandingColor: "#2356c4", font: "Inter",
    appHeaderColor: "#ffffff", adminSidebarColor: "#eef3fc", adminSidebarFontColor: "#293e61",
    adminSidebarActiveBgColor: "#2356c4", adminSidebarActiveFontColor: "#ffffff",
  },
  "Bright Amber": { standardTitle: "Amber Studio", mainBrandingColor: "#ffdc00", font: "Playfair+Display" },
};

function Example({ page, setPage }: { page: string; setPage: (page: string) => void }) {
  const names = ["Your apps", "Marketplace", "Settings"];
  return <>{names.map((name) => <SideBarItem key={name} text={name} selected={page === name} onClick={() => setPage(name)} icon={({ style }) => name === "Settings" ? <SettingOutlined style={style} /> : <AppstoreOutlined style={style} />} />)}</>;
}

function Preview() {
  const [brand, setBrand] = useState("Acme Green");
  const [page, setPage] = useState("Marketplace");
  const [drawer, setDrawer] = useState(false);
  const [customCss, setCustomCss] = useState(false);
  const [modified, setModified] = useState(false);
  const branding = { id: "sample", orgId: "sample", config_set: brands[brand] };
  const store = useMemo(() => createStore(() => ({
    ui: {
      enterprise: { workspaceBranding: { id: "sample", orgId: "sample", config_set: brands[brand] } },
      users: { user: { currentOrgId: "sample", username: "Alex Morgan", orgDev: true, userStatus: { newUserGuidance: true } } },
      application: { applicationList: [], loadingStatus: { isApplicationCreating: false } },
      folder: { folders },
    },
  })), [brand]);
  return <Provider store={store}><MemoryRouter><AdminTheme>
    {brands[brand].font && <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${brands[brand].font}:wght@400;500;700&display=swap`} />}
    <div style={{ padding: "12px 20px", background: "#fff", borderBottom: "1px solid #ddd", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
      <strong>Branding preview</strong><span>Sample data · no settings are saved</span>
      <Select aria-label="Brand" value={brand} onChange={setBrand} options={Object.keys(brands).map((value) => ({ value, label: value }))} style={{ width: 150 }} />
      <Button onClick={() => setDrawer(true)}>Mobile menu</Button>
      <Button onClick={() => modalInstance.confirm({ title: "Branded dialog", content: "Dialogs use the same company colors and font.", okText: "Continue" })}>Open dialog</Button>
      <Button aria-pressed={customCss} onClick={() => setCustomCss(!customCss)}>Custom CSS</Button>
    </div>
    {customCss && <style>{`.lowcoder-admin .main-content { background: #eeeeee; } .lowcoder-admin .sidebar-item { border-radius: 0; }`}</style>}
    <Header headerStart={<AdminBrand branding={branding} showName />} headerEnd={<UserOutlined style={{ color: "var(--admin-header-text)", fontSize: 20 }} />} />
    <div style={{ display: "flex", minHeight: "calc(100vh - 116px)" }}>
      <AdminSidebar className="sidebar fixture-desktop" style={{ height: "auto" }}><Example page={page} setPage={setPage} /></AdminSidebar>
      <main className="main-content" style={{ flex: 1, minWidth: 0 }}>
        {page === "Settings" ? <div style={{ display: "flex", height: "100%" }}>
          <SubSideBar title="Settings"><Menu selectedKeys={["branding"]} items={[{ key: "workspace", label: "Workspaces" }, { key: "branding", label: "Branding" }, { key: "subscriptions", label: "Subscriptions" }]} /></SubSideBar>
          <div style={{ padding: 32, flex: 1 }}><h1>Company branding</h1><Card title="Workspace identity"><p>Your company colors, typography and navigation settings.</p><TacoButton buttonType="primary">Save settings</TacoButton></Card></div>
        </div> : page === "Your apps" ? <HomeLayout mode="view" title="Your apps" elements={folders} currentPage={1} pageSize={10} total={folders.length} setIsCreated={setModified} isCreated={modified} /> : <MarketplaceShell>
          <div className="marketplace-heading"><div><div className="eyebrow">Build together</div><h1>{page}</h1><p className="intro">Discover useful apps and the people who build them.</p></div><Button type="primary">Share an app</Button></div>
          <div className="tabs" role="tablist"><button role="tab" aria-selected>Community <span className="tab-count">24</span></button><button role="tab" aria-selected={false}>Local</button></div>
          <div className="toolbar"><Input className="search" prefix={<SearchOutlined />} placeholder="Search apps, creators and categories" /><Select defaultValue="recent" options={[{ value: "recent", label: "Recently shared" }, { value: "name", label: "App name" }]} /></div>
          <div className="categories">{["All apps", "Analytics", "Operations", "Customer support"].map((category, i) => <button key={category} aria-pressed={i === 0}>{category}</button>)}</div>
          <MarketplaceGrid $list={false}>
            {["Sales dashboard", "Customer support", "Project tracker"].map((title, i) => <article className="marketplace-card" key={title}>
              <div style={{ aspectRatio: "16 / 10", background: "var(--admin-tint)", display: "grid", placeItems: "center" }}><AppstoreOutlined style={{ fontSize: 48, color: "var(--admin-link)" }} /></div>
              <div className="card-body"><div className="tags"><span className="tag">{i === 0 ? "Analytics" : "Operations"}</span></div><a className="title-link" href="#sample" onClick={(event) => event.preventDefault()}>{title}</a><p className="card-description">A shared workspace for your team’s daily work, with clear reports and useful insights.</p><div className="card-footer"><div className="creator-row"><span className="avatar">AM</span><span className="creator-name">Alex Morgan</span></div><Button type="link">Explore</Button></div></div>
            </article>)}
          </MarketplaceGrid>
          <Space style={{ marginTop: 24 }}><TacoButton buttonType="primary">Create app</TacoButton><TacoButton buttonType="blue">Import app</TacoButton></Space>
        </MarketplaceShell>}
      </main>
    </div>
    <Drawer placement="left" open={drawer} onClose={() => setDrawer(false)} title="Navigation" width={280} styles={{ body: { padding: 0 } }}><AdminSidebar className="sidebar" width="100%" style={{ height: "100%" }}><Example page={page} setPage={(value) => { setPage(value); setDrawer(false); }} /></AdminSidebar></Drawer>
    <style>{`@media(max-width:720px){.fixture-desktop{display:none}.lowcoder-admin .top-header{padding-left:20px}}`}</style>
  </AdminTheme></MemoryRouter></Provider>;
}

if (import.meta.env.DEV) createRoot(document.getElementById("root")!).render(<Preview />);
