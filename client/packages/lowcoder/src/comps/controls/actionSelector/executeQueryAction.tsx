import { executeQueryAction, routeByNameAction } from "lowcoder-core";
import { InputTypeEnum } from "comps/comps/moduleContainerComp/ioComp/inputListItemComp";
import { SimpleNameComp } from "comps/comps/simpleNameComp";
import { EditorContext, EditorState } from "comps/editorState";
import { MultiCompBuilder } from "comps/generators/multi";
import { BranchDiv, Dropdown } from "lowcoder-design";
import { BottomResTypeEnum } from "types/bottomRes";
import { getPromiseAfterDispatch } from "util/promiseUtils";
import { trans } from "i18n";
import { withDefault } from "comps/generators";
import { keyValueListControl} from "comps/controls/keyValueListControl";
import { useCallback } from "react";

const ExecuteQueryPropertyView = ({
  comp,
  placement,
}: {
  comp: any,
  placement?: "query" | "table"
}) => {
  const getQueryOptions = useCallback((editorState?: EditorState) => {
    const options: { label: string; value: string; variables?: Record<string, string> }[] =
      editorState
        ?.queryCompInfoList()
        .map((info) => {
          return {
            label: info.name,
            value: info.name,
            variables: info.data.variables,
          }
      })
        .filter(
          // Filter out the current query under query
          (option) => {
            if (
              placement === "query" &&
              editorState.selectedBottomResType === BottomResTypeEnum.Query
            ) {
              return option.value !== editorState.selectedBottomResName;
            }
            return true;
          }
        ) || [];

    // input queries
    editorState
      ?.getModuleLayoutComp()
      ?.getInputs()
      .forEach((i) => {
        const { name, type } = i.getView();
        if (type === InputTypeEnum.Query) {
          options.push({ label: name, value: name });
        }
      });
    return options;
  }, [placement]);

  const getVariableOptions = useCallback((editorState?: EditorState) => {
    return comp.children.queryVariables.propertyView({
      label: trans("eventHandler.queryVariables"),
      layout: "vertical",
      isStatic: true,
      keyFixed: true,
      indicatorForAll: true,
    });
  }, [comp.children.queryVariables.getView()])
  
  return (
    <>
      <BranchDiv $type={"inline"}>
        <EditorContext.Consumer>
          {(editorState) => (
            <>
              <Dropdown
                showSearch={true}
                value={comp.children.queryName.getView()}
                options={getQueryOptions(editorState)}
                label={trans("eventHandler.selectQuery")}
                onChange={(value) => {
                  const options = getQueryOptions(editorState);
                  const selectedQuery = options.find(option => option.value === value);
                  const variables = selectedQuery ? Object.keys(selectedQuery.variables || {}) : [];
                  comp.dispatchChangeValueAction({
                    queryName: value,
                    queryVariables: variables.map((variable) => ({key: variable, value: ''})),
                  });
                }}
              />
            </>
          )}
        </EditorContext.Consumer>
      </BranchDiv>
      <EditorContext.Consumer>
        {(editorState) => getVariableOptions(editorState)}
      </EditorContext.Consumer>
    </>
  );
}
const ExecuteQueryTmpAction = (function () {
  const childrenMap = {
    queryName: SimpleNameComp,
    queryVariables: withDefault(keyValueListControl(false, [], "variable"), [])
  };
  return new MultiCompBuilder(childrenMap, () => {
    return () => Promise.resolve(undefined as unknown);
  })
    .setPropertyViewFn(() => <></>)
    .build();
})();

export class ExecuteQueryAction extends ExecuteQueryTmpAction {
  override getView() {
    const queryName = this.children.queryName.getView();
    // const queryParams = keyValueListToSearchStr(Array.isArray(this?.children?.query) ? (this.children.query as unknown as any[]).map((i: any) => i.getView() as KeyValue) : []);
    const result = Object.values(this.children.queryVariables.children as Record<string, {
      children: {
        key: { unevaledValue: string },
        value: { unevaledValue: string }
      }}>)
      .filter(item => item.children.key.unevaledValue !== "" && item.children.value.unevaledValue !== "")
      .map(item => ({[item.children.key.unevaledValue]: item.children.value.unevaledValue}))
      .reduce((acc, curr) => Object.assign(acc, curr), {});
    if (!queryName) {
      return () => Promise.resolve();
    }
    return () =>
      getPromiseAfterDispatch(
        this.dispatch,
        routeByNameAction(
          queryName,
          executeQueryAction({args: result})
        ),
        { notHandledError: trans("eventHandler.notHandledError") }
      );
  }

  displayName() {
    const queryName = this.children.queryName.getView();
    if (queryName) {
      return `${queryName}.run()`;
    }
  }

  propertyView({ placement }: { placement?: "query" | "table" }) {
    return (
      <ExecuteQueryPropertyView
        comp={this}
        placement={placement}
      />
    )
  }
}
