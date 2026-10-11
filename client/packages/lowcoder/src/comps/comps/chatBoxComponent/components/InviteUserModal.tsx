import React, { useCallback } from "react";
import { Modal, Form, Input, Button, Space, Alert } from "antd";
import { UserAddOutlined, LockOutlined } from "@ant-design/icons";
import type { ChatRoom } from "../store";
import { trans } from "i18n";

export interface InviteUserModalProps {
  open: boolean;
  onClose: () => void;
  currentRoom: ChatRoom | null;
  onSendInvite: (toUserId: string, toUserName?: string) => Promise<boolean>;
}

export const InviteUserModal = React.memo((props: InviteUserModalProps) => {
  const { open, onClose, currentRoom, onSendInvite } = props;
  const [form] = Form.useForm();

  const handleSubmit = useCallback(async () => {
    const values = await form.validateFields();
    const ok = await onSendInvite(
      values.toUserId.trim(),
      values.toUserName?.trim() || undefined,
    );
    if (ok) {
      form.resetFields();
      onClose();
    }
  }, [form, onClose, onSendInvite]);

  const handleCancel = useCallback(() => {
    form.resetFields();
    onClose();
  }, [form, onClose]);

  const isPrivateRoom = currentRoom?.type === "private";

  return (
    <Modal
      title={trans("chatBox.inviteUserTitle")}
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={420}
      centered
      destroyOnHidden
    >
      {!isPrivateRoom ? (
        <Alert
          type="warning"
          showIcon
          message={trans("chatBox.invitesPrivateOnly")}
        />
      ) : (
        <>
          <Alert
            type="info"
            showIcon
            icon={<LockOutlined />}
            style={{ marginBottom: 16 }}
            message={
              <span style={{ fontSize: 13 }}>
                {trans("chatBox.sendingInviteFor", { roomName: currentRoom.name })}
              </span>
            }
          />
          <Form form={form} layout="vertical">
            <Form.Item
              name="toUserId"
              label={trans("chatBox.inviteUserIdLabel")}
              rules={[{ required: true, message: trans("chatBox.inviteUserIdRequired") }]}
            >
              <Input
                placeholder={trans("chatBox.inviteUserIdPlaceholder")}
                prefix={<UserAddOutlined style={{ color: "#999" }} />}
              />
            </Form.Item>
            <Form.Item
              name="toUserName"
              label={trans("chatBox.inviteUserNameOptionalLabel")}
            >
              <Input placeholder={trans("chatBox.inviteUserNamePlaceholder")} />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                <Button onClick={handleCancel}>{trans("chatBox.cancelAction")}</Button>
                <Button type="primary" onClick={handleSubmit} icon={<UserAddOutlined />}>
                  {trans("chatBox.sendInviteButton")}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
});

InviteUserModal.displayName = "InviteUserModal";
