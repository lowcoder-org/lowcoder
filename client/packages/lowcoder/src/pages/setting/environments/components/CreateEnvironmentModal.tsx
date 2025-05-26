import React, { useState } from 'react';
import { Modal, Form, Input, Select, Switch, Button } from 'antd';
import { Environment } from '../types/environment.types';

const { Option } = Select;

interface CreateEnvironmentModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Partial<Environment>) => Promise<void>;
  loading?: boolean;
}

const CreateEnvironmentModal: React.FC<CreateEnvironmentModalProps> = ({
  visible,
  onClose,
  onSave,
  loading = false
}) => {
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      
      await onSave(values);
      form.resetFields(); // Reset form after successful creation
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        console.error("Form validation or submission error:", error);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields(); // Reset form when canceling
    onClose();
  };

  return (
    <Modal
      title="Create New Environment"
      open={visible}
      onCancel={handleCancel}
      maskClosable={true}
      destroyOnClose={true}
      footer={[
        <Button key="back" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading || submitLoading} 
          onClick={handleSubmit}
        >
          Create Environment
        </Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        name="create_environment_form"
        initialValues={{
          environmentType: "DEV",
          isMaster: false
        }}
      >
        <Form.Item
          name="environmentName"
          label="Environment Name"
          rules={[
            { required: true, message: 'Please enter a name' },
            { min: 2, message: 'Name must be at least 2 characters' }
          ]}
        >
          <Input placeholder="Enter environment name" />
        </Form.Item>

        <Form.Item
          name="environmentDescription"
          label="Description"
        >
          <Input.TextArea 
            placeholder="Enter description" 
            rows={3}
          />
        </Form.Item>

        <Form.Item
          name="environmentType"
          label="Stage"
          rules={[{ required: true, message: 'Please select a stage' }]}
        >
          <Select placeholder="Select stage">
            <Option value="DEV">Development (DEV)</Option>
            <Option value="TEST">Testing (TEST)</Option>
            <Option value="PREPROD">Pre-Production (PREPROD)</Option>
            <Option value="PROD">Production (PROD)</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="environmentFrontendUrl"
          label="Frontend URL"
          rules={[
            { type: 'url', message: 'Please enter a valid URL' }
          ]}
        >
          <Input placeholder="https://example.com" />
        </Form.Item>

        <Form.Item
          name="environmentApiServiceUrl"
          label="API Service URL"
          rules={[
            { type: 'url', message: 'Please enter a valid URL' }
          ]}
        >
          <Input placeholder="https://api.example.com" />
        </Form.Item>

        <Form.Item
          name="environmentNodeServiceUrl"
          label="Node Service URL"
          rules={[
            { type: 'url', message: 'Please enter a valid URL' }
          ]}
        >
          <Input placeholder="https://node.example.com" />
        </Form.Item>

        <Form.Item
          name="environmentApikey"
          label="API Key"
        >
          <Input.TextArea 
            placeholder="Enter API key" 
            rows={2}
          />
        </Form.Item>

        <Form.Item
          name="isMaster"
          label="Master Environment"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateEnvironmentModal; 