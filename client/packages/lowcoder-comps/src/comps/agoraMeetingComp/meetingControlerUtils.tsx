import { CheckBox, controlItem, Switch, SwitchWrapper } from "lowcoder-design";
import { ReactNode } from "react";
import { ControlParams } from "comps/controls/controlParams";
import { SimpleComp } from "lowcoder-core";

export class BoolShareVideoControl extends SimpleComp<boolean> {
  readonly IGNORABLE_DEFAULT_VALUE = false;
  protected getDefaultValue(): boolean {
    return false;
  }

  getPropertyView(): ReactNode {
    return (
      <Switch
        value={this.value}
        onChange={(x) => this.dispatchChangeValueAction(x)}
      />
    );
  }

  propertyView(params: ControlParams & { type?: "switch" | "checkbox" }) {
    return controlItem(
      { filterText: params.label },
      <SwitchWrapper {...params}>
        {params.type === "checkbox" ? (
          <CheckBox
            style={{ marginRight: "8px" }}
            checked={this.value}
            onChange={(x) => this.dispatchChangeValueAction(x.target.checked)}
          />
        ) : (
          this.getPropertyView()
        )}
      </SwitchWrapper>
    );
  }
}
