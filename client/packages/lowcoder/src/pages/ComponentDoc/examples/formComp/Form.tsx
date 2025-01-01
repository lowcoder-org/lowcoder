import { FormComp } from "comps/comps/formComp/formComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const container={
  "header": {
      "layout": {
          "a6083c0a": {
              "i": "a6083c0a",
              "h": 5,
              "w": 24,
              "x": 0,
              "y": 0
          }
      },
      "items": {
          "a6083c0a": {
              "compType": "text",
              "comp": {
                  "text": "### Welcome Back!",
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
              "name": "formTitle1"
          }
      }
  },
  "body": {
      "0": {
          "view": {
              "layout": {
                  "a6f7c0e4": {
                      "i": "a6f7c0e4",
                      "h": 7,
                      "w": 14,
                      "x": 0,
                      "y": 0,
                      "pos": 0
                  },
                  "c5b32ee6": {
                      "i": "c5b32ee6",
                      "h": 7,
                      "w": 14,
                      "x": 0,
                      "y": 7,
                      "pos": 1
                  }
              },
              "items": {
                  "a6f7c0e4": {
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
                          "validationType": "Email",
                          "preventStyleOverwriting": false,
                          "appliedThemeId": "",
                          "version": "latest"
                      },
                      "name": "input1"
                  },
                  "c5b32ee6": {
                      "compType": "password",
                      "comp": {
                          "defaultValue": "",
                          "value": "",
                          "label": {
                              "text": "Password",
                              "width": "33",
                              "widthUnit": "%",
                              "position": "row",
                              "align": "left"
                          },
                          "validationType": "Regex",
                          "visibilityToggle": true,
                          "preventStyleOverwriting": false,
                          "appliedThemeId": "",
                          "version": "latest"
                      },
                      "name": "password1"
                  }
              }
          }
      }
  },
  "footer": {
      "layout": {
          "95ccf34e": {
              "i": "95ccf34e",
              "h": 5,
              "w": 10,
              "x": 14,
              "y": 0
          }
      },
      "items": {
          "95ccf34e": {
              "compType": "button",
              "comp": {
                  "text": "Login",
                  "type": "submit",
                  "form": "form1",
                  "preventStyleOverwriting": false,
                  "appliedThemeId": "",
                  "version": "latest"
              },
              "name": "formButton1"
          }
      }
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

export default function FormExample() {
  return (
    <>

      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Form Component."
      >
        <Example
          title="A Simple Form"
          hideSettings={true}
          config={{
            container: container, 
          }}
          compFactory={FormComp}
        />
        <Example
          title="Disabling the Form Component"
          hideSettings={true}
          config={{
            container: container,
            disabled: true,
          }}
          compFactory={FormComp}
        />
        <Example
          title="Hiding the Form Component"
          hideSettings={true}
          config={{
            container: container,
            hidden: true,
          }}
          compFactory={FormComp}
        />
        <Example
          title="Disabling Submit button"
          hideSettings={true}
          config={{
            container: container,
            disableSubmit: "true", 
          }}
          compFactory={FormComp}
        />
        <Example
          title="Showing Loading sign on Form"
          hideSettings={true}
          config={{
            container: container,
            loading: true,
          }}
          compFactory={FormComp}
        />
      </ExampleGroup>


      <ExampleGroup
        title="Layout"
        description="The Following Examples Show the Layout options on the Form Component."
      >
        <Example
          title="Hiding Form Header"
          hideSettings={true}
          config={{
            container: {
                "header": {
                    "layout": {
                        "a6083c0a": {
                            "i": "a6083c0a",
                            "h": 5,
                            "w": 24,
                            "x": 0,
                            "y": 0
                        }
                    },
                    "items": {
                        "a6083c0a": {
                            "compType": "text",
                            "comp": {
                                "text": "### Welcome Back!",
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
                            "name": "formTitle1"
                        }
                    }
                },
                "body": {
                    "0": {
                        "view": {
                            "layout": {
                                "a6f7c0e4": {
                                    "i": "a6f7c0e4",
                                    "h": 7,
                                    "w": 14,
                                    "x": 0,
                                    "y": 0,
                                    "pos": 0
                                },
                                "c5b32ee6": {
                                    "i": "c5b32ee6",
                                    "h": 7,
                                    "w": 14,
                                    "x": 0,
                                    "y": 7,
                                    "pos": 1
                                }
                            },
                            "items": {
                                "a6f7c0e4": {
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
                                        "validationType": "Email",
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "",
                                        "version": "latest"
                                    },
                                    "name": "input1"
                                },
                                "c5b32ee6": {
                                    "compType": "password",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "label": {
                                            "text": "Password",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "validationType": "Regex",
                                        "visibilityToggle": true,
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "",
                                        "version": "latest"
                                    },
                                    "name": "password1"
                                }
                            }
                        }
                    }
                },
                "footer": {
                    "layout": {
                        "95ccf34e": {
                            "i": "95ccf34e",
                            "h": 5,
                            "w": 10,
                            "x": 14,
                            "y": 0
                        }
                    },
                    "items": {
                        "95ccf34e": {
                            "compType": "button",
                            "comp": {
                                "text": "Login",
                                "type": "submit",
                                "form": "form1",
                                "preventStyleOverwriting": false,
                                "appliedThemeId": "",
                                "version": "latest"
                            },
                            "name": "formButton1"
                        }
                    }
                },
                "showHeader": false,
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
              },
          }}
          compFactory={FormComp}
        />

        <Example
          title="Hiding Form Body"
          hideSettings={true}
          config={{
            container: {
                "header": {
                    "layout": {
                        "a6083c0a": {
                            "i": "a6083c0a",
                            "h": 5,
                            "w": 24,
                            "x": 0,
                            "y": 0
                        }
                    },
                    "items": {
                        "a6083c0a": {
                            "compType": "text",
                            "comp": {
                                "text": "### Welcome Back!",
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
                            "name": "formTitle1"
                        }
                    }
                },
                "body": {
                    "0": {
                        "view": {
                            "layout": {
                                "a6f7c0e4": {
                                    "i": "a6f7c0e4",
                                    "h": 7,
                                    "w": 14,
                                    "x": 0,
                                    "y": 0,
                                    "pos": 0
                                },
                                "c5b32ee6": {
                                    "i": "c5b32ee6",
                                    "h": 7,
                                    "w": 14,
                                    "x": 0,
                                    "y": 7,
                                    "pos": 1
                                }
                            },
                            "items": {
                                "a6f7c0e4": {
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
                                        "validationType": "Email",
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "",
                                        "version": "latest"
                                    },
                                    "name": "input1"
                                },
                                "c5b32ee6": {
                                    "compType": "password",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "label": {
                                            "text": "Password",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "validationType": "Regex",
                                        "visibilityToggle": true,
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "",
                                        "version": "latest"
                                    },
                                    "name": "password1"
                                }
                            }
                        }
                    }
                },
                "footer": {
                    "layout": {
                        "95ccf34e": {
                            "i": "95ccf34e",
                            "h": 5,
                            "w": 10,
                            "x": 14,
                            "y": 0
                        }
                    },
                    "items": {
                        "95ccf34e": {
                            "compType": "button",
                            "comp": {
                                "text": "Login",
                                "type": "submit",
                                "form": "form1",
                                "preventStyleOverwriting": false,
                                "appliedThemeId": "",
                                "version": "latest"
                            },
                            "name": "formButton1"
                        }
                    }
                },
                "showHeader": true,
                "showBody": false,
                "showFooter": true,
                "autoHeight": "auto",
                "showVerticalScrollbar": false,
                "horizontalGridCells": 24,
                "scrollbars": false,
                "style": {
                    "borderWidth": "1px"
                },
                "appliedThemeId": ""
              },
          }}
          compFactory={FormComp}
        />

        <Example
          title="Hiding Form Footer"
          hideSettings={true}
          config={{
            container: {
                "header": {
                    "layout": {
                        "a6083c0a": {
                            "i": "a6083c0a",
                            "h": 5,
                            "w": 24,
                            "x": 0,
                            "y": 0
                        }
                    },
                    "items": {
                        "a6083c0a": {
                            "compType": "text",
                            "comp": {
                                "text": "### Welcome Back!",
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
                            "name": "formTitle1"
                        }
                    }
                },
                "body": {
                    "0": {
                        "view": {
                            "layout": {
                                "a6f7c0e4": {
                                    "i": "a6f7c0e4",
                                    "h": 7,
                                    "w": 14,
                                    "x": 0,
                                    "y": 0,
                                    "pos": 0
                                },
                                "c5b32ee6": {
                                    "i": "c5b32ee6",
                                    "h": 7,
                                    "w": 14,
                                    "x": 0,
                                    "y": 7,
                                    "pos": 1
                                }
                            },
                            "items": {
                                "a6f7c0e4": {
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
                                        "validationType": "Email",
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "",
                                        "version": "latest"
                                    },
                                    "name": "input1"
                                },
                                "c5b32ee6": {
                                    "compType": "password",
                                    "comp": {
                                        "defaultValue": "",
                                        "value": "",
                                        "label": {
                                            "text": "Password",
                                            "width": "33",
                                            "widthUnit": "%",
                                            "position": "row",
                                            "align": "left"
                                        },
                                        "validationType": "Regex",
                                        "visibilityToggle": true,
                                        "preventStyleOverwriting": false,
                                        "appliedThemeId": "",
                                        "version": "latest"
                                    },
                                    "name": "password1"
                                }
                            }
                        }
                    }
                },
                "footer": {
                    "layout": {
                        "95ccf34e": {
                            "i": "95ccf34e",
                            "h": 5,
                            "w": 10,
                            "x": 14,
                            "y": 0
                        }
                    },
                    "items": {
                        "95ccf34e": {
                            "compType": "button",
                            "comp": {
                                "text": "Login",
                                "type": "submit",
                                "form": "form1",
                                "preventStyleOverwriting": false,
                                "appliedThemeId": "",
                                "version": "latest"
                            },
                            "name": "formButton1"
                        }
                    }
                },
                "showHeader": true,
                "showBody": true,
                "showFooter": false,
                "autoHeight": "auto",
                "showVerticalScrollbar": false,
                "horizontalGridCells": 24,
                "scrollbars": false,
                "style": {
                    "borderWidth": "1px"
                },
                "appliedThemeId": ""
              },
          }}
          compFactory={FormComp}
        />
      </ExampleGroup>
    </>
  );
}
