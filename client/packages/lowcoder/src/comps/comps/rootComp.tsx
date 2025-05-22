// import "comps/comps/layout/navLayout";
// import "comps/comps/layout/mobileTabLayout";

import { CompAction, CompActionTypes } from "lowcoder-core";
import { EditorContext, EditorState } from "comps/editorState";
import { simpleMultiComp } from "comps/generators";
import { HookListComp } from "comps/hooks/hookListComp";
import { QueryListComp } from "comps/queries/queryComp";
import { NameAndExposingInfo } from "comps/utils/exposingTypes";
import { handlePromiseAndDispatch } from "util/promiseUtils";
import { HTMLAttributes, Suspense, lazy, useContext, useEffect, useMemo, useRef, useState } from "react";
import { setFieldsNoTypeCheck } from "util/objectUtils";
import { AppSettingsComp } from "./appSettingsComp";
import { PreloadComp } from "./preLoadComp";
import { TemporaryStateListComp } from "./temporaryStateComp";
import { TransformerListComp } from "./transformerListComp";
import UIComp from "./uiComp";
import { ThemeContext } from "comps/utils/themeContext";
import { ModuleLayoutCompName } from "constants/compConstants";
import { defaultTheme as localDefaultTheme } from "constants/themeConstants";
import { ModuleLoading } from "components/ModuleLoading";
import EditorSkeletonView from "pages/editor/editorSkeletonView";
import { getGlobalSettings } from "comps/utils/globalSettings";
import { getCurrentTheme } from "comps/utils/themeUtil";
import { DataChangeResponderListComp } from "./dataChangeResponderComp";
import { FolderListComp } from "./folderListComp";
import {
  PropertySectionContext,
  PropertySectionContextType,
  PropertySectionState,
} from "lowcoder-design";
import RefTreeComp from "./refTreeComp";
import { ExternalEditorContext } from "util/context/ExternalEditorContext";
import { useUserViewMode } from "util/hooks";
import React from "react";
import { isEqual } from "lodash";
import {LoadingBarHideTrigger} from "@lowcoder-ee/util/hideLoading";
import clsx from "clsx";
import { useUnmount } from "react-use";

const EditorView = lazy(
  () => import("pages/editor/editorView"),
);

interface RootViewProps extends HTMLAttributes<HTMLDivElement> {
  comp: InstanceType<typeof RootComp>;
  isModuleRoot: boolean;
}

const childrenMap = {
  ui: UIComp,
  queries: QueryListComp,
  tempStates: TemporaryStateListComp,
  transformers: TransformerListComp,
  dataResponders: DataChangeResponderListComp,
  folders: FolderListComp,
  refTree: RefTreeComp,
  hooks: HookListComp,
  settings: AppSettingsComp,
  preload: PreloadComp,
};

const RootView = React.memo((props: RootViewProps) => {
  const previewTheme = useContext(ThemeContext);
  const { comp, isModuleRoot, ...divProps } = props;
  const [editorState, setEditorState] = useState<EditorState>();
  const [propertySectionState, setPropertySectionState] = useState<PropertySectionState>({});
  const { readOnly } = useContext(ExternalEditorContext);
  const isUserViewMode = useUserViewMode();
  const mountedRef = useRef(true);
  const editorStateRef = useRef<EditorState>();
  const prevCompRef = useRef(comp);

  const appThemeId = comp.children.settings.getView().themeId;
  const { orgCommonSettings } = getGlobalSettings();
  const themeList = orgCommonSettings?.themeList || [];
  const selectedTheme = getCurrentTheme(themeList, appThemeId);

  const theme =
    previewTheme?.previewTheme ||
    selectedTheme?.theme ||
    localDefaultTheme;
  
  const themeId = selectedTheme ? selectedTheme.id : (
    previewTheme ? "preview-theme" : 'default-theme-id'
  ); 

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mountedRef.current) return;

    const newEditorState = new EditorState(comp, (changeEditorStateFn) => {
      if (mountedRef.current) {
        setEditorState((oldState) => {
          return (oldState ? changeEditorStateFn(oldState) : undefined)
        });
      }
    });
    editorStateRef.current = newEditorState;
    setEditorState(newEditorState);

    return () => {
      if (editorStateRef.current) {
        editorStateRef.current = undefined;
      }
    };
  }, []);

  useEffect(() => {
    if (!mountedRef.current || !editorState) return;

    if (prevCompRef.current !== comp) {
      editorState.setComp(() => comp);
      prevCompRef.current = comp;
    }
  }, [comp, editorState]);

  useUnmount(() => {
    setEditorState(undefined);
    setPropertySectionState({});
    if (editorStateRef.current) {
      editorStateRef.current = undefined;
    }
  });

  const themeContextValue = useMemo(
    () => ({
      theme,
      themeId,
    }),
    [theme, themeId]
  );

  const propertySectionContextValue = useMemo<PropertySectionContextType>(() => {
    const compName = Object.keys(editorState?.selectedComps() || {})[0];
    return {
      compName,
      state: propertySectionState,
      toggle: (compName: string, sectionName: string) => {
        if (!mountedRef.current) return;
        
        setPropertySectionState((oldState) => {
          const nextSectionState: PropertySectionState = { ...oldState };
          const compState = nextSectionState[compName] || {};
          compState[sectionName] = compState[sectionName] === false;
          nextSectionState[compName] = compState;
          return nextSectionState;
        });
      },
    };
  }, [editorState, propertySectionState]);

  if (!editorState && !isUserViewMode && readOnly) {
    return <ModuleLoading />;
  }

  const SuspenseFallback = isModuleRoot ? <ModuleLoading /> : <EditorSkeletonView />;

  if (!editorState) {
    return SuspenseFallback;
  }

  return (
    <div {...divProps}
          className={clsx(
            divProps.id, 
          )} 
       style={{height: '100%'}}>
      <PropertySectionContext.Provider value={propertySectionContextValue}>
        <ThemeContext.Provider value={themeContextValue}>
          <EditorContext.Provider value={editorState}>
            {Object.keys(comp.children.queries.children).map((key) => (
              <div key={key}>{comp.children.queries.children[key].getView()}</div>
            ))}
            <Suspense fallback={!readOnly || isUserViewMode ? SuspenseFallback : null}>
              <LoadingBarHideTrigger />
              <EditorView uiComp={comp.children.ui} preloadComp={comp.children.preload} />
            </Suspense>
          </EditorContext.Provider>
        </ThemeContext.Provider>
      </PropertySectionContext.Provider>
    </div>
  );
}, (prevProps, nextProps) => {
  return isEqual(prevProps, nextProps);
});

/**
 * Root Comp
 */
const RootCompBase = simpleMultiComp(childrenMap);

export class RootComp extends RootCompBase {
  preloaded = false;
  preloadId = "";
  isModuleRoot = false;
  private editorStateRef?: EditorState;

  getView() {
    if (!this.preloaded) {
      return null;
    }
    return <RootView id={this.preloadId} comp={this} isModuleRoot={this.isModuleRoot} />;
  }

  clearPreload() {
    this.children.preload.clear();
    this.editorStateRef = undefined;
  }

  setModuleRoot(moduleRoot: boolean) {
    this.isModuleRoot = moduleRoot;
  }

  async preload(id: string) {
    if (this.preloaded) {
      return this;
    }
    try {
      await this.children.preload.run(id);
      return setFieldsNoTypeCheck(this, { preloaded: true, preloadId: id });
    } catch (error) {
      this.clearPreload();
      throw error;
    }
  }

  private findInternalComp(name: string) {
    if (name === ModuleLayoutCompName) {
      return this.children.ui.getModuleLayoutComp();
    }
  }

  /**
   * find comp by name
   */
  private findCompByName(name: string) {
    // internal comp
    if (name.startsWith("@")) {
      return this.findInternalComp(name);
    }

    // ui comp
    const compMap = this.children.ui.getAllCompItems();
    const uiComp = Object.values(compMap).find((item) => item.children.name.getView() === name);
    if (uiComp) {
      return uiComp.children.comp;
    }

    // hooks comp
    const hooksCompMap = this.children.hooks.getAllCompItems();
    const hooksComp = Object.values(hooksCompMap).find(
      (item) => item.children.name.getView() === name
    );
    if (hooksComp) {
      return hooksComp.children.comp;
    }

    // query comp
    for (let path of Object.keys(this.children.queries.children)) {
      const queryComp = this.children.queries.children[path];
      if (queryComp.children.name.getView() === name) {
        return queryComp.children.comp;
      }
    }

    // temp state comp
    const allTempStateComp = this.children.tempStates.getView();
    for (let comp of Object.values(allTempStateComp)) {
      if (comp.children.name.getView() === name) {
        return comp;
      }
    }

    // transformer comp
    const allTransformerStateComp = this.children.transformers.getView();
    for (let comp of Object.values(allTransformerStateComp)) {
      if (comp.children.name.getView() === name) {
        return comp;
      }
    }

    // module input
    const moduleLayout = this.children.ui.getModuleLayoutComp();
    if (moduleLayout) {
      for (let input of moduleLayout.getInputs()) {
        const { name: inputName } = input.getView();
        if (name === inputName) {
          return input;
        }
      }
    }

    if (name.startsWith("/")) {
      const compName = name.substring(1) as keyof typeof childrenMap;
      return this.children[compName];
    }
  }

  override reduce(action: CompAction): this {
    if (action.type === CompActionTypes.ROUTE_BY_NAME) {
      const comp = this.findCompByName(action.name);
      if (comp) {
        handlePromiseAndDispatch(action, comp.dispatch, action.action);
      } else {
        // warn, comp not found
      }
      return this;
    }
    return super.reduce(action);
  }

  nameAndExposingInfo(): NameAndExposingInfo {
    return {
      ...this.children.ui.nameAndExposingInfo(),
      ...this.children.queries.nameAndExposingInfo(),
      ...this.children.hooks.nameAndExposingInfo(),
      ...this.children.tempStates.nameAndExposingInfo(),
      ...this.children.transformers.nameAndExposingInfo(),
      ...this.children.dataResponders.nameAndExposingInfo(),
    };
  }
}
