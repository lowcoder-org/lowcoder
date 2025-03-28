import { simpleMultiComp } from "../../generators";
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
import { migrateOldData } from "@lowcoder-ee/comps/generators/simpleGenerators";

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
const VariableItem = class extends simpleMultiComp({
  key: SimpleNameComp,
  value: StringControl,
}) {
  propertyView(params: VariablesParams): ReactNode {
    return (
      <>
        <div style={{ display: "flex", gap: "8px", flexGrow: 1 }}>
          <VariableKey
            children={this.children}
            dispatch={this.dispatch}
            />
          <div style={{ width: "232px", flexGrow: 1 }}>
            {this.children.value.propertyView({ placeholder: "value" })}
          </div>
        </div>
      </>
    )
  }
}

const VariableListPropertyViewWrapper = ({children}: any) => {
  const editorState = useContext(EditorContext);
  return children(editorState);
}

export const VariablesComp = class extends list(VariableItem) {
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
              list={this.getView().map((child) => child.propertyView(params))}
              onAdd={() => this.add(editorState)}
              onDelete={(item, index) => this.dispatch(this.deleteAction(index))}
            />
          </ControlPropertyViewWrapper>
        )}
      </VariableListPropertyViewWrapper>
    );
  }
};
