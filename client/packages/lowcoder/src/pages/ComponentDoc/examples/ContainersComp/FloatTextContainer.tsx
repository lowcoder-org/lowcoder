import { ContainerComp } from "comps/comps/containerComp/textContainerComp";
import { trans } from "i18n";
import { chartColorPalette } from "lowcoder-design";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const container = {
    "header": {
        "layout": {
            "643c61b9": {
                "i": "643c61b9",
                "h": 5,
                "w": 24,
                "x": 0,
                "y": 0
            }
        },
        "items": {
            "643c61b9": {
                "compType": "text",
                "comp": {
                    "text": "### Displayed Container Title",
                    "autoHeight": "auto",
                    "type": "markdown",
                    "horizontalAlignment": "left",
                    "contentScrollBar": true,
                    "verticalAlignment": "center",
                    "margin": {
                        "left": "",
                        "right": "",
                        "top": "",
                        "bottom": ""
                    },
                    "padding": {
                        "left": "",
                        "right": "",
                        "top": "",
                        "bottom": ""
                    },
                    "showDataLoadingIndicators": false,
                    "preventStyleOverwriting": false,
                    "appliedThemeId": "",
                    "version": "latest"
                },
                "name": "containerTitle1"
            }
        }
    },
    "body": {
        "0": {
            "view": {
                "layout": {
                    "157ca74a": {
                        "i": "157ca74a",
                        "h": 21,
                        "w": 24,
                        "x": 0,
                        "y": 0,
                        "pos": 0
                    }
                },
                "items": {
                    "157ca74a": {
                        "compType": "image",
                        "comp": {
                            "sourceMode": "standard",
                            "src": "https://framerusercontent.com/images/Ks478GmT2s9Ewl2BhCGGJWDqdKo.jpg?scale-down-to=4096",
                            "iconScoutAsset": {
                                "uuid": "",
                                "value": "",
                                "preview": ""
                            },
                            "style": {
                                "margin": "0px",
                                "padding": "0px"
                            },
                            "clipPath": "none",
                            "autoHeight": "fixed",
                            "restrictPaddingOnRotation": "image",
                            "enableOverflow": false,
                            "aspectRatio": "16 / 9",
                            "placement": "top",
                            "overflow": "hidden",
                            "positionX": "center",
                            "positionY": "center",
                            "showDataLoadingIndicators": false,
                            "preventStyleOverwriting": false,
                            "appliedThemeId": "",
                            "version": "latest"
                        },
                        "name": "image1"
                    }
                }
            }
        }
    },
    "footer": {
        "layout": {}
    },
    "showHeader": true,
    "showBody": true,
    "autoHeight": "auto",
    "showVerticalScrollbar": false,
    "horizontalGridCells": 24,
    "scrollbars": false,
    "style": {
        "borderWidth": "1px"
    },
    "appliedThemeId": ""
};

const text ="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi feugiat faucibus eleifend. Pellentesque eleifend, risus vel sagittis mattis, mauris ipsum tempor sapien, eu lobortis lacus libero a dui. Cras erat felis, rhoncus vestibulum consectetur et, ultrices ut purus. Sed a tortor orci. Vestibulum nec eleifend ante.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi feugiat faucibus eleifend. Pellentesque eleifend, risus vel sagittis mattis, mauris ipsum tempor sapien, eu lobortis lacus libero a dui. Cras erat felis, rhoncus vestibulum consectetur et, ultrices ut purus. Sed a tortor orci. Vestibulum nec eleifend ante.";

export default function FloatTextContainerExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Float Text Container Component."
      >
        <Example
          title="Default Container"
          hideSettings={true}
          height={400}
          width={600}
          config={{
            container: container,
            text: text,
            float: "left",
            horizontalAlignment: "justify",
            width: "60",
            type: "markdown",
          }}
          compFactory={ContainerComp}
        />
        <Example
          title="Hiding the Container"
          hideSettings={true}
          height={400}
          width={600}
          config={{
            container: container,
            text: text,
            float: "left",
            horizontalAlignment: "justify",
            width: "60",
            type: "markdown",
            hidden: true,
          }}
          compFactory={ContainerComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Advance Usage"
        description="The Following Examples Show the Advance Usage of the Float Text Container Component."
      >
        <Example
          title="Content Width - 40"
          hideSettings={true}
          height={400}
          width={600}
          config={{
            container: container,
            text: text,
            float: "left",
            horizontalAlignment: "justify",
            width: "40",
            type: "markdown",
          }}
          compFactory={ContainerComp}
        />
        <Example
          title="Content Width - 60"
          hideSettings={true}
          height={400}
          width={600}
          config={{
            container: container,
            text: text,
            float: "left",
            horizontalAlignment: "justify",
            width: "60",
            type: "markdown",
          }}
          compFactory={ContainerComp}
        />
        <Example
          title="Text Float Type - Right"
          hideSettings={true}
          height={400}
          width={600}
          config={{
            container: container,
            text: text,
            float: "right",
            horizontalAlignment: "justify",
            width: "60",
            type: "markdown",
          }}
          compFactory={ContainerComp}
        />
        <Example
          title="Text Float Type - Left"
          hideSettings={true}
          height={400}
          width={600}
          config={{
            container: container,
            text: text,
            float: "left",
            horizontalAlignment: "justify",
            width: "60",
            type: "markdown",
          }}
          compFactory={ContainerComp}
        />
        <Example
          title="Text Float Type - None"
          hideSettings={true}
          height={400}
          width={600}
          config={{
            container: container,
            text: text,
            float: "none",
            horizontalAlignment: "justify",
            width: "60",
            type: "markdown",
          }}
          compFactory={ContainerComp}
        />
        <Example
          title="Text Alignment - Left"
          hideSettings={true}
          height={400}
          width={600}
          config={{
            container: container,
            text: text,
            horizontalAlignment: "left",
            width: "60",
            type: "markdown",
          }}
          compFactory={ContainerComp}
        />
        <Example
          title="Text Alignment - Right"
          hideSettings={true}
          height={400}
          width={600}
          config={{
            container: container,
            text: text,
            horizontalAlignment: "right",
            width: "60",
            type: "markdown",
          }}
          compFactory={ContainerComp}
        />
        <Example
          title="Text Alignment - Justified"
          hideSettings={true}
          height={400}
          width={600}
          config={{
            container: container,
            text: text,
            horizontalAlignment: "justify",
            width: "60",
            type: "markdown",
          }}
          compFactory={ContainerComp}
        />
        <Example
          title="Text Alignment - Center"
          hideSettings={true}
          height={400}
          width={600}
          config={{
            container: container,
            text: text,
            horizontalAlignment: "center",
            width: "60",
            type: "markdown",
          }}
          compFactory={ContainerComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the Styling Properties of the Float Text Container Component."
      >
        <Example
          title="Background Color, Margin & Padding"
          hideSettings={true}
          height={600}
          width={1000}
          config={{
            container: container,
            text: text,
            float: "left",
            horizontalAlignment: "justify",
            width: "60",
            type: "markdown",
            style: {
                "background": "#14E9CF",
                "margin": "0px",
                "padding": "20px",
            },
          }}
          compFactory={ContainerComp}
        />
        <Example
          title="Text Properties"
          hideSettings={true}
          height={600}
          width={1000}
          config={{
            container: container,
            text: text,
            float: "left",
            horizontalAlignment: "justify",
            width: "60",
            type: "markdown",
            style: {
                "background": "#14E9CF",
                "margin": "0px",
                "padding": "20px",
                "text": "#080808",
                "textTransform": "capitalize",
                "textDecoration": "underline",
                "textSize": "30px",
                "textWeight": "bold",
                "fontFamily": "Verdana",
                "fontStyle": "italic",
            },
          }}
          compFactory={ContainerComp}
        />
        <Example
          title="Border Properties"
          hideSettings={true}
          height={600}
          width={1000}
          config={{
            container: container,
            text: text,
            float: "left",
            horizontalAlignment: "justify",
            width: "60",
            type: "markdown",
            style: {
                "background": "#14E9CF",
                "margin": "0px",
                "padding": "20px",
                "text": "#080808",
                "textTransform": "capitalize",
                "textDecoration": "underline",
                "textSize": "30px",
                "textWeight": "bold",
                "fontFamily": "Verdana",
                "fontStyle": "italic",
                "border": "#131BDB",
                "borderStyle": "solid",
                "radius": "10px",
                "borderWidth": "3px",
            },
          }}
          compFactory={ContainerComp}
        />
      </ExampleGroup>
    </>
  );
}