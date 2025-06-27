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
          hideSettings={true}
          width={1000}
          height={600}
          config={{
            url: "https://www.wikipedia.org/",
          }}
          compFactory={IFrameComp}
        />
        <Example
          title="Hiding the IFrame Component"
          hideSettings={true}
          width={1000}
          height={600}
          config={{
            url: "https://www.wikipedia.org/",
            hidden: true,
          }}
          compFactory={IFrameComp}
        />
      </ExampleGroup>

    </>
  );
}
