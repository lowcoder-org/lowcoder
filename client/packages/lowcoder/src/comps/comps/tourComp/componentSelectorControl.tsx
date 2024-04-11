import { trans } from "@lowcoder-ee/i18n";
import { getPromiseAfterDispatch } from "@lowcoder-ee/util/promiseUtils";
import { CompParams, ConstructorToDataType, customAction, routeByNameAction } from "lowcoder-core";
import { ExecuteAction, ParamsConfig } from "@lowcoder-ee/comps/controls/actionSelector/executeCompTypes";
import { CompNameContext, EditorContext, EditorState } from "@lowcoder-ee/comps/editorState";
import { mapValues } from "lodash";
import { Dropdown } from "components/Dropdown";
import { GridItemComp } from "@lowcoder-ee/comps/comps/gridItemComp";
import { HookComp } from "@lowcoder-ee/comps/hooks/hookComp";
import { TemporaryStateItemComp } from "@lowcoder-ee/comps/comps/temporaryStateComp";
import { SimpleNameComp } from "@lowcoder-ee/comps/comps/simpleNameComp";
import { list, MultiCompBuilder, valueComp } from "lowcoder-sdk";
import { Fragment, ReactNode } from "react";
import { ParamsValueComp } from "@lowcoder-ee/comps/controls/actionSelector/executeCompAction";

const ParamsValueTmpControl = list(ParamsValueComp);

class ParamsValueControl extends ParamsValueTmpControl {
  constructor(params: CompParams<ConstructorToDataType<typeof ParamsValueTmpControl>>) {
    // Compatible with old dsl, params is an array of strings, no parameter names
    if (params.value && params.value.length > 0 && !params.value[0].hasOwnProperty("compType")) {
      params.value = params.value.map((param) => ({
        comp: param,
        compType: "string"
      }));
    }
    super(params);
  }

  propertyView(params: ParamsConfig): ReactNode {
    return this.getView().map((view, i) => (
      <Fragment key={params[i].name ?? i}>
        {view.children.comp.propertyView({
          tooltip: params[i]?.description,
          label: params[i]?.name,
          layout: "vertical"
        })}
      </Fragment>
    ));
  }
}

const ExecuteCompTmpAction = (function() {
  const childrenMap = {
    name: SimpleNameComp,
    methodName: valueComp<string>(""),
    params: ParamsValueControl
  };
  return new MultiCompBuilder(childrenMap, () => {
    return () => Promise.resolve(undefined as unknown);
  })
    .setPropertyViewFn(() => <></>)
    .build();
})();

interface ExecuteCompActionOptions {
  compListGetter: (
    es: EditorState
  ) => (GridItemComp | HookComp | InstanceType<typeof TemporaryStateItemComp>)[];
  selectLabel?: string;
}

export function targetCompAction(params: ExecuteCompActionOptions) {
  const { compListGetter, selectLabel = trans("eventHandler.component") } = params;

  class InternalExecuteCompAction extends ExecuteCompTmpAction {
    displayName() {
      const name = this.children.name.getView();
      const method = this.children.methodName.getView();
      if (name && method) {
        return `${name}.${method}()`;
      }
    }

    override getView() {
      const name = this.children.name.getView();
      if (!name) {
        return () => Promise.resolve();
      }
      return () =>
        getPromiseAfterDispatch(
          this.dispatch,
          routeByNameAction(
            name,
            customAction<ExecuteAction>(
              {
                type: "execute",
                methodName: this.children.methodName.getView(),
                params: this.children.params.getView().map((x) => x.getView())
              },
              false
            )
          ),
          {
            notHandledError: trans("eventHandler.notHandledError")
          }
        );
    }

    exposingNode() {
      return this.node();
    }

    propertyView() {
      return (
        <EditorContext.Consumer>
          {(editorState) => {
            const compMethods: Record<string, Record<string, ParamsConfig>> = {};
            const compList: (GridItemComp | HookComp | InstanceType<typeof TemporaryStateItemComp>)[] = compListGetter(editorState);

            compList.forEach((item) => {
              compMethods[item.children.name.getView()] = mapValues(
                item.exposingInfo().methods,
                (v) => v.params
              );
            });

            function changeMethodAction(compName: string, methodName: string) {
              const currentMethods = compMethods[compName] ?? {};
              const params = currentMethods[methodName];
              return {
                name: compName,
                methodName: methodName,
                params: params?.map((p) => ({
                  compType: p.type,
                  name: p.name
                }))
              };
            }

            const name = this.children.name.getView();
            const methods = compMethods[name] ?? {};
            const params = methods[this.children.methodName.getView()];
            return (
              <>
                <CompNameContext.Consumer>
                  {(compName) => (
                    <Dropdown
                      showSearch={true}
                      value={name}
                      options={compList
                        .filter(
                          (item) =>
                            Object.keys(compMethods[item.children.name.getView()]).length > 0
                        )
                        .filter((item) => item.children.name.getView() !== compName)
                        .map((item) => ({
                          label: item.children.name.getView(),
                          value: item.children.name.getView()
                        }))}
                      label={selectLabel}
                      onChange={(value) =>
                        this.dispatchChangeValueAction(
                          changeMethodAction(value, Object.keys(compMethods[value])[0])
                        )
                      }
                    />
                  )}
                </CompNameContext.Consumer>
              </>
            );
          }}
        </EditorContext.Consumer>
      );
    }
  }

  return InternalExecuteCompAction;
}


export const TargetCompAction = targetCompAction({
  compListGetter: (editorState: EditorState) => Object.values(editorState.getAllUICompMap())
});
