import { ContainerComp } from "comps/comps/containerComp/containerComp";
import { trans } from "i18n";
import { chartColorPalette } from "lowcoder-design";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const container = {
    "header": {
        "layout": {
            "f1e0a72f": {
                "i": "f1e0a72f",
                "h": 5,
                "w": 24,
                "x": 0,
                "y": 0
            }
        },
        "items": {
            "f1e0a72f": {
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
                    "e13e96e1": {
                        "i": "e13e96e1",
                        "h": 20,
                        "w": 17,
                        "x": 3,
                        "y": 1,
                        "pos": 0
                    }
                },
                "items": {
                    "e13e96e1": {
                        "compType": "image",
                        "comp": {
                            "src": "https://temp.im/350x400",
                            "autoHeight": "fixed",
                            "restrictPaddingOnRotation": "image",
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
    "showFooter": true,
    "autoHeight": "auto",
    "showVerticalScrollbar": false,
    "horizontalGridCells": 24,
    "scrollbars": false,
    "style": {
        "borderWidth": "1px"
    },
    "appliedThemeId": ""
};

const text ="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi feugiat faucibus eleifend. Pellentesque eleifend, risus vel sagittis mattis, mauris ipsum tempor sapien, eu lobortis lacus libero a dui. Cras erat felis, rhoncus vestibulum consectetur et, ultrices ut purus. Sed a tortor orci. Vestibulum nec eleifend ante.";

export default function FloatTextContainerExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Collapsiable Container Component."
      >
        <Example
          title="Default Container"
          hideSettings={true}
          height={500}
          width={1000}
          config={{
            container: container,
            text: text,
            float: "left",
            horizontalAlignment: "justify",
            width: "60",
          }}
          compFactory={ContainerComp}
        />
      </ExampleGroup>
    </>
  );
}