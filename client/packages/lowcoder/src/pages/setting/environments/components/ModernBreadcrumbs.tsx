import React, { ReactNode } from 'react';
import { default as AntdBreadcrumb } from 'antd/es/breadcrumb';
import { BreadcrumbProps } from 'antd/lib/breadcrumb';
import styled from 'styled-components';
import { ArrowIcon } from 'lowcoder-design';

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

const Breadcrumb = styled(AntdBreadcrumb)`
  margin-bottom: 10px;
  font-size: 20px;
  li:not(:last-child) {
    color: #8b8fa3;
  }

  li:last-child {
    font-weight: 500;
    color: #222222;
  }

  li.ant-breadcrumb-separator {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
`;

const BreadcrumbItem = styled.div`
  cursor: pointer;
`;


const ModernBreadcrumbs: React.FC<ModernBreadcrumbsProps> = ({ items = [], ...props }) => {
  // Convert custom items format to the standard format used throughout the application
  const breadcrumbItems = items.map(item => ({
    key: item.key,
    title: item.title,
    onClick: item.onClick
  }));

  return (
    <Breadcrumb
      {...props}
      separator={<ArrowIcon />}
      items={breadcrumbItems}
      itemRender={(item) => (
        <BreadcrumbItem
          key={item.key}
          onClick={item.onClick}
        >
          {item.title}
        </BreadcrumbItem>
      )}
    />
  );
};

export default ModernBreadcrumbs; 