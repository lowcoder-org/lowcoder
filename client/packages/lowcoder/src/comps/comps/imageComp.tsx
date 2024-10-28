import styled, { css } from "styled-components";
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
import React, { useEffect, useRef, useState } from "react";
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

import { trans } from "i18n";
import { AutoHeightControl } from "comps/controls/autoHeightControl";
import { BoolControl } from "comps/controls/boolControl";
import { default as AntImage } from "antd/es/image";
import { DEFAULT_IMG_URL } from "util/stringUtils";
import { StringControl } from "../controls/codeControl";
import {viewMode} from "@lowcoder-ee/util/editor";
const SetPropertyViewFn = React.lazy( async () => await import("./setProperty/imageComp"));


const Container = styled.div<{ $style: ImageStyleType | undefined,$animationStyle:AnimationStyleType }>`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  .ant-image,
  img {
    width: 100%;
    height: 100%;
  }

  img {
    object-fit: contain;
    pointer-events: auto;
    ${props=>props.$animationStyle}
  }

  ${(props) => props.$style && getStyle(props.$style)}
`;

const getStyle = (style: ImageStyleType) => {
  return css`
    img {
      border: ${(props) => (style.borderWidth ? style.borderWidth : "1px")} solid ${style.border};
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
    // console.log(width, height);

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
    if (!img?.clientWidth || !img?.clientHeight || props.autoHeight || !width) {
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
              <Container ref={conRef} $style={props.style} $animationStyle={props.animationStyle}>
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
                      preview={props.supportPreview}
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
  autoHeight: withDefault(AutoHeightControl, "fixed"),
  supportPreview: BoolControl,
  restrictPaddingOnRotation:withDefault(StringControl, 'image')
};

let ImageBasicComp = new UICompBuilder(childrenMap, (props) => {
  return <ContainerImg {...props} />;
})
if (viewMode() === "edit") {
  ImageBasicComp.setPropertyViewFn((children) => <SetPropertyViewFn {...children}></SetPropertyViewFn>);
}
const ImageBasicCompBuilder = ImageBasicComp.build();

const ImageBasicCompTmp = class extends ImageBasicCompBuilder {
  override autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }
};

export const ImageComp = withExposingConfigs(ImageBasicCompTmp, [
  new NameConfig("src", trans("image.srcDesc")),
  NameConfigHidden,
]);
