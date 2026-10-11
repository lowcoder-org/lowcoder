import { FunctionControl } from "comps/controls/codeControl";
import { MultiCompBuilder } from "comps/generators";
import { QueryResult } from "./queryComp";
import { QueryTutorials } from "util/tutorialUtils";
import { DocLink } from "lowcoder-design";
import { getGlobalSettings } from "comps/utils/globalSettings";
import { trans } from "i18n";
import { QUERY_EXECUTION_ERROR, QUERY_EXECUTION_OK } from "../../constants/queryConstants";
import { useContext } from "react";
import { CompNameContext } from "comps/editorState";

export const JSQuery = (function () {
  const childrenMap = {
    script: FunctionControl,
  };
  return new MultiCompBuilder(childrenMap, (props) => {
    const { orgCommonSettings } = getGlobalSettings();
    const runInHost = !!orgCommonSettings?.runJavaScriptInHost;
    return async (p: { args?: Record<string, unknown> }): Promise<QueryResult> => {
      try {
        const timer = performance.now();
        const data = await props.script(p.args, runInHost);
        return {
          data: data,
          code: QUERY_EXECUTION_OK,
          success: true,
          runTime: Number((performance.now() - timer).toFixed()),
        };
      } catch (e) {
        return {
          success: false,
          data: "",
          code: QUERY_EXECUTION_ERROR,
          message: (e as any).message || "",
        };
      }
    };
  })
    .setPropertyViewFn((children) => <JSQueryPropertyView children={children} />)
    .build();
})();

function JSQueryPropertyView({ children }: { children: any }) {
  const queryName = useContext(CompNameContext);
  return (
    <>
      {children.script.propertyView({
        placeholder: "return 1 + 1",
        placement: "bottom",
        styleName: "medium",
        language: "javascript",
        enableAIHelp: true,
        aiHelp: {
          targetKind: "javascript",
          label: queryName ? `${queryName}.script` : "JS Query script",
          queryType: "JS",
          queryName,
          targetId: queryName ? `${queryName}.script` : undefined,
        },
      })}
      {QueryTutorials.js && (
        <DocLink href={QueryTutorials.js}>{trans("query.jsQueryDocLink")}</DocLink>
      )}
    </>
  );
}
