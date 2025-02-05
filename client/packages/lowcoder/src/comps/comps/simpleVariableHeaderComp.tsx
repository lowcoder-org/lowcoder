import { CompAction, SimpleComp } from "lowcoder-core";
import { ControlParams, ControlPropertyViewWrapper, EditorContext, EditText, PopupCard } from "@lowcoder-ee/index.sdk";
import { useEffect, useState } from "react";
import { trans } from "@lowcoder-ee/i18n";
import { Input } from "lowcoder-design/src/components/Input";
import { checkName } from "../utils/rename";
const SimpleVariableHeaderPropertyView = ({params, comp}: any) => {
  const [error, setError] = useState<string | undefined>("");
  const [value, setValue] = useState(comp.value);
  useEffect(() => {
    setValue(comp.value);
    setError(undefined);
  }, [comp]);
  return (
    <ControlPropertyViewWrapper {...params}>
      <Input
        value={value}
        placeholder={params.placeholder}
        onChange={(e) => {
          const error = checkName(e.target.value);
          setError(error || undefined);
          setValue(e.target.value);
        }}
        onBlur={(e) => {
          if(!error) comp.dispatchChangeValueAction(value);
          else {
            setValue(comp.value);
            setError(undefined);
          }
        }}
      />
      {/* <EditText
        // disabled={readOnly}
        text={comp.value}
        onFinish={(value) => {
          if (editorState.rename(comp.value, value)) {
            // editorState.setSelectedBottomRes(value, type);
            setError("");
          }
        }}
        onChange={(value) => setError(editorState.checkRename(comp.value, value))}
        style={{ maxWidth: '100%', width: '100%' }}
      /> */}
      <PopupCard
        editorFocus={!!error}
        title={error ? trans("error") : ""}
        content={error}
        hasError={!!error}
      />
    </ControlPropertyViewWrapper>
  );
}
export class SimpleVariableHeaderComp extends SimpleComp<string> {
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
    return <SimpleVariableHeaderPropertyView params={params} comp={this}></SimpleVariableHeaderPropertyView>
  }
}
