// components/DeployItemModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Checkbox, Button, Spin, Input, Tag, Space, Alert } from 'antd';
import { messageInstance } from 'lowcoder-design/src/components/GlobalInstances';
import { Environment } from '../types/environment.types';
import { DeployableItemConfig } from '../types/deployable-item.types';
import { useEnvironmentContext } from '../context/EnvironmentContext';
import { getEnvironmentTagColor, formatEnvironmentType } from '../utils/environmentUtils';
import { ExclamationCircleOutlined, WarningOutlined } from '@ant-design/icons';

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
  const [credentialConfirmationStep, setCredentialConfirmationStep] = useState(0); // 0: not started, 1: first confirmation, 2: confirmed
  
  useEffect(() => {
    if (visible) {
      form.resetFields();
      setCredentialConfirmationStep(0);
    }
  }, [visible, form]);
  
  // Filter out source environment from target list
  const targetEnvironments = environments.filter(
    (env: Environment) => env.environmentId !== sourceEnvironment.environmentId && env.isLicensed !== false
  );
  
  // Handle credential checkbox change with double confirmation
  const handleCredentialCheckboxChange = (checked: boolean, fieldName: string) => {
    if (!checked) {
      // If unchecking, reset confirmation and update form
      setCredentialConfirmationStep(0);
      form.setFieldsValue({ [fieldName]: false });
      return;
    }

    // First confirmation
    if (credentialConfirmationStep === 0) {
      Modal.confirm({
        title: (
          <div style={{ display: 'flex', alignItems: 'center', color: '#ff7a00' }}>
            <WarningOutlined style={{ marginRight: 8, fontSize: '18px' }} />
            <span style={{ fontSize: '16px', fontWeight: '600' }}>Overwrite Credentials Warning</span>
          </div>
        ),
        icon: null,
        content: (
          <div style={{ padding: '16px 0' }}>
            <Alert
              message="This action will overwrite existing credentials in the target environment."
              description={
                <div style={{ marginTop: '8px' }}>
                  <p style={{ margin: 0, fontWeight: '500' }}>
                    This is a serious operation that may affect other applications and users.
                  </p>
                  <p style={{ margin: '8px 0 0 0', color: '#8c8c8c' }}>
                    Are you sure you want to proceed?
                  </p>
                </div>
              }
              type="warning"
              showIcon
              style={{ 
                marginBottom: 0,
                border: '1px solid #fff2e8',
                borderRadius: '8px'
              }}
            />
          </div>
        ),
        okText: 'Continue',
        cancelText: 'Cancel',
        okButtonProps: {
          style: {
            backgroundColor: '#ff7a00',
            borderColor: '#ff7a00',
            fontWeight: '500'
          }
        },
        cancelButtonProps: {
          style: {
            fontWeight: '500'
          }
        },
        width: 520,
        centered: false,
        onOk: () => {
          setCredentialConfirmationStep(1);
          // Show second confirmation immediately
          showSecondConfirmation(fieldName);
        },
        onCancel: () => {
          setCredentialConfirmationStep(0);
          form.setFieldsValue({ [fieldName]: false });
        }
      });
    }
  };

  const showSecondConfirmation = (fieldName: string) => {
    Modal.confirm({
      title: (
        <div style={{ display: 'flex', alignItems: 'center', color: '#ff4d4f' }}>
          <ExclamationCircleOutlined style={{ marginRight: 8, fontSize: '18px' }} />
          <span style={{ fontSize: '16px', fontWeight: '600' }}>Final Confirmation Required</span>
        </div>
      ),
      icon: null,
      content: (
        <div style={{ padding: '16px 0' }}>
          <Alert
            message="Final Warning: Credential Overwrite"
            description={
              <div style={{ marginTop: '8px' }}>
                <p style={{ margin: 0, fontWeight: '500' }}>
                  You are about to overwrite credentials in the target environment. 
                  This action cannot be undone and may break existing integrations.
                </p>
                <p style={{ margin: '8px 0 0 0', color: '#8c8c8c' }}>
                  Please confirm one more time.
                </p>
              </div>
            }
            type="error"
            showIcon
            style={{ 
              marginBottom: 16,
              border: '1px solid #ffebee',
              borderRadius: '8px'
            }}
          />
          <div style={{ 
            padding: '12px 16px', 
            backgroundColor: '#fff2f0', 
            borderRadius: '8px',
            border: '1px solid #ffccc7'
          }}>
            <p style={{ 
              margin: 0, 
              fontWeight: '600', 
              color: '#cf1322',
              fontSize: '14px'
            }}>
              Are you absolutely certain you want to overwrite the credentials?
            </p>
          </div>
        </div>
      ),
      okText: 'Yes, Overwrite Credentials',
      okType: 'danger',
      cancelText: 'Cancel',
      okButtonProps: {
        style: {
          fontWeight: '500'
        }
      },
      cancelButtonProps: {
        style: {
          fontWeight: '500'
        }
      },
      width: 520,
      centered: false,
      onOk: () => {
        setCredentialConfirmationStep(2);
        form.setFieldsValue({ [fieldName]: true });
      },
      onCancel: () => {
        setCredentialConfirmationStep(0);
        form.setFieldsValue({ [fieldName]: false });
      }
    });
  };

  const handleDeploy = async () => {
      if (!config.deploy || !item) return;
    
    try {
      const values = await form.validateFields();
      const targetEnv = environments.find(env => env.environmentId === values.targetEnvId);
      
      if (!targetEnv) {
        messageInstance.error('Target environment not found');
        return;
      }

      // Additional check for credential overwrite
      if (values.deployCredential && credentialConfirmationStep !== 2) {
        messageInstance.error('Please confirm credential overwrite before deploying');
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
                // Special handling for credential-related checkboxes
                const isCredentialField = field.name === 'deployCredential';
                return (
                  <Form.Item
                    key={field.name}
                    name={field.name}
                    valuePropName="checked"
                    initialValue={field.defaultValue}
                  >
                    <Checkbox
                      onChange={(e) => {
                        if (isCredentialField) {
                          handleCredentialCheckboxChange(e.target.checked, field.name);
                        } else {
                          // For non-credential checkboxes, handle normally
                          form.setFieldsValue({ [field.name]: e.target.checked });
                        }
                      }}
                    >
                      {field.label}
                      {isCredentialField && credentialConfirmationStep === 2 && (
                        <Tag 
                          color="red" 
                          style={{ marginLeft: 8 }}
                          icon={<ExclamationCircleOutlined />}
                        >
                          Confirmed
                        </Tag>
                      )}
                    </Checkbox>
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