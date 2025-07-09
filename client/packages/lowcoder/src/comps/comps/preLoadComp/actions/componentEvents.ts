/**
 * Event Names:
 * - click: Triggered when component is clicked
 * - change: Triggered when component value changes
 * - focus: Triggered when component gains focus
 * - blur: Triggered when component loses focus
 * - submit: Triggered when form is submitted
 * - refresh: Triggered when component is refreshed
 * 
 * Action Types:
 * - executeQuery: Run a data query
 * - message: Show a notification message
 * - setTempState: Set a temporary state value
 * - runScript: Execute JavaScript code
 * - executeComp: Control another component
 * - goToURL: Navigate to a URL
 * - copyToClipboard: Copy data to clipboard
 * - download: Download data as file
 * - triggerModuleEvent: Trigger a module event
 * - openAppPage: Navigate to another app page
 */

import { message } from "antd";
import { ActionConfig, ActionExecuteParams } from "../types";
import { getEditorComponentInfo } from "../utils";
import { pushAction } from "comps/generators/list";

export const addEventHandlerAction: ActionConfig = {
  key: 'add-event-handler',
  label: 'Add event handler',
  category: 'events',
  requiresEditorComponentSelection: true,
  requiresInput: true,
  inputPlaceholder: 'Format: eventName: actionType (e.g., "click: message", "change: executeQuery", "focus: setTempState")',
  inputType: 'text',
  validation: (value: string) => {
    const [eventName, actionType] = value.split(':').map(s => s.trim());
    if (!eventName || !actionType) {
      return 'Please provide both event name and action type separated by colon (e.g., "click: message")';
    }
    
    const validActionTypes = [
      'executeQuery', 'message', 'setTempState', 'runScript', 
      'executeComp', 'goToURL', 'copyToClipboard', 'download', 
      'triggerModuleEvent', 'openAppPage'
    ];
    
    if (!validActionTypes.includes(actionType)) {
      return `Invalid action type. Valid types: ${validActionTypes.join(', ')}`;
    }
    
    return null;
  },
  execute: async (params: ActionExecuteParams) => {
    const { selectedEditorComponent, actionValue, editorState } = params;

    const componentInfo = getEditorComponentInfo(editorState, selectedEditorComponent as string);
      
    if (!componentInfo) {
      message.error(`Component "${selectedEditorComponent}" not found`);
      return;
    }

    const { allAppComponents } = componentInfo;
    const targetComponent = allAppComponents.find(comp => comp.name === selectedEditorComponent);

    if (!targetComponent?.comp?.children?.onEvent) {
      message.error(`Component "${selectedEditorComponent}" does not support event handlers`);
      return;
    }

    // ----- To be Removed after n8n integration ------ //
    const [eventName, actionType] = actionValue.split(':').map(s => s.trim());
    
    if (!eventName || !actionType) {
      message.error('Please provide event name and action type in format: "eventName: actionType"');
      return;
    }
    const eventConfigs = targetComponent.comp.children.onEvent.getEventNames?.() || [];
    const availableEvents = eventConfigs.map((config: any) => config.value);
    
    if (!availableEvents.includes(eventName)) {
      const availableEventsList = availableEvents.length > 0 ? availableEvents.join(', ') : 'none';
      message.error(`Event "${eventName}" is not available for this component. Available events: ${availableEventsList}`);
      return;
    }
    // ----- To be Removed after n8n integration ------ //

    
    const eventHandler = {
      name: eventName,
      handler: {
        compType: actionType,
        comp: getActionConfig(actionType, editorState)
      }
    };

    try {
      targetComponent.comp.children.onEvent.dispatch(pushAction(eventHandler));
      message.success(`Event handler for "${eventName}" with action "${actionType}" added successfully!`);
    } catch (error) {
      console.error('Error adding event handler:', error);
      message.error('Failed to add event handler. Please try again.');
    }
  }
};

// A Hardcoded function to get action configuration based on action type
// This will be removed after n8n integration
function getActionConfig(actionType: string, editorState: any) {
  switch (actionType) {
    case 'executeQuery':
      const queryVariables = editorState
        ?.selectedOrFirstQueryComp()
        ?.children.variables.toJsonValue();
      
      return {
        queryName: editorState
          ?.selectedOrFirstQueryComp()
          ?.children.name.getView(),
        queryVariables: queryVariables?.map((variable: any) => ({...variable, value: ''})),
      };
    
    case 'message':
      return {
        text: "Event triggered!",
        level: "info",
        duration: 3000
      };
    
    case 'setTempState':
      return {
        state: "tempState",
        value: "{{eventData}}"
      };
    
    case 'runScript':
      return {
        script: "console.log('Event triggered:', eventData);"
      };
    
    case 'executeComp':
      return {
        compName: "",
        methodName: "",
        params: []
      };
    
    case 'goToURL':
      return {
        url: "https://example.com",
        openInNewTab: false
      };
    
    case 'copyToClipboard':
      return {
        value: "{{eventData}}"
      };
    
    case 'download':
      return {
        data: "{{eventData}}",
        fileName: "download.txt",
        fileType: "text/plain"
      };
    
    case 'triggerModuleEvent':
      return {
        name: "moduleEvent"
      };
    
    case 'openAppPage':
      return {
        appId: "",
        queryParams: [],
        hashParams: []
      };
    
    default:
      return {};
  }
} 