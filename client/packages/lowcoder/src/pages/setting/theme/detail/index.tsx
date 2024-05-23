import { InputRef } from "antd/es/input";
import styled from "styled-components";
import {
  CommonSettingResponseData,
  SetCommonSettingPayload,
  ThemeDetail,
  ThemeType,
} from "api/commonSettingApi";
import history from "util/history";
import { BASE_URL, THEME_SETTING } from "constants/routesURL";
import ColorPicker, { configChangeParams } from "../../../../components/ColorPicker";
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
  ChartDesc,
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
import { Card, Collapse, CollapseProps, Divider, Flex, List, Tooltip } from 'antd';

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
};

type ThemeDetailPageState = {
  name: string;
  theme: ThemeDetail;
  canLeave: boolean;
};

class ThemeDetailPage extends React.Component<ThemeDetailPageProps, ThemeDetailPageState> {
  themeDefault: ThemeDetail;
  readonly id: string;
  readonly type: string;
  readonly inputRef: React.RefObject<InputRef>;
  footerRef = React.createRef<HTMLDivElement>();

  constructor(props: ThemeDetailPageProps) {
    super(props);
    const { name, id, theme, type } = props.location.state || {};
    if (!name || !id || !theme || !type) {
      history.replace(BASE_URL);
      window.location.reload();
    }

    if (theme.chart) {
      this.themeDefault = theme;
    } else {
      this.themeDefault = {
        ...theme,
        chart: undefined,
      };
    }

    this.id = id;
    this.type = type;
    this.state = {
      theme,
      name,
      canLeave: false,
    };
    this.inputRef = React.createRef();
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
    this.setState({
      theme: {
        ...this.state.theme,
        [params.colorKey]: params.color || params.radius || params.chart || params.margin || params.padding  || params.gridColumns,
      },
    });
  }

  isThemeNotChange() {
    return (
      JSON.stringify({ ...this.state.theme }) ===
      JSON.stringify({ ...this.state.theme, ...this.themeDefault })
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
            color: this.state.theme.primary,
          }
        ]
      },
      {
        items: [
          {
            settingsKey: 'canvas',
            name: trans('themeDetail.canvas'),
            desc: trans('themeDetail.canvasDesc'),
            color: this.state.theme.canvas,
          },
          {
            settingsKey: 'primarySurface',
            name: trans('themeDetail.primarySurface'),
            desc: trans('themeDetail.primarySurfaceDesc'),
            color: this.state.theme.primarySurface,
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
            color: this.state.theme.textLight,
          },
          {
            settingsKey: 'textDark',
            name: trans('themeDetail.textDark'),
            desc: trans('themeDetail.textDarkDesc'),
            color: this.state.theme.textDark,
          }
        ]
      }
    ];

    // const fontSettings = [];

    const layoutSettings = [
      {
        title: trans('themeDetail.borderRadius'),
        items: [
          {
            settingsKey: 'borderRadius',
            name: trans('themeDetail.borderRadius'),
            desc: trans('themeDetail.borderRadiusDesc'),
            type: "radius",
            value: this.state.theme.borderRadius,
          }
        ]
      },
      {
        title: trans('themeDetail.margin'),
        items: [
          {
            settingsKey: 'margin',
            name: trans('themeDetail.margin'),
            desc: trans('themeDetail.marginDesc'),
            type: "margin",
            value: this.state.theme.margin,
          }
        ]
      },
      {
        title: trans('themeDetail.padding'),
        items: [
          {
            settingsKey: 'padding',
            name: trans('themeDetail.padding'),
            desc: trans('themeDetail.paddingDesc'),
            type: "padding",
            value: this.state.theme.padding,
          }
        ]
      },
      {
        title: trans('themeDetail.gridColumns'),
        items: [
          {
            settingsKey: 'gridColumns',
            name: trans('themeDetail.gridColumns'),
            desc: trans('themeDetail.gridColumnsDesc'),
            type: "gridColumns",
            value: this.state.theme.gridColumns,
          }
        ]
      }
    ];

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
                          <Tooltip title={colorItem.desc} placement="right">
                            <List.Item key={colorItem.settingsKey}>
                              <ColorPicker
                                colorKey={colorItem.settingsKey}
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
                  <PreviewApp style={{marginTop: '3px', height: "620px", width: "100%"}} theme={this.state.theme} dsl={dsl} />
                </Flex>
              </Card>  
              
            </ThemeSettingsView>

            <ThemeSettingsView>
              <StyleThemeSettingsCover>
                <TextSizeIcon width={"36px"} style={{marginRight : "10px"}}/> <h2 style={{color: "#ffffff", marginTop : "8px"}}> {trans("theme.text")}</h2>
              </StyleThemeSettingsCover>
              <Card style={{ marginBottom: "20px", minHeight : "200px" }}>
                
              <Flex gap={"middle"}>
                  {/* here we need to place the Font Configuration */}
                  <Divider type="vertical" style={{height: "610px"}}/>
                  <PreviewApp style={{marginTop: '3px', height: "620px", width: "100%"}} theme={this.state.theme} dsl={dsl} />
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
                          <Tooltip title={layoutSettingsItem.desc} placement="right">
                            <List.Item key={layoutSettingsItem.settingsKey}>
                              {layoutSettingsItem.type == "radius" && 
                                <ColorPicker
                                  colorKey={layoutSettingsItem.settingsKey}
                                  name={layoutSettingsItem.name}
                                  radius={layoutSettingsItem.value}
                                  configChange={(params) => {
                                    this.configChange(params);
                                  }}
                                />
                              }
                              {layoutSettingsItem.type == "margin" && 
                                <ColorPicker
                                  colorKey={layoutSettingsItem.settingsKey}
                                  name={layoutSettingsItem.name}
                                  margin={layoutSettingsItem.value}
                                  configChange={(params) => {
                                    this.configChange(params);
                                  }}
                                />
                              }
                              {layoutSettingsItem.type == "padding" && 
                                <ColorPicker
                                  colorKey={layoutSettingsItem.settingsKey}
                                  name={layoutSettingsItem.name}
                                  padding={layoutSettingsItem.value}
                                  configChange={(params) => {
                                    this.configChange(params);
                                  }}
                                />
                              }
                              {layoutSettingsItem.type == "gridColumns" && 
                                <ColorPicker
                                  colorKey={layoutSettingsItem.settingsKey}
                                  name={layoutSettingsItem.name}
                                  gridColumns={layoutSettingsItem.value}
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
                  <PreviewApp style={{marginTop: '3px', height: "620px", width: "100%"}} theme={this.state.theme} dsl={dsl} />
                </Flex>

              </Card>  
              
            </ThemeSettingsView>

            <ThemeSettingsView>
              <StyleThemeSettingsCover>
                <ShapesCompIcon width={"36px"} style={{marginRight : "10px"}}/> <h2 style={{color: "#ffffff", marginTop : "8px"}}> {trans("theme.components")}</h2>
              </StyleThemeSettingsCover>
              <Card style={{ marginBottom: "20px", minHeight : "200px" }}>
                
                <Divider />

              </Card>  
              
            </ThemeSettingsView>

            <ThemeSettingsView>
              <StyleThemeSettingsCover>
                <ChartCompIcon width={"36px"} style={{marginRight : "10px"}}/> <h2 style={{color: "#ffffff", marginTop : "8px"}}> {trans("theme.charts")}</h2>
              </StyleThemeSettingsCover>
              <Card style={{ marginBottom: "20px", minHeight : "200px" }}>
                <ChartDesc>
                  {trans("themeDetail.chartDesc")}
                  <a target="_blank" href="https://echarts.apache.org/en/theme-builder.html" rel="noreferrer">
                    {" "}
                    {trans("themeDetail.echartsJson")}
                  </a>
                </ChartDesc>
                <Flex gap={"middle"}>
                  <ChartInput>
                    <div className="code-editor" style={{height: "380px", width:"100%", minWidth:"300px"}}>
                      <CodeEditor
                        value={this.state.theme.chart || ""}
                        onChange={(value) => this.configChange({
                          colorKey: "chart",
                          chart: value.doc.toString() ? value.doc.toString() : undefined,
                        })}
                        styleName="window"
                        codeType="Function"
                        showLineNum
                        bordered
                      />
                    </div>
                  </ChartInput>
                  <Divider type="vertical" style={{height: "370px"}}/>
                  <PreviewApp style={{ height: "380px", width: "100%", margin: "0" }} theme={this.state.theme} dsl={chartDsl} />
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
