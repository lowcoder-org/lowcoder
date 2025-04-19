import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, Button, message } from 'antd';
import { Environment } from '../types/environment.types';

const { Option } = Select;

interface EditEnvironmentModalProps {
  visible: boolean;
  environment: Environment | null;
  onClose: () => void;
  onSave: (environmentId: string, data: Partial<Environment>) => Promise<void>;
  loading?: boolean;
}

const EditEnvironmentModal: React.FC<EditEnvironmentModalProps> = ({
  visible,
  environment,
  onClose,
  onSave,
  loading = false
}) => {
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);

  // Initialize form with environment data when it changes
  useEffect(() => {
    if (environment) {
      form.setFieldsValue({
        environmentName: environment.environmentName || '',
        environmentDescription: environment.environmentDescription || '',
        environmentType: environment.environmentType,
        environmentApiServiceUrl: environment.environmentApiServiceUrl || '',
        environmentFrontendUrl: environment.environmentFrontendUrl || '',
        environmentNodeServiceUrl: environment.environmentNodeServiceUrl || '',
        environmentApikey: environment.environmentApikey || '',
        isMaster: environment.isMaster
      });
    }
  }, [environment, form]);

  const handleSubmit = async () => {
    if (!environment) return;
    
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      
      await onSave(environment.environmentId, values);
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        console.error("Form validation or submission error:", error);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <Modal
      title="Edit Environment"
      open={visible}
      onCancel={onClose}
      maskClosable={false}
      destroyOnClose={true}
      footer={[
        <Button key="back" onClick={onClose}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading || submitLoading} 
          onClick={handleSubmit}
        >
          Save Changes
        </Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        name="edit_environment_form"
      >
        <Form.Item
          name="environmentName"
          label="Environment Name"
          rules={[{ required: true, message: 'Please enter a name' }]}
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
        >
          <Input placeholder="https://example.com" />
        </Form.Item>

        <Form.Item
          name="environmentApiServiceUrl"
          label="API Service URL"
        >
          <Input placeholder="https://api.example.com" />
        </Form.Item>

        <Form.Item
          name="environmentNodeServiceUrl"
          label="Node Service URL"
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

export default EditEnvironmentModal;