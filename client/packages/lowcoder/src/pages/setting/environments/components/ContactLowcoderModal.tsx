import React, { useEffect } from 'react';
import { Modal, Card, Row, Col, Typography, Divider } from 'antd';
import { CustomerServiceOutlined, CloudServerOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { getDeploymentId } from 'redux/selectors/configSelectors';
import { fetchDeploymentIdAction } from 'redux/reduxActions/configActions';
import { Environment } from '../types/environment.types';

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
  // Get deploymentId from Redux config provider
  const deploymentId = useSelector(getDeploymentId);
  const dispatch = useDispatch();

  // Fetch deployment ID when modal opens if not already available
  useEffect(() => {
    if (visible && !deploymentId) {
      dispatch(fetchDeploymentIdAction());
    }
  }, [visible, deploymentId, dispatch]);

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CustomerServiceOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
          <span style={{ fontSize: '18px', fontWeight: 600 }}>Contact Lowcoder Team</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
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
                Deployment ID: {deploymentId || 'Loading...'}
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      <Divider style={{ margin: '16px 0' }} />

      {/* HubSpot Form Integration Section */}
      <div style={{ minHeight: '400px', padding: '20px 0' }}>
        <Title level={4} style={{ textAlign: 'center', marginBottom: '24px', color: '#262626' }}>
          Get in Touch
        </Title>
        
        <Text style={{ 
          textAlign: 'center', 
          display: 'block', 
          marginBottom: '32px',
          fontSize: '16px',
          color: '#595959',
          lineHeight: '1.6'
        }}>
          Our team is here to help you resolve licensing issues and get your environment up and running.
        </Text>

        {/* HubSpot Form Container */}
        <div style={{
          minHeight: '300px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fdfdfd',
          borderRadius: '8px',
          border: '1px solid #f0f0f0'
        }}>
          {/* HubSpot form will be integrated here */}
          <div style={{
            textAlign: 'center',
            color: '#8c8c8c',
            fontSize: '14px'
          }}>
            <CustomerServiceOutlined style={{ fontSize: '48px', marginBottom: '16px', color: '#d9d9d9' }} />
            <div>Contact form will be integrated here</div>
          </div>
        </div>

        {/* Environment data is available for form pre-filling */}
        {/* Data available: environment.environmentName, environment.environmentId, deploymentId, 
            environment.licenseStatus, environment.environmentType, environment.licenseError */}
      </div>
    </Modal>
  );
};

export default ContactLowcoderModal; 