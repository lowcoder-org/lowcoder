import { ColorPickerComp } from "comps/comps/mediaComp/colorPickerComp";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function ColorPickerExample() {
    return (
      <>
        <ExampleGroup
          title="Basic Usage"
          description="The Following Examples Show the Basic Usage of the Color Picker Component."
        >
          <Example
            title="Setting Default value"
            config={{ 
                value:"#abc",

            }}
            compFactory={ColorPickerComp}
          />
          <Example
            title="Disabling the Component"
            config={{                
                disabled: true,
            }}
            compFactory={ColorPickerComp}
          />
          <Example
            title="Hiding the Component"
            config={{ 
                hidden: true,
            }}
            compFactory={ColorPickerComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Label Positioning & Alignment"
          description="The Following Examples Show the Label Positioning & Alignment of the Color Picker Component."
        >
          <Example
            title="Setting Label Text and ToolTip"
            config={{ 
                label:{
                    text: "Pick Color",
                    tooltip: "This is a ToolTip on ColorPicker Component, which should get dispalyed when User hovers over it",
                }
            }}
            compFactory={ColorPickerComp}
          />
          <Example
            title="Setting Width of the Label"
            config={{                
                label:{
                    text: "Pick Color",
                    width: "15",
                }  
            }}
            compFactory={ColorPickerComp}
          />
          <Example
            title="Label Position - TOP"
            config={{ 
                label:{
                    position: "column",
                }
            }}
            compFactory={ColorPickerComp}
          />
          <Example
            title="Label Position - ROW"
            config={{ 
                label:{
                    position: "row",
                }
            }}
            compFactory={ColorPickerComp}
          />
          <Example
            title="Label Alignment - RIGHT"
            config={{ 
                label:{
                    position: "column",
                    align: "right",
                }
            }}
            compFactory={ColorPickerComp}
          />
          <Example
            title="Label Alignment - LEFT"
            config={{ 
                label:{
                    position: "column",
                    align: "left",
                }
            }}
            compFactory={ColorPickerComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Advanced Usage"
          description="The Following Examples Show the Advanced Usage of the Color Picker Component."
        >
          <Example
            title="Triggers Event - Click"
            config={{ 
                trigger: "click",
            }}
            compFactory={ColorPickerComp}
          />
          <Example
            title="Triggers Event - Hover"
            config={{ 
                trigger: "hover",
            }}
            compFactory={ColorPickerComp}
          />
          <Example
            title="Disabling the Alpha Section"
            config={{                
                disabledAlpha: true,
            }}
            compFactory={ColorPickerComp}
          />
          <Example
            title="Show Color Presets"
            config={{ 
                showPresets: true,
            }}
            compFactory={ColorPickerComp}
          />
        </ExampleGroup>

        <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties of the Color Picker Component."
        >
        <Example
          title="Background Color, Margin & Padding"
          config={{
            style: {
              "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
              "margin" : "15px",
              "padding" : "15px",
            },
          }}
          compFactory={ColorPickerComp}
        />
        <Example
          title="Border Style, Color, Width & Radius"
          config={{
            style: {
              "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
              "margin": "15px",
              "padding": "15px",
              "border": "#FF0303",
              "borderStyle": "dashed",
              "radius": "10px",
              "borderWidth": "3px"
            },
          }}
          compFactory={ColorPickerComp}
        />
        <Example
          title="Label - Text Color, Size, Weight, Font family, Border properties"
          config={{
            style: {
              "margin": "5px",
              "padding": "5px",
              "label": "#3377FF",
              "textTransform": "Uppercase",
              "textDecoration": "underline",
              "textWeight": "bold",
              "fontFamily": "Courier New",
              "fontStyle": "Italic"
            },
          }}
          compFactory={ColorPickerComp}
        />
        <Example
          title="Accent color"
          config={{
            style: {
              "accent": "#fff",
            },
          }}
          compFactory={ColorPickerComp}
        />
        </ExampleGroup>
      </>
    );
  }