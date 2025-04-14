// components/DeployAppModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Checkbox, Button, message, Spin } from 'antd';
import { Environment } from '../types/environment.types';
import { App } from '../types/app.types';
import { deployApp } from '../services/apps.service';
import { useEnvironmentContext } from '../context/EnvironmentContext';

interface DeployAppModalProps {
  visible: boolean;
  app: App | null;
  currentEnvironment: Environment;
  onClose: () => void;
}

const DeployAppModal: React.FC<DeployAppModalProps> = ({
  visible,
  app,
  currentEnvironment,
  onClose,
}) => {
  const [form] = Form.useForm();
  const { environments, isLoadingEnvironments } = useEnvironmentContext();
  console.log('environments data modal', environments);
  const [deploying, setDeploying] = useState(false);

  // Reset form when modal becomes visible
  useEffect(() => {
    if (visible) {
      form.resetFields();
    }
  }, [visible, form]);

  // Filter out current environment from the list
  const targetEnvironments = environments.filter(
    (env) => env.environmentId !== currentEnvironment.environmentId
  );

  const handleDeploy = async () => {
    try {
      const values = await form.validateFields();
      
      if (!app) return;
      
      setDeploying(true);
      
      await deployApp(
        {
          envId: currentEnvironment.environmentId,
          targetEnvId: values.targetEnvId,
          applicationId: app.applicationId!,
          updateDependenciesIfNeeded: values.updateDependenciesIfNeeded,
          publishOnTarget: values.publishOnTarget,
          publicToAll: values.publicToAll,
          publicToMarketplace: values.publicToMarketplace,
        },
      );
      
      message.success(`Successfully deployed ${app.name} to target environment`);
      onClose();
    } catch (error) {
      console.error('Deployment error:', error);
      message.error('Failed to deploy app');
    } finally {
      setDeploying(false);
    }
  };

  return (
    <Modal
      title={`Deploy App: ${app?.name || ''}`}
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      {isLoadingEnvironments ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin tip="Loading environments..." />
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            updateDependenciesIfNeeded: false,
            publishOnTarget: false,
            publicToAll: false,
            publicToMarketplace: false,
          }}
        >
          <Form.Item
            name="targetEnvId"
            label="Target Environment"
            rules={[{ required: true, message: 'Please select a target environment' }]}
          >
            <Select placeholder="Select target environment">
              {targetEnvironments.map((env) => (
                <Select.Option key={env.environmentId} value={env.environmentId}>
                  {env.environmentName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="updateDependenciesIfNeeded"
            valuePropName="checked"
          >
            <Checkbox>Update Dependencies If Needed</Checkbox>
          </Form.Item>
          
          <Form.Item
            name="publishOnTarget"
            valuePropName="checked"
          >
            <Checkbox>Publish On Target</Checkbox>
          </Form.Item>
          
          <Form.Item
            name="publicToAll"
            valuePropName="checked"
          >
            <Checkbox>Public To All</Checkbox>
          </Form.Item>
          
          <Form.Item
            name="publicToMarketplace"
            valuePropName="checked"
          >
            <Checkbox>Public To Marketplace</Checkbox>
          </Form.Item>
          
          <Form.Item>
            <Button type="default" onClick={onClose} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button type="primary" onClick={handleDeploy} loading={deploying}>
              Deploy
            </Button>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default DeployAppModal;