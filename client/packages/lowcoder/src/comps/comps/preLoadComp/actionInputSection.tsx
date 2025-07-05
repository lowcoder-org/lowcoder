import React, { 
  useContext, 
  useState, 
  useCallback, 
  useRef, 
  useMemo 
} from "react";
import { default as Button } from "antd/es/button";
import { default as Input } from "antd/es/input";
import { default as Menu } from "antd/es/menu";
import { default as Space } from "antd/es/space";
import { default as Flex } from "antd/es/flex";
import type { InputRef } from 'antd';
import { default as DownOutlined } from "@ant-design/icons/DownOutlined";
import { BaseSection } from "lowcoder-design";
import { EditorContext } from "comps/editorState";
import { message } from "antd";
import { CustomDropdown } from "./styled";
import { generateComponentActionItems, getComponentCategories } from "./utils";
import { actionRegistry, getAllActionItems } from "./actionConfigs";

export function ActionInputSection() {
  const [actionValue, setActionValue] = useState<string>("");
  const [selectedActionKey, setSelectedActionKey] = useState<string | null>(null);
  const [placeholderText, setPlaceholderText] = useState<string>("");
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [showComponentDropdown, setShowComponentDropdown] = useState<boolean>(false);
  const [showEditorComponentsDropdown, setShowEditorComponentsDropdown] = useState<boolean>(false);
  const [selectedEditorComponent, setSelectedEditorComponent] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<InputRef>(null);
  const editorState = useContext(EditorContext);

  const categories = useMemo(() => {
    return getComponentCategories();
  }, []);

  const componentActionItems = useMemo(() => {
    return generateComponentActionItems(categories);
  }, [categories]);

  const allActionItems = useMemo(() => {
    return getAllActionItems();
  }, []);

  const editorComponents = useMemo(() => {
    if (!editorState) return [];
    
    const compInfos = editorState.uiCompInfoList();
    return compInfos.map(comp => ({
      label: comp.name,
      key: comp.name
    }));
  }, [editorState]);

  const currentAction = useMemo(() => {
    return selectedActionKey ? actionRegistry.get(selectedActionKey) : null;
  }, [selectedActionKey]);

  const handleActionSelection = useCallback((key: string) => {
    if (key.startsWith('category-')) {
      return;
    }
    
    setSelectedActionKey(key);
    setValidationError(null);
    
    const action = actionRegistry.get(key);
    if (!action) {
      console.warn(`Action not found: ${key}`);
      return;
    }

    setShowComponentDropdown(false);
    setShowEditorComponentsDropdown(false);
    setSelectedComponent(null);
    setSelectedEditorComponent(null);
    setActionValue("");

    if (action.requiresComponentSelection) {
      setShowComponentDropdown(true);
      setPlaceholderText("Select a component to add");
    } else if (action.requiresEditorComponentSelection) {
      setShowEditorComponentsDropdown(true);
      setPlaceholderText(`Select a component to ${action.label.toLowerCase()}`);
    } else if (action.requiresInput) {
      setPlaceholderText(action.inputPlaceholder || `Enter ${action.label.toLowerCase()} value`);
    } else {
      setPlaceholderText(`Execute ${action.label.toLowerCase()}`);
    }
  }, []);

  const handleComponentSelection = useCallback((key: string) => {
    if (key.startsWith('comp-')) {
      const compName = key.replace('comp-', '');
      setSelectedComponent(compName);
      setPlaceholderText(`Configure ${compName} component`);
    }
  }, []);

  const handleEditorComponentSelection = useCallback((key: string) => {
    setSelectedEditorComponent(key);
    if (currentAction) {
      setPlaceholderText(`${currentAction.label}`);
    }
  }, [currentAction]);

  const validateInput = useCallback((value: string): string | null => {
    if (!currentAction?.validation) return null;
    return currentAction.validation(value);
  }, [currentAction]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setActionValue(value);
    
    if (validationError) {
      setValidationError(null);
    }
  }, [validationError]);

  const handleApplyAction = useCallback(async () => {
    if (!editorState) {
      message.error('Editor state not available');
      return;
    }

    if (!selectedActionKey || !currentAction) {
      message.error('No action selected');
      return;
    }

    if (currentAction.requiresInput && currentAction.validation) {
      const error = validateInput(actionValue);
      if (error) {
        setValidationError(error);
        message.error(error);
        return;
      }
    }

    if (currentAction.requiresComponentSelection && !selectedComponent) {
      message.error('Please select a component');
      return;
    }

    if (currentAction.requiresEditorComponentSelection && !selectedEditorComponent) {
      message.error('Please select a component from the editor');
      return;
    }

    try {
      await currentAction.execute({
        actionKey: selectedActionKey,
        actionValue,
        selectedComponent,
        selectedEditorComponent,
        editorState
      });

      // Clear the form on success
      setActionValue("");
      setSelectedComponent(null);
      setSelectedActionKey(null);
      setShowComponentDropdown(false);
      setShowEditorComponentsDropdown(false);
      setSelectedEditorComponent(null);
      setPlaceholderText("");
      setValidationError(null);

    } catch (error) {
      console.error('Error executing action:', error);
      message.error('Failed to execute action. Please try again.');
    }
  }, [
    selectedActionKey, 
    actionValue, 
    selectedComponent, 
    selectedEditorComponent, 
    editorState, 
    currentAction, 
    validateInput
  ]);

  const isApplyDisabled = useMemo(() => {
    if (!selectedActionKey || !currentAction) return true;
    
    if (currentAction.requiresComponentSelection && !selectedComponent) return true;
    if (currentAction.requiresEditorComponentSelection && !selectedEditorComponent) return true;
    if (currentAction.requiresInput && !actionValue.trim()) return true;
    
    return false;
  }, [selectedActionKey, currentAction, selectedComponent, selectedEditorComponent, actionValue]);

  const shouldShowInput = useMemo(() => {
    if (!currentAction) return false;
    return currentAction.requiresInput && (
      !currentAction.requiresEditorComponentSelection || selectedEditorComponent
    );
  }, [currentAction, selectedEditorComponent]);

  return (
    <BaseSection
      name="Action Input"
      width={288}
      noMargin
      style={{
        borderTop: "1px solid #e1e3eb",
        backgroundColor: "#fff",
      }}
    >
      <div style={{ padding: "16px" }}>
        <Flex gap="small" vertical>
          <CustomDropdown
            placement="bottomLeft"
            overlayStyle={{ 
              maxHeight: '400px',
              overflow: 'auto',
              zIndex: 9999
            }}
            popupRender={() => (
              <Menu
                items={allActionItems}
                onClick={({ key }) => {
                  handleActionSelection(key);
                }}
              />
            )}
          >
            <Button size={"small"}>
              <Space>
                {currentAction ? currentAction.label : 'Select Action'} 
                <DownOutlined />
              </Space>
            </Button>
          </CustomDropdown>
          
          {showComponentDropdown && (
            <CustomDropdown
              overlayStyle={{ 
                maxHeight: '400px',
                overflow: 'auto',
                zIndex: 9999
              }}
              popupRender={() => (
                <Menu
                  items={componentActionItems}
                  onClick={({ key }) => {
                    handleComponentSelection(key);
                  }}
                />
              )}
            >
              <Button size={"small"}>
                <Space>
                  {selectedComponent ? selectedComponent : 'Select Component'} 
                  <DownOutlined />
                </Space>
              </Button>
            </CustomDropdown>
          )}
          
          {showEditorComponentsDropdown && (
            <CustomDropdown
              overlayStyle={{ 
                maxHeight: '400px',
                overflow: 'auto',
                zIndex: 9999
              }}
              popupRender={() => (
                <Menu
                  items={editorComponents}
                  onClick={({ key }) => {
                    handleEditorComponentSelection(key);
                  }}
                />
              )}
            >
              <Button size={"small"}>
                <Space>
                  {selectedEditorComponent ? selectedEditorComponent : 'Select Component'} 
                  <DownOutlined />
                </Space>
              </Button>
            </CustomDropdown>
          )}
          
          {shouldShowInput && (
            <Input
              ref={inputRef}
              value={actionValue}
              onChange={handleInputChange}
              placeholder={placeholderText}
              status={validationError ? 'error' : undefined}
            />
          )}
          
          {validationError && (
            <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '-8px' }}>
              {validationError}
            </div>
          )}
          
          <Button 
            type="primary"
            disabled={isApplyDisabled}
            onClick={handleApplyAction}
          >
            Apply Action
          </Button>
        </Flex>
      </div>
    </BaseSection>
  );
} 