import React, { useState } from 'react';
import { Modal, Form, Input, Select, Switch, Button, Alert, Tooltip } from 'antd';
import { useSelector } from 'react-redux';
import { selectMasterEnvironment, selectHasMasterEnvironment } from 'redux/selectors/enterpriseSelectors';
import { Environment } from '../types/environment.types';
import { trans } from 'i18n';

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
      title={trans("enterprise.environments.modal.createNewEnvironment")}
      open={visible}
      onCancel={handleCancel}
      maskClosable={true}
      destroyOnHidden={true}
      footer={[
        <Button key="back" onClick={handleCancel}>
          {trans("enterprise.environments.modal.cancel")}
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading || submitLoading} 
          onClick={handleSubmit}
        >
          {trans("enterprise.environments.modal.createEnvironment")}
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
          label={trans("enterprise.environments.modal.environmentName")}
          rules={[
            { required: true, message: trans("enterprise.environments.modal.pleaseEnterName") },
            { min: 2, message: trans("enterprise.environments.modal.nameMinLength") }
          ]}
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
          rules={[
            { type: 'url', message: trans("enterprise.environments.modal.pleaseEnterValidUrl") }
          ]}
        >
          <Input placeholder="https://example.com" />
        </Form.Item>

        <Form.Item
          name="environmentApiServiceUrl"
          label={trans("enterprise.environments.modal.apiServiceUrl")}
          rules={[
            { type: 'url', message: trans("enterprise.environments.modal.pleaseEnterValidUrl") }
          ]}
        >
          <Input placeholder="https://api.example.com" />
        </Form.Item>

        <Form.Item
          name="environmentNodeServiceUrl"
          label={trans("enterprise.environments.modal.nodeServiceUrl")}
          rules={[
            { type: 'url', message: trans("enterprise.environments.modal.pleaseEnterValidUrl") }
          ]}
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
                hasMasterEnvironment 
                  ? trans("enterprise.environments.modal.alreadyMasterEnvironment", { name: masterEnvironment?.environmentName })
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
                {trans("enterprise.environments.modal.willBeMaster")}
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

export default CreateEnvironmentModal; 