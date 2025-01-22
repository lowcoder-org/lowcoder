import styled, { css } from "styled-components";
import { Section, sectionNames } from "lowcoder-design";
import {
  clickEvent,
  eventHandlerControl,
} from "../controls/eventHandlerControl";
import { StringStateControl } from "../controls/codeStateControl";
import { UICompBuilder, withDefault } from "../generators";
import {
  NameConfig,
  NameConfigHidden,
  withExposingConfigs,
} from "../generators/withExposing";
import { RecordConstructorToView } from "lowcoder-core";
import { useEffect, useRef, useState } from "react";
import _ from "lodash";
import ReactResizeDetector from "react-resize-detector";
import { styleControl } from "comps/controls/styleControl";
import {
  AnimationStyle,
  AnimationStyleType,
  ImageStyle,
  ImageStyleType,
  heightCalculator,
  widthCalculator,
} from "comps/controls/styleControlConstants";
import { hiddenPropertyView, showDataLoadingIndicatorsPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { AutoHeightControl } from "comps/controls/autoHeightControl";
import { BoolControl } from "comps/controls/boolControl";
import { default as AntImage } from "antd/es/image";
import { DEFAULT_IMG_URL } from "util/stringUtils";

import { useContext } from "react";
import { EditorContext } from "comps/editorState";
import { StringControl } from "../controls/codeControl";
import { PositionControl } from "comps/controls/dropdownControl";

const Container = styled.div<{ 
  $style: ImageStyleType | undefined, 
  $animationStyle: AnimationStyleType,
  $clipPath: string,
  $enableOverflow: boolean,
  $overflow: string,
  $positionX: string,
  $positionY: string,
  $aspectRatio: string | undefined,
  $placement: string // New property to control image placement
}>`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: ${(props) =>
    props.$placement.includes("bottom")
      ? "flex-end"
      : props.$placement.includes("top")
      ? "flex-start"
      : "center"};
  justify-content: ${(props) =>
    props.$placement.includes("right")
      ? "flex-end"
      : props.$placement.includes("left")
      ? "flex-start"
      : "center"};
  overflow: ${(props) => (props.$enableOverflow ? props.$overflow : "hidden")};

  .ant-image,
  img {
    ${(props) =>
      props.$enableOverflow
        ? `
        aspect-ratio: ${props.$aspectRatio};
        width: 100%;
        height: 100%;
        object-fit: cover;
      `
        : `
        width: auto;
        height: auto;
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      `}
    
    object-position: ${(props) => `${props.$positionX} ${props.$positionY}`};
    ${props => props.$clipPath && `clip-path: ${props.$clipPath};`};
    ${props => props.$style?.opacity !== undefined && `opacity: ${props.$style?.opacity};`};
    ${props => props.$animationStyle};
  }

  ${(props) => props.$style && getStyle(props.$style)}
`;

const getStyle = (style: ImageStyleType) => {
  return css`
    img {
      border: ${(props) => (style.borderWidth ? style.borderWidth : "1px")} solid ${style.border};
      box-shadow: ${props=>`${style?.boxShadow} ${style?.boxShadowColor}`};
      border-radius: ${style.radius};
      margin: ${style.margin};
      padding: ${style.padding};
      max-width: ${widthCalculator(style.margin)};
      max-height: ${heightCalculator(style.margin)};
      rotate: ${style.rotation};
    }

    .ant-image-mask {
      border-radius: ${style.radius};
    }
  `;
};

const EventOptions = [clickEvent] as const;

const ContainerImg = (props: RecordConstructorToView<typeof childrenMap>) => {
  const imgRef = useRef<HTMLDivElement>(null);
  const conRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const imgOnload = (img: HTMLImageElement) => {
    img.onload = function () {
      setWidth(img.naturalWidth);
      setHeight(img.naturalHeight);
    };
  };

  useEffect(() => {
    const newImage = new Image(0, 0);
    newImage.src = props.src.value;
    imgOnload(newImage);
    newImage.onerror = function (e) {
      newImage.src = DEFAULT_IMG_URL;
      imgOnload(newImage);
    };
  }, [props.src.value]);

  useEffect(() => {
    if (height && width) {
      onResize();
    }
  }, [height, width]);

  // on safari
  const setStyle = (height: string, width: string) => {
    const img = imgRef.current;
    const imgDiv = img?.getElementsByTagName("div")[0];
    const imgCurrent = img?.getElementsByTagName("img")[0];
    img!.style.height = height;
    img!.style.width = width;
    imgDiv!.style.height = height;
    imgDiv!.style.width = width;
    imgCurrent!.style.height = height;
    imgCurrent!.style.width = width;
  };

  const onResize = () => {
    const img = imgRef.current;
    const container = conRef.current;
    if (!props.enableOverflow && (!img?.clientWidth || !img?.clientHeight || props.autoHeight || !width)) {
      return;
    }
    // fixme border style bug on safari
    if (
      (_.divide(container?.clientWidth!, container?.clientHeight!) || 0) >
      (_.divide(Number(width), Number(height)) || 0)
    ) {
      setStyle("100%", "auto");
    } else {
      setStyle("auto", "100%");
    }
  };

  return (
    <ReactResizeDetector
      onResize={onResize}
      render={() => (
        <Container 
          ref={conRef}
          $style={props.style}
          $animationStyle={props.animationStyle}
          $clipPath={props.clipPath}
          $overflow={props.enableOverflow ? props.overflow : "hidden"}
          $positionX={props.positionX}
          $positionY={props.positionY}
          $enableOverflow={props.enableOverflow}
          $aspectRatio={props.aspectRatio || "16 / 9"}
          $placement={props.placement}
        >
          <div
            ref={imgRef}
            style={
              props.autoHeight ? { width: "100%", height: "100%" } : undefined
            }
          >
            <AntImage
              src={props.src.value}
              referrerPolicy="same-origin"
              draggable={false}
              preview={props.supportPreview ? {src: props.previewSrc || props.src.value } : false}
              fallback={DEFAULT_IMG_URL}
              onClick={() => props.onEvent("click")}
            />
          </div>
        </Container>
      )}
    >
    </ReactResizeDetector>
  );
};

const childrenMap = {
  src: withDefault(StringStateControl, "https://temp.im/350x400"),
  onEvent: eventHandlerControl(EventOptions),
  style: styleControl(ImageStyle , 'style'),
  animationStyle: styleControl(AnimationStyle , 'animationStyle'),
  clipPath: withDefault(StringControl, "none"),
  autoHeight: withDefault(AutoHeightControl, "fixed"),
  supportPreview: BoolControl,
  previewSrc: StringControl,
  restrictPaddingOnRotation:withDefault(StringControl, 'image'),
  enableOverflow: withDefault(BoolControl, false),
  aspectRatio: withDefault(StringControl, "16 / 9"),
  placement: withDefault(PositionControl, "top"),
  overflow: withDefault(StringControl, "hidden"),
  positionX: withDefault(StringControl, "center"),
  positionY: withDefault(StringControl, "center"),
};

let ImageBasicComp = new UICompBuilder(childrenMap, (props) => {
  return <ContainerImg {...props} />;
})
  .setPropertyViewFn((children) => {
    return (
      <>
        <Section name={sectionNames.basic}>
          {children.src.propertyView({
            label: trans("image.src"),
          })}
        </Section>

        {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <Section name={sectionNames.interaction}>
            {children.onEvent.getPropertyView()}
            {hiddenPropertyView(children)}
            {showDataLoadingIndicatorsPropertyView(children)}
            {children.supportPreview.propertyView({
              label: trans("image.supportPreview"),
              tooltip: trans("image.supportPreviewTip"),
            })}
            {children.supportPreview.getView() && children.previewSrc.propertyView({
               label: trans("image.previewSrc")
            })}
          </Section>
        )}

        {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <>
            <Section name={sectionNames.layout}>

              {children.autoHeight.getPropertyView()}

              {children.autoHeight.getView() == false && (
                children.placement.propertyView({
                  label: trans("image.placement"),
                  radioButton: true
              }))}
  
              {children.autoHeight.getView() == false  && (
                children.enableOverflow.propertyView({
                  label: trans("image.enableOverflow"),
                  tooltip: trans("image.enableOverflowTip")
              }))}
  
              {children.autoHeight.getView() == false && children.enableOverflow.getView() == true && (
                children.overflow.propertyView({
                  label: trans("image.overflow"),
                  tooltip: trans("image.overflowTip")
              }))}

              {children.autoHeight.getView() == false && children.enableOverflow.getView() == true && (
                children.positionX.propertyView({
                  label: trans("image.positionX"),
                  tooltip: trans("image.positionXTip")
              }))}

              {children.autoHeight.getView() == false && children.enableOverflow.getView() == true && (
                children.positionY.propertyView({
                  label: trans("image.positionY"),
                  tooltip: trans("image.positionYTip")
              }))}

              {children.autoHeight.getView() == false && children.enableOverflow.getView() == true && (
                  children.aspectRatio.propertyView({
                    label: trans("image.aspectRatio"),
                    tooltip: trans("image.aspectRatioTip")
              }))}
            </Section>

            <Section name={sectionNames.style}>
              {children.style.getPropertyView()}
              {children.clipPath.propertyView({
                label: trans("image.clipPath"),
                tooltip: trans("image.clipPathTip")
              })}
            </Section>
            <Section name={sectionNames.animationStyle} hasTooltip={true}>
              {children.animationStyle.getPropertyView()}
            </Section>
          </>
        )}
      </>
    );
  })
  .build();

ImageBasicComp = class extends ImageBasicComp {
  override autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }
};

export const ImageComp = withExposingConfigs(ImageBasicComp, [
  new NameConfig("src", trans("image.srcDesc")),
  NameConfigHidden,
]);
