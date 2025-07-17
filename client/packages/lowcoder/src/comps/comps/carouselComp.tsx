import { default as Carousel } from "antd/es/carousel";
import { Section, sectionNames } from "lowcoder-design";
import { BoolControl } from "../controls/boolControl";
import { UICompBuilder, withDefault } from "../generators";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "../generators/withExposing";
import styled from "styled-components";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { ChangeEventHandlerControl } from "comps/controls/eventHandlerControl";
import { formDataChildren, FormDataPropertyView } from "./formComp/formDataConstants";
import { PositionControl } from "comps/controls/dropdownControl";
import { useEffect, useRef, useState } from "react";
import  { useResizeDetector } from "react-resize-detector";
import { ArrayStringControl } from "comps/controls/codeControl";
import { styleControl } from "comps/controls/styleControl";
import { AnimationStyle, AnimationStyleType, CarouselStyle } from "comps/controls/styleControlConstants";

import { useContext } from "react";
import { EditorContext } from "comps/editorState";

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
  return new UICompBuilder(childrenMap, (props) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);
    const onResize = () => {
      if (containerRef.current) {
        setHeight(containerRef.current.clientHeight);
      }
    };

    useResizeDetector({
      targetRef: containerRef,
      onResize,
    });

    return (
      <Container
        ref={containerRef}
        $bg={props.style.background}
        $animationStyle={props.animationStyle}
      >
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
      </Container>
    );
  })
    .setPropertyViewFn((children) => {
      return (
        <>
          <Section name={sectionNames.basic}>
            {children.data.propertyView({ label: trans("data") })}
          </Section>

          {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
            <><FormDataPropertyView {...children} />
            <Section name={sectionNames.interaction}>
              {children.onEvent.getPropertyView()}
              {hiddenPropertyView(children)}
              {children.autoPlay.propertyView({ label: trans("carousel.autoPlay") })}
            </Section></>
          )}
          {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
            <><Section name={sectionNames.layout}>
                {children.showDots.propertyView({ label: trans("carousel.showDots") })}
                {children.dotPosition.propertyView({
                  label: trans("carousel.dotPosition"),
                  radioButton: true,
                })}
              </Section>
              <Section name={sectionNames.style}>
                {children.style.getPropertyView()}
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
