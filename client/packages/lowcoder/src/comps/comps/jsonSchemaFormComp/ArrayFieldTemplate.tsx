import React from 'react';
import { Button, Row, Col } from 'antd';
import { ArrayFieldTemplateProps, getUiOptions, RJSFSchema } from '@rjsf/utils';
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import ObjectFieldTemplate from './ObjectFieldTemplate'; // Ensure this is correctly imported

const DEFAULT_RESPONSIVE_COL_SPAN = {
  xs: 24,
  sm: 24,
  md: 12,
  lg: 8,
  xl: 6,
};

type UiProps = {
  rowGutter?: number;
  colSpan?: number | Record<string, number>;
};

const ArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
  const { items, canAdd, onAddClick, title, uiSchema, registry } = props;

  // Get UI schema configuration
  const { rowGutter = 8, colSpan = DEFAULT_RESPONSIVE_COL_SPAN } = getUiOptions(uiSchema)?.["ui:props"] as UiProps || {};

  const calculateResponsiveColSpan = (): { span: number } => {
    if (typeof colSpan === 'number') {
      return { span: colSpan };
    } else if (typeof colSpan === 'object') {
      // Return span based on screen width
      const width = window.innerWidth;
      if (width > 1200 && colSpan.xl !== undefined) return { span: colSpan.xl };
      if (width > 992 && colSpan.lg !== undefined) return { span: colSpan.lg };
      if (width > 768 && colSpan.md !== undefined) return { span: colSpan.md };
      if (width > 576 && colSpan.sm !== undefined) return { span: colSpan.sm };
      return { span: colSpan.xs || DEFAULT_RESPONSIVE_COL_SPAN.xs };
    }
    return { span: DEFAULT_RESPONSIVE_COL_SPAN.xs };
  };

  const renderItems = () => {
    return items.map((element) => {
      const { schema, uiSchema, formData, idSchema, name } = element.children.props;

      return (
        <Col key={element.index} span={24}>
          {/* Use ObjectFieldTemplate to render each array item */}
          <ObjectFieldTemplate
            title=""
            description={schema.description}
            properties={[
              {
                content: element.children,
                name,
                readonly: element.children.props.readonly,
                disabled: element.children.props.disabled,
                hidden: false
              },
            ]}
            schema={schema}
            uiSchema={uiSchema}
            formData={formData}
            idSchema={idSchema}
            registry={registry}
            readonly={element.children.props.readonly}
            disabled={element.children.props.disabled} 
            onAddClick={function (schema: RJSFSchema): () => void {
              throw new Error('Function not implemented.');
            } }
          />

          {/* Control buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            {element.hasMoveDown && (
              <Button
                type="default"
                icon={<ArrowDownOutlined />}
                onClick={element.onReorderClick(element.index, element.index + 1)}
                style={{ marginLeft: '4px' }}
              />
            )}
            {element.hasMoveUp && (
              <Button
                type="default"
                icon={<ArrowUpOutlined />}
                onClick={element.onReorderClick(element.index, element.index - 1)}
                style={{ marginLeft: '4px' }}
              />
            )}
            {element.hasRemove && (
              <Button
                type="default"
                icon={<DeleteOutlined />}
                danger
                onClick={element.onDropIndexClick(element.index)}
                style={{ marginLeft: '4px' }}
              />
            )}
          </div>
        </Col>
      );
    });
  };

  return (
    <fieldset>
      
      <Row gutter={rowGutter}>
        {renderItems()} {/* Render items */}
        {canAdd && (
          <Col span={24} style={{ textAlign: 'center', marginTop: '16px' }}>
            <Button type="dashed" onClick={onAddClick} icon={<PlusOutlined />}>
              Add Item
            </Button>
          </Col>
        )}
      </Row>
    </fieldset>
  );
};

export default ArrayFieldTemplate;