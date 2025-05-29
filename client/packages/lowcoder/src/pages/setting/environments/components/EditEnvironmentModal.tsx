import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, Button, Alert, Tooltip } from 'antd';
import { useSelector } from 'react-redux';
import { selectMasterEnvironment, selectHasMasterEnvironment } from 'redux/selectors/enterpriseSelectors';
import { Environment } from '../types/environment.types';

const { Option } = Select;

interface EditEnvironmentModalProps {
  visible: boolean;
  environment: Environment | null;
  onClose: () => void;
  onSave: (data: Partial<Environment>) => Promise<void>; // Updated signature
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
  const [isMaster, setIsMaster] = useState(false);

  // Redux selectors to check for existing master environment
  const hasMasterEnvironment = useSelector(selectHasMasterEnvironment);
  const masterEnvironment = useSelector(selectMasterEnvironment);

  // Check if another environment is master (not this one)
  const hasOtherMaster = hasMasterEnvironment && masterEnvironment?.environmentId !== environment?.environmentId;

  // Initialize form with environment data when it changes
  useEffect(() => {
    if (environment) {
      setIsMaster(environment.isMaster);
      form.setFieldsValue({
        environmentName: environment.environmentName || '',
        environmentDescription: environment.environmentDescription || '',
        environmentType: environment.environmentType,
        environmentApiServiceUrl: environment.environmentApiServiceUrl || '',
        environmentFrontendUrl: environment.environmentFrontendUrl || '',
        environmentNodeServiceUrl: environment.environmentNodeServiceUrl || '',
        environmentApikey: environment.environmentApikey || ''
      });
    }
  }, [environment, form]);

  const handleMasterChange = (checked: boolean) => {
    // Only allow enabling master if no other environment is master
    if (checked && hasOtherMaster) {
      return; // Do nothing if trying to enable master when another exists
    }
    setIsMaster(checked);
  };

  const handleSubmit = async () => {
    if (!environment) return;
    
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      
      const submitData = {
        ...values,
        isMaster
      };
      
      await onSave(submitData);
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
      maskClosable={true}
      destroyOnHidden={true}
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

        <Form.Item label="Master Environment">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Tooltip 
              title={
                hasOtherMaster && !isMaster 
                  ? `${masterEnvironment?.environmentName} is already the Master environment` 
                  : ''
              }
            >
              <Switch 
                checked={isMaster}
                onChange={handleMasterChange}
                disabled={hasOtherMaster && !isMaster}
                
              />
            </Tooltip>
            {isMaster && (
              <span style={{ color: '#faad14', fontSize: '12px' }}>
                Currently Master
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

export default EditEnvironmentModal;