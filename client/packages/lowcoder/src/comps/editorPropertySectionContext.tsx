import {
  PropertySectionContext,
  type PropertySectionContextType,
  type PropertySectionState,
} from "lowcoder-design";
import React, { type PropsWithChildren, useCallback, useMemo, useState } from "react";
import type { EditorState } from "./editorState";
import { useEditorStore } from "./editorStore";

type EditorPropertySectionProviderProps = PropsWithChildren<{
  editorState: EditorState;
}>;

export function EditorPropertySectionProvider({
  children,
  editorState,
}: EditorPropertySectionProviderProps) {
  const selectedCompNames = useEditorStore((state) => state.selectedCompNames);
  const [propertySectionState, setPropertySectionState] = useState<PropertySectionState>({});

  const compName = useMemo(
    () => Object.keys(editorState.selectedComps(selectedCompNames))[0] ?? "",
    [editorState, selectedCompNames]
  );

  const toggle = useCallback((targetCompName: string, sectionName: string) => {
    setPropertySectionState((oldState) => {
      const oldCompState = oldState[targetCompName] ?? {};
      return {
        ...oldState,
        [targetCompName]: {
          ...oldCompState,
          [sectionName]: oldCompState[sectionName] === false,
        },
      };
    });
  }, []);

  const contextValue = useMemo<PropertySectionContextType>(
    () => ({
      compName,
      state: propertySectionState,
      toggle,
    }),
    [compName, propertySectionState, toggle]
  );

  return (
    <PropertySectionContext.Provider value={contextValue}>
      {children}
    </PropertySectionContext.Provider>
  );
}
