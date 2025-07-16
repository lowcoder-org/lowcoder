import { isContainer } from "comps/comps/containerBase";
import { SimpleContainerComp } from "comps/comps/containerBase/simpleContainerComp";
import { GridItemComp } from "comps/comps/gridItemComp";
import { remoteComp } from "comps/comps/remoteComp/remoteComp";
import { EditorState } from "comps/editorState";
import { trans } from "i18n";
import {
  calcPasteBaseXY,
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
import history from "@lowcoder-ee/util/history";

export type CopyCompType = {
  layout: LayoutItem;
  item: Comp;
};

export class GridCompOperator {
  private static copyComps: CopyCompType[] = [];
  private static sourcePositionParams: PositionParams;

  static copyComp(editorState: EditorState, compRecords: Record<string, Comp>) {
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

    const toCopyComps = Object.values(compMap).filter((item) => !!item.item && !!item.layout);
    if (!toCopyComps || _.size(toCopyComps) <= 0) {
      messageInstance.info(trans("gridCompOperator.selectAtLeastOneComponent"));
      return false;
    }
    this.copyComps = toCopyComps;
    this.sourcePositionParams = simpleContainer.children.positionParams.getView();

    // log.debug( "copyComp. toCopyComps: ", this.copyComps, " sourcePositionParams: ", this.sourcePositionParams);
    return true;
  }

  // FALK TODO: How can we enable Copy and Paste of components across Browser Tabs / Windows?
  static pasteComp(editorState: EditorState) {
    if (!this.copyComps || _.size(this.copyComps) <= 0 || !this.sourcePositionParams) {
      messageInstance.info(trans("gridCompOperator.selectCompFirst"));
      return false;
    }
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
    const isSelectingContainer =
      _.size(selectedComps) === 1 &&
      (Object.values(selectedComps)[0] as GridItemComp)?.children?.comp === selectedContainer;
    if (_.size(this.copyComps) === 1) {
      const { item } = this.copyComps[0];
      // Special case: To paste a container, and the container is currently selected, paste it outside the selected container
      if (isContainer((item as GridItemComp).children.comp) && isSelectingContainer) {
        selectedContainer =
          editorState.findContainer(Object.keys(selectedComps)[0]) ?? selectedContainer;
      }
    }

    const selectedSimpleContainer =
      selectedContainer.realSimpleContainer(Object.keys(selectedComps)[0]) ??
      selectedContainer.realSimpleContainer();
    const nameGenerator = editorState.getNameGenerator();
    const currentLayout: Layout = selectedSimpleContainer.children.layout.getView();
    const { x: baseX, y: baseY } = calcPasteBaseXY(currentLayout, Object.keys(selectedComps));
    const multiAddActions: Array<CustomAction<any>> = [];
    const copyLayouts: Layout = {};
    const copyCompNames = new Set<string>();
    // log.debug("pasteComps. sourceContainer: ", this.sourceContainer, " targetContainer: ", selectedContainer);
    this.copyComps.forEach((comp) => {
      const key = genRandomKey();
      const { w, h } = switchLayoutWH(
        comp.layout.w,
        comp.layout.h,
        this.sourcePositionParams,
        selectedSimpleContainer.children.positionParams.getView()
      );
      copyLayouts[key] = {
        ...comp.layout,
        i: key,
        x: comp.layout.x + baseX,
        y: comp.layout.y + baseY,
        w,
        h,
        isDragging: true,
      };
      const itemComp = comp.item as GridItemComp;
      const compType = itemComp.children.compType.getView();
      const compInfo = parseCompType(compType);
      const compName = nameGenerator.genItemName(compInfo.compName);
      const compJSONValue = isContainer(itemComp.children.comp)
        ? {
            ...itemComp.children.comp.toJsonValue(),
            ...itemComp.children.comp.getPasteValue(nameGenerator) as Record<string, any>,
          }
        : itemComp.children.comp.toJsonValue();
      copyCompNames.add(compName);
      multiAddActions.push(
        (oldUi.realSimpleContainer() as SimpleContainerComp).children.items.addAction(key, {
          compType: compType,
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
    window.open(history.createHref({pathname: APPLICATION_VIEW_URL(applicationId, "edit")}))
  }

  static cutComp(editorState: EditorState, compRecords: Record<string, Comp>) {
    this.copyComp(editorState, compRecords) &&
      this.doDelete(editorState, compRecords) &&
        messageInstance.info(trans("gridCompOperator.cutCompsSuccess", { pasteKey, undoKey }));
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
