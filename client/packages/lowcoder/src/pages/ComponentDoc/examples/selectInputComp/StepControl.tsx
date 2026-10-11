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
          <Example
            title="Start Step Numbers at - 0"
            config={{
              initialValue: "0",
            }}
            compFactory={StepComp}
          />
          <Example
            title="Start Step Numbers at - 1"
            config={{
              initialValue: "1",
            }}
            compFactory={StepComp}
          />
          <Example
            title="Start Step Numbers at - 2"
            config={{
              initialValue: "2",
            }}
            compFactory={StepComp}
          />
          <Example
            title="Selectable Steps - True"
            config={{
              selectable: true,
            }}
            compFactory={StepComp}
          />
          <Example
            title="Selectable Steps - False"
            config={{
              selectable: false,
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

        <ExampleGroup
          title="Styling Properties"
          description="The Following Examples Show the different Styling properties on the Step Control Component."
          >
          <Example
            title="Background Color, Border Radius,Style,Width,Color"
            config={{
              style: {
                "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                "border": "#0139FF",
                "borderStyle": "dashed",
                "radius": "10px",
                "borderWidth": "2px",
                "accent": "#FAD301",
              },
            }}
            compFactory={StepComp}
          />
          <Example
            title="Margin & Padding"
            config={{
              style: {
                "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                "margin": "5px",
                "padding": "10px",
                "border": "#0139FF",
                "borderStyle": "dashed",
                "radius": "10px",
                "borderWidth": "2px",
                "accent": "#FAD301",
              },
            }}
            compFactory={StepComp}
          />
          <Example
            title="Text Color, Size, Weight, Font family, Border properties"
            config={{
              style: {
                "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                "margin": "5px",
                "padding": "10px",
                "text": "#FF0404",
                "textTransform": "uppercase",
                "textDecoration": "underline",
                "textSize": "20px",
                "textWeight": "bold",
                "fontFamily": "Courier New",
                "fontStyle": "oblique",
                "border": "#0139FF",
                "borderStyle": "dashed",
                "radius": "10px",
                "borderWidth": "2px",
                "accent": "#FAD301",
              },
            }}
            compFactory={StepComp}
          />
        </ExampleGroup>
  
        <ExampleGroup
          title="Animation Style"
          description="The Following Examples Show different animations on the Step Control Component."
          >
          <Example
            title="Bounce Animation"
            width={600}
            config={{
              animationStyle: {
              "animation": "bounce",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
              },
            }}
            compFactory={StepComp}
          />
          <Example
            title="Swing Animation"
            width={600}
            config={{
              animationStyle: {
              "animation": "swing",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
              },
            }}
            compFactory={StepComp}
          />
          <Example
          title="Tada Animation"
          width={600}
          config={{
              animationStyle: {
              "animation": "tada",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
              },
          }}
          compFactory={StepComp}
        />
        </ExampleGroup>     
      </>
    );
  }