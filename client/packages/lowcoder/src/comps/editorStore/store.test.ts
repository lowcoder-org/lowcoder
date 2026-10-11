import { createEditorStore } from "./store";
import { BottomResTypeEnum } from "types/bottomRes";

describe("editorStore selection slice", () => {
  test("updates selection and property pane together", () => {
    const store = createEditorStore();
    const selectedCompNames = new Set(["button1"]);

    store.getState().setSelectedCompNames(selectedCompNames, "leftPanel");

    expect(store.getState().selectedCompNames).toEqual(selectedCompNames);
    expect(store.getState().selectedCompNames).not.toBe(selectedCompNames);
    expect(store.getState().selectSource).toBe("leftPanel");
    expect(store.getState().showPropertyPane).toBe(true);

    store.getState().setSelectedCompNames(new Set());
    expect(store.getState().selectedCompNames.size).toBe(0);
    expect(store.getState().showPropertyPane).toBe(false);
  });

  test("does not notify subscribers for an unchanged selection", () => {
    const store = createEditorStore();
    const subscriber = jest.fn();
    const unsubscribe = store.subscribe(subscriber);

    store.getState().setSelectedCompNames(new Set(["button1"]), "leftPanel");
    store.getState().setSelectedCompNames(new Set(["button1"]), "leftPanel");

    expect(subscriber).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  test("creates isolated editor stores", () => {
    const firstStore = createEditorStore();
    const secondStore = createEditorStore();

    firstStore.getState().setSelectedCompNames(new Set(["button1"]));

    expect(firstStore.getState().selectedCompNames).toEqual(new Set(["button1"]));
    expect(secondStore.getState().selectedCompNames.size).toBe(0);
  });
});

describe("editorStore interaction slice", () => {
  test("defaults to not dragging with grid lines hidden", () => {
    const store = createEditorStore();

    expect(store.getState().isDragging).toBe(false);
    expect(store.getState().forceShowGrid).toBe(false);
    expect(store.getState().draggingCompType).toBe("button");
    expect(store.getState().disableInteract).toBe(false);
    expect(store.getState().showGridLines()).toBe(false);
  });

  test("showGridLines is true while dragging or forced", () => {
    const store = createEditorStore();

    store.getState().setDragging(true);
    expect(store.getState().showGridLines()).toBe(true);

    store.getState().setDragging(false);
    expect(store.getState().showGridLines()).toBe(false);

    store.getState().setForceShowGrid(true);
    expect(store.getState().showGridLines()).toBe(true);
  });

  test("setDraggingCompType also marks dragging as true", () => {
    const store = createEditorStore();

    store.getState().setDraggingCompType("table");

    expect(store.getState().draggingCompType).toBe("table");
    expect(store.getState().isDragging).toBe(true);
  });

  test("does not notify subscribers for unchanged interaction fields", () => {
    const store = createEditorStore();
    const subscriber = jest.fn();
    const unsubscribe = store.subscribe(subscriber);

    store.getState().setDragging(false); // already false
    store.getState().setForceShowGrid(false); // already false
    store.getState().setDisableInteract(false); // already false

    expect(subscriber).not.toHaveBeenCalled();
    unsubscribe();
  });

  test("interaction state is isolated across store instances", () => {
    const firstStore = createEditorStore();
    const secondStore = createEditorStore();

    firstStore.getState().setForceShowGrid(true);

    expect(firstStore.getState().forceShowGrid).toBe(true);
    expect(secondStore.getState().forceShowGrid).toBe(false);
  });
});

describe("editorStore editor mode slice", () => {
  test("defaults to the persisted editor mode status", () => {
    localStorage.setItem("editor_mode_status", "logic");
    const store = createEditorStore();

    expect(store.getState().editorModeStatus).toBe("logic");
    localStorage.removeItem("editor_mode_status");
  });

  test("does not notify subscribers for an unchanged editor mode", () => {
    const store = createEditorStore();
    const subscriber = jest.fn();
    store.getState().setEditorModeStatus("both");
    const unsubscribe = store.subscribe(subscriber);

    store.getState().setEditorModeStatus("both");

    expect(subscriber).not.toHaveBeenCalled();
    unsubscribe();
  });
});

describe("editorStore bottom res slice", () => {
  test("selecting a bottom resource sets name and type together", () => {
    const store = createEditorStore();

    store.getState().setSelectedBottomRes("query1", BottomResTypeEnum.Query);

    expect(store.getState().selectedBottomResName).toBe("query1");
    expect(store.getState().selectedBottomResType).toBe(BottomResTypeEnum.Query);
  });

  test("setShowResultCompName accepts undefined to clear the result panel", () => {
    const store = createEditorStore();

    store.getState().setShowResultCompName("query1");
    expect(store.getState().showResultCompName).toBe("query1");

    store.getState().setShowResultCompName(undefined);
    expect(store.getState().showResultCompName).toBeUndefined();
  });

  test("does not notify subscribers for an unchanged bottom resource selection", () => {
    const store = createEditorStore();
    store.getState().setSelectedBottomRes("query1", BottomResTypeEnum.Query);
    const subscriber = jest.fn();
    const unsubscribe = store.subscribe(subscriber);

    store.getState().setSelectedBottomRes("query1", BottomResTypeEnum.Query);

    expect(subscriber).not.toHaveBeenCalled();
    unsubscribe();
  });
});

describe("editorStore device slice", () => {
  test("defaults to desktop portrait", () => {
    const store = createEditorStore();

    expect(store.getState().deviceType).toBe("desktop");
    expect(store.getState().deviceOrientation).toBe("portrait");
  });

  test("updates device type and orientation independently", () => {
    const store = createEditorStore();

    store.getState().setDeviceType("mobile");
    store.getState().setDeviceOrientation("landscape");

    expect(store.getState().deviceType).toBe("mobile");
    expect(store.getState().deviceOrientation).toBe("landscape");
  });

  test("does not notify subscribers for an unchanged device type", () => {
    const store = createEditorStore();
    const subscriber = jest.fn();
    const unsubscribe = store.subscribe(subscriber);

    store.getState().setDeviceType("desktop"); // already desktop

    expect(subscriber).not.toHaveBeenCalled();
    unsubscribe();
  });
});
