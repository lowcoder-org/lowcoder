import { PanelStatus } from "pages/common/header";
import { DisabledCollisionStatus as DisabledCollisionStatus } from "pages/editor/LeftLayersContent";
import { EditorModeStatus } from "pages/common/header";
import log from "loglevel";
import { JSONValue } from "util/jsonTypes";

export type PanelStyle = {
  bottom: {
    h: number;
  };
  codeEditor: {
    w: number;
    h: number;
  };
};

export const DefaultPanelStatus: PanelStatus = {
  left: true,
  bottom: true,
  right: true,
};

const DefaultPanelStyle: PanelStyle = {
  bottom: {
    h: 285,
  },
  codeEditor: {
    w: 744,
    h: 468,
  },
};

export function savePanelStatus(panelStatus: PanelStatus) {
  localStorage.setItem("editor_panel_status", JSON.stringify(panelStatus));
}

export function getPanelStatus(): PanelStatus {
  const str = localStorage.getItem("editor_panel_status");
  if (!str) {
    return DefaultPanelStatus;
  }
  return { ...DefaultPanelStatus, ...JSON.parse(str) };
}

export function saveEditorModeStatus(editorModeStatus: EditorModeStatus) {
  localStorage.setItem("editor_mode_status", editorModeStatus);
}
//ADDED BY FRED TO SAVE enabledCollision
export function saveCollisionStatus(
  collisionStatus: boolean
) {
  localStorage.setItem("disableCollision", String(collisionStatus));
}

// export const DefaultCollisionStatus: DisabledCollisionStatus = "true";
export function getCollisionStatus(): boolean {
  const str = localStorage.getItem("disableCollision");
  if (str === 'true') {
    return true;
  }
  return false;
}

export function removeCollisionStatus() {
  localStorage.removeItem("disableCollision");
}

export const DefaultEditorModeStatus: EditorModeStatus = "both";
export function getEditorModeStatus(): EditorModeStatus {
  const str = localStorage.getItem("editor_mode_status");
  if (!str) {
    return DefaultEditorModeStatus;
  }
  return str as EditorModeStatus;
}

export function savePanelStyle(panelStyle: PanelStyle) {
  localStorage.setItem("editor_panel_style", JSON.stringify(panelStyle));
}

export function getPanelStyle(): PanelStyle {
  const str = localStorage.getItem("editor_panel_style");
  if (!str) {
    return DefaultPanelStyle;
  }
  return { ...DefaultPanelStyle, ...JSON.parse(str) };
}

export function saveMainComp(compJson: JSONValue) {
  localStorage.setItem("main_comp", JSON.stringify(compJson));
}

export function getMainCompValue(): object {
  const compStr = localStorage.getItem("main_comp");
  try {
    if (!compStr) {
      return {};
    }
    return JSON.parse(compStr);
  } catch (e) {
    log.error("get local comp fail", e);
    return {};
  }
}

export type HomeLayoutType = "list" | "card";

export function saveHomeLayout(layout: HomeLayoutType) {
  localStorage.setItem("home_layout", layout);
}

export function getHomeLayout(): HomeLayoutType {
  const layout = localStorage.getItem("home_layout");
  return layout === "list" || layout === "card" ? layout : "card";
}

export function getLocalThemeId() {
  return localStorage.getItem("theme_id");
}

export function setLocalThemeId(themeId: string) {
  return localStorage.setItem("theme_id", themeId);
}
