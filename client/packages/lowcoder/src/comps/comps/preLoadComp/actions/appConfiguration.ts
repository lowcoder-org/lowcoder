import { message } from "antd";
import { ActionConfig, ActionExecuteParams } from "../types";
import ApplicationApi from "api/applicationApi";
import { executeQueryAction } from "lowcoder-core";
import { getPromiseAfterDispatch } from "util/promiseUtils";
import { runScript } from "../utils";
import { updateAppPermissionInfo } from "redux/reduxActions/applicationActions";
import { reduxStore } from "redux/store/store";
import { readableShortcut } from "util/keyUtils";

export const configureAppMetaAction: ActionConfig = {
  key: 'configure-app-meta',
  label: 'Configure app meta data',
  category: 'app-configuration',
  requiresInput: false,
  execute: async (params: ActionExecuteParams) => {
    const { editorState, actionPayload } = params;
    const { action_parameters: { title, description, category } } = actionPayload;
    const appSettingsComp = editorState.getAppSettingsComp();

    try {
      // TODO: Get config data from the user
      // let configData = {
      //   title: "Test Title",
      //   description: "Test Description",
      //   category: "Test Category"
      // };

      if (title && appSettingsComp?.children?.title) {
        appSettingsComp.children.title.dispatchChangeValueAction(title);
      }

      if (description && appSettingsComp?.children?.description) {
          appSettingsComp.children.description.dispatchChangeValueAction(description);
      }

      if (category && appSettingsComp?.children?.category) {
        appSettingsComp.children.category.dispatchChangeValueAction(category);
      }

      // Display error message if no valid configuration data is provided
      const updatedFields = [];
      if (title) updatedFields.push('title');
      if (description) updatedFields.push('description');
      if (category) updatedFields.push('category');

      !updatedFields.length && message.info('No valid configuration data provided');

    } catch (error) {
      console.error('Error updating app settings:', error);
      message.error('Failed to update app configuration');
    }
  }
}; 

export const publishAppAction: ActionConfig = {
  key: 'publish-app',
  label: 'Publish app',
  category: 'app-configuration',
  requiresInput: false,
  execute: async (params: ActionExecuteParams) => {
    const { editorState } = params;
    const applicationIdEditor = editorState.rootComp.preloadId;
    const applicationId = applicationIdEditor.replace('app-', '');

    try {
      if (!applicationId) {
        message.error('Application ID not found');
        return;
      }

      const response = await ApplicationApi.publishApplication({ applicationId });
      
      if (response.data.success) {
        message.success('Application published successfully');
        window.open(`/applications/${applicationId}/view`, '_blank');
      } else {
        message.error('Failed to publish application');
      }

    } catch (error) {
      console.error('Error publishing application:', error);
      message.error('Failed to publish application');
    }
  }
};

export const shareAppAction: ActionConfig = {
  key: 'share-app',
  label: 'Share app',
  category: 'app-configuration',
  requiresInput: false,
  execute: async (params: ActionExecuteParams) => {
    // TODO: Get app sharing from the user
    const appSharing = {
      public: true,
      publishMarketplace: false
    }

    const { editorState } = params;
    const applicationIdEditor = editorState.rootComp.preloadId;
    const applicationId = applicationIdEditor.replace('app-', '');

    if (!applicationId) {
      message.error('Application ID not found');
      return;
    }

    try {
      // Update Application Sharig Status
      // Update Redux state to reflect the public change in UI
      const publicResponse = await ApplicationApi.publicToAll(applicationId, appSharing.public);
  
      if (publicResponse.data.success) {
        reduxStore.dispatch(updateAppPermissionInfo({ publicToAll: appSharing.public }));
        message.success('Application is now public!');
        
        // Update Application Marketplace Sharing Status
        try {
          const marketplaceResponse = await ApplicationApi.publicToMarketplace(applicationId, appSharing.publishMarketplace);
          if (marketplaceResponse.data.success) {
            reduxStore.dispatch(updateAppPermissionInfo({ publicToMarketplace: appSharing.publishMarketplace }));
            message.success(`Application ${appSharing.publishMarketplace ? 'published to' : 'unpublished from'} marketplace successfully!`);
          } 
        } catch (marketplaceError) {
          console.error(`Error ${appSharing.publishMarketplace ? 'publishing to' : 'unpublishing from'} marketplace:`, marketplaceError);
          message.warning(`Application is public but ${appSharing.publishMarketplace ? 'publishing to' : 'unpublishing from'} marketplace failed`);
        }

      } else {
        message.error('Failed to make application public');
      }
    } catch (publicError) {
      console.error('Error making application public:', publicError);
      message.error('Failed to make application public');
    }
  }
};

export const testAllDatasourcesAction: ActionConfig = {
  key: 'test-all-datasources',
  label: 'Test all datasources',
  category: 'app-configuration',
  requiresInput: false,
  execute: async (params: ActionExecuteParams) => {
    const { editorState } = params;
    
    try {
      const allQueries = editorState.getQueriesComp().getView();
      
      if (!allQueries || !allQueries.length) {
        message.info('No queries found in the application');
        return;
      }

      console.log(`Found ${allQueries.length} queries to test`);
      
      const results = {
        total: allQueries.length,
        successful: 0,
        failed: 0,
        errors: [] as Array<{ queryName: string; error: string }>
      };

      message.loading(`Testing ${allQueries.length} queries...`, 0);

      for (let i = 0; i < allQueries.length; i++) {
        const query = allQueries[i];
        const queryName = query.children.name.getView();
        
        try {
          await getPromiseAfterDispatch(
            query.dispatch,
            executeQueryAction({
              // In some data queries, we need to pass args to the query
              // Currently, we don't have a way to pass args to the query
              // So we are passing an empty object
              args: {},
              afterExecFunc: () => {
                console.log(`Query ${queryName} executed successfully`);
              }
            }),
            { 
              notHandledError: `Failed to execute query: ${queryName}`
            }
          );
          
          results.successful++;
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Query ${queryName} failed:`, error);
          
          results.failed++;
          results.errors.push({
            queryName,
            error: errorMessage
          });
        }
        
        if (i < allQueries.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      message.destroy();
      
      if (results.failed === 0) {
        message.success(`All ${results.total} queries executed successfully!`);
      } else if (results.successful === 0) {
        message.error(`All ${results.total} queries failed. Check console for details.`);
      } else {
        message.warning(
          `Query test completed: ${results.successful} successful, ${results.failed} failed`
        );
      }
      
      console.group('Query Test Results');
      console.log(`Total queries: ${results.total}`);
      console.log(`Successful: ${results.successful}`);
      console.log(`Failed: ${results.failed}`);
      
      if (results.errors.length > 0) {
        console.group('Failed Queries:');
        results.errors.forEach(({ queryName, error }) => {
          console.error(`${queryName}: ${error}`);
        });
        console.groupEnd();
      }
      console.groupEnd();

    } catch (error) {
      message.destroy();
      console.error('Error during application testing:', error);
      message.error('Failed to test application. Check console for details.');
    }
  }
};

export const applyGlobalJSAction: ActionConfig = {
  key: 'apply-global-js',
  label: 'Apply global JS',
  category: 'app-configuration',
  requiresInput: true,
  inputPlaceholder: 'Enter JavaScript code to apply globally...',
  inputType: 'textarea',
  validation: (value: string) => {
    if (!value.trim()) {
      return 'JavaScript code is required';
    }
    try {
      new Function(value);
      return null;
    } catch (error) {
      return 'Invalid JavaScript syntax';
    }
  },
  execute: async (params: ActionExecuteParams) => {
    const { editorState, actionValue } = params;
    
    try {
      const defaultJS = `console.log('Please provide a valid JavaScript code');`.trim();

      const jsCode = actionValue.trim() || defaultJS;
      
      const preloadComp = editorState.rootComp.children.preload;
      if (!preloadComp) {
        message.error('Preload component not found');
        return;
      }

      const scriptComp = preloadComp.children.script;
      if (!scriptComp) {
        message.error('Script component not found');
        return;
      }

      scriptComp.dispatchChangeValueAction(jsCode);
      runScript(jsCode, false);
      
      message.success('JavaScript applied successfully!');
      
    } catch (error) {
      console.error('Error applying global JavaScript:', error);
      message.error('Failed to apply global JavaScript. Check console for details.');
    }
  }
};

export const applyCSSAction: ActionConfig = {
  key: 'apply-css',
  label: 'Apply CSS',
  category: 'app-configuration',
  requiresInput: true,
  requiresStyle: true,
  inputPlaceholder: 'Enter CSS code to apply...',
  inputType: 'textarea',
  validation: (value: string) => {
    if (!value.trim()) {
      return 'CSS code is required';
    }
    const css = value.trim();
    if (!css.includes('{') || !css.includes('}')) {
      return 'Invalid CSS syntax - missing braces';
    }
    return null;
  },
  execute: async (params: ActionExecuteParams) => {
    const { editorState, actionValue } = params;
    
    try {
      const defaultCSS = `
        body {
          font-family: Arial, sans-serif;
        }
      `.trim();

      const cssCode = actionValue.trim() || defaultCSS;
      
      const preloadComp = editorState.rootComp.children.preload;
      if (!preloadComp) {
        message.error('Preload component not found');
        return;
      }

      const cssComp = preloadComp.children.css;
      if (!cssComp) {
        message.error('CSS component not found');
        return;
      }

      cssComp.dispatchChangeValueAction(cssCode);
      
      await cssComp.run('css', cssCode);
      
      message.success('CSS applied successfully!');
      
    } catch (error) {
      console.error('Error applying CSS:', error);
      message.error('Failed to apply CSS. Check console for details.');
    }
  }
};

export const applyThemeAction: ActionConfig = {
  key: 'apply-theme',
  label: 'Apply theme',
  category: 'app-configuration',
  isTheme: true,
  execute: async (params: ActionExecuteParams) => {
    const { editorState, actionPayload } = params;
    const { action_parameters: { theme: selectedTheme } } = actionPayload;

    try {
      if (!selectedTheme) {
        message.error('No theme selected');
        return;
      }

      const appSettingsComp = editorState.getAppSettingsComp();
      if (!appSettingsComp) {
        message.error('App settings component not found');
        return;
      }

      const themeIdComp = appSettingsComp.children.themeId;
      if (!themeIdComp) {
        message.error('Theme ID component not found');
        return;
      }

      const DEFAULT_THEMEID = "default";
      const themeToApply = selectedTheme === DEFAULT_THEMEID ? DEFAULT_THEMEID : selectedTheme;

      themeIdComp.dispatchChangeValueAction(themeToApply);
      
      message.success(`Theme applied successfully: ${selectedTheme}`);
      
    } catch (error) {
      console.error('Error applying theme:', error);
      message.error('Failed to apply theme. Check console for details.');
    }
  }
};

export const setCanvasSettingsAction: ActionConfig = {
  key: 'set-canvas-settings',
  label: 'Set canvas settings',
  category: 'app-configuration',
  requiresInput: false,
  execute: async (params: ActionExecuteParams) => {
    const { editorState, actionPayload } = params;
    const { action_parameters: canvasSettings } = actionPayload;

    try {
      const appSettingsComp = editorState.getAppSettingsComp();
      if (!appSettingsComp) {
        message.error('App settings component not found');
        return;
      }

      const {
        maxWidth,
        gridColumns,
        gridRowHeight,
        gridRowCount,
        gridPaddingX,
        gridPaddingY,
        gridBg,
        gridBgImage,
        gridBgImageRepeat,
        gridBgImageSize,
        gridBgImagePosition,
        gridBgImageOrigin,
      } = appSettingsComp.children;

      if (maxWidth && canvasSettings.maxWidth) {
        maxWidth?.children?.dropdown?.dispatchChangeValueAction(canvasSettings.maxWidth);
      }

      if (gridColumns && canvasSettings.gridColumns) {
        gridColumns.dispatchChangeValueAction(canvasSettings.gridColumns);
      }

      if (gridRowHeight && canvasSettings.gridRowHeight) {
        gridRowHeight.dispatchChangeValueAction(canvasSettings.gridRowHeight);
      }

      if (gridRowCount && canvasSettings.gridRowCount) {
        gridRowCount.dispatchChangeValueAction(canvasSettings.gridRowCount);
      }

      if (gridPaddingX && canvasSettings.gridPaddingX) {
        gridPaddingX.dispatchChangeValueAction(canvasSettings.gridPaddingX);
      }

      if (gridPaddingY && canvasSettings.gridPaddingY) {
        gridPaddingY.dispatchChangeValueAction(canvasSettings.gridPaddingY);
      }

      if (gridBg && canvasSettings.gridBg) {
        gridBg.dispatchChangeValueAction(canvasSettings.gridBg);
      }

      if (gridBgImage && canvasSettings.gridBgImage) {
        gridBgImage.dispatchChangeValueAction(canvasSettings.gridBgImage);
      }

      if (gridBgImageRepeat && canvasSettings.gridBgImageRepeat) {
        gridBgImageRepeat.dispatchChangeValueAction(canvasSettings.gridBgImageRepeat);
      }

      if (gridBgImageSize && canvasSettings.gridBgImageSize) {
        gridBgImageSize.dispatchChangeValueAction(canvasSettings.gridBgImageSize);
      }

      if (gridBgImagePosition && canvasSettings.gridBgImagePosition) {
        gridBgImagePosition.dispatchChangeValueAction(canvasSettings.gridBgImagePosition);
      }

      if (gridBgImageOrigin && canvasSettings.gridBgImageOrigin) {
        gridBgImageOrigin.dispatchChangeValueAction(canvasSettings.gridBgImageOrigin);
      }

      message.success('Canvas settings applied successfully!');
      
    } catch (error) {
      console.error('Error applying canvas settings:', error);
      message.error('Failed to apply canvas settings. Check console for details.');
    }
  }
};

export const setCustomShortcutsAction: ActionConfig = {
  key: 'set-custom-shortcuts',
  label: 'Set custom shortcuts',
  category: 'app-configuration',
  isCustomShortcuts: true,
  requiresInput: true,
  inputPlaceholder: 'Press keys for shortcut',
  inputType: 'text',
  validation: (value: string) => {
    if (!value.trim()) {
      return 'Shortcut is required';
    }
    return null;
  },
  execute: async (params: ActionExecuteParams) => {
    const { editorState, actionValue, selectedCustomShortcutAction } = params;
    try {
      if (!selectedCustomShortcutAction) {
        message.error('No custom shortcut action selected');
        return;
      }

      const appSettingsComp = editorState.getAppSettingsComp();
      if (!appSettingsComp) {
        message.error('App settings component not found');
        return;
      }
      const customShortcutsComp = appSettingsComp.children.customShortcuts;
      if (!customShortcutsComp) {
        message.error('Custom shortcuts component not found');
        return;
      }
      
      const newShortcutItem = {
        shortcut: actionValue.trim(),
        action: {
          compType: selectedCustomShortcutAction,
          comp: {}
        }
      };
      
      customShortcutsComp.dispatch(customShortcutsComp.pushAction(newShortcutItem));
      const readableShortcutText = readableShortcut(actionValue.trim());
      message.success(`Custom shortcut added successfully: ${readableShortcutText} -> ${selectedCustomShortcutAction}`);
    } catch (error) {
      console.error('Error setting custom shortcut:', error);
      message.error('Failed to set custom shortcut. Check console for details.');
    }
  }
};
