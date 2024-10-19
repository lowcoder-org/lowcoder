import { ContainerCompBuilder } from "comps/comps/containerBase/containerCompBuilder";
import { gridItemCompToGridItems, InnerGrid } from "comps/comps/containerComp/containerView";
import { AutoHeightControl } from "comps/controls/autoHeightControl";
import { StringControl } from "comps/controls/codeControl";
import { booleanExposingStateControl } from "comps/controls/codeStateControl";
import { eventHandlerControl } from "comps/controls/eventHandlerControl";
import { styleControl } from "comps/controls/styleControl";
import { HorizontalAlignmentControl } from "comps/controls/dropdownControl";
import { ModalStyle, ModalStyleType } from "comps/controls/styleControlConstants";
import { withMethodExposing } from "comps/generators/withMethodExposing";
import { BackgroundColorContext } from "comps/utils/backgroundColorContext";
import { CanvasContainerID } from "constants/domLocators";
import { Layers } from "constants/Layers";
import { HintPlaceHolder, Modal, Section, sectionNames } from "lowcoder-design";
import { trans } from "i18n";
import { changeChildAction } from "lowcoder-core";
import { CSSProperties, useCallback } from "react";
import { ResizeHandle } from "react-resizable";
import styled, { css } from "styled-components";
import { useUserViewMode } from "util/hooks";
import { isNumeric } from "util/stringUtils";
import { NameConfig, withExposingConfigs } from "../generators/withExposing";
import { BoolControl } from "comps/controls/boolControl";
import { withDefault } from "comps/generators";
import SliderControl from "../controls/sliderControl";

const EventOptions = [
  { label: trans("modalComp.open"), value: "open", description: trans("modalComp.openDesc") },
  { label: trans("modalComp.close"), value: "close", description: trans("modalComp.closeDesc") },
] as const;

const getStyle = (style: ModalStyleType, modalScrollbar: boolean) => {
  return css`
    .ant-modal-content {
      border-radius: ${style.radius};
      border: ${style.borderWidth} solid ${style.border};
      overflow: hidden;
      background-color: ${style.background};
      ${style.backgroundImage ? `background-image: url(${style.backgroundImage}) !important; ` : ';'}
      ${style.backgroundImageRepeat ? `background-repeat: ${style.backgroundImageRepeat};` : 'no-repeat;'}
      ${style.backgroundImageSize ? `background-size: ${style.backgroundImageSize};` : 'cover'}
      ${style.backgroundImagePosition ? `background-position: ${style.backgroundImagePosition};` : 'center;'}
      ${style.backgroundImageOrigin ? `background-origin: ${style.backgroundImageOrigin};` : 'padding-box;'}
      margin: ${style.margin};
      .ant-modal-body > .react-resizable > .react-grid-layout {
        background-color: ${style.background};
      }
      > .ant-modal-body {
        background-color: ${style.background};
      }
    }
    div.ant-modal-body div.react-grid-layout::-webkit-scrollbar {
      display: ${modalScrollbar ? "block" : "none"};
    }
    .ant-modal-close {
      inset-inline-end: 10px !important;
      top: 10px;
    }
  `;
};

const StyledModal = styled(Modal)<{$titleAlign?: string}>`
  .ant-modal-title {
    margin: 0px 20px !important;
    text-align: ${(props) => props.$titleAlign || "center"};
  }
`;

const DEFAULT_WIDTH = "60%";
const DEFAULT_HEIGHT = 222;

function extractMarginValues(style: ModalStyleType) {
  // Regular expression to match numeric values with units (like px, em, etc.)
  const regex = /\d+px|\d+em|\d+%|\d+vh|\d+vw/g;
  // Extract the values using the regular expression
  let values = style.padding.match(regex);
  let valuesarray: number[] = [];
  // If only one value is found, duplicate it to simulate uniform margin
  if (values && values.length === 1) {
    valuesarray = [parseInt(values[0]), parseInt(values[0])];
  }
  // Return the array of values
  return valuesarray;
}

const ModalStyled = styled.div<{ $style: ModalStyleType, $modalScrollbar: boolean }>`
  ${(props) => props.$style && getStyle(props.$style, props.$modalScrollbar)}
`;

const ModalWrapper = styled.div`
  // Shield the mouse events of the lower layer, the mask can be closed in the edit mode to prevent the lower layer from sliding
  pointer-events: auto;
`;

// If it is a number, use the px unit by default
function transToPxSize(size: string | number) {
  return isNumeric(size) ? size + "px" : (size as string);
}

let TmpModalComp = (function () {
  return new ContainerCompBuilder(
    {
      visible: booleanExposingStateControl("visible"),
      onEvent: eventHandlerControl(EventOptions),
      width: StringControl,
      height: StringControl,
      horizontalGridCells: SliderControl,
      autoHeight: AutoHeightControl,
      title: StringControl,
      titleAlign: HorizontalAlignmentControl,
      modalScrollbar: withDefault(BoolControl, false),
      style: styleControl(ModalStyle),
      maskClosable: withDefault(BoolControl, true),
      showMask: withDefault(BoolControl, true),
      toggleClose:withDefault(BoolControl,true)
    },
    (props, dispatch) => {
      const userViewMode = useUserViewMode();
      const bodyStyle: CSSProperties = { padding: 0 };
      const width = transToPxSize(props.width || DEFAULT_WIDTH);
      let height = undefined;
      let resizeHandles: ResizeHandle[] = ["w", "e"];
      if (!props.autoHeight) {
        height = transToPxSize(props.height || DEFAULT_HEIGHT);
        resizeHandles.push("s");
        bodyStyle.overflow = "hidden auto";
      }
      if (userViewMode) {
        resizeHandles = [];
      }
      const { items, ...otherContainerProps } = props.container;
      const onResizeStop = useCallback(
        (
          e: React.SyntheticEvent,
          node: HTMLElement,
          size: { width: number; height: number },
          handle: ResizeHandle
        ) => {
          if (["w", "e"].includes(handle)) {
            dispatch(changeChildAction("width", size.width, true));
          } else if (["n", "s"].includes(handle)) {
            dispatch(changeChildAction("height", size.height, true));
          }
        },
        [dispatch]
      );
      let paddingValues = [10, 10];
      if (props.style.padding != undefined) {
        const extractedValues = extractMarginValues(props.style);
        if (extractedValues !== null) {
          paddingValues = extractedValues;
        } 
      }
      return (
        <BackgroundColorContext.Provider value={props.style.background}>
          <ModalWrapper>
            <StyledModal
              closable={props.toggleClose}
              height={height}
              resizeHandles={resizeHandles}
              onResizeStop={onResizeStop}
              open={props.visible.value}
              maskClosable={props.maskClosable}
              focusTriggerAfterClose={false}
              getContainer={() => document.querySelector(`#${CanvasContainerID}`) || document.body}
              footer={null}
              styles={{body: bodyStyle}}
              title={props.title}
              $titleAlign={props.titleAlign}
              width={width}
              onCancel={(e) => {
                props.toggleClose&&props.visible.onChange(false);
              }}
              afterClose={() => {
                props.toggleClose&&props.onEvent("close");
              }}
              afterOpenChange={(open: boolean) => {
                if (open) props.onEvent("open");
              }}
              zIndex={Layers.modal}
              modalRender={(node) => <ModalStyled $style={props.style} $modalScrollbar={props.modalScrollbar}>{node}</ModalStyled>}
              mask={props.showMask}
              className={props.className as string}
              data-testid={props.dataTestId as string}
            >
              <InnerGrid
                {...otherContainerProps}
                items={gridItemCompToGridItems(items)}
                horizontalGridCells={props.horizontalGridCells}
                autoHeight={props.autoHeight}
                minHeight={paddingValues ? DEFAULT_HEIGHT - paddingValues[0] * 2 + "px" : ""}
                containerPadding={paddingValues ? [paddingValues[0] ?? 0, paddingValues[1] ?? 0] : [24,24]}
                hintPlaceholder={HintPlaceHolder}
              />
            </StyledModal>
          </ModalWrapper>
        </BackgroundColorContext.Provider>
      );
    }
  )
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.title.propertyView({ label: trans("modalComp.title") })}
          {children.title.getView() && children.titleAlign.propertyView({ label: trans("modalComp.titleAlign"), radioButton: true })}
          {children.horizontalGridCells.propertyView({
            label: trans('prop.horizontalGridCells'),
          })}
          {children.autoHeight.getPropertyView()}
          {!children.autoHeight.getView() && 
            children.modalScrollbar.propertyView({
              label: trans("prop.modalScrollbar")
            })}
          {!children.autoHeight.getView() &&
            children.height.propertyView({
              label: trans("modalComp.modalHeight"),
              tooltip: trans("modalComp.modalHeightTooltip"),
              placeholder: DEFAULT_HEIGHT + "",
            })}
          {children.width.propertyView({
            label: trans("modalComp.modalWidth"),
            tooltip: trans("modalComp.modalWidthTooltip"),
            placeholder: DEFAULT_WIDTH,
          })}
          {children.maskClosable.propertyView({
            label: trans("prop.maskClosable"),
          })}
          {children.showMask.propertyView({
            label: trans("prop.showMask"),
          })}
          {children.toggleClose.propertyView({
            label: trans("prop.toggleClose"),
          })}
        </Section>
        <Section name={sectionNames.interaction}>{children.onEvent.getPropertyView()}</Section>
        <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
      </>
    ))
    .build();
})();

TmpModalComp = class extends TmpModalComp {
  override autoHeight(): boolean {
    return false;
  }
};

TmpModalComp = withMethodExposing(TmpModalComp, [
  {
    method: {
      name: "openModal",
      description: trans("modalComp.openModalDesc"),
      params: [],
    },
    execute: (comp, values) => {
      comp.children.visible.getView().onChange(true);
    },
  },
  {
    method: {
      name: "closeModal",
      description: trans("modalComp.closeModalDesc"),
      params: [],
    },
    execute: (comp, values) => {
      comp.children.visible.getView().onChange(false);
    },
  },
]);

export const ModalComp = withExposingConfigs(TmpModalComp, [
  new NameConfig("visible", trans("modalComp.visibleDesc")),
]);
