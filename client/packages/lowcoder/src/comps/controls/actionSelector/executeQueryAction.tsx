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
import { useCallback, useEffect } from "react";

const ExecuteQueryPropertyView = ({
  comp,
  placement,
}: {
  comp: any,
  placement?: "query" | "table"
}) => {
  const getQueryOptions = useCallback((editorState?: EditorState) => {
    if (!editorState) return [];
      const options: {
        label: string;
        value: string;
        variables?: Record<string, string>
      }[] = editorState.getQueriesComp()
        .getView()
        .map((item) => {
          const name = item.children.name.getView();
          const qVariables: Record<string, string> = {};
          item.children.variables.toJsonValue().forEach(v => {
            qVariables[v.key!] = '';
          });
          return {
            label: name,
            value: name,
            variables: qVariables,
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
    const queryVariables = comp.children.queryVariables.getView();
    if (!queryVariables.length) return null;

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
    if (!queryName) {
      return () => Promise.resolve();
    }

    let result = Object.values(this.children.queryVariables.getView())
      .filter((item) => item.children.key.getView() !== "" && item.children.value.getView() !== "")
      .map((item) => ({[item.children.key.getView() as string]: {value: item.children.value.getView()}}))
      .reduce((acc, curr) => Object.assign(acc, curr), {});
    
    result.$queryName = {value: this.children.queryName.getView()};
    
    return () => {
      return getPromiseAfterDispatch(
        this.dispatch,
        routeByNameAction(
          queryName,
          executeQueryAction({args: result})
        ),
        { notHandledError: trans("eventHandler.notHandledError") }
      );
    }
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
