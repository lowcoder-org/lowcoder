import React, { useState, useCallback, useEffect } from "react";
import {
  Form,
  Input,
  InputNumber,
  Switch,
  DatePicker,
  Select,
  Space,
  Button,
  Slider,
  Tabs,
  Row,
  Col,
  Steps,
} from "antd";
import styled from "styled-components";
import type { JsonSchema } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";
import debounce from "lodash/debounce";
import dayjs from "dayjs";
import { trans } from "i18n";

const { TextArea } = Input;

const Container = styled.div`
  .ant-form-item {
    margin-bottom: 16px;
  }

  .ant-form-item-label {
    padding: 0;
    font-weight: 600;
  }

  .ant-form-item-extra {
    min-height: 0px;
  }

  .ant-form-item-explain {
    line-height: 24px;
  }

  .ant-steps {
    margin-bottom: 24px;
  }

  .stepper-navigation {
    margin-top: 24px;
    display: flex;
    justify-content: space-between;
  }
`;

interface Category {
  type: "Category";
  label?: string;
  i18n?: string;
  elements: Array<Control | Layout>;
  rule?: {
    effect: "SHOW" | "HIDE";
    condition: {
      scope: string;
      schema: {
        const: any;
      };
    };
  };
}

interface Control {
  type: "Control";
  scope: string;
  options?: {
    multi?: boolean;
    slider?: boolean;
    restrict?: boolean;
  };
  rule?: {
    effect: "SHOW" | "HIDE";
    condition: {
      scope: string;
      schema: {
        const: any;
      };
    };
  };
}

interface HorizontalLayout {
  type: "HorizontalLayout";
  elements: Control[];
}

type Layout = HorizontalLayout;

interface Categorization {
  type: "Categorization";
  elements: Category[];
  options?: {
    variant?: "tabs" | "stepper";
    showNavButtons?: boolean;
  };
}

interface FieldUiSchema {
  type?: string;
  scope?: string;
  options?: {
    multi?: boolean;
    slider?: boolean;
    restrict?: boolean;
  };
  [key: string]: any;
}

export interface JsonFormsUiSchema {
  type?: string;
  elements?: Array<Category | Control | Layout>;
  options?: {
    variant?: "tabs" | "stepper";
    showNavButtons?: boolean;
  };
  [key: string]: FieldUiSchema | JsonFormsUiSchema | any;
}

export interface JsonFormsRendererProps {
  schema: JsonSchema;
  data: any;
  onChange: (data: any) => void;
  style?: any;
  showVerticalScrollbar?: boolean;
  autoHeight?: boolean;
  resetAfterSubmit?: boolean;
  uiSchema?: JsonFormsUiSchema;
  onSubmit?: () => void;
}

const JsonFormsRenderer: React.FC<JsonFormsRendererProps> = ({
  schema,
  data,
  onChange,
  style,
  uiSchema,
  onSubmit,
  resetAfterSubmit,
}) => {
  // Local state to handle immediate updates
  const [localData, setLocalData] = useState(data);
  // Track focused field
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Update local data when prop data changes
  useEffect(() => {
    setLocalData(data);
  }, [data]);

  // Debounced onChange handler
  const debouncedOnChange = useCallback(
    debounce((newData: any) => {
      onChange(newData);
    }, 300),
    [onChange]
  );

  const getFieldUiSchema = (path: string): FieldUiSchema | undefined => {
    if (!uiSchema) return undefined;
    
    // For JSONForms UI schema, we need to find the Control element that matches the path
    if (uiSchema.type === "HorizontalLayout" && Array.isArray(uiSchema.elements)) {
      const control = uiSchema.elements.find((element: any) => {
        if (element.type === "Control") {
          // Convert the scope path to match our field path
          // e.g., "#/properties/multilineString" -> "multilineString"
          const scopePath = element.scope?.replace("#/properties/", "");
          return scopePath === path;
        }
        return false;
      });
      return control;
    }
    
    // Fallback to the old path-based lookup for backward compatibility
    const pathParts = path.split('.');
    let current: any = uiSchema;
    for (const part of pathParts) {
      if (current && typeof current === 'object') {
        current = current[part];
      } else {
        return undefined;
      }
    }
    return current as FieldUiSchema;
  };

  const evaluateRule = (rule: any, data: any): boolean => {
    if (!rule) return true;
    
    const { scope, schema: ruleSchema } = rule.condition;
    const path = scope.replace("#/properties/", "").split("/");
    let value = data;
    
    for (const part of path) {
      value = value?.[part];
    }
    
    return value === ruleSchema.const;
  };

  const shouldShowElement = (element: any): boolean => {
    if (!element.rule) return true;
    return evaluateRule(element.rule, data);
  };

  const renderLayout = (layout: Layout) => {
    if (layout.type === "HorizontalLayout") {
      return (
        <Row gutter={16}>
          {layout.elements
            .filter(shouldShowElement)
            .map((element, index) => (
              <Col key={index} span={24 / layout.elements.length}>
                {renderControl(element)}
              </Col>
            ))}
        </Row>
      );
    }
    return null;
  };

  const renderControl = (control: Control) => {
    // Convert scope path to actual data path
    // e.g., "#/properties/address/properties/street" -> "address.street"
    const scopePath = control.scope.replace("#/properties/", "").replace("/properties/", ".");
    const path = scopePath.split(".");
    let fieldSchema: JSONSchema7 | undefined = schema as JSONSchema7;
    let value = data;
    
    // Navigate through the schema to find the correct field schema
    for (const part of path) {
      if (fieldSchema?.properties) {
        fieldSchema = fieldSchema.properties[part] as JSONSchema7 | undefined;
      }
      if (value && typeof value === 'object') {
        value = value[part];
      }
    }

    if (!fieldSchema) return null;

    // Use the last part of the path as the field key
    const fieldKey = path[path.length - 1];
    // Use the parent path for nested objects
    const parentPath = path.slice(0, -1).join(".");

    return renderField(
      fieldKey,
      fieldSchema,
      value,
      parentPath
    );
  };

  const renderCategory = (category: Category) => {
    if (!shouldShowElement(category)) return null;

    return (
      <div key={category.label}>
        {category.elements
          .filter(shouldShowElement)
          .map((element, index) => {
            if (element.type === "Control") {
              return <div key={index}>{renderControl(element)}</div>;
            } else if (element.type === "HorizontalLayout") {
              return <div key={index}>{renderLayout(element)}</div>;
            }
            return null;
          })}
      </div>
    );
  };

  const renderField = (
    key: string,
    fieldSchema: any,
    value: any,
    path: string = ""
  ) => {
    const fullPath = path ? `${path}.${key}` : key;
    const label = fieldSchema.title || key;
    const required = schema.required?.includes(key);
    const uiSchemaForField = getFieldUiSchema(fullPath);
    const isMultiline = uiSchemaForField?.options?.multi === true;
    const isSlider = uiSchemaForField?.options?.slider === true;
    const isRestrict = uiSchemaForField?.options?.restrict === true;
    const isFocused = focusedField === fullPath;

    const handleFocus = () => setFocusedField(fullPath);
    const handleBlur = () => setFocusedField(null);

    const handleChange = (newValue: any) => {
      const newData = { ...localData };
      if (path) {
        const pathParts = path.split(".");
        let current = newData;
        for (let i = 0; i < pathParts.length; i++) {
          if (i === pathParts.length - 1) {
            current[pathParts[i]] = {
              ...current[pathParts[i]],
              [key]: newValue,
            };
          } else {
            current = current[pathParts[i]];
          }
        }
      } else {
        newData[key] = newValue;
      }

      // Update local state immediately
      setLocalData(newData);
      // Debounce the parent update
      debouncedOnChange(newData);
    };

    // Handle nested objects
    if (fieldSchema.type === "object" && fieldSchema.properties) {
      return (
        <Form.Item key={fullPath} label={label} required={required}>
          <Space direction="vertical" style={{ width: "100%" }}>
            {Object.entries(fieldSchema.properties).map(
              ([subKey, subSchema]: [string, any]) =>
                renderField(subKey, subSchema, value?.[subKey], fullPath)
            )}
          </Space>
        </Form.Item>
      );
    }

    // Handle arrays
    if (fieldSchema.type === "array") {
      const items = value || [];
      return (
        <Form.Item key={fullPath} label={label} required={required}>
          <Space direction="vertical" style={{ width: "100%" }}>
            {items.map((item: any, index: number) => (
              <Space key={index}>
                {renderField(`${index}`, fieldSchema.items, item, fullPath)}
                <Button
                  type="text"
                  danger
                  onClick={() => {
                    const newItems = [...items];
                    newItems.splice(index, 1);
                    handleChange(newItems);
                  }}
                >
                  Remove
                </Button>
              </Space>
            ))}
            <Button type="dashed" onClick={() => handleChange([...items, ""])}>
              Add Item
            </Button>
          </Space>
        </Form.Item>
      );
    }

    // Handle different field types
    switch (fieldSchema.type) {
      case "string":
        if (fieldSchema.format === "date") {
          return (
            <Form.Item 
              key={fullPath} 
              label={label} 
              required={required}
              extra={isFocused ? fieldSchema.description : undefined}
            >
              <DatePicker
                style={{ width: "100%" }}
                value={value ? dayjs(value).isValid() ? dayjs(value) : null : null}
                onChange={(date) => {
                  if (date && date.isValid()) {
                    handleChange(date.format('YYYY-MM-DD'));
                  } else {
                    handleChange(null);
                  }
                }}
                onFocus={handleFocus}
                onBlur={handleBlur}
                format="YYYY-MM-DD"
                allowClear={true}
                inputReadOnly={true}
                disabledDate={(current) => {
                  // Disable future dates
                  return current && current.isAfter(dayjs().endOf('day'));
                }}
                picker="date"
              />
            </Form.Item>
          );
        }
        if (fieldSchema.enum) {
          return (
            <Form.Item 
              key={fullPath} 
              label={label} 
              required={required}
              extra={isFocused ? fieldSchema.description : undefined}
            >
              <Select
                style={{ width: "100%" }}
                value={value}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                options={fieldSchema.enum.map((option: string) => ({
                  label: option,
                  value: option,
                }))}
              />
            </Form.Item>
          );
        }
        // Check if this field should be multiline
        if (isMultiline) {
          return (
            <Form.Item 
              key={fullPath} 
              label={label} 
              required={required}
              extra={isFocused ? fieldSchema.description : undefined}
            >
              <TextArea
                value={value || ""}
                onChange={(e) => handleChange(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                autoComplete="off"
                spellCheck={false}
                autoSize={{ minRows: 3, maxRows: 6 }}
                maxLength={isRestrict ? fieldSchema.maxLength : undefined}
              />
            </Form.Item>
          );
        }
        return (
          <Form.Item 
            key={fullPath} 
            label={label} 
            required={required}
            extra={isFocused ? fieldSchema.description : undefined}
          >
            <Input
              value={value || ""}
              onChange={(e) => handleChange(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              autoComplete="off"
              spellCheck={false}
              maxLength={isRestrict ? fieldSchema.maxLength : undefined}
            />
          </Form.Item>
        );

      case "number":
      case "integer":
        return (
          <Form.Item 
            key={fullPath} 
            label={label} 
            required={required}
            extra={isFocused ? fieldSchema.description : undefined}
          >
            {isSlider ? (
              <Slider
                style={{ width: "100%" }}
                min={fieldSchema.minimum}
                max={fieldSchema.maximum}
                value={value}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            ) : (
              <InputNumber
                style={{ width: "100%" }}
                value={value}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                min={fieldSchema.minimum}
                max={fieldSchema.maximum}
                controls={false}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
              />
            )}
          </Form.Item>
        );

      case "boolean":
        return (
          <Form.Item
            key={fullPath}
            label={label}
            required={required}
            valuePropName="checked"
            extra={isFocused ? fieldSchema.description : undefined}
          >
            <div onFocus={handleFocus} onBlur={handleBlur}>
              <Switch 
                checked={value} 
                onChange={handleChange}
              />
            </div>
          </Form.Item>
        );

      default:
        return (
          <Form.Item 
            key={fullPath} 
            label={label} 
            required={required}
            extra={isFocused ? fieldSchema.description : undefined}
          >
            <Input
              value={value || ""}
              onChange={(e) => handleChange(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              autoComplete="off"
              spellCheck={false}
            />
          </Form.Item>
        );
    }
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit();
      if (resetAfterSubmit) {
        setCurrentStep(0);
      }
    }
  };

  if (uiSchema?.type === "Categorization") {
    const categorization = uiSchema as Categorization;
    const variant = categorization.options?.variant || "tabs";
    const visibleCategories = categorization.elements.filter(shouldShowElement);
    const isLastStep = currentStep === visibleCategories.length - 1;

    const handleNext = () => {
      if (currentStep < visibleCategories.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    };

    const handlePrev = () => {
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
      }
    };

    if (variant === "stepper") {
      return (
        <Container style={style}>
          <Steps
            current={currentStep}
            items={visibleCategories.map((category) => ({
              title: category.i18n ? trans(category.i18n) : (category.label || ''),
              description: category.elements.length > 0 ? 
                `${category.elements.length} field${category.elements.length > 1 ? 's' : ''}` : 
                undefined
            }))}
          />
          <div>
            {renderCategory(visibleCategories[currentStep])}
          </div>
          <div className="stepper-navigation">
            <Button 
              onClick={handlePrev}
              disabled={currentStep === 0}
            >
              {trans("previous")}
            </Button>
            {isLastStep ? (
              <Button 
                type="primary"
                onClick={handleSubmit}
              >
                {trans("submit")}
              </Button>
            ) : (
              <Button 
                type="primary"
                onClick={handleNext}
              >
                {trans("next")}
              </Button>
            )}
          </div>
        </Container>
      );
    }

    if (variant === "tabs") {
      return (
        <Container style={style}>
          <Tabs
            activeKey={String(currentStep)}
            onChange={(key) => setCurrentStep(parseInt(key))}
            items={visibleCategories.map((category, index) => ({
              key: String(index),
              label: category.i18n ? trans(category.i18n) : (category.label || ''),
              children: renderCategory(category),
            }))}
          />
        </Container>
      );
    }
  }

  // Fallback to default rendering if not a categorization
  return (
    <Container style={style}>
      <Form layout="vertical">
        {Object.entries(schema.properties || {}).map(
          ([key, fieldSchema]: [string, any]) =>
            renderField(key, fieldSchema, localData?.[key])
        )}
        <Form.Item>
          <Button
            type="primary"
            onClick={handleSubmit}
            style={{ float: "right" }}
          >
            {trans("event.submit")}
          </Button>
        </Form.Item>
      </Form>
    </Container>
  );
};

export default React.memo(JsonFormsRenderer);
