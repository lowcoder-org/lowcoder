import {MultiCompBuilder, withDefault} from "../../generators";
import {keyValueListControl} from "lowcoder-sdk";

export const VariablesComp = new MultiCompBuilder(
  {
    variables: withDefault(keyValueListControl(), [{ key: "", value: "" }]),
  },
  (props) =>
    props.variables
  )
  .setPropertyViewFn((children) => (
    <>
      {children.variables.propertyView({})}
    </>
  ))
  .build();
