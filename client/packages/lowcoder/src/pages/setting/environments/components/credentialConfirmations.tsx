import { Modal, Alert } from 'antd';
import { ExclamationCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { trans } from "i18n";

interface ConfirmHandlers {
  onOk: () => void;
  onCancel: () => void;
}

/**
 * First-step confirmation modal (orange / warning).
 */
export function showFirstCredentialOverwriteConfirm({ onOk, onCancel }: ConfirmHandlers) {
  Modal.confirm({
    title: (
      <div style={{ display: 'flex', alignItems: 'center', color: '#ff7a00' }}>
        <WarningOutlined style={{ marginRight: 8, fontSize: 18 }} />
        <span style={{ fontSize: 16, fontWeight: 600 }}>
          {trans("enterprise.environments.credentialConfirmations.firstConfirmation.title")}
        </span>
      </div>
    ),
    icon: null,
    content: (
      <div style={{ padding: '16px 0' }}>
        <Alert
          message={trans("enterprise.environments.credentialConfirmations.firstConfirmation.message")}
          description={
            <div style={{ marginTop: 8 }}>
              <p style={{ margin: 0, fontWeight: 500 }}>
                {trans("enterprise.environments.credentialConfirmations.firstConfirmation.description")}
              </p>
              <p style={{ margin: '8px 0 0 0', color: '#8c8c8c' }}>
                {trans("enterprise.environments.credentialConfirmations.firstConfirmation.question")}
              </p>
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 0, border: '1px solid #fff2e8', borderRadius: 8 }}
        />
      </div>
    ),
    okText: trans("enterprise.environments.credentialConfirmations.firstConfirmation.continueButton"),
    cancelText: trans("enterprise.environments.credentialConfirmations.firstConfirmation.cancelButton"),
    okButtonProps: {
      style: { backgroundColor: '#ff7a00', borderColor: '#ff7a00', fontWeight: 500 }
    },
    cancelButtonProps: {
      style: { fontWeight: 500 }
    },
    width: 520,
    centered: false,
    onOk,
    onCancel
  });
}

/**
 * Second-step (final) confirmation modal (red / danger).
 */
export function showSecondCredentialOverwriteConfirm({ onOk, onCancel }: ConfirmHandlers) {
  Modal.confirm({
    title: (
      <div style={{ display: 'flex', alignItems: 'center', color: '#ff4d4f' }}>
        <ExclamationCircleOutlined style={{ marginRight: 8, fontSize: 18 }} />
        <span style={{ fontSize: 16, fontWeight: 600 }}>
          {trans("enterprise.environments.credentialConfirmations.secondConfirmation.title")}
        </span>
      </div>
    ),
    icon: null,
    content: (
      <div style={{ padding: '16px 0' }}>
        <Alert
          message={trans("enterprise.environments.credentialConfirmations.secondConfirmation.message")}
          description={
            <div style={{ marginTop: 8 }}>
              <p style={{ margin: 0, fontWeight: 500 }}>
                {trans("enterprise.environments.credentialConfirmations.secondConfirmation.description")}
              </p>
              <p style={{ margin: '8px 0 0 0', color: '#8c8c8c' }}>
                {trans("enterprise.environments.credentialConfirmations.secondConfirmation.confirmOnceMore")}
              </p>
            </div>
          }
          type="error"
          showIcon
          style={{ marginBottom: 16, border: '1px solid #ffebee', borderRadius: 8 }}
        />
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#fff2f0',
            borderRadius: 8,
            border: '1px solid #ffccc7'
          }}
        >
          <p style={{ margin: 0, fontWeight: 600, color: '#cf1322', fontSize: 14 }}>
            {trans("enterprise.environments.credentialConfirmations.secondConfirmation.finalQuestion")}
          </p>
        </div>
      </div>
    ),
    okText: trans("enterprise.environments.credentialConfirmations.secondConfirmation.confirmButton"),
    okType: 'danger',
    cancelText: trans("enterprise.environments.credentialConfirmations.secondConfirmation.cancelButton"),
    okButtonProps: { style: { fontWeight: 500 } },
    cancelButtonProps: { style: { fontWeight: 500 } },
    width: 520,
    centered: false,
    onOk,
    onCancel
  });
} 