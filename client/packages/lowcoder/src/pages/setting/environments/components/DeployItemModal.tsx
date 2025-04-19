// components/DeployItemModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Checkbox, Button, message, Spin, Input } from 'antd';
import { Environment } from '../types/environment.types';
import { DeployableItem, BaseStats, DeployableItemConfig } from '../types/deployable-item.types';
import { useEnvironmentContext } from '../context/EnvironmentContext';

interface DeployItemModalProps<T extends DeployableItem, S extends BaseStats> {
  visible: boolean;
  item: T | null;
  sourceEnvironment: Environment;
  config: DeployableItemConfig<T, S>;
  onClose: () => void;
  onSuccess?: () => void;
}

function DeployItemModal<T extends DeployableItem, S extends BaseStats>({
  visible,
  item,
  sourceEnvironment,
  config,
  onClose,
  onSuccess
}: DeployItemModalProps<T, S>) {
  const [form] = Form.useForm();
  const { environments, isLoadingEnvironments } = useEnvironmentContext();
  const [deploying, setDeploying] = useState(false);
  
  useEffect(() => {
    if (visible) {
      form.resetFields();
    }
  }, [visible, form]);
  
  // Filter out source environment from target list
  const targetEnvironments = environments.filter(
    env => env.environmentId !== sourceEnvironment.environmentId
  );
  
  const handleDeploy = async () => {
    if (!config.deploy?.enabled || !item) return;
    
    try {
      const values = await form.validateFields();
      const targetEnv = environments.find(env => env.environmentId === values.targetEnvId);
      
      if (!targetEnv) {
        message.error('Target environment not found');
        return;
      }
      
      setDeploying(true);
      
      // Prepare parameters based on item type
      const params = config.deploy.prepareParams(item, values, sourceEnvironment, targetEnv);
      
      // Execute deployment
      await config.deploy.execute(params);
      
      message.success(`Successfully deployed ${item.name} to target environment`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Deployment error:', error);
      message.error(`Failed to deploy ${config.singularLabel.toLowerCase()}`);
    } finally {
      setDeploying(false);
    }
  };
  
  return (
    <Modal
      title={`Deploy ${config.singularLabel}: ${item?.name || ''}`}
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