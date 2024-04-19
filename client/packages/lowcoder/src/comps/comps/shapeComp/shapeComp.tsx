import { useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";
import { RecordConstructorToView } from "lowcoder-core";
import { styleControl } from "comps/controls/styleControl";
import _ from "lodash";
import {
  IconStyle,
  IconStyleType,
  heightCalculator,
  widthCalculator,
} from "comps/controls/styleControlConstants";
import { UICompBuilder } from "comps/generators/uiCompBuilder";
import { withDefault } from "../../generators";
import {
  NameConfigHidden,
  withExposingConfigs,
} from "comps/generators/withExposing";
import { Section, sectionNames } from "lowcoder-design";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { NumberControl } from "comps/controls/codeControl";
import { ShapeControl } from "comps/controls/shapeControl";
import ReactResizeDetector from "react-resize-detector";
import { AutoHeightControl } from "../../controls/autoHeightControl";
import {
  clickEvent,
  eventHandlerControl,
} from "../../controls/eventHandlerControl";
import { useContext } from "react";
import { EditorContext } from "comps/editorState";
import { Coolshape } from "coolshapes-react";

const Container = styled.div<{ $style: IconStyleType | undefined }>`
  display: flex;
  align-items: center;
  justify-content: center;

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
  style: styleControl(IconStyle),
  icon: withDefault(ShapeControl, ""),
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
  const getIconDetails = () => {
    if (props?.icon) {
      let { props: pp } = props?.icon;
      console.log(pp);
    }

    // let shapeDetails: any = props.icon["props"];
    // console.log(shapeDetails);

    // if (props.icon && props.icon?.props?.value) {
    //   return {
    //     index: parseInt(props.icon?.props?.value.split("_")[1]),
    //     value: props.icon?.props?.value.split("_")[0],
    //   };
    // } else {
    //   return {
    //     index: 0,
    //     value: "star",
    //   };
    // }
  };

  return (
    <ReactResizeDetector onResize={onResize}>
      <Container
        ref={conRef}
        $style={props.style}
        style={{
          fontSize: props.autoHeight
            ? `${height < width ? height : width}px`
            : props.iconSize,
          background: props.style.background,
        }}
        onClick={() => props.onEvent("click")}
      >
        {/* {props.icon} */}
        <Coolshape
          type={getIconDetails()["value"]}
          index={getIconDetails()["index"]}
          size={48}
          noise={true}
        />
      </Container>
    </ReactResizeDetector>
  );
};

let ShapeBasicComp = (function () {
  return new UICompBuilder(childrenMap, (props) => <IconView {...props} />)
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.icon.propertyView({
            label: trans("iconComp.icon"),
            IconType: "All",
          })}
        </Section>

        {["logic", "both"].includes(
          useContext(EditorContext).editorModeStatus
        ) && (
          <Section name={sectionNames.interaction}>
            {children.onEvent.getPropertyView()}
            {hiddenPropertyView(children)}
          </Section>
        )}

        {["layout", "both"].includes(
          useContext(EditorContext).editorModeStatus
        ) && (
          <>
            <Section name={sectionNames.layout}>
              {children.autoHeight.propertyView({
                label: trans("iconComp.autoSize"),
              })}
              {!children.autoHeight.getView() &&
                children.iconSize.propertyView({
                  label: trans("iconComp.iconSize"),
                })}
            </Section>
            <Section name={sectionNames.style}>
              {children.style.getPropertyView()}
            </Section>
          </>
        )}
      </>
    ))
    .build();
})();

ShapeBasicComp = class extends ShapeBasicComp {
  override autoHeight(): boolean {
    return false;
  }
};

export const ShapeComp = withExposingConfigs(ShapeBasicComp, [
  NameConfigHidden,
]);
