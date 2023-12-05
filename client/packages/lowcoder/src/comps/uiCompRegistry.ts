import { FunctionComponent, ReactNode } from "react";
import { withExposingConfigs } from "comps/generators/withExposing";
import { NameGenerator } from "./utils/nameGenerator";
import { JSONValue } from "util/jsonTypes";
import { EditorState } from "./editorState";
import { trans } from "i18n";

export type ExposingMultiCompConstructor = ReturnType<
  typeof withExposingConfigs
>;
// Required when the container generates default child comps
type CompDefaultDataFunction = (
  compName: string,
  nameGenerator: NameGenerator,
  editorState?: EditorState
) => JSONValue;

export interface UICompLayoutInfo {
  w: number;
  h: number;
  static?: boolean;
  delayCollision?: boolean;
}

export const uiCompCategoryNames = {
  dashboards: trans("uiCompCategory.dashboards"),
  layout: trans("uiCompCategory.layout"),
  forms: trans("uiCompCategory.forms"),
  collaboration: trans("uiCompCategory.collaboration"),
  projectmanagement: trans("uiCompCategory.projectmanagement"),
  scheduling: trans("uiCompCategory.scheduling"),
  documents: trans("uiCompCategory.documents"),
  itemHandling: trans("uiCompCategory.itemHandling"),
  multimedia: trans("uiCompCategory.multimedia"),
  integration: trans("uiCompCategory.integration"),
};

export type UICompCategory = keyof typeof uiCompCategoryNames;

export interface UICompManifest {
  name: string;
  enName: string;
  description?: ReactNode;
  categories: readonly UICompCategory[]; // Set to empty to hide from insertion panel
  keywords: string;
  icon: FunctionComponent<React.SVGProps<SVGSVGElement>>;
  comp: ExposingMultiCompConstructor;
  layoutInfo?: UICompLayoutInfo;
  withoutLoading?: boolean;
  defaultDataFn?: CompDefaultDataFunction;
}

export type UICompType =
  | "input"
  | "module"
  | "moduleContainer"
  | "textArea"
  | "chart"
  | "meeting"
  | "videocomponent"
  | "sharingcomponent"
  | "controlButton"
  | "imageEditor"
  | "calendar"
  | "password"
  | "richTextEditor"
  | "numberInput"
  | "slider"
  | "rangeSlider"
  | "rating"
  | "switch"
  | "select"
  | "multiSelect"
  | "cascader"
  | "checkbox"
  | "radio"
  | "segmentedControl"
  | "file"
  | "date"
  | "dateRange"
  | "time"
  | "timeRange"
  | "button"
  | "link"
  | "scanner"
  | "dropdown"
  | "text"
  | "table"
  | "image"
  | "progress"
  | "progressCircle"
  | "chart"
  | "mermaid" //Added By Falk Wolsky
  | "fileViewer"
  | "divider"
  | "qrCode"
  | "form"
  | "jsonSchemaForm"
  | "container"
  | "tabbedContainer"
  | "modal"
  | "listView"
  | "grid"
  | "navigation"
  | "iframe"
  | "custom"
  | "jsonExplorer"
  | "jsonEditor"
  | "tree"
  | "treeSelect"
  | "audio"
  | "video"
  | "drawer"
  | "carousel"
  | "toggleButton"
  | "imageEditor"
  | "npmPlugin"
  | "collapsibleContainer"
  | "calendar"
  | "signature"
  | "jsonLottie" //Added By Aqib Mirza
  | "timeline" //Added By Mousheng
  | "comment" //Added By Mousheng
  | "mention" //Added By Mousheng
  | "autocomplete" //Added By Mousheng
  | "responsiveLayout";

export const uiCompRegistry = {} as Record<UICompType | string, UICompManifest>;

export function registerComp(
  compType: UICompType | string,
  manifest: UICompManifest
) {
  uiCompRegistry[compType] = {
    ...manifest,
    keywords: [manifest.name, manifest.enName, manifest.keywords]
      .join(",")
      .replace(/[\s]+/g, "")
      .toLowerCase(),
  };
}
