import {MultiCompBuilder, withDefault} from "../../generators";
import { keyValueListControl } from "../../controls/keyValueListControl";

export const VariablesComp = new MultiCompBuilder(
  {
    variables: withDefault(keyValueListControl(false, [], "variable"), [{ key: "", value: "" }]),
  },
  (props) => props //props.variables
  )
  .setPropertyViewFn((children) => (
    <>
      {children.variables.propertyView({})}
    </>
  ))
  .build();
