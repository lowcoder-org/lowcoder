// components/DeployItemModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Checkbox, Button, Spin, Input, Tag, Space, Alert } from 'antd';
import { messageInstance } from 'lowcoder-design/src/components/GlobalInstances';
import { trans } from "i18n";
import { useSelector } from 'react-redux';
import { selectLicensedEnvironments, selectEnvironmentsLoading } from 'redux/selectors/enterpriseSelectors';
import { Environment } from '../types/environment.types';
import { DeployableItemConfig } from '../types/deployable-item.types';
import { getEnvironmentTagColor, formatEnvironmentType } from '../utils/environmentUtils';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { showFirstCredentialOverwriteConfirm, showSecondCredentialOverwriteConfirm } from './credentialConfirmations';

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
  const licensedEnvironments = useSelector(selectLicensedEnvironments);
  const isLoading = useSelector(selectEnvironmentsLoading);
  const [deploying, setDeploying] = useState(false);
  const [credentialConfirmationStep, setCredentialConfirmationStep] = useState(0); // 0: not started, 1: first confirmation, 2: confirmed
  
  useEffect(() => {
    if (visible) {
      form.resetFields();
      setCredentialConfirmationStep(0);
    }
  }, [visible, form]);
  
  // Filter out source environment from target list
  const targetEnvironments = licensedEnvironments.filter(
    (env: Environment) => env.environmentId !== sourceEnvironment.environmentId
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
      showFirstCredentialOverwriteConfirm({
        onOk: () => {
          setCredentialConfirmationStep(1);
          // Show second confirmation immediately
          showSecondCredentialOverwriteConfirm({
            onOk: () => {
              setCredentialConfirmationStep(2);
              form.setFieldsValue({ [fieldName]: true });
            },
            onCancel: () => {
              setCredentialConfirmationStep(0);
              form.setFieldsValue({ [fieldName]: false });
            }
          });
        },
        onCancel: () => {
          setCredentialConfirmationStep(0);
          form.setFieldsValue({ [fieldName]: false });
        }
      });
    }
  };

  const handleDeploy = async () => {
      if (!config.deploy || !item) return;
    
    try {
      const values = await form.validateFields();
      const targetEnv = licensedEnvironments.find(env => env.environmentId === values.targetEnvId);
      
      if (!targetEnv) {
        messageInstance.error(trans("environments.deployModal_targetEnvironmentNotFound"));
        return;
      }

      // Additional check for credential overwrite
      if (values.deployCredential && credentialConfirmationStep !== 2) {
        messageInstance.error(trans("environments.deployModal_confirmCredentialOverwrite"));
        return;
      }
      
      setDeploying(true);
      
      // Prepare parameters based on item type
      const params = config.deploy.prepareParams(item, values, sourceEnvironment, targetEnv);
      
      // Execute deployment
      await config.deploy.execute(params);
      
      messageInstance.success(trans("environments.deployModal_deploySuccess", { name: item.name }));
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Deployment error:', error);
      messageInstance.error(trans("environments.deployModal_deployFailed", { singularLabel: config.deploy.singularLabel.toLowerCase() }));
    } finally {
      setDeploying(false);
    }
  };
  
  return (
    <Modal
      title={trans("environments.deployModal_deployTitle", { 
        singularLabel: config.deploy.singularLabel, 
        name: item?.name || '' 
      })}
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin tip={trans("environments.deployModal_loadingEnvironments")} />
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
        >
          {/* Source environment display */}
          <Form.Item label={trans("environments.deployModal_sourceEnvironment")}>
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
            label={trans("environments.deployModal_targetEnvironment")}
            rules={[{ required: true, message: trans("environments.deployModal_selectTargetEnvironmentValidation") }]}
          >
            <Select placeholder={trans("environments.deployModal_selectTargetEnvironment")}>
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
                          {trans("environments.deployModal_confirmed")}
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
                    rules={field.required ? [{ required: true, message: trans("environments.deployModal_selectFieldValidation", { label: field.label }) }] : undefined}
                  >
                    <Select placeholder={trans("environments.deployModal_selectFieldPlaceholder", { label: field.label })}>
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
                    rules={field.required ? [{ required: true, message: trans("environments.deployModal_inputFieldValidation", { label: field.label }) }] : undefined}
                  >
                    <Input placeholder={trans("environments.deployModal_inputFieldPlaceholder", { label: field.label })} />
                  </Form.Item>
                );
              default:
                return null;
            }
          })}
           
          <Form.Item>
            <Button type="default" onClick={onClose} style={{ marginRight: 8 }}>
              {trans("environments.deployModal_cancel")}
            </Button>
            <Button type="primary" onClick={handleDeploy} loading={deploying}>
              {trans("environments.deployModal_deploy")}
            </Button>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}

export default DeployItemModal;