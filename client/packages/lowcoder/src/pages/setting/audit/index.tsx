import { AUDIT_LOG_DASHBOARD, AUDIT_LOG_DETAIL } from "@lowcoder-ee/constants/routesURL";
import { Route, Switch } from "react-router-dom";
import { AuditLogDashboard } from "./dashboard";
import { AuditLogDetail } from "./detail";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import { Card, Divider, Typography, Row, Col, Image } from "antd";
import { HelpText } from "components/HelpText";
import { Level1SettingPageContent, Level1SettingPageTitle } from "../styled";
import { trans } from "i18n";
import { selectIsLicenseActive } from "redux/selectors/enterpriseSelectors";

import { getUser } from "@lowcoder-ee/redux/selectors/usersSelectors";
import { getDeploymentId } from "@lowcoder-ee/redux/selectors/configSelectors";
import { getOrgApiUsage, getOrgLastMonthApiUsage } from "redux/selectors/orgSelectors";
import { fetchAPIUsageAction, fetchLastMonthAPIUsageAction } from "redux/reduxActions/orgActions";
import { useEffect } from "react";

const { Title, Paragraph, Text } = Typography;

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

export const AuditLog = () => {
  const isLicenseActive = useSelector(selectIsLicenseActive);
  return isLicenseActive ? <AuditLogRoutes /> : <Audit />;
};

const AuditLogRoutes = () => (
  <Switch>
    <Route path={AUDIT_LOG_DASHBOARD} component={AuditLogDashboard} exact />
    <Route path={AUDIT_LOG_DETAIL} component={AuditLogDetail} exact />
  </Switch>
);

const Audit = () => {

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
      <Level1SettingPageTitle>{trans("enterprise.AuditLogsTitle")}</Level1SettingPageTitle>

      <StyledSection>
        <Card title={trans("enterprise.AuditLogsIntroTitle")}>
          <Paragraph>{trans("enterprise.AuditLogsIntro1")} {trans("enterprise.AuditLogsIntro2")}</Paragraph>
          <Paragraph>{trans("enterprise.AuditLogsIntro3")}</Paragraph>
        </Card>
      </StyledSection>

      <StyledSection>
        <Card title={trans("enterprise.AuditLogsEventsTitle")}>
          <Paragraph>{trans("enterprise.AuditLogsEventsIntro")}</Paragraph>
          <Row gutter={[16, 8]}>
            <Col span={12}>
              <ul>
                <li>{trans("enterprise.SignIn")}</li>
                <li>{trans("enterprise.Logout")}</li>
                <li>{trans("enterprise.ViewApp")}</li>
                <li>{trans("enterprise.CreateApp")}</li>
                <li>{trans("enterprise.DeleteApp")}</li>
                <li>{trans("enterprise.UpdateApp")}</li>
                <li>{trans("enterprise.MoveToFolder")}</li>
                <li>{trans("enterprise.MoveToTrash")}</li>
                <li>{trans("enterprise.RestoreApp")}</li>
                <li>{trans("enterprise.CreateFolder")}</li>
                <li>{trans("enterprise.DeleteFolder")}</li>
                <li>{trans("enterprise.UpdateFolder")}</li>
                <li>{trans("enterprise.ExecuteDataQuery")}</li>
              </ul>
            </Col>
            <Col span={12}>
              <ul>
                <li>{trans("enterprise.CreateUserGroup")}</li>
                <li>{trans("enterprise.UpdateUserGroup")}</li>
                <li>{trans("enterprise.DeleteUserGroup")}</li>
                <li>{trans("enterprise.AddGroupMember")}</li>
                <li>{trans("enterprise.UpdateGroupMemberRole")}</li>
                <li>{trans("enterprise.LeaveUserGroup")}</li>
                <li>{trans("enterprise.RemoveGroupMember")}</li>
                <li>{trans("enterprise.ServerStartup")}</li>
                <li>{trans("enterprise.CreateDataSource")}</li>
                <li>{trans("enterprise.UpdateDataSource")}</li>
                <li>{trans("enterprise.DeleteDataSource")}</li>
                <li>{trans("enterprise.GrantUpdateDeletePermission")}</li>
                <li>{trans("enterprise.LibraryQueryActions")}</li>
                <li>{trans("enterprise.PublishLibraryQuery")}</li>
              </ul>
            </Col>
          </Row>
        </Card>
      </StyledSection>

      <StyledSection>
        <Card title={trans("enterprise.AuditLogsPreviewTitle")}>
          <Row gutter={[24, 24]}>
            <Col span={8}>
              <Image
                width="100%"
                height={180}
                src="https://raw.githubusercontent.com/lowcoder-org/lowcoder-media-assets/refs/heads/main/images/Enterprise%20Edition%20%7C%20Audit%20Log%20Filters.png"
                alt="Enterprise Edition | Audit Log Data Filters"
                style={{ borderRadius: 8, objectFit: 'cover', border: "1px solid #d9d9d9" }}
                preview={{
                  mask: <Text>Enterprise Edition | Audit Log Data Filters</Text>,
                }}
              />
            </Col>
            <Col span={8}>
              <Image
                width="100%"
                height={180}
                src="https://raw.githubusercontent.com/lowcoder-org/lowcoder-media-assets/refs/heads/main/images/Enterprise%20Edition%20%7C%20Audit%20Log%20Table.png"
                alt="Enterprise Edition | Audit Log Table"
                style={{ borderRadius: 8, objectFit: 'cover', border: "1px solid #d9d9d9" }}
                preview={{
                  mask: <Text>Enterprise Edition | Audit Log Table</Text>,
                }}
              />
            </Col>
            <Col span={8}>
              <Image
                width="100%"
                height={180}
                src="https://raw.githubusercontent.com/lowcoder-org/lowcoder-media-assets/refs/heads/main/images/Enterprise%20Edition%20%7C%20Audit%20Log%20Details.png"
                alt="Enterprise Edition | Audit Log Details"
                style={{ borderRadius: 8, objectFit: 'cover', border: "1px solid #d9d9d9" }}
                preview={{
                  mask: <Text>Enterprise Edition | Audit Log Details</Text>,
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