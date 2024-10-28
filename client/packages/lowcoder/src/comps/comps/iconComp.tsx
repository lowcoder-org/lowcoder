import React, { useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";
import { RecordConstructorToView } from "lowcoder-core";
import { styleControl } from "comps/controls/styleControl";
import {
  AnimationStyle,
  AnimationStyleType,
  IconStyle,
  IconStyleType,
  heightCalculator,
  widthCalculator,
} from "comps/controls/styleControlConstants";
import { UICompBuilder } from "comps/generators/uiCompBuilder";
import { withDefault } from "../generators";
import {
  NameConfigHidden,
  withExposingConfigs,
} from "comps/generators/withExposing";
import { NumberControl } from "comps/controls/codeControl";
import { IconControl } from "comps/controls/iconControl";
import ReactResizeDetector from "react-resize-detector";
import { AutoHeightControl } from "../controls/autoHeightControl";
import {
  clickEvent,
  eventHandlerControl,
} from "../controls/eventHandlerControl";
import {viewMode} from "@lowcoder-ee/util/editor";
const SetPropertyViewFn =  React.lazy( async () => await import("./setProperty/iconComp"));

const Container = styled.div<{
  $style: IconStyleType | undefined;
  $animationStyle:AnimationStyleType}>`
  display: flex;
  align-items: center;
  justify-content: center;
  ${props=>props.$animationStyle}
  ${(props) =>
    props.$style &&
    css`
      height: calc(100% - ${props.$style.margin});
      width: calc(100% - ${props.$style.margin});
      padding: ${props.$style.padding};
      margin: ${props.$style.margin};
      border: ${props.$style.borderWidth} solid ${props.$style.border};
      border-radius: ${props.$style.radius};
      background: ${props.$style.background};
      rotate:${props.$style.rotation};
      svg {
        max-width: ${widthCalculator(props.$style.margin)};
        max-height: ${heightCalculator(props.$style.margin)};
        color: ${props.$style.fill};
        object-fit: contain;
        pointer-events: auto;
      }
    `}
`;

const EventOptions = [clickEvent] as const;

const childrenMap = {
  style: styleControl(IconStyle,'style'),
  animationStyle: styleControl(AnimationStyle,'animationStyle'),
  icon: withDefault(IconControl, "/icon:antd/homefilled"),
  autoHeight: withDefault(AutoHeightControl, "auto"),
  iconSize: withDefault(NumberControl, 20),
  onEvent: eventHandlerControl(EventOptions),
};

const IconView = (props: RecordConstructorToView<typeof childrenMap>) => {
  const conRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (height && width) {
      onResize();
    }
  }, [height, width]);

  const onResize = () => {
    const container = conRef.current;
    setWidth(container?.clientWidth ?? 0);
    setHeight(container?.clientHeight ?? 0);
  };

  return (
    <ReactResizeDetector
      onResize={onResize}
      render={() => (
        <Container
          ref={conRef}
          $style={props.style}
          $animationStyle={props.animationStyle}
          style={{
            fontSize: props.autoHeight
              ? `${height < width ? height : width}px`
              : props.iconSize,
            background: props.style.background,
          }}
          onClick={() => props.onEvent("click")}
        >
          {props.icon}
        </Container>
      )}
    >
    </ReactResizeDetector>
  );
};

let IconBasicComp = (function () {
  let builder = new UICompBuilder(childrenMap, (props) => {
    return(<IconView {...props} />)})
  if (viewMode() === "edit") {
    builder.setPropertyViewFn((children) => <SetPropertyViewFn {...children}></SetPropertyViewFn>);
  }
      return builder
    .build();
})();

IconBasicComp = class extends IconBasicComp {
  override autoHeight(): boolean {
    return false;
  }
};

export const IconComp = withExposingConfigs(IconBasicComp, [
  NameConfigHidden,
]);

