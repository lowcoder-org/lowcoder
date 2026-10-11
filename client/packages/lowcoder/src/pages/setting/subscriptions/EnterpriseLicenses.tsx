import { useState } from "react";
import { Alert, Button, Card, Empty, Space, Tag, Typography, message } from "antd";
import { useSelector } from "react-redux";
import { saveAs } from "file-saver";
import { getDeploymentId } from "redux/selectors/configSelectors";
import { getUser } from "redux/selectors/usersSelectors";
import { currentOrgAdmin } from "util/permissionUtils";
import { refreshEnterpriseLicenses, useEnterpriseLicenseStatus } from "util/enterpriseLicenseSync";
import { getEnterpriseBillingPortal, getEnterpriseLicenseFile, openStripePage } from "api/licenseRequestApi";
import LicenseRequestModal from "../licenseRequestModal";

export function EnterpriseLicenses() {
  const user = useSelector(getUser);
  const deploymentId = useSelector(getDeploymentId);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string>();
  const state = useEnterpriseLicenseStatus(`${user.currentOrgId}:${user.id}`);
  if (!currentOrgAdmin(user)) return null;
  const download = async (id: string) => {
    setBusy(id);
    try {
      const file = await getEnterpriseLicenseFile(user.currentOrgId, id);
      const bytes = Uint8Array.from(atob(file.license), char => char.charCodeAt(0));
      saveAs(new Blob([bytes], { type: "application/octet-stream" }), file.filename);
    } catch { message.error("Could not download this license. Please refresh and try again."); }
    finally { setBusy(undefined); }
  };
  const portal = async (requestId: string) => {
    setBusy(requestId);
    try { openStripePage((await getEnterpriseBillingPortal(user.currentOrgId, requestId)).url, "portal"); }
    catch { message.error("Could not open billing management."); }
    finally { setBusy(undefined); }
  };
  return <Card title="Enterprise licenses" style={{ marginTop: 24 }}>
    <Typography.Paragraph>Deployment ID for this installation: <Typography.Text code copyable={!!deploymentId}>{deploymentId || "Loading…"}</Typography.Text></Typography.Paragraph>
    <Typography.Paragraph>License files are private to the admin account that purchased them. Return here after payment to download a file for each installation.</Typography.Paragraph>
    <Space wrap style={{ marginBottom: 16 }}>
      <Button type="primary" onClick={() => setOpen(true)}>Request Enterprise licenses</Button>
      <Button onClick={refreshEnterpriseLicenses} loading={state.loading}>Refresh licenses</Button>
    </Space>
    {state.error && <Alert type="warning" showIcon style={{ marginBottom: 16 }} message="License service unavailable"
      description="Licenses could not be refreshed. Try again shortly, or ask your installation administrator to check its licensing connection." />}
    {state.data.orders.map(order => <Card size="small" key={order.requestId} style={{ marginBottom: 12 }}>
      <Space wrap><Typography.Text strong>{order.companyName}</Typography.Text><Tag>{order.status}</Tag>
        <Typography.Text>{order.deploymentIds.length} instances · {order.billingInterval === "year" ? "Annual" : "Monthly"}</Typography.Text>
        {order.checkoutUrl && order.status === "awaiting_payment" && <Button size="small" onClick={() => openStripePage(order.checkoutUrl!, "checkout")}>Continue payment</Button>}
        {order.status !== "awaiting_payment" && <Button size="small" loading={busy === order.requestId} onClick={() => portal(order.requestId)}>Manage billing</Button>}
      </Space>
    </Card>)}
    {state.data.licenses.map(file => <div key={file.id} style={{ padding: "12px 0", borderTop: "1px solid #eee" }}>
      <Typography.Paragraph style={{ overflowWrap: "anywhere", marginBottom: 4 }}>{file.filename}</Typography.Paragraph>
      <Space wrap><Typography.Text type="secondary">{file.notBefore} – {file.notAfter}</Typography.Text>
        <Button size="small" loading={busy === file.id} onClick={() => download(file.id)}>Download .lic</Button></Space>
    </div>)}
    {!state.loading && !state.error && !state.data.orders.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No Enterprise purchases for your admin account yet." />}
    <Typography.Paragraph type="secondary" style={{ marginTop: 16 }}>Install each downloaded file in its deployment’s configured license directory (normally /licenses). Renewed files are created while you are signed in, after Stripe confirms payment. Sign in and replace expiring files in time to avoid an interruption.</Typography.Paragraph>
    <LicenseRequestModal open={open} onClose={() => setOpen(false)} orgId={user.currentOrgId} />
  </Card>;
}
