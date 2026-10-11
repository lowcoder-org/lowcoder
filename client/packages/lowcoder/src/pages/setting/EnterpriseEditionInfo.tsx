import { Alert, Button, Space, Typography } from "antd";
import { trans } from "i18n";

export function EnterpriseEditionInfo() {
  return <div style={{ maxWidth: 880, overflowWrap: "anywhere" }}>
    <Typography.Paragraph>{trans("enterprise.selfHosted.description")}</Typography.Paragraph>
    <Alert type="info" showIcon
      message={trans("enterprise.selfHosted.cloudTitle")}
      description={trans("enterprise.selfHosted.cloudDescription")} />
    <Typography.Title level={4}>{trans("enterprise.selfHosted.featuresTitle")}</Typography.Title>
    <ul>
      <li>{trans("enterprise.selfHosted.environments")}</li>
      <li>{trans("enterprise.selfHosted.branding")}</li>
      <li>{trans("enterprise.selfHosted.audit")}</li>
      <li>{trans("enterprise.selfHosted.usage")}</li>
    </ul>
    <Typography.Title level={4}>{trans("enterprise.selfHosted.getStartedTitle")}</Typography.Title>
    <ol>
      <li>{trans("enterprise.selfHosted.install")}</li>
      <li>{trans("enterprise.selfHosted.signIn")}</li>
      <li>{trans("enterprise.selfHosted.purchase")}</li>
      <li>{trans("enterprise.selfHosted.activate")}</li>
    </ol>
    <Space wrap style={{ marginTop: 8 }}>
      <Button type="primary" href="https://docs.lowcoder.cloud/lowcoder-documentation/setup-and-run/self-hosting"
        target="_blank" rel="noopener noreferrer" style={{ height: "auto", whiteSpace: "normal" }}>
        {trans("enterprise.selfHosted.guide")}
      </Button>
    </Space>
  </div>;
}
