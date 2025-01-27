import { executeQueryAction, routeByNameAction } from "lowcoder-core";
import { InputTypeEnum } from "comps/comps/moduleContainerComp/ioComp/inputListItemComp";
import { SimpleNameComp } from "comps/comps/simpleNameComp";
import { EditorContext, EditorState } from "comps/editorState";
import { MultiCompBuilder } from "comps/generators/multi";
import { BranchDiv, Dropdown } from "lowcoder-design";
import { BottomResTypeEnum } from "types/bottomRes";
import { getPromiseAfterDispatch } from "util/promiseUtils";
import { trans } from "i18n";
import {keyValueListControl, keyValueListToSearchStr, withDefault} from "lowcoder-sdk";
import {KeyValue} from "@lowcoder-ee/types/common";

const ExecuteQueryTmpAction = (function () {
  const childrenMap = {
    queryName: SimpleNameComp,
    query: withDefault(keyValueListControl(false, [], "string"), [{ key: "", value: "" }])
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
    const result = Object.values(this.children.query.children as Record<string, {
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
    const getQueryOptions = (editorState?: EditorState) => {
      const options: { label: string; value: string }[] =
        editorState
          ?.queryCompInfoList()
          .map((info) => ({
            label: info.name,
            value: info.name,
          }))
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
    };
    return (
      <>
        <BranchDiv $type={"inline"}>
          <EditorContext.Consumer>
            {(editorState) => (
              <>
                <Dropdown
                  showSearch={true}
                  value={this.children.queryName.getView()}
                  options={getQueryOptions(editorState)}
                  label={trans("eventHandler.selectQuery")}
                  onChange={(value) => this.dispatchChangeValueAction({ queryName: value })}
                />
              </>
            )}
          </EditorContext.Consumer>
        </BranchDiv>
        <BranchDiv>
          {this.children.query.propertyView({
            label: trans("eventHandler.queryParams"),
            layout: "vertical",
          })}
        </BranchDiv>
      </>
    );
  }
}
