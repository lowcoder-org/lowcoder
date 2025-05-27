
import { Modal, Alert } from 'antd';
import { ExclamationCircleOutlined, WarningOutlined } from '@ant-design/icons';

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
        <span style={{ fontSize: 16, fontWeight: 600 }}>Overwrite Credentials Warning</span>
      </div>
    ),
    icon: null,
    content: (
      <div style={{ padding: '16px 0' }}>
        <Alert
          message="This action will overwrite existing credentials in the target environment."
          description={
            <div style={{ marginTop: 8 }}>
              <p style={{ margin: 0, fontWeight: 500 }}>
                This is a serious operation that may affect other applications and users.
              </p>
              <p style={{ margin: '8px 0 0 0', color: '#8c8c8c' }}>
                Are you sure you want to proceed?
              </p>
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 0, border: '1px solid #fff2e8', borderRadius: 8 }}
        />
      </div>
    ),
    okText: 'Continue',
    cancelText: 'Cancel',
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
        <span style={{ fontSize: 16, fontWeight: 600 }}>Final Confirmation Required</span>
      </div>
    ),
    icon: null,
    content: (
      <div style={{ padding: '16px 0' }}>
        <Alert
          message="Final Warning: Credential Overwrite"
          description={
            <div style={{ marginTop: 8 }}>
              <p style={{ margin: 0, fontWeight: 500 }}>
                You are about to overwrite credentials in the target environment. This action cannot be undone and may break existing integrations.
              </p>
              <p style={{ margin: '8px 0 0 0', color: '#8c8c8c' }}>
                Please confirm one more time.
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
            Are you absolutely certain you want to overwrite the credentials?
          </p>
        </div>
      </div>
    ),
    okText: 'Yes, Overwrite Credentials',
    okType: 'danger',
    cancelText: 'Cancel',
    okButtonProps: { style: { fontWeight: 500 } },
    cancelButtonProps: { style: { fontWeight: 500 } },
    width: 520,
    centered: false,
    onOk,
    onCancel
  });
} 