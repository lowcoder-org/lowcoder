export interface ExternalPreload {
  css?: string;
  libs?: string[];
  script?: string;
  runJavaScriptInHost?: boolean;
}

export interface RunAndClearable<T> {
  run(id: string, externalPreload?: T): Promise<any>;
  clear(): Promise<any>;
}

export enum TabKey {
  JavaScript = "js",
  CSS = "css",
  GLOBAL_CSS = "global_css",
}

export interface ComponentActionState {
  actionValue: string;
  selectedActionKey: string | null;
  placeholderText: string;
  selectedComponent: string | null;
  showComponentDropdown: boolean;
  showEditorComponentsDropdown: boolean;
  selectedEditorComponent: string | null;
}

export interface ActionConfig {
  key: string;
  label: string;
  category?: string;
  requiresComponentSelection?: boolean;
  requiresEditorComponentSelection?: boolean;
  requiresInput?: boolean;
  requiresStyle?: boolean;
  isTheme?: boolean;
  isCustomShortcuts?: boolean;
  isNested?: boolean;
  dynamicLayout?: boolean;
  inputPlaceholder?: string;
  inputType?: 'text' | 'number' | 'textarea' | 'json';
  validation?: (value: string) => string | null; 
  execute: (params: ActionExecuteParams) => Promise<void>;
}

export interface ActionExecuteParams {
  actionKey: string;
  actionValue: string;
  actionPayload?: any;
  selectedComponent: string | null;
  selectedEditorComponent: string | null;
  selectedNestComponent: string | null;
  selectedDynamicLayoutIndex: string | null;
  selectedTheme: string | null;
  selectedCustomShortcutAction: string | null;
  editorState: any;
}

export interface ActionCategory {
  key: string;
  label: string;
  actions: ActionConfig[];
}

export interface ActionRegistry {
  categories: ActionCategory[];
  actions: Map<string, ActionConfig>;
} 