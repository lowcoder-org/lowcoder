import { ControlParams } from "comps/controls/controlParams";
import { EditorContext } from "comps/editorState";
import { CompAction, SimpleComp } from "lowcoder-core";
import { ControlPropertyViewWrapper, PopupCard, Input } from "lowcoder-design";
import { useContext, useEffect, useState } from "react";
import { trans } from "i18n";
const SimpleVariableHeaderPropertyView = ({params, comp, isCheck}: any) => {
  const [error, setError] = useState<string | undefined>();
  const [value, setValue] = useState(comp.value);
  const editorState = useContext(EditorContext);
  useEffect(() => {
    setValue(comp.value);
    isCheck && setError(undefined);
  }, [comp]);
  return (
    <ControlPropertyViewWrapper {...params}>
      <Input
        value={value}
        placeholder={params.placeholder}
        onChange={(e) => {
          const error = isCheck && editorState.checkRename(value, e.target.value);
          isCheck && setError(error || undefined);
          setValue(e.target.value);
        }}
        onBlur={(e) => {
          if(!isCheck || !error) comp.dispatchChangeValueAction(value);
          else {
            setValue(comp.value);
            setError(undefined);
          }
        }}
      />
      {isCheck && <PopupCard
        editorFocus={!!error}
        title={error ? trans("error") : ""}
        content={error}
        hasError={!!error}
      />}
    </ControlPropertyViewWrapper>
  );
}
export const SimpleVariableHeaderComp = (isCheck: boolean = false) => {
    return class SimpleVariableHeaderComp extends SimpleComp<string> {
    override reduce(action: CompAction): this {
      // if (isBroadcastAction<RenameAction>(action, CompActionTypes.RENAME)) {
      //   if (this.getView() === action.action.oldName) {
      //     return super.reduce(this.changeValueAction(action.action.name));
      //   }
      // }
      return super.reduce(action);
    }

    readonly IGNORABLE_DEFAULT_VALUE = "";
    protected getDefaultValue(): string {
      return "";
    }

    getPropertyView() {
      return this.propertyView({});
    }

    propertyView(params: ControlParams) {
      return <SimpleVariableHeaderPropertyView params={params} comp={this} isCheck={isCheck}></SimpleVariableHeaderPropertyView>
    }
  }
}
