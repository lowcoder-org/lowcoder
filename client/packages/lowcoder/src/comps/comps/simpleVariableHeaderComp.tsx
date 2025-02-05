import { CompAction } from "lowcoder-core";
import SimpleStringControl from "../controls/simpleStringControl";

export class SimpleVariableHeaderComp extends SimpleStringControl {
  override reduce(action: CompAction): this {
    // if (isBroadcastAction<RenameAction>(action, CompActionTypes.RENAME)) {
    //   if (this.getView() === action.action.oldName) {
    //     return super.reduce(this.changeValueAction(action.action.name));
    //   }
    // }
    return super.reduce(action);
  }
}
