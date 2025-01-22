import { StepComp } from "comps/comps/selectInputComp/stepControl";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function StepControlExample() {
    return (
      <>

        <ExampleGroup
          title="Basic Usage"
          description="The Following Examples Show the Basic Usage of the Step Component."
        >
          <Example
            title="Step Component"
            config={{
            }}
            compFactory={StepComp}
          />
          <Example
            title="Hiding the Step Component"
            config={{
              hidden: true,
            }}
            compFactory={StepComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Layout"
          description="The Following Examples Show the Layout options on the Step Component."
        >
          <Example
            title="Step Size - Small"
            config={{
              size: "small",
            }}
            compFactory={StepComp}
          />
          <Example
            title="Step Size - Default"
            config={{
              size: "default",
            }}
            compFactory={StepComp}
          />
          <Example
            title="Step Type - Navigation"
            config={{
              displayType:"navigation",
            }}
            compFactory={StepComp}
          />
          <Example
            title="Step Type - Inline"
            config={{
              displayType:"inline",
            }}
            compFactory={StepComp}
          />
          <Example
            title="Step Type - Standard"
            config={{
              displayType:"default",
            }}
            compFactory={StepComp}
          />
          <Example
            title="Step Direction - Vertical"
            config={{
              direction:"vertical",
            }}
            compFactory={StepComp}
          />
          <Example
            title="Step Direction - Horizontal"
            config={{
              direction:"horizontal",
            }}
            compFactory={StepComp}
          />
          <Example
            title="Step Label Placement - Vertical"
            config={{
              labelPlacement:"vertical",
            }}
            compFactory={StepComp}
          />
          <Example
            title="Step Label Placement - Horizontal"
            config={{
              labelPlacement:"horizontal",
            }}
            compFactory={StepComp}
          />
          <Example
            title="Minimum Horizontal Width - 200px"
            config={{
              minHorizontalWidth: "200px",
            }}
            compFactory={StepComp}
          />
          <Example
            title="Minimum Horizontal Width - 400px"
            config={{
              minHorizontalWidth: "400px",
            }}
            compFactory={StepComp}
          />
        </ExampleGroup>      
      </>
    );
  }