import React from 'react';
import { Card } from 'antd';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Reusable StatsCard component for displaying environment statistics
 * Used across all Environment pages for consistency
 */
const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon, 
  color = '#1890ff',
  className = '',
  style = {}
}) => {
  return (
    <Card 
      className={className}
      style={{ 
        height: '100%', 
        borderRadius: '4px',
        border: '1px solid #f0f0f0',
        ...style
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ 
            fontSize: '13px', 
            color: '#8c8c8c', 
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {title}
          </div>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: 500,
            color: '#262626'
          }}>
            {value}
          </div>
        </div>
        {icon && (
          <div style={{ 
            fontSize: '24px', 
            opacity: 0.8, 
            color: color,
            padding: '8px',
            backgroundColor: `${color}15`,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatsCard; 