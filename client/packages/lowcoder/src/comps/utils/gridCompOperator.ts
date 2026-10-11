import { isContainer } from "comps/comps/containerBase";
import { SimpleContainerComp } from "comps/comps/containerBase/simpleContainerComp";
import { GridItemComp } from "comps/comps/gridItemComp";
import { remoteComp } from "comps/comps/remoteComp/remoteComp";
import { EditorState } from "comps/editorState";
import { NameGenerator } from "comps/utils";
import { trans } from "i18n";
import {
  calcPasteBaseXY,
  DEFAULT_POSITION_PARAMS,
  Layout,
  LayoutItem,
  moveToZero,
  PositionParams,
  switchLayoutWH,
} from "layout";
import _ from "lodash";
import {
  ActionExtraInfo,
  Comp,
  CustomAction,
  deferAction,
  deleteCompAction,
  multiChangeAction,
  replaceCompAction,
  wrapActionExtraInfo,
} from "lowcoder-core";
import { CustomModal, messageInstance } from "lowcoder-design";
import { pasteKey, undoKey } from "util/keyUtils";
import { genRandomKey } from "./idGenerator";
import { getLatestVersion, getRemoteCompType, parseCompType } from "./remote";
import { APPLICATION_VIEW_URL } from "@lowcoder-ee/constants/routesURL";

const CLIPBOARD_TYPE = "lowcoder-components";
const CLIPBOARD_VERSION = 1;

export interface ClipboardGridItem {
  compType: string;
  comp: any;
  name: string;
  layout: LayoutItem;
  isContainer: boolean;
}

export interface LowcoderClipboardPayload {
  type: typeof CLIPBOARD_TYPE;
  version: number;
  timestamp: number;
  gridItems: ClipboardGridItem[];
  hookItems: ClipboardHookItem[];
  sourcePositionParams: PositionParams;
}

export interface ClipboardHookItem {
  compType: string;
  comp: any;
  name: string;
  fullValue: any;
}

async function writeToClipboard(payload: LowcoderClipboardPayload): Promise<boolean> {
  try {
    const json = JSON.stringify(payload);
    await navigator.clipboard.writeText(json);
    return true;
  } catch {
    return false;
  }
}

export async function readFromClipboard(): Promise<LowcoderClipboardPayload | null> {
  try {
    const text = await navigator.clipboard.readText();
    if (!text) return null;
    const parsed = JSON.parse(text);
    if (parsed?.type !== CLIPBOARD_TYPE || !parsed?.version) return null;
    return parsed as LowcoderClipboardPayload;
  } catch {
    return null;
  }
}

function buildEmptyPayload(): LowcoderClipboardPayload {
  return {
    type: CLIPBOARD_TYPE,
    version: CLIPBOARD_VERSION,
    timestamp: Date.now(),
    gridItems: [],
    hookItems: [],
    sourcePositionParams: DEFAULT_POSITION_PARAMS,
  };
}

export async function writeHookOnlyToClipboard(hookItems: ClipboardHookItem[]): Promise<boolean> {
  const payload = buildEmptyPayload();
  payload.hookItems = hookItems;
  return writeToClipboard(payload);
}

export class GridCompOperator {
  static async copyComp(editorState: EditorState, compRecords: Record<string, Comp>): Promise<boolean> {
    const oldUi = editorState.getUIComp().getComp();
    if (!oldUi) {
      messageInstance.info(trans("gridCompOperator.notSupport"));
      return false;
    }

    const compKeys = Object.keys(compRecords);

    if (_.size(compRecords) <= 0) {
      messageInstance.info(trans("gridCompOperator.selectAtLeastOneComponent"));
      return false;
    }
    const container = editorState.findContainer(compKeys[0]);
    if (!container) {
      messageInstance.info(trans("gridCompOperator.selectAtLeastOneComponent"));
      return false;
    }
    const simpleContainer = container.realSimpleContainer(compKeys[0]);
    let layout: Layout = _.pick(simpleContainer.children.layout.getView(), compKeys);
    layout = moveToZero(layout);

    const compMap = _.mapValues(compRecords, (comp, key) => ({
      item: comp,
      layout: layout[key],
    }));

    const validComps = Object.values(compMap).filter((item) => !!item.item && !!item.layout);
    if (!validComps || _.size(validComps) <= 0) {
      messageInstance.info(trans("gridCompOperator.selectAtLeastOneComponent"));
      return false;
    }

    const sourcePositionParams = simpleContainer.children.positionParams.getView();
    const nameGenerator = editorState.getNameGenerator();

    const gridItems: ClipboardGridItem[] = validComps.map((comp) => {
      const itemComp = comp.item as GridItemComp;
      const compType = itemComp.children.compType.getView();
      const name = itemComp.children.name.getView();
      const innerComp = itemComp.children.comp;
      const isContainerComp = isContainer(innerComp);
      const compJSON = isContainerComp
        ? {
            ...innerComp.toJsonValue(),
            ...innerComp.getPasteValue(nameGenerator) as Record<string, any>,
          }
        : innerComp.toJsonValue();
      return { compType, comp: compJSON, name, layout: comp.layout, isContainer: isContainerComp };
    });

    const payload = buildEmptyPayload();
    payload.sourcePositionParams = sourcePositionParams;
    payload.gridItems = gridItems;
    return writeToClipboard(payload);
  }

  static pasteFromPayload(editorState: EditorState, payload: LowcoderClipboardPayload): boolean {
    if (payload.gridItems.length === 0) {
      return false;
    }
    return this.doPaste(
      editorState,
      payload.gridItems,
      payload.sourcePositionParams || DEFAULT_POSITION_PARAMS,
    );
  }

  private static doPaste(
    editorState: EditorState,
    items: ClipboardGridItem[],
    sourcePositionParams: PositionParams,
  ): boolean {
    const oldUi = editorState.getUIComp().getComp();
    if (!oldUi) {
      messageInstance.info(trans("gridCompOperator.notSupport"));
      return false;
    }
    let selectedContainer = editorState.selectedContainer();
    if (!selectedContainer) {
      messageInstance.warning(trans("gridCompOperator.noContainerSelected"));
      return false;
    }

    const selectedComps = editorState.selectedComps();

    const selectedSimpleContainer =
      selectedContainer.realSimpleContainer(Object.keys(selectedComps)[0]) ??
      selectedContainer.realSimpleContainer();
    const nameGenerator = editorState.getNameGenerator();
    const currentLayout: Layout = selectedSimpleContainer.children.layout.getView();
    const { x: baseX, y: baseY } = calcPasteBaseXY(currentLayout, Object.keys(selectedComps));
    const multiAddActions: Array<CustomAction<any>> = [];
    const copyLayouts: Layout = {};
    const copyCompNames = new Set<string>();

    items.forEach((item) => {
      const key = genRandomKey();
      const { w, h } = switchLayoutWH(
        item.layout.w,
        item.layout.h,
        sourcePositionParams,
        selectedSimpleContainer.children.positionParams.getView()
      );
      copyLayouts[key] = {
        ...item.layout,
        i: key,
        x: item.layout.x + baseX,
        y: item.layout.y + baseY,
        w,
        h,
        isDragging: true,
      };
      const compInfo = parseCompType(item.compType);
      const compName = nameGenerator.genItemName(compInfo.compName);
      const compJSONValue = item.isContainer
        ? remapContainerPasteValue(item.comp, nameGenerator)
        : item.comp;
      copyCompNames.add(compName);
      multiAddActions.push(
        (oldUi.realSimpleContainer() as SimpleContainerComp).children.items.addAction(key, {
          compType: item.compType,
          comp: compJSONValue,
          name: compName,
        })
      );
    });

    selectedSimpleContainer.dispatch(
      multiChangeAction({
        layout: selectedSimpleContainer.children.layout.changeValueAction({
          ...currentLayout,
          ...copyLayouts,
        }),
        items: (oldUi.realSimpleContainer() as SimpleContainerComp).children.items.multiAction(
          multiAddActions
        ),
      })
    );
    editorState.setSelectedCompNames(copyCompNames);
    return true;
  }

  static deleteComp(editorState: EditorState, compRecords: Record<string, Comp>): boolean {
    const compNum = _.size(compRecords);
    if (compNum <= 0) {
      return false;
    }

    const deleteFunc = () => {
      this.doDelete(editorState, compRecords) &&
      messageInstance.info(trans("gridCompOperator.deleteCompsSuccess", { undoKey }));
    };

    if (compNum > 1) {
      CustomModal.confirm({
        title: trans("gridCompOperator.deleteCompsTitle"),
        content: trans("gridCompOperator.deleteCompsBody", { compNum }),
        onConfirm: deleteFunc,
        confirmBtnType: "delete",
        okText: trans("delete"),
      });
    } else {
      deleteFunc();
    }
    return true;
  }

  static editComp(editorState: EditorState) {
    const selectedComp = Object.values(editorState.selectedComps())[0];
    const applicationId = selectedComp.children.comp.children.appId.value
    window.open(APPLICATION_VIEW_URL(applicationId, "edit"))
  }

  static async cutComp(editorState: EditorState, compRecords: Record<string, Comp>) {
    const copied = await this.copyComp(editorState, compRecords);
    if (copied && this.doDelete(editorState, compRecords)) {
      messageInstance.info(trans("gridCompOperator.cutCompsSuccess", { pasteKey, undoKey }));
    }
  }

  private static doDelete(editorState: EditorState, compRecords: Record<string, Comp>): boolean {
    if (!compRecords || Object.keys(compRecords).length <= 0) {
      return false;
    }
    const hooksComp = editorState.getHooksComp();
    Object.entries(compRecords).forEach(([key, item]) => {
      const compInfos: ActionExtraInfo["compInfos"] = [
        {
          type: "delete",
          compName: (item as any).children.name.getView(),
          compType: (item as any).children.compType.getView(),
        },
      ];
      const hookIndex = hooksComp.getView().findIndex((comp) => comp === item);
      if (hookIndex > 0) {
        // hooks comp
        hooksComp.dispatch(wrapActionExtraInfo(hooksComp.deleteAction(hookIndex), { compInfos }));
      } else {
        const action = deferAction(wrapActionExtraInfo(deleteCompAction(), { compInfos }));
        item.dispatch(action);
      }
    });
    editorState.setSelectedCompNames(new Set([]));
    return true;
  }

  static async upgradeCurrentComp(editorState: EditorState) {
    const selectedComp = Object.values(editorState.selectedComps())[0];
    const compType = selectedComp.children.compType.getView();
    const compInfo = parseCompType(compType);

    if (!compInfo.isRemote || compInfo.source !== "npm") {
      return;
    }

    const latestVersion = await getLatestVersion(compInfo);

    if (!latestVersion) {
      messageInstance.error(trans("comp.getLatestVersionMetaError"));
      return;
    }

    if (latestVersion.version === compInfo.packageVersion) {
      messageInstance.info(trans("comp.needNotUpgrade"));
      return;
    }

    if (!latestVersion.lowcoder?.comps?.[compInfo.compName]) {
      messageInstance.error(trans("comp.compNotFoundInLatestVersion"));
      return;
    }

    const nextCompType = getRemoteCompType(
      compInfo.source,
      compInfo.packageName,
      latestVersion.version,
      compInfo.compName
    );
    const compInfos: ActionExtraInfo["compInfos"] = [
      {
        type: "upgrade",
        compName: selectedComp.children.name.getView(),
        compType: selectedComp.children.compType.getView(),
      },
    ];
    selectedComp.dispatch(deferAction(selectedComp.changeChildAction("compType", nextCompType)));
    selectedComp.children.comp.dispatch(
      deferAction(
        wrapActionExtraInfo(
          replaceCompAction(remoteComp({ ...compInfo, packageVersion: latestVersion.version })),
          { compInfos }
        )
      )
    );
    messageInstance.success(trans("comp.upgradeSuccess"));
  }
}

/**
 * Remap keys and names inside a serialized container JSON.
 * Mirrors what SimpleContainerComp.getPasteValue() does, but operates on
 * plain JSON so it works for cross-app clipboard payloads where we don't
 * have live comp instances.
 */
function remapContainerPasteValue(compJson: any, nameGenerator: NameGenerator): any {
  if (!compJson || typeof compJson !== "object") return compJson;

  const items = compJson.items;
  const layout = compJson.layout;
  if (!items || typeof items !== "object") return compJson;

  const keyMap: Record<string, string> = {};
  Object.keys(items).forEach((oldKey) => {
    keyMap[oldKey] = genRandomKey();
  });

  const newItems: Record<string, any> = {};
  Object.entries(items).forEach(([oldKey, itemValue]: [string, any]) => {
    const newKey = keyMap[oldKey];
    const compType = itemValue?.compType;
    const newName = compType ? nameGenerator.genItemName(compType) : genRandomKey();
    const innerComp = itemValue?.comp;
    const remappedComp = innerComp?.items
      ? remapContainerPasteValue(innerComp, nameGenerator)
      : innerComp;
    newItems[newKey] = { ...itemValue, name: newName, comp: remappedComp };
  });

  let newLayout = layout;
  if (layout && typeof layout === "object") {
    const remapped: Record<string, any> = {};
    Object.entries(layout).forEach(([oldKey, layoutItem]: [string, any]) => {
      const newKey = keyMap[oldKey] || oldKey;
      remapped[newKey] = { ...layoutItem, i: newKey };
    });
    newLayout = remapped;
  }

  return { ...compJson, items: newItems, layout: newLayout };
}
