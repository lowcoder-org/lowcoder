import { InputRef } from "antd/es/input";
import styled from "styled-components";
import {
  CommonSettingResponseData,
  SetCommonSettingPayload,
  ThemeDetail,
  ThemeType,
} from "api/commonSettingApi";
import history from "util/history";
import { THEME_SETTING } from "constants/routesURL";
import ThemeSettingsSelector, { configChangeParams } from "../../../../components/ThemeSettingsSelector";
import React, { lazy } from "react";
import { connect } from "react-redux";
import { fetchCommonSettings, setCommonSettings } from "redux/reduxActions/commonSettingsActions";
import { AppState } from "redux/reducers";
import { DETAIL_TYPE } from "../themeConstant";
import { ArrowIcon, CustomModal, ResetIcon } from "lowcoder-design";
import {
  DetailContainer,
  DetailContent,
  DetailTitle,
  ResetButton,
  SaveButton,
  ChartInput,
  Footer,
  Header,
} from "../styledComponents";
import {
  ColorPickerCompIcon,
  TextSizeIcon,
  PageLayoutCompIcon,
  ShapesCompIcon,
  ChartCompIcon,
  
} from "lowcoder-design";
import PreviewApp from "../../../../components/PreviewApp";
import { trans } from "i18n";
import { Prompt } from "react-router";
import { HeaderBack } from "pages/setting/permission/styledComponents";
import dsl from "./previewDsl";
import chartDsl from "./chartPreviewDsl";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import { Card, Divider, Flex, List, Tooltip } from 'antd';

import { ThemeCompPanel } from "pages/setting/theme/ThemeCompPanel";
import { JSONObject } from "@lowcoder-ee/util/jsonTypes";

const ThemeSettingsView = styled.div`
  font-size: 14px;
  color: #8b8fa3;
  flex-grow: 1;
  padding-top: 0px;
  padding-left: 0px;
  max-width: 100%;
`;

const StyleThemeSettingsCover = styled.div`
    display: flex;
    flex-direction: row;
    background: rgb(2,0,36);
background: linear-gradient(34deg, rgba(2,0,36,1) 0%, rgba(102,9,121,1) 35%, rgba(0,255,181,1) 100%);
    padding: 15px;
    height: 80px;
    border-radius:10px 10px 0 0;
`;

const CodeEditor = lazy(
  () => import("base/codeEditor/codeEditor")
    .then(module => ({default: module.CodeEditor}))
)

type LocationProp = {
  theme: ThemeDetail;
  name: string;
  id: string;
  type: DETAIL_TYPE;
};

type ThemeDetailPageProps = {
  setCommonSettings: (params: SetCommonSettingPayload) => void;
  fetchCommonSettings: (
    orgId: string,
    onSuccess?: (data: CommonSettingResponseData) => void
  ) => void;
  themeList?: ThemeType[];
  orgId: string;
  location: Location & { state: LocationProp };
  match: any;
};

type ThemeDetailPageState = {
  name?: string;
  theme?: ThemeDetail;
  canLeave: boolean;
  compDsl?: JSONObject;
};

class ThemeDetailPage extends React.Component<ThemeDetailPageProps, ThemeDetailPageState> {
  themeDefault?: ThemeDetail;
  readonly id: string;
  // readonly type: string;
  readonly inputRef: React.RefObject<InputRef>;
  footerRef = React.createRef<HTMLDivElement>();

  constructor(props: ThemeDetailPageProps) {
    super(props);
    this.id = this.props.match.params.themeId;

    this.state = {
      canLeave: false,
      compDsl: undefined,
    };
    this.inputRef = React.createRef();
  }

  findCurrentTheme() {
    const themeDetail = this.props.themeList?.find(item => item.id === this.id);
    this.setState({
      name: themeDetail?.name,
      theme: themeDetail?.theme,
    });
    this.themeDefault = themeDetail?.theme;
  }

  componentDidMount() {
    if(this.props.themeList?.length) {
      this.findCurrentTheme();
    }
  }

  componentDidUpdate(prevProps: ThemeDetailPageProps, prevState: ThemeDetailPageState) {
    if (prevProps.themeList?.length !== this.props.themeList?.length) {
      this.findCurrentTheme();
    }
  }

  handleReset() {
    this.setState({ theme: this.themeDefault });
  }

  handleSave() {
    this.props.fetchCommonSettings(this.props.orgId, ({ themeList }) => {
      let list = [];
      const currentTheme = {
        name: this.state.name,
        id: this.id,
        updateTime: new Date().getTime(),
        theme: this.state.theme,
      };
      list = themeList!.map((theme) => {
        if (theme.id === this.id) {
          return currentTheme;
        } else {
          return theme;
        }
      });

      this.props.setCommonSettings({
        orgId: this.props.orgId,
        data: { key: "themeList", value: list },
        onSuccess: () => {
          messageInstance.success(trans("theme.saveSuccessMsg"));
          this.themeDefault = this.state.theme;
        },
      });
    });
  }

  configChange(params: configChangeParams) {
    if (!this.state.theme) return;

    this.setState({
      theme: {
        ...this.state.theme,
        [params.themeSettingKey]: params.color || params.radius || params.chart || params.margin || params.padding  || params.borderWidth || params.borderStyle || params.fontFamily || params.showComponentLoadingIndicators || params.showDataLoadingIndicators || params.dataLoadingIndicator || params.gridColumns || params.gridRowHeight || params.gridRowCount || params.gridPaddingX || params.gridPaddingY || params.gridBgImage || params.gridBgImageRepeat || params.gridBgImageSize || params.gridBgImagePosition || params.gridBgImageOrigin,
      },
    });
  }

  isThemeNotChange() {
    return (
      JSON.stringify({ ...this.state.theme }) ===
      JSON.stringify({ ...this.themeDefault })
    );
  }

  goList = () => {
    history.push(THEME_SETTING);
  };

  render() {

    const colorSettings = [
      {
        key: 'primary',
        title: trans('theme.mainColor'),
        items: [
          {
            settingsKey: 'primary',
            name: trans('themeDetail.primary'),
            desc: trans('themeDetail.primaryDesc'),
            color: this.state.theme?.primary,
          },
          {
            settingsKey: 'primarySurface',
            name: trans('themeDetail.primarySurface'),
            desc: trans('themeDetail.primarySurfaceDesc'),
            color: this.state.theme?.primarySurface,
          },
          {
            settingsKey: 'border',
            name: trans('themeDetail.borderColor'),
            desc: trans('themeDetail.borderColorDesc'),
            color: this.state.theme?.border || this.state.theme?.borderColor,
          }
        ]
      },
      {
        key: 'text',
        title: trans('theme.text'),
        items: [
          {
            settingsKey: 'textLight',
            name: trans('themeDetail.textLight'),
            desc: trans('themeDetail.textLightDesc'),
            color: this.state.theme?.textLight,
          },
          {
            settingsKey: 'textDark',
            name: trans('themeDetail.textDark'),
            desc: trans('themeDetail.textDarkDesc'),
            color: this.state.theme?.textDark,
          }
        ]
      }
    ];

    const fontSettings = [
      {
        title: trans('themeDetail.fonts'),
        items: [
          {
            settingsKey: 'fontFamily',
            name: trans('themeDetail.fontFamily'),
            desc: trans('themeDetail.fontFamilyDesc'),
            type: "fontFamily",
            value: this.state.theme?.fontFamily,
          }
        ]
      },
    ];

    const layoutSettings = [
      {
        title: trans('themeDetail.borders'),
        items: [
          {
            settingsKey: 'radius',
            name: trans('themeDetail.borderRadius'),
            desc: trans('themeDetail.borderRadiusDesc'),
            type: "radius",
            value: this.state.theme?.radius || this.state.theme?.borderRadius,
          },
          {
            settingsKey: 'borderWidth',
            name: trans('themeDetail.borderWidth'),
            desc: trans('themeDetail.borderWidthDesc'),
            type: "borderWidth",
            value: this.state.theme?.borderWidth,
          },
          {
            settingsKey: 'borderStyle',
            name: trans('themeDetail.borderStyle'),
            desc: trans('themeDetail.borderStyleDesc'),
            type: "borderStyle",
            value: this.state.theme?.borderStyle,
          }
        ]
      },
      {
        title: trans('themeDetail.spacing'),
        items: [
          {
            settingsKey: 'margin',
            name: trans('themeDetail.margin'),
            desc: trans('themeDetail.marginDesc'),
            type: "margin",
            value: this.state.theme?.margin,
          },
          {
            settingsKey: 'padding',
            name: trans('themeDetail.padding'),
            desc: trans('themeDetail.paddingDesc'),
            type: "padding",
            value: this.state.theme?.padding,
          },
        ]
      },
      {
        title: trans('themeDetail.loadingIndicators'),
        items: [
          {
            settingsKey: 'showComponentLoadingIndicators',
            name: trans('themeDetail.showComponentLoadingIndicators'),
            desc: '',
            type: "showComponentLoadingIndicators",
            value: this.state.theme?.showComponentLoadingIndicators,
          },
          {
            settingsKey: 'showDataLoadingIndicators',
            name: trans('themeDetail.showDataLoadingIndicators'),
            desc: '',
            type: "showDataLoadingIndicators",
            value: this.state.theme?.showDataLoadingIndicators,
          },
          {
            settingsKey: 'dataLoadingIndicator',
            name: trans('themeDetail.dataLoadingIndicator'),
            desc: '',
            type: "dataLoadingIndicator",
            value: this.state.theme?.dataLoadingIndicator,
          },
        ]
      },
    ];

    const canvasSettings = [
      {
        title: trans('themeDetail.gridSettings'),
        items: [
          {
            settingsKey: 'gridColumns',
            name: trans('themeDetail.gridColumns'),
            desc: trans('themeDetail.gridColumnsDesc'),
            type: "gridColumns",
            value: this.state.theme?.gridColumns,
          },
          {
            settingsKey: 'gridRowHeight',
            name: trans('themeDetail.gridRowHeight'),
            desc: trans('themeDetail.gridRowHeightDesc'),
            type: "gridRowHeight",
            value: this.state.theme?.gridRowHeight,
          },
          {
            settingsKey: 'gridRowCount',
            name: trans('themeDetail.gridRowCount'),
            desc: trans('themeDetail.gridRowCountDesc'),
            type: "gridRowCount",
            value: this.state.theme?.gridRowCount,
          },
        ]
      },
      {
        title: trans('themeDetail.spacing'),
        items: [
          {
            settingsKey: 'gridPaddingX',
            name: trans('themeDetail.gridPaddingX'),
            desc: trans('themeDetail.gridPaddingXDesc'),
            type: "gridPaddingX",
            value: this.state.theme?.gridPaddingX,
          },
          {
            settingsKey: 'gridPaddingY',
            name: trans('themeDetail.gridPaddingY'),
            desc: trans('themeDetail.gridPaddingYDesc'),
            type: "gridPaddingY",
            value: this.state.theme?.gridPaddingY,
          }
        ]
      },
      {
        title: trans('themeDetail.background'),
        items: [
          {
            settingsKey: 'canvas',
            type: "canvas",
            name: trans('themeDetail.canvas'),
            desc: trans('themeDetail.canvasDesc'),
            color: this.state.theme?.canvas,
          },
          {
            settingsKey: 'gridBgImage',
            name: trans('themeDetail.gridBgImage'),
            desc: trans('themeDetail.gridBgImageDesc'),
            type: "gridBgImage",
            value: this.state.theme?.gridBgImage,
          },
          {
            settingsKey: 'gridBgImageRepeat',
            name: trans('themeDetail.gridBgImageRepeat'),
            desc: trans('themeDetail.gridBgImageRepeatDesc'),
            type: "gridBgImageRepeat",
            value: this.state.theme?.gridBgImageRepeat,
          },
          {
            settingsKey: 'gridBgImageSize',
            name: trans('themeDetail.gridBgImageSize'),
            desc: trans('themeDetail.gridBgImageSizeDesc'),
            type: "gridBgImageSize",
            value: this.state.theme?.gridBgImageSize,
          },
          {
            settingsKey: 'gridBgImagePosition',
            name: trans('themeDetail.gridBgImagePosition'),
            desc: trans('themeDetail.gridBgImagePositionDesc'),
            type: "gridBgImagePosition",
            value: this.state.theme?.gridBgImagePosition,
          },
          {
            settingsKey: 'gridBgImageOrigin',
            name: trans('themeDetail.gridBgImageOrigin'),
            desc: trans('themeDetail.gridBgImageOriginDesc'),
            type: "gridBgImageOrigin",
            value: this.state.theme?.gridBgImageOrigin,
          }
        ]
      },
    ];

    if (!this.themeDefault) {
      return (
        <Flex align="center" justify="center" vertical style={{
          height: '300px',
          width: '400px',
          margin: '0 auto',
        }}>
          <h4>Oops! Theme not found.</h4>
          <button onClick={() => history.push(THEME_SETTING)} style={{background: '#4965f2',border: '1px solid #4965f2', color: '#ffffff',borderRadius:'6px'}}>Back to Themes</button>
        </Flex>
      )
    }

    return (
      <>
        <Prompt
          message={(location) => {
            if (!this.state.canLeave && this.isThemeNotChange()) {
              this.setState({
                canLeave: true,
              });
            }
            if (this.state.canLeave) {
              return true;
            }
            CustomModal.confirm({
              title: trans("theme.leaveTipTitle"),
              content: trans("theme.leaveTipContent"),
              okText: trans("theme.leaveTipOkText"),
              onConfirm: () => {
                this.setState(
                  {
                    canLeave: true,
                  },
                  () => history.push(location.pathname)
                );
              },
            });
            return false;
          }}
          when={!this.isThemeNotChange()}
        ></Prompt>

        <DetailContainer>
          <Header>
            <HeaderBack>
              <span onClick={() => this.goList()}>{trans("settings.theme")}</span>
              <ArrowIcon />
              <span>{this.state.name}</span>
            </HeaderBack>
          </Header>

          <DetailContent>
            <ThemeSettingsView>
              <StyleThemeSettingsCover>
                <ColorPickerCompIcon width={"36px"} style={{marginRight : "10px"}}/> <h2 style={{color: "#ffffff", marginTop : "8px"}}> {trans("theme.mainColor")}</h2>
              </StyleThemeSettingsCover>
              <Card style={{ marginBottom: "20px", minHeight : "200px" }}>
                <Flex gap={"middle"}>
                  <List
                    bordered
                    dataSource={colorSettings}
                    renderItem={(item) => (
                      <>
                        {item.title && (
                            <List.Item>
                              <DetailTitle>{item.title}</DetailTitle>
                            </List.Item>
                        )}
                        {item.items.map((colorItem) => (
                          <Tooltip key={colorItem.settingsKey} title={colorItem.desc} placement="right">
                            <List.Item key={colorItem.settingsKey}>
                              <ThemeSettingsSelector
                                themeSettingKey={colorItem.settingsKey}
                                name={colorItem.name}
                                // desc={colorItem.desc}
                                color={colorItem.color}
                                configChange={(params) => {
                                  this.configChange(params);
                                }}
                              />
                          </List.Item>
                          </Tooltip>
                        ))}
                      </>
                    )}
                  />
                  <Divider type="vertical" style={{height: "610px"}}/>
                  <PreviewApp style={{marginTop: '3px', height: "620px", width: "100%"}} theme={this.state.theme!} dsl={dsl} />
                </Flex>
              </Card>
            </ThemeSettingsView>

            <ThemeSettingsView>
              <StyleThemeSettingsCover>
                <TextSizeIcon width={"36px"} style={{marginRight : "10px"}}/> <h2 style={{color: "#ffffff", marginTop : "8px"}}> {trans("theme.fonts")}</h2>
              </StyleThemeSettingsCover>
              <Card style={{ marginBottom: "20px", minHeight : "200px" }}>
                <Flex gap={"middle"}>
                  <List
                    bordered
                    dataSource={fontSettings}
                    renderItem={(item) => (
                      <>
                        {item.title && (
                            <List.Item>
                              <DetailTitle>{item.title}</DetailTitle>
                            </List.Item>
                        )}
                        {item.items.map((layoutSettingsItem) => (
                          <Tooltip key={layoutSettingsItem.settingsKey} title={layoutSettingsItem.desc} placement="right">
                            <List.Item key={layoutSettingsItem.settingsKey}>
                              {layoutSettingsItem.type == "fontFamily" && 
                                <ThemeSettingsSelector
                                  themeSettingKey={layoutSettingsItem.settingsKey}
                                  name={layoutSettingsItem.name}
                                  fontFamily={layoutSettingsItem.value}
                                  configChange={(params) => {
                                    this.configChange(params);
                                }}/>
                              }
                            </List.Item>
                            <List.Item>
                              <div style={{ width: "200px", color: "#aaa"}}>Currently, the preview of Font-Family here in the Theme Settings may now show the right font. However, the Font Family Attribute comes into effect in all your apps, which uses this Theme.
                              <br/><br/><a href="https://docs.lowcoder.cloud/lowcoder-documentation/build-applications/themes-and-styling#demo-2-custom-font-family" target="_blank">Remember, you neded to set the CSS inclue at App- or Workspace Level</a></div>
                            </List.Item>
                          </Tooltip>
                        ))}
                      </>
                    )}
                  />
                  <Divider type="vertical" style={{height: "610px"}}/>
                  <PreviewApp style={{marginTop: '3px', height: "620px", width: "100%"}} theme={this.state.theme!} dsl={dsl} />
                </Flex>
              </Card>
            </ThemeSettingsView>
            
            <ThemeSettingsView>
              <StyleThemeSettingsCover>
                <PageLayoutCompIcon width={"36px"} style={{marginRight : "10px"}}/> <h2 style={{color: "#ffffff", marginTop : "8px"}}> {trans("theme.canvas")}</h2>
              </StyleThemeSettingsCover>
              <Card style={{ marginBottom: "20px", minHeight : "200px" }}>
                <Flex gap={"middle"}>
                  <List
                    bordered
                    dataSource={canvasSettings}
                    renderItem={(item) => (
                      <>
                        {item.title && (
                          <List.Item>
                            <DetailTitle>{item.title}</DetailTitle>
                          </List.Item>
                        )}
                        {item.items.map((canvasSettingItem) => (
                          <Tooltip key={canvasSettingItem.settingsKey} title={canvasSettingItem.desc} placement="right">
                            <List.Item key={canvasSettingItem.settingsKey}>
                              {canvasSettingItem.type == "gridColumns" && 
                                <ThemeSettingsSelector
                                  themeSettingKey={canvasSettingItem.settingsKey}
                                  name={canvasSettingItem.name}
                                  gridColumns={canvasSettingItem.value as string}
                                  configChange={(params) => {
                                    this.configChange(params);
                                  }}
                                />
                              }
                              {canvasSettingItem.type == "gridRowHeight" && 
                                <ThemeSettingsSelector
                                  themeSettingKey={canvasSettingItem.settingsKey}
                                  name={canvasSettingItem.name}
                                  gridRowHeight={canvasSettingItem.value as string}
                                  configChange={(params) => {
                                    this.configChange(params);
                                  }}
                                />
                              }
                              {canvasSettingItem.type == "gridRowCount" && 
                                <ThemeSettingsSelector
                                  themeSettingKey={canvasSettingItem.settingsKey}
                                  name={canvasSettingItem.name}
                                  gridRowCount={canvasSettingItem.value as number}
                                  configChange={(params) => {
                                    this.configChange(params);
                                  }}
                                />
                              }
                              {canvasSettingItem.type == "gridPaddingX" && 
                                <ThemeSettingsSelector
                                  themeSettingKey={canvasSettingItem.settingsKey}
                                  name={canvasSettingItem.name}
                                  gridPaddingX={canvasSettingItem.value as number}
                                  configChange={(params) => {
                                    this.configChange(params);
                                  }}
                                />
                              }
                              {canvasSettingItem.type == "gridPaddingY" && 
                                <ThemeSettingsSelector
                                  themeSettingKey={canvasSettingItem.settingsKey}
                                  name={canvasSettingItem.name}
                                  gridPaddingY={canvasSettingItem.value as number}
                                  configChange={(params) => {
                                    this.configChange(params);
                                  }}
                                />
                              }
                              {canvasSettingItem.type == "canvas" &&
                                <ThemeSettingsSelector
                                  themeSettingKey={canvasSettingItem.settingsKey}
                                  name={canvasSettingItem.name}
                                  // desc={colorItem.desc}
                                  color={(canvasSettingItem as any).color}
                                  configChange={(params) => {
                                    this.configChange(params);
                                  }}
                                />
                              }
                              {canvasSettingItem.type == "gridBgImage" && 
                                <ThemeSettingsSelector
                                  themeSettingKey={canvasSettingItem.settingsKey}
                                  name={canvasSettingItem.name}
                                  gridBgImage={canvasSettingItem.value as string}
                                  configChange={(params) => {
                                    this.configChange(params);
                                  }}
                                />
                              }
                              {canvasSettingItem.type == "gridBgImageRepeat" && 
                                <ThemeSettingsSelector
                                  themeSettingKey={canvasSettingItem.settingsKey}
                                  name={canvasSettingItem.name}
                                  gridBgImageRepeat={canvasSettingItem.value as string}
                                  configChange={(params) => {
                                    this.configChange(params);
                                  }}
                                />
                              }
                              {canvasSettingItem.type == "gridBgImageSize" && 
                                <ThemeSettingsSelector
                                  themeSettingKey={canvasSettingItem.settingsKey}
                                  name={canvasSettingItem.name}
                                  gridBgImageSize={canvasSettingItem.value as string}
                                  configChange={(params) => {
                                    this.configChange(params);
                                  }}
                                />
                              }
                              {canvasSettingItem.type == "gridBgImagePosition" && 
                                <ThemeSettingsSelector
                                  themeSettingKey={canvasSettingItem.settingsKey}
                                  name={canvasSettingItem.name}
                                  gridBgImagePosition={canvasSettingItem.value as string}
                                  configChange={(params) => {
                                    this.configChange(params);
                                  }}
                                />
                              }
                              {canvasSettingItem.type == "gridBgImageOrigin" && 
                                <ThemeSettingsSelector
                                  themeSettingKey={canvasSettingItem.settingsKey}
                                  name={canvasSettingItem.name}
                                  gridBgImageOrigin={canvasSettingItem.value as string}
                                  configChange={(params) => {
                                    this.configChange(params);
                                  }}
                                />
                              }
                          </List.Item>
                          </Tooltip>
                        ))}
                      </>
                    )}
                  />
                  <Divider type="vertical" style={{height: "610px"}}/>
                  <PreviewApp style={{marginTop: '3px', height: "620px", width: "100%"}} theme={this.state.theme!} dsl={dsl} />
                </Flex>
              </Card>
            </ThemeSettingsView>

            <ThemeSettingsView>
              <StyleThemeSettingsCover>
                <PageLayoutCompIcon width={"36px"} style={{marginRight : "10px"}}/> <h2 style={{color: "#ffffff", marginTop : "8px"}}> {trans("theme.layout")}</h2>
              </StyleThemeSettingsCover>
              <Card style={{ marginBottom: "20px", minHeight : "200px" }}>
                <Flex gap={"middle"}>
                  <List
                    bordered
                    dataSource={layoutSettings}
                    renderItem={(item) => (
                      <>
                        {item.title && (
                            <List.Item>
                              <DetailTitle>{item.title}</DetailTitle>
                            </List.Item>
                        )}
                        {item.items.map((layoutSettingsItem) => (
                          <Tooltip key={layoutSettingsItem.settingsKey} title={layoutSettingsItem.desc} placement="right">
                            <List.Item key={layoutSettingsItem.settingsKey}>
                              {layoutSettingsItem.type == "radius" && 
                                <ThemeSettingsSelector
                                  themeSettingKey={layoutSettingsItem.settingsKey}
                                  name={layoutSettingsItem.name}
                                  radius={layoutSettingsItem.value as string}
                                  configChange={(params) => {
                                    this.configChange(params);
                                  }}
                                />
                              }
                              {layoutSettingsItem.type == "borderWidth" && 
                                <ThemeSettingsSelector
                                  themeSettingKey={layoutSettingsItem.settingsKey}
                                  name={layoutSettingsItem.name}
                                  borderWidth={layoutSettingsItem.value as string}
                                  configChange={(params) => {
                                    this.configChange(params);
                                  }}
                                />
                              }
                              {layoutSettingsItem.type == "borderStyle" && 
                                <ThemeSettingsSelector
                                  themeSettingKey={layoutSettingsItem.settingsKey}
                                  name={layoutSettingsItem.name}
                                  borderStyle={layoutSettingsItem.value as string}
                                  configChange={(params) => {
                                    this.configChange(params);
                                  }}
                                />
                              }
                              {layoutSettingsItem.type == "margin" && 
                                <ThemeSettingsSelector
                                  themeSettingKey={layoutSettingsItem.settingsKey}
                                  name={layoutSettingsItem.name}
                                  margin={layoutSettingsItem.value as string}
                                  configChange={(params) => {
                                    this.configChange(params);
                                  }}
                                />
                              }
                              {layoutSettingsItem.type == "padding" && 
                                <ThemeSettingsSelector
                                  themeSettingKey={layoutSettingsItem.settingsKey}
                                  name={layoutSettingsItem.name}
                                  padding={layoutSettingsItem.value as string}
                                  configChange={(params) => {
                                    this.configChange(params);
                                  }}
                                />
                              }
                              {layoutSettingsItem.type == "showComponentLoadingIndicators" && 
                                <ThemeSettingsSelector
                                  themeSettingKey={layoutSettingsItem.settingsKey}
                                  name={layoutSettingsItem.name}
                                  showComponentLoadingIndicators={layoutSettingsItem.value as boolean}
                                  configChange={(params) => {
                                    this.configChange(params);
                                  }}
                                />
                              }
                              {layoutSettingsItem.type == "showDataLoadingIndicators" && 
                                <ThemeSettingsSelector
                                  themeSettingKey={layoutSettingsItem.settingsKey}
                                  name={layoutSettingsItem.name}
                                  showDataLoadingIndicators={layoutSettingsItem.value as boolean}
                                  configChange={(params) => {
                                    this.configChange(params);
                                  }}
                                />
                              }
                              {layoutSettingsItem.type == "dataLoadingIndicator" && 
                                <ThemeSettingsSelector
                                  themeSettingKey={layoutSettingsItem.settingsKey}
                                  name={layoutSettingsItem.name}
                                  dataLoadingIndicator={layoutSettingsItem.value as string}
                                  configChange={(params) => {
                                    this.configChange(params);
                                  }}
                                  showVarName={false}
                                />
                              }
                          </List.Item>
                          </Tooltip>
                        ))}
                      </>
                    )}
                  />
                  <Divider type="vertical" style={{height: "610px"}}/>
                  <PreviewApp style={{marginTop: '3px', height: "620px", width: "100%"}} theme={this.state.theme!} dsl={dsl} />
                </Flex>
              </Card>
            </ThemeSettingsView>

            <ThemeSettingsView>
              <StyleThemeSettingsCover>
                <ShapesCompIcon width={"36px"} style={{marginRight : "10px"}}/> <h2 style={{color: "#ffffff", marginTop : "8px"}}> {trans("theme.components")}</h2>
              </StyleThemeSettingsCover>
              <Card style={{ marginBottom: "20px", minHeight : "200px", height: "690px", overflow: "hidden"}}
              >
                <ThemeCompPanel
                  theme={this.state.theme}
                  onCompStyleChange={(
                    compName: string,
                    styleKey: string,
                    compStyle: Record<string, string>
                  ) => {
                    if (this.state.theme) {
                      this.setState({
                        theme: {
                          ...this.state.theme,
                          components: {
                            ...this.state.theme.components,
                            [compName]: {
                              ...this.state.theme.components?.[compName],
                              [styleKey]: compStyle,
                            }
                          }
                        },
                      });
                    }
                  }}
                />
              </Card>
            </ThemeSettingsView>

            <ThemeSettingsView>
              <StyleThemeSettingsCover>
                <ChartCompIcon width={"36px"} style={{marginRight : "10px"}}/> <h2 style={{color: "#ffffff", marginTop : "8px"}}> {trans("theme.charts")}</h2>
              </StyleThemeSettingsCover>
              <Card style={{ marginBottom: "20px", minHeight : "200px" }}>
                <Flex gap={"middle"}>
                  <ChartInput>
                  <List
                    bordered>
                    <List.Item>
                      <div style={{width: "210px"}}>
                        {trans("themeDetail.chartDesc")}
                        <a target="_blank" href="https://echarts.apache.org/en/theme-builder.html" rel="noreferrer">
                          {" "}
                          {trans("themeDetail.echartsJson")}
                        </a>
                      </div>
                    </List.Item>
                    <List.Item style={{width : "260px", height: "370px", padding:"10px"}}>
                      <CodeEditor
                        value={this.state.theme?.chart || ""}
                        onChange={(value) => this.configChange({
                          themeSettingKey: "chart",
                          chart: value.doc.toString() ? value.doc.toString() : undefined,
                        })}
                        styleName="window"
                        codeType="PureJSON"
                        showLineNum={false}
                        bordered
                      />
                    </List.Item>
                    </List>
                  </ChartInput>
                  <Divider type="vertical" style={{height: "370px"}}/>
                  <PreviewApp style={{ height: "380px", width: "100%", margin: "0" }} theme={this.state.theme!} dsl={chartDsl} />
                </Flex>
              </Card>
            </ThemeSettingsView>

          </DetailContent>

          <Footer ref={this.footerRef} className="no-bottom">
            <ResetButton
              icon={<ResetIcon />}
              disabled={this.isThemeNotChange()}
              onClick={() => this.handleReset()}
            >
              {trans("reset")}
            </ResetButton>
            <SaveButton
              type="primary"
              disabled={this.isThemeNotChange() || !this.state.name}
              onClick={() => this.handleSave()}
            >
              {trans("theme.saveBtn")}
            </SaveButton>
          </Footer>
        </DetailContainer>
      </>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  themeList: state.ui.commonSettings?.settings?.themeList || [],
  orgId: state.ui.users.user.currentOrgId,
});

const mapDispatchToProps = (dispatch: any) => ({
  setCommonSettings: (params: SetCommonSettingPayload) => dispatch(setCommonSettings(params)),
  fetchCommonSettings: (orgId: string, onSuccess?: (data: CommonSettingResponseData) => void) =>
    dispatch(fetchCommonSettings({ orgId, onSuccess })),
});

export default connect(mapStateToProps, mapDispatchToProps)(ThemeDetailPage);
