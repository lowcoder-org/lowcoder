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
          config={{
            title: "%d Comments in Total",
          }}
          compFactory={CommentComp}
        />
        <Example
          title="Hiding the Comment Component"
          config={{
            hidden: true,
          }}
          compFactory={CommentComp}
        />
        <Example
          title="Disallowing Users to Comment"
          config={{
            sendCommentAble: false,
          }}
          compFactory={CommentComp}
        />
        <Example
          title="Allowing Users to Delete a Comment"
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
          config={{
            buttonText:"Click on me to Comment",
            placeholder:"I am Placeholder text on the Comment Component :)",
          }}
          compFactory={CommentComp}
        />
      </ExampleGroup>
    </>
  );
}
