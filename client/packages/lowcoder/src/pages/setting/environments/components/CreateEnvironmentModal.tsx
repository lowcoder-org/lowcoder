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
      title={trans("environments.modal_createNewEnvironment")}
      open={visible}
      onCancel={handleCancel}
      maskClosable={true}
      destroyOnHidden={true}
      footer={[
        <Button key="back" onClick={handleCancel}>
          {trans("environments.modal_cancel")}
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading || submitLoading} 
          onClick={handleSubmit}
        >
          {trans("environments.modal_createEnvironment")}
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
          label={trans("environments.modal_environmentName")}
          rules={[
            { required: true, message: trans("environments.modal_pleaseEnterName") },
            { min: 2, message: trans("environments.modal_nameMinLength") }
          ]}
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
          rules={[
            { type: 'url', message: trans("environments.modal_pleaseEnterValidUrl") }
          ]}
        >
          <Input placeholder="https://example.com" />
        </Form.Item>

        <Form.Item
          name="environmentApiServiceUrl"
          label={trans("environments.modal_apiServiceUrl")}
          rules={[
            { type: 'url', message: trans("environments.modal_pleaseEnterValidUrl") }
          ]}
        >
          <Input placeholder="https://api.example.com" />
        </Form.Item>

        <Form.Item
          name="environmentNodeServiceUrl"
          label={trans("environments.modal_nodeServiceUrl")}
          rules={[
            { type: 'url', message: trans("environments.modal_pleaseEnterValidUrl") }
          ]}
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
                hasMasterEnvironment 
                  ? trans("environments.modal_alreadyMasterEnvironment", { name: masterEnvironment?.environmentName })
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
                {trans("environments.modal_willBeMaster")}
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

export default CreateEnvironmentModal; 