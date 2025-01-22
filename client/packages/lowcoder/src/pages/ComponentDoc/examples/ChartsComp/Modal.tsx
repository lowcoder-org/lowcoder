import { ModalComp } from "comps/hooks/modalComp";
import { trans } from "i18n";
import { chartColorPalette } from "lowcoder-design";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const container= {
    "layout": {
        "66becc94": {
            "i": "66becc94",
            "h": 6,
            "w": 19,
            "x": 2,
            "y": 0,
            "pos": 0
        },
        "735d7cd0": {
            "i": "735d7cd0",
            "h": 6,
            "w": 4,
            "x": 12,
            "y": 6,
            "pos": 1
        },
        "97e5bad5": {
            "i": "97e5bad5",
            "h": 6,
            "w": 4,
            "x": 16,
            "y": 6,
            "pos": 1
        }
    },
    "items": {
        "66becc94": {
            "compType": "text",
            "comp": {
                "text": "### Would you like to save the changes?",
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
            "name": "text1"
        },
        "97e5bad5": {
            "compType": "button",
            "comp": {
                "text": "No",
                "type": "",
                "form": "",
                "style": {
                    "background": "#E60202"
                },
                "preventStyleOverwriting": false,
                "appliedThemeId": "",
                "version": "latest"
            },
            "name": "button1"
        },
        "735d7cd0": {
            "compType": "button",
            "comp": {
                "text": "Yes",
                "type": "",
                "form": "",
                "style": {
                    "background": "#1C8701"
                },
                "preventStyleOverwriting": false,
                "appliedThemeId": "",
                "version": "latest"
            },
            "name": "button2"
        }
    }
};

export default function ModalExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description={trans("componentDoc.basicDemoDescription")}
      >
        <Example
          title={trans("componentDoc.default")}
          hideSettings={true}
          config={{
            container: container,
            title: "Confirmation",
            titleAlign: "center",
            visible: "true",
          }}
          compFactory={ModalComp}
        />
      </ExampleGroup>
    </>
  );
}
