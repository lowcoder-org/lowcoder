import { MultiCompBuilder } from "comps/generators/multi";
import { getGlobalSettings } from "comps/utils/globalSettings";
import { trans } from "i18n";
import { BranchDiv } from "lowcoder-design";
import { FunctionControl } from "../codeControl";

const RunScriptTmpAction = (function () {
  const childrenMap = {
    script: FunctionControl,
  };
  return new MultiCompBuilder(childrenMap, () => {
    return () => Promise.resolve(undefined as unknown);
  })
    .setPropertyViewFn(() => <></>)
    .build();
})();

export class RunScriptAction extends RunScriptTmpAction {
  override getView() {
    const f = this.children.script.getView();
    const { orgCommonSettings } = getGlobalSettings();
    const runInHost = !!orgCommonSettings?.runJavaScriptInHost;
    return () => Promise.resolve(f({}, runInHost));
  }

  propertyView() {
    return (
      <BranchDiv>
        {this.children.script.propertyView({
          placeholder: "// " + trans("eventHandler.runScriptPlaceHolder"),
          layout: "vertical",
          styleName: "medium",
          showLineNum: false,
          enableAIHelp: true,
          aiHelp: {
            targetKind: "javascript",
            label: "Event handler script",
            fieldName: "script",
            fieldDescription:
              "JavaScript to run when this event fires. Has access to all Lowcoder component and query references.",
          },
        })}
      </BranchDiv>
    );
  }
}
