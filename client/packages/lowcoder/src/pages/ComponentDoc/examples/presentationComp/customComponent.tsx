import { CustomComp } from "comps/comps/customComp/customComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function CustomCompExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Image Carousel Component."
      >
        <Example
          title="Image Carousel Component"
          width={500}
          height={500}
          config={{
          }}
          compFactory={CustomComp}
        />
      </ExampleGroup>
    </>
  );
}
