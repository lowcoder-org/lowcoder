import { withTypeAndChildrenAbstract } from "comps/generators/withType";
import { trans } from "i18n";
import { CompConstructor } from "lowcoder-core";
import { Dropdown, ValueFromOption } from "lowcoder-design";
import { buildQueryCommand, FunctionProperty, toQueryView } from "./queryCompUtils";

const CommandOptions = [
  { label: trans("lowcoderQuery.queryOrgUsers"), value: "queryOrgUsers" },
] as const;

const CommandMap: Record<
  ValueFromOption<typeof CommandOptions>,
  CompConstructor<FunctionProperty[]>
> = {
  queryOrgUsers: buildQueryCommand({}),
};

const LowcoderTmpQuery = withTypeAndChildrenAbstract(CommandMap, "queryOrgUsers", {});

export class LowcoderQuery extends LowcoderTmpQuery {
  override getView() {
    const params = this.children.comp.getView();
    return toQueryView(params);
  }

  override getPropertyView() {
    return (
      <>
        <Dropdown
          label={trans("query.method")}
          placement={"bottom"}
          options={CommandOptions}
          value={this.children.compType.getView()}
          onChange={(value) => this.dispatch(this.changeValueAction({ compType: value, comp: {} }))}
        />
        {this.children.comp.getPropertyView()}
      </>
    );
  }
}
