import { MultiCompBuilder, simpleMultiComp } from "../../generators";
import { SimpleNameComp } from "@lowcoder-ee/comps/comps/simpleNameComp";
import { StringControl } from "@lowcoder-ee/comps/controls/codeControl";
import { list } from "@lowcoder-ee/comps/generators/list";
import { Input } from "components/Input";
import { ControlPropertyViewWrapper } from "components/control";
import { ReactNode, useContext, useState } from "react";
import { KeyValueList } from "components/keyValueList";
import { trans } from "i18n";
import { PopupCard } from "components/popupCard";
import { EditorContext, EditorState } from "@lowcoder-ee/comps/editorState";
import { withExposingRaw } from "@lowcoder-ee/comps/generators/withExposing";
import { NameAndExposingInfo } from "@lowcoder-ee/comps/utils/exposingTypes";
import { fromRecord } from "lowcoder-core";

interface VariablesParams {
  // variables: string[]; todo support parse variables
}

const VariableKey = ({children, dispatch}: any) => {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const editorState = useContext(EditorContext);

  return (
    <>
      <div style={{ flexGrow: 1, marginRight: "8px" }}>
        <Input
          value={children.key.getView()}
          onBlur={(e) => {
            const { value } = e.target;
            value !== children.key.getView() &&
            editorState.rename(children.key.getView(), value)
          }}
          onPressEnter={(e) => {
            const { value } = e.target as HTMLInputElement;
            value !== children.key.getView() &&
            editorState.rename(children.key.getView(), value)
          }}
          onChange={(e) => {
            const nextName = e.target.value;
            setError(editorState.checkRename(children.key.getView(), nextName));
          }}
          />
        <PopupCard
          editorFocus={!!error}
          title={error ? trans("error") : ""}
          content={error}
          hasError={!!error}
          />
      </div>
    </>
  )
}

const VariableItemBase = new MultiCompBuilder({
  key: SimpleNameComp,
  value: StringControl,
}, (props) => props)
.setPropertyViewFn((children, dispatch) => (<>
  <div style={{ display: "flex", gap: "8px", flexGrow: 1 }}>
    <VariableKey
      children={children}
      dispatch={dispatch}
      />
    <div style={{ width: "232px", flexGrow: 1 }}>
      {children.value.propertyView({ placeholder: "value" })}
    </div>
  </div>
</>))
.build()

const VariableItem = withExposingRaw(VariableItemBase, {}, (comp) =>
  fromRecord({
    value: comp.children.value.exposingNode(),
  })
);

const VariableListPropertyViewWrapper = ({children}: any) => {
  const editorState = useContext(EditorContext);
  return children(editorState);
}

export const VariablesComp = class extends list(VariableItem) {
  nameAndExposingInfo(): NameAndExposingInfo {
    const result: NameAndExposingInfo = {};
    Object.values(this.children).forEach((comp) => {
      result[comp.children.key.getView()] = comp.exposingInfo();
    })
    return result;
  }

  genNewName(editorState: EditorState) {
    const name = editorState.getNameGenerator().genItemName("variable");
    return name;
  }

  add(editorState: EditorState, extraInfo?: any) {
    const name = this.genNewName(editorState);

    this.dispatch(
      this.pushAction({
          key: name,
          value: '',
      })
    );
  }
  propertyView(params: VariablesParams): ReactNode {
    return (
      <VariableListPropertyViewWrapper>
        {(editorState: EditorState) => (
          <ControlPropertyViewWrapper {...params}>
            <KeyValueList
              allowDeletingAll
              list={this.getView().map((child) => child.getPropertyView())}
              onAdd={() => this.add(editorState)}
              onDelete={(item, index) => this.dispatch(this.deleteAction(index))}
            />
          </ControlPropertyViewWrapper>
        )}
      </VariableListPropertyViewWrapper>
    );
  }
};
