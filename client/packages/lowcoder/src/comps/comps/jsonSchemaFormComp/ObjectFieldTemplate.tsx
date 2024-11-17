import React, { useEffect, useRef, useState } from "react";
import { Row, Col } from 'antd';
import { ObjectFieldTemplateProps, getTemplate, getUiOptions, descriptionId, titleId, canExpand } from '@rjsf/utils';
import { ConfigConsumer } from 'antd/es/config-provider/context';
import { useContainerWidth } from "./jsonSchemaFormComp";
import styled from "styled-components";

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

  const calculateResponsiveColSpan = (element: any, level: number): { span: number } => {

    console.log("Calculating span for", element.name, "at level", level);

    // root level
    if (level === 0) return { span: 24 };

    // Check if the element has a layout definition in ui:grid
    const gridColSpan = uiSchema?.['ui:grid']
      ?.find((row: Record<string, any>) => row[element.name])
      ?. [element.name];

    if (gridColSpan) {
      if (typeof gridColSpan === "number") {
        return { span: gridColSpan };
      } else if (typeof gridColSpan === "object") {
        if (containerWidth > 1200 && gridColSpan.xl !== undefined) {
          return { span: gridColSpan.xl };
        } else if (containerWidth > 992 && gridColSpan.lg !== undefined) {
          return { span: gridColSpan.lg };
        } else if (containerWidth > 768 && gridColSpan.md !== undefined) {
          return { span: gridColSpan.md };
        } else if (containerWidth > 576 && gridColSpan.sm !== undefined) {
          return { span: gridColSpan.sm };
        } else if (gridColSpan.xs !== undefined) {
          return { span: gridColSpan.xs };
        }
      }
    }

    // Fallback to default colSpan or ui:props.colSpan
    const uiSchemaProps = getUiOptions(element.content.props.uiSchema)?.["ui:props"] as
      | { colSpan?: Record<string, number> | number }
      | undefined;

    const uiSchemaColSpan = uiSchemaProps?.colSpan;

    if (uiSchemaColSpan) {
      if (typeof uiSchemaColSpan === "number") {
        return { span: uiSchemaColSpan };
      } else if (typeof uiSchemaColSpan === "object") {
        if (containerWidth > 1200 && uiSchemaColSpan.xl !== undefined) {
          return { span: uiSchemaColSpan.xl };
        } else if (containerWidth > 992 && uiSchemaColSpan.lg !== undefined) {
          return { span: uiSchemaColSpan.lg };
        } else if (containerWidth > 768 && uiSchemaColSpan.md !== undefined) {
          return { span: uiSchemaColSpan.md };
        } else if (containerWidth > 576 && uiSchemaColSpan.sm !== undefined) {
          return { span: uiSchemaColSpan.sm };
        } else if (uiSchemaColSpan.xs !== undefined) {
          return { span: uiSchemaColSpan.xs };
        }
      }
    }

    // Default responsive behavior
    const defaultSpan = containerWidth > 1200 ? 8 : containerWidth > 768 ? 12 : 24;
    return { span: defaultSpan };
  };

  const renderProperties = (properties: any[], level: number) => {
    console.log("Rendering level:", level); // Debugging level
    return (
      <Row
        gutter={rowGutter}
        style={level === 0 ? { width: "100%" } : { marginLeft: -8, marginRight: -8 }}
      >
        {properties.map((element) => {
          const span = calculateResponsiveColSpan(element, level);
  
          // Check if the element is an object or array and has nested properties
          if (element.content?.props?.schema?.type === "object" && element.content.props.properties) {
            // Render nested objects with an incremented level
            return (
              <Col key={element.name} span={24}>
                <fieldset>
                  <legend>{element.content.props.title || element.name}</legend>
                  {renderProperties(element.content.props.properties, level + 1)}
                </fieldset>
              </Col>
            );
          }
  
          // Render normal elements
          return (
            <Col key={element.name} span={span.span}>
              {element.content}
            </Col>
          );
        })}
      </Row>
    );
  };
  
  return (
    <ConfigConsumer>
      {(configProps) => (
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
          {/* Render Properties */}
          {renderProperties(properties, 0)}
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
