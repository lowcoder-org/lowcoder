// components/DeployDataSourceModal.tsx
// Create this new file

import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Checkbox, Button, message, Spin } from 'antd';
import { Environment } from '../types/environment.types';
import { DataSource } from '../types/datasource.types';
import { deployDataSource } from '../services/datasources.service';
import { useEnvironmentContext } from '../context/EnvironmentContext';

interface DeployDataSourceModalProps {
  visible: boolean;
  dataSource: DataSource | null;
  currentEnvironment: Environment;
  onClose: () => void;
  onSuccess?: () => void;
}

const DeployDataSourceModal: React.FC<DeployDataSourceModalProps> = ({
  visible,
  dataSource,
  currentEnvironment,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const { environments, isLoadingEnvironments } = useEnvironmentContext();
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
      
      if (!dataSource) return;
      
      setDeploying(true);
      
      await deployDataSource(
        {
          envId: currentEnvironment.environmentId,
          targetEnvId: values.targetEnvId,
          datasourceId: dataSource.gid,
          updateDependenciesIfNeeded: values.updateDependenciesIfNeeded
        },
        currentEnvironment.environmentApiServiceUrl!
      );
      
      message.success(`Successfully deployed ${dataSource.name} to target environment`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Deployment error:', error);
      message.error('Failed to deploy data source');
    } finally {
      setDeploying(false);
    }
  };

  return (
    <Modal
      title={`Deploy Data Source: ${dataSource?.name || ''}`}
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
            updateDependenciesIfNeeded: false
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

export default DeployDataSourceModal;