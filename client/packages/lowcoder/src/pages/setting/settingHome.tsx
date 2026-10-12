import { useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Card, Button } from "antd";

import { Organization } from "./organization";
import PermissionSetting from "./permission";
import { ThemeHome } from "./theme";
import { AdvancedSetting } from "./advanced/AdvancedSetting";
import { currentOrgAdmin } from "util/permissionUtils";
import { trans } from "i18n";
import { Level1SettingPageContent, Level1SettingPageTitle, SubscriptionPageContent, TwoColumnSettingPageContent } from "./styled";
import SubSideBar from "components/layout/SubSideBar";
import {
  Menu,
  UserGroupIcon,
  UserShieldIcon,
  LeftSettingIcon,
  ThemeIcon,
  WorkspacesIcon,
  SubscriptionIcon,
  EnvironmentsIcon,
  UsageStatisticsIcon,
  AutitLogsIcon,
  BrandingIcon,
} from "lowcoder-design";
import { getUser } from "redux/selectors/usersSelectors";
import { selectIsLicenseActive } from "redux/selectors/enterpriseSelectors";

import FreeLimitTag from "pages/common/freeLimitTag";
import { Branding } from "@lowcoder-ee/pages/setting/branding";
import { Environments}  from "@lowcoder-ee/pages/setting/environments";
import { AppUsage } from "@lowcoder-ee/pages/setting/appUsage";
import { AuditLog } from "@lowcoder-ee/pages/setting/audit";
import { IdSourceHome } from "@lowcoder-ee/pages/setting/idSource";
import { Subscription } from "./subscriptions";
import history from "util/history";
import { LicenseRequestModal } from "./licenseRequestModal";
import { EnterpriseLicenses } from "./subscriptions/EnterpriseLicenses";
import { EnterpriseEditionInfo } from "./EnterpriseEditionInfo";
import { isPublicLowcoderCloud } from "util/enterpriseHosting";

enum SettingPageEnum {
  Organization = "organization",
  OAuthProvider = "oauth-provider",
  UserGroups = "permission",
  Theme = "theme",
  Advanced = "advanced",
  Environments = "environments",
  AppUsage = "app-usage",
  AuditLog = "audit",
  Branding = "branding",
  Subscription = "subscription",
  Enterprise = "enterprise",
}

export function SettingHome() {
  const user = useSelector(getUser);
  const isLicenseActive = useSelector(selectIsLicenseActive);
  const isPublicCloud = isPublicLowcoderCloud();
  const selectKey = useParams<{ setting: string }>().setting || SettingPageEnum.UserGroups;

  const [hubspotVisible, setHubspotVisible] = useState(false);

  const items = [
    {
      key: SettingPageEnum.Organization,
      label: trans("settings.organization"),
      icon: <WorkspacesIcon width={"20px"} />,
    },
    {
      key: SettingPageEnum.OAuthProvider,
      label: trans("settings.oauthProviders"),
      disabled: !currentOrgAdmin(user),
      icon: <UserShieldIcon width={"20px"} />,
    },
    {
      key: SettingPageEnum.UserGroups,
      label: trans("settings.userGroups"),
      icon: <UserGroupIcon width={"20px"} />,
    },
    {
      key: SettingPageEnum.Theme,
      label: trans("settings.theme"),
      icon: <ThemeIcon width={"20px"} />,
    },
    {
      key: SettingPageEnum.Advanced,
      label: trans("settings.advanced"),
      icon: <LeftSettingIcon width={"20px"} />,
    },
    {
      key: SettingPageEnum.Environments,
      label: (
        <span className="settings-nav-label">
          <span className="text">{trans("settings.environments")}</span>
          {!isLicenseActive && <FreeLimitTag text={trans("settings.premium")} />}
        </span>
      ),
      icon: <EnvironmentsIcon width={"20px"} />,
      disabled: !currentOrgAdmin(user),
    },
    {
      key: SettingPageEnum.AppUsage,
      label: (
        <span className="settings-nav-label">
          <span className="text">{trans("settings.appUsage")}</span>
          {!isLicenseActive && <FreeLimitTag text={trans("settings.premium")} />}
        </span>
      ),
      icon: <UsageStatisticsIcon width={"20px"} />,
      disabled: !currentOrgAdmin(user),
    },
    {
      key: SettingPageEnum.AuditLog,
      label: (
        <span className="settings-nav-label">
          <span className="text">{trans("settings.audit")}</span>
          {!isLicenseActive && <FreeLimitTag text={trans("settings.premium")} />}
        </span>
      ),
      icon: <AutitLogsIcon width={"20px"} />,
      disabled: !currentOrgAdmin(user),
    },
    {
      key: SettingPageEnum.Branding,
      label: (
        <span className="settings-nav-label">
          <span className="text">{trans("settings.branding")}</span>
          {!isLicenseActive && <FreeLimitTag text={trans("settings.premium")} />}
        </span>
      ),
      icon: <BrandingIcon width={"20px"} />,
      disabled: !currentOrgAdmin(user),
    },
    {
      key: SettingPageEnum.Subscription,
      label: trans("settings.subscription"),
      icon: <SubscriptionIcon width={"20px"} />,
    },
  ];

  return (
    <>
      <Helmet>
        <title>
          {trans("productName")} {trans("settings.title")}
        </title>
      </Helmet>

      <TwoColumnSettingPageContent>
        <SubSideBar title={trans("settings.title")}>
          <Menu
            style={{ border: "none" }}
            mode="inline"
            selectedKeys={[selectKey]}
            onClick={(value) => {
              history.push("/setting/" + value.key);
            }}
            items={items}
          />

          {isPublicCloud ? (
            <Card>
              <div style={{ marginBottom: 12 }}>{trans("enterprise.selfHosted.sidebarNotice")}</div>
              <Button onClick={() => history.push("/setting/enterprise")}
                style={{ height: "auto", whiteSpace: "normal" }}>
                {trans("enterprise.selfHosted.about")}
              </Button>
            </Card>
          ) : !isLicenseActive && currentOrgAdmin(user) && (
            <Card>
              <div style={{ marginBottom: 12 }}>
                {trans("enterprise.premiumFeaturesNotice")}
              </div>
              <Button
                type="primary"
                style={{ backgroundColor: "#ff6f3c", borderColor: "#ff6f3c" }}
                onClick={() => setHubspotVisible(true)}
              >
                {trans("enterprise.requestLicensesBtton")}
              </Button>

              <div style={{ margin: "12px 0" }}>
                {trans("enterprise.readMoreNotice")}
              </div>

              <Button
                type="default"
                onClick={() =>
                  window.open(
                    "https://docs.lowcoder.cloud/lowcoder-documentation/setup-and-run/lowcoder-enterprise-edition",
                    "_blank",
                    "noopener"
                  )
                }
              >
                {trans("enterprise.readMoreButton")}
              </Button>

            </Card>
          )}
        </SubSideBar>

        {selectKey === SettingPageEnum.Organization && <Organization />}
        {selectKey === SettingPageEnum.OAuthProvider && <IdSourceHome />}
        {selectKey === SettingPageEnum.UserGroups && <PermissionSetting />}
        {selectKey === SettingPageEnum.Theme && <ThemeHome />}
        {selectKey === SettingPageEnum.Advanced && <AdvancedSetting />}
        {selectKey === SettingPageEnum.Environments && <Environments />}
        {selectKey === SettingPageEnum.AppUsage && <AppUsage />}
        {selectKey === SettingPageEnum.AuditLog && <AuditLog />}
        {selectKey === SettingPageEnum.Branding && <Branding />}
        {selectKey === SettingPageEnum.Subscription && <SubscriptionPageContent><Subscription /><EnterpriseLicenses /></SubscriptionPageContent>}
        {selectKey === SettingPageEnum.Enterprise && <Level1SettingPageContent style={{ minWidth: 0 }}>
          <Level1SettingPageTitle>{trans("enterprise.selfHosted.title")}</Level1SettingPageTitle>
          <EnterpriseEditionInfo />
        </Level1SettingPageContent>}
      </TwoColumnSettingPageContent>

      {!isPublicCloud && <LicenseRequestModal
        open={hubspotVisible}
        onClose={() => setHubspotVisible(false)}
        orgId={user.currentOrgId}
      />}
    </>
  );
}

export default SettingHome;
