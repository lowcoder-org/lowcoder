import { IconComp } from "comps/comps/iconComp";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function IconExample() {
    return (
      <>
        <ExampleGroup
          title="Basic Usage"
          description="The Following Examples Show the Basic Usage of the Icon Component."
        >
          <Example
            title="A simple Icon component"
            width={120}
            height={60}
            config={{
              icon: "/icon:antd/homefilled",
            }}
            compFactory={IconComp}
          />
          <Example
            title="Hiding the Icon component"
            width={120}
            height={60}
            config={{
              icon: "/icon:solid/angles-down",
              hidden: true,
            }}
            compFactory={IconComp}
          />
          <Example
            title="Icon Size - Auto"
            width={120}
            height={60}
            config={{
              icon: "/icon:solid/apple-whole",
              autoHeight: "auto",
            }}
            compFactory={IconComp}
          />
          <Example
            title="Icon Size - Fixed"
            width={120}
            height={60}
            config={{
              icon: "/icon:solid/arrows-spin",
              autoHeight: "fixed",
              iconSize: "30",
            }}
            compFactory={IconComp}
          />
          <Example
            title="Icon Size - Fixed"
            width={120}
            config={{
              icon: "/icon:solid/arrows-spin",
              autoHeight: "fixed",
              iconSize: "60",
            }}
            compFactory={IconComp}
          />
        </ExampleGroup>
      </>
    );
  }