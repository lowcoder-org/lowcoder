import { APP_USAGE_DASHBOARD, APP_USAGE_DETAIL } from "@lowcoder-ee/constants/routesURL";
import { Route, Switch } from "react-router-dom";
import { AppUsageDashboard } from "./dashboard";
import { AppUsageDetail } from "./detail";
import { useSelector } from "react-redux";
import { selectIsLicenseActive } from "redux/selectors/enterpriseSelectors";
import styled from "styled-components";
import { Card, Row, Col, Typography } from "antd";
import { Level1SettingPageContent, Level1SettingPageTitle } from "../styled";
import { trans } from "i18n";

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
              <div className="image-placeholder">
                <Text type="secondary">{trans("enterprise.AppUsageScreenshot1")}</Text>
              </div>
            </Col>
            <Col span={8}>
              <div className="image-placeholder">
                <Text type="secondary">{trans("enterprise.AppUsageScreenshot2")}</Text>
              </div>
            </Col>
            <Col span={8}>
              <div className="image-placeholder">
                <Text type="secondary">{trans("enterprise.AppUsageScreenshot3")}</Text>
              </div>
            </Col>
          </Row>
        </Card>
      </StyledSection>
    </Level1SettingPageContent>
  );
};
