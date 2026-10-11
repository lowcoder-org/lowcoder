import { FileViewerComp } from "comps/comps/fileViewerComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function FileViewerExample() {
  const blackListConfig: string[] = [trans("componentDoc.src")];
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the File Viewer Component."
      >
        <Example
          title="Default File Viewer component"
          width={1000}
          height={600}
          blackListConfig={blackListConfig}
          hideSettings={true}
          config={{
            src: "https://pdfa.org/wp-content/uploads/2021/06/The-Low-Code-Revolution-and-PDF.pdf",
          }}
          compFactory={FileViewerComp}
        />
        <Example
          title="Hiding the File Viewer component"
          width={1000}
          height={600}
          blackListConfig={blackListConfig}
          hideSettings={true}
          config={{
            src: "https://pdfa.org/wp-content/uploads/2021/06/The-Low-Code-Revolution-and-PDF.pdf",
            hidden: true,
          }}
          compFactory={FileViewerComp}
        />
        
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties of the File Viewer Component."
      >
        <Example
          title="Background Color, Margin & Padding"
          width={1000}
          height={600}
          blackListConfig={blackListConfig}
          hideSettings={true}
          config={{
            src: "https://pdfa.org/wp-content/uploads/2021/06/The-Low-Code-Revolution-and-PDF.pdf",
            style: {
              "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
              "margin": "10px",
              "padding": "40px",
            },
          }}
          compFactory={FileViewerComp}
        />
        <Example
          title="Border Color, Radius & Width"
          width={1000}
          height={600}
          blackListConfig={blackListConfig}
          hideSettings={true}
          config={{
            src: "https://pdfa.org/wp-content/uploads/2021/06/The-Low-Code-Revolution-and-PDF.pdf",
            style: {
              "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
              "border": "#3377FF",
              "radius": "20px",
              "margin": "10px",
              "padding": "40px",
              "borderWidth": "3px"
            },
          }}
          compFactory={FileViewerComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Animation Style"
        description="The Following Examples Show different animations on the Cascader Component."
      >
        <Example
          title="Bounce Animation"
          width={1000}
          height={600}
          blackListConfig={blackListConfig}
          hideSettings={true}
          config={{
            src: "https://pdfa.org/wp-content/uploads/2021/06/The-Low-Code-Revolution-and-PDF.pdf",
            animationStyle: {
              "animation": "bounce",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={FileViewerComp}
        />
        <Example
          title="Swing Animation"
          width={1000}
          height={600}
          blackListConfig={blackListConfig}
          hideSettings={true}
          config={{
            src: "https://pdfa.org/wp-content/uploads/2021/06/The-Low-Code-Revolution-and-PDF.pdf",
             animationStyle: {
              "animation": "swing",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={FileViewerComp}
        />
        <Example
          title="Tada Animation"
          width={1000}
          height={600}
          blackListConfig={blackListConfig}
          hideSettings={true}
          config={{
            src: "https://pdfa.org/wp-content/uploads/2021/06/The-Low-Code-Revolution-and-PDF.pdf",
            animationStyle: {
              "animation": "tada",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={FileViewerComp}
        />
      </ExampleGroup>
    </>
  );
}
