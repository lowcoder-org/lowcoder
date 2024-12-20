import { AutoCompleteComp } from "comps/comps/autoCompleteComp/autoCompleteComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function AutoCompleteExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description={trans("componentDoc.basicDemoDescription")}
      >
        <Example
          title={trans("componentDoc.value")}
          config={{
            items: "[\n  {\n    \"value\": \"1-BeiJing\",\n    \"label\": \"北京\"\n  },\n  {\n    \"value\": \"2-ShangHai\",\n    \"label\": \"上海\"\n  },\n  {\n    \"value\": \"3-GuangDong\",\n    \"label\": \"广东\"\n  },\n  {\n    \"value\": \"4-ShenZhen\",\n    \"label\": \"深圳\"\n  }\n]"

          }}
          compFactory={AutoCompleteComp}
        />
      </ExampleGroup>
    </>
  );
}
