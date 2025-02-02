import { ColumnLayoutComp } from "comps/comps/columnLayout/columnLayout";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const columns={
  "manual": [
      {
          "id": 0,
          "label": "Column1",
          "key": "Column1",
          "minWidth": "",
          "background": "",
          "backgroundImage": "",
          "border": "",
          "radius": "",
          "margin": "",
          "padding": ""
      },
      {
          "id": 1,
          "label": "Column2",
          "key": "Column2",
          "minWidth": "",
          "background": "",
          "backgroundImage": "",
          "border": "",
          "radius": "",
          "margin": "",
          "padding": ""
      },
      {
          "id": 2,
          "label": "Add Column1",
          "key": "Add Column1",
          "minWidth": "",
          "background": "",
          "backgroundImage": "",
          "border": "",
          "radius": "",
          "margin": "",
          "padding": ""
      },
      {
          "id": 3,
          "label": "Add Column2",
          "key": "Add Column2",
          "minWidth": "",
          "background": "",
          "backgroundImage": "",
          "border": "",
          "radius": "",
          "margin": "",
          "padding": ""
      },
      {
          "id": 4,
          "label": "Add Column3",
          "key": "Add Column3",
          "minWidth": "",
          "background": "",
          "backgroundImage": "",
          "border": "",
          "radius": "",
          "margin": "",
          "padding": ""
      },
      {
          "id": 5,
          "label": "Add Column4",
          "key": "Add Column4",
          "minWidth": "",
          "background": "",
          "backgroundImage": "",
          "border": "",
          "radius": "",
          "margin": "",
          "padding": ""
      }
  ]
};

const container={
    "0": {
        "layout": {
            "d131aa12": {
                "i": "d131aa12",
                "h": 6,
                "w": 17,
                "x": 4,
                "y": 5,
                "pos": 1
            }
        },
        "items": {
            "d131aa12": {
                "compType": "progress",
                "comp": {
                    "value": "60",
                    "preventStyleOverwriting": false,
                    "appliedThemeId": "",
                    "version": "latest"
                },
                "name": "progress1"
            }
        }
    },
    "1": {
        "layout": {
            "e193cd76": {
                "i": "e193cd76",
                "h": 6,
                "w": 24,
                "x": 0,
                "y": 5,
                "pos": 0
            }
        },
        "items": {
            "e193cd76": {
                "compType": "button",
                "comp": {
                    "text": "Button",
                    "type": "",
                    "form": "",
                    "preventStyleOverwriting": false,
                    "appliedThemeId": "",
                    "version": "latest"
                },
                "name": "button1"
            }
        }
    },
    "2": {
        "layout": {
            "1d3eac41": {
                "i": "1d3eac41",
                "h": 7,
                "w": 21,
                "x": 1,
                "y": 5,
                "pos": 0
            }
        },
        "items": {
            "1d3eac41": {
                "compType": "switch",
                "comp": {
                    "defaultValue": "",
                    "value": "",
                    "label": {
                        "text": "Switch",
                        "width": "33",
                        "widthUnit": "%",
                        "position": "row",
                        "align": "left"
                    },
                    "preventStyleOverwriting": false,
                    "appliedThemeId": "",
                    "version": "latest"
                },
                "name": "switch1"
            }
        }
    },
    "3": {
        "layout": {
            "5853c1f5": {
                "i": "5853c1f5",
                "h": 20,
                "w": 15,
                "x": 5,
                "y": 0,
                "pos": 0
            }
        },
        "items": {
            "5853c1f5": {
                "compType": "progressCircle",
                "comp": {
                    "value": "60",
                    "preventStyleOverwriting": false,
                    "appliedThemeId": "",
                    "version": "latest"
                },
                "name": "progressCircle1"
            }
        }
    },
    "4": {
        "layout": {
            "68b3d00f": {
                "i": "68b3d00f",
                "h": 6,
                "w": 23,
                "x": 1,
                "y": 7,
                "pos": 0
            }
        },
        "items": {
            "68b3d00f": {
                "compType": "button",
                "comp": {
                    "text": "Button",
                    "type": "",
                    "form": "",
                    "preventStyleOverwriting": false,
                    "appliedThemeId": "",
                    "version": "latest"
                },
                "name": "button2"
            }
        }
    },
    "5": {
        "layout": {
            "307f8e6b": {
                "i": "307f8e6b",
                "h": 10,
                "w": 24,
                "x": 0,
                "y": 6,
                "pos": 0
            }
        },
        "items": {
            "307f8e6b": {
                "compType": "checkbox",
                "comp": {
                    "defaultValue": "",
                    "value": "",
                    "label": {
                        "text": "Check box",
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
                                    "label": "Option 1"
                                },
                                {
                                    "value": "2",
                                    "label": "Option 2"
                                }
                            ]
                        },
                        "mapData": {
                            "data": "[]"
                        }
                    },
                    "layout": "horizontal",
                    "preventStyleOverwriting": false,
                    "appliedThemeId": "",
                    "version": "latest"
                },
                "name": "checkbox1"
            }
        }
    }
};

export default function ColumnLayoutExample() {
    return (
      <>
        <ExampleGroup
          title="Basic Usage"
          description="The Following Examples Show the Basic Usage of the Column Layout Component."
        >
          <Example
            title="Hiding the Component"
            hideSettings={true}
            config={{
              containers: container,
              columns: columns,
              hidden: true,
            }}
            compFactory={ColumnLayoutComp}
          />
          <Example
            title="Disabling the Component"
            hideSettings={true}
            config={{
              containers: container,
              columns: columns, 
              disabled: true,
            }}
            compFactory={ColumnLayoutComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Column's Layout"
          description="The Following Examples Show the Column Layout options on Column Layout Component."
        >
          <Example
            title="Column Definition"
            hideSettings={true}
            config={{
              containers: container,
              columns: columns,
              templateColumns: "2fr 1fr 2fr",
              templateRows: "1fr",
            }}
            compFactory={ColumnLayoutComp}
          />
          <Example
            title="Row Definition"
            hideSettings={true}
            config={{
              containers: container,
              columns: columns,
              templateRows: "1fr 1fr 1fr",
              templateColumns: "2fr 1fr 2fr",
            }}
            compFactory={ColumnLayoutComp}
          />
          <Example
            title="Column Gap"
            hideSettings={true}
            config={{
              containers: container,
              columns: columns,
              columnGap: "100px",
              templateRows: "1fr",
              templateColumns: "2fr 1fr 2fr",
            }}
            compFactory={ColumnLayoutComp}
          />
           <Example
            title="Row Gap"
            hideSettings={true}
            config={{
              containers: container,
              columns: columns,
              rowGap: "100px",
              templateRows: "1fr 1fr",
              templateColumns: "2fr 1fr 2fr",
            }}
            compFactory={ColumnLayoutComp}
          />
        </ExampleGroup>
      </>
    );
  }