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
        }
    ]
};

const container={
    "0": {
        "layout": {
            "164dcb77": {
                "i": "164dcb77",
                "h": 6,
                "w": 14,
                "x": 5,
                "y": 4,
                "pos": 0
            }
        },
        "items": {
            "164dcb77": {
                "compType": "text",
                "comp": {
                    "text": "### Row1, Column1",
                    "autoHeight": "auto",
                    "type": "markdown",
                    "horizontalAlignment": "center",
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
            }
        }
    },
    "1": {
        "layout": {
            "6e4f0687": {
                "i": "6e4f0687",
                "h": 6,
                "w": 14,
                "x": 5,
                "y": 4,
                "pos": 0
            }
        },
        "items": {
            "6e4f0687": {
                "compType": "text",
                "comp": {
                    "text": "### Row1, Column2",
                    "autoHeight": "auto",
                    "type": "markdown",
                    "horizontalAlignment": "center",
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
                "name": "text3"
            }
        }
    },
    "2": {
        "layout": {
            "b47baba7": {
                "i": "b47baba7",
                "h": 6,
                "w": 14,
                "x": 5,
                "y": 4,
                "pos": 0
            }
        },
        "items": {
            "b47baba7": {
                "compType": "text",
                "comp": {
                    "text": "### Row2, Column1",
                    "autoHeight": "auto",
                    "type": "markdown",
                    "horizontalAlignment": "center",
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
                "name": "text2"
            }
        }
    },
    "3": {
        "layout": {
            "ce02a8ee": {
                "i": "ce02a8ee",
                "h": 6,
                "w": 14,
                "x": 5,
                "y": 3,
                "pos": 0
            }
        },
        "items": {
            "ce02a8ee": {
                "compType": "text",
                "comp": {
                    "text": "### Row2, Column2",
                    "autoHeight": "auto",
                    "type": "markdown",
                    "horizontalAlignment": "center",
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
                "name": "text4"
            }
        }
    }
};

const columnStyle = {
    "background": "linear-gradient(45deg, #d53369 0%, #daae51 100%)",
    "border": "#222222",
    "padding": "0px"
};

const style= {
    "background": "linear-gradient(135deg, #FFFFFF 0%, rgba(255, 255, 255, 1) 100%)"
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
            width={1000}
            config={{
              containers: container,
              columns: columns,
              hidden: true,
              columnStyle: columnStyle,
              style: style,
              templateRows: "3fr 1fr",
              templateColumns: "1fr 3fr",
            }}
            compFactory={ColumnLayoutComp}
          />
          <Example
            title="Disabling the Component"
            hideSettings={true}
            width={1000}
            config={{
              containers: container,
              columns: columns, 
              disabled: true,
              columnStyle: columnStyle,
              style: style,
              templateRows: "3fr 1fr",
              templateColumns: "1fr 3fr",
              matchColumnsHeight: true,
            }}
            compFactory={ColumnLayoutComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Column's Layout"
          description="The Following Examples Show the Column Layout options on Column Layout Component."
        >
          <Example
            title="Column Definition - 3 Columns with different sizes"
            hideSettings={true}
            width={1000}
            config={{
              containers: {
                "0": {
                    "layout": {
                        "164dcb77": {
                            "i": "164dcb77",
                            "h": 6,
                            "w": 14,
                            "x": 5,
                            "y": 4,
                            "pos": 0
                        }
                    },
                    "items": {
                        "164dcb77": {
                            "compType": "text",
                            "comp": {
                                "text": "### Row1, Column1",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "center",
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
                        }
                    }
                },
                "1": {
                    "layout": {
                        "6e4f0687": {
                            "i": "6e4f0687",
                            "h": 6,
                            "w": 14,
                            "x": 5,
                            "y": 4,
                            "pos": 0
                        }
                    },
                    "items": {
                        "6e4f0687": {
                            "compType": "text",
                            "comp": {
                                "text": "### Row1, Column2",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "center",
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
                            "name": "text3"
                        }
                    }
                },
                "2": {
                    "layout": {
                        "b47baba7": {
                            "i": "b47baba7",
                            "h": 6,
                            "w": 14,
                            "x": 5,
                            "y": 4,
                            "pos": 0
                        }
                    },
                    "items": {
                        "b47baba7": {
                            "compType": "text",
                            "comp": {
                                "text": "### Row1, Column3",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "center",
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
                            "name": "text2"
                        }
                    }
                },
                "3": {
                    "layout": {
                        "ce02a8ee": {
                            "i": "ce02a8ee",
                            "h": 6,
                            "w": 14,
                            "x": 5,
                            "y": 3,
                            "pos": 0
                        }
                    },
                    "items": {
                        "ce02a8ee": {
                            "compType": "text",
                            "comp": {
                                "text": "### Row2, Column1",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "center",
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
                            "name": "text4"
                        }
                    }
                },
                "4": {
                    "layout": {
                        "7ff66f36": {
                            "i": "7ff66f36",
                            "h": 6,
                            "w": 24,
                            "x": 0,
                            "y": 2,
                            "pos": 0
                        }
                    },
                    "items": {
                        "7ff66f36": {
                            "compType": "text",
                            "comp": {
                                "text": "### Row2, Column2",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "center",
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
                            "name": "text5"
                        }
                    }
                },
                "5": {
                    "layout": {
                        "8e25033d": {
                            "i": "8e25033d",
                            "h": 6,
                            "w": 14,
                            "x": 5,
                            "y": 2,
                            "pos": 0
                        }
                    },
                    "items": {
                        "8e25033d": {
                            "compType": "text",
                            "comp": {
                                "text": "### Row2, Column3",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "center",
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
                            "name": "text6"
                        }
                    }
                }
            },
              columns: {
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
            },
              templateColumns: "2fr 1fr 2fr",
              templateRows: "1fr 1fr",
              columnStyle: columnStyle,
              style: style,
              matchColumnsHeight: true,
            }}
            compFactory={ColumnLayoutComp}
          />
          <Example
            title="Row Definition - 3 Rows with different sizes"
            hideSettings={true}
            width={1000}
            config={{
              containers: {
                "0": {
                    "layout": {
                        "164dcb77": {
                            "i": "164dcb77",
                            "h": 8,
                            "w": 19,
                            "x": 3,
                            "y": 4,
                            "pos": 0
                        }
                    },
                    "items": {
                        "164dcb77": {
                            "compType": "text",
                            "comp": {
                                "text": "### Row1, Column1",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "center",
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
                        }
                    }
                },
                "1": {
                    "layout": {
                        "6e4f0687": {
                            "i": "6e4f0687",
                            "h": 6,
                            "w": 24,
                            "x": 0,
                            "y": 5,
                            "pos": 0
                        }
                    },
                    "items": {
                        "6e4f0687": {
                            "compType": "text",
                            "comp": {
                                "text": "### Row1, Column2",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "center",
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
                            "name": "text3"
                        }
                    }
                },
                "2": {
                    "layout": {
                        "b47baba7": {
                            "i": "b47baba7",
                            "h": 10,
                            "w": 18,
                            "x": 5,
                            "y": 4,
                            "pos": 0
                        }
                    },
                    "items": {
                        "b47baba7": {
                            "compType": "text",
                            "comp": {
                                "text": "### Row1, Column3",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "center",
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
                            "name": "text2"
                        }
                    }
                },
                "3": {
                    "layout": {
                        "ce02a8ee": {
                            "i": "ce02a8ee",
                            "h": 8,
                            "w": 17,
                            "x": 2,
                            "y": 16,
                            "pos": 0
                        }
                    },
                    "items": {
                        "ce02a8ee": {
                            "compType": "text",
                            "comp": {
                                "text": "### Row2, Column1",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "center",
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
                            "name": "text4"
                        }
                    }
                },
                "4": {
                    "layout": {
                        "7ff66f36": {
                            "i": "7ff66f36",
                            "h": 6,
                            "w": 24,
                            "x": 0,
                            "y": 16,
                            "pos": 0
                        }
                    },
                    "items": {
                        "7ff66f36": {
                            "compType": "text",
                            "comp": {
                                "text": "### Row2, Column2",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "center",
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
                            "name": "text5"
                        }
                    }
                },
                "5": {
                    "layout": {
                        "8e25033d": {
                            "i": "8e25033d",
                            "h": 8,
                            "w": 19,
                            "x": 3,
                            "y": 16,
                            "pos": 0
                        }
                    },
                    "items": {
                        "8e25033d": {
                            "compType": "text",
                            "comp": {
                                "text": "### Row2, Column3",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "center",
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
                            "name": "text6"
                        }
                    }
                },
                "6": {
                    "layout": {
                        "e92230c": {
                            "i": "e92230c",
                            "h": 8,
                            "w": 19,
                            "x": 2,
                            "y": 3,
                            "pos": 0
                        }
                    },
                    "items": {
                        "e92230c": {
                            "compType": "text",
                            "comp": {
                                "text": "### Row3, Column1",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "center",
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
                            "name": "text7"
                        }
                    }
                },
                "7": {
                    "layout": {
                        "5e09b262": {
                            "i": "5e09b262",
                            "h": 6,
                            "w": 24,
                            "x": 0,
                            "y": 4,
                            "pos": 0
                        }
                    },
                    "items": {
                        "5e09b262": {
                            "compType": "text",
                            "comp": {
                                "text": "### Row3, Column2",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "center",
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
                            "name": "text8"
                        }
                    }
                },
                "8": {
                    "layout": {
                        "1bc7c61f": {
                            "i": "1bc7c61f",
                            "h": 8,
                            "w": 20,
                            "x": 1,
                            "y": 2,
                            "pos": 0
                        }
                    },
                    "items": {
                        "1bc7c61f": {
                            "compType": "text",
                            "comp": {
                                "text": "### Row3, Column3",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "center",
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
                            "name": "text9"
                        }
                    }
                }
            },
              columns: {
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
                    },
                    {
                        "id": 6,
                        "label": "Add Column5",
                        "key": "Add Column5",
                        "minWidth": "",
                        "background": "",
                        "backgroundImage": "",
                        "border": "",
                        "radius": "",
                        "margin": "",
                        "padding": ""
                    },
                    {
                        "id": 7,
                        "label": "Add Column6",
                        "key": "Add Column6",
                        "minWidth": "",
                        "background": "",
                        "backgroundImage": "",
                        "border": "",
                        "radius": "",
                        "margin": "",
                        "padding": ""
                    },
                    {
                        "id": 8,
                        "label": "Add Column7",
                        "key": "Add Column7",
                        "minWidth": "",
                        "background": "",
                        "backgroundImage": "",
                        "border": "",
                        "radius": "",
                        "margin": "",
                        "padding": ""
                    }
                ]
            },
              templateRows: "1fr 3fr 1fr",
              templateColumns: "1fr 3fr 1fr",
              columnStyle: columnStyle,
              style: style,
              matchColumnsHeight: true,
            }}
            compFactory={ColumnLayoutComp}
          />
          <Example
            title="Column Gap"
            hideSettings={true}
            width={1000}
            config={{
              containers: container,
              columns: columns,
              columnGap: "200px",
              templateRows: "3fr 1fr",
              templateColumns: "1fr 3fr",
              columnStyle: columnStyle,
              style: style,
            }}
            compFactory={ColumnLayoutComp}
          />
           <Example
            title="Row Gap"
            hideSettings={true}
            width={1000}
            config={{
              containers: container,
              columns: columns,
              rowGap: "200px",
              templateRows: "3fr 1fr",
              templateColumns: "1fr 3fr",
              columnStyle: columnStyle,
              style: style,
            }}
            compFactory={ColumnLayoutComp}
          />
        </ExampleGroup>
      </>
    );
  }