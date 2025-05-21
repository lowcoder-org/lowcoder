import React, { useCallback, useContext, useRef, useEffect } from "react";
import { EditorContext, EditorState } from "comps/editorState";
import { GridCompOperator } from "comps/utils/gridCompOperator";
import { ExternalEditorContext } from "util/context/ExternalEditorContext";
import { EditorHistory } from "util/editoryHistory";
import { executeQueryAction } from "lowcoder-core";
import {
  GlobalShortcutsWrapper,
  modKeyPressed,
  selectCompModifierKeyPressed,
  ShortcutsWrapper,
} from "util/keyUtils";
import { PanelStatus, TogglePanel } from "pages/common/header";
import { clickCompNameClass } from "base/codeEditor/clickCompName";
import { getShortcutAction } from "pages/common/shortcutConfigs";
import { preview } from "constants/routesURL";
import { useApplicationId } from "util/hooks";
import { useUnmount } from "react-use";

type Props = {
  children: React.ReactNode;
  disabled?: boolean;
};

type GlobalProps = Props & {
  togglePanel: TogglePanel;
  panelStatus: PanelStatus;
  toggleShortcutList: () => void;
};

// global hotkeys
function handleGlobalKeyDown(
  e: KeyboardEvent,
  editorState: EditorState,
  editorHistory: EditorHistory | undefined,
  togglePanel: TogglePanel,
  toggleShortcutList: () => void,
  applicationId: string
) {
  switch (getShortcutAction(e, "global")) {
    case "toggleLeftPanel":
      togglePanel("left");
      break;
    case "toggleBottomPanel":
      togglePanel("bottom");
      break;
    case "toggleRightPanel":
      togglePanel("right");
      break;
    case "toggleAllPanels":
      togglePanel();
      break;
    case "preview":
      preview(applicationId);
      break;
    case "undo":
      editorHistory?.undo();
      break;
    case "redo":
      editorHistory?.redo();
      break;
    case "deleteComps":
      GridCompOperator.deleteComp(editorState, editorState.selectedComps());
      return;
    case "toggleShortcutList":
      toggleShortcutList();
      return;
    case "executeQuery": {
      const query = editorState.selectedQueryComp();
      query?.dispatch(
        executeQueryAction({
          afterExecFunc: () => editorState.setShowResultCompName(query.children.name.getView()),
        })
      );
      break;
    }
    default:
      return;
  }
  // avoid conflicts with the browser
  e.stopPropagation();
  e.preventDefault();
}

function setGlobalState(editorState: EditorState, e?: KeyboardEvent | MouseEvent) {
  editorState.setForceShowGrid(e ? modKeyPressed(e) : false);
  editorState.setDisableInteract(e ? selectCompModifierKeyPressed(e) : false);
}

function handleMouseDown(e: MouseEvent, editorState: EditorState, showLeftPanel: () => void) {
  if (!modKeyPressed(e)) {
    return;
  }
  const target = (e.target || e.srcElement) as HTMLElement | null;
  if (!target) {
    return;
  }
  if (target.className !== clickCompNameClass) {
    const parent = target.parentElement;
    if (!parent || parent.className !== clickCompNameClass) {
      return;
    }
  }
  showLeftPanel();
  const compName = target.innerText;
  if (editorState.getUICompByName(compName)) {
    editorState.setSelectedCompNames(new Set([compName]));
    return;
  }
  const bottomResComp = editorState.getBottomResComp(compName);
  if (bottomResComp) {
    editorState.setSelectedBottomRes(compName, bottomResComp.type());
    return;
  }
}

export const EditorGlobalHotKeys = React.memo((props: GlobalProps) => {
  const editorState = useContext(EditorContext);
  const { history: editorHistory } = useContext(ExternalEditorContext);
  const { togglePanel, panelStatus, toggleShortcutList } = props;
  const applicationId = useApplicationId();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!mountedRef.current) return;
      setGlobalState(editorState, e);
      handleGlobalKeyDown(
        e,
        editorState,
        editorHistory,
        togglePanel,
        toggleShortcutList,
        applicationId
      );
      editorState.getAppSettingsComp().children.customShortcuts.handleKeyEvent(e);
    },
    [editorState, editorHistory, togglePanel, toggleShortcutList, applicationId]
  );

  const setGlobalStateCb = useCallback(
    (e: KeyboardEvent | MouseEvent) => {
      if (!mountedRef.current) return;
      setGlobalState(editorState, e);
    },
    [editorState]
  );

  const onMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!mountedRef.current) return;
      setGlobalState(editorState, e);
      handleMouseDown(e, editorState, () => !panelStatus.left && togglePanel("left"));
    },
    [editorState, panelStatus, togglePanel]
  );

  useUnmount(() => {
    mountedRef.current = false;
  });

  return (
    <GlobalShortcutsWrapper
      disabled={props.disabled}
      onKeyDownCapture={onKeyDown}
      onKeyUpCapture={setGlobalStateCb}
      // fix the problem when a user press keys without focus
      onMouseMoveCapture={setGlobalStateCb}
      onMouseDownCapture={onMouseDown}
    >
      {props.children}
    </GlobalShortcutsWrapper>
  );
})

// local hotkeys
function handleEditorKeyDown(e: React.KeyboardEvent, editorState: EditorState) {
  switch (getShortcutAction(e, "editor")) {
    case "selectAllComps":
      editorState.setSelectedCompNames(
        new Set(
          Object.values(editorState.getUIComp().getTopCompItems()).map((item) =>
            item.children.name.getView()
          )
        )
      );
      e.preventDefault();
      e.stopPropagation();
      return;
    case "copyComps":
      GridCompOperator.copyComp(editorState, editorState.selectedComps());
      return;
    case "pasteComps":
      GridCompOperator.pasteComp(editorState);
      return;
    case "cutComps":
      GridCompOperator.cutComp(editorState, editorState.selectedComps());
      return;
    case "deselectComps":
      editorState.setSelectedCompNames(new Set());
      return;
  }
}

export const EditorHotKeys = React.memo((props: Props) => {
  const editorState = useContext(EditorContext);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!mountedRef.current) return;
      handleEditorKeyDown(e, editorState);
    },
    [editorState]
  );

  useUnmount(() => {
    mountedRef.current = false;
  });

  return (
    <ShortcutsWrapper
      disabled={props.disabled}
      onKeyDown={onKeyDown}
      style={{ width: "100%", height: "100%" }}
    >
      {props.children}
    </ShortcutsWrapper>
  );
})

export const CustomShortcutWrapper = React.memo((props: { children: React.ReactNode }) => {
  const editorState = useContext(EditorContext);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleCustomShortcut = useCallback(
    (e: KeyboardEvent) => {
      if (!mountedRef.current) return;
      editorState.getAppSettingsComp().children.customShortcuts.handleKeyEvent(e);
    },
    [editorState]
  );

  useUnmount(() => {
    mountedRef.current = false;
  });

  return (
    <GlobalShortcutsWrapper onKeyDownCapture={handleCustomShortcut}>
      {props.children}
    </GlobalShortcutsWrapper>
  );
})
