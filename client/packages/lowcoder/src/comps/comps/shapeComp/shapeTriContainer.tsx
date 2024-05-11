import { ContainerStyleType, widthCalculator } from "comps/controls/styleControlConstants";
import { EditorContext } from "comps/editorState";
import { BackgroundColorContext } from "comps/utils/backgroundColorContext";
import { HintPlaceHolder, ScrollBar } from "lowcoder-design";
import { ReactNode, useContext, useEffect, useState } from "react";
import styled, { css } from "styled-components";
import { checkIsMobile } from "util/commonUtils";
import {
  gridItemCompToGridItems,
  InnerGrid,
} from "../containerComp/containerView";
import { TriContainerViewProps } from "../triContainerComp/triContainerCompBuilder";
import { Coolshape } from "coolshapes-react";

const getStyle = (style: ContainerStyleType) => {
  return css`
    border-color: ${style.border};
    border-width: ${style.borderWidth};
    border-radius: ${style.radius};
    overflow: hidden;
    padding: ${style.padding};
    ${style.background && `background-color: ${style.background};`}
    ${style.backgroundImage && `background-image: ${style.backgroundImage};`}
    ${style.backgroundImageRepeat &&
    `background-repeat: ${style.backgroundImageRepeat};`}
    ${style.backgroundImageSize &&
    `background-size: ${style.backgroundImageSize};`}
    ${style.backgroundImagePosition &&
    `background-position: ${style.backgroundImagePosition};`}
    ${style.backgroundImageOrigin &&
    `background-origin: ${style.backgroundImageOrigin};`}
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

const StylesShape = styled(Coolshape)<{ $style: ContainerStyleType }>`;
  ${(props) => props.$style && getStyle(props.$style)}
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
  border-top: ${(props) =>
    `${props.$showBorder ? props.$borderWidth : 0} solid ${props.$borderColor}`};
  flex: 1;
  ${(props) =>
    props.$backgroundColor && `background-color: ${props.$backgroundColor};`}
  border-radius: 0;
  ${(props) =>
    props.$backgroundImage && `background-image: ${props.$backgroundImage};`}
  ${(props) =>
    props.$backgroundImageRepeat &&
    `background-repeat: ${props.$backgroundImageRepeat};`}
  ${(props) =>
    props.$backgroundImageSize &&
    `background-size: ${props.$backgroundImageSize};`}
  ${(props) =>
    props.$backgroundImagePosition &&
    `background-position: ${props.$backgroundImagePosition};`}
  ${(props) =>
    props.$backgroundImageOrigin &&
    `background-origin: ${props.$backgroundImageOrigin};`}
`;

export type TriContainerProps = TriContainerViewProps & {
  hintPlaceholder?: ReactNode;
  icon: any;
};

export function ShapeTriContainer(props: TriContainerProps) {
  const { container, icon } = props;
  // const { showHeader, showFooter } = container;
  // When the header and footer are not displayed, the body must be displayed
  const showBody = true;
  const scrollbars = container.scrollbars;

  const { items: bodyItems, ...otherBodyProps } =
  container.body["0"].children.view.getView();
  const { style, headerStyle, bodyStyle, footerStyle } = container;

  const editorState = useContext(EditorContext);
  const maxWidth = editorState.getAppSettings().maxWidth;
  const isMobile = checkIsMobile(maxWidth);
  const paddingWidth = isMobile ? 8 : 0;

  let [shape, setShape] = useState({ value: "star", index: 0 });
  useEffect(() => {
    if (icon.props?.value) {
      let shapeDetails = icon.props?.value;
      setShape({
        index: parseInt(shapeDetails?.split("_")[0]),
        value: shapeDetails?.split("_")[1],
      });
    }
  }, [icon.props]);

  return (
    <div style={{ padding: style.margin, height: "100%" }}>
      <Wrapper $style={style}>
        <BackgroundColorContext.Provider value={bodyStyle.background}>
          <ScrollBar
            style={{
              height: container.autoHeight ? "auto" : "100%",
              margin: "0px",
              padding: "0px",
            }}
            hideScrollbar={!scrollbars}
          >
            <div style={{ position: "relative", height: "100%" }}>
              <StylesShape 
                $style={style}
                type={shape?.value as any}
                noise={false}
                index={shape.index}
                styles={{
                  position: "absolute",
                  top: "0",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: widthCalculator(style.margin),
                  height: "100%",
                }}
              />
              <BodyInnerGrid
                $showBorder={false}
                {...otherBodyProps}
                items={gridItemCompToGridItems(bodyItems)}
                autoHeight={container.autoHeight}
                emptyRows={14}
                minHeight={"142px"}
                hintPlaceholder={props.hintPlaceholder ?? HintPlaceHolder}
                $backgroundColor={bodyStyle?.background || "transparent"}
                $borderColor={style?.border}
                $borderWidth={style?.borderWidth}
                $backgroundImage={bodyStyle?.backgroundImage}
                $backgroundImageRepeat={bodyStyle?.backgroundImageRepeat}
                $backgroundImageSize={bodyStyle?.backgroundImageSize}
                $backgroundImagePosition={bodyStyle?.backgroundImagePosition}
                $backgroundImageOrigin={bodyStyle?.backgroundImageOrigin}
                style={{
                  zIndex: 999,
                }}
              />
            </div>
          </ScrollBar>
        </BackgroundColorContext.Provider>
      </Wrapper>
    </div>
  );
}
