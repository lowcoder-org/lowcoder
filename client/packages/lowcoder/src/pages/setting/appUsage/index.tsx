import { APP_USAGE_DASHBOARD, APP_USAGE_DETAIL } from "@lowcoder-ee/constants/routesURL";
import { Route, Switch } from "react-router-dom";
import { AppUsageDashboard } from "./dashboard";
import { AppUsageDetail } from "./detail";
import { useSelector, useDispatch } from "react-redux";
import { selectIsLicenseActive } from "redux/selectors/enterpriseSelectors";
import styled from "styled-components";
import { Card, Row, Col, Typography, Divider } from "antd";
import { Level1SettingPageContent, Level1SettingPageTitle } from "../styled";
import { trans } from "i18n";

import { Image } from 'antd';
import { getUser } from "@lowcoder-ee/redux/selectors/usersSelectors";
import { getDeploymentId } from "@lowcoder-ee/redux/selectors/configSelectors";
import { getOrgApiUsage, getOrgLastMonthApiUsage } from "redux/selectors/orgSelectors";
import { fetchAPIUsageAction, fetchLastMonthAPIUsageAction } from "redux/reduxActions/orgActions";
import { HelpText } from "components/HelpText";
import { useEffect } from "react";

const { Paragraph, Text } = Typography;

const StyledSection = styled.div`
  margin-bottom: 32px;

  .ant-card {
    border-radius: 8px;
  }

  .image-placeholder {
    background: #f5f5f5;
    border: 1px dashed #ccc;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    font-size: 14px;
  }
`;

export const AppUsage = () => {
  const isLicenseActive = useSelector(selectIsLicenseActive);
  return isLicenseActive ? <AppUsageRoutes /> : <AppUsageDoc />;
};

const AppUsageRoutes = () => (
  <Switch>
    <Route path={APP_USAGE_DASHBOARD} component={AppUsageDashboard} exact />
    <Route path={APP_USAGE_DETAIL} component={AppUsageDetail} exact />
  </Switch>
);

const AppUsageDoc = () => {

const user = useSelector(getUser);
const deploymentId = useSelector(getDeploymentId);
const dispatch = useDispatch();
const isLowCoderDomain = window.location.hostname === 'app.lowcoder.cloud';
  
const apiUsage = useSelector(getOrgApiUsage);
  useEffect(() => {
    dispatch(fetchAPIUsageAction(user.currentOrgId));
  }, [user.currentOrgId])

  const lastMonthApiUsage = useSelector(getOrgLastMonthApiUsage);
  useEffect(() => {
    dispatch(fetchLastMonthAPIUsageAction(user.currentOrgId));
  }, [user.currentOrgId])

  return (
    <Level1SettingPageContent>
      <Level1SettingPageTitle>{trans("enterprise.AppUsageTitle")}</Level1SettingPageTitle>

      <StyledSection>
        <Card title={trans("enterprise.AppUsageIntroTitle")}>
          <Paragraph>{trans("enterprise.AppUsageIntro1")}</Paragraph>
          <Paragraph>{trans("enterprise.AppUsageIntro2")}</Paragraph>
          <Paragraph>{trans("enterprise.AppUsageIntro3")}</Paragraph>
        </Card>
      </StyledSection>

      <StyledSection>
        <Card title={trans("enterprise.AppUsageMetricsTitle")}>
          <Paragraph>{trans("enterprise.AppUsageMetricsIntro")}</Paragraph>
          <ul>
            <li>{trans("enterprise.MetricActiveUsers")}</li>
            <li>{trans("enterprise.MetricViewsPerApp")}</li>
            <li>{trans("enterprise.MetricDevices")}</li>
            <li>{trans("enterprise.MetricBrowsers")}</li>
            <li>{trans("enterprise.MetricCountries")}</li>
          </ul>
        </Card>
      </StyledSection>

      <StyledSection>
        <Card title={trans("enterprise.AppUsageScreenshotsTitle")}>
          <Row gutter={[24, 24]}>
            <Col span={8}>
              <Image
                width="100%"
                height={180}
                src="https://raw.githubusercontent.com/lowcoder-org/lowcoder-media-assets/refs/heads/main/images/Enterprise%20Edition%20%7C%20App%20Usage%20Metrics%20Geomap.png"
                alt="Enterprise Edition | App Usage Metrics Geomap"
                style={{ borderRadius: 8, objectFit: 'cover', border: "1px solid #d9d9d9" }}
                preview={{
                  mask: <Text>Enterprise Edition | App Usage Metrics Geomap</Text>,
                }}
              />
            </Col>
            <Col span={8}>
              <Image
                width="100%"
                height={180}
                src="https://raw.githubusercontent.com/lowcoder-org/lowcoder-media-assets/refs/heads/main/images/Enterprise%20Edition%20%7C%20App%20Usage%20Metrics%20Stats.png"
                alt="Enterprise Edition | App Usage Metrics and Statistics"
                style={{ borderRadius: 8, objectFit: 'cover', border: "1px solid #d9d9d9" }}
                preview={{
                  mask: <Text>Enterprise Edition | App Usage Metrics and Statistics</Text>,
                }}
              />
            </Col>
          </Row>
        </Card>
      </StyledSection>

      <StyledSection>
        <Card title={trans("enterprise.PricingTitle")}>
          <Paragraph>{trans("enterprise.PricingIntro")}</Paragraph>

          <Paragraph>
            <Text strong>{trans("enterprise.FlatRateTitle")}</Text>
            <br />
            {trans("enterprise.FlatRateDesc")}
          </Paragraph>
          <ul>
            <li>{trans("enterprise.FlatRatePoint1")}</li>
            <li>{trans("enterprise.FlatRatePoint2")}</li>
          </ul>

          <Divider />

          <Paragraph>
            <Text strong>{trans("enterprise.UsagePricingTitle")}</Text>
            <br />
            {trans("enterprise.UsagePricingDesc")}
          </Paragraph>
          <ul>
            <li>{trans("enterprise.API100k")}</li>
            <li>{trans("enterprise.API1M")}</li>
            <li>{trans("enterprise.API10M")}</li>
          </ul>

          <Paragraph>{trans("enterprise.UsageOverrunDesc")}</Paragraph>
          <Paragraph>{trans("enterprise.UsageTopUpInfo")}</Paragraph>

          <Divider/>

          <Text strong className="section-title">{trans("advanced.APIConsumption")}</Text>
          <HelpText style={{ marginBottom: 12 }}>{trans("advanced.APIConsumptionDescription")}</HelpText>
          <div className="section-content">
          {trans("advanced.overallAPIConsumption")} : {apiUsage ? Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(apiUsage) + " " + trans("enterprise.apiUsage") : trans("enterprise.loadingApiUsage")}<br/>
          {trans("advanced.lastMonthAPIConsumption")} : {lastMonthApiUsage ? Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(lastMonthApiUsage) + " " + trans("enterprise.apiUsage") : trans("enterprise.loadingApiUsage")}
          </div>

        </Card>
      </StyledSection>

    </Level1SettingPageContent>
  );
};
