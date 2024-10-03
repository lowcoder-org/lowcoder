import React from 'react';
import { Button, Row, Col } from 'antd';
import { ArrayFieldTemplateProps } from '@rjsf/utils';
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';

const ArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
  const { items, canAdd, onAddClick, title } = props;

  return (
    <fieldset>
      {title && <legend>{title}</legend>}
      <Row gutter={[0, 0]}>
        {items.map((element: any) => (
          <Col key={element.index} span={24} style={{ display: 'flex', alignItems: 'center' }}>
            {/* Content container for the array item */}
            <div style={{ flexGrow: 1 }}>
              {element.children}
            </div>

            {/* Container for the control buttons with vertical alignment */}
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', paddingTop: "58px" }}>
              {/* Move down button */}
              {element.hasMoveDown && (
                <Button
                  type="default"
                  icon={<ArrowDownOutlined />}
                  onClick={element.onReorderClick(element.index, element.index + 1)}
                  style={{ marginLeft: '4px' }}
                />
              )}

              {/* Move up button */}
              {element.hasMoveUp && (
                <Button
                  type="default"
                  icon={<ArrowUpOutlined />}
                  onClick={element.onReorderClick(element.index, element.index - 1)}
                  style={{ marginLeft: '4px' }}
                />
              )}

              {/* Remove button */}
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
        ))}
        {/* Add button for the array */}
        {canAdd && (
          <Col span={24} style={{ textAlign: 'center' }}>
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
