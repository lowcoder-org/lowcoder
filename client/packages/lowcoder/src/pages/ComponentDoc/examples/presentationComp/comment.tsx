import { CommentComp } from "comps/comps/commentComp/commentComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function CommentExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Comment Component."
      >
        <Example
          title="Setting Title of the Comment Component"
          width={500}
          config={{
            title: "%d Comments in Total",
          }}
          compFactory={CommentComp}
        />
        <Example
          title="Hiding the Comment Component"
          width={500}
          config={{
            hidden: true,
          }}
          compFactory={CommentComp}
        />
        <Example
          title="Disallowing Users to Comment"
          width={500}
          config={{
            sendCommentAble: false,
          }}
          compFactory={CommentComp}
        />
        <Example
          title="Allowing Users to Delete a Comment"
          width={500}
          config={{
            deleteAble: true,
          }}
          compFactory={CommentComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Layout"
        description="The Following Examples Show the Layout options on Comment Component."
      >
        <Example
          title="Setting the Button Title and Placeholder Text on the Comment Component"
          width={500}
          config={{
            buttonText:"Click on me to Comment",
            placeholder:"I am Placeholder text on the Comment Component :)",
          }}
          compFactory={CommentComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties on the Comment Component."
        >
        <Example
          title="Background Color, Border Radius and Color"
          width={500}
          config={{
            style: {
              "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
              "margin": "10px",
              "padding": "20px",
              "radius": "20px",
            }
          }}
          compFactory={CommentComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Animation Style"
        description="The Following Examples Show different animations on the Comment Component."
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
          compFactory={CommentComp}
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
          compFactory={CommentComp}
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
        compFactory={CommentComp}
      />
      </ExampleGroup>
    </>
  );
}
