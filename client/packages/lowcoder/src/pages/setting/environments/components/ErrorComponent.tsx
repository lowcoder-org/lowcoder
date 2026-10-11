import React from 'react';
import { Card, Button, Typography } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import history from '@lowcoder-ee/util/history';
import { trans } from 'i18n';

const { Title, Text } = Typography;

interface ErrorComponentProps {
  errorMessage: string;
  returnPath: string;
  returnLabel: string;
}

const ErrorComponent: React.FC<ErrorComponentProps> = ({ errorMessage, returnPath, returnLabel }) => {
  return (
    <div style={{ padding: '24px', flex: 1 }}>
      <Card style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Title level={3} style={{ color: '#ff4d4f' }}>
            {errorMessage}
          </Title>
          <Text type="secondary" style={{ display: 'block', margin: '16px 0' }}>
            {trans("environments.error_itemNotFound")}
          </Text>
          <Button 
            type="primary"
            onClick={() => history.push(returnPath)}
            style={{ marginTop: '16px' }}
          >
            <HomeOutlined /> {returnLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ErrorComponent;
