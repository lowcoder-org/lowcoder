import { RatingComp } from "comps/comps/ratingComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function RatingExample() {
  const nameMap: Record<string, string> = {
    max: trans("componentDoc.maxRating"),
  };
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description={trans("componentDoc.basicDemoDescription")}
      >
        <Example
          title={trans("componentDoc.default")}
          config={{
            defaultValue: "4",
            disabled: "false",
          }}
          compFactory={RatingComp}
        />
        <Example
          title={trans("componentDoc.notSelect")}
          config={{
            disabled: "false",
            defaultValue: "0",
          }}
          compFactory={RatingComp}
        />
        <Example
          title={trans("componentDoc.disabled")}
          config={{
            disabled: "true",
            defaultValue: "2",
          }}
          compFactory={RatingComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.labelText")} description="">
        <Example
          title={trans("componentDoc.leftLeftAlign")}
          config={{
            label: {
              text: trans("componentDoc.labelText"),
              position: "row",
              align: "left",
            },
            defaultValue: "4",
          }}
          compFactory={RatingComp}
        />
        <Example
          title={trans("componentDoc.leftRightAlign")}
          config={{
            label: {
              text: trans("componentDoc.labelText"),
              position: "row",
              align: "right",
            },
            defaultValue: "4",
          }}
          compFactory={RatingComp}
        />
        <Example
          title={trans("componentDoc.topLeftAlign")}
          config={{
            label: {
              text: trans("componentDoc.labelText"),
              position: "column",
              align: "left",
            },
            defaultValue: "4",
          }}
          compFactory={RatingComp}
        />
        <Example
          title={trans("componentDoc.topRightAlign")}
          config={{
            label: {
              text: trans("componentDoc.labelText"),
              position: "column",
              align: "right",
            },
            defaultValue: "4",
          }}
          compFactory={RatingComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.style")}>
        <Example
          title={trans("componentDoc.maxRating")}
          config={{
            defaultValue: "4",
            max: "6",
          }}
          nameMap={nameMap}
          compFactory={RatingComp}
        />
        <Example
          title={trans("componentDoc.halfSelect")}
          config={{
            max: "6",
            defaultValue: "3.5",
            allowHalf: "true",
          }}
          compFactory={RatingComp}
        />
      </ExampleGroup>
    </>
  );
}
