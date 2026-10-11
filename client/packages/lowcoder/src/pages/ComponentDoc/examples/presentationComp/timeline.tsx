import { TimeLineComp } from "comps/comps/timelineComp/timelineComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function TimeLineExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the TimeLine Component."
      >
        <Example
          title="Default Timeline Component"
          width={500}
          hideSettings={true}
          config={{
          }}
          compFactory={TimeLineComp}
        />
        <Example
          title="Hiding the TimeLine Component"
          width={500}
          config={{
            hidden: true,
          }}
          compFactory={TimeLineComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Layout Options"
        description="The Following Examples Show the different Layout options of the TimeLine Component."
      >
        <Example
          title="Display Order - Alternate Content Order"
          width={500}
          config={{
            mode: "alternate",
          }}
          compFactory={TimeLineComp}
        />
         <Example
          title="Display Order - Content Right"
          width={500}
          config={{
            mode: "left",
          }}
          compFactory={TimeLineComp}
        />
         <Example
          title="Display Order - Content Left"
          width={500}
          config={{
            mode: "right",
          }}
          compFactory={TimeLineComp}
        />
        <Example
          title="Pending Node Text - Empty [ When Set, Then a Last Node With the Text and a Waiting Indicator Will Be Displayed. ]"
          width={500}
          config={{
            pending: "",
          }}
          compFactory={TimeLineComp}
        />
        <Example
          title="Newest Event First"
          width={500}
          config={{
            reverse: true,
          }}
          compFactory={TimeLineComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties of the TimeLine Component."
      >
        <Example
          title="Background Color"
          width={500}
          config={{
            style:{
              "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
            },
          }}
          compFactory={TimeLineComp}
        />
        <Example
          title="Title and Sub-Title Color"
          width={500}
          config={{
            style:{
              "titleColor": "#E68E50",
              "subTitleColor": "#36B389",
            },
          }}
          compFactory={TimeLineComp}
        />
        <Example
          title="Label Color"
          width={500}
          config={{
            style:{
              "labelColor": "#FF01B8",
            },
          }}
          compFactory={TimeLineComp}
        />
        <Example
          title="Margin & Padding"
          width={500}
          config={{
            style:{
              "background": "linear-gradient(135deg, #00FFFF 0%, #00FFFF 100%)",
              "margin": "10px",
              "padding": "50px",
            },
          }}
          compFactory={TimeLineComp}
        />
        <Example
          title="Border Radius"
          width={500}
          config={{
            style:{
              "background": "linear-gradient(135deg, #00FFFF 0%, #00FFFF 100%)",
              "radius": "15px"
            },
          }}
          compFactory={TimeLineComp}
        />
      </ExampleGroup>
    </>
  );
}
