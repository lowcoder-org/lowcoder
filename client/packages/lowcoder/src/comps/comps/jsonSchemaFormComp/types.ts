import type { JsonSchema } from "@jsonforms/core";

export interface FieldUiSchema {
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

export interface Category {
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

export interface Control {
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

export interface HorizontalLayout {
  type: "HorizontalLayout";
  elements: Control[];
}

export type Layout = HorizontalLayout;

export interface Categorization {
  type: "Categorization";
  elements: Category[];
  options?: {
    variant?: "tabs" | "stepper";
    showNavButtons?: boolean;
  };
}

export interface ValidationState {
  [key: string]: {
    errors: string[];
    touched: boolean;
  } | any;
}

export interface JsonFormsRendererProps {
  schema: JsonSchema;
  data: any;
  onChange: (data: any) => void;
  style?: any;
  showVerticalScrollbar?: boolean;
  showValidation?: boolean;
  autoHeight?: boolean;
  resetAfterSubmit?: boolean;
  uiSchema?: JsonFormsUiSchema;
  onSubmit?: () => void;
  validationState?: ValidationState; 
  onValidationChange?: (validationState: ValidationState) => void;
} 