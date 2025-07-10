import { message } from "antd";
import { ActionConfig, ActionExecuteParams } from "../types";

export const configureAppMetaAction: ActionConfig = {
  key: 'configure-app-meta',
  label: 'Configure app meta data',
  category: 'app-configuration',
  requiresInput: false,
  execute: async (params: ActionExecuteParams) => {
    const { editorState } = params;
    const appSettingsComp = editorState.getAppSettingsComp();
    
    try {
      // TODO: Get config data from the user
      let configData = {
        title: "Test Title",
        description: "Test Description",
        category: "Test Category"
      };

      if (configData.title && appSettingsComp?.children?.title) {
        appSettingsComp.children.title.dispatchChangeValueAction(configData.title);
      }

      if (configData.description && appSettingsComp?.children?.description) {
          appSettingsComp.children.description.dispatchChangeValueAction(configData.description);
      }

      if (configData.category && appSettingsComp?.children?.category) {
        appSettingsComp.children.category.dispatchChangeValueAction(configData.category);
      }

      // Display error message if no valid configuration data is provided
      const updatedFields = [];
      if (configData.title) updatedFields.push('title');
      if (configData.description) updatedFields.push('description');
      if (configData.category) updatedFields.push('category');

      !updatedFields.length && message.info('No valid configuration data provided');

    } catch (error) {
      console.error('Error updating app settings:', error);
      message.error('Failed to update app configuration');
    }
  }
}; 