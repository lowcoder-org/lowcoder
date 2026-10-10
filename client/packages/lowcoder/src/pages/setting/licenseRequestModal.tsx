import { useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Form, Input, Modal, Radio, Select, Space, Steps, Typography, message } from "antd";
import { useSelector } from "react-redux";
import { v4 as uuid } from "uuid";
import { getCurrentOrg } from "redux/selectors/orgSelectors";
import { getUser, getCurrentUser } from "redux/selectors/usersSelectors";
import { getDeploymentId } from "redux/selectors/configSelectors";
import { currentOrgAdmin } from "util/permissionUtils";
import { LicenseRequestData, openStripePage, submitLicenseRequest } from "api/licenseRequestApi";

const { Paragraph, Text } = Typography;
interface Props { open: boolean; onClose: () => void; orgId: string; }
const money = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);

export function LicenseRequestModal({ open, onClose, orgId }: Props) {
  const [form] = Form.useForm();
  const user = useSelector(getUser);
  const profile = useSelector(getCurrentUser);
  const org = useSelector(getCurrentOrg);
  const deploymentId = useSelector(getDeploymentId);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<LicenseRequestData>();
  const attempt = useRef<{ payload: string; id: string }>();
  const interval = Form.useWatch("billingInterval", form) || "year";
  const count = Form.useWatch("instanceCount", form) || 1;

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setReview(undefined);
    form.resetFields();
    form.setFieldsValue({ contactData: { companyName: org?.name, contactName: profile.name || user.username, contactEmail: profile.email },
      billingInterval: "year", instanceCount: 1, deploymentIds: [deploymentId || "", "", ""] });
  }, [open, orgId]);
  useEffect(() => {
    if (open && deploymentId) form.setFieldValue(["deploymentIds", 0], deploymentId);
  }, [open, deploymentId, form]);

  const next = async () => {
    try {
      await form.validateFields();
      if (step === 1) {
        const values = form.getFieldsValue(true);
        const ids = values.deploymentIds.slice(0, values.instanceCount).map((id: string) => id.trim());
        if (new Set(ids).size !== ids.length) { message.error("Each instance needs a different deployment ID."); return; }
        const payload = { orgId, contactData: values.contactData, billingInterval: values.billingInterval, deploymentIds: ids };
        const key = JSON.stringify(payload);
        if (attempt.current?.payload !== key) attempt.current = { payload: key, id: uuid() };
        setReview({ ...payload, requestId: attempt.current.id });
      }
      setStep(step + 1);
    } catch { /* Form displays field validation. */ }
  };
  const checkout = async () => {
    if (!review || loading) return;
    setLoading(true);
    try {
      const result = await submitLicenseRequest(review);
      openStripePage(result.checkoutUrl, "checkout");
    } catch { message.error("Could not open payment. Please retry; your request will not be duplicated."); }
    finally { setLoading(false); }
  };
  const contactFields = [
    ["companyName", "Company name"], ["address", "Billing address"], ["registerNumber", "Company registration number"],
    ["contactName", "Contact person"], ["contactEmail", "Contact email"], ["contactPhone", "Contact phone"],
    ["taxId", "Tax ID (optional)"], ["vatId", "VAT ID (optional)"],
  ];

  return <Modal open={open} onCancel={loading ? undefined : onClose} footer={null} width={760}
    title="Enterprise License Request" destroyOnHidden>
    <Steps size="small" current={step} items={[{ title: "Company details" }, { title: "Instances & billing" }, { title: "Review & pay" }]} style={{ margin: "24px 0" }} />
    {!currentOrgAdmin(user) ? <Alert type="warning" message="Only a workspace admin can purchase Enterprise licenses." /> :
      <Form form={form} layout="vertical" preserve>
        {step === 0 && contactFields.map(([name, label]) => <Form.Item key={name} name={["contactData", name]} label={label}
          rules={name === "taxId" || name === "vatId" ? [] : [{ required: true, whitespace: true, message: `Enter ${label.toLowerCase()}.` },
            ...(name === "contactEmail" ? [{ type: "email" as const, message: "Enter a valid email address." }] : [])]}>
          <Input maxLength={name === "address" ? 1000 : 200} />
        </Form.Item>)}
        {step === 1 && <>
          <Form.Item name="billingInterval" label="Billing" rules={[{ required: true }]}>
            <Radio.Group style={{ width: "100%" }}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Card size="small" style={{ borderColor: interval === "year" ? "#1677ff" : undefined }}>
                  <Radio value="year"><strong>Annual · Recommended</strong> — $4,990 per instance / year</Radio>
                  <Paragraph style={{ margin: "8px 0 0 24px" }}>Save $518 per instance each year (9.4%). One license file for the full paid year.</Paragraph>
                </Card>
                <Card size="small"><Radio value="month">Monthly — $459 per instance / month</Radio></Card>
              </Space>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="instanceCount" label="Number of instances" rules={[{ required: true }]}>
            <Select options={[1, 2, 3].map(value => ({ value, label: `${value} ${value === 1 ? "instance" : "instances"}` }))} />
          </Form.Item>
          <Paragraph>Each separately deployed Lowcoder installation needs its own license. For another installation, sign in there as an admin, open <strong>Settings → Subscription → Enterprise licenses</strong>, and copy its Deployment ID.</Paragraph>
          {Array.from({ length: count }, (_, index) => <Form.Item key={index} name={["deploymentIds", index]}
            label={index === 0 ? "Instance 1 · This installation" : `Instance ${index + 1} · Other installation`}
            rules={[{ required: true, message: "Enter the deployment ID." }, { pattern: /^[a-zA-Z0-9_-]{1,36}$/, message: "Use the deployment ID shown in that installation." }]}>
            <Input readOnly={index === 0} placeholder={index === 0 ? "Loading deployment ID…" : "Paste deployment ID"} maxLength={36} />
          </Form.Item>)}
          <Paragraph strong>Total: {money(count * (interval === "year" ? 4990 : 459))} / {interval === "year" ? "year" : "month"}</Paragraph>
          <Text type="secondary">Renews automatically. Manage renewal and payment details from your Enterprise licenses.</Text>
        </>}
        {step === 2 && review && <>
          <Card title={review.contactData.companyName} style={{ marginBottom: 16 }}>
            <Paragraph>{review.contactData.address}</Paragraph>
            <Paragraph>{review.contactData.contactName} · {review.contactData.contactEmail}</Paragraph>
            <Paragraph>Registration: {review.contactData.registerNumber} · Phone: {review.contactData.contactPhone}</Paragraph>
            {review.contactData.taxId && <Paragraph>Tax ID: {review.contactData.taxId}</Paragraph>}
            {review.contactData.vatId && <Paragraph>VAT ID: {review.contactData.vatId}</Paragraph>}
          </Card>
          <Paragraph strong>{review.deploymentIds.length} {review.deploymentIds.length === 1 ? "instance" : "instances"} · {money(review.deploymentIds.length * (review.billingInterval === "year" ? 4990 : 459))} / {review.billingInterval === "year" ? "year" : "month"}</Paragraph>
          {review.deploymentIds.map((id, index) => <Paragraph key={id}>Instance {index + 1}: <Text code>{id}</Text></Paragraph>)}
          <Alert type="info" showIcon message="Your license files appear here after payment is verified."
            description="Only your admin account can download them. Renewed licenses are created while you are signed in to Lowcoder. If you do not sign in and install the renewed files before the old ones expire, Enterprise services can be interrupted." />
          <Paragraph style={{ marginTop: 12 }}>Payment and any applicable taxes are confirmed securely in Stripe.</Paragraph>
        </>}
        <Space wrap style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
          {step > 0 && <Button disabled={loading} onClick={() => setStep(step - 1)}>Back</Button>}
          {step < 2 ? <Button type="primary" onClick={next}>Continue</Button> :
            <Button type="primary" loading={loading} onClick={checkout}>Continue to secure payment</Button>}
        </Space>
      </Form>}
  </Modal>;
}
export default LicenseRequestModal;
