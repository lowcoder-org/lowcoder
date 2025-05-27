import { useSelector } from "react-redux";
import { selectIsLicenseActive } from "redux/selectors/enterpriseSelectors";
import { BrandingSetting } from "./BrandingSetting";
import { Level1SettingPageContent, Level1SettingPageTitle } from "../styled";
import styled from "styled-components";
import { Card, Typography, Row, Col, Divider, Image, Button } from "antd";
import { trans } from "i18n";
import { useState } from "react";
import { getUser } from "@lowcoder-ee/redux/selectors/usersSelectors";

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
            <Col span={12}>
              <div className="image-placeholder">
                <Text type="secondary">{trans("branding.logoHelp")}</Text>
              </div>
            </Col>
            <Col span={12}>
              <div className="image-placeholder">
                <Text type="secondary">{trans("branding.squareLogoHelp")}</Text>
              </div>
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
        </Card>
      </StyledSection>

    </Level1SettingPageContent>
  );
};
