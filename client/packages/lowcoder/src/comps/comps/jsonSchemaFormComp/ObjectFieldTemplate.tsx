import React, { useEffect, useRef, useState } from "react";
import { Row, Col } from "antd";
import {
  ObjectFieldTemplateProps,
  getTemplate,
  getUiOptions,
  descriptionId,
  titleId,
  canExpand,
} from "@rjsf/utils";
import { ConfigConsumer } from "antd/es/config-provider/context";

const DESCRIPTION_COL_STYLE = {
  paddingBottom: "8px",
};

interface ColSpan {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

interface UiOptions {
  colSpan: ColSpan;
  rowGutter: number;
  // other properties...
}

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

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Monitor the container's width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    // Create a ResizeObserver to watch for width changes
    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Initial update
    updateWidth();

    // Cleanup observer on unmount
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const uiOptions = getUiOptions(uiSchema);
  const TitleFieldTemplate = getTemplate("TitleFieldTemplate", registry, uiOptions);
  const DescriptionFieldTemplate = getTemplate("DescriptionFieldTemplate", registry, uiOptions);
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;

  const defaultResponsiveColSpan = (width: number) => {
    if (width > 1200) return 8; // Wide screens
    if (width > 768) return 12; // Tablets
    return 24; // Mobile
  };

  const { rowGutter = 4 } = uiSchema?.["ui:props"] || {};

  const calculateResponsiveColSpan = (element: any): { span: number } => {

    const uiSchemaProps = getUiOptions(element.content.props.uiSchema)?.["ui:props"] as
      | { colSpan?: Record<string, number> | number }
      | undefined;

    const uiSchemaColSpan = uiSchemaProps?.colSpan;
    const defaultSpan = containerWidth > 1200 ? 8 : containerWidth > 768 ? 12 : 24;

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

    return { span: defaultSpan };
  };

  const renderSectionLayout = (properties: any[], uiGrid: any, section: string) => {

    if (uiGrid && Array.isArray(uiGrid)) {
      return (
        <Row gutter={rowGutter} key={section}>
          {uiGrid.map((ui_row: Record<string, any>) =>
            Object.keys(ui_row).map((row_item) => {
              const element = properties.find((p) => p.name === row_item);
              if (element) {
                const span = calculateResponsiveColSpan(element).span;
                return (
                  <Col key={element.name} span={span}>
                    {element.content}
                  </Col>
                );
              }
              return null;
            })
          )}
        </Row>
      );
    }

    // Default layout if no grid is provided
    return (
      <Row gutter={rowGutter} key={section}>
        {properties.map((element) => (
          <Col key={element.name} {...calculateResponsiveColSpan(element)}>
            {element.content}
          </Col>
        ))}
      </Row>
    );
  };

  const renderCustomLayout = () => {
    const schemaType = schema.type as string;
    switch (schemaType) {
      case "Group":
        return (
          <div style={{ border: "1px solid #ccc", padding: "15px", marginBottom: "10px" }}>
            <h3>{schema.label || "Group"}</h3>
            {renderSectionLayout(properties, uiSchema?.["ui:grid"], schema.label)}
          </div>
        );
      case "HorizontalLayout":
        return (
          <Row gutter={rowGutter} style={{ display: "flex", gap: "10px" }}>
            {properties.map((element) => (
              <Col key={element.name} {...calculateResponsiveColSpan(element)}>
                {element.content}
              </Col>
            ))}
          </Row>
        );
      case "VerticalLayout":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {properties.map((element) => (
              <div key={element.name}>{element.content}</div>
            ))}
          </div>
        );
      default:
        return null; // Fall back to default rendering if no match
    }
  };

  // Check if the schema is a custom layout type
  const schemaType = schema.type as string; // Extract schema type safely
  const isCustomLayout = ["Group", "HorizontalLayout", "VerticalLayout"].includes(schemaType);

  return (
    <div ref={containerRef}>
      <ConfigConsumer>
        {(configProps) => (
          <fieldset id={idSchema.$id} className="form-section">
            {!isCustomLayout && (
              <>
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
                {description && (
                    <Col span={24} style={DESCRIPTION_COL_STYLE}>
                      <DescriptionFieldTemplate
                        id={descriptionId(idSchema)}
                        description={description}
                        schema={schema}
                        uiSchema={uiSchema}
                        registry={registry}
                      />
                    </Col>
                )}
                {renderSectionLayout(properties, uiSchema?.["ui:grid"], "root")}
              </>
            )}

            {isCustomLayout && renderCustomLayout()}

            {canExpand(schema, uiSchema, formData) && (
              <Row justify="end" style={{ marginTop: "24px" }}>
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
    </div>
  );
};

export default ObjectFieldTemplate;
