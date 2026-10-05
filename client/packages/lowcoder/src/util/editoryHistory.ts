import { JSONValue } from "util/jsonTypes";
import { CompAction, CompActionTypes, isBroadcastAction, RenameAction } from "lowcoder-core";
import { Comp } from "lowcoder-core";
import { CompContainer } from "comps/utils/useCompInstance";
import { AppSnapshotContext } from "constants/applicationConstants";
import _ from "lodash";
import { Dispatch, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { createSnapshotAction } from "redux/reduxActions/appSnapshotActions";
import { HistoryManager } from "util/historyManager";
import { showCost } from "util/perfUtils";

type OperationType = AppSnapshotContext["operations"];

export function useAppHistory(
  compContainer: CompContainer,
  readOnly: boolean,
  appId: string,
  blockEditing?: boolean,
) {
  const reduxDispatch = useDispatch();

  // only reset the undo stack when the container itself changes, not on readOnly/blockEditing flips
  const history = useMemo(() => {
    if (!compContainer) {
      return undefined;
    }
    return new EditorHistory((x: any) => compContainer.setComp(x));
  }, [compContainer]);

  // registered in an effect (with cleanup) so listeners don't pile up on compContainer across re-renders
  useEffect(() => {
    if (!compContainer || !history) {
      return;
    }

    const handler = (actions?: Array<CompAction>) => {
      if (readOnly || !actions || blockEditing) {
        return;
      }
      // debounce may cause action missed when dispatching two actions continuously (such as add table, delete)
      showCost("addHistory", () => {
        const comp = compContainer.comp;
        const jsonValue = history.dslChanged(comp);
        if (jsonValue === false) {
          return;
        }
        // record editing history
        history.debounceAdd(comp);
        // save dsl snapshot
        history.saveSnapshot(comp, jsonValue, actions, reduxDispatch, appId);
      });
    };

    compContainer.addChangeListener(handler);
    return () => {
      compContainer.removeChangeListener(handler);
    };
  }, [compContainer, history, readOnly, blockEditing, reduxDispatch, appId]);

  return history;
}

/**
 * get detailed history by action
 */
function getSnapshotOperations(comp: Comp, action: CompAction) {
  let operations: AppSnapshotContext["operations"] = [];
  if (action.extraInfo?.compInfos) {
    // comp info exists when adding, layout change or deleting
    operations = action.extraInfo.compInfos.map((e) => ({
      compName: e.compName,
      compType: e.compType,
      operation: e.type,
    }));
  } else if (isBroadcastAction<RenameAction>(action, CompActionTypes.RENAME)) {
    const renameAction = action.action;
    operations = [
      {
        oldName: renameAction.oldName,
        compName: renameAction.name,
        operation: "rename",
      },
    ];
  } else if (
    action.type === CompActionTypes.CHANGE_VALUE ||
    action.type === CompActionTypes.CUSTOM
  ) {
    // find the impacted compName
    let i = 0;
    let currentComp: any = comp;
    while (i < action.path.length && currentComp) {
      const children = currentComp.children;
      if (!children) {
        break;
      }
      if (children["name"] && children["compType"]) {
        operations = [
          {
            compType: children["compType"].getView(),
            compName: children["name"].getView(),
            operation: "modify",
          },
        ];
      }
      currentComp = children && children[action.path[i]];
      i++;
    }
  }
  return operations;
}

/**
 * EditorHistory
 * - records
 * - undo && redo
 * - dsl snapshot
 */
export class EditorHistory {
  private history: HistoryManager<Comp>;
  private setComp: (comp: Comp) => void;
  private operationQueue: OperationType;
  private prevComp: Comp = undefined as any;
  private prevDslStr: string = "";

  constructor(setComp: (comp: Comp) => void) {
    this.operationQueue = [];
    this.history = new HistoryManager(100);
    this.setComp = setComp;
  }

  // returns the new JSON value if the DSL changed, or false otherwise -- reuse it instead of re-serializing
  dslChanged(curComp: Comp): JSONValue | false {
    const curJsonValue = curComp.toJsonValue();
    const curJson = JSON.stringify(curJsonValue);
    let dslChanged = false;
    if (this.prevDslStr && this.prevDslStr !== curJson) {
      dslChanged = true;
    }
    if (dslChanged && this.history.isEmpty()) {
      // the first dsl change
      this.history.add(this.prevComp);
    }
    this.prevComp = curComp;
    this.prevDslStr = curJson;
    return dslChanged ? curJsonValue : false;
  }

  debounceAdd = _.debounce((comp: Comp) => {
    this.add(comp);
  }, 300);

  add(comp: Comp) {
    this.history.add(comp);
  }

  redo() {
    const nextComp = this.history.next();
    if (!nextComp) {
      return;
    }
    // log.log("redo...", this.history);
    this.setComp(nextComp);
  }

  undo() {
    const lastComp = this.history.last();
    if (!lastComp) {
      return;
    }
    this.setComp(lastComp);
  }

  private doSaveSnapshot = _.debounce(
    (dsl: JSONValue, reduxDispatch: Dispatch<any>, applicationId: string) => {
      if (this.operationQueue.length <= 0) {
        return;
      }
      // merge the same action
      const operationSet = new Set();
      const operations = this.operationQueue.filter((o) => {
        const key = o.operation + o.compName;
        if (!operationSet.has(key)) {
          operationSet.add(key);
          return true;
        }
        return false;
      });
      reduxDispatch(
        createSnapshotAction({
          applicationId: applicationId,
          dsl: dsl,
          context: {
            operations: operations,
          },
        })
      );
      this.operationQueue.splice(0, this.operationQueue.length);
    },
    5000
  );

  saveSnapshot(
    comp: Comp,
    jsonValue: JSONValue,
    actions: CompAction[],
    reduxDispatch: Dispatch<any>,
    applicationId: string
  ) {
    const operations = actions.flatMap((a) => getSnapshotOperations(comp, a));
    operations.forEach((o) => this.operationQueue.push(o));
    this.doSaveSnapshot(jsonValue, reduxDispatch, applicationId);
  }
}
