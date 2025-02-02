import { RichTextEditorComp } from "comps/comps/richTextEditorComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function InputExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description={trans("componentDoc.basicDemoDescription")}
      >
        <Example 
         title={trans("componentDoc.placeholder")}
         config={{
           placeholder: "Let us know about yourself!",
         }}
         compFactory={RichTextEditorComp} 
       />
       <Example
         title="Default Value"
         config={{
          placeholder: "Let us know about yourself!",
          value: "I am an Experienced FullStack Web Developer ...",
         }}
         compFactory={RichTextEditorComp} 
       />
      </ExampleGroup>

      <ExampleGroup title="Layout" description="">
        <Example
          title={trans("componentDoc.fixed")}
          width={340}
          config={{
            placeholder: "Let us know about yourself!",
            autoHeight: "fixed",
            contentScrollBar: true,
          }}
          compFactory={RichTextEditorComp}
        />
        <Example
          title={trans("componentDoc.auto")}
          width={340}
          config={{
            placeholder: "Let us know about yourself!",
            autoHeight: "auto",
            hideToolbar: false,
          }}
          compFactory={RichTextEditorComp}
        />
        <Example
          title= "Hide Toolbar"
          width={340}
          config={{
            placeholder: "Let us know about yourself!",
            hideToolbar: true,
          }}
          compFactory={RichTextEditorComp}
        />
      </ExampleGroup>
    </>
  );
}
