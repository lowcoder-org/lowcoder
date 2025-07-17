import { useEffect, useMemo, useRef, useState } from "react";
import styled, { css } from "styled-components";
import { RecordConstructorToView } from "lowcoder-core";
import { styleControl } from "comps/controls/styleControl";
import _ from "lodash";
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
import { Section, sectionNames } from "lowcoder-design";
import { hiddenPropertyView, showDataLoadingIndicatorsPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { NumberControl } from "comps/controls/codeControl";
import { IconControl } from "comps/controls/iconControl";
import { useResizeDetector } from "react-resize-detector";
import { AutoHeightControl } from "../controls/autoHeightControl";
import {
  clickEvent,
  eventHandlerControl,
  doubleClickEvent,
} from "../controls/eventHandlerControl";
import { useContext } from "react";
import { EditorContext } from "comps/editorState";
import { AssetType, IconscoutControl } from "@lowcoder-ee/comps/controls/iconscoutControl";
import { dropdownControl } from "../controls/dropdownControl";
import { useCompClickEventHandler } from "../utils/useCompClickEventHandler";

const Container = styled.div<{
  $sourceMode: string;
  $style: IconStyleType | undefined;
  $animationStyle:AnimationStyleType;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  ${props=>props.$animationStyle}
  ${(props) =>
    props.$style &&
    css`
      height: calc(100% - ${props.$style.margin ?? '0px'});
      width: calc(100% - ${props.$style.margin ?? '0px'});
      padding: ${props.$style.padding ?? '0px'};
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
  ${(props) => props.$sourceMode === 'asset-library' && `
    img {
      max-width: 100%;
      max-height: 100%;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  `}
`;

const EventOptions = [clickEvent, doubleClickEvent] as const;

const ModeOptions = [
  { label: "Standard", value: "standard" },
  { label: "Asset Library", value: "asset-library" },
] as const;

const childrenMap = {
  style: styleControl(IconStyle,'style'),
  animationStyle: styleControl(AnimationStyle,'animationStyle'),
  sourceMode: dropdownControl(ModeOptions, "standard"),
  icon: withDefault(IconControl, "/icon:antd/homefilled"),
  iconScoutAsset: IconscoutControl(AssetType.ICON),
  autoHeight: withDefault(AutoHeightControl, "auto"),
  iconSize: withDefault(NumberControl, 20),
  onEvent: eventHandlerControl(EventOptions),
};

const IconView = (props: RecordConstructorToView<typeof childrenMap>) => {
  const conRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const handleClickEvent = useCompClickEventHandler({onEvent: props.onEvent})

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

  useResizeDetector({
    targetRef: conRef,
    onResize,
  });

  const style = useMemo(() => {
    if (props.sourceMode === 'standard') {
      return {
        fontSize: props.autoHeight
          ? `${height < width ? height : width}px`
          : props.iconSize,
        background: props.style.background,
      }
    }
    return {
      width: props.autoHeight ? '' : props.iconSize,
      background: props.style.background,
    }
  }, [width, height, props.autoHeight, props.iconSize, props.sourceMode, props.style.background]);

  return (
    <Container
      ref={conRef}
      $style={props.style}
      $sourceMode={props.sourceMode}
      $animationStyle={props.animationStyle}
      style={style}
      onClick={handleClickEvent}
    >
      { props.sourceMode === 'standard'
        ? (props.icon || '')
        : <img src={props.iconScoutAsset.value} />
      }
    </Container>
  );
};

let IconBasicComp = (function () {
  return new UICompBuilder(childrenMap, (props) => {
    return(<IconView {...props} />)})
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          { children.sourceMode.propertyView({
            label: "",
            radioButton: true
          })}
          {children.sourceMode.getView() === 'standard' && children.icon.propertyView({
            label: trans("iconComp.icon"),
            IconType: "All",
          })}
          {children.sourceMode.getView() === 'asset-library' && children.iconScoutAsset.propertyView({
            label: trans("button.icon"),
          })}
        </Section> 

        {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <Section name={sectionNames.interaction}>
            {children.onEvent.getPropertyView()}
            {hiddenPropertyView(children)}
            {showDataLoadingIndicatorsPropertyView(children)}
          </Section>
        )}

        {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <><Section name={sectionNames.layout}>
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
            <Section name={sectionNames.animationStyle} hasTooltip={true}>
              {children.animationStyle.getPropertyView()}
            </Section>
          </>
        )}
      </>
    ))
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

