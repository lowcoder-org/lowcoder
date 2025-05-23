// components/DeployItemModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Checkbox, Button, Spin, Input, Tag, Space } from 'antd';
import { messageInstance } from 'lowcoder-design/src/components/GlobalInstances';
import { Environment } from '../types/environment.types';
import { DeployableItemConfig } from '../types/deployable-item.types';
import { useEnvironmentContext } from '../context/EnvironmentContext';
import { getEnvironmentTagColor, formatEnvironmentType } from '../utils/environmentUtils';

interface DeployItemModalProps {
  visible: boolean;
  item: any | null;
  sourceEnvironment: Environment;
  config: DeployableItemConfig;
  onClose: () => void;
  onSuccess?: () => void;
}

function DeployItemModal({
  visible,
  item,
  sourceEnvironment,
  config,
  onClose,
  onSuccess
}: DeployItemModalProps) {
  const [form] = Form.useForm();
  const { environments, isLoading } = useEnvironmentContext();
  const [deploying, setDeploying] = useState(false);
  
  useEffect(() => {
    if (visible) {
      form.resetFields();
    }
  }, [visible, form]);
  
  // Filter out source environment from target list
  const targetEnvironments = environments.filter(
    (env: Environment) => env.environmentId !== sourceEnvironment.environmentId
  );
  
  const handleDeploy = async () => {
      if (!config.deploy || !item) return;
    
    try {
      const values = await form.validateFields();
      const targetEnv = environments.find(env => env.environmentId === values.targetEnvId);
      
      if (!targetEnv) {
        messageInstance.error('Target environment not found');
        return;
      }
      
      setDeploying(true);
      
      // Prepare parameters based on item type
      const params = config.deploy.prepareParams(item, values, sourceEnvironment, targetEnv);
      
      // Execute deployment
      await config.deploy.execute(params);
      
      messageInstance.success(`Successfully deployed ${item.name} to target environment`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Deployment error:', error);
      messageInstance.error(`Failed to deploy ${config.deploy.singularLabel.toLowerCase()}`);
    } finally {
      setDeploying(false);
    }
  };
  
  return (
    <Modal
      title={`Deploy ${config.deploy.singularLabel}: ${item?.name || ''}`}
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin tip="Loading environments..." />
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
        >
          {/* Source environment display */}
          <Form.Item label="Source Environment">
            <Space>
              <strong>{sourceEnvironment.environmentName}</strong>
              {sourceEnvironment.environmentType && (
                <Tag color={getEnvironmentTagColor(sourceEnvironment.environmentType)}>
                  {formatEnvironmentType(sourceEnvironment.environmentType)}
                </Tag>
              )}
            </Space>
          </Form.Item>

          <Form.Item
            name="targetEnvId"
            label="Target Environment"
            rules={[{ required: true, message: 'Please select a target environment' }]}
          >
            <Select placeholder="Select target environment">
              {targetEnvironments.map((env) => (
                <Select.Option key={env.environmentId} value={env.environmentId}>
                  <Space>
                    {env.environmentName}
                    {env.environmentType && (
                      <Tag color={getEnvironmentTagColor(env.environmentType)}>
                        {formatEnvironmentType(env.environmentType)}
                      </Tag>
                    )}
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          {/* Render dynamic fields based on config */}
          {config.deploy?.fields.map(field => {
            switch (field.type) {
              case 'checkbox':
                return (
                  <Form.Item
                    key={field.name}
                    name={field.name}
                    valuePropName="checked"
                    initialValue={field.defaultValue}
                  >
                    <Checkbox>{field.label}</Checkbox>
                  </Form.Item>
                );
              case 'select':
                return (
                  <Form.Item
                    key={field.name}
                    name={field.name}
                    label={field.label}
                    initialValue={field.defaultValue}
                    rules={field.required ? [{ required: true, message: `Please select ${field.label}` }] : undefined}
                  >
                    <Select placeholder={`Select ${field.label}`}>
                      {field.options?.map(option => (
                        <Select.Option key={option.value} value={option.value}>
                          {option.label}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                );
              case 'input':
                return (
                  <Form.Item
                    key={field.name}
                    name={field.name}
                    label={field.label}
                    initialValue={field.defaultValue}
                    rules={field.required ? [{ required: true, message: `Please input ${field.label}` }] : undefined}
                  >
                    <Input placeholder={`Enter ${field.label}`} />
                  </Form.Item>
                );
              default:
                return null;
            }
          })}
          
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
}

export default DeployItemModal;