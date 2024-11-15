import { default as Carousel } from "antd/es/carousel";
import { BoolControl } from "../controls/boolControl";
import { UICompBuilder, withDefault } from "../generators";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "../generators/withExposing";
import styled from "styled-components";
import { trans } from "i18n";
import { ChangeEventHandlerControl } from "comps/controls/eventHandlerControl";
import { formDataChildren } from "./formComp/formDataConstants";
import { PositionControl } from "comps/controls/dropdownControl";
import React, { useRef, useState } from "react";
import ReactResizeDetector from "react-resize-detector";
import { ArrayStringControl } from "comps/controls/codeControl";
import { styleControl } from "comps/controls/styleControl";
import { AnimationStyle, AnimationStyleType, CarouselStyle } from "comps/controls/styleControlConstants";
import {viewMode} from "@lowcoder-ee/util/editor";

const PropertyView =  React.lazy( async () => await import("@lowcoder-ee/comps/comps/propertyView/carouselComp"));

// TODO: dots at top position needs proper margin (should be the same as bottom position)

const CarouselItem = styled.div<{ $src: string }>`
  background: ${(props) => props.$src && `url(${props.$src})`} no-repeat 50% 50%;
  background-size: contain;
`;

const Container = styled.div<{$bg: string; $animationStyle:AnimationStyleType}>`
  &,
  .ant-carousel {
    height: 100%;
    background: ${(props) => props.$bg};
    ${props=>props.$animationStyle}
  }
`;

let CarouselBasicComp = (function () {
  const childrenMap = {
    autoPlay: withDefault(BoolControl, true),
    data: withDefault(
      ArrayStringControl,
      JSON.stringify(["https://temp.im/403x192", "https://temp.im/403x192"])
    ),
    onEvent: ChangeEventHandlerControl,
    showDots: withDefault(BoolControl, true),
    dotPosition: withDefault(PositionControl, "bottom"),
    style: styleControl(CarouselStyle , 'style'),
    animationStyle: styleControl(AnimationStyle , 'animationStyle'),
    ...formDataChildren,
  };
  let builder = new UICompBuilder(childrenMap, (props) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);
    const onResize = () => {
      if (containerRef.current) {
        setHeight(containerRef.current.clientHeight);
      }
    };
    return (
      <Container
        ref={containerRef}
        $bg={props.style.background}
        $animationStyle={props.animationStyle}
      >
        <ReactResizeDetector onResize={onResize}>
          <Carousel
            dots={props.showDots}
            dotPosition={props.dotPosition}
            autoplay={props.autoPlay}
            afterChange={() => props.onEvent("change")}
          >
            {props.data.map((url, index) => (
              <div key={index}>
                <CarouselItem $src={url} style={{ height }} />
              </div>
            ))}
          </Carousel>
        </ReactResizeDetector>
      </Container>
    );
  })
  if (viewMode() === "admin") {
    builder.setPropertyViewFn((children) => <PropertyView {...children}></PropertyView>);
  }
      return builder
    .build();
})();

CarouselBasicComp = class extends CarouselBasicComp {
  override autoHeight(): boolean {
    return false;
  }
};

export const CarouselComp = withExposingConfigs(CarouselBasicComp, [
  new NameConfig("data", trans("data")),
  NameConfigHidden,
]);
