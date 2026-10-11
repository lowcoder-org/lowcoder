import type { CompTree } from "comps/comps/containerBase/utils";
import type { EditorState } from "comps/editorState";
import type { HookCompType } from "./hookCompTypes";

const overlayHookTypes = new Set<HookCompType>(["drawer", "modal", "meeting"]);

export function shouldOpenOverlayOnCreate(compType: string) {
  return compType === "drawer" || compType === "modal";
}

function containsSelectedComp(compTree: CompTree, selectedCompName: string): boolean {
  const selectedHere = Object.values(compTree.items).some(
    (child) => child.children.name.getView() === selectedCompName
  );

  return (
    selectedHere ||
    Object.values(compTree.children).some((childTree) =>
      containsSelectedComp(childTree, selectedCompName)
    )
  );
}

function syncOverlayVisibility(editorState: EditorState, selectedCompNames: Set<string>) {
  if (selectedCompNames.size !== 1) {
    return;
  }

  const selectedCompName = selectedCompNames.values().next().value;
  if (!selectedCompName) {
    return;
  }

  Object.values(editorState.getHooksComp().children).forEach((hookComp) => {
    const compType = hookComp.children.compType.getView();
    if (!overlayHookTypes.has(compType)) {
      return;
    }

    const comp: any = hookComp.children.comp;
    const selectedOverlay = hookComp.children.name.getView() === selectedCompName;
    if (selectedOverlay && comp.remoteInfo?.isRemote) {
      return;
    }

    const visibleControl = comp.children?.visible;
    if (!visibleControl) {
      return;
    }

    const compTree = comp.getCompTree?.();
    const shouldBeVisible =
      selectedOverlay ||
      (compTree ? containsSelectedComp(compTree, selectedCompName) : false);
    const isVisible = visibleControl.getView().value;

    if (isVisible !== shouldBeVisible) {
      visibleControl.dispatch(
        visibleControl.changeChildAction("value", shouldBeVisible)
      );
    }
  });
}

export function selectCompsFromLeftPanel(
  editorState: EditorState,
  selectedCompNames: Set<string>
) {
  editorState.setSelectedCompNames(selectedCompNames, "leftPanel");
  syncOverlayVisibility(editorState, selectedCompNames);
}
