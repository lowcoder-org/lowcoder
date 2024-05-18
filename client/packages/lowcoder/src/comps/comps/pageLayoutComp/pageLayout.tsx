import { AnimationStyleType, ContainerStyleType, heightCalculator, widthCalculator } from "comps/controls/styleControlConstants";
import { EditorContext } from "comps/editorState";
import { BackgroundColorContext } from "comps/utils/backgroundColorContext";
import { HintPlaceHolder, ScrollBar } from "lowcoder-design";
import { ReactNode, useContext, useEffect } from "react";
import styled, { css } from "styled-components";
import { checkIsMobile } from "util/commonUtils";
import { gridItemCompToGridItems, InnerGrid } from "../containerComp/containerView";
import { LayoutViewProps } from "./pageLayoutCompBuilder";
import { ConfigProvider, Layout } from 'antd';
import { contrastBackground, contrastText } from "comps/controls/styleControlConstants";
import { useRef, useState } from "react";
import { LowcoderAppView } from "appView/LowcoderAppView";

const { Header, Content, Footer, Sider } = Layout;

const AppViewContainer = styled.div`
  width: 100%;
  top: 0;
  max-width: inherit;
  overflow: auto;
  height: 100%;
`;

const getStyle = (style: ContainerStyleType) => {
  return css`
    border-color: ${style.border};
    border-width: ${style.borderWidth};
    border-radius: ${style.radius};
    overflow: hidden;
    padding: ${style.padding};
    ${style.background && `background-color: ${style.background};`}
    ${style.backgroundImage && `background-image: url(${style.backgroundImage});`}
    ${style.backgroundImageRepeat && `background-repeat: ${style.backgroundImageRepeat};`}
    ${style.backgroundImageSize && `background-size: ${style.backgroundImageSize};`}
    ${style.backgroundImagePosition && `background-position: ${style.backgroundImagePosition};`}
    ${style.backgroundImageOrigin && `background-origin: ${style.backgroundImageOrigin};`}
  `;
};

const Wrapper = styled.div<{ $style: ContainerStyleType,$animationStyle:AnimationStyleType }>`
  display: flex;
  flex-flow: column;
  height: 100%;
  border: 1px solid #d7d9e0;
  border-radius: 4px;
  ${(props) => props.$style && getStyle(props.$style)}
  ${props=>props.$animationStyle}
`;

const HeaderInnerGrid = styled(InnerGrid)<{
  $backgroundColor: string
 }>`
  overflow: visible;
  ${(props) => props.$backgroundColor && `background-color: ${props.$backgroundColor};`}
  border-radius: 0;
`;

const SiderInnerGrid = styled(InnerGrid)<{
  $backgroundColor: string
  $siderBackgroundImage: string;
  $siderBackgroundImageRepeat: string;
  $siderBackgroundImageSize: string;
  $siderBackgroundImagePosition: string;
  $siderBackgroundImageOrigin: string;
 }>`
  overflow: auto;
  ${(props) => props.$backgroundColor && `background-color: ${props.$backgroundColor};`}
  border-radius: 0;
  ${(props) => props.$siderBackgroundImage && `background-image: url(${props.$siderBackgroundImage});`}
  ${(props) => props.$siderBackgroundImageRepeat && `background-repeat: ${props.$siderBackgroundImageRepeat};`}
  ${(props) => props.$siderBackgroundImageSize && `background-size: ${props.$siderBackgroundImageSize};`}
  ${(props) => props.$siderBackgroundImagePosition && `background-position: ${props.$siderBackgroundImagePosition};`}
  ${(props) => props.$siderBackgroundImageOrigin && `background-origin: ${props.$siderBackgroundImageOrigin};`}
`;

const BodyInnerGrid = styled(InnerGrid)<{
  $showBorder: boolean;
  $backgroundColor: string;
  $borderColor: string;
  $borderWidth: string;
}>`
  border-top: ${(props) => `${props.$showBorder ? props.$borderWidth : 0} solid ${props.$borderColor}`};
  flex: 1;
  ${(props) => props.$backgroundColor && `background-color: ${props.$backgroundColor};`}
  border-radius: 0;
`;

const FooterInnerGrid = styled(InnerGrid)<{
  $showBorder: boolean;
  $backgroundColor: string;
  $borderColor: string;
  $borderWidth: string;
  $footerBackgroundImage: string;
  $footerBackgroundImageRepeat: string;
  $footerBackgroundImageSize: string;
  $footerBackgroundImagePosition: string;
  $footerBackgroundImageOrigin: string;
}>`
  border-top: ${(props) => `${props.$showBorder ? props.$borderWidth : 0} solid ${props.$borderColor}`};
  overflow: visible;
  ${(props) => props.$backgroundColor && `background-color: ${props.$backgroundColor};`}
  border-radius: 0;
  ${(props) => props.$footerBackgroundImage && `background-image: url(${props.$footerBackgroundImage});`}
  ${(props) => props.$footerBackgroundImageRepeat && `background-repeat: ${props.$footerBackgroundImageRepeat};`}
  ${(props) => props.$footerBackgroundImageSize && `background-size: ${props.$footerBackgroundImageSize};`}
  ${(props) => props.$footerBackgroundImagePosition && `background-position: ${props.$footerBackgroundImagePosition};`}
  ${(props) => props.$footerBackgroundImageOrigin && `background-origin: ${props.$footerBackgroundImageOrigin};`}
`;

export type LayoutProps = LayoutViewProps & {
  hintPlaceholder?: ReactNode;
  animationStyle:AnimationStyleType;
};


export function PageLayout(props: LayoutProps & { siderCollapsed: boolean; setSiderCollapsed: (collapsed: boolean) => void }) {
  const {container, siderCollapsed, setSiderCollapsed, animationStyle} = props;
  const { showHeader, showFooter, showSider } = container;
  const { items: headerItems, ...otherHeaderProps } = container.header;
  const { items: bodyItems, ...otherBodyProps } = container.body["0"].children.view.getView();
  const { items: footerItems, ...otherFooterProps } = container.footer;
  const { items: siderItems, ...otherSiderProps } = container.sider;
  const {
    style,
    headerStyle,
    siderStyle,
    bodyStyle,
    footerStyle,
  } = container; 

  const editorState = useContext(EditorContext);
  const maxWidth = editorState.getAppSettings().maxWidth;
  const isMobile = checkIsMobile(maxWidth);
  const appRef = useRef();

  function onSiderCollapse (collapsed : boolean) {
    props.setSiderCollapsed(collapsed);
    // how to set the collapsed state in the container when the user manually collapses the sider?
  }

  useEffect(() => {setSiderCollapsed(container.siderCollapsed)} , [container.siderCollapsed]);
  
  return (
    <div style={{padding: style.margin, height: '100%'}}>
      <ConfigProvider
          theme={{
            components: {
              Layout: {
                triggerBg : contrastBackground(container.siderStyle.siderBackground),
                triggerColor : contrastText(container.siderStyle.siderBackground, "black", "white"),
                siderBg : container.siderStyle.siderBackground,
              },
            },
          }}
        >
      <Wrapper $style={style} $animationStyle={animationStyle}>
        <Layout style={{padding: "0px"}} hasSider={showSider && !container.innerSider}>
          {showSider && !container.innerSider && !container.siderRight && (
            <><BackgroundColorContext.Provider value={siderStyle?.siderBackground}>
              <Sider 
                width={container.siderWidth}
                style={{ padding: "0px", margin: '0px', backgroundColor: siderStyle?.siderBackground || 'transparent' }} 
                collapsible={container.siderCollapsible} 
                breakpoint="sm"
                collapsedWidth={container.siderCollapsedWidth}
                collapsed={siderCollapsed} onCollapse={(value) => onSiderCollapse(value)}
                >
                  <ScrollBar style={{ height: container.autoHeight ? "auto" : "100%", margin: "0px", padding: "0px" }} hideScrollbar={!container.siderScrollbars}>
                    <SiderInnerGrid
                      {...otherSiderProps}
                      items={gridItemCompToGridItems(siderItems)}
                      autoHeight={true}
                      emptyRows={30}
                      minHeight={`calc(100vh - ${style.padding}px)`}
                      containerPadding={[0, 0]}
                      showName={{ bottom: showFooter ? 20 : 0 }}
                      $backgroundColor={siderStyle?.siderBackground || 'transparent'}
                      $siderBackgroundImage={siderStyle?.siderBackgroundImage}
                      $siderBackgroundImageRepeat={siderStyle?.siderBackgroundImageRepeat}
                      $siderBackgroundImageSize={siderStyle?.siderBackgroundImageSize}
                      $siderBackgroundImagePosition={siderStyle?.siderBackgroundImagePosition}
                      $siderBackgroundImageOrigin={siderStyle?.siderBackgroundImageOrigin}
                      style={{ padding: siderStyle.containerSiderPadding }} />
                    </ScrollBar>
                  </Sider>
                </BackgroundColorContext.Provider>
              </>
            )}
              <Layout style={{ padding: "0px" }}>
                {showHeader && (
                  <>
                    <BackgroundColorContext.Provider value={style.background}>
                      <Header style={{ backgroundColor: headerStyle?.headerBackground || 'transparent', padding: '0px', margin: '0px' }}>
                        <HeaderInnerGrid
                          {...otherHeaderProps}
                          items={gridItemCompToGridItems(headerItems)}
                          autoHeight={true}
                          emptyRows={5}
                          minHeight="46px"
                          containerPadding={[0, 0]}
                          showName={{ bottom: showFooter ? 20 : 0 }}
                          $backgroundColor={headerStyle?.headerBackground || 'transparent'}
                          style={{ padding: headerStyle.containerHeaderPadding }} />
                      </Header>
                    </BackgroundColorContext.Provider>
                  </>
                )}
                  {showSider && container.innerSider ? (
                  <><Layout style={{ padding: '0px' }} hasSider={showSider && container.innerSider}>
                    {showSider && !container.siderRight && (
                      <BackgroundColorContext.Provider value={siderStyle?.siderBackground}>
                        <Sider 
                          width={container.siderWidth} 
                          style={{ padding: "0px", margin: '0px', marginTop: style.borderWidth, backgroundColor: siderStyle?.siderBackground || 'transparent' }} 
                          collapsible={container.siderCollapsible} 
                          breakpoint="sm"
                          collapsedWidth={container.siderCollapsedWidth}
                          collapsed={siderCollapsed} onCollapse={(value) => setSiderCollapsed(value)}
                        >
                          <ScrollBar style={{ height: container.autoHeight ? "auto" : "100%", margin: "0px", padding: "0px" }} hideScrollbar={!container.siderScrollbars}>
                            <SiderInnerGrid
                              {...otherSiderProps}
                              items={gridItemCompToGridItems(siderItems)}
                              autoHeight={true}
                              emptyRows={30}
                              minHeight={`calc(100vh - ${style.padding}px)`}
                              containerPadding={[0, 0]}
                              showName={{ bottom: showFooter ? 20 : 0 }}
                              $backgroundColor={siderStyle?.siderBackground || 'transparent'}
                              $siderBackgroundImage={siderStyle?.siderBackgroundImage}
                              $siderBackgroundImageRepeat={siderStyle?.siderBackgroundImageRepeat}
                              $siderBackgroundImageSize={siderStyle?.siderBackgroundImageSize}
                              $siderBackgroundImagePosition={siderStyle?.siderBackgroundImagePosition}
                              $siderBackgroundImageOrigin={siderStyle?.siderBackgroundImageOrigin}
                              style={{ padding: siderStyle.containerSiderPadding }} />
                          </ScrollBar>
                        </Sider>
                        </BackgroundColorContext.Provider>
                      )}
                      <Content style={{ padding: '0px', margin: '0px', backgroundColor: bodyStyle?.background || 'transparent' }}>
                        <ScrollBar style={{ height: container.autoHeight ? "auto" : "100%", margin: "0px", padding: "0px" }} hideScrollbar={!container.contentScrollbars}>
                          {container.showApp && container.contentApp != "" ? (
                            <BackgroundColorContext.Provider value={bodyStyle?.background}>
                              <AppViewContainer>
                                <LowcoderAppView
                                  ref={appRef}
                                  appId={container.contentApp}
                                  baseUrl={container.baseUrl}
                                />
                              </AppViewContainer>
                            </BackgroundColorContext.Provider>
                          ) : (
                            <BodyInnerGrid
                              $showBorder={showHeader}
                              {...otherBodyProps}
                              items={gridItemCompToGridItems(bodyItems)}
                              autoHeight={container.autoHeight}
                              emptyRows={14}
                              minHeight={showHeader ? "143px" : "142px"}
                              containerPadding={[0, 0]}
                              hintPlaceholder={props.hintPlaceholder ?? HintPlaceHolder}
                              $backgroundColor={bodyStyle?.background || 'transparent'}
                              $borderColor={style?.border}
                              $borderWidth={style?.borderWidth}
                              style={{ padding: bodyStyle.containerBodyPadding }} />
                          )}
                        </ScrollBar>
                      </Content>
                      {showSider && container.siderRight && (
                        <BackgroundColorContext.Provider value={siderStyle?.siderBackground}>
                          <Sider 
                            width={container.siderWidth}
                            style={{ padding: "0px", margin: '0px', backgroundColor: siderStyle?.siderBackground || 'transparent' }} 
                            collapsible={container.siderCollapsible}
                            breakpoint="sm"
                            collapsedWidth={container.siderCollapsedWidth}
                            reverseArrow={true}
                            collapsed={siderCollapsed} onCollapse={(value) => setSiderCollapsed(value)}
                          >
                            <ScrollBar style={{ height: container.autoHeight ? "auto" : "100%", margin: "0px", padding: "0px" }} hideScrollbar={!container.siderScrollbars}>
                              <SiderInnerGrid
                                {...otherSiderProps}
                                items={gridItemCompToGridItems(siderItems)}
                                autoHeight={true}
                                emptyRows={30}
                                minHeight={`calc(100vh - ${style.padding}px)`}
                                containerPadding={[0, 0]}
                                showName={{ bottom: showFooter ? 20 : 0 }}
                                $backgroundColor={siderStyle?.siderBackground || 'transparent'}
                                $siderBackgroundImage={siderStyle?.siderBackgroundImage}
                                $siderBackgroundImageRepeat={siderStyle?.siderBackgroundImageRepeat}
                                $siderBackgroundImageSize={siderStyle?.siderBackgroundImageSize}
                                $siderBackgroundImagePosition={siderStyle?.siderBackgroundImagePosition}
                                $siderBackgroundImageOrigin={siderStyle?.siderBackgroundImageOrigin}
                                style={{ padding: siderStyle.containerSiderPadding }} />
                            </ScrollBar>
                          </Sider>
                        </BackgroundColorContext.Provider>
                      )}
                    </Layout></>
                  ) : (
                    <Content style={{ padding: '0px', margin: '0px' }}>
                      <ScrollBar style={{ height: container.autoHeight ? "auto" : "100%", margin: "0px", padding: "0px" }} hideScrollbar={!container.contentScrollbars}>
                        {container.showApp && container.contentApp != "" ? (
                          <BackgroundColorContext.Provider value={bodyStyle?.background}>
                            <AppViewContainer>
                              <LowcoderAppView
                                ref={appRef}
                                appId={container.contentApp}
                                baseUrl={container.baseUrl}
                              />
                            </AppViewContainer>
                          </BackgroundColorContext.Provider>
                        ) : (
                          <BodyInnerGrid
                          $showBorder={showHeader}
                          {...otherBodyProps}
                          items={gridItemCompToGridItems(bodyItems)}
                          autoHeight={container.autoHeight}
                          emptyRows={14}
                          minHeight={showHeader ? "143px" : "142px"}
                          containerPadding={[0, 0]}
                          hintPlaceholder={props.hintPlaceholder ?? HintPlaceHolder}
                          $backgroundColor={bodyStyle?.background || 'transparent'}
                          $borderColor={style?.border}
                          $borderWidth={style?.borderWidth}
                          style={{ padding: bodyStyle.containerBodyPadding }} />
                        )}
                      </ScrollBar>
                    </Content>
                  )}
                  {showFooter && (
                    <Footer style={{ textAlign: 'center', padding: '0px', margin: '0px', backgroundColor: footerStyle?.footerBackground || 'transparent' }}>
                      <FooterInnerGrid
                        $showBorder={showHeader}
                        {...otherFooterProps}
                        items={gridItemCompToGridItems(footerItems)}
                        autoHeight={true}
                        emptyRows={5}
                        minHeight={"48px"}
                        containerPadding={[0, 0]}
                        showName={{ top: showHeader ? 20 : 0 }}
                        $backgroundColor={footerStyle?.footerBackground || 'transparent'}
                        $footerBackgroundImage={footerStyle?.footerBackgroundImage}
                        $footerBackgroundImageRepeat={footerStyle?.footerBackgroundImageRepeat}
                        $footerBackgroundImageSize={footerStyle?.footerBackgroundImageSize}
                        $footerBackgroundImagePosition={footerStyle?.footerBackgroundImagePosition}
                        $footerBackgroundImageOrigin={footerStyle?.footerBackgroundImageOrigin}
                        $borderColor={style?.border}
                        $borderWidth={style?.borderWidth}
                        style={{ padding: footerStyle.containerFooterPadding }} />
                    </Footer>
                  )}
                </Layout>
            {showSider && !container.innerSider && container.siderRight && (
              <>
                <BackgroundColorContext.Provider value={siderStyle?.siderBackground}>
                <Sider 
                  width={container.siderWidth}
                  style={{ padding: "0px", margin: '0px', backgroundColor: siderStyle?.siderBackground || 'transparent'}} 
                  collapsible={container.siderCollapsible}
                  breakpoint="sm"
                  collapsedWidth={container.siderCollapsedWidth}
                  reverseArrow={true}
                  collapsed={siderCollapsed} onCollapse={(value) => setSiderCollapsed(value)}
                   >
                    <ScrollBar style={{ height: container.autoHeight ? "auto" : "100%", margin: "0px", padding: "0px" }} hideScrollbar={!container.siderScrollbars}>
                      <SiderInnerGrid
                        {...otherSiderProps}
                        items={gridItemCompToGridItems(siderItems)}
                        autoHeight={true}
                        emptyRows={30}
                        minHeight={`calc(100vh - ${style.padding}px)`}
                        containerPadding={[0, 0]}
                        showName={{ bottom: showFooter ? 20 : 0 }}
                        $backgroundColor={siderStyle?.siderBackground || 'transparent'}
                        $siderBackgroundImage={siderStyle?.siderBackgroundImage}
                        $siderBackgroundImageRepeat={siderStyle?.siderBackgroundImageRepeat}
                        $siderBackgroundImageSize={siderStyle?.siderBackgroundImageSize}
                        $siderBackgroundImagePosition={siderStyle?.siderBackgroundImagePosition}
                        $siderBackgroundImageOrigin={siderStyle?.siderBackgroundImageOrigin}
                        style={{ padding: siderStyle.containerSiderPadding }} />
                    </ScrollBar>
                  </Sider>
                </BackgroundColorContext.Provider>
              </>
            )}
          </Layout>
          <style>
            {`
              .ant-layout-sider-trigger {
                bottom: 4px !important;
                ${container.siderRight ? `
                  right: 8px !important;
                ` : `
                  left: 8px !important;}
                `}
                
              }
            `}
          </style>
        </Wrapper>
      </ConfigProvider>
    </div>
  );
}
