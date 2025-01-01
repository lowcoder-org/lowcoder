import { IconComp } from "comps/comps/iconComp";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function IconExample() {
    return (
      <>
        <ExampleGroup
          title="Basic Usage"
        >
          <Example
            title="Icon"
            width={'80px'}
            height={'80px'}
            config={{
              icon: "/icon:solid/align-justify",
              iconSize: "20",
              autoHeight: false,
            }}
            compFactory={IconComp}
          />
        </ExampleGroup>
      </>
    );
  }