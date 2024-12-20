import { ListViewComp } from "comps/comps/listViewComp/listViewComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function ListViewExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description={trans("componentDoc.basicDemoDescription")}
      >
        <Example
          title={trans("componentDoc.notComplete")}
          config={{
          }}
          compFactory={ListViewComp}
        />
      </ExampleGroup>
    </>
  );
}
