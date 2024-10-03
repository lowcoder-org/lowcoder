import React from 'react';
import { Row, Col } from 'antd';
import { ObjectFieldTemplateProps, getTemplate, getUiOptions, descriptionId, titleId, canExpand } from '@rjsf/utils';
import { ConfigConsumer } from 'antd/es/config-provider/context';

const DESCRIPTION_COL_STYLE = {
  paddingBottom: '8px',
};

const ObjectFieldTemplate = (props: ObjectFieldTemplateProps) => {
  const {
    title,
    description,
    properties,
    schema,
    uiSchema,
    formData,
    idSchema,
    onAddClick,
    disabled,
    readonly,
    registry,
  } = props;

  const uiOptions = getUiOptions(uiSchema);
  const TitleFieldTemplate = getTemplate('TitleFieldTemplate', registry, uiOptions);
  const DescriptionFieldTemplate = getTemplate('DescriptionFieldTemplate', registry, uiOptions);
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;

  // Define responsive column spans based on the ui:props or fallback to defaults
  const defaultResponsiveColSpan = {
    xs: 24, // Extra small devices
    sm: 24, // Small devices
    md: 12, // Medium devices
    lg: 12, // Large devices
    xl: 8,  // Extra large devices
  };

  const { rowGutter = 4, colSpan = defaultResponsiveColSpan } = uiSchema?.['ui:props'] || {};

  // Generate responsive colSpan props for each element
  const calculateResponsiveColSpan = (element: any) => {
    const { type } = element.content.props.schema;
    const widget = getUiOptions(element.content.props.uiSchema).widget;

    const defaultSpan = widget === 'textarea' || type === 'object' || type === 'array' ? 24 : colSpan;

    // Ensure the returned object is properly formatted for AntD responsive properties
    return typeof defaultSpan === 'object' ? defaultSpan : { span: defaultSpan };
  };

  return (
    <ConfigConsumer>
      {(configProps) => (
        <fieldset id={idSchema.$id} className="form-section">
          <Row gutter={rowGutter}>
            {schema.type === 'object' && title && (
              <legend>
                <TitleFieldTemplate id={titleId(idSchema)} title={title} required={props.required} schema={schema} uiSchema={uiSchema} registry={registry} />
              </legend>
            )}
            {description && (
              <Col span={24} style={DESCRIPTION_COL_STYLE}>
                <DescriptionFieldTemplate id={descriptionId(idSchema)} description={description} schema={schema} uiSchema={uiSchema} registry={registry} />
              </Col>
            )}
            {uiSchema?.['ui:grid'] && Array.isArray(uiSchema['ui:grid']) ? (
              uiSchema['ui:grid'].map((ui_row: Record<string, any>) => {
                return Object.keys(ui_row).map((row_item) => {
                  const element = properties.find((p) => p.name === row_item);
                  return element ? (
                    // Pass responsive colSpan props using the calculated values
                    <Col key={element.name} {...ui_row[row_item]}>
                      {element.content}
                    </Col>
                  ) : null;
                });
              })
            ) : (
              properties.map((element) => (
                <Col key={element.name} {...calculateResponsiveColSpan(element)}>
                  {element.content}
                </Col>
              ))
            )}
          </Row>
          {canExpand(schema, uiSchema, formData) && (
            <Row justify="end" style={{ marginTop: '24px' }}>
              <Col>
                <AddButton className="object-property-expand" onClick={onAddClick(schema)} disabled={disabled || readonly} registry={registry} />
              </Col>
            </Row>
          )}
        </fieldset>
      )}
    </ConfigConsumer>
  );
};

export default ObjectFieldTemplate;
