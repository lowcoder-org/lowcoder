import { useEffect } from "react";
import { Modal, Typography, Card, Space, Divider } from "antd";
import styled from "styled-components";
import Title from "antd/es/typography/Title";
import { trans } from "i18n";

const { Paragraph, Text } = Typography;

const HubspotFormContainer = styled.div`
  max-width: 100%;
  width: 100%;
  .hs-form {
    max-width: 100% !important;
  }
  --step-content-padding: 0px;
  .hsfc-Step__Content {
    padding: 0 !important;
  }
`;

declare global {
  interface Window {
    hbspt: {
      forms: {
        create: (options: {
          region: string;
          portalId: string;
          formId: string;
          target: string | HTMLElement | null;
        }) => void;
      };
    };
  }
}

interface Props {
  open: boolean;
  onClose: () => void;
  orgId: string;
  deploymentIds: string[];
}

export function HubspotModal({ open, onClose, orgId, deploymentIds }: Props) {

  const isLowCoderDomain = typeof window !== "undefined" && window.location.hostname === "app.lowcoder.cloud";

  useEffect(() => {
    if (!open) return;

    const scriptId = "hubspot-script";
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement;

    const createForm = () => {
      setTimeout(() => {
        if (window.hbspt && document.querySelector("#hubspot-form")) {
          window.hbspt.forms.create({
            region: "eu1",
            portalId: "144574215",
            formId: "f03697ad-62cf-4161-a3de-228a2db1180b",
            target: "#hubspot-form",
          });
        }
      }, 0);
    };

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://js-eu1.hsforms.net/forms/embed/v2.js";
      script.async = true;
      script.defer = true;
      script.id = scriptId;
      script.onload = createForm;
      document.body.appendChild(script);
    } else {
      if (window.hbspt) {
        createForm();
      } else {
        existingScript.addEventListener("load", createForm);
      }
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      destroyOnHidden
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Info Header Card */}
        <Card>
          <Typography>
            <Title level={2}>{trans("enterprise.requestLicense")}</Title>

            <Paragraph strong>
              <Text>Organization ID:</Text>
            </Paragraph>
            <Paragraph copyable>{orgId}</Paragraph>

            
            { !isLowCoderDomain && 
            <>
              <Paragraph strong>
                <Text>Deployment IDs:</Text>
              </Paragraph>
              <Space direction="vertical" style={{ width: "100%" }}>
                  {deploymentIds.length === 0 ? (
                    <Text type="secondary">No deployments found.</Text>
                  ) : (
                    deploymentIds.map((id, idx) => (
                      <Paragraph key={idx} copyable style={{ marginBottom: 4 }}>
                        {id}
                      </Paragraph>
                    ))
                  )}
              </Space></>
            }

          </Typography>
        </Card>

        {/* Hubspot Form Card */}
        <Card>
          <HubspotFormContainer>
            <div id="hubspot-form"/>
          </HubspotFormContainer>
        </Card>
      </Space>
    </Modal>
  );
}
