import { useSelector, useDispatch } from "react-redux";
import { selectIsLicenseActive } from "redux/selectors/enterpriseSelectors";
import { BrandingSetting } from "./BrandingSetting";
import { Level1SettingPageContent, Level1SettingPageTitle } from "../styled";
import styled from "styled-components";
import { Card, Typography, Row, Col, Divider, Image, Button } from "antd";
import { trans } from "i18n";
import { useState } from "react";

import { HelpText } from "components/HelpText";
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

export const Branding = () => {
  const isLicenseActive = useSelector(selectIsLicenseActive);
  return isLicenseActive ? <BrandingSetting /> : <BrandingPromo />;
};

const BrandingPromo = () => {

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
      <Level1SettingPageTitle>{trans("branding.title")}</Level1SettingPageTitle>

      <StyledSection>
        <Card title={trans("enterprise.BrandingIntroTitle")}>
          <Paragraph>
            {trans("enterprise.BrandingIntro1")}
          </Paragraph>
          <Paragraph>
            {trans("enterprise.BrandingIntro2")}
          </Paragraph>
          <Paragraph>
            {trans("enterprise.BrandingIntro3")}
          </Paragraph>
        </Card>
      </StyledSection>

      <StyledSection>
        <Card title={trans("branding.colorFontSection")}>
          <Paragraph>{trans("enterprise.BrandingColorsIntro1")}</Paragraph>
          <Paragraph>{trans("enterprise.BrandingColorsIntro2")}</Paragraph>
          <Paragraph>{trans("enterprise.BrandingFontsIntro")}</Paragraph>
          <Row gutter={[24, 24]}>
            <Col span={8}>
              <Image
                width="100%"
                height={180}
                src="https://raw.githubusercontent.com/lowcoder-org/lowcoder-media-assets/refs/heads/main/images/Enterprise%20Edition%20%7C%20Branding%20Settings.png"
                alt="Enterprise Edition | Branding Settings"
                style={{ borderRadius: 8, objectFit: 'cover', border: "1px solid #d9d9d9" }}
                preview={{
                  mask: <Text>Enterprise Edition | Branding Settings</Text>,
                }}
              />
            </Col>
            <Col span={8}>
              <Image
                width="100%"
                height={180}
                src="https://raw.githubusercontent.com/lowcoder-org/lowcoder-media-assets/refs/heads/main/images/Enterprise%20Edition%20%7C%20Branding%20%7C%20Admin%20Area.png"
                alt="Enterprise Edition | Branding | Admin Area"
                style={{ borderRadius: 8, objectFit: 'cover', border: "1px solid #d9d9d9" }}
                preview={{
                  mask: <Text>Enterprise Edition | Branding | Admin Area</Text>,
                }}
              />
            </Col>
            <Col span={8}>
              <Image
                width="100%"
                height={180}
                src="https://raw.githubusercontent.com/lowcoder-org/lowcoder-media-assets/refs/heads/main/images/Enterprise%20Edition%20%7C%20Branding%20%7C%20Customization.png"
                alt="Enterprise Edition | Branding | Customization"
                style={{ borderRadius: 8, objectFit: 'cover', border: "1px solid #d9d9d9" }}
                preview={{
                  mask: <Text>Enterprise Edition | Branding | Customization</Text>,
                }}
              />
            </Col>
            <Col span={8}>
              <Image
                width="100%"
                height={180}
                src="https://raw.githubusercontent.com/lowcoder-org/lowcoder-media-assets/refs/heads/main/images/Enterprise%20Edition%20%7C%20Branding%20%7C%20Whitelabel.png"
                alt="Enterprise Edition | Branding | White label"
                style={{ borderRadius: 8, objectFit: 'cover', border: "1px solid #d9d9d9" }}
                preview={{
                  mask: <Text>Enterprise Edition | Branding | White label</Text>,
                }}
              />
            </Col>
          </Row>
        </Card>
      </StyledSection>

      <StyledSection>
        <Card title={trans("branding.logoSection")}>
          <Paragraph>{trans("enterprise.BrandingLogosIntro")}</Paragraph>
        </Card>
      </StyledSection>

      <StyledSection>
        <Card title={trans("branding.textSection")}>
          <Paragraph>{trans("enterprise.BrandingPagesIntro1")}</Paragraph>
          <Paragraph>{trans("enterprise.BrandingPagesIntro2")}</Paragraph>
          <Paragraph>{trans("enterprise.BrandingMetaIntro")}</Paragraph>
        </Card>
      </StyledSection>

      <StyledSection>
        <Card title={trans("branding.showDocumentationSection")}>
          <Paragraph>{trans("enterprise.BrandingHelpLinksIntro")}</Paragraph>
          <Paragraph>{trans("enterprise.BrandingWhatsNewIntro")}</Paragraph>
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
