import React, { useState, useEffect } from 'react';
import { Modal, Card, Row, Col, Typography, Divider, Spin, Alert } from 'antd';
import { CustomerServiceOutlined, CloudServerOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { trans } from 'i18n';
import { Environment } from '../types/environment.types';
import { getEnvironmentDeploymentId } from '../services/environments.service';
import { HubspotModal } from '../../hubspotModal';
import { getUser } from 'redux/selectors/usersSelectors';

const { Title, Text } = Typography;

interface ContactLowcoderModalProps {
  visible: boolean;
  onClose: () => void;
  environment: Environment;
}

/**
 * Professional modal for contacting Lowcoder team with HubSpot form integration
 */
const ContactLowcoderModal: React.FC<ContactLowcoderModalProps> = ({
  visible,
  onClose,
  environment
}) => {
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHubspotModal, setShowHubspotModal] = useState(false);
  const user = useSelector(getUser);

  // Fetch deployment ID when modal opens
  useEffect(() => {
    const fetchDeploymentId = async () => {
      if (!visible || !environment.environmentApiServiceUrl || !environment.environmentApikey) {
        if (visible) {
          setError(trans('enterprise.environments.contactLowcoder.apiConfigurationError'));
        }
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        const id = await getEnvironmentDeploymentId(
          environment.environmentApiServiceUrl,
          environment.environmentApikey
        );
        setDeploymentId(id);
        setShowHubspotModal(true);
      } catch (err) {
        console.error('Failed to fetch deployment ID:', err);
        setError(err instanceof Error ? err.message : trans('enterprise.environments.contactLowcoder.failedToFetchDeploymentId'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeploymentId();
  }, [visible, environment.environmentApiServiceUrl, environment.environmentApikey]);

  // Handle HubSpot modal close
  const handleHubspotClose = () => {
    setShowHubspotModal(false);
    onClose();
  };

  // Handle main modal close
  const handleClose = () => {
    setShowHubspotModal(false);
    setDeploymentId(null);
    setError(null);
    onClose();
  };

  // Show HubSpot modal if we have deployment ID
  if (showHubspotModal && deploymentId) {
    return (
      <HubspotModal
        open={showHubspotModal}
        onClose={handleHubspotClose}
        orgId={user.currentOrgId}
        deploymentIds={[deploymentId]}
      />
    );
  }

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CustomerServiceOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
          <span style={{ fontSize: '18px', fontWeight: 600 }}>{trans('enterprise.environments.contactLowcoder.title')}</span>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={800}
      centered
      style={{ top: 20 }}
      styles={{ body: { padding: '24px' } }}
    >
      {/* Environment Context Section */}
      <Card
        style={{
          marginBottom: '24px',
          borderRadius: '8px',
          background: '#fafafa',
          border: '1px solid #f0f0f0'
        }}
        styles={{ body: { padding: '16px' } }}
      >
        <Row gutter={[16, 8]} align="middle">
          <Col>
            <CloudServerOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          </Col>
          <Col flex={1}>
            <div>
              <Text strong style={{ fontSize: '16px', color: '#262626' }}>
                {trans('enterprise.environments.contactLowcoder.environmentLabel')} {environment.environmentName || trans('enterprise.environments.contactLowcoder.unnamedEnvironment')}
              </Text>
              <br />
              <Text style={{ fontSize: '14px', color: '#8c8c8c', fontFamily: 'monospace' }}>
                {trans('enterprise.environments.contactLowcoder.environmentIdLabel')} {environment.environmentId}
              </Text>
              <br />
              <Text style={{ fontSize: '14px', color: '#8c8c8c', fontFamily: 'monospace' }}>
                {trans('enterprise.environments.contactLowcoder.deploymentIdLabel')} {isLoading ? trans('enterprise.environments.contactLowcoder.loading') : deploymentId || trans('enterprise.environments.contactLowcoder.notAvailable')}
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      <Divider style={{ margin: '16px 0' }} />

      {/* Loading, Error, or Success State */}
      <div style={{ minHeight: '200px', padding: '20px 0' }}>
        {isLoading && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '200px'
          }}>
            <Spin size="large" />
            <Text style={{ marginTop: '16px', color: '#8c8c8c' }}>
              {trans('enterprise.environments.contactLowcoder.fetchingDeploymentInfo')}
            </Text>
          </div>
        )}

        {error && (
          <Alert
            message={trans('enterprise.environments.contactLowcoder.unableToLoadContactForm')}
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        {!isLoading && !error && !deploymentId && (
          <div style={{
            textAlign: 'center',
            color: '#8c8c8c',
            fontSize: '14px'
          }}>
            <CustomerServiceOutlined style={{ fontSize: '48px', marginBottom: '16px', color: '#d9d9d9' }} />
            <div>{trans('enterprise.environments.contactLowcoder.ensureProperConfiguration')}</div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ContactLowcoderModal; 