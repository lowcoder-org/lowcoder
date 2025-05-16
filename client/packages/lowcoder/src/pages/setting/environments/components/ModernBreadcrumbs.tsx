import React, { ReactNode } from 'react';
import { Breadcrumb } from 'antd';
import { BreadcrumbProps } from 'antd/lib/breadcrumb';

interface ModernBreadcrumbsProps extends BreadcrumbProps {
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
  return (
    <div className="modern-breadcrumb" style={{
      background: '#f0f2f5',
      padding: '12px 24px',
      borderRadius: '8px',
      marginBottom: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <Breadcrumb {...props}>
        {items.map(item => (
          <Breadcrumb.Item key={item.key}>
            {item.onClick ? (
              <span
                style={{ cursor: "pointer" }}
                onClick={item.onClick}
              >
                {item.title}
              </span>
            ) : (
              item.title
            )}
          </Breadcrumb.Item>
        ))}
      </Breadcrumb>
    </div>
  );
};

export default ModernBreadcrumbs; 