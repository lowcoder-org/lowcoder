import { IFrameComp } from "comps/comps/iframeComp";
import { trans } from "i18n";
import Example from "../common/Example";
import ExampleGroup from "../common/ExampleGroup";

export default function IFrameExample() {
  return (
    <>
      <ExampleGroup
        title="Basic Usage"
        description={trans("componentDoc.basicDemoDescription")}
      >
        <Example
          title="IFrame Component"
          config={{
            url: "https://lowcoder.cloud/",
          }}
          compFactory={IFrameComp}
        />
        <Example
          title="Hiding the IFrame Component"
          config={{
            url: "https://lowcoder.cloud/",
            hidden: true,
          }}
          compFactory={IFrameComp}
        />
      </ExampleGroup>
    </>
  );
}
