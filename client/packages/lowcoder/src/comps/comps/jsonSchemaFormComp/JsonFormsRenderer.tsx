import React, { useState, useCallback, useEffect, ReactNode } from "react";
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
import type { JSONSchema7 } from "json-schema";
import { debounce } from "lodash";
import dayjs from "dayjs";
import { trans } from "i18n";
import type { 
  FieldUiSchema, 
  Layout, 
  Categorization,
  ValidationState,
  JsonFormsRendererProps,
  Category,
  Control
} from "./types";
import { useContainerWidth } from "./jsonSchemaFormComp";

const { TextArea } = Input;

const Container = styled.div
`
  gap: 16px;
  width: 100%;
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

const JsonFormsRenderer: React.FC<JsonFormsRendererProps> = ({
  schema,
  data,
  onChange,
  style,
  uiSchema,
  onSubmit,
  resetAfterSubmit,
  validationState: externalValidationState,
  onValidationChange,
}) => {
  const containerWidth = useContainerWidth();
  // Local state to handle immediate updates
  const [localData, setLocalData] = useState(data);
  // Track focused field
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [internalValidationState, setInternalValidationState] = useState<ValidationState>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Use external validation state if provided, otherwise use internal
  const validationState = externalValidationState || internalValidationState;
  const setValidationState = useCallback((newState: ValidationState | ((prev: ValidationState) => ValidationState)) => {
    if (typeof newState === 'function') {
      const updatedState = newState(validationState);
      setInternalValidationState(updatedState);
      onValidationChange?.(updatedState);
    } else {
      setInternalValidationState(newState);
      onValidationChange?.(newState);
    }
  }, [validationState, onValidationChange]);

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
    if (Array.isArray(uiSchema.elements)) {
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
            .filter((element: Control) => shouldShowElement(element))
            .map((element: Control, index: number) => (
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
          .filter((element: Control | Layout) => shouldShowElement(element))
          .map((element: Control | Layout, index: number) => {
            if (element.type === "Control") {
              return <div key={index}>{renderControl(element as Control)}</div>;
            } else if (element.type === "HorizontalLayout") {
              return <div key={index}>{renderLayout(element as Layout)}</div>;
            }
            return null;
          })}
      </div>
    );
  };
  // Add validation function  
  const validateField = useCallback((path: string, value: any, fieldSchema: any) => {
    const errors: string[] = [];
    
    // Required field validation - check if field name is in schema.required array
    const fieldName = path.split('.').pop() || '';
    if (schema.required?.includes(fieldName) && (value === undefined || value === null || value === '')) {
      errors.push('This field is required');
    }

    // Type-specific validation
    if (value !== undefined && value !== null) {
      switch (fieldSchema.type) {
        case 'string':
          if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
            errors.push(`Minimum length is ${fieldSchema.minLength}`);
          }
          if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
            errors.push(`Maximum length is ${fieldSchema.maxLength}`);
          }
          if (fieldSchema.pattern && !new RegExp(fieldSchema.pattern).test(value)) {
            errors.push('Invalid format');
          }
          break;
        case 'number':
        case 'integer':
          if (fieldSchema.minimum !== undefined && value < fieldSchema.minimum) {
            errors.push(`Minimum value is ${fieldSchema.minimum}`);
          }
          if (fieldSchema.maximum !== undefined && value > fieldSchema.maximum) {
            errors.push(`Maximum value is ${fieldSchema.maximum}`);
          }
          break;
      }
    }

    return errors;
  }, [])
  // Helper to get value at a dot-separated path
  const getValueAtPath = (obj: any, path: string) => {
    if (!path) return obj;
    return path.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj);
  };
  // Update validation state when data changes
  useEffect(() => {
    if (isSubmitted) {
      const newValidationState: ValidationState = {};
      const validateObject = (obj: any, schema: any, path: string = '') => {
        if (schema.properties) {
          Object.entries(schema.properties).forEach(([key, fieldSchema]: [string, any]) => {
            const fullPath = path ? `${path}.${key}` : key;
            const value = getValueAtPath(obj, key);
            newValidationState[fullPath] = {
              errors: validateField(fullPath, getValueAtPath(obj, key), fieldSchema),
              touched: true
            };
            if (fieldSchema.type === 'object' && fieldSchema.properties) {
              validateObject(getValueAtPath(obj, key) || {}, fieldSchema, fullPath);
            }
          });
        }
      };
      validateObject(data, schema);
      setValidationState(newValidationState);
    }
  }, [data, schema, validateField, isSubmitted]);
  const handleValueChange = (newValue: any, fieldKey: string, fieldPath?: string) => {
    const newData = { ...localData };
    if (fieldPath) {
      const pathParts = fieldPath.split(".");
      let current = newData;
      for (let i = 0; i < pathParts.length; i++) {
        if (i === pathParts.length - 1) {
          current[pathParts[i]] = {
            ...current[pathParts[i]],
            [fieldKey]: newValue,
          };
        } else {
          current = current[pathParts[i]];
        }
      }
    } else {
      newData[fieldKey] = newValue;
    }

    setLocalData(newData);
    debouncedOnChange(newData);
  };

  const createInputHandler = (fieldKey: string, fieldPath?: string) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      handleValueChange(e.target.value, fieldKey, fieldPath);
    };
  };

  const createNumberHandler = (fieldKey: string, fieldPath?: string) => {
    return (value: number | null) => {
      handleValueChange(value, fieldKey, fieldPath);
    };
  };

  const createSwitchHandler = (fieldKey: string, fieldPath?: string) => {
    return (checked: boolean) => {
      handleValueChange(checked, fieldKey, fieldPath);
    };
  };

  const createArrayHandler = (fieldKey: string, fieldPath?: string) => {
    return (newItems: any[]) => {
      handleValueChange(newItems, fieldKey, fieldPath);
    };
  };

  const renderField = (
    key: string,
    fieldSchema: any,
    value: any,
    path: string = ""
  ): ReactNode => {
    const fullPath = path ? `${path}.${key}` : key;
    const label = fieldSchema.title || key;
    const required = schema.required?.includes(key);
    const uiSchemaForField = getFieldUiSchema(fullPath);
    const isMultiline = uiSchemaForField?.options?.multi === true;
    const isSlider = uiSchemaForField?.options?.slider === true;
    const isRestrict = uiSchemaForField?.options?.restrict === true;
    const isFocused = focusedField === fullPath;
    const fieldValidation = validationState[fullPath];
    const showErrors = isSubmitted && fieldValidation?.touched;

    const handleFocus = () => setFocusedField(fullPath);    const handleBlur = () => {
      setFocusedField(null);
      // Validate field on blur
      const errors = validateField(fullPath, value, fieldSchema);
      setValidationState(prev => {
        const newState = {
          ...prev,
          [fullPath]: {
            errors,
            touched: true
          }
        };
        return newState;
      });
    };

    // Modify Form.Item to include validation    
    const formItemProps = {
      key: fullPath,
      label: label,
      required: required,
      extra: isFocused ? fieldSchema.description : undefined,
      validateStatus: (fieldValidation?.touched && fieldValidation?.errors.length ? 'error' : undefined) as "" | "error" | "success" | "warning" | "validating" | undefined,
      help: fieldValidation?.touched ? fieldValidation?.errors.join(', ') : undefined,
    };

    // Handle nested objects
    if (fieldSchema.type === "object" && fieldSchema.properties) {
      return (
        <Form.Item {...formItemProps}>
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
        <Form.Item {...formItemProps}>
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
                    handleValueChange(newItems, key, fullPath);
                  }}
                >
                  Remove
                </Button>
              </Space>
            ))}
            <Button type="dashed" onClick={() => handleValueChange([...items, ""], key, fullPath)}>
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
            <Form.Item {...formItemProps}>
              <DatePicker
                style={{ width: "100%" }}
                value={value ? dayjs(value).isValid() ? dayjs(value) : null : null}
                onChange={(date) => {
                  if (date && date.isValid()) {
                    handleValueChange(date.format('YYYY-MM-DD'), key, path);
                  } else {
                    handleValueChange(null, key, path);
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
            <Form.Item {...formItemProps}>
              <Select
                style={{ width: "100%" }}
                value={value}
                onChange={(newValue) => handleValueChange(newValue, key, path)}
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
            <Form.Item {...formItemProps}>
              <TextArea
                value={value || ""}
                onChange={createInputHandler(key, path)}
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
          <Form.Item {...formItemProps}>
            <Input
              value={value || ""}
              onChange={createInputHandler(key, path)}
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
          <Form.Item {...formItemProps}>
            {isSlider ? (
              <Slider
                style={{ width: "100%" }}
                min={fieldSchema.minimum}
                max={fieldSchema.maximum}
                value={value}
                onChange={createNumberHandler(key, path)}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            ) : (
              <InputNumber
                style={{ width: "100%" }}
                value={value}
                onChange={createNumberHandler(key, path)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                min={fieldSchema.minimum}
                max={fieldSchema.maximum}
                controls={false}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value: string | undefined) => {
                  if (!value) return NaN;
                  const parsed = value.replace(/\$\s?|,*/g, "");
                  const num = Number(parsed);
                  return isNaN(num) ? NaN : num;
                }}
              />
            )}
          </Form.Item>
        );

      case "boolean":
        return (
          <Form.Item {...formItemProps} valuePropName="checked">
            <div onFocus={handleFocus} onBlur={handleBlur}>
              <Switch 
                checked={value} 
                onChange={createSwitchHandler(key, path)}
              />
            </div>
          </Form.Item>
        );

      default:
        return (
          <Form.Item {...formItemProps}>
            <Input
              value={value || ""}
              onChange={createInputHandler(key, path)}
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
    setIsSubmitted(true);
    
    // Check if there are any validation errors
    const hasErrors = Object.values(validationState).some((state: ValidationState[string]) => state.errors.length);
    if (!hasErrors && onSubmit) {
      onSubmit();
      if (resetAfterSubmit) {
        setCurrentStep(0);
        setIsSubmitted(false);
        setValidationState({});
      }
    }
  };

  if (uiSchema?.type === "Categorization") {
    const categorization = uiSchema as Categorization;
    const variant = categorization.options?.variant || "tabs";
    const visibleCategories = categorization.elements.filter((category: Category) => shouldShowElement(category));
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
      <Container>
        <Form layout="vertical">
          <Row gutter={16}>
            {Object.entries(schema.properties || {}).map(([key, fieldSchema]) => {
              const fieldUiSchema = uiSchema?.[key] || {};
              const colSpan = calculateColSpan(fieldUiSchema, containerWidth);

              return (
                <Col key={key} {...colSpan}>
                  {renderField(key, fieldSchema, localData?.[key])}
                </Col>
              );
            })}
          </Row>
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

const calculateColSpan = (uiSchema: any, containerWidth: number) => {
  const colSpan = uiSchema?.["ui:colSpan"] || { xs: 24, sm: 24, md: 12, lg: 12, xl: 8 };
  if (containerWidth > 1200 && colSpan.xl) return { span: colSpan.xl };
  if (containerWidth > 992 && colSpan.lg) return { span: colSpan.lg };
  if (containerWidth > 768 && colSpan.md) return { span: colSpan.md };
  if (containerWidth > 576 && colSpan.sm) return { span: colSpan.sm };
  return { span: 24 }; 
};

export default React.memo(JsonFormsRenderer);