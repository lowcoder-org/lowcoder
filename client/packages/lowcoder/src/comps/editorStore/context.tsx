import React, { createContext, type PropsWithChildren, type ReactNode, useContext } from "react";
import { useStore } from "zustand";
import type { EditorStoreApi, EditorStoreState } from "./types";

const EditorStoreContext = createContext<EditorStoreApi | undefined>(undefined);

type EditorStoreProviderProps = PropsWithChildren<{
  store: EditorStoreApi;
}>;

export function EditorStoreProvider({ children, store }: EditorStoreProviderProps) {
  return <EditorStoreContext.Provider value={store}>{children}</EditorStoreContext.Provider>;
}

function useEditorStoreApi(): EditorStoreApi {
  const store = useContext(EditorStoreContext);
  if (!store) {
    throw new Error("useEditorStore must be used inside EditorStoreProvider");
  }
  return store;
}

export function useEditorStore<T>(selector: (state: EditorStoreState) => T): T {
  return useStore(useEditorStoreApi(), selector);
}

/**
 * Render-prop escape hatch for reading the store reactively from class components
 * (e.g. Comp subclasses), which can't call the useEditorStore hook directly.
 */
export function EditorStoreSelector<T>({
  selector,
  children,
}: {
  selector: (state: EditorStoreState) => T;
  children: (value: T) => ReactNode;
}) {
  return <>{children(useEditorStore(selector))}</>;
}
