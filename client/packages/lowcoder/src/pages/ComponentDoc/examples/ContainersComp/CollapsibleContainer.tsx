import { ContainerComp } from "comps/comps/containerComp/containerComp";
import { trans } from "i18n";
import { chartColorPalette } from "lowcoder-design";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const container = {
    "header": {
        "layout": {
            "fedaa62": {
                "i": "fedaa62",
                "h": 5,
                "w": 6,
                "x": 0,
                "y": 0
            },
            "5661db3a": {
                "i": "5661db3a",
                "h": 5,
                "w": 10,
                "x": 14,
                "y": 0
            }
        },
        "items": {
            "fedaa62": {
                "compType": "text",
                "comp": {
                    "text": "## Personal Details",
                    "autoHeight": "auto",
                    "type": "markdown",
                    "horizontalAlignment": "left",
                    "contentScrollBar": true,
                    "verticalAlignment": "center",
                    "style": {
                        "background": "#F5F5F6",
                        "margin": "3px",
                        "padding": "3px",
                        "text": "#222222",
                        "textSize": "14px",
                        "border": "#D7D9E0",
                        "borderStyle": "solid",
                        "radius": "4px",
                        "borderWidth": "0",
                        "lineHeight": "18px",
                        "links": "#3377FF"
                    },
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
                    "appliedThemeId": "default-theme-id",
                    "version": "latest"
                },
                "name": "text6"
            },
            "5661db3a": {
                "compType": "toggleButton",
                "comp": {
                    "value": "true",
                    "showText": false,
                    "trueText": "Hide",
                    "falseText": "Show",
                    "trueIcon": "/icon:solid/AngleUp",
                    "falseIcon": "/icon:solid/AngleDown",
                    "iconPosition": "right",
                    "alignment": "right",
                    "style": {
                        "background": "#F5F5F6",
                        "margin": "3px",
                        "padding": "3px",
                        "text": "#222222",
                        "textSize": "14px",
                        "border": "#D7D9E0",
                        "borderStyle": "solid",
                        "radius": "4px",
                        "borderWidth": "1px",
                        "lineHeight": "18px"
                    },
                    "showBorder": false,
                    "preventStyleOverwriting": false,
                    "appliedThemeId": "default-theme-id",
                    "version": "latest"
                },
                "name": "toggleButton3"
            }
        }
    },
    "body": {
        "0": {
            "view": {
                "layout": {
                    "c93dc520": {
                        "i": "c93dc520",
                        "h": 7,
                        "w": 10,
                        "x": 0,
                        "y": 0,
                        "pos": 0
                    },
                    "54dd6cc": {
                        "i": "54dd6cc",
                        "h": 10,
                        "w": 10,
                        "x": 14,
                        "y": 0,
                        "pos": 5
                    },
                    "aa36926a": {
                        "i": "aa36926a",
                        "h": 7,
                        "w": 10,
                        "x": 0,
                        "y": 7,
                        "pos": 1
                    },
                    "fc179ca5": {
                        "i": "fc179ca5",
                        "h": 7,
                        "w": 10,
                        "x": 14,
                        "y": 14,
                        "pos": 4
                    },
                    "99d1503e": {
                        "i": "99d1503e",
                        "h": 7,
                        "w": 10,
                        "x": 0,
                        "y": 14,
                        "pos": 6
                    }
                },
                "items": {
                    "c93dc520": {
                        "compType": "input",
                        "comp": {
                            "defaultValue": "",
                            "value": "",
                            "label": {
                                "text": "Full Name",
                                "width": "33",
                                "widthUnit": "%",
                                "position": "row",
                                "align": "left"
                            },
                            "placeholder": "Full name",
                            "required": true,
                            "validationType": "Text",
                            "style": {
                                "background": "#00000000",
                                "border": "#D7D9E0",
                                "margin": "3px",
                                "padding": "3px",
                                "borderStyle": "solid",
                                "radius": "4px",
                                "borderWidth": "0px",
                                "opacity": "1"
                            },
                            "labelStyle": {
                                "margin": "3px",
                                "padding": "3px",
                                "label": "#222222",
                                "textSize": "14px",
                                "border": "#D7D9E0",
                                "borderStyle": "solid",
                                "borderWidth": "0px",
                                "accent": "#3377FF"
                            },
                            "prefixIcon": "/icon:solid/file-lines",
                            "inputFieldStyle": {
                                "margin": "3px",
                                "padding": "3px",
                                "text": "#222222",
                                "textSize": "14px",
                                "border": "#D7D9E0",
                                "borderStyle": "solid",
                                "radius": "4px",
                                "borderWidth": "1px",
                                "accent": "#3377FF"
                            },
                            "preventStyleOverwriting": false,
                            "appliedThemeId": "default-theme-id",
                            "version": "latest"
                        },
                        "name": "input1"
                    },
                    "aa36926a": {
                        "compType": "input",
                        "comp": {
                            "defaultValue": "",
                            "value": "",
                            "label": {
                                "text": "Email",
                                "width": "33",
                                "widthUnit": "%",
                                "position": "row",
                                "align": "left"
                            },
                            "placeholder": "Email Address",
                            "required": true,
                            "validationType": "Email",
                            "style": {
                                "background": "#00000000",
                                "border": "#D7D9E0",
                                "margin": "3px",
                                "padding": "3px",
                                "borderStyle": "solid",
                                "radius": "4px",
                                "borderWidth": "0px",
                                "opacity": "1"
                            },
                            "labelStyle": {
                                "margin": "3px",
                                "padding": "3px",
                                "label": "#222222",
                                "textSize": "14px",
                                "border": "#D7D9E0",
                                "borderStyle": "solid",
                                "borderWidth": "0px",
                                "accent": "#3377FF"
                            },
                            "prefixIcon": "/icon:solid/inbox",
                            "inputFieldStyle": {
                                "margin": "3px",
                                "padding": "3px",
                                "text": "#222222",
                                "textSize": "14px",
                                "border": "#D7D9E0",
                                "borderStyle": "solid",
                                "radius": "4px",
                                "borderWidth": "1px",
                                "accent": "#3377FF"
                            },
                            "preventStyleOverwriting": false,
                            "appliedThemeId": "default-theme-id",
                            "version": "latest"
                        },
                        "name": "input2"
                    },
                    "54dd6cc": {
                        "compType": "radio",
                        "comp": {
                            "defaultValue": "1",
                            "value": "",
                            "label": {
                                "text": "Gender",
                                "width": "33",
                                "widthUnit": "%",
                                "position": "row",
                                "align": "left"
                            },
                            "options": {
                                "optionType": "manual",
                                "manual": {
                                    "manual": [
                                        {
                                            "value": "1",
                                            "label": "Male"
                                        },
                                        {
                                            "value": "2",
                                            "label": "Female"
                                        }
                                    ]
                                },
                                "mapData": {
                                    "data": "[]"
                                }
                            },
                            "style": {
                                "background": "#00000000",
                                "border": "#D7D9E0",
                                "margin": "3px",
                                "padding": "3px",
                                "borderStyle": "solid",
                                "radius": "4px",
                                "borderWidth": "0px",
                                "opacity": "1"
                            },
                            "labelStyle": {
                                "margin": "3px",
                                "padding": "3px",
                                "label": "#222222",
                                "textSize": "14px",
                                "border": "#D7D9E0",
                                "borderStyle": "solid",
                                "borderWidth": "0px",
                                "accent": "#3377FF"
                            },
                            "layout": "horizontal",
                            "inputFieldStyle": {
                                "margin": "3px",
                                "padding": "3px",
                                "staticText": "#222222",
                                "textSize": "14px",
                                "borderStyle": "solid",
                                "borderWidth": "1px",
                                "checkedBackground": "#3377FF",
                                "uncheckedBorder": "#D7D9E0",
                                "checkedBorder": "#3377FF"
                            },
                            "preventStyleOverwriting": false,
                            "appliedThemeId": "default-theme-id",
                            "version": "latest"
                        },
                        "name": "radio1"
                    },
                    "fc179ca5": {
                        "compType": "date",
                        "comp": {
                            "defaultValue": "",
                            "value": "",
                            "userTimeZone": "Europe/Madrid",
                            "label": {
                                "text": "DOB",
                                "width": "33",
                                "widthUnit": "%",
                                "position": "row",
                                "align": "left"
                            },
                            "placeholder": "Select Date",
                            "inputFormat": "YYYY-MM-DD",
                            "style": {
                                "background": "#00000000",
                                "border": "#D7D9E0",
                                "margin": "3px",
                                "padding": "3px",
                                "borderStyle": "solid",
                                "radius": "4px",
                                "borderWidth": "0px",
                                "opacity": "1"
                            },
                            "labelStyle": {
                                "margin": "3px",
                                "padding": "3px",
                                "label": "#222222",
                                "textSize": "14px",
                                "border": "#D7D9E0",
                                "borderStyle": "solid",
                                "borderWidth": "0px"
                            },
                            "suffixIcon": "/icon:regular/calendar",
                            "minDate": "1960-01-01",
                            "maxDate": "2010-12-31",
                            "inputFieldStyle": {
                                "border": "#D7D9E0",
                                "radius": "4px",
                                "text": "#222222",
                                "margin": "3px",
                                "padding": "3px",
                                "borderStyle": "solid",
                                "borderWidth": "1px",
                                "accent": "#3377FF"
                            },
                            "timeZone": "Europe/Madrid",
                            "preventStyleOverwriting": false,
                            "appliedThemeId": "default-theme-id",
                            "version": "latest"
                        },
                        "name": "date1"
                    },
                    "99d1503e": {
                        "compType": "numberInput",
                        "comp": {
                            "defaultValue": "",
                            "value": "",
                            "placeholder": "+449827222541",
                            "label": {
                                "text": "Phone #",
                                "width": "33",
                                "widthUnit": "%",
                                "position": "row",
                                "align": "left"
                            },
                            "formatter": "standard",
                            "step": "",
                            "controls": false,
                            "thousandsSeparator": false,
                            "prefixText": "",
                            "preventStyleOverwriting": false,
                            "appliedThemeId": "default-theme-id",
                            "version": "latest"
                        },
                        "name": "numberInput1"
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
        "border": "#D7D9E0",
        "background": "#FFFFFF",
        "radius": "4px",
        "borderWidth": "1px",
        "borderStyle": "solid",
        "margin": "3px",
        "padding": "3px"
    },
    "appliedThemeId": "default-theme-id"
};

export default function CollapsibleContainerExample() {
  return (
    <>

      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Collapsiable Container Component."
      >
        <Example
          title="Default Collapsible Container"
          hideSettings={true}
          height={500}
          width={1000}
          config={{
          }}
          compFactory={ContainerComp}
        />
        <Example
          title="Custom Collapsible Container"
          hideSettings={true}
          height={500}
          width={1000}
          config={{
            container: container,
          }}
          compFactory={ContainerComp}
        />
        <Example
          title="Hiding Collapsible Container"
          hideSettings={true}
          height={500}
          width={1000}
          config={{
            container: container,
            hidden: true,
          }}
          compFactory={ContainerComp}
        />
        <Example
          title="Disabling Collapsible Container"
          hideSettings={true}
          height={500}
          width={1000}
          config={{
            container: container,
            disabled: true,
          }}
          compFactory={ContainerComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Layout Options"
        description="The Following Examples Show the different Layout Options of the Collapsiable Container Component."
      >
        <Example
          title="Show Header - False"
          hideSettings={true}
          height={500}
          width={1000}
          config={{
            container: {
                "header": {
                    "layout": {
                        "fedaa62": {
                            "i": "fedaa62",
                            "h": 5,
                            "w": 6,
                            "x": 0,
                            "y": 0
                        },
                        "5661db3a": {
                            "i": "5661db3a",
                            "h": 5,
                            "w": 10,
                            "x": 14,
                            "y": 0
                        }
                    },
                    "items": {
                        "fedaa62": {
                            "compType": "text",
                            "comp": {
                                "text": "## Personal Details",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "left",
                                "contentScrollBar": true,
                                "verticalAlignment": "center",
                                "style": {
                                    "background": "#F5F5F6",
                                    "margin": "3px",
                                    "padding": "3px",
                                    "text": "#222222",
                                    "textSize": "14px",
                                    "border": "#D7D9E0",
                                    "borderStyle": "solid",
                                    "radius": "4px",
                                    "borderWidth": "0",
                                    "lineHeight": "18px",
                                    "links": "#3377FF"
                                },
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
                                "appliedThemeId": "default-theme-id",
                                "version": "latest"
                            },
                            "name": "text6"
                        },
                        "5661db3a": {
                            "compType": "toggleButton",
                            "comp": {
                                "value": "true",
                                "showText": false,
                                "trueText": "Hide",
                                "falseText": "Show",
                                "trueIcon": "/icon:solid/AngleUp",
                                "falseIcon": "/icon:solid/AngleDown",
                                "iconPosition": "right",
                                "alignment": "right",
                                "style": {
                                    "background": "#F5F5F6",
                                    "margin": "3px",
                                    "padding": "3px",
                                    "text": "#222222",
                                    "textSize": "14px",
                                    "border": "#D7D9E0",
                                    "borderStyle": "solid",
                                    "radius": "4px",
                                    "borderWidth": "1px",
                                    "lineHeight": "18px"
                                },
                                "showBorder": false,
                                "preventStyleOverwriting": false,
                                "appliedThemeId": "default-theme-id",
                                "version": "latest"
                            },
                            "name": "toggleButton3"
                        }
                    }
                },
                "body": {
                    "0": {
                        "view": {
                            "layout": {
                                "c93dc520": {
                                    "i": "c93dc520",
                                    "h": 7,
                                    "w": 10,
                                    "x": 0,
                                    "y": 0,
                                    "pos": 0
                                },
                                "54dd6cc": {
                                    "i": "54dd6cc",
                                    "h": 10,
                                    "w": 10,
                                    "x": 14,
                                    "y": 0,
                                    "pos": 5
                                },
                                "aa36926a": {
                                    "i": "aa36926a",
                                    "h": 7,
                                    "w": 10,
                                    "x": 0,
                                    "y": 7,
                                    "pos": 1
                                },
                                "fc179ca5": {
                                    "i": "fc179ca5",
                                    "h": 7,
                                    "w": 10,
                                    "x": 14,
                                    "y": 14,
                                    "pos": 4
                                },
                                "99d1503e": {
                                    "i": "99d1503e",
                                    "h": 7,
                                    "w": 10,
                                    "x": 0,
                                    "y": 14,
                                    "pos": 6
                                }
                            },
                            "items": {
                                "c93dc520": {
                                    "compType": "input",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "label": {
                                            "text": "Full Name",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "placeholder": "Full name",
                                        "required": true,
                                        "validationType": "Text",
                                        "style": {
                                            "background": "#00000000",
                                            "border": "#D7D9E0",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "0px",
                                            "opacity": "1"
                                        },
                                        "labelStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "label": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "borderWidth": "0px",
                                            "accent": "#3377FF"
                                        },
                                        "prefixIcon": "/icon:solid/file-lines",
                                        "inputFieldStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "text": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "1px",
                                            "accent": "#3377FF"
                                        },
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "input1"
                                },
                                "aa36926a": {
                                    "compType": "input",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "label": {
                                            "text": "Email",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "placeholder": "Email Address",
                                        "required": true,
                                        "validationType": "Email",
                                        "style": {
                                            "background": "#00000000",
                                            "border": "#D7D9E0",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "0px",
                                            "opacity": "1"
                                        },
                                        "labelStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "label": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "borderWidth": "0px",
                                            "accent": "#3377FF"
                                        },
                                        "prefixIcon": "/icon:solid/inbox",
                                        "inputFieldStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "text": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "1px",
                                            "accent": "#3377FF"
                                        },
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "input2"
                                },
                                "54dd6cc": {
                                    "compType": "radio",
                                    "comp": {
                                        "defaultValue": "1",
                                        "value": "",
                                        "label": {
                                            "text": "Gender",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "options": {
                                            "optionType": "manual",
                                            "manual": {
                                                "manual": [
                                                    {
                                                        "value": "1",
                                                        "label": "Male"
                                                    },
                                                    {
                                                        "value": "2",
                                                        "label": "Female"
                                                    }
                                                ]
                                            },
                                            "mapData": {
                                                "data": "[]"
                                            }
                                        },
                                        "style": {
                                            "background": "#00000000",
                                            "border": "#D7D9E0",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "0px",
                                            "opacity": "1"
                                        },
                                        "labelStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "label": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "borderWidth": "0px",
                                            "accent": "#3377FF"
                                        },
                                        "layout": "horizontal",
                                        "inputFieldStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "staticText": "#222222",
                                            "textSize": "14px",
                                            "borderStyle": "solid",
                                            "borderWidth": "1px",
                                            "checkedBackground": "#3377FF",
                                            "uncheckedBorder": "#D7D9E0",
                                            "checkedBorder": "#3377FF"
                                        },
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "radio1"
                                },
                                "fc179ca5": {
                                    "compType": "date",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "userTimeZone": "Europe/Madrid",
                                        "label": {
                                            "text": "DOB",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "placeholder": "Select Date",
                                        "inputFormat": "YYYY-MM-DD",
                                        "style": {
                                            "background": "#00000000",
                                            "border": "#D7D9E0",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "0px",
                                            "opacity": "1"
                                        },
                                        "labelStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "label": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "borderWidth": "0px"
                                        },
                                        "suffixIcon": "/icon:regular/calendar",
                                        "minDate": "1960-01-01",
                                        "maxDate": "2010-12-31",
                                        "inputFieldStyle": {
                                            "border": "#D7D9E0",
                                            "radius": "4px",
                                            "text": "#222222",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "borderWidth": "1px",
                                            "accent": "#3377FF"
                                        },
                                        "timeZone": "Europe/Madrid",
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "date1"
                                },
                                "99d1503e": {
                                    "compType": "numberInput",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "placeholder": "+449827222541",
                                        "label": {
                                            "text": "Phone #",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "formatter": "standard",
                                        "step": "",
                                        "controls": false,
                                        "thousandsSeparator": false,
                                        "prefixText": "",
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "numberInput1"
                                }
                            }
                        }
                    }
                },
                "footer": {
                    "layout": {}
                },
                "showHeader": false,
                "showBody": true,
                "autoHeight": "auto",
                "showVerticalScrollbar": false,
                "horizontalGridCells": 24,
                "scrollbars": false,
                "style": {
                    "border": "#D7D9E0",
                    "background": "#FFFFFF",
                    "radius": "4px",
                    "borderWidth": "1px",
                    "borderStyle": "solid",
                    "margin": "3px",
                    "padding": "3px"
                },
                "appliedThemeId": "default-theme-id"
            },
          }}
          compFactory={ContainerComp}
        />
        <Example
          title="Show Body - False"
          hideSettings={true}
          height={500}
          width={1000}
          config={{
            container: {
                "header": {
                    "layout": {
                        "fedaa62": {
                            "i": "fedaa62",
                            "h": 5,
                            "w": 6,
                            "x": 0,
                            "y": 0
                        },
                        "5661db3a": {
                            "i": "5661db3a",
                            "h": 5,
                            "w": 10,
                            "x": 14,
                            "y": 0
                        }
                    },
                    "items": {
                        "fedaa62": {
                            "compType": "text",
                            "comp": {
                                "text": "## Personal Details",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "left",
                                "contentScrollBar": true,
                                "verticalAlignment": "center",
                                "style": {
                                    "background": "#F5F5F6",
                                    "margin": "3px",
                                    "padding": "3px",
                                    "text": "#222222",
                                    "textSize": "14px",
                                    "border": "#D7D9E0",
                                    "borderStyle": "solid",
                                    "radius": "4px",
                                    "borderWidth": "0",
                                    "lineHeight": "18px",
                                    "links": "#3377FF"
                                },
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
                                "appliedThemeId": "default-theme-id",
                                "version": "latest"
                            },
                            "name": "text6"
                        },
                        "5661db3a": {
                            "compType": "toggleButton",
                            "comp": {
                                "value": "true",
                                "showText": false,
                                "trueText": "Hide",
                                "falseText": "Show",
                                "trueIcon": "/icon:solid/AngleUp",
                                "falseIcon": "/icon:solid/AngleDown",
                                "iconPosition": "right",
                                "alignment": "right",
                                "style": {
                                    "background": "#F5F5F6",
                                    "margin": "3px",
                                    "padding": "3px",
                                    "text": "#222222",
                                    "textSize": "14px",
                                    "border": "#D7D9E0",
                                    "borderStyle": "solid",
                                    "radius": "4px",
                                    "borderWidth": "1px",
                                    "lineHeight": "18px"
                                },
                                "showBorder": false,
                                "preventStyleOverwriting": false,
                                "appliedThemeId": "default-theme-id",
                                "version": "latest"
                            },
                            "name": "toggleButton3"
                        }
                    }
                },
                "body": {
                    "0": {
                        "view": {
                            "layout": {
                                "c93dc520": {
                                    "i": "c93dc520",
                                    "h": 7,
                                    "w": 10,
                                    "x": 0,
                                    "y": 0,
                                    "pos": 0
                                },
                                "54dd6cc": {
                                    "i": "54dd6cc",
                                    "h": 10,
                                    "w": 10,
                                    "x": 14,
                                    "y": 0,
                                    "pos": 5
                                },
                                "aa36926a": {
                                    "i": "aa36926a",
                                    "h": 7,
                                    "w": 10,
                                    "x": 0,
                                    "y": 7,
                                    "pos": 1
                                },
                                "fc179ca5": {
                                    "i": "fc179ca5",
                                    "h": 7,
                                    "w": 10,
                                    "x": 14,
                                    "y": 14,
                                    "pos": 4
                                },
                                "99d1503e": {
                                    "i": "99d1503e",
                                    "h": 7,
                                    "w": 10,
                                    "x": 0,
                                    "y": 14,
                                    "pos": 6
                                }
                            },
                            "items": {
                                "c93dc520": {
                                    "compType": "input",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "label": {
                                            "text": "Full Name",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "placeholder": "Full name",
                                        "required": true,
                                        "validationType": "Text",
                                        "style": {
                                            "background": "#00000000",
                                            "border": "#D7D9E0",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "0px",
                                            "opacity": "1"
                                        },
                                        "labelStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "label": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "borderWidth": "0px",
                                            "accent": "#3377FF"
                                        },
                                        "prefixIcon": "/icon:solid/file-lines",
                                        "inputFieldStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "text": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "1px",
                                            "accent": "#3377FF"
                                        },
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "input1"
                                },
                                "aa36926a": {
                                    "compType": "input",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "label": {
                                            "text": "Email",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "placeholder": "Email Address",
                                        "required": true,
                                        "validationType": "Email",
                                        "style": {
                                            "background": "#00000000",
                                            "border": "#D7D9E0",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "0px",
                                            "opacity": "1"
                                        },
                                        "labelStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "label": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "borderWidth": "0px",
                                            "accent": "#3377FF"
                                        },
                                        "prefixIcon": "/icon:solid/inbox",
                                        "inputFieldStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "text": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "1px",
                                            "accent": "#3377FF"
                                        },
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "input2"
                                },
                                "54dd6cc": {
                                    "compType": "radio",
                                    "comp": {
                                        "defaultValue": "1",
                                        "value": "",
                                        "label": {
                                            "text": "Gender",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "options": {
                                            "optionType": "manual",
                                            "manual": {
                                                "manual": [
                                                    {
                                                        "value": "1",
                                                        "label": "Male"
                                                    },
                                                    {
                                                        "value": "2",
                                                        "label": "Female"
                                                    }
                                                ]
                                            },
                                            "mapData": {
                                                "data": "[]"
                                            }
                                        },
                                        "style": {
                                            "background": "#00000000",
                                            "border": "#D7D9E0",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "0px",
                                            "opacity": "1"
                                        },
                                        "labelStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "label": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "borderWidth": "0px",
                                            "accent": "#3377FF"
                                        },
                                        "layout": "horizontal",
                                        "inputFieldStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "staticText": "#222222",
                                            "textSize": "14px",
                                            "borderStyle": "solid",
                                            "borderWidth": "1px",
                                            "checkedBackground": "#3377FF",
                                            "uncheckedBorder": "#D7D9E0",
                                            "checkedBorder": "#3377FF"
                                        },
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "radio1"
                                },
                                "fc179ca5": {
                                    "compType": "date",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "userTimeZone": "Europe/Madrid",
                                        "label": {
                                            "text": "DOB",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "placeholder": "Select Date",
                                        "inputFormat": "YYYY-MM-DD",
                                        "style": {
                                            "background": "#00000000",
                                            "border": "#D7D9E0",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "0px",
                                            "opacity": "1"
                                        },
                                        "labelStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "label": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "borderWidth": "0px"
                                        },
                                        "suffixIcon": "/icon:regular/calendar",
                                        "minDate": "1960-01-01",
                                        "maxDate": "2010-12-31",
                                        "inputFieldStyle": {
                                            "border": "#D7D9E0",
                                            "radius": "4px",
                                            "text": "#222222",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "borderWidth": "1px",
                                            "accent": "#3377FF"
                                        },
                                        "timeZone": "Europe/Madrid",
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "date1"
                                },
                                "99d1503e": {
                                    "compType": "numberInput",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "placeholder": "+449827222541",
                                        "label": {
                                            "text": "Phone #",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "formatter": "standard",
                                        "step": "",
                                        "controls": false,
                                        "thousandsSeparator": false,
                                        "prefixText": "",
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "numberInput1"
                                }
                            }
                        }
                    }
                },
                "footer": {
                    "layout": {}
                },
                "showHeader": true,
                "showBody": false,
                "autoHeight": "auto",
                "showVerticalScrollbar": false,
                "horizontalGridCells": 24,
                "scrollbars": false,
                "style": {
                    "border": "#D7D9E0",
                    "background": "#FFFFFF",
                    "radius": "4px",
                    "borderWidth": "1px",
                    "borderStyle": "solid",
                    "margin": "3px",
                    "padding": "3px"
                },
                "appliedThemeId": "default-theme-id"
            },
          }}
          compFactory={ContainerComp}
        />
        <Example
          title="Show Footer - True"
          hideSettings={true}
          height={500}
          width={1000}
          config={{
            container: {
                "header": {
                    "layout": {
                        "fedaa62": {
                            "i": "fedaa62",
                            "h": 5,
                            "w": 6,
                            "x": 0,
                            "y": 0
                        },
                        "5661db3a": {
                            "i": "5661db3a",
                            "h": 5,
                            "w": 10,
                            "x": 14,
                            "y": 0
                        }
                    },
                    "items": {
                        "fedaa62": {
                            "compType": "text",
                            "comp": {
                                "text": "## Personal Details",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "left",
                                "contentScrollBar": true,
                                "verticalAlignment": "center",
                                "style": {
                                    "background": "#F5F5F6",
                                    "margin": "3px",
                                    "padding": "3px",
                                    "text": "#222222",
                                    "textSize": "14px",
                                    "border": "#D7D9E0",
                                    "borderStyle": "solid",
                                    "radius": "4px",
                                    "borderWidth": "0",
                                    "lineHeight": "18px",
                                    "links": "#3377FF"
                                },
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
                                "appliedThemeId": "default-theme-id",
                                "version": "latest"
                            },
                            "name": "text6"
                        },
                        "5661db3a": {
                            "compType": "toggleButton",
                            "comp": {
                                "value": "true",
                                "showText": false,
                                "trueText": "Hide",
                                "falseText": "Show",
                                "trueIcon": "/icon:solid/AngleUp",
                                "falseIcon": "/icon:solid/AngleDown",
                                "iconPosition": "right",
                                "alignment": "right",
                                "style": {
                                    "background": "#F5F5F6",
                                    "margin": "3px",
                                    "padding": "3px",
                                    "text": "#222222",
                                    "textSize": "14px",
                                    "border": "#D7D9E0",
                                    "borderStyle": "solid",
                                    "radius": "4px",
                                    "borderWidth": "1px",
                                    "lineHeight": "18px"
                                },
                                "showBorder": false,
                                "preventStyleOverwriting": false,
                                "appliedThemeId": "default-theme-id",
                                "version": "latest"
                            },
                            "name": "toggleButton3"
                        }
                    }
                },
                "body": {
                    "0": {
                        "view": {
                            "layout": {
                                "c93dc520": {
                                    "i": "c93dc520",
                                    "h": 7,
                                    "w": 10,
                                    "x": 0,
                                    "y": 0,
                                    "pos": 0
                                },
                                "54dd6cc": {
                                    "i": "54dd6cc",
                                    "h": 10,
                                    "w": 10,
                                    "x": 14,
                                    "y": 0,
                                    "pos": 5
                                },
                                "aa36926a": {
                                    "i": "aa36926a",
                                    "h": 7,
                                    "w": 10,
                                    "x": 0,
                                    "y": 7,
                                    "pos": 1
                                },
                                "fc179ca5": {
                                    "i": "fc179ca5",
                                    "h": 7,
                                    "w": 10,
                                    "x": 14,
                                    "y": 14,
                                    "pos": 4
                                },
                                "99d1503e": {
                                    "i": "99d1503e",
                                    "h": 7,
                                    "w": 10,
                                    "x": 0,
                                    "y": 14,
                                    "pos": 6
                                }
                            },
                            "items": {
                                "c93dc520": {
                                    "compType": "input",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "label": {
                                            "text": "Full Name",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "placeholder": "Full name",
                                        "required": true,
                                        "validationType": "Text",
                                        "style": {
                                            "background": "#00000000",
                                            "border": "#D7D9E0",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "0px",
                                            "opacity": "1"
                                        },
                                        "labelStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "label": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "borderWidth": "0px",
                                            "accent": "#3377FF"
                                        },
                                        "prefixIcon": "/icon:solid/file-lines",
                                        "inputFieldStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "text": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "1px",
                                            "accent": "#3377FF"
                                        },
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "input1"
                                },
                                "aa36926a": {
                                    "compType": "input",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "label": {
                                            "text": "Email",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "placeholder": "Email Address",
                                        "required": true,
                                        "validationType": "Email",
                                        "style": {
                                            "background": "#00000000",
                                            "border": "#D7D9E0",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "0px",
                                            "opacity": "1"
                                        },
                                        "labelStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "label": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "borderWidth": "0px",
                                            "accent": "#3377FF"
                                        },
                                        "prefixIcon": "/icon:solid/inbox",
                                        "inputFieldStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "text": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "1px",
                                            "accent": "#3377FF"
                                        },
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "input2"
                                },
                                "54dd6cc": {
                                    "compType": "radio",
                                    "comp": {
                                        "defaultValue": "1",
                                        "value": "",
                                        "label": {
                                            "text": "Gender",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "options": {
                                            "optionType": "manual",
                                            "manual": {
                                                "manual": [
                                                    {
                                                        "value": "1",
                                                        "label": "Male"
                                                    },
                                                    {
                                                        "value": "2",
                                                        "label": "Female"
                                                    }
                                                ]
                                            },
                                            "mapData": {
                                                "data": "[]"
                                            }
                                        },
                                        "style": {
                                            "background": "#00000000",
                                            "border": "#D7D9E0",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "0px",
                                            "opacity": "1"
                                        },
                                        "labelStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "label": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "borderWidth": "0px",
                                            "accent": "#3377FF"
                                        },
                                        "layout": "horizontal",
                                        "inputFieldStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "staticText": "#222222",
                                            "textSize": "14px",
                                            "borderStyle": "solid",
                                            "borderWidth": "1px",
                                            "checkedBackground": "#3377FF",
                                            "uncheckedBorder": "#D7D9E0",
                                            "checkedBorder": "#3377FF"
                                        },
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "radio1"
                                },
                                "fc179ca5": {
                                    "compType": "date",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "userTimeZone": "Europe/Madrid",
                                        "label": {
                                            "text": "DOB",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "placeholder": "Select Date",
                                        "inputFormat": "YYYY-MM-DD",
                                        "style": {
                                            "background": "#00000000",
                                            "border": "#D7D9E0",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "0px",
                                            "opacity": "1"
                                        },
                                        "labelStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "label": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "borderWidth": "0px"
                                        },
                                        "suffixIcon": "/icon:regular/calendar",
                                        "minDate": "1960-01-01",
                                        "maxDate": "2010-12-31",
                                        "inputFieldStyle": {
                                            "border": "#D7D9E0",
                                            "radius": "4px",
                                            "text": "#222222",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "borderWidth": "1px",
                                            "accent": "#3377FF"
                                        },
                                        "timeZone": "Europe/Madrid",
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "date1"
                                },
                                "99d1503e": {
                                    "compType": "numberInput",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "placeholder": "+449827222541",
                                        "label": {
                                            "text": "Phone #",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "formatter": "standard",
                                        "step": "",
                                        "controls": false,
                                        "thousandsSeparator": false,
                                        "prefixText": "",
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "numberInput1"
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
                    "border": "#D7D9E0",
                    "background": "#FFFFFF",
                    "radius": "4px",
                    "borderWidth": "1px",
                    "borderStyle": "solid",
                    "margin": "3px",
                    "padding": "3px"
                },
                "appliedThemeId": "default-theme-id"
            },
          }}
          compFactory={ContainerComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling Properties of the Collapsiable Container Component."
      >
        <Example
          title="Overall Styling"
          hideSettings={true}
          height={500}
          width={1000}
          config={{
            container: {
                "header": {
                    "layout": {
                        "fedaa62": {
                            "i": "fedaa62",
                            "h": 5,
                            "w": 6,
                            "x": 0,
                            "y": 0
                        },
                        "5661db3a": {
                            "i": "5661db3a",
                            "h": 5,
                            "w": 10,
                            "x": 14,
                            "y": 0
                        }
                    },
                    "items": {
                        "fedaa62": {
                            "compType": "text",
                            "comp": {
                                "text": "## Personal Details",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "left",
                                "contentScrollBar": true,
                                "verticalAlignment": "center",
                                "style": {
                                    "background": "#F5F5F6",
                                    "margin": "3px",
                                    "padding": "3px",
                                    "text": "#222222",
                                    "textSize": "14px",
                                    "border": "#D7D9E0",
                                    "borderStyle": "solid",
                                    "radius": "4px",
                                    "borderWidth": "0",
                                    "lineHeight": "18px",
                                    "links": "#3377FF"
                                },
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
                                "appliedThemeId": "default-theme-id",
                                "version": "latest"
                            },
                            "name": "text6"
                        },
                        "5661db3a": {
                            "compType": "toggleButton",
                            "comp": {
                                "value": "true",
                                "showText": false,
                                "trueText": "Hide",
                                "falseText": "Show",
                                "trueIcon": "/icon:solid/AngleUp",
                                "falseIcon": "/icon:solid/AngleDown",
                                "iconPosition": "right",
                                "alignment": "right",
                                "style": {
                                    "background": "#F5F5F6",
                                    "margin": "3px",
                                    "padding": "3px",
                                    "text": "#222222",
                                    "textSize": "14px",
                                    "border": "#D7D9E0",
                                    "borderStyle": "solid",
                                    "radius": "4px",
                                    "borderWidth": "1px",
                                    "lineHeight": "18px"
                                },
                                "showBorder": false,
                                "preventStyleOverwriting": false,
                                "appliedThemeId": "default-theme-id",
                                "version": "latest"
                            },
                            "name": "toggleButton3"
                        }
                    }
                },
                "body": {
                    "0": {
                        "view": {
                            "layout": {
                                "c93dc520": {
                                    "i": "c93dc520",
                                    "h": 7,
                                    "w": 10,
                                    "x": 0,
                                    "y": 0,
                                    "pos": 0
                                },
                                "54dd6cc": {
                                    "i": "54dd6cc",
                                    "h": 10,
                                    "w": 10,
                                    "x": 14,
                                    "y": 0,
                                    "pos": 5
                                },
                                "aa36926a": {
                                    "i": "aa36926a",
                                    "h": 7,
                                    "w": 10,
                                    "x": 0,
                                    "y": 7,
                                    "pos": 1
                                },
                                "fc179ca5": {
                                    "i": "fc179ca5",
                                    "h": 7,
                                    "w": 10,
                                    "x": 14,
                                    "y": 14,
                                    "pos": 4
                                },
                                "99d1503e": {
                                    "i": "99d1503e",
                                    "h": 7,
                                    "w": 10,
                                    "x": 0,
                                    "y": 14,
                                    "pos": 6
                                }
                            },
                            "items": {
                                "c93dc520": {
                                    "compType": "input",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "label": {
                                            "text": "Full Name",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "placeholder": "Full name",
                                        "required": true,
                                        "validationType": "Text",
                                        "style": {
                                            "background": "#00000000",
                                            "border": "#D7D9E0",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "0px",
                                            "opacity": "1"
                                        },
                                        "labelStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "label": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "borderWidth": "0px",
                                            "accent": "#3377FF"
                                        },
                                        "prefixIcon": "/icon:solid/file-lines",
                                        "inputFieldStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "text": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "1px",
                                            "accent": "#3377FF"
                                        },
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "input1"
                                },
                                "aa36926a": {
                                    "compType": "input",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "label": {
                                            "text": "Email",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "placeholder": "Email Address",
                                        "required": true,
                                        "validationType": "Email",
                                        "style": {
                                            "background": "#00000000",
                                            "border": "#D7D9E0",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "0px",
                                            "opacity": "1"
                                        },
                                        "labelStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "label": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "borderWidth": "0px",
                                            "accent": "#3377FF"
                                        },
                                        "prefixIcon": "/icon:solid/inbox",
                                        "inputFieldStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "text": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "1px",
                                            "accent": "#3377FF"
                                        },
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "input2"
                                },
                                "54dd6cc": {
                                    "compType": "radio",
                                    "comp": {
                                        "defaultValue": "1",
                                        "value": "",
                                        "label": {
                                            "text": "Gender",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "options": {
                                            "optionType": "manual",
                                            "manual": {
                                                "manual": [
                                                    {
                                                        "value": "1",
                                                        "label": "Male"
                                                    },
                                                    {
                                                        "value": "2",
                                                        "label": "Female"
                                                    }
                                                ]
                                            },
                                            "mapData": {
                                                "data": "[]"
                                            }
                                        },
                                        "style": {
                                            "background": "#00000000",
                                            "border": "#D7D9E0",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "0px",
                                            "opacity": "1"
                                        },
                                        "labelStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "label": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "borderWidth": "0px",
                                            "accent": "#3377FF"
                                        },
                                        "layout": "horizontal",
                                        "inputFieldStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "staticText": "#222222",
                                            "textSize": "14px",
                                            "borderStyle": "solid",
                                            "borderWidth": "1px",
                                            "checkedBackground": "#3377FF",
                                            "uncheckedBorder": "#D7D9E0",
                                            "checkedBorder": "#3377FF"
                                        },
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "radio1"
                                },
                                "fc179ca5": {
                                    "compType": "date",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "userTimeZone": "Europe/Madrid",
                                        "label": {
                                            "text": "DOB",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "placeholder": "Select Date",
                                        "inputFormat": "YYYY-MM-DD",
                                        "style": {
                                            "background": "#00000000",
                                            "border": "#D7D9E0",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "0px",
                                            "opacity": "1"
                                        },
                                        "labelStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "label": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "borderWidth": "0px"
                                        },
                                        "suffixIcon": "/icon:regular/calendar",
                                        "minDate": "1960-01-01",
                                        "maxDate": "2010-12-31",
                                        "inputFieldStyle": {
                                            "border": "#D7D9E0",
                                            "radius": "4px",
                                            "text": "#222222",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "borderWidth": "1px",
                                            "accent": "#3377FF"
                                        },
                                        "timeZone": "Europe/Madrid",
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "date1"
                                },
                                "99d1503e": {
                                    "compType": "numberInput",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "placeholder": "+449827222541",
                                        "label": {
                                            "text": "Phone #",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "formatter": "standard",
                                        "step": "",
                                        "controls": false,
                                        "thousandsSeparator": false,
                                        "prefixText": "",
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "numberInput1"
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
                    "border": "#5589F2",
                    "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                    "radius": "20px",
                    "borderWidth": "3px",
                    "margin": "5px",
                    "padding": "15px"
                    },
                "appliedThemeId": "default-theme-id"
            },
          }}
          compFactory={ContainerComp}
        />
        <Example
          title="Header Styling"
          hideSettings={true}
          height={500}
          width={1000}
          config={{
            container: {
                "header": {
                    "layout": {
                        "fedaa62": {
                            "i": "fedaa62",
                            "h": 5,
                            "w": 6,
                            "x": 0,
                            "y": 0
                        },
                        "5661db3a": {
                            "i": "5661db3a",
                            "h": 5,
                            "w": 10,
                            "x": 14,
                            "y": 0
                        }
                    },
                    "items": {
                        "fedaa62": {
                            "compType": "text",
                            "comp": {
                                "text": "## Personal Details",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "left",
                                "contentScrollBar": true,
                                "verticalAlignment": "center",
                                "style": {
                                    "background": "#F5F5F6",
                                    "margin": "3px",
                                    "padding": "3px",
                                    "text": "#222222",
                                    "textSize": "14px",
                                    "border": "#D7D9E0",
                                    "borderStyle": "solid",
                                    "radius": "4px",
                                    "borderWidth": "0",
                                    "lineHeight": "18px",
                                    "links": "#3377FF"
                                },
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
                                "appliedThemeId": "default-theme-id",
                                "version": "latest"
                            },
                            "name": "text6"
                        },
                        "5661db3a": {
                            "compType": "toggleButton",
                            "comp": {
                                "value": "true",
                                "showText": false,
                                "trueText": "Hide",
                                "falseText": "Show",
                                "trueIcon": "/icon:solid/AngleUp",
                                "falseIcon": "/icon:solid/AngleDown",
                                "iconPosition": "right",
                                "alignment": "right",
                                "style": {
                                    "background": "#F5F5F6",
                                    "margin": "3px",
                                    "padding": "3px",
                                    "text": "#222222",
                                    "textSize": "14px",
                                    "border": "#D7D9E0",
                                    "borderStyle": "solid",
                                    "radius": "4px",
                                    "borderWidth": "1px",
                                    "lineHeight": "18px"
                                },
                                "showBorder": false,
                                "preventStyleOverwriting": false,
                                "appliedThemeId": "default-theme-id",
                                "version": "latest"
                            },
                            "name": "toggleButton3"
                        }
                    }
                },
                "body": {
                    "0": {
                        "view": {
                            "layout": {
                                "c93dc520": {
                                    "i": "c93dc520",
                                    "h": 7,
                                    "w": 10,
                                    "x": 0,
                                    "y": 0,
                                    "pos": 0
                                },
                                "54dd6cc": {
                                    "i": "54dd6cc",
                                    "h": 10,
                                    "w": 10,
                                    "x": 14,
                                    "y": 0,
                                    "pos": 5
                                },
                                "aa36926a": {
                                    "i": "aa36926a",
                                    "h": 7,
                                    "w": 10,
                                    "x": 0,
                                    "y": 7,
                                    "pos": 1
                                },
                                "fc179ca5": {
                                    "i": "fc179ca5",
                                    "h": 7,
                                    "w": 10,
                                    "x": 14,
                                    "y": 14,
                                    "pos": 4
                                },
                                "99d1503e": {
                                    "i": "99d1503e",
                                    "h": 7,
                                    "w": 10,
                                    "x": 0,
                                    "y": 14,
                                    "pos": 6
                                }
                            },
                            "items": {
                                "c93dc520": {
                                    "compType": "input",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "label": {
                                            "text": "Full Name",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "placeholder": "Full name",
                                        "required": true,
                                        "validationType": "Text",
                                        "style": {
                                            "background": "#00000000",
                                            "border": "#D7D9E0",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "0px",
                                            "opacity": "1"
                                        },
                                        "labelStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "label": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "borderWidth": "0px",
                                            "accent": "#3377FF"
                                        },
                                        "prefixIcon": "/icon:solid/file-lines",
                                        "inputFieldStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "text": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "1px",
                                            "accent": "#3377FF"
                                        },
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "input1"
                                },
                                "aa36926a": {
                                    "compType": "input",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "label": {
                                            "text": "Email",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "placeholder": "Email Address",
                                        "required": true,
                                        "validationType": "Email",
                                        "style": {
                                            "background": "#00000000",
                                            "border": "#D7D9E0",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "0px",
                                            "opacity": "1"
                                        },
                                        "labelStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "label": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "borderWidth": "0px",
                                            "accent": "#3377FF"
                                        },
                                        "prefixIcon": "/icon:solid/inbox",
                                        "inputFieldStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "text": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "1px",
                                            "accent": "#3377FF"
                                        },
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "input2"
                                },
                                "54dd6cc": {
                                    "compType": "radio",
                                    "comp": {
                                        "defaultValue": "1",
                                        "value": "",
                                        "label": {
                                            "text": "Gender",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "options": {
                                            "optionType": "manual",
                                            "manual": {
                                                "manual": [
                                                    {
                                                        "value": "1",
                                                        "label": "Male"
                                                    },
                                                    {
                                                        "value": "2",
                                                        "label": "Female"
                                                    }
                                                ]
                                            },
                                            "mapData": {
                                                "data": "[]"
                                            }
                                        },
                                        "style": {
                                            "background": "#00000000",
                                            "border": "#D7D9E0",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "0px",
                                            "opacity": "1"
                                        },
                                        "labelStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "label": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "borderWidth": "0px",
                                            "accent": "#3377FF"
                                        },
                                        "layout": "horizontal",
                                        "inputFieldStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "staticText": "#222222",
                                            "textSize": "14px",
                                            "borderStyle": "solid",
                                            "borderWidth": "1px",
                                            "checkedBackground": "#3377FF",
                                            "uncheckedBorder": "#D7D9E0",
                                            "checkedBorder": "#3377FF"
                                        },
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "radio1"
                                },
                                "fc179ca5": {
                                    "compType": "date",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "userTimeZone": "Europe/Madrid",
                                        "label": {
                                            "text": "DOB",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "placeholder": "Select Date",
                                        "inputFormat": "YYYY-MM-DD",
                                        "style": {
                                            "background": "#00000000",
                                            "border": "#D7D9E0",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "0px",
                                            "opacity": "1"
                                        },
                                        "labelStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "label": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "borderWidth": "0px"
                                        },
                                        "suffixIcon": "/icon:regular/calendar",
                                        "minDate": "1960-01-01",
                                        "maxDate": "2010-12-31",
                                        "inputFieldStyle": {
                                            "border": "#D7D9E0",
                                            "radius": "4px",
                                            "text": "#222222",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "borderWidth": "1px",
                                            "accent": "#3377FF"
                                        },
                                        "timeZone": "Europe/Madrid",
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "date1"
                                },
                                "99d1503e": {
                                    "compType": "numberInput",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "placeholder": "+449827222541",
                                        "label": {
                                            "text": "Phone #",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "formatter": "standard",
                                        "step": "",
                                        "controls": false,
                                        "thousandsSeparator": false,
                                        "prefixText": "",
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "numberInput1"
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
                    "border": "#5589F2",
                    "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                    "radius": "20px",
                    "borderWidth": "3px",
                    "margin": "5px",
                    "padding": "15px"
                    },
                "headerStyle": {
                    "containerHeaderPadding": "20px",
                    "headerBackground": "#E68E50"
                },
                "appliedThemeId": "default-theme-id"
            },
          }}
          compFactory={ContainerComp}
        />
        <Example
          title="Body Styling"
          hideSettings={true}
          height={500}
          width={1000}
          config={{
            container: {
                "header": {
                    "layout": {
                        "fedaa62": {
                            "i": "fedaa62",
                            "h": 5,
                            "w": 6,
                            "x": 0,
                            "y": 0
                        },
                        "5661db3a": {
                            "i": "5661db3a",
                            "h": 5,
                            "w": 10,
                            "x": 14,
                            "y": 0
                        }
                    },
                    "items": {
                        "fedaa62": {
                            "compType": "text",
                            "comp": {
                                "text": "## Personal Details",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "left",
                                "contentScrollBar": true,
                                "verticalAlignment": "center",
                                "style": {
                                    "background": "#F5F5F6",
                                    "margin": "3px",
                                    "padding": "3px",
                                    "text": "#222222",
                                    "textSize": "14px",
                                    "border": "#D7D9E0",
                                    "borderStyle": "solid",
                                    "radius": "4px",
                                    "borderWidth": "0",
                                    "lineHeight": "18px",
                                    "links": "#3377FF"
                                },
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
                                "appliedThemeId": "default-theme-id",
                                "version": "latest"
                            },
                            "name": "text6"
                        },
                        "5661db3a": {
                            "compType": "toggleButton",
                            "comp": {
                                "value": "true",
                                "showText": false,
                                "trueText": "Hide",
                                "falseText": "Show",
                                "trueIcon": "/icon:solid/AngleUp",
                                "falseIcon": "/icon:solid/AngleDown",
                                "iconPosition": "right",
                                "alignment": "right",
                                "style": {
                                    "background": "#F5F5F6",
                                    "margin": "3px",
                                    "padding": "3px",
                                    "text": "#222222",
                                    "textSize": "14px",
                                    "border": "#D7D9E0",
                                    "borderStyle": "solid",
                                    "radius": "4px",
                                    "borderWidth": "1px",
                                    "lineHeight": "18px"
                                },
                                "showBorder": false,
                                "preventStyleOverwriting": false,
                                "appliedThemeId": "default-theme-id",
                                "version": "latest"
                            },
                            "name": "toggleButton3"
                        }
                    }
                },
                "body": {
                    "0": {
                        "view": {
                            "layout": {
                                "c93dc520": {
                                    "i": "c93dc520",
                                    "h": 7,
                                    "w": 10,
                                    "x": 0,
                                    "y": 0,
                                    "pos": 0
                                },
                                "54dd6cc": {
                                    "i": "54dd6cc",
                                    "h": 10,
                                    "w": 10,
                                    "x": 14,
                                    "y": 0,
                                    "pos": 5
                                },
                                "aa36926a": {
                                    "i": "aa36926a",
                                    "h": 7,
                                    "w": 10,
                                    "x": 0,
                                    "y": 7,
                                    "pos": 1
                                },
                                "fc179ca5": {
                                    "i": "fc179ca5",
                                    "h": 7,
                                    "w": 10,
                                    "x": 14,
                                    "y": 14,
                                    "pos": 4
                                },
                                "99d1503e": {
                                    "i": "99d1503e",
                                    "h": 7,
                                    "w": 10,
                                    "x": 0,
                                    "y": 14,
                                    "pos": 6
                                }
                            },
                            "items": {
                                "c93dc520": {
                                    "compType": "input",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "label": {
                                            "text": "Full Name",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "placeholder": "Full name",
                                        "required": true,
                                        "validationType": "Text",
                                        "style": {
                                            "background": "#00000000",
                                            "border": "#D7D9E0",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "0px",
                                            "opacity": "1"
                                        },
                                        "labelStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "label": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "borderWidth": "0px",
                                            "accent": "#3377FF"
                                        },
                                        "prefixIcon": "/icon:solid/file-lines",
                                        "inputFieldStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "text": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "1px",
                                            "accent": "#3377FF"
                                        },
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "input1"
                                },
                                "aa36926a": {
                                    "compType": "input",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "label": {
                                            "text": "Email",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "placeholder": "Email Address",
                                        "required": true,
                                        "validationType": "Email",
                                        "style": {
                                            "background": "#00000000",
                                            "border": "#D7D9E0",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "0px",
                                            "opacity": "1"
                                        },
                                        "labelStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "label": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "borderWidth": "0px",
                                            "accent": "#3377FF"
                                        },
                                        "prefixIcon": "/icon:solid/inbox",
                                        "inputFieldStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "text": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "1px",
                                            "accent": "#3377FF"
                                        },
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "input2"
                                },
                                "54dd6cc": {
                                    "compType": "radio",
                                    "comp": {
                                        "defaultValue": "1",
                                        "value": "",
                                        "label": {
                                            "text": "Gender",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "options": {
                                            "optionType": "manual",
                                            "manual": {
                                                "manual": [
                                                    {
                                                        "value": "1",
                                                        "label": "Male"
                                                    },
                                                    {
                                                        "value": "2",
                                                        "label": "Female"
                                                    }
                                                ]
                                            },
                                            "mapData": {
                                                "data": "[]"
                                            }
                                        },
                                        "style": {
                                            "background": "#00000000",
                                            "border": "#D7D9E0",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "0px",
                                            "opacity": "1"
                                        },
                                        "labelStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "label": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "borderWidth": "0px",
                                            "accent": "#3377FF"
                                        },
                                        "layout": "horizontal",
                                        "inputFieldStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "staticText": "#222222",
                                            "textSize": "14px",
                                            "borderStyle": "solid",
                                            "borderWidth": "1px",
                                            "checkedBackground": "#3377FF",
                                            "uncheckedBorder": "#D7D9E0",
                                            "checkedBorder": "#3377FF"
                                        },
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "radio1"
                                },
                                "fc179ca5": {
                                    "compType": "date",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "userTimeZone": "Europe/Madrid",
                                        "label": {
                                            "text": "DOB",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "placeholder": "Select Date",
                                        "inputFormat": "YYYY-MM-DD",
                                        "style": {
                                            "background": "#00000000",
                                            "border": "#D7D9E0",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "0px",
                                            "opacity": "1"
                                        },
                                        "labelStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "label": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "borderWidth": "0px"
                                        },
                                        "suffixIcon": "/icon:regular/calendar",
                                        "minDate": "1960-01-01",
                                        "maxDate": "2010-12-31",
                                        "inputFieldStyle": {
                                            "border": "#D7D9E0",
                                            "radius": "4px",
                                            "text": "#222222",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "borderWidth": "1px",
                                            "accent": "#3377FF"
                                        },
                                        "timeZone": "Europe/Madrid",
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "date1"
                                },
                                "99d1503e": {
                                    "compType": "numberInput",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "placeholder": "+449827222541",
                                        "label": {
                                            "text": "Phone #",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "formatter": "standard",
                                        "step": "",
                                        "controls": false,
                                        "thousandsSeparator": false,
                                        "prefixText": "",
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "numberInput1"
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
                    "border": "#5589F2",
                    "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                    "radius": "20px",
                    "borderWidth": "3px",
                    "margin": "5px",
                    },
                "headerStyle": {
                    "containerHeaderPadding": "20px",
                    "headerBackground": "#E68E50"
                },
                "bodyStyle": {
                    "containerBodyPadding": "20px",
                    "background": "#F2DB0A"
                },
                "appliedThemeId": "default-theme-id"
            },
          }}
          compFactory={ContainerComp}
        />
        <Example
          title="Footer Styling"
          hideSettings={true}
          height={500}
          width={1000}
          config={{
            container: {
                "header": {
                    "layout": {
                        "fedaa62": {
                            "i": "fedaa62",
                            "h": 5,
                            "w": 6,
                            "x": 0,
                            "y": 0
                        },
                        "5661db3a": {
                            "i": "5661db3a",
                            "h": 5,
                            "w": 10,
                            "x": 14,
                            "y": 0
                        }
                    },
                    "items": {
                        "fedaa62": {
                            "compType": "text",
                            "comp": {
                                "text": "## Personal Details",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "left",
                                "contentScrollBar": true,
                                "verticalAlignment": "center",
                                "style": {
                                    "background": "#F5F5F6",
                                    "margin": "3px",
                                    "padding": "3px",
                                    "text": "#222222",
                                    "textSize": "14px",
                                    "border": "#D7D9E0",
                                    "borderStyle": "solid",
                                    "radius": "4px",
                                    "borderWidth": "0",
                                    "lineHeight": "18px",
                                    "links": "#3377FF"
                                },
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
                                "appliedThemeId": "default-theme-id",
                                "version": "latest"
                            },
                            "name": "text6"
                        },
                        "5661db3a": {
                            "compType": "toggleButton",
                            "comp": {
                                "value": "true",
                                "showText": false,
                                "trueText": "Hide",
                                "falseText": "Show",
                                "trueIcon": "/icon:solid/AngleUp",
                                "falseIcon": "/icon:solid/AngleDown",
                                "iconPosition": "right",
                                "alignment": "right",
                                "style": {
                                    "background": "#F5F5F6",
                                    "margin": "3px",
                                    "padding": "3px",
                                    "text": "#222222",
                                    "textSize": "14px",
                                    "border": "#D7D9E0",
                                    "borderStyle": "solid",
                                    "radius": "4px",
                                    "borderWidth": "1px",
                                    "lineHeight": "18px"
                                },
                                "showBorder": false,
                                "preventStyleOverwriting": false,
                                "appliedThemeId": "default-theme-id",
                                "version": "latest"
                            },
                            "name": "toggleButton3"
                        }
                    }
                },
                "body": {
                    "0": {
                        "view": {
                            "layout": {
                                "c93dc520": {
                                    "i": "c93dc520",
                                    "h": 7,
                                    "w": 10,
                                    "x": 0,
                                    "y": 0,
                                    "pos": 0
                                },
                                "54dd6cc": {
                                    "i": "54dd6cc",
                                    "h": 10,
                                    "w": 10,
                                    "x": 14,
                                    "y": 0,
                                    "pos": 5
                                },
                                "aa36926a": {
                                    "i": "aa36926a",
                                    "h": 7,
                                    "w": 10,
                                    "x": 0,
                                    "y": 7,
                                    "pos": 1
                                },
                                "fc179ca5": {
                                    "i": "fc179ca5",
                                    "h": 7,
                                    "w": 10,
                                    "x": 14,
                                    "y": 14,
                                    "pos": 4
                                },
                                "99d1503e": {
                                    "i": "99d1503e",
                                    "h": 7,
                                    "w": 10,
                                    "x": 0,
                                    "y": 14,
                                    "pos": 6
                                }
                            },
                            "items": {
                                "c93dc520": {
                                    "compType": "input",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "label": {
                                            "text": "Full Name",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "placeholder": "Full name",
                                        "required": true,
                                        "validationType": "Text",
                                        "style": {
                                            "background": "#00000000",
                                            "border": "#D7D9E0",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "0px",
                                            "opacity": "1"
                                        },
                                        "labelStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "label": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "borderWidth": "0px",
                                            "accent": "#3377FF"
                                        },
                                        "prefixIcon": "/icon:solid/file-lines",
                                        "inputFieldStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "text": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "1px",
                                            "accent": "#3377FF"
                                        },
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "input1"
                                },
                                "aa36926a": {
                                    "compType": "input",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "label": {
                                            "text": "Email",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "placeholder": "Email Address",
                                        "required": true,
                                        "validationType": "Email",
                                        "style": {
                                            "background": "#00000000",
                                            "border": "#D7D9E0",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "0px",
                                            "opacity": "1"
                                        },
                                        "labelStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "label": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "borderWidth": "0px",
                                            "accent": "#3377FF"
                                        },
                                        "prefixIcon": "/icon:solid/inbox",
                                        "inputFieldStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "text": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "1px",
                                            "accent": "#3377FF"
                                        },
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "input2"
                                },
                                "54dd6cc": {
                                    "compType": "radio",
                                    "comp": {
                                        "defaultValue": "1",
                                        "value": "",
                                        "label": {
                                            "text": "Gender",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "options": {
                                            "optionType": "manual",
                                            "manual": {
                                                "manual": [
                                                    {
                                                        "value": "1",
                                                        "label": "Male"
                                                    },
                                                    {
                                                        "value": "2",
                                                        "label": "Female"
                                                    }
                                                ]
                                            },
                                            "mapData": {
                                                "data": "[]"
                                            }
                                        },
                                        "style": {
                                            "background": "#00000000",
                                            "border": "#D7D9E0",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "0px",
                                            "opacity": "1"
                                        },
                                        "labelStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "label": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "borderWidth": "0px",
                                            "accent": "#3377FF"
                                        },
                                        "layout": "horizontal",
                                        "inputFieldStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "staticText": "#222222",
                                            "textSize": "14px",
                                            "borderStyle": "solid",
                                            "borderWidth": "1px",
                                            "checkedBackground": "#3377FF",
                                            "uncheckedBorder": "#D7D9E0",
                                            "checkedBorder": "#3377FF"
                                        },
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "radio1"
                                },
                                "fc179ca5": {
                                    "compType": "date",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "userTimeZone": "Europe/Madrid",
                                        "label": {
                                            "text": "DOB",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "placeholder": "Select Date",
                                        "inputFormat": "YYYY-MM-DD",
                                        "style": {
                                            "background": "#00000000",
                                            "border": "#D7D9E0",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "radius": "4px",
                                            "borderWidth": "0px",
                                            "opacity": "1"
                                        },
                                        "labelStyle": {
                                            "margin": "3px",
                                            "padding": "3px",
                                            "label": "#222222",
                                            "textSize": "14px",
                                            "border": "#D7D9E0",
                                            "borderStyle": "solid",
                                            "borderWidth": "0px"
                                        },
                                        "suffixIcon": "/icon:regular/calendar",
                                        "minDate": "1960-01-01",
                                        "maxDate": "2010-12-31",
                                        "inputFieldStyle": {
                                            "border": "#D7D9E0",
                                            "radius": "4px",
                                            "text": "#222222",
                                            "margin": "3px",
                                            "padding": "3px",
                                            "borderStyle": "solid",
                                            "borderWidth": "1px",
                                            "accent": "#3377FF"
                                        },
                                        "timeZone": "Europe/Madrid",
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "date1"
                                },
                                "99d1503e": {
                                    "compType": "numberInput",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "placeholder": "+449827222541",
                                        "label": {
                                            "text": "Phone #",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "formatter": "standard",
                                        "step": "",
                                        "controls": false,
                                        "thousandsSeparator": false,
                                        "prefixText": "",
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "default-theme-id",
                                        "version": "latest"
                                    },
                                    "name": "numberInput1"
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
                    "border": "#5589F2",
                    "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                    "radius": "20px",
                    "borderWidth": "3px",
                    "margin": "5px",
                    },
                "headerStyle": {
                    "containerHeaderPadding": "20px",
                    "headerBackground": "#E68E50"
                },
                "bodyStyle": {
                    "containerBodyPadding": "20px",
                    "background": "#F2DB0A"
                },
                "footerStyle": {
                    "containerFooterPadding": "20px",
                    "footerBackground": "#EA7B7B"
                },
                "appliedThemeId": "default-theme-id"
            },
          }}
          compFactory={ContainerComp}
        />
      </ExampleGroup>
    </>
  );
}