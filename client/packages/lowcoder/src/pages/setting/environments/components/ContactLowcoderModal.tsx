import React, { useState, useEffect } from 'react';
import { Modal, Card, Row, Col, Typography, Divider, Spin, Alert } from 'antd';
import { CustomerServiceOutlined, CloudServerOutlined } from '@ant-design/icons';
import { Environment } from '../types/environment.types';
import { getEnvironmentDeploymentId } from '../services/environments.service';
import { HubspotModal } from '../../hubspotModal';

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

  // Fetch deployment ID when modal opens
  useEffect(() => {
    const fetchDeploymentId = async () => {
      if (!visible || !environment.environmentApiServiceUrl || !environment.environmentApikey) {
        if (visible) {
          setError('Environment API service URL or API key not configured');
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
        setError(err instanceof Error ? err.message : 'Failed to fetch deployment ID');
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
        orgId={environment.environmentId}
        deploymentIds={[deploymentId]}
      />
    );
  }

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CustomerServiceOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
          <span style={{ fontSize: '18px', fontWeight: 600 }}>Contact Lowcoder Team</span>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={800}
      centered
      style={{ top: 20 }}
      bodyStyle={{ padding: '24px' }}
    >
      {/* Environment Context Section */}
      <Card
        style={{
          marginBottom: '24px',
          borderRadius: '8px',
          background: '#fafafa',
          border: '1px solid #f0f0f0'
        }}
        bodyStyle={{ padding: '16px' }}
      >
        <Row gutter={[16, 8]} align="middle">
          <Col>
            <CloudServerOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          </Col>
          <Col flex={1}>
            <div>
              <Text strong style={{ fontSize: '16px', color: '#262626' }}>
                Environment: {environment.environmentName || 'Unnamed Environment'}
              </Text>
              <br />
              <Text style={{ fontSize: '14px', color: '#8c8c8c', fontFamily: 'monospace' }}>
                Environment ID: {environment.environmentId}
              </Text>
              <br />
              <Text style={{ fontSize: '14px', color: '#8c8c8c', fontFamily: 'monospace' }}>
                Deployment ID: {isLoading ? 'Loading...' : deploymentId || 'Not available'}
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
              Fetching deployment information...
            </Text>
          </div>
        )}

        {error && (
          <Alert
            message="Unable to Load Contact Form"
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
            <div>Please ensure the environment is properly configured to contact support.</div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ContactLowcoderModal; 