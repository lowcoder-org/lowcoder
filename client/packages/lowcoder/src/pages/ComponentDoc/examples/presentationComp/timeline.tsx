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
          title="Hiding the TimeLine Component"
          config={{
            hidden: true,
          }}
          compFactory={TimeLineComp}
        />
        <Example
          title="Display Order - Alternate Content Order"
          config={{
            mode: "alternate",
          }}
          compFactory={TimeLineComp}
        />
         <Example
          title="Display Order - Content Right"
          config={{
            mode: "left",
          }}
          compFactory={TimeLineComp}
        />
         <Example
          title="Display Order - Content Left"
          config={{
            mode: "right",
          }}
          compFactory={TimeLineComp}
        />
        <Example
          title="Pending Node Text - Empty [ When Set, Then a Last Node With the Text and a Waiting Indicator Will Be Displayed. ]"
          config={{
            pending: "",
          }}
          compFactory={TimeLineComp}
        />
        <Example
          title="Newest Event First"
          config={{
            reverse: true,
          }}
          compFactory={TimeLineComp}
        />
      </ExampleGroup>
    </>
  );
}
