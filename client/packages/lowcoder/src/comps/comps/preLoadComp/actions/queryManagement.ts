import { reportActionError } from "../actionFeedback";
import { ActionConfig, ActionExecuteParams } from "../types";

function getQueryName(params: ActionExecuteParams): string {
  const { actionPayload, actionValue, selectedEditorComponent } = params;
  const actionParameters = actionPayload?.action_parameters || {};
  return (
    actionPayload?.query_name ||
    actionPayload?.queryName ||
    actionParameters.query_name ||
    actionParameters.queryName ||
    selectedEditorComponent ||
    actionValue ||
    ""
  );
}

export const deleteQueryAction: ActionConfig = {
  key: "delete-query",
  label: "Delete query",
  category: "query-management",
  requiresInput: false,
  execute: async (params: ActionExecuteParams) => {
    const { editorState } = params;
    const queryName = getQueryName(params);

    if (!editorState) {
      reportActionError(params, "Editor state is required");
      return;
    }

    if (!queryName) {
      reportActionError(params, "Query name is required");
      return;
    }

    const queriesComp = editorState.getQueriesComp?.();
    const queryExists = queriesComp
      ?.getView?.()
      ?.some((query: any) => query?.children?.name?.getView?.() === queryName);

    if (!queryExists) {
      reportActionError(params, `Query "${queryName}" not found`);
      return;
    }

    queriesComp.delete(queryName);
  },
};
