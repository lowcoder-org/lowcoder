import React, { useEffect, useRef, useState } from "react";
import { Row, Col, Tabs } from 'antd';
import { ObjectFieldTemplateProps, getTemplate, getUiOptions, descriptionId, titleId, canExpand } from '@rjsf/utils';
import { ConfigConsumer } from 'antd/es/config-provider/context';
import { useContainerWidth } from "./jsonSchemaFormComp";
import styled from "styled-components";
import TabPane from "antd/es/tabs/TabPane";
import { is } from "core-js/core/object";

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
  const containerWidth = useContainerWidth();
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

  const { rowGutter = 4 } = uiSchema?.['ui:props'] || {};

  const getLegendStyle = (level: number): React.CSSProperties => {
    switch (level) {
      case 0:
        return { fontSize: "16px", fontWeight: "bold", marginBottom: "8px" }; // Form Title
      case 1:
        return { fontSize: "14px", fontWeight: "600", marginBottom: "6px" }; // Section Title
      default:
        return { fontSize: "12px", fontWeight: "normal", marginBottom: "4px" }; // Field Title
    }
  };

  const calculateResponsiveColSpan = (uiSchema: any = {}): { span: number } => {
    const colSpan = uiSchema?.["ui:colSpan"] || {
      xs: 24,
      sm: 24,
      md: 12,
      lg: 12,
      xl: 8,
    };
  
    if (typeof colSpan === "number") {
      return { span: colSpan };
    } else if (typeof colSpan === "object") {
      if (containerWidth > 1200 && colSpan.xl !== undefined) {
        return { span: colSpan.xl };
      } else if (containerWidth > 992 && colSpan.lg !== undefined) {
        return { span: colSpan.lg };
      } else if (containerWidth > 768 && colSpan.md !== undefined) {
        return { span: colSpan.md };
      } else if (containerWidth > 576 && colSpan.sm !== undefined) {
        return { span: colSpan.sm };
      } else if (colSpan.xs !== undefined) {
        return { span: colSpan.xs };
      }
    }
    return { span: 24 }; // Default span
  };
  
  const getFieldRenderer = (type: string) => {
    const typeMap: Record<string, string> = {
      string: "StringField",        // Handles strings
      number: "NumberField",        // Handles floating-point numbers
      integer: "NumberField",       // Handles integers (mapped to NumberField)
      boolean: "BooleanField",      // Handles true/false values
      object: "ObjectField",        // Handles nested objects
      array: "ArrayField",          // Handles arrays
      null: "NullField",            // Handles null values
      anyOf: "AnyOfField",          // Handles anyOf schemas
      oneOf: "OneOfField",          // Handles oneOf schemas
      schema: "SchemaField",
    };
  
    const fieldName = typeMap[type];
    return fieldName ? registry.fields[fieldName] : undefined;
  };
  
  const renderSingleLevel = (level : number) => {
    return (
      <Row gutter={rowGutter}>
        {properties.map((prop) => {
          const isArray = prop.content.props.schema.type === "array";
          const colSpan = isArray
            ? { span: 24 }
            : calculateResponsiveColSpan(uiSchema?.[prop.name] || {});
  
          return (
            <Col key={prop.name} {...colSpan}>
              {/* Render legend for array fields */}
              {isArray && (
                <><br /><legend style={getLegendStyle(level)}>
                  {prop.content.props.schema.title}
                </legend></>
              )}
              {/* Render field content */}
              {prop.content}
            </Col>
          );
        })}
      </Row>
    );
  };

  const renderCategorization = (elements: any[]) => {
    return (
      <Tabs>
        {elements.map((category, index) => (
          <TabPane tab={category.label || `Category ${index + 1}`} key={category.label || index}>
            {category.elements.map((element: any, elementIndex: number) => {
              if (element.type === "HorizontalLayout") {
                return (
                  <Row key={elementIndex} gutter={rowGutter}>
                    {element.elements.map((field: any, fieldIndex: number) => {
                      const colSpan = calculateResponsiveColSpan(field.uiSchema);
                      return (
                        <Col key={fieldIndex} {...colSpan}>
                          {properties.find((prop) => prop.name === field.scope.replace("#/properties/", ""))
                            ?.content}
                        </Col>
                      );
                    })}
                  </Row>
                );
              }

              if (element.type === "Control") {
                return properties.find((prop) => prop.name === element.scope.replace("#/properties/", ""))
                  ?.content;
              }

              return null;
            })}
          </TabPane>
        ))}
      </Tabs>
    );
  };

  const renderFieldsFromSection = (section: any, level: number = 0) => {
    const { formData, schema, uiSchema } = section.content.props;
  
    if (schema.type === "object" && schema.properties) {
      // Render fields for objects
      const fieldKeys = Object.keys(schema.properties);
  
      return (
        <Row gutter={rowGutter} style={level === 0 ? { marginBottom: "36px" } : { marginLeft: -8, marginRight: -8, marginBottom: "16px" }}>
          {fieldKeys.map((fieldKey) => {
            const fieldSchema = schema.properties[fieldKey];
            const fieldUiSchema = uiSchema?.[fieldKey] || {};
            const fieldFormData = formData ? formData[fieldKey] : undefined;
            const span = calculateResponsiveColSpan(fieldUiSchema);
  
            const FieldRenderer = getFieldRenderer(fieldSchema.type);
  
            if (!FieldRenderer) {
              console.error(`No renderer found for field type: ${fieldSchema.type}`);
              return (
                <Col key={fieldKey} span={span.span}>
                  <div>Unsupported field type: {fieldSchema.type}</div>
                </Col>
              );
            }
  
            return (
              <Col key={fieldKey} span={span.span} style={{marginTop : "12px"}}>
                <fieldset>
                  <legend style={getLegendStyle(level)}>{fieldSchema.title || fieldKey}</legend>
                  <FieldRenderer
                    schema={fieldSchema}
                    uiSchema={fieldUiSchema}
                    formData={fieldFormData}
                    registry={registry}
                    idSchema={section.content.props.idSchema[fieldKey]}
                    name={fieldKey}
                    required={schema.required?.includes(fieldKey)}
                    disabled={section.content.props.disabled}
                    readonly={section.content.props.readonly}
                    onChange={(value: any) => {
                      section.content.props.onChange({
                        ...formData,
                        [fieldKey]: value,
                      });
                    }}
                    onBlur={section.content.props.onBlur}
                    onFocus={section.content.props.onFocus}
                  />
                </fieldset>
              </Col>
            );
          })}
        </Row>
      );
    } else if (schema.type === "array" && schema.items) {
      // Render fields for arrays
      const FieldRenderer = getFieldRenderer(schema.type);
  
      if (!FieldRenderer) {
        console.error(`No renderer found for field type: ${schema.type}`);
        return (
          <div>
            <p>Unsupported field type: {schema.type}</p>
          </div>
        );
      }
  
      return (
        <fieldset>
          <FieldRenderer
            schema={schema}
            uiSchema={uiSchema}
            formData={formData}
            registry={registry}
            idSchema={section.content.props.idSchema}
            name={section.name}
            required={section.required}
            disabled={section.content.props.disabled}
            readonly={section.content.props.readonly}
            onChange={section.content.props.onChange}
            onBlur={section.content.props.onBlur}
            onFocus={section.content.props.onFocus}
          />
        </fieldset>
      );
    }
  
    // Log error for unsupported or missing schema types
    console.error("Unsupported or missing schema type in section:", section);
    return null;
  };  

  const renderSections = (properties: any[], level: number) => {

    const isMultiLevel = properties.some(
      (prop) => prop.content.props.schema?.type === "object" && prop.content.props.schema?.properties
    );

    if (!isMultiLevel) {
      return renderSingleLevel(level);
    }

    return properties.map((section) => {
        const schema = section.content.props.schema;
        const isArray = typeof section.content.props.index === 'number';
        const sectionTitle = schema.title || section.name;

        return (
          <Row
              key={section.name}
              gutter={rowGutter}
              style={{ marginBottom: "16px", width: "100%" }}
          >
            <Col span={24}>
              <fieldset>
                {/* Always render the legend for the section itself */}
                {level === 0 && !isArray ? (
                    <legend style={getLegendStyle(level)}>{sectionTitle}</legend>
                ) : null}

                {/* Render the section content */}
                {renderFieldsFromSection(section, level + 1)}
              </fieldset>
            </Col>
          </Row>
        );
    });
  };

  return (
    <ConfigConsumer>
      {() => (
        <fieldset id={idSchema.$id} className="form-section">
          {/* Render Title */}
          {schema.type === "object" && title && (
            <legend>
              <TitleFieldTemplate
                id={titleId(idSchema)}
                title={title}
                required={props.required}
                schema={schema}
                uiSchema={uiSchema}
                registry={registry}
              />
            </legend>
          )}

          {/* Render Description */}
          {description && (
            <Row>
              <Col span={24} style={DESCRIPTION_COL_STYLE}>
                <DescriptionFieldTemplate
                  id={descriptionId(idSchema)}
                  description={description}
                  schema={schema}
                  uiSchema={uiSchema}
                  registry={registry}
                />
              </Col>
            </Row>
          )}

          {/* Render Sections */}
          {renderSections(properties,0)}

          {/* Expand Button */}
          {canExpand(schema, uiSchema, formData) && (
            <Row justify="end" style={{ width: "100%", marginTop: "24px" }}>
              <Col>
                <AddButton
                  className="object-property-expand"
                  onClick={onAddClick(schema)}
                  disabled={disabled || readonly}
                  registry={registry}
                />
              </Col>
            </Row>
          )}
        </fieldset>
      )}
    </ConfigConsumer>
  );
};

export default ObjectFieldTemplate;