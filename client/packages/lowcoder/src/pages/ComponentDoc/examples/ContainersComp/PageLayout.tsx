import { PageLayoutComp } from "comps/comps/containerComp/pageLayoutComp";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const container={
  "header": {
      "layout": {
          "f7820dbc": {
              "i": "f7820dbc",
              "h": 6,
              "w": 24,
              "x": 0,
              "y": 0,
              "pos": 0
          }
      },
      "items": {
          "f7820dbc": {
              "compType": "text",
              "comp": {
                  "text": "### Page Layout Header",
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
  "sider": {
      "layout": {
          "a9d16086": {
              "i": "a9d16086",
              "h": 6,
              "w": 22,
              "x": 0,
              "y": 0,
              "pos": 0
          }
      },
      "items": {
          "a9d16086": {
              "compType": "dropdown",
              "comp": {
                  "text": "Menu",
                  "options": {
                      "optionType": "manual",
                      "manual": {
                          "manual": [
                              {
                                  "label": "Option 1"
                              },
                              {
                                  "label": "Option 2"
                              }
                          ]
                      },
                      "mapData": {
                          "data": "[]"
                      }
                  },
                  "preventStyleOverwriting": false,
                  "appliedThemeId": "",
                  "version": "latest"
              },
              "name": "dropdown1"
          }
      }
  },
  "body": {
      "0": {
          "view": {
              "layout": {
                  "163bc2f3": {
                      "i": "163bc2f3",
                      "h": 45,
                      "w": 21,
                      "x": 3,
                      "y": 0,
                      "pos": 0
                  }
              },
              "items": {
                  "163bc2f3": {
                      "compType": "table",
                      "comp": {
                          "showRowGridBorder": true,
                          "showHRowGridBorder": true,
                          "autoHeight": "auto",
                          "data": "[\n {\n  \"id\": 1,\n  \"name\": \"Reagen Gilberthorpe\",\n  \"date\": \"7/5/2022\",\n  \"department\": \"Marketing\"\n },\n {\n  \"id\": 2,\n  \"name\": \"Haroun Lortzing\",\n  \"date\": \"11/6/2022\",\n  \"department\": \"Human Resources\"\n },\n {\n  \"id\": 3,\n  \"name\": \"Garret Kilmaster\",\n  \"date\": \"11/14/2021\",\n  \"department\": \"Research and Development\"\n },\n {\n  \"id\": 4,\n  \"name\": \"Israel Harrowsmith\",\n  \"date\": \"4/3/2022\",\n  \"department\": \"Training\"\n },\n {\n  \"id\": 5,\n  \"name\": \"Loren O'Lagen\",\n  \"date\": \"9/10/2022\",\n  \"department\": \"Services\"\n },\n {\n  \"id\": 6,\n  \"name\": \"Wallis Hothersall\",\n  \"date\": \"4/18/2022\",\n  \"department\": \"Accounting\"\n },\n {\n  \"id\": 7,\n  \"name\": \"Kaia Biskup\",\n  \"date\": \"3/4/2022\",\n  \"department\": \"Sales\"\n },\n {\n  \"id\": 8,\n  \"name\": \"Travers Saterweyte\",\n  \"date\": \"1/9/2022\",\n  \"department\": \"Human Resources\"\n },\n {\n  \"id\": 9,\n  \"name\": \"Mikey Niemetz\",\n  \"date\": \"1/4/2022\",\n  \"department\": \"Marketing\"\n },\n {\n  \"id\": 10,\n  \"name\": \"Mano Meckiff\",\n  \"date\": \"2/19/2022\",\n  \"department\": \"Research and Development\"\n }\n]",
                          "showDataLoadSpinner": true,
                          "columns": [
                              {
                                  "title": "ID",
                                  "showTitle": true,
                                  "isCustom": false,
                                  "dataIndex": "id",
                                  "width": "55",
                                  "autoWidth": "fixed",
                                  "render": {
                                      "compType": "text",
                                      "comp": {
                                          "text": "{{currentCell}}"
                                      }
                                  },
                                  "align": "left",
                                  "fixed": "close",
                                  "background": "",
                                  "margin": "",
                                  "text": "",
                                  "border": "",
                                  "borderWidth": "",
                                  "radius": "",
                                  "textSize": "",
                                  "textWeight": "normal",
                                  "fontFamily": "sans-serif",
                                  "fontStyle": "normal",
                                  "textOverflow": "ellipsis",
                                  "linkColor": "#3377ff",
                                  "linkHoverColor": "",
                                  "linkActiveColor": "",
                                  "summaryColumns": [
                                      {
                                          "isCustom": false,
                                          "dataIndex": "",
                                          "render": {
                                              "compType": "text",
                                              "comp": {}
                                          },
                                          "align": "left",
                                          "background": "",
                                          "margin": "",
                                          "text": "",
                                          "border": "",
                                          "radius": "",
                                          "textSize": "",
                                          "textWeight": "normal",
                                          "fontFamily": "sans-serif",
                                          "fontStyle": "normal",
                                          "textOverflow": "ellipsis",
                                          "linkColor": "#3377ff",
                                          "linkHoverColor": "",
                                          "linkActiveColor": ""
                                      },
                                      {
                                          "isCustom": false,
                                          "dataIndex": "",
                                          "render": {
                                              "compType": "text",
                                              "comp": {}
                                          },
                                          "align": "left",
                                          "background": "",
                                          "margin": "",
                                          "text": "",
                                          "border": "",
                                          "radius": "",
                                          "textSize": "",
                                          "textWeight": "normal",
                                          "fontFamily": "sans-serif",
                                          "fontStyle": "normal",
                                          "textOverflow": "ellipsis",
                                          "linkColor": "#3377ff",
                                          "linkHoverColor": "",
                                          "linkActiveColor": ""
                                      },
                                      {
                                          "isCustom": false,
                                          "dataIndex": "",
                                          "render": {
                                              "compType": "text",
                                              "comp": {}
                                          },
                                          "align": "left",
                                          "background": "",
                                          "margin": "",
                                          "text": "",
                                          "border": "",
                                          "radius": "",
                                          "textSize": "",
                                          "textWeight": "normal",
                                          "fontFamily": "sans-serif",
                                          "fontStyle": "normal",
                                          "textOverflow": "ellipsis",
                                          "linkColor": "#3377ff",
                                          "linkHoverColor": "",
                                          "linkActiveColor": ""
                                      }
                                  ]
                              },
                              {
                                  "title": "Name",
                                  "showTitle": true,
                                  "isCustom": false,
                                  "dataIndex": "name",
                                  "width": "200",
                                  "autoWidth": "fixed",
                                  "render": {
                                      "compType": "text",
                                      "comp": {
                                          "text": "{{currentCell}}"
                                      }
                                  },
                                  "align": "left",
                                  "fixed": "close",
                                  "background": "",
                                  "margin": "",
                                  "text": "",
                                  "border": "",
                                  "borderWidth": "",
                                  "radius": "",
                                  "textSize": "",
                                  "textWeight": "normal",
                                  "fontFamily": "sans-serif",
                                  "fontStyle": "normal",
                                  "textOverflow": "ellipsis",
                                  "linkColor": "#3377ff",
                                  "linkHoverColor": "",
                                  "linkActiveColor": "",
                                  "summaryColumns": [
                                      {
                                          "isCustom": false,
                                          "dataIndex": "",
                                          "render": {
                                              "compType": "text",
                                              "comp": {}
                                          },
                                          "align": "left",
                                          "background": "",
                                          "margin": "",
                                          "text": "",
                                          "border": "",
                                          "radius": "",
                                          "textSize": "",
                                          "textWeight": "normal",
                                          "fontFamily": "sans-serif",
                                          "fontStyle": "normal",
                                          "textOverflow": "ellipsis",
                                          "linkColor": "#3377ff",
                                          "linkHoverColor": "",
                                          "linkActiveColor": ""
                                      },
                                      {
                                          "isCustom": false,
                                          "dataIndex": "",
                                          "render": {
                                              "compType": "text",
                                              "comp": {}
                                          },
                                          "align": "left",
                                          "background": "",
                                          "margin": "",
                                          "text": "",
                                          "border": "",
                                          "radius": "",
                                          "textSize": "",
                                          "textWeight": "normal",
                                          "fontFamily": "sans-serif",
                                          "fontStyle": "normal",
                                          "textOverflow": "ellipsis",
                                          "linkColor": "#3377ff",
                                          "linkHoverColor": "",
                                          "linkActiveColor": ""
                                      },
                                      {
                                          "isCustom": false,
                                          "dataIndex": "",
                                          "render": {
                                              "compType": "text",
                                              "comp": {}
                                          },
                                          "align": "left",
                                          "background": "",
                                          "margin": "",
                                          "text": "",
                                          "border": "",
                                          "radius": "",
                                          "textSize": "",
                                          "textWeight": "normal",
                                          "fontFamily": "sans-serif",
                                          "fontStyle": "normal",
                                          "textOverflow": "ellipsis",
                                          "linkColor": "#3377ff",
                                          "linkHoverColor": "",
                                          "linkActiveColor": ""
                                      }
                                  ]
                              },
                              {
                                  "title": "Date",
                                  "showTitle": true,
                                  "isCustom": false,
                                  "dataIndex": "date",
                                  "width": "110",
                                  "autoWidth": "fixed",
                                  "render": {
                                      "compType": "text",
                                      "comp": {
                                          "text": "{{currentCell}}"
                                      }
                                  },
                                  "align": "left",
                                  "fixed": "close",
                                  "background": "",
                                  "margin": "",
                                  "text": "",
                                  "border": "",
                                  "borderWidth": "",
                                  "radius": "",
                                  "textSize": "",
                                  "textWeight": "normal",
                                  "fontFamily": "sans-serif",
                                  "fontStyle": "normal",
                                  "textOverflow": "ellipsis",
                                  "linkColor": "#3377ff",
                                  "linkHoverColor": "",
                                  "linkActiveColor": "",
                                  "summaryColumns": [
                                      {
                                          "isCustom": false,
                                          "dataIndex": "",
                                          "render": {
                                              "compType": "text",
                                              "comp": {}
                                          },
                                          "align": "left",
                                          "background": "",
                                          "margin": "",
                                          "text": "",
                                          "border": "",
                                          "radius": "",
                                          "textSize": "",
                                          "textWeight": "normal",
                                          "fontFamily": "sans-serif",
                                          "fontStyle": "normal",
                                          "textOverflow": "ellipsis",
                                          "linkColor": "#3377ff",
                                          "linkHoverColor": "",
                                          "linkActiveColor": ""
                                      },
                                      {
                                          "isCustom": false,
                                          "dataIndex": "",
                                          "render": {
                                              "compType": "text",
                                              "comp": {}
                                          },
                                          "align": "left",
                                          "background": "",
                                          "margin": "",
                                          "text": "",
                                          "border": "",
                                          "radius": "",
                                          "textSize": "",
                                          "textWeight": "normal",
                                          "fontFamily": "sans-serif",
                                          "fontStyle": "normal",
                                          "textOverflow": "ellipsis",
                                          "linkColor": "#3377ff",
                                          "linkHoverColor": "",
                                          "linkActiveColor": ""
                                      },
                                      {
                                          "isCustom": false,
                                          "dataIndex": "",
                                          "render": {
                                              "compType": "text",
                                              "comp": {}
                                          },
                                          "align": "left",
                                          "background": "",
                                          "margin": "",
                                          "text": "",
                                          "border": "",
                                          "radius": "",
                                          "textSize": "",
                                          "textWeight": "normal",
                                          "fontFamily": "sans-serif",
                                          "fontStyle": "normal",
                                          "textOverflow": "ellipsis",
                                          "linkColor": "#3377ff",
                                          "linkHoverColor": "",
                                          "linkActiveColor": ""
                                      }
                                  ]
                              },
                              {
                                  "title": "Department",
                                  "showTitle": true,
                                  "isCustom": false,
                                  "dataIndex": "department",
                                  "width": "250",
                                  "autoWidth": "fixed",
                                  "render": {
                                      "compType": "tag",
                                      "comp": {
                                          "text": "{{currentCell}}",
                                          "tagColors": {
                                              "optionType": "manual",
                                              "manual": {
                                                  "manual": [
                                                      {
                                                          "label": "Tag1",
                                                          "icon": "/icon:solid/tag",
                                                          "color": "#f50"
                                                      },
                                                      {
                                                          "label": "Tag2",
                                                          "icon": "/icon:solid/tag",
                                                          "color": "#2db7f5"
                                                      }
                                                  ]
                                              },
                                              "mapData": {
                                                  "data": "[]",
                                                  "mapData": {
                                                      "color": ""
                                                  }
                                              }
                                          }
                                      }
                                  },
                                  "align": "left",
                                  "fixed": "close",
                                  "background": "",
                                  "margin": "",
                                  "text": "",
                                  "border": "",
                                  "borderWidth": "",
                                  "radius": "",
                                  "textSize": "",
                                  "textWeight": "normal",
                                  "fontFamily": "sans-serif",
                                  "fontStyle": "normal",
                                  "textOverflow": "ellipsis",
                                  "linkColor": "#3377ff",
                                  "linkHoverColor": "",
                                  "linkActiveColor": "",
                                  "summaryColumns": [
                                      {
                                          "isCustom": false,
                                          "dataIndex": "",
                                          "render": {
                                              "compType": "text",
                                              "comp": {}
                                          },
                                          "align": "left",
                                          "background": "",
                                          "margin": "",
                                          "text": "",
                                          "border": "",
                                          "radius": "",
                                          "textSize": "",
                                          "textWeight": "normal",
                                          "fontFamily": "sans-serif",
                                          "fontStyle": "normal",
                                          "textOverflow": "ellipsis",
                                          "linkColor": "#3377ff",
                                          "linkHoverColor": "",
                                          "linkActiveColor": ""
                                      },
                                      {
                                          "isCustom": false,
                                          "dataIndex": "",
                                          "render": {
                                              "compType": "text",
                                              "comp": {}
                                          },
                                          "align": "left",
                                          "background": "",
                                          "margin": "",
                                          "text": "",
                                          "border": "",
                                          "radius": "",
                                          "textSize": "",
                                          "textWeight": "normal",
                                          "fontFamily": "sans-serif",
                                          "fontStyle": "normal",
                                          "textOverflow": "ellipsis",
                                          "linkColor": "#3377ff",
                                          "linkHoverColor": "",
                                          "linkActiveColor": ""
                                      },
                                      {
                                          "isCustom": false,
                                          "dataIndex": "",
                                          "render": {
                                              "compType": "text",
                                              "comp": {}
                                          },
                                          "align": "left",
                                          "background": "",
                                          "margin": "",
                                          "text": "",
                                          "border": "",
                                          "radius": "",
                                          "textSize": "",
                                          "textWeight": "normal",
                                          "fontFamily": "sans-serif",
                                          "fontStyle": "normal",
                                          "textOverflow": "ellipsis",
                                          "linkColor": "#3377ff",
                                          "linkHoverColor": "",
                                          "linkActiveColor": ""
                                      }
                                  ]
                              }
                          ],
                          "size": "middle",
                          "selection": {
                              "mode": "single"
                          },
                          "pagination": {
                              "changeablePageSize": null,
                              "pageSizeOptions": "[5, 10, 20, 50]"
                          },
                          "sort": [],
                          "toolbar": {
                              "showRefresh": true,
                              "showDownload": true,
                              "showFilter": true,
                              "position": "below",
                              "columnSeparator": ",",
                              "showUpdateButtons": true
                          },
                          "summaryRows": "1",
                          "rowAutoHeight": "auto",
                          "tableAutoHeight": "auto",
                          "expansion": {
                              "slot": {
                                  "container": {
                                      "layout": {}
                                  }
                              }
                          },
                          "editModeClicks": "single",
                          "preventStyleOverwriting": false,
                          "appliedThemeId": "",
                          "version": "latest"
                      },
                      "name": "table1"
                  }
              }
          }
      }
  },
  "footer": {
      "layout": {
          "3a74e36e": {
              "i": "3a74e36e",
              "h": 6,
              "w": 24,
              "x": 0,
              "y": 2,
              "pos": 0
          }
      },
      "items": {
          "3a74e36e": {
              "compType": "text",
              "comp": {
                  "text": "### Page Layout Footer",
                  "autoHeight": "auto",
                  "type": "markdown",
                  "horizontalAlignment": "center",
                  "contentScrollBar": true,
                  "verticalAlignment": "center",
                  "style": {
                      "background": "#fff"
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
                  "appliedThemeId": "",
                  "version": "latest"
              },
              "name": "text2"
          }
      }
  },
  "showHeader": true,
  "showSider": true,
  "innerSider": true,
  "siderCollapsible": true,
  "siderCollapsed": true,
  "siderRight": false,
  "siderWidth": "20%",
  "siderCollapsedWidth": "0",
  "showFooter": true,
  "horizontalGridCells": 24,
  "autoHeight": "auto",
  "siderScrollbars": false,
  "contentScrollbars": false,
  "mainScrollbars": false,
  "appliedThemeId": ""
};

export default function PageLayoutExample() {
    return (
      <>
        <ExampleGroup
          title="Basic Usage"
          description="The Following Examples Show the Basic Usage of the Page Layout Component."
        >
          <Example
            title="A simple Page Layout Component"
            hideSettings={true}
            config={{ 
              container: container,
            }}
            compFactory={PageLayoutComp}
          />
          <Example
            title="Disabling the Page Layout Component"
            hideSettings={true}
            config={{ 
                disabled: true,
                container: container,
            }}
            compFactory={PageLayoutComp}
          />
          <Example
            title="Hiding the Page Layout Component"
            hideSettings={true}
            config={{ 
                hidden: true,
                container: container,
            }}
            compFactory={PageLayoutComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Layout"
          description="The Following Examples Show the Layout options on Component."
        >
          <Example
            title="Hiding Page Layout Header"
            hideSettings={true}
            config={{
              container: {
                "header": {
                    "layout": {
                        "f7820dbc": {
                            "i": "f7820dbc",
                            "h": 6,
                            "w": 24,
                            "x": 0,
                            "y": 0,
                            "pos": 0
                        }
                    },
                    "items": {
                        "f7820dbc": {
                            "compType": "text",
                            "comp": {
                                "text": "### Page Layout Header",
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
                "sider": {
                    "layout": {
                        "a9d16086": {
                            "i": "a9d16086",
                            "h": 6,
                            "w": 22,
                            "x": 0,
                            "y": 0,
                            "pos": 0
                        }
                    },
                    "items": {
                        "a9d16086": {
                            "compType": "dropdown",
                            "comp": {
                                "text": "Menu",
                                "options": {
                                    "optionType": "manual",
                                    "manual": {
                                        "manual": [
                                            {
                                                "label": "Option 1"
                                            },
                                            {
                                                "label": "Option 2"
                                            }
                                        ]
                                    },
                                    "mapData": {
                                        "data": "[]"
                                    }
                                },
                                "preventStyleOverwriting": false,
                                "appliedThemeId": "",
                                "version": "latest"
                            },
                            "name": "dropdown1"
                        }
                    }
                },
                "body": {
                    "0": {
                        "view": {
                            "layout": {
                                "163bc2f3": {
                                    "i": "163bc2f3",
                                    "h": 45,
                                    "w": 21,
                                    "x": 3,
                                    "y": 0,
                                    "pos": 0
                                }
                            },
                            "items": {
                                "163bc2f3": {
                                    "compType": "table",
                                    "comp": {
                                        "showRowGridBorder": true,
                                        "showHRowGridBorder": true,
                                        "autoHeight": "auto",
                                        "data": "[\n {\n  \"id\": 1,\n  \"name\": \"Reagen Gilberthorpe\",\n  \"date\": \"7/5/2022\",\n  \"department\": \"Marketing\"\n },\n {\n  \"id\": 2,\n  \"name\": \"Haroun Lortzing\",\n  \"date\": \"11/6/2022\",\n  \"department\": \"Human Resources\"\n },\n {\n  \"id\": 3,\n  \"name\": \"Garret Kilmaster\",\n  \"date\": \"11/14/2021\",\n  \"department\": \"Research and Development\"\n },\n {\n  \"id\": 4,\n  \"name\": \"Israel Harrowsmith\",\n  \"date\": \"4/3/2022\",\n  \"department\": \"Training\"\n },\n {\n  \"id\": 5,\n  \"name\": \"Loren O'Lagen\",\n  \"date\": \"9/10/2022\",\n  \"department\": \"Services\"\n },\n {\n  \"id\": 6,\n  \"name\": \"Wallis Hothersall\",\n  \"date\": \"4/18/2022\",\n  \"department\": \"Accounting\"\n },\n {\n  \"id\": 7,\n  \"name\": \"Kaia Biskup\",\n  \"date\": \"3/4/2022\",\n  \"department\": \"Sales\"\n },\n {\n  \"id\": 8,\n  \"name\": \"Travers Saterweyte\",\n  \"date\": \"1/9/2022\",\n  \"department\": \"Human Resources\"\n },\n {\n  \"id\": 9,\n  \"name\": \"Mikey Niemetz\",\n  \"date\": \"1/4/2022\",\n  \"department\": \"Marketing\"\n },\n {\n  \"id\": 10,\n  \"name\": \"Mano Meckiff\",\n  \"date\": \"2/19/2022\",\n  \"department\": \"Research and Development\"\n }\n]",
                                        "showDataLoadSpinner": true,
                                        "columns": [
                                            {
                                                "title": "ID",
                                                "showTitle": true,
                                                "isCustom": false,
                                                "dataIndex": "id",
                                                "width": "55",
                                                "autoWidth": "fixed",
                                                "render": {
                                                    "compType": "text",
                                                    "comp": {
                                                        "text": "{{currentCell}}"
                                                    }
                                                },
                                                "align": "left",
                                                "fixed": "close",
                                                "background": "",
                                                "margin": "",
                                                "text": "",
                                                "border": "",
                                                "borderWidth": "",
                                                "radius": "",
                                                "textSize": "",
                                                "textWeight": "normal",
                                                "fontFamily": "sans-serif",
                                                "fontStyle": "normal",
                                                "textOverflow": "ellipsis",
                                                "linkColor": "#3377ff",
                                                "linkHoverColor": "",
                                                "linkActiveColor": "",
                                                "summaryColumns": [
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    }
                                                ]
                                            },
                                            {
                                                "title": "Name",
                                                "showTitle": true,
                                                "isCustom": false,
                                                "dataIndex": "name",
                                                "width": "200",
                                                "autoWidth": "fixed",
                                                "render": {
                                                    "compType": "text",
                                                    "comp": {
                                                        "text": "{{currentCell}}"
                                                    }
                                                },
                                                "align": "left",
                                                "fixed": "close",
                                                "background": "",
                                                "margin": "",
                                                "text": "",
                                                "border": "",
                                                "borderWidth": "",
                                                "radius": "",
                                                "textSize": "",
                                                "textWeight": "normal",
                                                "fontFamily": "sans-serif",
                                                "fontStyle": "normal",
                                                "textOverflow": "ellipsis",
                                                "linkColor": "#3377ff",
                                                "linkHoverColor": "",
                                                "linkActiveColor": "",
                                                "summaryColumns": [
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    }
                                                ]
                                            },
                                            {
                                                "title": "Date",
                                                "showTitle": true,
                                                "isCustom": false,
                                                "dataIndex": "date",
                                                "width": "110",
                                                "autoWidth": "fixed",
                                                "render": {
                                                    "compType": "text",
                                                    "comp": {
                                                        "text": "{{currentCell}}"
                                                    }
                                                },
                                                "align": "left",
                                                "fixed": "close",
                                                "background": "",
                                                "margin": "",
                                                "text": "",
                                                "border": "",
                                                "borderWidth": "",
                                                "radius": "",
                                                "textSize": "",
                                                "textWeight": "normal",
                                                "fontFamily": "sans-serif",
                                                "fontStyle": "normal",
                                                "textOverflow": "ellipsis",
                                                "linkColor": "#3377ff",
                                                "linkHoverColor": "",
                                                "linkActiveColor": "",
                                                "summaryColumns": [
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    }
                                                ]
                                            },
                                            {
                                                "title": "Department",
                                                "showTitle": true,
                                                "isCustom": false,
                                                "dataIndex": "department",
                                                "width": "250",
                                                "autoWidth": "fixed",
                                                "render": {
                                                    "compType": "tag",
                                                    "comp": {
                                                        "text": "{{currentCell}}",
                                                        "tagColors": {
                                                            "optionType": "manual",
                                                            "manual": {
                                                                "manual": [
                                                                    {
                                                                        "label": "Tag1",
                                                                        "icon": "/icon:solid/tag",
                                                                        "color": "#f50"
                                                                    },
                                                                    {
                                                                        "label": "Tag2",
                                                                        "icon": "/icon:solid/tag",
                                                                        "color": "#2db7f5"
                                                                    }
                                                                ]
                                                            },
                                                            "mapData": {
                                                                "data": "[]",
                                                                "mapData": {
                                                                    "color": ""
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "align": "left",
                                                "fixed": "close",
                                                "background": "",
                                                "margin": "",
                                                "text": "",
                                                "border": "",
                                                "borderWidth": "",
                                                "radius": "",
                                                "textSize": "",
                                                "textWeight": "normal",
                                                "fontFamily": "sans-serif",
                                                "fontStyle": "normal",
                                                "textOverflow": "ellipsis",
                                                "linkColor": "#3377ff",
                                                "linkHoverColor": "",
                                                "linkActiveColor": "",
                                                "summaryColumns": [
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    }
                                                ]
                                            }
                                        ],
                                        "size": "middle",
                                        "selection": {
                                            "mode": "single"
                                        },
                                        "pagination": {
                                            "changeablePageSize": null,
                                            "pageSizeOptions": "[5, 10, 20, 50]"
                                        },
                                        "sort": [],
                                        "toolbar": {
                                            "showRefresh": true,
                                            "showDownload": true,
                                            "showFilter": true,
                                            "position": "below",
                                            "columnSeparator": ",",
                                            "showUpdateButtons": true
                                        },
                                        "summaryRows": "1",
                                        "rowAutoHeight": "auto",
                                        "tableAutoHeight": "auto",
                                        "expansion": {
                                            "slot": {
                                                "container": {
                                                    "layout": {}
                                                }
                                            }
                                        },
                                        "editModeClicks": "single",
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "",
                                        "version": "latest"
                                    },
                                    "name": "table1"
                                }
                            }
                        }
                    }
                },
                "footer": {
                    "layout": {
                        "3a74e36e": {
                            "i": "3a74e36e",
                            "h": 6,
                            "w": 24,
                            "x": 0,
                            "y": 2,
                            "pos": 0
                        }
                    },
                    "items": {
                        "3a74e36e": {
                            "compType": "text",
                            "comp": {
                                "text": "### Page Layout Footer",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "center",
                                "contentScrollBar": true,
                                "verticalAlignment": "center",
                                "style": {
                                    "background": "#fff"
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
                                "appliedThemeId": "",
                                "version": "latest"
                            },
                            "name": "text2"
                        }
                    }
                },
                "showHeader": false,
                "showSider": true,
                "innerSider": true,
                "siderCollapsible": true,
                "siderCollapsed": true,
                "siderRight": false,
                "siderWidth": "20%",
                "siderCollapsedWidth": "0",
                "showFooter": true,
                "horizontalGridCells": 24,
                "autoHeight": "auto",
                "siderScrollbars": false,
                "contentScrollbars": false,
                "mainScrollbars": false,
                "appliedThemeId": ""
              },
            }}
            compFactory={PageLayoutComp}
          />
          <Example
            title="Hiding Page Layout Footer"
            hideSettings={true}
            config={{
              container: {
                "header": {
                    "layout": {
                        "f7820dbc": {
                            "i": "f7820dbc",
                            "h": 6,
                            "w": 24,
                            "x": 0,
                            "y": 0,
                            "pos": 0
                        }
                    },
                    "items": {
                        "f7820dbc": {
                            "compType": "text",
                            "comp": {
                                "text": "### Page Layout Header",
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
                "sider": {
                    "layout": {
                        "a9d16086": {
                            "i": "a9d16086",
                            "h": 6,
                            "w": 22,
                            "x": 0,
                            "y": 0,
                            "pos": 0
                        }
                    },
                    "items": {
                        "a9d16086": {
                            "compType": "dropdown",
                            "comp": {
                                "text": "Menu",
                                "options": {
                                    "optionType": "manual",
                                    "manual": {
                                        "manual": [
                                            {
                                                "label": "Option 1"
                                            },
                                            {
                                                "label": "Option 2"
                                            }
                                        ]
                                    },
                                    "mapData": {
                                        "data": "[]"
                                    }
                                },
                                "preventStyleOverwriting": false,
                                "appliedThemeId": "",
                                "version": "latest"
                            },
                            "name": "dropdown1"
                        }
                    }
                },
                "body": {
                    "0": {
                        "view": {
                            "layout": {
                                "163bc2f3": {
                                    "i": "163bc2f3",
                                    "h": 45,
                                    "w": 21,
                                    "x": 3,
                                    "y": 0,
                                    "pos": 0
                                }
                            },
                            "items": {
                                "163bc2f3": {
                                    "compType": "table",
                                    "comp": {
                                        "showRowGridBorder": true,
                                        "showHRowGridBorder": true,
                                        "autoHeight": "auto",
                                        "data": "[\n {\n  \"id\": 1,\n  \"name\": \"Reagen Gilberthorpe\",\n  \"date\": \"7/5/2022\",\n  \"department\": \"Marketing\"\n },\n {\n  \"id\": 2,\n  \"name\": \"Haroun Lortzing\",\n  \"date\": \"11/6/2022\",\n  \"department\": \"Human Resources\"\n },\n {\n  \"id\": 3,\n  \"name\": \"Garret Kilmaster\",\n  \"date\": \"11/14/2021\",\n  \"department\": \"Research and Development\"\n },\n {\n  \"id\": 4,\n  \"name\": \"Israel Harrowsmith\",\n  \"date\": \"4/3/2022\",\n  \"department\": \"Training\"\n },\n {\n  \"id\": 5,\n  \"name\": \"Loren O'Lagen\",\n  \"date\": \"9/10/2022\",\n  \"department\": \"Services\"\n },\n {\n  \"id\": 6,\n  \"name\": \"Wallis Hothersall\",\n  \"date\": \"4/18/2022\",\n  \"department\": \"Accounting\"\n },\n {\n  \"id\": 7,\n  \"name\": \"Kaia Biskup\",\n  \"date\": \"3/4/2022\",\n  \"department\": \"Sales\"\n },\n {\n  \"id\": 8,\n  \"name\": \"Travers Saterweyte\",\n  \"date\": \"1/9/2022\",\n  \"department\": \"Human Resources\"\n },\n {\n  \"id\": 9,\n  \"name\": \"Mikey Niemetz\",\n  \"date\": \"1/4/2022\",\n  \"department\": \"Marketing\"\n },\n {\n  \"id\": 10,\n  \"name\": \"Mano Meckiff\",\n  \"date\": \"2/19/2022\",\n  \"department\": \"Research and Development\"\n }\n]",
                                        "showDataLoadSpinner": true,
                                        "columns": [
                                            {
                                                "title": "ID",
                                                "showTitle": true,
                                                "isCustom": false,
                                                "dataIndex": "id",
                                                "width": "55",
                                                "autoWidth": "fixed",
                                                "render": {
                                                    "compType": "text",
                                                    "comp": {
                                                        "text": "{{currentCell}}"
                                                    }
                                                },
                                                "align": "left",
                                                "fixed": "close",
                                                "background": "",
                                                "margin": "",
                                                "text": "",
                                                "border": "",
                                                "borderWidth": "",
                                                "radius": "",
                                                "textSize": "",
                                                "textWeight": "normal",
                                                "fontFamily": "sans-serif",
                                                "fontStyle": "normal",
                                                "textOverflow": "ellipsis",
                                                "linkColor": "#3377ff",
                                                "linkHoverColor": "",
                                                "linkActiveColor": "",
                                                "summaryColumns": [
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    }
                                                ]
                                            },
                                            {
                                                "title": "Name",
                                                "showTitle": true,
                                                "isCustom": false,
                                                "dataIndex": "name",
                                                "width": "200",
                                                "autoWidth": "fixed",
                                                "render": {
                                                    "compType": "text",
                                                    "comp": {
                                                        "text": "{{currentCell}}"
                                                    }
                                                },
                                                "align": "left",
                                                "fixed": "close",
                                                "background": "",
                                                "margin": "",
                                                "text": "",
                                                "border": "",
                                                "borderWidth": "",
                                                "radius": "",
                                                "textSize": "",
                                                "textWeight": "normal",
                                                "fontFamily": "sans-serif",
                                                "fontStyle": "normal",
                                                "textOverflow": "ellipsis",
                                                "linkColor": "#3377ff",
                                                "linkHoverColor": "",
                                                "linkActiveColor": "",
                                                "summaryColumns": [
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    }
                                                ]
                                            },
                                            {
                                                "title": "Date",
                                                "showTitle": true,
                                                "isCustom": false,
                                                "dataIndex": "date",
                                                "width": "110",
                                                "autoWidth": "fixed",
                                                "render": {
                                                    "compType": "text",
                                                    "comp": {
                                                        "text": "{{currentCell}}"
                                                    }
                                                },
                                                "align": "left",
                                                "fixed": "close",
                                                "background": "",
                                                "margin": "",
                                                "text": "",
                                                "border": "",
                                                "borderWidth": "",
                                                "radius": "",
                                                "textSize": "",
                                                "textWeight": "normal",
                                                "fontFamily": "sans-serif",
                                                "fontStyle": "normal",
                                                "textOverflow": "ellipsis",
                                                "linkColor": "#3377ff",
                                                "linkHoverColor": "",
                                                "linkActiveColor": "",
                                                "summaryColumns": [
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    }
                                                ]
                                            },
                                            {
                                                "title": "Department",
                                                "showTitle": true,
                                                "isCustom": false,
                                                "dataIndex": "department",
                                                "width": "250",
                                                "autoWidth": "fixed",
                                                "render": {
                                                    "compType": "tag",
                                                    "comp": {
                                                        "text": "{{currentCell}}",
                                                        "tagColors": {
                                                            "optionType": "manual",
                                                            "manual": {
                                                                "manual": [
                                                                    {
                                                                        "label": "Tag1",
                                                                        "icon": "/icon:solid/tag",
                                                                        "color": "#f50"
                                                                    },
                                                                    {
                                                                        "label": "Tag2",
                                                                        "icon": "/icon:solid/tag",
                                                                        "color": "#2db7f5"
                                                                    }
                                                                ]
                                                            },
                                                            "mapData": {
                                                                "data": "[]",
                                                                "mapData": {
                                                                    "color": ""
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "align": "left",
                                                "fixed": "close",
                                                "background": "",
                                                "margin": "",
                                                "text": "",
                                                "border": "",
                                                "borderWidth": "",
                                                "radius": "",
                                                "textSize": "",
                                                "textWeight": "normal",
                                                "fontFamily": "sans-serif",
                                                "fontStyle": "normal",
                                                "textOverflow": "ellipsis",
                                                "linkColor": "#3377ff",
                                                "linkHoverColor": "",
                                                "linkActiveColor": "",
                                                "summaryColumns": [
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    }
                                                ]
                                            }
                                        ],
                                        "size": "middle",
                                        "selection": {
                                            "mode": "single"
                                        },
                                        "pagination": {
                                            "changeablePageSize": null,
                                            "pageSizeOptions": "[5, 10, 20, 50]"
                                        },
                                        "sort": [],
                                        "toolbar": {
                                            "showRefresh": true,
                                            "showDownload": true,
                                            "showFilter": true,
                                            "position": "below",
                                            "columnSeparator": ",",
                                            "showUpdateButtons": true
                                        },
                                        "summaryRows": "1",
                                        "rowAutoHeight": "auto",
                                        "tableAutoHeight": "auto",
                                        "expansion": {
                                            "slot": {
                                                "container": {
                                                    "layout": {}
                                                }
                                            }
                                        },
                                        "editModeClicks": "single",
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "",
                                        "version": "latest"
                                    },
                                    "name": "table1"
                                }
                            }
                        }
                    }
                },
                "footer": {
                    "layout": {
                        "3a74e36e": {
                            "i": "3a74e36e",
                            "h": 6,
                            "w": 24,
                            "x": 0,
                            "y": 2,
                            "pos": 0
                        }
                    },
                    "items": {
                        "3a74e36e": {
                            "compType": "text",
                            "comp": {
                                "text": "### Page Layout Footer",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "center",
                                "contentScrollBar": true,
                                "verticalAlignment": "center",
                                "style": {
                                    "background": "#fff"
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
                                "appliedThemeId": "",
                                "version": "latest"
                            },
                            "name": "text2"
                        }
                    }
                },
                "showHeader": true,
                "showSider": true,
                "innerSider": true,
                "siderCollapsible": true,
                "siderCollapsed": true,
                "siderRight": false,
                "siderWidth": "20%",
                "siderCollapsedWidth": "0",
                "showFooter": false,
                "horizontalGridCells": 24,
                "autoHeight": "auto",
                "siderScrollbars": false,
                "contentScrollbars": false,
                "mainScrollbars": false,
                "appliedThemeId": ""
              },
            }}
            compFactory={PageLayoutComp}
          />

          <Example
            title="Hiding the Sidebar"
            hideSettings={true}
            config={{
              container: {
                "header": {
                    "layout": {
                        "f7820dbc": {
                            "i": "f7820dbc",
                            "h": 6,
                            "w": 24,
                            "x": 0,
                            "y": 0,
                            "pos": 0
                        }
                    },
                    "items": {
                        "f7820dbc": {
                            "compType": "text",
                            "comp": {
                                "text": "### Page Layout Header",
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
                "sider": {
                    "layout": {
                        "a9d16086": {
                            "i": "a9d16086",
                            "h": 6,
                            "w": 22,
                            "x": 0,
                            "y": 0,
                            "pos": 0
                        }
                    },
                    "items": {
                        "a9d16086": {
                            "compType": "dropdown",
                            "comp": {
                                "text": "Menu",
                                "options": {
                                    "optionType": "manual",
                                    "manual": {
                                        "manual": [
                                            {
                                                "label": "Option 1"
                                            },
                                            {
                                                "label": "Option 2"
                                            }
                                        ]
                                    },
                                    "mapData": {
                                        "data": "[]"
                                    }
                                },
                                "preventStyleOverwriting": false,
                                "appliedThemeId": "",
                                "version": "latest"
                            },
                            "name": "dropdown1"
                        }
                    }
                },
                "body": {
                    "0": {
                        "view": {
                            "layout": {
                                "163bc2f3": {
                                    "i": "163bc2f3",
                                    "h": 45,
                                    "w": 21,
                                    "x": 3,
                                    "y": 0,
                                    "pos": 0
                                }
                            },
                            "items": {
                                "163bc2f3": {
                                    "compType": "table",
                                    "comp": {
                                        "showRowGridBorder": true,
                                        "showHRowGridBorder": true,
                                        "autoHeight": "auto",
                                        "data": "[\n {\n  \"id\": 1,\n  \"name\": \"Reagen Gilberthorpe\",\n  \"date\": \"7/5/2022\",\n  \"department\": \"Marketing\"\n },\n {\n  \"id\": 2,\n  \"name\": \"Haroun Lortzing\",\n  \"date\": \"11/6/2022\",\n  \"department\": \"Human Resources\"\n },\n {\n  \"id\": 3,\n  \"name\": \"Garret Kilmaster\",\n  \"date\": \"11/14/2021\",\n  \"department\": \"Research and Development\"\n },\n {\n  \"id\": 4,\n  \"name\": \"Israel Harrowsmith\",\n  \"date\": \"4/3/2022\",\n  \"department\": \"Training\"\n },\n {\n  \"id\": 5,\n  \"name\": \"Loren O'Lagen\",\n  \"date\": \"9/10/2022\",\n  \"department\": \"Services\"\n },\n {\n  \"id\": 6,\n  \"name\": \"Wallis Hothersall\",\n  \"date\": \"4/18/2022\",\n  \"department\": \"Accounting\"\n },\n {\n  \"id\": 7,\n  \"name\": \"Kaia Biskup\",\n  \"date\": \"3/4/2022\",\n  \"department\": \"Sales\"\n },\n {\n  \"id\": 8,\n  \"name\": \"Travers Saterweyte\",\n  \"date\": \"1/9/2022\",\n  \"department\": \"Human Resources\"\n },\n {\n  \"id\": 9,\n  \"name\": \"Mikey Niemetz\",\n  \"date\": \"1/4/2022\",\n  \"department\": \"Marketing\"\n },\n {\n  \"id\": 10,\n  \"name\": \"Mano Meckiff\",\n  \"date\": \"2/19/2022\",\n  \"department\": \"Research and Development\"\n }\n]",
                                        "showDataLoadSpinner": true,
                                        "columns": [
                                            {
                                                "title": "ID",
                                                "showTitle": true,
                                                "isCustom": false,
                                                "dataIndex": "id",
                                                "width": "55",
                                                "autoWidth": "fixed",
                                                "render": {
                                                    "compType": "text",
                                                    "comp": {
                                                        "text": "{{currentCell}}"
                                                    }
                                                },
                                                "align": "left",
                                                "fixed": "close",
                                                "background": "",
                                                "margin": "",
                                                "text": "",
                                                "border": "",
                                                "borderWidth": "",
                                                "radius": "",
                                                "textSize": "",
                                                "textWeight": "normal",
                                                "fontFamily": "sans-serif",
                                                "fontStyle": "normal",
                                                "textOverflow": "ellipsis",
                                                "linkColor": "#3377ff",
                                                "linkHoverColor": "",
                                                "linkActiveColor": "",
                                                "summaryColumns": [
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    }
                                                ]
                                            },
                                            {
                                                "title": "Name",
                                                "showTitle": true,
                                                "isCustom": false,
                                                "dataIndex": "name",
                                                "width": "200",
                                                "autoWidth": "fixed",
                                                "render": {
                                                    "compType": "text",
                                                    "comp": {
                                                        "text": "{{currentCell}}"
                                                    }
                                                },
                                                "align": "left",
                                                "fixed": "close",
                                                "background": "",
                                                "margin": "",
                                                "text": "",
                                                "border": "",
                                                "borderWidth": "",
                                                "radius": "",
                                                "textSize": "",
                                                "textWeight": "normal",
                                                "fontFamily": "sans-serif",
                                                "fontStyle": "normal",
                                                "textOverflow": "ellipsis",
                                                "linkColor": "#3377ff",
                                                "linkHoverColor": "",
                                                "linkActiveColor": "",
                                                "summaryColumns": [
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    }
                                                ]
                                            },
                                            {
                                                "title": "Date",
                                                "showTitle": true,
                                                "isCustom": false,
                                                "dataIndex": "date",
                                                "width": "110",
                                                "autoWidth": "fixed",
                                                "render": {
                                                    "compType": "text",
                                                    "comp": {
                                                        "text": "{{currentCell}}"
                                                    }
                                                },
                                                "align": "left",
                                                "fixed": "close",
                                                "background": "",
                                                "margin": "",
                                                "text": "",
                                                "border": "",
                                                "borderWidth": "",
                                                "radius": "",
                                                "textSize": "",
                                                "textWeight": "normal",
                                                "fontFamily": "sans-serif",
                                                "fontStyle": "normal",
                                                "textOverflow": "ellipsis",
                                                "linkColor": "#3377ff",
                                                "linkHoverColor": "",
                                                "linkActiveColor": "",
                                                "summaryColumns": [
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    }
                                                ]
                                            },
                                            {
                                                "title": "Department",
                                                "showTitle": true,
                                                "isCustom": false,
                                                "dataIndex": "department",
                                                "width": "250",
                                                "autoWidth": "fixed",
                                                "render": {
                                                    "compType": "tag",
                                                    "comp": {
                                                        "text": "{{currentCell}}",
                                                        "tagColors": {
                                                            "optionType": "manual",
                                                            "manual": {
                                                                "manual": [
                                                                    {
                                                                        "label": "Tag1",
                                                                        "icon": "/icon:solid/tag",
                                                                        "color": "#f50"
                                                                    },
                                                                    {
                                                                        "label": "Tag2",
                                                                        "icon": "/icon:solid/tag",
                                                                        "color": "#2db7f5"
                                                                    }
                                                                ]
                                                            },
                                                            "mapData": {
                                                                "data": "[]",
                                                                "mapData": {
                                                                    "color": ""
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "align": "left",
                                                "fixed": "close",
                                                "background": "",
                                                "margin": "",
                                                "text": "",
                                                "border": "",
                                                "borderWidth": "",
                                                "radius": "",
                                                "textSize": "",
                                                "textWeight": "normal",
                                                "fontFamily": "sans-serif",
                                                "fontStyle": "normal",
                                                "textOverflow": "ellipsis",
                                                "linkColor": "#3377ff",
                                                "linkHoverColor": "",
                                                "linkActiveColor": "",
                                                "summaryColumns": [
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    }
                                                ]
                                            }
                                        ],
                                        "size": "middle",
                                        "selection": {
                                            "mode": "single"
                                        },
                                        "pagination": {
                                            "changeablePageSize": null,
                                            "pageSizeOptions": "[5, 10, 20, 50]"
                                        },
                                        "sort": [],
                                        "toolbar": {
                                            "showRefresh": true,
                                            "showDownload": true,
                                            "showFilter": true,
                                            "position": "below",
                                            "columnSeparator": ",",
                                            "showUpdateButtons": true
                                        },
                                        "summaryRows": "1",
                                        "rowAutoHeight": "auto",
                                        "tableAutoHeight": "auto",
                                        "expansion": {
                                            "slot": {
                                                "container": {
                                                    "layout": {}
                                                }
                                            }
                                        },
                                        "editModeClicks": "single",
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "",
                                        "version": "latest"
                                    },
                                    "name": "table1"
                                }
                            }
                        }
                    }
                },
                "footer": {
                    "layout": {
                        "3a74e36e": {
                            "i": "3a74e36e",
                            "h": 6,
                            "w": 24,
                            "x": 0,
                            "y": 2,
                            "pos": 0
                        }
                    },
                    "items": {
                        "3a74e36e": {
                            "compType": "text",
                            "comp": {
                                "text": "### Page Layout Footer",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "center",
                                "contentScrollBar": true,
                                "verticalAlignment": "center",
                                "style": {
                                    "background": "#fff"
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
                                "appliedThemeId": "",
                                "version": "latest"
                            },
                            "name": "text2"
                        }
                    }
                },
                "showHeader": true,
                "showSider": false,
                "innerSider": true,
                "siderCollapsible": true,
                "siderCollapsed": true,
                "siderRight": false,
                "siderWidth": "20%",
                "siderCollapsedWidth": "0",
                "showFooter": true,
                "horizontalGridCells": 24,
                "autoHeight": "auto",
                "siderScrollbars": false,
                "contentScrollbars": false,
                "mainScrollbars": false,
                "appliedThemeId": ""
              },
            }}
            compFactory={PageLayoutComp}
          />

          <Example
            title="Showing Sidebar by Default - Non-Collapsable"
            hideSettings={true}
            config={{
              container: {
                "header": {
                    "layout": {
                        "f7820dbc": {
                            "i": "f7820dbc",
                            "h": 6,
                            "w": 24,
                            "x": 0,
                            "y": 0,
                            "pos": 0
                        }
                    },
                    "items": {
                        "f7820dbc": {
                            "compType": "text",
                            "comp": {
                                "text": "### Page Layout Header",
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
                "sider": {
                    "layout": {
                        "a9d16086": {
                            "i": "a9d16086",
                            "h": 6,
                            "w": 22,
                            "x": 0,
                            "y": 0,
                            "pos": 0
                        }
                    },
                    "items": {
                        "a9d16086": {
                            "compType": "dropdown",
                            "comp": {
                                "text": "Menu",
                                "options": {
                                    "optionType": "manual",
                                    "manual": {
                                        "manual": [
                                            {
                                                "label": "Option 1"
                                            },
                                            {
                                                "label": "Option 2"
                                            }
                                        ]
                                    },
                                    "mapData": {
                                        "data": "[]"
                                    }
                                },
                                "preventStyleOverwriting": false,
                                "appliedThemeId": "",
                                "version": "latest"
                            },
                            "name": "dropdown1"
                        }
                    }
                },
                "body": {
                    "0": {
                        "view": {
                            "layout": {
                                "163bc2f3": {
                                    "i": "163bc2f3",
                                    "h": 45,
                                    "w": 21,
                                    "x": 3,
                                    "y": 0,
                                    "pos": 0
                                }
                            },
                            "items": {
                                "163bc2f3": {
                                    "compType": "table",
                                    "comp": {
                                        "showRowGridBorder": true,
                                        "showHRowGridBorder": true,
                                        "autoHeight": "auto",
                                        "data": "[\n {\n  \"id\": 1,\n  \"name\": \"Reagen Gilberthorpe\",\n  \"date\": \"7/5/2022\",\n  \"department\": \"Marketing\"\n },\n {\n  \"id\": 2,\n  \"name\": \"Haroun Lortzing\",\n  \"date\": \"11/6/2022\",\n  \"department\": \"Human Resources\"\n },\n {\n  \"id\": 3,\n  \"name\": \"Garret Kilmaster\",\n  \"date\": \"11/14/2021\",\n  \"department\": \"Research and Development\"\n },\n {\n  \"id\": 4,\n  \"name\": \"Israel Harrowsmith\",\n  \"date\": \"4/3/2022\",\n  \"department\": \"Training\"\n },\n {\n  \"id\": 5,\n  \"name\": \"Loren O'Lagen\",\n  \"date\": \"9/10/2022\",\n  \"department\": \"Services\"\n },\n {\n  \"id\": 6,\n  \"name\": \"Wallis Hothersall\",\n  \"date\": \"4/18/2022\",\n  \"department\": \"Accounting\"\n },\n {\n  \"id\": 7,\n  \"name\": \"Kaia Biskup\",\n  \"date\": \"3/4/2022\",\n  \"department\": \"Sales\"\n },\n {\n  \"id\": 8,\n  \"name\": \"Travers Saterweyte\",\n  \"date\": \"1/9/2022\",\n  \"department\": \"Human Resources\"\n },\n {\n  \"id\": 9,\n  \"name\": \"Mikey Niemetz\",\n  \"date\": \"1/4/2022\",\n  \"department\": \"Marketing\"\n },\n {\n  \"id\": 10,\n  \"name\": \"Mano Meckiff\",\n  \"date\": \"2/19/2022\",\n  \"department\": \"Research and Development\"\n }\n]",
                                        "showDataLoadSpinner": true,
                                        "columns": [
                                            {
                                                "title": "ID",
                                                "showTitle": true,
                                                "isCustom": false,
                                                "dataIndex": "id",
                                                "width": "55",
                                                "autoWidth": "fixed",
                                                "render": {
                                                    "compType": "text",
                                                    "comp": {
                                                        "text": "{{currentCell}}"
                                                    }
                                                },
                                                "align": "left",
                                                "fixed": "close",
                                                "background": "",
                                                "margin": "",
                                                "text": "",
                                                "border": "",
                                                "borderWidth": "",
                                                "radius": "",
                                                "textSize": "",
                                                "textWeight": "normal",
                                                "fontFamily": "sans-serif",
                                                "fontStyle": "normal",
                                                "textOverflow": "ellipsis",
                                                "linkColor": "#3377ff",
                                                "linkHoverColor": "",
                                                "linkActiveColor": "",
                                                "summaryColumns": [
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    }
                                                ]
                                            },
                                            {
                                                "title": "Name",
                                                "showTitle": true,
                                                "isCustom": false,
                                                "dataIndex": "name",
                                                "width": "200",
                                                "autoWidth": "fixed",
                                                "render": {
                                                    "compType": "text",
                                                    "comp": {
                                                        "text": "{{currentCell}}"
                                                    }
                                                },
                                                "align": "left",
                                                "fixed": "close",
                                                "background": "",
                                                "margin": "",
                                                "text": "",
                                                "border": "",
                                                "borderWidth": "",
                                                "radius": "",
                                                "textSize": "",
                                                "textWeight": "normal",
                                                "fontFamily": "sans-serif",
                                                "fontStyle": "normal",
                                                "textOverflow": "ellipsis",
                                                "linkColor": "#3377ff",
                                                "linkHoverColor": "",
                                                "linkActiveColor": "",
                                                "summaryColumns": [
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    }
                                                ]
                                            },
                                            {
                                                "title": "Date",
                                                "showTitle": true,
                                                "isCustom": false,
                                                "dataIndex": "date",
                                                "width": "110",
                                                "autoWidth": "fixed",
                                                "render": {
                                                    "compType": "text",
                                                    "comp": {
                                                        "text": "{{currentCell}}"
                                                    }
                                                },
                                                "align": "left",
                                                "fixed": "close",
                                                "background": "",
                                                "margin": "",
                                                "text": "",
                                                "border": "",
                                                "borderWidth": "",
                                                "radius": "",
                                                "textSize": "",
                                                "textWeight": "normal",
                                                "fontFamily": "sans-serif",
                                                "fontStyle": "normal",
                                                "textOverflow": "ellipsis",
                                                "linkColor": "#3377ff",
                                                "linkHoverColor": "",
                                                "linkActiveColor": "",
                                                "summaryColumns": [
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    }
                                                ]
                                            },
                                            {
                                                "title": "Department",
                                                "showTitle": true,
                                                "isCustom": false,
                                                "dataIndex": "department",
                                                "width": "250",
                                                "autoWidth": "fixed",
                                                "render": {
                                                    "compType": "tag",
                                                    "comp": {
                                                        "text": "{{currentCell}}",
                                                        "tagColors": {
                                                            "optionType": "manual",
                                                            "manual": {
                                                                "manual": [
                                                                    {
                                                                        "label": "Tag1",
                                                                        "icon": "/icon:solid/tag",
                                                                        "color": "#f50"
                                                                    },
                                                                    {
                                                                        "label": "Tag2",
                                                                        "icon": "/icon:solid/tag",
                                                                        "color": "#2db7f5"
                                                                    }
                                                                ]
                                                            },
                                                            "mapData": {
                                                                "data": "[]",
                                                                "mapData": {
                                                                    "color": ""
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "align": "left",
                                                "fixed": "close",
                                                "background": "",
                                                "margin": "",
                                                "text": "",
                                                "border": "",
                                                "borderWidth": "",
                                                "radius": "",
                                                "textSize": "",
                                                "textWeight": "normal",
                                                "fontFamily": "sans-serif",
                                                "fontStyle": "normal",
                                                "textOverflow": "ellipsis",
                                                "linkColor": "#3377ff",
                                                "linkHoverColor": "",
                                                "linkActiveColor": "",
                                                "summaryColumns": [
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    }
                                                ]
                                            }
                                        ],
                                        "size": "middle",
                                        "selection": {
                                            "mode": "single"
                                        },
                                        "pagination": {
                                            "changeablePageSize": null,
                                            "pageSizeOptions": "[5, 10, 20, 50]"
                                        },
                                        "sort": [],
                                        "toolbar": {
                                            "showRefresh": true,
                                            "showDownload": true,
                                            "showFilter": true,
                                            "position": "below",
                                            "columnSeparator": ",",
                                            "showUpdateButtons": true
                                        },
                                        "summaryRows": "1",
                                        "rowAutoHeight": "auto",
                                        "tableAutoHeight": "auto",
                                        "expansion": {
                                            "slot": {
                                                "container": {
                                                    "layout": {}
                                                }
                                            }
                                        },
                                        "editModeClicks": "single",
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "",
                                        "version": "latest"
                                    },
                                    "name": "table1"
                                }
                            }
                        }
                    }
                },
                "footer": {
                    "layout": {
                        "3a74e36e": {
                            "i": "3a74e36e",
                            "h": 6,
                            "w": 24,
                            "x": 0,
                            "y": 2,
                            "pos": 0
                        }
                    },
                    "items": {
                        "3a74e36e": {
                            "compType": "text",
                            "comp": {
                                "text": "### Page Layout Footer",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "center",
                                "contentScrollBar": true,
                                "verticalAlignment": "center",
                                "style": {
                                    "background": "#fff"
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
                                "appliedThemeId": "",
                                "version": "latest"
                            },
                            "name": "text2"
                        }
                    }
                },
                "showHeader": true,
                "showSider": true,
                "innerSider": true,
                "siderCollapsible": false,
                "siderCollapsed": false,
                "siderRight": false,
                "siderWidth": "20%",
                "siderCollapsedWidth": "0",
                "showFooter": true,
                "horizontalGridCells": 24,
                "autoHeight": "auto",
                "siderScrollbars": false,
                "contentScrollbars": false,
                "mainScrollbars": false,
                "appliedThemeId": ""
              },
            }}
            compFactory={PageLayoutComp}
          />

          <Example
            title="Showing Sidebar by Default - Collapsable"
            hideSettings={true}
            config={{
              container: {
                "header": {
                    "layout": {
                        "f7820dbc": {
                            "i": "f7820dbc",
                            "h": 6,
                            "w": 24,
                            "x": 0,
                            "y": 0,
                            "pos": 0
                        }
                    },
                    "items": {
                        "f7820dbc": {
                            "compType": "text",
                            "comp": {
                                "text": "### Page Layout Header",
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
                "sider": {
                    "layout": {
                        "a9d16086": {
                            "i": "a9d16086",
                            "h": 6,
                            "w": 22,
                            "x": 0,
                            "y": 0,
                            "pos": 0
                        }
                    },
                    "items": {
                        "a9d16086": {
                            "compType": "dropdown",
                            "comp": {
                                "text": "Menu",
                                "options": {
                                    "optionType": "manual",
                                    "manual": {
                                        "manual": [
                                            {
                                                "label": "Option 1"
                                            },
                                            {
                                                "label": "Option 2"
                                            }
                                        ]
                                    },
                                    "mapData": {
                                        "data": "[]"
                                    }
                                },
                                "preventStyleOverwriting": false,
                                "appliedThemeId": "",
                                "version": "latest"
                            },
                            "name": "dropdown1"
                        }
                    }
                },
                "body": {
                    "0": {
                        "view": {
                            "layout": {
                                "163bc2f3": {
                                    "i": "163bc2f3",
                                    "h": 45,
                                    "w": 21,
                                    "x": 3,
                                    "y": 0,
                                    "pos": 0
                                }
                            },
                            "items": {
                                "163bc2f3": {
                                    "compType": "table",
                                    "comp": {
                                        "showRowGridBorder": true,
                                        "showHRowGridBorder": true,
                                        "autoHeight": "auto",
                                        "data": "[\n {\n  \"id\": 1,\n  \"name\": \"Reagen Gilberthorpe\",\n  \"date\": \"7/5/2022\",\n  \"department\": \"Marketing\"\n },\n {\n  \"id\": 2,\n  \"name\": \"Haroun Lortzing\",\n  \"date\": \"11/6/2022\",\n  \"department\": \"Human Resources\"\n },\n {\n  \"id\": 3,\n  \"name\": \"Garret Kilmaster\",\n  \"date\": \"11/14/2021\",\n  \"department\": \"Research and Development\"\n },\n {\n  \"id\": 4,\n  \"name\": \"Israel Harrowsmith\",\n  \"date\": \"4/3/2022\",\n  \"department\": \"Training\"\n },\n {\n  \"id\": 5,\n  \"name\": \"Loren O'Lagen\",\n  \"date\": \"9/10/2022\",\n  \"department\": \"Services\"\n },\n {\n  \"id\": 6,\n  \"name\": \"Wallis Hothersall\",\n  \"date\": \"4/18/2022\",\n  \"department\": \"Accounting\"\n },\n {\n  \"id\": 7,\n  \"name\": \"Kaia Biskup\",\n  \"date\": \"3/4/2022\",\n  \"department\": \"Sales\"\n },\n {\n  \"id\": 8,\n  \"name\": \"Travers Saterweyte\",\n  \"date\": \"1/9/2022\",\n  \"department\": \"Human Resources\"\n },\n {\n  \"id\": 9,\n  \"name\": \"Mikey Niemetz\",\n  \"date\": \"1/4/2022\",\n  \"department\": \"Marketing\"\n },\n {\n  \"id\": 10,\n  \"name\": \"Mano Meckiff\",\n  \"date\": \"2/19/2022\",\n  \"department\": \"Research and Development\"\n }\n]",
                                        "showDataLoadSpinner": true,
                                        "columns": [
                                            {
                                                "title": "ID",
                                                "showTitle": true,
                                                "isCustom": false,
                                                "dataIndex": "id",
                                                "width": "55",
                                                "autoWidth": "fixed",
                                                "render": {
                                                    "compType": "text",
                                                    "comp": {
                                                        "text": "{{currentCell}}"
                                                    }
                                                },
                                                "align": "left",
                                                "fixed": "close",
                                                "background": "",
                                                "margin": "",
                                                "text": "",
                                                "border": "",
                                                "borderWidth": "",
                                                "radius": "",
                                                "textSize": "",
                                                "textWeight": "normal",
                                                "fontFamily": "sans-serif",
                                                "fontStyle": "normal",
                                                "textOverflow": "ellipsis",
                                                "linkColor": "#3377ff",
                                                "linkHoverColor": "",
                                                "linkActiveColor": "",
                                                "summaryColumns": [
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    }
                                                ]
                                            },
                                            {
                                                "title": "Name",
                                                "showTitle": true,
                                                "isCustom": false,
                                                "dataIndex": "name",
                                                "width": "200",
                                                "autoWidth": "fixed",
                                                "render": {
                                                    "compType": "text",
                                                    "comp": {
                                                        "text": "{{currentCell}}"
                                                    }
                                                },
                                                "align": "left",
                                                "fixed": "close",
                                                "background": "",
                                                "margin": "",
                                                "text": "",
                                                "border": "",
                                                "borderWidth": "",
                                                "radius": "",
                                                "textSize": "",
                                                "textWeight": "normal",
                                                "fontFamily": "sans-serif",
                                                "fontStyle": "normal",
                                                "textOverflow": "ellipsis",
                                                "linkColor": "#3377ff",
                                                "linkHoverColor": "",
                                                "linkActiveColor": "",
                                                "summaryColumns": [
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    }
                                                ]
                                            },
                                            {
                                                "title": "Date",
                                                "showTitle": true,
                                                "isCustom": false,
                                                "dataIndex": "date",
                                                "width": "110",
                                                "autoWidth": "fixed",
                                                "render": {
                                                    "compType": "text",
                                                    "comp": {
                                                        "text": "{{currentCell}}"
                                                    }
                                                },
                                                "align": "left",
                                                "fixed": "close",
                                                "background": "",
                                                "margin": "",
                                                "text": "",
                                                "border": "",
                                                "borderWidth": "",
                                                "radius": "",
                                                "textSize": "",
                                                "textWeight": "normal",
                                                "fontFamily": "sans-serif",
                                                "fontStyle": "normal",
                                                "textOverflow": "ellipsis",
                                                "linkColor": "#3377ff",
                                                "linkHoverColor": "",
                                                "linkActiveColor": "",
                                                "summaryColumns": [
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    }
                                                ]
                                            },
                                            {
                                                "title": "Department",
                                                "showTitle": true,
                                                "isCustom": false,
                                                "dataIndex": "department",
                                                "width": "250",
                                                "autoWidth": "fixed",
                                                "render": {
                                                    "compType": "tag",
                                                    "comp": {
                                                        "text": "{{currentCell}}",
                                                        "tagColors": {
                                                            "optionType": "manual",
                                                            "manual": {
                                                                "manual": [
                                                                    {
                                                                        "label": "Tag1",
                                                                        "icon": "/icon:solid/tag",
                                                                        "color": "#f50"
                                                                    },
                                                                    {
                                                                        "label": "Tag2",
                                                                        "icon": "/icon:solid/tag",
                                                                        "color": "#2db7f5"
                                                                    }
                                                                ]
                                                            },
                                                            "mapData": {
                                                                "data": "[]",
                                                                "mapData": {
                                                                    "color": ""
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "align": "left",
                                                "fixed": "close",
                                                "background": "",
                                                "margin": "",
                                                "text": "",
                                                "border": "",
                                                "borderWidth": "",
                                                "radius": "",
                                                "textSize": "",
                                                "textWeight": "normal",
                                                "fontFamily": "sans-serif",
                                                "fontStyle": "normal",
                                                "textOverflow": "ellipsis",
                                                "linkColor": "#3377ff",
                                                "linkHoverColor": "",
                                                "linkActiveColor": "",
                                                "summaryColumns": [
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    }
                                                ]
                                            }
                                        ],
                                        "size": "middle",
                                        "selection": {
                                            "mode": "single"
                                        },
                                        "pagination": {
                                            "changeablePageSize": null,
                                            "pageSizeOptions": "[5, 10, 20, 50]"
                                        },
                                        "sort": [],
                                        "toolbar": {
                                            "showRefresh": true,
                                            "showDownload": true,
                                            "showFilter": true,
                                            "position": "below",
                                            "columnSeparator": ",",
                                            "showUpdateButtons": true
                                        },
                                        "summaryRows": "1",
                                        "rowAutoHeight": "auto",
                                        "tableAutoHeight": "auto",
                                        "expansion": {
                                            "slot": {
                                                "container": {
                                                    "layout": {}
                                                }
                                            }
                                        },
                                        "editModeClicks": "single",
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "",
                                        "version": "latest"
                                    },
                                    "name": "table1"
                                }
                            }
                        }
                    }
                },
                "footer": {
                    "layout": {
                        "3a74e36e": {
                            "i": "3a74e36e",
                            "h": 6,
                            "w": 24,
                            "x": 0,
                            "y": 2,
                            "pos": 0
                        }
                    },
                    "items": {
                        "3a74e36e": {
                            "compType": "text",
                            "comp": {
                                "text": "### Page Layout Footer",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "center",
                                "contentScrollBar": true,
                                "verticalAlignment": "center",
                                "style": {
                                    "background": "#fff"
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
                                "appliedThemeId": "",
                                "version": "latest"
                            },
                            "name": "text2"
                        }
                    }
                },
                "showHeader": true,
                "showSider": true,
                "innerSider": true,
                "siderCollapsible": true,
                "siderCollapsed": false,
                "siderRight": false,
                "siderWidth": "20%",
                "siderCollapsedWidth": "0",
                "showFooter": true,
                "horizontalGridCells": 24,
                "autoHeight": "auto",
                "siderScrollbars": false,
                "contentScrollbars": false,
                "mainScrollbars": false,
                "appliedThemeId": ""
              },
            }}
            compFactory={PageLayoutComp}
          />

          <Example
            title="Showing Sidebar on Right side"
            hideSettings={true}
            config={{
              container: {
                "header": {
                    "layout": {
                        "f7820dbc": {
                            "i": "f7820dbc",
                            "h": 6,
                            "w": 24,
                            "x": 0,
                            "y": 0,
                            "pos": 0
                        }
                    },
                    "items": {
                        "f7820dbc": {
                            "compType": "text",
                            "comp": {
                                "text": "### Page Layout Header",
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
                "sider": {
                    "layout": {
                        "a9d16086": {
                            "i": "a9d16086",
                            "h": 6,
                            "w": 22,
                            "x": 0,
                            "y": 0,
                            "pos": 0
                        }
                    },
                    "items": {
                        "a9d16086": {
                            "compType": "dropdown",
                            "comp": {
                                "text": "Menu",
                                "options": {
                                    "optionType": "manual",
                                    "manual": {
                                        "manual": [
                                            {
                                                "label": "Option 1"
                                            },
                                            {
                                                "label": "Option 2"
                                            }
                                        ]
                                    },
                                    "mapData": {
                                        "data": "[]"
                                    }
                                },
                                "preventStyleOverwriting": false,
                                "appliedThemeId": "",
                                "version": "latest"
                            },
                            "name": "dropdown1"
                        }
                    }
                },
                "body": {
                    "0": {
                        "view": {
                            "layout": {
                                "163bc2f3": {
                                    "i": "163bc2f3",
                                    "h": 45,
                                    "w": 21,
                                    "x": 3,
                                    "y": 0,
                                    "pos": 0
                                }
                            },
                            "items": {
                                "163bc2f3": {
                                    "compType": "table",
                                    "comp": {
                                        "showRowGridBorder": true,
                                        "showHRowGridBorder": true,
                                        "autoHeight": "auto",
                                        "data": "[\n {\n  \"id\": 1,\n  \"name\": \"Reagen Gilberthorpe\",\n  \"date\": \"7/5/2022\",\n  \"department\": \"Marketing\"\n },\n {\n  \"id\": 2,\n  \"name\": \"Haroun Lortzing\",\n  \"date\": \"11/6/2022\",\n  \"department\": \"Human Resources\"\n },\n {\n  \"id\": 3,\n  \"name\": \"Garret Kilmaster\",\n  \"date\": \"11/14/2021\",\n  \"department\": \"Research and Development\"\n },\n {\n  \"id\": 4,\n  \"name\": \"Israel Harrowsmith\",\n  \"date\": \"4/3/2022\",\n  \"department\": \"Training\"\n },\n {\n  \"id\": 5,\n  \"name\": \"Loren O'Lagen\",\n  \"date\": \"9/10/2022\",\n  \"department\": \"Services\"\n },\n {\n  \"id\": 6,\n  \"name\": \"Wallis Hothersall\",\n  \"date\": \"4/18/2022\",\n  \"department\": \"Accounting\"\n },\n {\n  \"id\": 7,\n  \"name\": \"Kaia Biskup\",\n  \"date\": \"3/4/2022\",\n  \"department\": \"Sales\"\n },\n {\n  \"id\": 8,\n  \"name\": \"Travers Saterweyte\",\n  \"date\": \"1/9/2022\",\n  \"department\": \"Human Resources\"\n },\n {\n  \"id\": 9,\n  \"name\": \"Mikey Niemetz\",\n  \"date\": \"1/4/2022\",\n  \"department\": \"Marketing\"\n },\n {\n  \"id\": 10,\n  \"name\": \"Mano Meckiff\",\n  \"date\": \"2/19/2022\",\n  \"department\": \"Research and Development\"\n }\n]",
                                        "showDataLoadSpinner": true,
                                        "columns": [
                                            {
                                                "title": "ID",
                                                "showTitle": true,
                                                "isCustom": false,
                                                "dataIndex": "id",
                                                "width": "55",
                                                "autoWidth": "fixed",
                                                "render": {
                                                    "compType": "text",
                                                    "comp": {
                                                        "text": "{{currentCell}}"
                                                    }
                                                },
                                                "align": "left",
                                                "fixed": "close",
                                                "background": "",
                                                "margin": "",
                                                "text": "",
                                                "border": "",
                                                "borderWidth": "",
                                                "radius": "",
                                                "textSize": "",
                                                "textWeight": "normal",
                                                "fontFamily": "sans-serif",
                                                "fontStyle": "normal",
                                                "textOverflow": "ellipsis",
                                                "linkColor": "#3377ff",
                                                "linkHoverColor": "",
                                                "linkActiveColor": "",
                                                "summaryColumns": [
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    }
                                                ]
                                            },
                                            {
                                                "title": "Name",
                                                "showTitle": true,
                                                "isCustom": false,
                                                "dataIndex": "name",
                                                "width": "200",
                                                "autoWidth": "fixed",
                                                "render": {
                                                    "compType": "text",
                                                    "comp": {
                                                        "text": "{{currentCell}}"
                                                    }
                                                },
                                                "align": "left",
                                                "fixed": "close",
                                                "background": "",
                                                "margin": "",
                                                "text": "",
                                                "border": "",
                                                "borderWidth": "",
                                                "radius": "",
                                                "textSize": "",
                                                "textWeight": "normal",
                                                "fontFamily": "sans-serif",
                                                "fontStyle": "normal",
                                                "textOverflow": "ellipsis",
                                                "linkColor": "#3377ff",
                                                "linkHoverColor": "",
                                                "linkActiveColor": "",
                                                "summaryColumns": [
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    }
                                                ]
                                            },
                                            {
                                                "title": "Date",
                                                "showTitle": true,
                                                "isCustom": false,
                                                "dataIndex": "date",
                                                "width": "110",
                                                "autoWidth": "fixed",
                                                "render": {
                                                    "compType": "text",
                                                    "comp": {
                                                        "text": "{{currentCell}}"
                                                    }
                                                },
                                                "align": "left",
                                                "fixed": "close",
                                                "background": "",
                                                "margin": "",
                                                "text": "",
                                                "border": "",
                                                "borderWidth": "",
                                                "radius": "",
                                                "textSize": "",
                                                "textWeight": "normal",
                                                "fontFamily": "sans-serif",
                                                "fontStyle": "normal",
                                                "textOverflow": "ellipsis",
                                                "linkColor": "#3377ff",
                                                "linkHoverColor": "",
                                                "linkActiveColor": "",
                                                "summaryColumns": [
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    }
                                                ]
                                            },
                                            {
                                                "title": "Department",
                                                "showTitle": true,
                                                "isCustom": false,
                                                "dataIndex": "department",
                                                "width": "250",
                                                "autoWidth": "fixed",
                                                "render": {
                                                    "compType": "tag",
                                                    "comp": {
                                                        "text": "{{currentCell}}",
                                                        "tagColors": {
                                                            "optionType": "manual",
                                                            "manual": {
                                                                "manual": [
                                                                    {
                                                                        "label": "Tag1",
                                                                        "icon": "/icon:solid/tag",
                                                                        "color": "#f50"
                                                                    },
                                                                    {
                                                                        "label": "Tag2",
                                                                        "icon": "/icon:solid/tag",
                                                                        "color": "#2db7f5"
                                                                    }
                                                                ]
                                                            },
                                                            "mapData": {
                                                                "data": "[]",
                                                                "mapData": {
                                                                    "color": ""
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "align": "left",
                                                "fixed": "close",
                                                "background": "",
                                                "margin": "",
                                                "text": "",
                                                "border": "",
                                                "borderWidth": "",
                                                "radius": "",
                                                "textSize": "",
                                                "textWeight": "normal",
                                                "fontFamily": "sans-serif",
                                                "fontStyle": "normal",
                                                "textOverflow": "ellipsis",
                                                "linkColor": "#3377ff",
                                                "linkHoverColor": "",
                                                "linkActiveColor": "",
                                                "summaryColumns": [
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    }
                                                ]
                                            }
                                        ],
                                        "size": "middle",
                                        "selection": {
                                            "mode": "single"
                                        },
                                        "pagination": {
                                            "changeablePageSize": null,
                                            "pageSizeOptions": "[5, 10, 20, 50]"
                                        },
                                        "sort": [],
                                        "toolbar": {
                                            "showRefresh": true,
                                            "showDownload": true,
                                            "showFilter": true,
                                            "position": "below",
                                            "columnSeparator": ",",
                                            "showUpdateButtons": true
                                        },
                                        "summaryRows": "1",
                                        "rowAutoHeight": "auto",
                                        "tableAutoHeight": "auto",
                                        "expansion": {
                                            "slot": {
                                                "container": {
                                                    "layout": {}
                                                }
                                            }
                                        },
                                        "editModeClicks": "single",
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "",
                                        "version": "latest"
                                    },
                                    "name": "table1"
                                }
                            }
                        }
                    }
                },
                "footer": {
                    "layout": {
                        "3a74e36e": {
                            "i": "3a74e36e",
                            "h": 6,
                            "w": 24,
                            "x": 0,
                            "y": 2,
                            "pos": 0
                        }
                    },
                    "items": {
                        "3a74e36e": {
                            "compType": "text",
                            "comp": {
                                "text": "### Page Layout Footer",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "center",
                                "contentScrollBar": true,
                                "verticalAlignment": "center",
                                "style": {
                                    "background": "#fff"
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
                                "appliedThemeId": "",
                                "version": "latest"
                            },
                            "name": "text2"
                        }
                    }
                },
                "showHeader": true,
                "showSider": true,
                "innerSider": false,
                "siderCollapsible": true,
                "siderCollapsed": false,
                "siderRight": true,
                "siderWidth": "20%",
                "siderCollapsedWidth": "0",
                "showFooter": true,
                "horizontalGridCells": 24,
                "autoHeight": "auto",
                "siderScrollbars": false,
                "contentScrollbars": false,
                "mainScrollbars": false,
                "appliedThemeId": ""
              },
            }}
            compFactory={PageLayoutComp}
          />
          
          <Example
            title="Increasing Sidebar Width"
            hideSettings={true}
            config={{
              container: {
                "header": {
                    "layout": {
                        "f7820dbc": {
                            "i": "f7820dbc",
                            "h": 6,
                            "w": 24,
                            "x": 0,
                            "y": 0,
                            "pos": 0
                        }
                    },
                    "items": {
                        "f7820dbc": {
                            "compType": "text",
                            "comp": {
                                "text": "### Page Layout Header",
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
                "sider": {
                    "layout": {
                        "a9d16086": {
                            "i": "a9d16086",
                            "h": 6,
                            "w": 22,
                            "x": 0,
                            "y": 0,
                            "pos": 0
                        }
                    },
                    "items": {
                        "a9d16086": {
                            "compType": "dropdown",
                            "comp": {
                                "text": "Menu",
                                "options": {
                                    "optionType": "manual",
                                    "manual": {
                                        "manual": [
                                            {
                                                "label": "Option 1"
                                            },
                                            {
                                                "label": "Option 2"
                                            }
                                        ]
                                    },
                                    "mapData": {
                                        "data": "[]"
                                    }
                                },
                                "preventStyleOverwriting": false,
                                "appliedThemeId": "",
                                "version": "latest"
                            },
                            "name": "dropdown1"
                        }
                    }
                },
                "body": {
                    "0": {
                        "view": {
                            "layout": {
                                "163bc2f3": {
                                    "i": "163bc2f3",
                                    "h": 45,
                                    "w": 21,
                                    "x": 3,
                                    "y": 0,
                                    "pos": 0
                                }
                            },
                            "items": {
                                "163bc2f3": {
                                    "compType": "table",
                                    "comp": {
                                        "showRowGridBorder": true,
                                        "showHRowGridBorder": true,
                                        "autoHeight": "auto",
                                        "data": "[\n {\n  \"id\": 1,\n  \"name\": \"Reagen Gilberthorpe\",\n  \"date\": \"7/5/2022\",\n  \"department\": \"Marketing\"\n },\n {\n  \"id\": 2,\n  \"name\": \"Haroun Lortzing\",\n  \"date\": \"11/6/2022\",\n  \"department\": \"Human Resources\"\n },\n {\n  \"id\": 3,\n  \"name\": \"Garret Kilmaster\",\n  \"date\": \"11/14/2021\",\n  \"department\": \"Research and Development\"\n },\n {\n  \"id\": 4,\n  \"name\": \"Israel Harrowsmith\",\n  \"date\": \"4/3/2022\",\n  \"department\": \"Training\"\n },\n {\n  \"id\": 5,\n  \"name\": \"Loren O'Lagen\",\n  \"date\": \"9/10/2022\",\n  \"department\": \"Services\"\n },\n {\n  \"id\": 6,\n  \"name\": \"Wallis Hothersall\",\n  \"date\": \"4/18/2022\",\n  \"department\": \"Accounting\"\n },\n {\n  \"id\": 7,\n  \"name\": \"Kaia Biskup\",\n  \"date\": \"3/4/2022\",\n  \"department\": \"Sales\"\n },\n {\n  \"id\": 8,\n  \"name\": \"Travers Saterweyte\",\n  \"date\": \"1/9/2022\",\n  \"department\": \"Human Resources\"\n },\n {\n  \"id\": 9,\n  \"name\": \"Mikey Niemetz\",\n  \"date\": \"1/4/2022\",\n  \"department\": \"Marketing\"\n },\n {\n  \"id\": 10,\n  \"name\": \"Mano Meckiff\",\n  \"date\": \"2/19/2022\",\n  \"department\": \"Research and Development\"\n }\n]",
                                        "showDataLoadSpinner": true,
                                        "columns": [
                                            {
                                                "title": "ID",
                                                "showTitle": true,
                                                "isCustom": false,
                                                "dataIndex": "id",
                                                "width": "55",
                                                "autoWidth": "fixed",
                                                "render": {
                                                    "compType": "text",
                                                    "comp": {
                                                        "text": "{{currentCell}}"
                                                    }
                                                },
                                                "align": "left",
                                                "fixed": "close",
                                                "background": "",
                                                "margin": "",
                                                "text": "",
                                                "border": "",
                                                "borderWidth": "",
                                                "radius": "",
                                                "textSize": "",
                                                "textWeight": "normal",
                                                "fontFamily": "sans-serif",
                                                "fontStyle": "normal",
                                                "textOverflow": "ellipsis",
                                                "linkColor": "#3377ff",
                                                "linkHoverColor": "",
                                                "linkActiveColor": "",
                                                "summaryColumns": [
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    }
                                                ]
                                            },
                                            {
                                                "title": "Name",
                                                "showTitle": true,
                                                "isCustom": false,
                                                "dataIndex": "name",
                                                "width": "200",
                                                "autoWidth": "fixed",
                                                "render": {
                                                    "compType": "text",
                                                    "comp": {
                                                        "text": "{{currentCell}}"
                                                    }
                                                },
                                                "align": "left",
                                                "fixed": "close",
                                                "background": "",
                                                "margin": "",
                                                "text": "",
                                                "border": "",
                                                "borderWidth": "",
                                                "radius": "",
                                                "textSize": "",
                                                "textWeight": "normal",
                                                "fontFamily": "sans-serif",
                                                "fontStyle": "normal",
                                                "textOverflow": "ellipsis",
                                                "linkColor": "#3377ff",
                                                "linkHoverColor": "",
                                                "linkActiveColor": "",
                                                "summaryColumns": [
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    }
                                                ]
                                            },
                                            {
                                                "title": "Date",
                                                "showTitle": true,
                                                "isCustom": false,
                                                "dataIndex": "date",
                                                "width": "110",
                                                "autoWidth": "fixed",
                                                "render": {
                                                    "compType": "text",
                                                    "comp": {
                                                        "text": "{{currentCell}}"
                                                    }
                                                },
                                                "align": "left",
                                                "fixed": "close",
                                                "background": "",
                                                "margin": "",
                                                "text": "",
                                                "border": "",
                                                "borderWidth": "",
                                                "radius": "",
                                                "textSize": "",
                                                "textWeight": "normal",
                                                "fontFamily": "sans-serif",
                                                "fontStyle": "normal",
                                                "textOverflow": "ellipsis",
                                                "linkColor": "#3377ff",
                                                "linkHoverColor": "",
                                                "linkActiveColor": "",
                                                "summaryColumns": [
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    }
                                                ]
                                            },
                                            {
                                                "title": "Department",
                                                "showTitle": true,
                                                "isCustom": false,
                                                "dataIndex": "department",
                                                "width": "250",
                                                "autoWidth": "fixed",
                                                "render": {
                                                    "compType": "tag",
                                                    "comp": {
                                                        "text": "{{currentCell}}",
                                                        "tagColors": {
                                                            "optionType": "manual",
                                                            "manual": {
                                                                "manual": [
                                                                    {
                                                                        "label": "Tag1",
                                                                        "icon": "/icon:solid/tag",
                                                                        "color": "#f50"
                                                                    },
                                                                    {
                                                                        "label": "Tag2",
                                                                        "icon": "/icon:solid/tag",
                                                                        "color": "#2db7f5"
                                                                    }
                                                                ]
                                                            },
                                                            "mapData": {
                                                                "data": "[]",
                                                                "mapData": {
                                                                    "color": ""
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "align": "left",
                                                "fixed": "close",
                                                "background": "",
                                                "margin": "",
                                                "text": "",
                                                "border": "",
                                                "borderWidth": "",
                                                "radius": "",
                                                "textSize": "",
                                                "textWeight": "normal",
                                                "fontFamily": "sans-serif",
                                                "fontStyle": "normal",
                                                "textOverflow": "ellipsis",
                                                "linkColor": "#3377ff",
                                                "linkHoverColor": "",
                                                "linkActiveColor": "",
                                                "summaryColumns": [
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    },
                                                    {
                                                        "isCustom": false,
                                                        "dataIndex": "",
                                                        "render": {
                                                            "compType": "text",
                                                            "comp": {}
                                                        },
                                                        "align": "left",
                                                        "background": "",
                                                        "margin": "",
                                                        "text": "",
                                                        "border": "",
                                                        "radius": "",
                                                        "textSize": "",
                                                        "textWeight": "normal",
                                                        "fontFamily": "sans-serif",
                                                        "fontStyle": "normal",
                                                        "textOverflow": "ellipsis",
                                                        "linkColor": "#3377ff",
                                                        "linkHoverColor": "",
                                                        "linkActiveColor": ""
                                                    }
                                                ]
                                            }
                                        ],
                                        "size": "middle",
                                        "selection": {
                                            "mode": "single"
                                        },
                                        "pagination": {
                                            "changeablePageSize": null,
                                            "pageSizeOptions": "[5, 10, 20, 50]"
                                        },
                                        "sort": [],
                                        "toolbar": {
                                            "showRefresh": true,
                                            "showDownload": true,
                                            "showFilter": true,
                                            "position": "below",
                                            "columnSeparator": ",",
                                            "showUpdateButtons": true
                                        },
                                        "summaryRows": "1",
                                        "rowAutoHeight": "auto",
                                        "tableAutoHeight": "auto",
                                        "expansion": {
                                            "slot": {
                                                "container": {
                                                    "layout": {}
                                                }
                                            }
                                        },
                                        "editModeClicks": "single",
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "",
                                        "version": "latest"
                                    },
                                    "name": "table1"
                                }
                            }
                        }
                    }
                },
                "footer": {
                    "layout": {
                        "3a74e36e": {
                            "i": "3a74e36e",
                            "h": 6,
                            "w": 24,
                            "x": 0,
                            "y": 2,
                            "pos": 0
                        }
                    },
                    "items": {
                        "3a74e36e": {
                            "compType": "text",
                            "comp": {
                                "text": "### Page Layout Footer",
                                "autoHeight": "auto",
                                "type": "markdown",
                                "horizontalAlignment": "center",
                                "contentScrollBar": true,
                                "verticalAlignment": "center",
                                "style": {
                                    "background": "#fff"
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
                                "appliedThemeId": "",
                                "version": "latest"
                            },
                            "name": "text2"
                        }
                    }
                },
                "showHeader": true,
                "showSider": true,
                "innerSider": false,
                "siderCollapsible": true,
                "siderCollapsed": false,
                "siderRight": false,
                "siderWidth": "40%",
                "siderCollapsedWidth": "0",
                "showFooter": true,
                "horizontalGridCells": 24,
                "autoHeight": "auto",
                "siderScrollbars": false,
                "contentScrollbars": false,
                "mainScrollbars": false,
                "appliedThemeId": ""
              },
            }}
            compFactory={PageLayoutComp}
          />
        </ExampleGroup>
      </>
    );
  }