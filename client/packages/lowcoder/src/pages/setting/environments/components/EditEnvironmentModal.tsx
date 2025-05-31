import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, Button, Alert, Tooltip } from 'antd';
import { useSelector } from 'react-redux';
import { selectMasterEnvironment, selectHasMasterEnvironment } from 'redux/selectors/enterpriseSelectors';
import { Environment } from '../types/environment.types';
import { trans } from 'i18n';

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
      title={trans("enterprise.environments.modal.editEnvironment")}
      open={visible}
      onCancel={onClose}
      maskClosable={true}
      destroyOnHidden={true}
      footer={[
        <Button key="back" onClick={onClose}>
          {trans("enterprise.environments.modal.cancel")}
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading || submitLoading} 
          onClick={handleSubmit}
        >
          {trans("enterprise.environments.modal.saveChanges")}
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
          label={trans("enterprise.environments.modal.environmentName")}
          rules={[{ required: true, message: trans("enterprise.environments.modal.pleaseEnterName") }]}
        >
          <Input placeholder={trans("enterprise.environments.modal.enterEnvironmentName")} />
        </Form.Item>

        <Form.Item
          name="environmentDescription"
          label={trans("enterprise.environments.modal.description")}
        >
          <Input.TextArea 
            placeholder={trans("enterprise.environments.modal.enterDescription")} 
            rows={3}
          />
        </Form.Item>

        <Form.Item
          name="environmentType"
          label={trans("enterprise.environments.modal.stage")}
          rules={[{ required: true, message: trans("enterprise.environments.modal.pleaseSelectStage") }]}
        >
          <Select placeholder={trans("enterprise.environments.modal.selectStage")}>
            <Option value="DEV">{trans("enterprise.environments.modal.development")}</Option>
            <Option value="TEST">{trans("enterprise.environments.modal.testing")}</Option>
            <Option value="PREPROD">{trans("enterprise.environments.modal.preProduction")}</Option>
            <Option value="PROD">{trans("enterprise.environments.modal.production")}</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="environmentFrontendUrl"
          label={trans("enterprise.environments.modal.frontendUrl")}
        >
          <Input placeholder="https://example.com" />
        </Form.Item>

        <Form.Item
          name="environmentApiServiceUrl"
          label={trans("enterprise.environments.modal.apiServiceUrl")}
        >
          <Input placeholder="https://api.example.com" />
        </Form.Item>

        <Form.Item
          name="environmentNodeServiceUrl"
          label={trans("enterprise.environments.modal.nodeServiceUrl")}
        >
          <Input placeholder="https://node.example.com" />
        </Form.Item>

        <Form.Item
          name="environmentApikey"
          label={trans("enterprise.environments.modal.apiKey")}
        >
          <Input.TextArea 
            placeholder={trans("enterprise.environments.modal.enterApiKey")} 
            rows={2}
          />
        </Form.Item>

        <Form.Item label={trans("enterprise.environments.modal.masterEnvironment")}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Tooltip 
              title={
                hasOtherMaster && !isMaster 
                  ? trans("enterprise.environments.modal.alreadyMasterEnvironment", { name: masterEnvironment?.environmentName })
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
                {trans("enterprise.environments.modal.currentlyMaster")}
              </span>
            )}
          </div>
        </Form.Item>

        <Alert
          message={trans("enterprise.environments.modal.configurationRequirements")}
          description={trans("enterprise.environments.modal.configurationRequirementsDesc")}
          type="warning"
          showIcon
          style={{ marginTop: '16px' }}
        />
      </Form>
    </Modal>
  );
};

export default EditEnvironmentModal;