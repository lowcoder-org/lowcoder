import { ContainerStyleType, heightCalculator, widthCalculator } from "comps/controls/styleControlConstants";
import { EditorContext } from "comps/editorState";
import { BackgroundColorContext } from "comps/utils/backgroundColorContext";
import { HintPlaceHolder, ScrollBar } from "lowcoder-design";
import { ReactNode, useContext } from "react";
import styled, { css } from "styled-components";
import { checkIsMobile } from "util/commonUtils";
import { gridItemCompToGridItems, InnerGrid } from "../containerComp/containerView";
import { TriContainerViewProps } from "../triContainerComp/triContainerCompBuilder";

const getStyle = (style: ContainerStyleType) => {
  return css` 
    border-color: ${style.border};
    border-width: ${style.borderWidth};
    border-radius: ${style.radius};
    overflow: hidden;
    padding: ${style.padding};	
    ${style.background && `background-color: ${style.background};`}
    ${style.backgroundImage && `background-image: ${style.backgroundImage};`}
    ${style.backgroundImageRepeat && `background-repeat: ${style.backgroundImageRepeat};`}
    ${style.backgroundImageSize && `background-size: ${style.backgroundImageSize};`}
    ${style.backgroundImagePosition && `background-position: ${style.backgroundImagePosition};`}
    ${style.backgroundImageOrigin && `background-origin: ${style.backgroundImageOrigin};`}
  `;
};

const Wrapper = styled.div<{ $style: ContainerStyleType }>`
  display: flex;
  flex-flow: column;
  height: 100%;
  border: 1px solid #d7d9e0;
  border-radius: 4px;
  ${(props) => props.$style && getStyle(props.$style)}
`;

const HeaderInnerGrid = styled(InnerGrid)<{ 
  $backgroundColor: string
  $headerBackgroundImage: string;
  $headerBackgroundImageRepeat: string;
  $headerBackgroundImageSize: string;
  $headerBackgroundImagePosition: string;
  $headerBackgroundImageOrigin: string;
 }>`
  overflow: visible;
  ${(props) => props.$backgroundColor && `background-color: ${props.$backgroundColor};`}
  border-radius: 0;
  ${(props) => props.$headerBackgroundImage && `background-image: ${props.$headerBackgroundImage};`}
  ${(props) => props.$headerBackgroundImageRepeat && `background-repeat: ${props.$headerBackgroundImageRepeat};`}
  ${(props) => props.$headerBackgroundImageSize && `background-size: ${props.$headerBackgroundImageSize};`}
  ${(props) => props.$headerBackgroundImagePosition && `background-position: ${props.$headerBackgroundImagePosition};`}
  ${(props) => props.$headerBackgroundImageOrigin && `background-origin: ${props.$headerBackgroundImageOrigin};`}
`;

const BodyInnerGrid = styled(InnerGrid)<{
  $showBorder: boolean;
  $backgroundColor: string;
  $borderColor: string;
  $borderWidth: string;
  $backgroundImage: string;
  $backgroundImageRepeat: string;
  $backgroundImageSize: string;
  $backgroundImagePosition: string;
  $backgroundImageOrigin: string;
}>`
  border-top: ${(props) => `${props.$showBorder ? props.$borderWidth : 0} solid ${props.$borderColor}`};
  flex: 1;
  ${(props) => props.$backgroundColor && `background-color: ${props.$backgroundColor};`}
  border-radius: 0;
  ${(props) => props.$backgroundImage && `background-image: ${props.$backgroundImage};`}
  ${(props) => props.$backgroundImageRepeat && `background-repeat: ${props.$backgroundImageRepeat};`}
  ${(props) => props.$backgroundImageSize && `background-size: ${props.$backgroundImageSize};`}
  ${(props) => props.$backgroundImagePosition && `background-position: ${props.$backgroundImagePosition};`}
  ${(props) => props.$backgroundImageOrigin && `background-origin: ${props.$backgroundImageOrigin};`}
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
  ${(props) => props.$footerBackgroundImage && `background-image: ${props.$footerBackgroundImage};`}
  ${(props) => props.$footerBackgroundImageRepeat && `background-repeat: ${props.$footerBackgroundImageRepeat};`}
  ${(props) => props.$footerBackgroundImageSize && `background-size: ${props.$footerBackgroundImageSize};`}
  ${(props) => props.$footerBackgroundImagePosition && `background-position: ${props.$footerBackgroundImagePosition};`}
  ${(props) => props.$footerBackgroundImageOrigin && `background-origin: ${props.$footerBackgroundImageOrigin};`}
`;

export type TriContainerProps = TriContainerViewProps & {
  hintPlaceholder?: ReactNode;
};

export function TriContainer(props: TriContainerProps) {
  const { container } = props;
  const { showHeader, showFooter } = container;
  // When the header and footer are not displayed, the body must be displayed
  const showBody = container.showBody || (!showHeader && !showFooter);
  const scrollbars = container.scrollbars;

  const { items: headerItems, ...otherHeaderProps } = container.header;
  const { items: bodyItems, ...otherBodyProps } = container.body["0"].children.view.getView();
  const { items: footerItems, ...otherFooterProps } = container.footer;
  const {
    style,
    headerStyle,
    bodyStyle,
    footerStyle,
  } = container;

  const editorState = useContext(EditorContext);
  const maxWidth = editorState.getAppSettings().maxWidth;
  const isMobile = checkIsMobile(maxWidth);
  const paddingWidth = isMobile ? 8 : 0;

  return (
    <div style={{padding: style.margin, height: '100%'}}>
    <Wrapper $style={style}>
      {showHeader && (
        <BackgroundColorContext.Provider value={headerStyle.headerBackground}>
          <HeaderInnerGrid
            {...otherHeaderProps}
            items={gridItemCompToGridItems(headerItems)}
            autoHeight={true}
            emptyRows={5}
            minHeight="46px"
            containerPadding={[paddingWidth, 3]}
            showName={{ bottom: showBody || showFooter ? 20 : 0 }}
            $backgroundColor={headerStyle?.headerBackground || 'transparent'}
            $headerBackgroundImage={headerStyle?.headerBackgroundImage}
            $headerBackgroundImageRepeat={headerStyle?.headerBackgroundImageRepeat}
            $headerBackgroundImageSize={headerStyle?.headerBackgroundImageSize}
            $headerBackgroundImagePosition={headerStyle?.headerBackgroundImagePosition}
            $headerBackgroundImageOrigin={headerStyle?.headerBackgroundImageOrigin}
            style={{padding: headerStyle.containerheaderpadding}}

          />
        </BackgroundColorContext.Provider>
      )}
      {showBody && (
        <BackgroundColorContext.Provider value={bodyStyle.background}>
          {scrollbars ? (
            <ScrollBar style={{ height: container.autoHeight ? "auto" : "100%", margin: "0px", padding: "0px" }}>
              <BodyInnerGrid
                $showBorder={showHeader}
                {...otherBodyProps}
                items={gridItemCompToGridItems(bodyItems)}
                autoHeight={container.autoHeight}
                emptyRows={14}
                minHeight={showHeader ? "143px" : "142px"}
                containerPadding={
                  (showHeader && showFooter) || showHeader ? [paddingWidth, 11.5] : [paddingWidth, 11]
                }
                hintPlaceholder={props.hintPlaceholder ?? HintPlaceHolder}
                $backgroundColor={bodyStyle?.background || 'transparent'}
                $borderColor={style?.border}
                $borderWidth={style?.borderWidth}
                $backgroundImage={bodyStyle?.backgroundImage}
                $backgroundImageRepeat={bodyStyle?.backgroundImageRepeat}
                $backgroundImageSize={bodyStyle?.backgroundImageSize}
                $backgroundImagePosition={bodyStyle?.backgroundImagePosition}
                $backgroundImageOrigin={bodyStyle?.backgroundImageOrigin}
                style={{padding: bodyStyle.containerbodypadding}}
              />
            </ScrollBar>
            ) : (
            <BodyInnerGrid
              $showBorder={showHeader}
              {...otherBodyProps}
              items={gridItemCompToGridItems(bodyItems)}
              autoHeight={container.autoHeight}
              emptyRows={14}
              minHeight={showHeader ? "143px" : "142px"}
              containerPadding={
                (showHeader && showFooter) || showHeader ? [paddingWidth, 11.5] : [paddingWidth, 11]
              }
              hintPlaceholder={props.hintPlaceholder ?? HintPlaceHolder}
              $backgroundColor={bodyStyle?.background || 'transparent'}
              $borderColor={style?.border}
              $borderWidth={style?.borderWidth}
              $backgroundImage={bodyStyle?.backgroundImage}
              $backgroundImageRepeat={bodyStyle?.backgroundImageRepeat}
              $backgroundImageSize={bodyStyle?.backgroundImageSize}
              $backgroundImagePosition={bodyStyle?.backgroundImagePosition}
              $backgroundImageOrigin={bodyStyle?.backgroundImageOrigin}
              style={{padding: bodyStyle.containerbodypadding}}/>
          )}
        </BackgroundColorContext.Provider>
      )}
      {showFooter && (
        <BackgroundColorContext.Provider value={footerStyle.footerBackground}>
          <FooterInnerGrid
            $showBorder={showHeader || showBody}
            {...otherFooterProps}
            items={gridItemCompToGridItems(footerItems)}
            autoHeight={true}
            emptyRows={5}
            minHeight={showBody ? "47px" : "46px"}
            containerPadding={showBody || showHeader ? [paddingWidth, 3.5] : [paddingWidth, 3]}
            showName={{ top: showHeader || showBody ? 20 : 0 }}
            $backgroundColor={footerStyle?.footerBackground || 'transparent'}
            $footerBackgroundImage={footerStyle?.footerBackgroundImage}
            $footerBackgroundImageRepeat={footerStyle?.footerBackgroundImageRepeat}
            $footerBackgroundImageSize={footerStyle?.footerBackgroundImageSize}
            $footerBackgroundImagePosition={footerStyle?.footerBackgroundImagePosition}
            $footerBackgroundImageOrigin={footerStyle?.footerBackgroundImageOrigin}
            $borderColor={style?.border}
            $borderWidth={style?.borderWidth}
            style={{padding: footerStyle.containerfooterpadding}}
          />
        </BackgroundColorContext.Provider>
      )}
    </Wrapper>
    </div>
  );
}
