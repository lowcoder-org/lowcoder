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
        style={{ cursor: "pointer", color: '#1890ff', fontWeight: '500' }}
        onClick={item.onClick}
        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
      >
        {item.title}
      </span>
    ) : (
      <span style={{ color: '#595959', fontWeight: '500' }}>
        {item.title}
      </span>
    )
  }));

  return (
    <div className="modern-breadcrumb" style={{
      background: '#e6f7ff',
      padding: '10px 20px',
      borderRadius: '8px',
      marginBottom: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center'
    }}>
      <Breadcrumb {...props} separator="/" items={breadcrumbItems} />
    </div>
  );
};

export default ModernBreadcrumbs; 