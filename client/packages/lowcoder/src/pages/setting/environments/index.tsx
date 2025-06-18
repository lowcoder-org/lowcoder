import { useSelector, useDispatch } from "react-redux";
import { selectIsLicenseActive } from "redux/selectors/enterpriseSelectors";
import EnvironmentsSettings from "@lowcoder-ee/pages/setting/environments/Environments";
import { Level1SettingPageContent, Level1SettingPageTitle } from "../styled";
import styled from "styled-components";
import { Card, Typography, Row, Col, Divider, Button } from "antd";
import { trans } from "i18n";
import { useEffect, useState } from "react";
import { getUser } from "@lowcoder-ee/redux/selectors/usersSelectors";
import { HubspotModal } from "../hubspotModal";
import { getDeploymentId } from "@lowcoder-ee/redux/selectors/configSelectors";
import { Image } from 'antd';
import { getOrgApiUsage, getOrgLastMonthApiUsage } from "redux/selectors/orgSelectors";
import { fetchAPIUsageAction, fetchLastMonthAPIUsageAction } from "redux/reduxActions/orgActions";
import { HelpText } from "components/HelpText";

const { Paragraph, Text } = Typography;

const StyledSection = styled.div`
  margin-bottom: 32px;

  .ant-card {
    border-radius: 8px;
  }

  .image-placeholder {
    background: #f0f2f5;
    border: 1px dashed #d9d9d9;
    height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    font-size: 14px;
  }
`;

export const Environments = () => {
  const isLicenseActive = useSelector(selectIsLicenseActive);
  return isLicenseActive ? <EnvironmentsSettings /> : <EnvironmentsPromo />;
};

const EnvironmentsPromo = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const user = useSelector(getUser);
  const deploymentId = useSelector(getDeploymentId);
  const isLowCoderDomain = window.location.hostname === 'app.lowcoder.cloud';

  const dispatch = useDispatch();

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
      <Level1SettingPageTitle>{trans("enterprise.EnvironmentsTitle")}</Level1SettingPageTitle>

      <StyledSection>
        <Card title={trans("enterprise.EnvironmentsIntroTitle")}>
          <Paragraph>{trans("enterprise.EnvironmentsIntro1")}</Paragraph>
          <Paragraph>{trans("enterprise.EnvironmentsIntro2")} {trans("enterprise.EnvironmentsIntro3")}</Paragraph>
          <Paragraph>{trans("enterprise.EnvironmentsIntro4")}</Paragraph>
        </Card>
      </StyledSection>

      <StyledSection>
        <Card title={trans("enterprise.EnvironmentsUseCasesTitle")}>
          <Paragraph>{trans("enterprise.EnvironmentsUseCase1")} {trans("enterprise.EnvironmentsUseCase2")} {trans("enterprise.EnvironmentsUseCase3")}</Paragraph>
        </Card>
      </StyledSection>

      <StyledSection>
        <Card title={trans("enterprise.EnvironmentsFeaturesTitle")}>
          <ul>
            <li>{trans("enterprise.EnvironmentsFeature1")}</li>
            <li>{trans("enterprise.EnvironmentsFeature2")}</li>
            <li>{trans("enterprise.EnvironmentsFeature3")}</li>
            <li>{trans("enterprise.EnvironmentsFeature5")}</li>
          </ul>
        </Card>
      </StyledSection>

      <StyledSection>
        <Card title={trans("enterprise.EnvironmentsFeaturePreviewTitle")}>
          <Row gutter={[24, 24]}>
            <Col span={8}>
              <Image
                width="100%"
                height={180}
                src="https://raw.githubusercontent.com/lowcoder-org/lowcoder-media-assets/refs/heads/main/images/Enterprise%20Edition%20%7C%C2%A0Environments%20Overview.png"
                alt="Enterprise Edition | Staging Environments in Lowcoder"
                style={{ borderRadius: 8, objectFit: 'cover', border: "1px solid #d9d9d9" }}
                preview={{
                  mask: <Text>Enterprise Edition | Staging Environments in Lowcoder</Text>,
                }}
              />
            </Col>
            <Col span={8}>
              <Image
                width="100%"
                height={180}
                src="https://raw.githubusercontent.com/lowcoder-org/lowcoder-media-assets/refs/heads/main/images/Enterprise%20Edition%20%7C%C2%A0Environments%20Workspaces.png"
                alt="Enterprise Edition | Environments Workspaces"
                style={{ borderRadius: 8, objectFit: 'cover', border: "1px solid #d9d9d9" }}
                preview={{
                  mask: <Text>Enterprise Edition | Environments Workspaces</Text>,
                }}
              />
            </Col>
            <Col span={8}>
              <Image
                width="100%"
                height={180}
                src="https://raw.githubusercontent.com/lowcoder-org/lowcoder-media-assets/refs/heads/main/images/Enterprise%20Edition%20%7C%C2%A0Environments%20Deploy%20App.png"
                alt="Enterprise Edition | Environments Deploy App"
                style={{ borderRadius: 8, objectFit: 'cover', border: "1px solid #d9d9d9" }}
                preview={{
                  mask: <Text>Enterprise Edition | Environments Deploy App</Text>,
                }}
              />
            </Col>
          </Row>
        </Card>
      </StyledSection>

      {!isLowCoderDomain && <StyledSection>
        <Card title={trans("enterprise.yourDeploymentID")}>
          <Paragraph><h3>{deploymentId}</h3></Paragraph>
        </Card>
      </StyledSection> }

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

      <HubspotModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        orgId={user?.currentOrgId}
        deploymentIds={[]} // Add if available
      />
    </Level1SettingPageContent>
  );
};
