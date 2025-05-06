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
        <Example
          title="Reset after Form Submit - True"
          hideSettings={true}
          config={{
            container: container,
            resetAfterSubmit: true, 
          }}
          compFactory={FormComp}
        />
        <Example
          title="Reset after Form Submit - False"
          hideSettings={true}
          config={{
            container: container,
            resetAfterSubmit: false, 
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

        <ExampleGroup
            title="Styling Properties"
            description="The Following Examples Show the different Styling properties on the Form Component."
            >
            <Example
                title="Background Color, Border Radius,Style,Width,Color"
                hideSettings={true}
                config={{
                    container: {
                        "header": {
                            "layout": {
                                "68d42007": {
                                    "i": "68d42007",
                                    "h": 5,
                                    "w": 24,
                                    "x": 0,
                                    "y": 0
                                }
                            },
                            "items": {
                                "68d42007": {
                                    "compType": "text",
                                    "comp": {
                                        "text": "### Welcome Back",
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
                                        "showDataLoadingIndicators": false,
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
                                        "4b9ae86d": {
                                            "i": "4b9ae86d",
                                            "h": 7,
                                            "w": 8,
                                            "x": 0,
                                            "y": 0,
                                            "pos": 0
                                        },
                                        "e74dc9d9": {
                                            "i": "e74dc9d9",
                                            "h": 7,
                                            "w": 8,
                                            "x": 0,
                                            "y": 7,
                                            "pos": 1
                                        }
                                    },
                                    "items": {
                                        "4b9ae86d": {
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
                                                "showDataLoadingIndicators": false,
                                                "preventStyleOverwriting": false,
                                                "appliedThemeId": "",
                                                "version": "latest"
                                            },
                                            "name": "input1"
                                        },
                                        "e74dc9d9": {
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
                                                "regex": "test",
                                                "visibilityToggle": true,
                                                "showDataLoadingIndicators": false,
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
                                "64227c09": {
                                    "i": "64227c09",
                                    "h": 6,
                                    "w": 5,
                                    "x": 19,
                                    "y": 0
                                }
                            },
                            "items": {
                                "64227c09": {
                                    "compType": "button",
                                    "comp": {
                                        "text": "Login",
                                        "type": "submit",
                                        "form": "form1",
                                        "showDataLoadingIndicators": false,
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
                            "border": "#3377FF",
                            "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                            "radius": "20px",
                            "borderWidth": "3px",
                            "borderStyle": "dashed",
                        },
                        "appliedThemeId": ""
                    },
                }}
                compFactory={FormComp}
            />
            <Example
                title="Margin & Padding"
                hideSettings={true}
                config={{
                    container: {
                        "header": {
                            "layout": {
                                "68d42007": {
                                    "i": "68d42007",
                                    "h": 5,
                                    "w": 24,
                                    "x": 0,
                                    "y": 0
                                }
                            },
                            "items": {
                                "68d42007": {
                                    "compType": "text",
                                    "comp": {
                                        "text": "### Welcome Back",
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
                                        "showDataLoadingIndicators": false,
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
                                        "4b9ae86d": {
                                            "i": "4b9ae86d",
                                            "h": 7,
                                            "w": 8,
                                            "x": 0,
                                            "y": 0,
                                            "pos": 0
                                        },
                                        "e74dc9d9": {
                                            "i": "e74dc9d9",
                                            "h": 7,
                                            "w": 8,
                                            "x": 0,
                                            "y": 7,
                                            "pos": 1
                                        }
                                    },
                                    "items": {
                                        "4b9ae86d": {
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
                                                "showDataLoadingIndicators": false,
                                                "preventStyleOverwriting": false,
                                                "appliedThemeId": "",
                                                "version": "latest"
                                            },
                                            "name": "input1"
                                        },
                                        "e74dc9d9": {
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
                                                "regex": "test",
                                                "visibilityToggle": true,
                                                "showDataLoadingIndicators": false,
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
                                "64227c09": {
                                    "i": "64227c09",
                                    "h": 6,
                                    "w": 5,
                                    "x": 19,
                                    "y": 0
                                }
                            },
                            "items": {
                                "64227c09": {
                                    "compType": "button",
                                    "comp": {
                                        "text": "Login",
                                        "type": "submit",
                                        "form": "form1",
                                        "showDataLoadingIndicators": false,
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
                            "border": "#3377FF",
                            "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                            "radius": "20px",
                            "borderWidth": "3px",
                            "borderStyle": "dashed",
                            "margin": "5px",
                            "padding": "20px"
                        },
                        "appliedThemeId": ""
                    },
                }}
                compFactory={FormComp}
            />
        </ExampleGroup>

        <ExampleGroup
        title="Animation Style"
        description="The Following Examples Show different animations on the Form Component."
        >
        <Example
        title="Bounce Animation"
        hideSettings={true}
        config={{
            container: container, 
            animationStyle: {
            "animation": "bounce",
            "animationDelay": "1s",
            "animationDuration": "3s",
            "animationIterationCount": "infinite"
            },
        }}
        compFactory={FormComp}
        />
        <Example
        title="Swing Animation"
        hideSettings={true}
        config={{
            container: container, 
            animationStyle: {
            "animation": "swing",
            "animationDelay": "1s",
            "animationDuration": "3s",
            "animationIterationCount": "infinite"
            },
        }}
        compFactory={FormComp}
        />
        <Example
        title="Tada Animation"
        hideSettings={true}
        config={{
            container: container, 
            animationStyle: {
            "animation": "tada",
            "animationDelay": "1s",
            "animationDuration": "3s",
            "animationIterationCount": "infinite"
            },
        }}
        compFactory={FormComp}
        />
        </ExampleGroup>
    </>
  );
}
