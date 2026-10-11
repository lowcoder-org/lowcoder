import { SignatureComp } from "comps/comps/signatureComp";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function SignatureExample() {
    return (
      <>
        <ExampleGroup
          title="Basic Usage"
          description="The Following Examples Show the Basic Usage of the Signature Component."
        >
            <Example
            title="Showing Hints/Placeholder Text"
            height={300}
            width={400}
            config={{ 
                tips: "This is a Signature Component. Please, Sign here",
            }}
            compFactory={SignatureComp}
          />
          <Example
            title="Hiding the Signature Component"
            height={300}
            width={400}
            config={{ 
                hidden: true,
            }}
            compFactory={SignatureComp}
          />
          <Example
            title="Show/Hide the Undo Icon"
            height={300}
            width={400}
            config={{ 
                showUndo: false,
            }}
            compFactory={SignatureComp}
          />
          <Example
            title="Show/Hide the Clear Icon"
            height={300}
            width={400}
            config={{ 
                showClear: false,
            }}
            compFactory={SignatureComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Label Positioning & Alignment"
          description="The Following Examples Show the Label Positioning & Alignment of the Color Picker Component."
        >
          <Example
            title="Setting Label Text and ToolTip"
            height={300}
            width={400}
            config={{ 
                label:{
                    text: "Sign Here",
                    tooltip: "This is a ToolTip on Signature Component, which should get dispalyed when User hovers over it",
                }
            }}
            compFactory={SignatureComp}
          />
          <Example
            title="Setting Width of the Label"
            height={300}
            width={400}
            config={{                
                label:{
                    text: "Sign Here",
                    width: "15",
                }  
            }}
            compFactory={SignatureComp}
          />
          <Example
            title="Label Position - TOP"
            height={300}
            width={400}
            config={{ 
                label:{
                    text: "Sign Here",
                    position: "column",
                }
            }}
            compFactory={SignatureComp}
          />
          <Example
            title="Label Position - ROW"
            height={300}
            width={400}
            config={{ 
                label:{
                    text: "Sign Here",
                    position: "row",
                }
            }}
            compFactory={SignatureComp}
          />
          <Example
            title="Label Alignment - RIGHT"
            height={300}
            width={400}
            config={{ 
                label:{
                    text: "Sign Here",
                    position: "column",
                    align: "right",
                }
            }}
            compFactory={SignatureComp}
          />
          <Example
            title="Label Alignment - LEFT"
            height={300}
            width={400}
            config={{ 
                label:{
                    text: "Sign Here",
                    position: "column",
                    align: "left",
                }
            }}
            compFactory={SignatureComp}
          />
        </ExampleGroup>

        <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties on the Cascader Component."
        >
        <Example
          title="Background Color, Border Radius,Style,Width,Color"
          height={300}
          width={400}
          config={{
            style: {
              "background": "#00FFFF",
              "border": "#3377FF",
              "radius": "10px",
              "borderWidth": "3px",
              "borderStyle": "solid",
            },
          }}
          compFactory={SignatureComp}
        />
        <Example
          title="Margin & Padding"
          height={300}
          width={400}
          config={{
            style: {
              "background": "#00FFFF",
              "border": "#3377FF",
              "radius": "10px",
              "borderWidth": "3px",
              "margin": "10px",
              "padding": "10px",
              "borderStyle": "dashed",
            },
          }}
          compFactory={SignatureComp}
        />
        <Example
          title="Opacity - 0.2"
          height={300}
          width={400}
          config={{
            style: {
              "opacity": "0.2",
            },
          }}
          compFactory={SignatureComp}
        />
        <Example
          title="Opacity - 0.5"
          height={300}
          width={400}
          config={{
            style: {
              "opacity": "0.5",
            },
          }}
          compFactory={SignatureComp}
        />
        <Example
          title="Opacity - 0.7"
          height={300}
          width={400}
          config={{
            style: {
              "opacity": "0.7",
            },
          }}
          compFactory={SignatureComp}
        />
        <Example
          title="Opacity - 1"
          height={300}
          width={400}
          config={{
            style: {
              "opacity": "1",
            },
          }}
          compFactory={SignatureComp}
        />
        <Example
          title="Label - Text Color, Size, Weight, Font family, Border properties"
          height={300}
          width={400}
          config={{
            label:{
              text: "Sign Here",
              position: "column",
            },
            labelStyle: {
              "margin": "5px",
              "padding": "5px",
              "label": "#3377FF",
              "textTransform": "Uppercase",
              "textDecoration": "underline",
              "textSize": "13px",
              "textWeight": "bold",
              "fontFamily": "Courier New",
              "fontStyle": "Italic",
              "border": "#36B389",
              "borderStyle": "solid",
              "borderWidth": "2px"
            },
          }}
          compFactory={SignatureComp}
        />
        <Example
          title="Input Field Style"
          height={300}
          width={400}
          config={{
            style: {
              "background": "#00FFFF",
              "border": "#3377FF",
              "radius": "10px",
              "borderWidth": "3px",
              "margin": "10px",
              "padding": "10px",
              "borderStyle": "solid",
            },
            inputFieldStyle: {
              "background": "#00BCA1",
              "border": "#013AFF",
              "radius": "10px",
              "text": "#222222"
            },
          }}
          compFactory={SignatureComp}
        />
      </ExampleGroup>
      </>
    );
  }