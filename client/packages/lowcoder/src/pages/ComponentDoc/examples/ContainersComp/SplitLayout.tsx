import { SplitLayoutComp } from "comps/comps/splitLayout/splitLayout";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const columns= {
    "manual": [
        {
            "id": 0,
            "label": "Area 1",
            "key": "Area1",
            "minWidth": "10%",
            "maxWidth": "90%",
            "width": "50%",
            "collapsible": false,
            "background": "",
            "backgroundImage": "",
            "padding": ""
        },
        {
            "id": 1,
            "label": "Area 2",
            "key": "Area2",
            "minWidth": "10%",
            "maxWidth": "90%",
            "width": "50%",
            "collapsible": true,
            "background": "",
            "backgroundImage": "",
            "padding": ""
        },
        {
            "id": 2,
            "label": "Option 1",
            "key": "Option 1",
            "minWidth": "10%",
            "maxWidth": "90%",
            "width": "50%",
            "collapsible": false,
            "background": "",
            "backgroundImage": "",
            "padding": ""
        }
    ]
};

const bodyStyle= {
    background: "#FFFFFF",
    border: "#222222",
};

const columnStyle= {
    background: "#FFFFFF",
    border: "#222222",
    margin: "10px",
};

export default function SplitLayoutExample() {
    return (
      <>
        <ExampleGroup
          title="Basic Usage"
          description="The Following Examples Show the Basic Usage of the Split Layout Component."
        >
          <Example
            title="Default Component"
            hideSettings={true}
            width={1000}
            config={{
                bodyStyle: bodyStyle,
                columnStyle: columnStyle, 
            }}
            compFactory={SplitLayoutComp}
          />
          <Example
            title="Multiple Split Layout containers ( Click on the icon at the center on right side ) "
            hideSettings={true}
            width={1000}
            config={{
                columns: columns,
                bodyStyle: bodyStyle,
                columnStyle: columnStyle, 
            }}
            compFactory={SplitLayoutComp}
          />
          <Example
            title="Setting Minimum Width - 30%"
            hideSettings={true}
            width={1000}
            config={{
                columns: {
                    "manual": [
                        {
                            "id": 0,
                            "label": "Area 1",
                            "key": "Area1",
                            "minWidth": "30%",
                            "maxWidth": "90%",
                            "width": "50%",
                            "collapsible": false,
                            "background": "",
                            "backgroundImage": "",
                            "padding": ""
                        },
                        {
                            "id": 1,
                            "label": "Area 2",
                            "key": "Area2",
                            "minWidth": "30%",
                            "maxWidth": "90%",
                            "width": "50%",
                            "collapsible": true,
                            "background": "",
                            "backgroundImage": "",
                            "padding": ""
                        },
                        {
                            "id": 2,
                            "label": "Option 1",
                            "key": "Option 1",
                            "minWidth": "30%",
                            "maxWidth": "90%",
                            "width": "50%",
                            "collapsible": false,
                            "background": "",
                            "backgroundImage": "",
                            "padding": ""
                        }
                    ]
                },
                bodyStyle: bodyStyle,
                columnStyle: columnStyle, 
            }}
            compFactory={SplitLayoutComp}
          />
          <Example
            title="Setting Minimum Width - 10%"
            hideSettings={true}
            width={1000}
            config={{
                columns: columns,
                bodyStyle: bodyStyle,
                columnStyle: columnStyle, 
            }}
            compFactory={SplitLayoutComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Layout"
          description="The Following Examples Show the different layouts of the Split Layout Component."
        >
          <Example
            title="Split Layout Orientation - Vertical"
            hideSettings={true}
            width={1000}
            config={{
                bodyStyle: bodyStyle,
                columnStyle: columnStyle,
                orientation: "vertical",
            }}
            compFactory={SplitLayoutComp}
          />
          <Example
            title="Split Layout Orientation - Horizontal"
            hideSettings={true}
            width={1000}
            config={{
                bodyStyle: bodyStyle,
                columnStyle: columnStyle,
                orientation: "horizontal",
            }}
            compFactory={SplitLayoutComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Styling Properties"
          description="The Following Examples Show the different Styling properties on the Split Layout Component."
        >
          <Example
            title="Body Styling - Background Color, Border, Padding"
            hideSettings={true}
            width={1000}
            config={{
                bodyStyle: {
                    "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                    "border": "#222222",
                    "borderWidth": "2px",
                    "padding": "10px",
                },
                columnStyle: columnStyle,
            }}
            compFactory={SplitLayoutComp}
          />
          <Example
            title="Column Styling - Background Color, Border, Margin"
            hideSettings={true}
            width={1000}
            config={{
                bodyStyle: bodyStyle,
                columnStyle: {
                    "background": "linear-gradient(0deg, #f43b47 0%, #453a94 100%)",
                    "border": "#222222",
                    "borderWidth": "2px",
                    "borderStyle": "solid",
                    "margin": "10px",
                },
            }}
            compFactory={SplitLayoutComp}
          />
        </ExampleGroup>
      </>
    );
  }