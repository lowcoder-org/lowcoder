import { AutoCompleteComp } from "comps/comps/autoCompleteComp/autoCompleteComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const items=[
  {
    "value": "1-BeiJing",
    "label": "北京"
  },
  {
    "value": "2-ShangHai",
    "label": "上海"
  },
  {
    "value": "3-GuangDong",
    "label": "广东"
  },
  {
    "value": "4-ShenZhen",
    "label": "深圳"
  }
];

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
            items: items,
          }}
          compFactory={AutoCompleteComp}
        />
      </ExampleGroup>
    </>
  );
}
