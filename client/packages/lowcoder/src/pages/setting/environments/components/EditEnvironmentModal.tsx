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
      title={trans("environments.modal_editEnvironment")}
      open={visible}
      onCancel={onClose}
      maskClosable={true}
      destroyOnHidden={true}
      footer={[
        <Button key="back" onClick={onClose}>
          {trans("environments.modal_cancel")}
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading || submitLoading} 
          onClick={handleSubmit}
        >
          {trans("environments.modal_saveChanges")}
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
          label={trans("environments.modal_environmentName")}
          rules={[{ required: true, message: trans("environments.modal_pleaseEnterName") }]}
        >
          <Input placeholder={trans("environments.modal_enterEnvironmentName")} />
        </Form.Item>

        <Form.Item
          name="environmentDescription"
          label={trans("environments.modal_description")}
        >
          <Input.TextArea 
            placeholder={trans("environments.modal_enterDescription")} 
            rows={3}
          />
        </Form.Item>

        <Form.Item
          name="environmentType"
          label={trans("environments.modal_stage")}
          rules={[{ required: true, message: trans("environments.modal_pleaseSelectStage") }]}
        >
          <Select placeholder={trans("environments.modal_selectStage")}>
            <Option value="DEV">{trans("environments.modal_development")}</Option>
            <Option value="TEST">{trans("environments.modal_testing")}</Option>
            <Option value="PREPROD">{trans("environments.modal_preProduction")}</Option>
            <Option value="PROD">{trans("environments.modal_production")}</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="environmentFrontendUrl"
          label={trans("environments.modal_frontendUrl")}
        >
          <Input placeholder="https://example.com" />
        </Form.Item>

        <Form.Item
          name="environmentApiServiceUrl"
          label={trans("environments.modal_apiServiceUrl")}
        >
          <Input placeholder="https://api.example.com" />
        </Form.Item>

        <Form.Item
          name="environmentNodeServiceUrl"
          label={trans("environments.modal_nodeServiceUrl")}
        >
          <Input placeholder="https://node.example.com" />
        </Form.Item>

        <Form.Item
          name="environmentApikey"
          label={trans("environments.modal_apiKey")}
        >
          <Input.TextArea 
            placeholder={trans("environments.modal_enterApiKey")} 
            rows={2}
          />
        </Form.Item>

        <Form.Item label={trans("environments.modal_masterEnvironment")}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Tooltip 
              title={
                hasOtherMaster && !isMaster 
                  ? trans("environments.modal_alreadyMasterEnvironment", { name: masterEnvironment?.environmentName })
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
                {trans("environments.modal_currentlyMaster")}
              </span>
            )}
          </div>
        </Form.Item>

        <Alert
          message={trans("environments.modal_configurationRequirements")}
          description={trans("environments.modal_configurationRequirementsDesc")}
          type="warning"
          showIcon
          style={{ marginTop: '16px' }}
        />
      </Form>
    </Modal>
  );
};

export default EditEnvironmentModal;