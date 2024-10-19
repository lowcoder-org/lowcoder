import { default as CloseOutlined } from "@ant-design/icons/CloseOutlined";
import { default as Button } from "antd/es/button";
import { ContainerCompBuilder } from "comps/comps/containerBase/containerCompBuilder";
import { gridItemCompToGridItems, InnerGrid } from "comps/comps/containerComp/containerView";
import { AutoHeightControl } from "comps/controls/autoHeightControl";
import { BoolControl } from "comps/controls/boolControl";
import { StringControl } from "comps/controls/codeControl";
import { booleanExposingStateControl } from "comps/controls/codeStateControl";
import { PositionControl, LeftRightControl, HorizontalAlignmentControl } from "comps/controls/dropdownControl";
import { closeEvent, eventHandlerControl } from "comps/controls/eventHandlerControl";
import { styleControl } from "comps/controls/styleControl";
import { DrawerStyle } from "comps/controls/styleControlConstants";
import { withDefault } from "comps/generators";
import { withMethodExposing } from "comps/generators/withMethodExposing";
import { BackgroundColorContext } from "comps/utils/backgroundColorContext";
import { CanvasContainerID } from "constants/domLocators";
import { Layers } from "constants/Layers";
import { trans } from "i18n";
import { changeChildAction } from "lowcoder-core";
import { Drawer, HintPlaceHolder, Section, sectionNames } from "lowcoder-design";
import { useCallback } from "react";
import { ResizeHandle } from "react-resizable";
import styled from "styled-components";
import { useUserViewMode } from "util/hooks";
import { isNumeric } from "util/stringUtils";
import { NameConfig, withExposingConfigs } from "../generators/withExposing";
import { title } from "process";
import SliderControl from "../controls/sliderControl";

const EventOptions = [closeEvent] as const;

const DEFAULT_SIZE = 378;
const DEFAULT_PADDING = 16;

const DrawerWrapper = styled.div`
  // Shield the mouse events of the lower layer, the mask can be closed in the edit mode to prevent the lower layer from sliding
  pointer-events: auto;
  .ant-drawer-header-title {
    margin: 0px 20px !important;
    font-size: 16px;
  }
`;

const StyledDrawer = styled(Drawer)<{$titleAlign?: string, $drawerScrollbar: boolean}>`
  .ant-drawer-header-title {
    margin: 0px 20px !important;
    text-align: ${(props) => props.$titleAlign || "center"};
  }
  div.ant-drawer-body div.react-grid-layout::-webkit-scrollbar {
    display: ${(props) => props.$drawerScrollbar ? "block" : "none"};
  }
`;

const ButtonStyle = styled(Button)<{$closePosition?: string, $title? :string}>`
  position: absolute;
  ${(props) => props.$closePosition === "right" ? "right: 0;" : "left: 0;"}
  top: ${(props) => props.$title !== "" ? "2px" : "0px"};
  z-index: 10;
  font-weight: 700;
  box-shadow: none;
  color: rgba(0, 0, 0, 0.45);
  height: 54px;
  width: 54px;

  svg {
    width: 16px;
    height: 16px;
  }

  &,
  :hover,
  :focus {
    background-color: transparent;
    border: none;
  }

  :hover,
  :focus {
    color: rgba(0, 0, 0, 0.75);
  }
`;

// If it is a number, use the px unit by default
function transToPxSize(size: string | number) {
  return isNumeric(size) ? size + "px" : (size as string);
}

let TmpDrawerComp = (function () {
  return new ContainerCompBuilder(
    {
      visible: booleanExposingStateControl("visible"),
      onEvent: eventHandlerControl(EventOptions),
      width: StringControl,
      height: StringControl,
      title: StringControl,
      titleAlign: HorizontalAlignmentControl,
      horizontalGridCells: SliderControl,
      autoHeight: AutoHeightControl,
      drawerScrollbar: withDefault(BoolControl, true),
      style: styleControl(DrawerStyle),
      placement: PositionControl,
      closePosition: withDefault(LeftRightControl, "left"),
      maskClosable: withDefault(BoolControl, true),
      showMask: withDefault(BoolControl, true),
      toggleClose:withDefault(BoolControl,true)
    },
    (props, dispatch) => {
      const isTopBom = ["top", "bottom"].includes(props.placement);
      const { items, ...otherContainerProps } = props.container;
      const userViewMode = useUserViewMode();
      const resizable = !userViewMode && (!isTopBom || !props.autoHeight);
      const onResizeStop = useCallback(
        (
          e: React.SyntheticEvent,
          node: HTMLElement,
          size: { width: number; height: number },
          handle: ResizeHandle
        ) => {
          isTopBom
            ? dispatch(changeChildAction("height", size.height, true))
            : dispatch(changeChildAction("width", size.width, true));
        },
        [dispatch, isTopBom]
      );
      return (
        <BackgroundColorContext.Provider value={props.style.background}>
          <DrawerWrapper>
            <StyledDrawer
              resizable={resizable}
              onResizeStop={onResizeStop}
              rootStyle={props.visible.value ? { overflow: "auto", pointerEvents: "auto" } : {}}
              styles={{
                wrapper: {
                  maxHeight: "100%",
                  maxWidth: "100%",
                },
                body: {
                  padding: 0,
                  backgroundColor: props.style.background
                }
              }}
              title={props.title}
              $titleAlign={props.titleAlign}
              $drawerScrollbar={props.drawerScrollbar}
              closable={false}
              placement={props.placement}
              open={props.visible.value}
              getContainer={() => document.querySelector(`#${CanvasContainerID}`) || document.body}
              footer={null}
              width={transToPxSize(props.width || DEFAULT_SIZE)}
              height={!props.autoHeight ? transToPxSize(props.height || DEFAULT_SIZE) : ""}
              onClose={(e) => {
                props.visible.onChange(false);
              }}
              afterOpenChange={(visible) => {
                if (!visible) {
                  props.onEvent("close");
                }
              }}
              zIndex={Layers.drawer}
              maskClosable={props.maskClosable}
              mask={props.showMask}
              className={props.className as string}
              data-testid={props.dataTestId as string}
            >
            {props.toggleClose && (
              <ButtonStyle
                $closePosition={props.closePosition}
                onClick={() => {
                  props.visible.onChange(false);
                }}
              >
                <CloseOutlined />
              </ButtonStyle>
              )}
              <InnerGrid
                {...otherContainerProps}
                items={gridItemCompToGridItems(items)}
                horizontalGridCells={props.horizontalGridCells}
                autoHeight={props.autoHeight}
                minHeight={isTopBom ? DEFAULT_SIZE + "px" : "100%"}
                style={{ height: "100%" }}
                containerPadding={[DEFAULT_PADDING, DEFAULT_PADDING]}
                hintPlaceholder={HintPlaceHolder}
                bgColor={props.style.background}
              />
            </StyledDrawer>
          </DrawerWrapper>
        </BackgroundColorContext.Provider>
      );
    }
  )
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.title.propertyView({ label: trans("drawer.title") })}
          {children.title.getView() && children.titleAlign.propertyView({ label: trans("drawer.titleAlign"), radioButton: true })}
          {children.closePosition.propertyView({ label: trans("drawer.closePosition"), radioButton: true })}
          {children.placement.propertyView({ label: trans("drawer.placement"), radioButton: true })}
          {["top", "bottom"].includes(children.placement.getView())
            ? children.autoHeight.getPropertyView()
            : children.width.propertyView({
                label: trans("drawer.width"),
                tooltip: trans("drawer.widthTooltip"),
                placeholder: DEFAULT_SIZE + "",
              })}
          {!children.autoHeight.getView() &&
            ["top", "bottom"].includes(children.placement.getView()) &&
            children.height.propertyView({
              label: trans("drawer.height"),
              tooltip: trans("drawer.heightTooltip"),
              placeholder: DEFAULT_SIZE + "",
            })}
          {children.horizontalGridCells.propertyView({
            label: trans('prop.horizontalGridCells'),
          })}
          {children.drawerScrollbar.propertyView({ label: trans("prop.drawerScrollbar") })}
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

TmpDrawerComp = class extends TmpDrawerComp {
  override autoHeight(): boolean {
    return false;
  }
};

TmpDrawerComp = withMethodExposing(TmpDrawerComp, [
  {
    method: {
      name: "openDrawer",
      description: trans("drawer.openDrawerDesc"),
      params: [],
    },
    execute: (comp, values) => {
      comp.children.visible.getView().onChange(true);
    },
  },
  {
    method: {
      name: "closeDrawer",
      description: trans("drawer.closeDrawerDesc"),
      params: [],
    },
    execute: (comp, values) => {
      comp.children.visible.getView().onChange(false);
    },
  },
]);

export const DrawerComp = withExposingConfigs(TmpDrawerComp, [
  new NameConfig("visible", trans("export.visibleDesc")),
]);
