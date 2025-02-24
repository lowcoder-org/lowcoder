import { withTheme } from '@rjsf/core';
import type { RJSFValidationError, ErrorListProps, UISchemaSubmitButtonOptions } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import { default as Button } from "antd/es/button";
import { BoolControl } from "comps/controls/boolControl";
import { jsonObjectExposingStateControl } from "comps/controls/codeStateControl";
import { styleControl } from "comps/controls/styleControl";
import { AnimationStyle, AnimationStyleType, JsonSchemaFormStyle, type JsonSchemaFormStyleType } from "comps/controls/styleControlConstants";
import { depsConfig, NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import { withMethodExposing } from "comps/generators/withMethodExposing";
import type { ValueFromOption } from "lowcoder-design";
import { i18nObjs, trans } from "i18n";
import type { JSONSchema7 } from "json-schema";
import styled from "styled-components";
import { toBoolean, toNumber, toString } from "util/convertUtils";
import { Section, sectionNames, ScrollBar } from "lowcoder-design";
import { jsonObjectControl } from "../../controls/codeControl";
import { eventHandlerControl, submitEvent } from "../../controls/eventHandlerControl";
import { UICompBuilder, withDefault } from "../../generators";
import DateWidget from "./dateWidget";
import ErrorBoundary from "./errorBoundary";
import { Theme } from "@rjsf/antd";
import { hiddenPropertyView, showDataLoadingIndicatorsPropertyView } from "comps/utils/propertyUtils";
import { AutoHeightControl } from "../../controls/autoHeightControl";
import { useContext, useEffect, useRef, useState, createContext } from "react";
import { EditorContext } from "comps/editorState";
import ObjectFieldTemplate from './ObjectFieldTemplate';
import ArrayFieldTemplate from './ArrayFieldTemplate';
import { Select } from 'antd';
import Title from 'antd/es/typography/Title';


Theme.widgets.DateWidget = DateWidget(false);
Theme.widgets.DateTimeWidget = DateWidget(true);
const Form = withTheme(Theme);

const EventOptions = [submitEvent] as const;

const ContainerWidthContext = createContext(0);

const useContainerWidth = () => {
  return useContext(ContainerWidthContext);
};

const Container = styled.div<{
  $style: JsonSchemaFormStyleType;
  $animationStyle: AnimationStyleType;
}>`
  ${(props) => props.$animationStyle}
  background: ${(props) => props.$style.background};
  border: 1px solid ${(props) => props.$style.border};
  padding: 15px;
  width: 100%;
  height: 100%;
  overflow: auto;
  border-radius: ${(props) => props.$style.radius};

  label[for="root-title"] {
    font-size: 18px;
  }

  .ant-row {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }

  #root-description {
    font-size: 12px;
    display: inline-block;
    line-height: 2;
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

  .ant-form-item {
    margin-bottom: 8px;
  }

  .help-block {
    margin-bottom: 0px;
  }
`;

function convertData(schema?: JSONSchema7, data?: any) {
  if (!schema) {
    return data;
  }
  // fix required invalidation problem
  if (schema.type !== "object" && (data === undefined || data === null || data === "")) {
    return undefined;
  }
  switch (schema.type) {
    case "string":
      return toString(data);
    case "number":
      return toNumber(data);
    case "integer":
      return Math.trunc(toNumber(data));
    case "boolean":
      return toBoolean(data);
    case "null":
      return null;
    case "object": {
      const properties = schema.properties;
      if (!properties) {
        return data;
      }
      let newData: Record<string, unknown> = {};
      Object.entries(properties).forEach(([key, definition]) => {
        const value = data ? data[key] : undefined;
        newData[key] = typeof definition === "object" ? convertData(definition, value) : value;
      });
      return newData;
    }
    default:
      return data;
  }
}

// TODO: translate more other errors
// refer to ajv-i18n, https://github.com/ajv-validator/ajv-i18n/blob/master/messages/index.js
// https://github.com/ajv-validator/ajv/tree/6a671057ea6aae690b5967ee26a0ddf8452c6297#Validation-keywords
// JSON schema refer to https://json-schema.org/understanding-json-schema/reference/
function getErrorMessage(error: RJSFValidationError): string {
  switch (error.name) {
    case "required":
      return trans("jsonSchemaForm.required");
    case "maximum":
      return trans("jsonSchemaForm.maximum", { value: error.params.limit });
    case "minimum":
      return trans("jsonSchemaForm.minimum", { value: error.params.limit });
    case "exclusiveMaximum":
      return trans("jsonSchemaForm.exclusiveMaximum", { value: error.params.limit });
    case "exclusiveMinimum":
      return trans("jsonSchemaForm.exclusiveMinimum", { value: error.params.limit });
    case "multipleOf":
      return trans("jsonSchemaForm.multipleOf", { value: error.params.multipleOf });
    case "minLength":
      return trans("jsonSchemaForm.minLength", { value: error.params.limit });
    case "maxLength":
      return trans("jsonSchemaForm.maxLength", { value: error.params.limit });
    case "pattern":
      return trans("jsonSchemaForm.pattern", { value: error.params.pattern });
    case "format":
      return trans("jsonSchemaForm.format", { value: error.params.format });
  }
  return "";
}

function transformErrors(errors: RJSFValidationError[]): RJSFValidationError[] {
  return errors.map((error) => {
    const message = getErrorMessage(error);
    if (message) {
      // Error message displayed below the comp (will not be displayed when "ui:help" is set in the UI schema)
      error.message = message;
      // Errors displayed in the error list, not displayed when empty
      error.stack = "";
    }
    return error;
  });
}

function ErrorList(props: ErrorListProps) {
  const errors = props.errors.filter((error) => error.stack);
  // Avoid showing blank space when there are no errors
  if (errors.length === 0) {
    return <></>;
  }
  return (
    <div style={{ color: "red" }}>
      <ul>
        {errors.map((error) => (
          <li key={error.stack}>{error.stack}</li>
        ))}
      </ul>
    </div>
  );
}

const SearchableSelectWidget = (props : any) => {
  const { options, value, required, disabled, readonly, autofocus, onChange } = props;
  const { enumOptions } = options;

  return (
    <Select
      showSearch
      optionFilterProp="children"
      value={value || undefined}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      onChange={(val) => onChange(val)}
      style={{ width: '100%' }}
      placeholder={props.placeholder}
    >
      {enumOptions.map((option : any) => (
        <Select.Option key={option.value} value={option.value}>
          {option.label}
        </Select.Option>
      ))}
    </Select>
  );
};

function onSubmit(props: {
  resetAfterSubmit: boolean;
  data: { reset: () => void };
  onEvent: (eventName: ValueFromOption<typeof EventOptions>) => Promise<unknown>;
}): Promise<void> {
  return props.onEvent("submit").then(() => {
    if (props.resetAfterSubmit) {
      props.data.reset();
    }
  });
}


let FormBasicComp = (function () {
  const childrenMap = {
    resetAfterSubmit: BoolControl,
    schema: jsonObjectControl(i18nObjs.jsonForm.defaultSchema),
    showVerticalScrollbar: withDefault(BoolControl, false),
    uiSchema: jsonObjectControl(i18nObjs.jsonForm.defaultUiSchema),
    autoHeight: AutoHeightControl,
    data: jsonObjectExposingStateControl("data", i18nObjs.jsonForm.defaultFormData),
    onEvent: eventHandlerControl(EventOptions),
    style: styleControl(JsonSchemaFormStyle , 'style'),
    animationStyle: styleControl(AnimationStyle , 'animationStyle'),
  };

  return new UICompBuilder(childrenMap, (props) => {
    // rjsf 4.20 supports ui:submitButtonOptions, but if the button is customized, it will not take effect. Here we implement it ourselves
    const buttonOptions = props?.uiSchema?.[
      "ui:submitButtonOptions"
    ] as UISchemaSubmitButtonOptions;

    const schema = props.schema;

    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    // Monitor the container's width
    useEffect(() => {
      const updateWidth = () => {
        if (containerRef.current) {
          setContainerWidth(containerRef.current.offsetWidth);
        }
      };
  
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

    return (
      <ContainerWidthContext.Provider value={containerWidth}>
        <Container $style={props.style} $animationStyle={props.animationStyle} ref={containerRef}>
          <ScrollBar
              style={{
                height: props.autoHeight ? "auto" : "100%",
                margin: "0px",
                padding: "0px",
              }}
              overflow={"hidden"}
              hideScrollbar={!props.showVerticalScrollbar}
            >
          <ErrorBoundary>
            <Title level={2} style={{ marginBottom: '24px' }}>
              {schema.title as string | number}
            </Title>
            <Form
              validator={validator}
              schema={props.schema}
              uiSchema={props.uiSchema}
              formData={convertData(props.schema, props.data.value)}
              onSubmit={() => onSubmit(props)}
              onChange={(e) => props.data.onChange(e.formData)}
              transformErrors={(errors) => transformErrors(errors)}
              templates={{
                ObjectFieldTemplate: ObjectFieldTemplate,
                ArrayFieldTemplate: ArrayFieldTemplate,
                // FieldTemplate: LayoutFieldTemplate,
              }}
              widgets={{ searchableSelect: SearchableSelectWidget }}
              // ErrorList={ErrorList}
              children={
                <Button
                  hidden={buttonOptions?.norender}
                  disabled={buttonOptions?.props?.disabled}
                  className={buttonOptions?.props?.className}
                  type="primary"
                  htmlType="submit"
                  style={{ float: "right" }}
                >
                  {buttonOptions?.submitText ?? trans("event.submit")}
                </Button>
              }
            />
          </ErrorBoundary>
          </ScrollBar>
        </Container>
      </ContainerWidthContext.Provider>

    );
  })
    .setPropertyViewFn((children) => {
      return (
        <>
          {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && (
            <Section name={sectionNames.basic}>
              
              {children.schema.propertyView({
                key: trans("jsonSchemaForm.jsonSchema"),
                label: (
                  <>
                    {trans("jsonSchemaForm.jsonSchema") + " ("}
                    <a
                      href={"http://json-schema.org/learn/getting-started-step-by-step"}
                      target={"_blank"}
                      rel="noreferrer"
                    >
                      Docs 1
                    </a>
                    {", "}
                    <a
                      href={"https://jsonforms.io/examples/basic"}
                      target={"_blank"}
                      rel="noreferrer"
                    >
                      Docs 2
                    </a>
                    {")"}
                  </>
                ),
                tooltip: (
                  <>
                    {trans("jsonSchemaForm.schemaTooltip") + " "}
                    <a
                      href={"http://json-schema.org/learn/getting-started-step-by-step"}
                      target={"_blank"}
                      rel="noreferrer"
                    >
                      JSON Schema
                    </a>
                  </>
                ),
              })}
              {children.uiSchema.propertyView({
                key: trans("jsonSchemaForm.uiSchema"),
                label: (
                  <>
                    {trans("jsonSchemaForm.uiSchema") + " ("}
                    <a
                      href={"https://jsonforms.io/docs/uischema"}
                      target={"_blank"}
                      rel="noreferrer"
                    >
                      Docs 1
                    </a>
                    {", "}
                    <a
                      href={"https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/uiSchema"}
                      target={"_blank"}
                      rel="noreferrer"
                    >
                      Docs 2
                    </a>
                    {")"}
                  </> 
                ),
                tooltip: (
                  <>
                    {trans("jsonSchemaForm.schemaTooltip") + " "}
                    <a
                      href={
                        "https://jsonforms.io/docs/uischema"
                      }
                      target={"_blank"}
                      rel="noreferrer"
                    >
                      UI Schema
                    </a>
                  </>
                ),
              })}
              {children.data.propertyView({
                key: trans("jsonSchemaForm.defaultData"),
                label: trans("jsonSchemaForm.defaultData"),
              })}
            </Section>
          )}

          {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && (
            <Section name={sectionNames.interaction}>
              {children.onEvent.getPropertyView()}
              {hiddenPropertyView(children)}
              {children.resetAfterSubmit.propertyView({
                label: trans("jsonSchemaForm.resetAfterSubmit"),
              })}
              {showDataLoadingIndicatorsPropertyView(children)}
            </Section>
          )}
          {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && (
            <>
             <Section name={sectionNames.layout}>
              {children.autoHeight.getPropertyView()}
              {!children.autoHeight.getView() && (
                  children.showVerticalScrollbar.propertyView({
                    label: trans("prop.showVerticalScrollbar"),
                  })
                )}
              </Section>
              <Section name={sectionNames.style}>
                {children.style.getPropertyView()}
              </Section>
              <Section name={sectionNames.animationStyle} hasTooltip={true}>
                {children.animationStyle.getPropertyView()}
              </Section>
            </>
          )}

        </>
      );
    })
    .build();
})();

FormBasicComp = class extends FormBasicComp {
  override autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }
};


let FormTmpComp = withExposingConfigs(FormBasicComp, [
  depsConfig({
    name: "data",
    desc: trans("jsonSchemaForm.dataDesc"),
    depKeys: ["schema", "data"],
    func: (input) => {
      return convertData(input.schema, input.data);
    },
  }),
  NameConfigHidden,
]);

FormTmpComp = withMethodExposing(FormTmpComp, [
  {
    method: {
      name: "submit",
      description: trans("export.submitDesc"),
      params: [],
    },
    // FIXME: currently, it cannot be verified when submitted through the method, fix it later
    execute: (comp, values) =>
      onSubmit({
        resetAfterSubmit: comp.children.resetAfterSubmit.getView(),
        data: comp.children.data.getView(),
        onEvent: comp.children.onEvent.getView(),
      }),
  },
]);
export const JsonSchemaFormComp = FormTmpComp;
export { FormTmpComp, useContainerWidth };
