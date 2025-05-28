import { useSelector } from "react-redux";
import { selectIsLicenseActive } from "redux/selectors/enterpriseSelectors";
import EnvironmentsSettings from "@lowcoder-ee/pages/setting/environments/Environments";
import { Level1SettingPageContent, Level1SettingPageTitle } from "../styled";
import styled from "styled-components";
import { Card, Typography, Row, Col, Divider, Button } from "antd";
import { trans } from "i18n";
import { useState } from "react";
import { getUser } from "@lowcoder-ee/redux/selectors/usersSelectors";
import { HubspotModal } from "../hubspotModal";

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

  return (
    <Level1SettingPageContent>
      <Level1SettingPageTitle>{trans("enterprise.EnvironmentsTitle")}</Level1SettingPageTitle>

      <StyledSection>
        <Card title={trans("enterprise.EnvironmentsIntroTitle")}>
          <Paragraph>{trans("enterprise.EnvironmentsIntro1")}</Paragraph>
          <Paragraph>{trans("enterprise.EnvironmentsIntro2")}</Paragraph>
          <Paragraph>{trans("enterprise.EnvironmentsIntro3")}</Paragraph>
        </Card>
      </StyledSection>

      <StyledSection>
        <Card title={trans("enterprise.EnvironmentsUseCasesTitle")}>
          <Paragraph>{trans("enterprise.EnvironmentsUseCase1")}</Paragraph>
          <Paragraph>{trans("enterprise.EnvironmentsUseCase2")}</Paragraph>
          <Paragraph>{trans("enterprise.EnvironmentsUseCase3")}</Paragraph>
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
