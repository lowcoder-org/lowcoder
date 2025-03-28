import { Organization } from "./organization";
import {Environments} from "./environments"
import PermissionSetting from "./permission";
import { ThemeHome } from "./theme";
import { AdvancedSetting } from "./advanced/AdvancedSetting";
import { currentOrgAdmin } from "util/permissionUtils";
import { trans } from "i18n";
import { TwoColumnSettingPageContent } from "./styled";
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
  BrandingIcon
} from "lowcoder-design";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { getUser } from "redux/selectors/usersSelectors";
import history from "util/history";
import { useParams } from "react-router-dom";
import { BrandingSetting } from "@lowcoder-ee/pages/setting/branding/BrandingSetting";
import { AppUsage } from "@lowcoder-ee/pages/setting/appUsage";
import { AuditLog } from "@lowcoder-ee/pages/setting/audit";
import { IdSourceHome } from "@lowcoder-ee/pages/setting/idSource";
import { selectSystemConfig } from "redux/selectors/configSelectors";
// import { enableCustomBrand } from "util/featureFlagUtils";
import FreeLimitTag from "pages/common/freeLimitTag";
import { Helmet } from "react-helmet";
import { Card } from "antd";
import { Subscription } from "./subscriptions";
import { selectIsLicenseActive } from "redux/selectors/enterpriseSelectors";


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
}

export function SettingHome() {
  const user = useSelector(getUser);
  const config = useSelector(selectSystemConfig);
  const selectKey = useParams<{ setting: string }>().setting || SettingPageEnum.UserGroups;

  const isLicenseActive = useSelector(selectIsLicenseActive);
  
  const items = [
    {
      key: SettingPageEnum.Organization,
      label: trans("settings.organization"),
      icon: <WorkspacesIcon width={"20px"}/>,
    },
    {
      key: SettingPageEnum.OAuthProvider,
      label: (trans("settings.oauthProviders")),
      disabled: !currentOrgAdmin(user),
      icon: <UserShieldIcon width={"20px"}/>,
    },
    {
      key: SettingPageEnum.UserGroups,
      label: trans("settings.userGroups"),
      icon: <UserGroupIcon width={"20px"}/>,
    },
    {
      key: SettingPageEnum.Theme,
      label: trans("settings.theme"),
      icon: <ThemeIcon width={"20px"}/>,
    },
    {
      key: SettingPageEnum.Advanced,
      label: trans("settings.advanced"),
      icon: <LeftSettingIcon width={"20px"}/>,
    },

    // Premium features

    {
      key: SettingPageEnum.Environments,
      label: (
        <span>
          <span className="text">{trans("settings.environments")}</span>
          {(!isLicenseActive && (
            <FreeLimitTag text={trans("settings.premium")} />
          ))}
        </span>
      ),
      icon: <EnvironmentsIcon width={"20px"}/>,
      disabled: !isLicenseActive || !currentOrgAdmin(user),
    },
    {
      key: SettingPageEnum.AppUsage,
      label: (
        <span>
          <span className="text">{trans("settings.appUsage")}</span>
          {(!isLicenseActive && (
            <FreeLimitTag text={trans("settings.premium")} />
          ))}
        </span>
      ),
      icon: <UsageStatisticsIcon width={"20px"}/>,
      disabled: !isLicenseActive || !currentOrgAdmin(user),
    },
    {
      key: SettingPageEnum.AuditLog,
      label: (
        <span>
          <span className="text">{trans("settings.audit")}</span>
          {(!isLicenseActive && (
            <FreeLimitTag text={trans("settings.premium")} />
          ))}
        </span>
      ),
      icon: <AutitLogsIcon width={"20px"}/>,
      disabled: !isLicenseActive || !currentOrgAdmin(user),
    },
    {
      key: SettingPageEnum.Branding,
      label: (
        <span>
          <span className="text">{trans("settings.branding")}</span>
          {(!isLicenseActive && (
            <FreeLimitTag text={trans("settings.premium")} />
          ))}
        </span>
      ),
      icon: <BrandingIcon width={"20px"}/>,
      disabled: !isLicenseActive || !currentOrgAdmin(user),
    },
    { 
      key: SettingPageEnum.Subscription,
      label: trans("settings.subscription"),
      icon: <SubscriptionIcon width={"20px"}/>, 
    }
  ];

  return (
    <>
      <Helmet>{<title>{trans("productName")} {trans("settings.title")}</title>}</Helmet>
      <TwoColumnSettingPageContent>
        <SubSideBar title={trans("settings.title")}>
          <Menu
            style={{ border: "none" }}
            mode="inline"
            selectedKeys={[selectKey]}
            onClick={(value) => {
              history.push("/setting/" + value.key);
            } }
            items={items} />

          <Card style={{marginTop: "40px", color:"#aaa"}}>
            <div>If you are interested in early access to the upcoming Enterprise Edition, please contact us: <a href="mailto:service@lowcoder.cloud">service@lowcoder.cloud</a></div>
          </Card>
        </SubSideBar>

        {selectKey === SettingPageEnum.Organization && <Organization />}
        {selectKey === SettingPageEnum.OAuthProvider && <IdSourceHome />}
        {selectKey === SettingPageEnum.UserGroups && <PermissionSetting />}
        {selectKey === SettingPageEnum.Theme && <ThemeHome />}
        {selectKey === SettingPageEnum.Advanced && <AdvancedSetting />}
        {selectKey === SettingPageEnum.Environments && <Environments />}
        {selectKey === SettingPageEnum.AppUsage && <AppUsage />}
        {selectKey === SettingPageEnum.AuditLog && <AuditLog />}
        {selectKey === SettingPageEnum.Branding && <BrandingSetting />}
        {selectKey === SettingPageEnum.Subscription && <Subscription />}

      </TwoColumnSettingPageContent>
    </>
  );
}

export default SettingHome;
