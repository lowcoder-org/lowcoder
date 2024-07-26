import { MultiCompBuilder } from "comps/generators/multi";
import { withDefault } from "comps/generators/simpleGenerators";
import { BranchDiv } from "lowcoder-design";
import { KeyValue } from "types/common";
import { BoolControl } from "comps/controls/boolControl";
import { StringControl } from "comps/controls/codeControl";
import { keyValueListControl } from "../keyValueControl";
import { keyValueListToSearchStr } from "../../../util/appUtils";
import { trans } from "i18n";

const childrenMap = {
  url: StringControl,
  query: withDefault(keyValueListControl(false, [], "string"), [
    { key: "", value: "" },
  ]),
  hash: withDefault(keyValueListControl(false, [], "string"), [
    { key: "", value: "" },
  ]),
  inNewTab: BoolControl,
};

export const GoToURLAction = new MultiCompBuilder(childrenMap, (props) => {
  return () => {
    const queryParams = keyValueListToSearchStr(
      props.query.map((i) => i.getView() as KeyValue)
    );
    const hashParams = keyValueListToSearchStr(
      props.hash.map((i) => i.getView() as KeyValue)
    );
    const urlWithParams = `${props.url}${queryParams ? `?${queryParams}` : ""}${hashParams ? `#${hashParams}` : ""}`;

    window.open(urlWithParams, props.inNewTab ? "_blank" : "_self");
  };
})
  .setPropertyViewFn((children) => {
    return (
      <>
        <BranchDiv>
          {children.url.propertyView({
            label: "URL",
            layout: "vertical",
          })}
        </BranchDiv>
        <BranchDiv>
          {children.query.propertyView({
            label: trans("eventHandler.queryParams"),
            layout: "vertical",
          })}
        </BranchDiv>
        <BranchDiv>
          {children.hash.propertyView({
            label: trans("eventHandler.hashParams"),
            layout: "vertical",
          })}
        </BranchDiv>
        <BranchDiv $type="switch">
          {children.inNewTab.propertyView({
            label: trans("eventHandler.openInNewTab"),
            layout: "vertical",
          })}
        </BranchDiv>
      </>
    );
  })
  .build();
