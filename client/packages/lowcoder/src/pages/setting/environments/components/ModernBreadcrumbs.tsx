import React, { ReactNode } from 'react';
import { Breadcrumb } from 'antd';
import { BreadcrumbProps } from 'antd/lib/breadcrumb';

interface ModernBreadcrumbsProps extends Omit<BreadcrumbProps, 'items'> {
  /**
   * Items to display in the breadcrumb
   */
  items?: {
    key: string;
    title: ReactNode;
    onClick?: () => void;
  }[];
}

/**
 * Modern styled breadcrumb component with consistent styling
 */
const ModernBreadcrumbs: React.FC<ModernBreadcrumbsProps> = ({ items = [], ...props }) => {
  // Convert custom items format to Antd's expected format
  const breadcrumbItems = items.map(item => ({
    key: item.key,
    title: item.onClick ? (
      <span
        style={{ 
          cursor: "pointer", 
          color: '#1890ff', 
          fontWeight: '500',
          transition: 'color 0.2s ease'
        }}
        onClick={item.onClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#096dd9';
          e.currentTarget.style.textDecoration = 'underline';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#1890ff';
          e.currentTarget.style.textDecoration = 'none';
        }}
      >
        {item.title}
      </span>
    ) : (
      <span style={{ color: '#222222', fontWeight: '500' }}>
        {item.title}
      </span>
    )
  }));

  return (
    <div className="modern-breadcrumb" style={{
      background: '#f5f5f5',
      padding: '12px 20px',
      borderRadius: '4px',
      marginBottom: '20px',
      border: '1px solid #e8e8e8',
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      display: 'flex',
      alignItems: 'center'
    }}>
      <Breadcrumb 
        {...props} 
        separator={<span style={{ color: '#8b8fa3' }}>/</span>}
        items={breadcrumbItems} 
      />
    </div>
  );
};

export default ModernBreadcrumbs; 