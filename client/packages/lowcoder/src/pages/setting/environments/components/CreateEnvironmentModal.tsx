import React, { useState } from 'react';
import { Modal, Form, Input, Select, Switch, Button, Alert, Tooltip } from 'antd';
import { useSelector } from 'react-redux';
import { selectMasterEnvironment, selectHasMasterEnvironment } from 'redux/selectors/enterpriseSelectors';
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
  const [isMaster, setIsMaster] = useState(false);

  // Redux selectors to check for existing master environment
  const hasMasterEnvironment = useSelector(selectHasMasterEnvironment);
  const masterEnvironment = useSelector(selectMasterEnvironment);

  const handleMasterChange = (checked: boolean) => {
    // Only allow enabling master if no master environment exists
    if (checked && hasMasterEnvironment) {
      return; // Do nothing if trying to enable master when one already exists
    }
    setIsMaster(checked);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      
      const submitData = {
        ...values,
        isMaster
      };
      
      await onSave(submitData);
      form.resetFields();
      setIsMaster(false); // Reset master state
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
    form.resetFields();
    setIsMaster(false); // Reset master state
    onClose();
  };

  return (
    <Modal
      title="Create New Environment"
      open={visible}
      onCancel={handleCancel}
      maskClosable={true}
      destroyOnHidden={true}
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
          environmentType: "DEV"
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

        <Form.Item label="Master Environment">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Tooltip 
              title={
                hasMasterEnvironment 
                  ? `${masterEnvironment?.environmentName} is already the Master environment` 
                  : ''
              }
            >
              <Switch 
                checked={isMaster}
                onChange={handleMasterChange}
                disabled={hasMasterEnvironment}
               
              />
            </Tooltip>
            {isMaster && (
              <span style={{ color: '#52c41a', fontSize: '12px' }}>
                Will be Master
              </span>
            )}
          </div>
        </Form.Item>

        <Alert
          message="Configuration Requirements"
          description="Ensure that the API Service URL is configured and correct, the API key is valid, and for license verification make sure you have both the license and plugin properly installed."
          type="warning"
          showIcon
          style={{ marginTop: '16px' }}
        />
      </Form>
    </Modal>
  );
};

export default CreateEnvironmentModal; 