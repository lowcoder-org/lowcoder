import { MentionComp } from "comps/comps/textInputComp/mentionComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function MentionCompExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description={trans("componentDoc.basicDemoDescription")}
      >
        <Example
          title={trans("componentDoc.value")}
          config={{
          }}
          compFactory={MentionComp}
        />
      </ExampleGroup>
    </>
  );
}
