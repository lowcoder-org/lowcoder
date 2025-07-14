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
import { BaseSection, Dropdown } from "lowcoder-design";
import { EditorContext } from "comps/editorState";
import { message } from "antd";
import { CustomDropdown } from "./styled";
import { 
  generateComponentActionItems, 
  getComponentCategories, 
  getEditorComponentInfo, 
  getLayoutItemsOrder 
} from "./utils";
import { actionRegistry, getAllActionItems } from "./actionConfigs";
import { getThemeList } from "@lowcoder-ee/redux/selectors/commonSettingSelectors";
import { useSelector } from "react-redux";
import { ActionOptions } from "comps/controls/actionSelector/actionSelectorControl";
import { eventToShortcut, readableShortcut } from "util/keyUtils";

export function ActionInputSection() {
  const [actionValue, setActionValue] = useState<string>("");
  const [selectedActionKey, setSelectedActionKey] = useState<string | null>(null);
  const [placeholderText, setPlaceholderText] = useState<string>("");
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [showComponentDropdown, setShowComponentDropdown] = useState<boolean>(false);
  const [isNestedComponent, setIsNestedComponent] = useState<boolean>(false);
  const [selectedNestComponent, setSelectedNestComponent] = useState<string | null>(null);
  const [showEditorComponentsDropdown, setShowEditorComponentsDropdown] = useState<boolean>(false);
  const [showStylingInput, setShowStylingInput] = useState<boolean>(false);
  const [selectedEditorComponent, setSelectedEditorComponent] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showDynamicLayoutDropdown, setShowDynamicLayoutDropdown] = useState<boolean>(false);
  const [selectedDynamicLayoutIndex, setSelectedDynamicLayoutIndex] = useState<string | null>(null);
  const [showThemeDropdown, setShowThemeDropdown] = useState<boolean>(false);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [showCustomShortcutsActionDropdown, setShowCustomShortcutsActionDropdown] = useState<boolean>(false);
  const [selectedCustomShortcutAction, setSelectedCustomShortcutAction] = useState<string | null>(null);
  const inputRef = useRef<InputRef>(null);
  const editorState = useContext(EditorContext);
  const themeList = useSelector(getThemeList) || [];

  const THEME_OPTIONS = useMemo(() => {
    return themeList.map((theme) => ({
      label: theme.name,
      value: theme.id + "",
    }));
  }, [themeList]);

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

  const simpleLayoutItems = useMemo(() => {
    if(!editorComponents) return [];

    const editorComponentInfo = getEditorComponentInfo(editorState);
    if(!editorComponentInfo) return [];
  
    const currentLayout = editorComponentInfo.currentLayout;
    const items = editorComponentInfo.items;
    
    return Object.keys(currentLayout).map((key) => {
      const item = items ? items[key] : null;
      const componentName = item ? (item as any).children.name.getView() : key;
      return {
        label: componentName,
        key: componentName
      };
    });
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
    setShowStylingInput(false);
    setSelectedComponent(null);
    setSelectedEditorComponent(null);
    setIsNestedComponent(false);
    setSelectedNestComponent(null);
    setShowDynamicLayoutDropdown(false);
    setActionValue("");
    setSelectedDynamicLayoutIndex(null);
    setShowThemeDropdown(false);
    setSelectedTheme(null);
    setShowCustomShortcutsActionDropdown(false);
    setSelectedCustomShortcutAction(null);
    
    if (action.requiresComponentSelection) {
      setShowComponentDropdown(true);
      setPlaceholderText("Select a component to add");
    } 
    if (action.requiresEditorComponentSelection) {
      setShowEditorComponentsDropdown(true);
      setPlaceholderText(`Select a component to ${action.label.toLowerCase()}`);
    }  
    if (action.requiresInput) {
      setPlaceholderText(action.inputPlaceholder || `Enter ${action.label.toLowerCase()} value`);
    } else {
      setPlaceholderText(`Execute ${action.label.toLowerCase()}`);
    }
    if (action.requiresStyle) {
      setShowStylingInput(true);
      setPlaceholderText(`Select a component to style`);
    }
    if (action.isNested) {
      setIsNestedComponent(true);
    }
    if(action.dynamicLayout) {
      setShowDynamicLayoutDropdown(true);
    }
    if(action.isTheme) {
      setShowThemeDropdown(true);
    }
    if(action.isCustomShortcuts) {
      setShowCustomShortcutsActionDropdown(true);
    }
  }, []);

  const handleComponentSelection = useCallback((key: string) => {
    if (key.startsWith('comp-')) {
      const compName = key.replace('comp-', '');
      isNestedComponent ? setSelectedNestComponent(compName) : setSelectedComponent(compName);
      setPlaceholderText(`Configure ${compName} component`);
    }
  }, [isNestedComponent]);

  const handleEditorComponentSelection = useCallback((key: string) => {
    setSelectedEditorComponent(key);
    setPlaceholderText(`${currentAction?.label}`);
  }, [currentAction]);


  const validateInput = useCallback((value: string): string | null => {
    if (!currentAction?.validation) return null;
    return currentAction.validation(value);
  }, [currentAction]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
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

    if(currentAction.isNested && !selectedNestComponent) {
      message.error('Please select a component to nest');
      return;
    }

    if(currentAction.isTheme && !selectedTheme) {
      message.error('Please select a theme');
      return;
    }

    if(currentAction.isCustomShortcuts && !selectedCustomShortcutAction) {
      message.error('Please select a custom shortcut action');
      return;
    }

    try {
      await currentAction.execute({
        actionKey: selectedActionKey,
        actionValue,
        selectedComponent,
        selectedEditorComponent,
        selectedNestComponent,
        selectedDynamicLayoutIndex,
        selectedTheme,
        selectedCustomShortcutAction,
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
      setIsNestedComponent(false);
      setSelectedNestComponent(null);
      setShowDynamicLayoutDropdown(false);
      setSelectedDynamicLayoutIndex(null);
      setShowThemeDropdown(false);
      setSelectedTheme(null);
      setShowCustomShortcutsActionDropdown(false);
      setSelectedCustomShortcutAction(null);
    } catch (error) {
      console.error('Error executing action:', error);
      message.error('Failed to execute action. Please try again.');
    }
  }, [
    selectedActionKey, 
    actionValue, 
    selectedComponent, 
    selectedEditorComponent, 
    selectedNestComponent,
    selectedDynamicLayoutIndex,
    selectedTheme,
    selectedCustomShortcutAction,
    editorState, 
    currentAction, 
    validateInput
  ]);

  const isApplyDisabled = useMemo(() => {
    if (!selectedActionKey || !currentAction) return true;
    
    if (currentAction.requiresComponentSelection && !selectedComponent) return true;
    if (currentAction.requiresEditorComponentSelection && !selectedEditorComponent) return true;
    if (currentAction.requiresInput && !actionValue.trim()) return true;
    if (currentAction.requiresStyle && !selectedEditorComponent) return true;
    if (currentAction.isTheme && !selectedTheme) return true;
    if (currentAction.isCustomShortcuts && !selectedCustomShortcutAction) return true;
    
    return false;
  }, [
    selectedActionKey, 
    currentAction, 
    selectedComponent, 
    selectedEditorComponent, 
    actionValue, 
    selectedCustomShortcutAction, 
    selectedTheme, 
    selectedNestComponent
  ]);

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
          
          {(showComponentDropdown || isNestedComponent) && (
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
                  {
                    selectedComponent 
                    ? selectedComponent 
                    : selectedNestComponent 
                    ? selectedNestComponent 
                    : 'New Component'
                  }
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
                  onClick={({key}) => {
                    handleEditorComponentSelection(key);
                  }}
                />
              )}
            >
              <Button size={"small"}>
                <Space>
                  {selectedEditorComponent ? selectedEditorComponent : 'Editor Component'} 
                  <DownOutlined />
                </Space>
              </Button>
            </CustomDropdown>
          )}

          {showDynamicLayoutDropdown && (
            <CustomDropdown
              overlayStyle={{ 
              maxHeight: '400px',
              overflow: 'auto',
              zIndex: 9999
            }}
            popupRender={() => (
              <Menu
                items={simpleLayoutItems}
                onClick={({key}) => {
                  handleEditorComponentSelection(key);
                }}
              />
            )}
          >
            <Button size={"small"}>
              <Space>
                {selectedEditorComponent ? selectedEditorComponent : 'Layout'} 
                <DownOutlined />
              </Space>
            </Button>
          </CustomDropdown>
          )}

          {showDynamicLayoutDropdown && (
            <Dropdown
              options={getLayoutItemsOrder(simpleLayoutItems)}
              onChange={(value) => {
                setSelectedDynamicLayoutIndex(value);
              }}
            >
              <Button size={"small"}>
                <Space>
                  {selectedEditorComponent ? selectedEditorComponent : 'Layout'} 
                  <DownOutlined />
                </Space>
              </Button>
            </Dropdown>
          )}

          {showThemeDropdown && (
            <Dropdown
              options={THEME_OPTIONS}
              onChange={(value) => {
                setSelectedTheme(value);
              }}
            >
              <Button size={"small"}>
                <Space>
                  {selectedTheme ? selectedTheme : 'Select Theme'} 
                </Space>
              </Button>
            </Dropdown>
          )}

          {showCustomShortcutsActionDropdown && (
            <Dropdown
              options={ActionOptions}
              onChange={(value) => {
                setSelectedCustomShortcutAction(value);
              }}
            >
              <Button size={"small"}>
                <Space>
                  {selectedCustomShortcutAction ? selectedCustomShortcutAction : 'Select Action'} 
                </Space>
              </Button>
            </Dropdown>
          )}

          {shouldShowInput && (
            currentAction?.isCustomShortcuts ? (
              <Input
                ref={inputRef}
                value={readableShortcut(actionValue)}
                placeholder={placeholderText}
                status={validationError ? 'error' : undefined}
                onKeyDownCapture={(e) => {
                  setActionValue(eventToShortcut(e));
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onChange={() => {}}
                readOnly
              />
            ) : (
              showStylingInput ? (
                <Input.TextArea
                  ref={inputRef}
                  value={actionValue}
                  onChange={handleInputChange}
                  placeholder={placeholderText}
                  status={validationError ? 'error' : undefined}
                  autoSize={{ minRows: 1 }}
                />
              ) : (
                <Input
                  ref={inputRef}
                  value={actionValue}
                  onChange={handleInputChange}
                  placeholder={placeholderText}
                  status={validationError ? 'error' : undefined}
                />
              )
            )
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