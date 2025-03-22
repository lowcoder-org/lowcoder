import { TextComp } from "comps/comps/textComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";
import { Left } from "icons";

export default function TextExample() {
  const nameMap: Record<string, string> = {
    type: trans("componentDoc.format"),
    text: trans("componentDoc.content"),
  };
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description={trans("componentDoc.basicDemoDescription")}
      >
        <Example
          title="markdown"
          config={{
            text: trans("componentDoc.markdownDemoText"),
            type: "markdown",
          }}
          nameMap={nameMap}
          compFactory={TextComp}
        />
        <Example
          title={trans("componentDoc.text")}
          config={{
            text: trans("componentDoc.demoText"),
            type: "text",
          }}
          nameMap={nameMap}
          compFactory={TextComp}
        />
        <Example
          title="Hiding the Text component"
          config={{
            text: trans("componentDoc.markdownDemoText"),
            type: "markdown",
            hidden: true,
          }}
          nameMap={nameMap}
          compFactory={TextComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Text Alignment"
        description=""
      >
        <Example
          title="LEFT"
          config={{
            text: trans("componentDoc.markdownDemoText"),
            type: "markdown",
            horizontalAlignment: "left",
          }}
          nameMap={nameMap}
          compFactory={TextComp}
        />
        <Example
          title="RIGHT"
          config={{
            text: trans("componentDoc.markdownDemoText"),
            type: "markdown",
            horizontalAlignment: "right",
          }}
          nameMap={nameMap}
          compFactory={TextComp}
        />
        <Example
          title="CENTER"
          config={{
            text: trans("componentDoc.markdownDemoText"),
            type: "markdown",
            horizontalAlignment: "center",
          }}
          nameMap={nameMap}
          compFactory={TextComp}
        />
        <Example
          title="JUSTIFIED"
          config={{
            text: trans("componentDoc.markdownDemoText"),
            type: "markdown",
            horizontalAlignment: "justify",
          }}
          nameMap={nameMap}
          compFactory={TextComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties on the Progress Bar Component."
      >
      <Example
        title="Margin & Padding"
        width={500}
        config={{
          text: trans("componentDoc.markdownDemoText"),
          type: "markdown",
          style:{
            "margin": "10px",
            "padding": "10px",
            "border": "#222222",
            "borderStyle": "solid",
            "borderWidth": "2px",
          },
        }}
        compFactory={TextComp}
      />
      <Example
        title="Text Properties"
        width={500}
        config={{
          text: trans("componentDoc.markdownDemoText"),
          type: "markdown",
          style:{
            "text": "#E67373",
            "textSize": "20px",
            "textWeight": "bold",
            "fontStyle": "italic",
            "fontFamily": "Courier New",
          },
        }}
        compFactory={TextComp}
      />
      <Example
        title="Border Properties"
        width={500}
        config={{
          text: trans("componentDoc.markdownDemoText"),
          type: "markdown",
          style:{
            "borderStyle": "solid",
            "border": "#00FFFF",
            "borderWidth": "3px",
            "radius": "10px",
            "padding": "10px",
          },
        }}
        compFactory={TextComp}
      />
      <Example
        title="Text Rotation - 90 deg"
        width={500}
        config={{
          text: trans("componentDoc.markdownDemoText"),
          type: "markdown",
          style:{
            "rotation": "90deg",
          },
        }}
        compFactory={TextComp}
      />

      <Example
        title="Text Rotation - 180 deg"
        width={500}
        config={{
          text: trans("componentDoc.markdownDemoText"),
          type: "markdown",
          style:{
            "rotation": "180deg",
          },
        }}
        compFactory={TextComp}
      /> 
      </ExampleGroup>

      <ExampleGroup
        title="Animation Style"
        description="The Following Examples Show different animations on the Progress Bar Component."
      >
        <Example
          title="Bounce Animation"
          config={{
            text: "### 👋 Hello! Welcome to Lowcoder",
            showInfo: true,
            animationStyle: {
              "animation": "bounce",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={TextComp}
        />
        <Example
          title="Swing Animation"
          config={{
            text: "### 👋 Hello! Welcome to Lowcoder",
            showInfo: true,
            animationStyle: {
              "animation": "swing",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={TextComp}
        />
        <Example
          title="Tada Animation"
          config={{
            text: "### 👋 Hello! Welcome to Lowcoder",
            showInfo: true,
            animationStyle: {
              "animation": "tada",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={TextComp}
        />
      </ExampleGroup>
    </>
  );
}
