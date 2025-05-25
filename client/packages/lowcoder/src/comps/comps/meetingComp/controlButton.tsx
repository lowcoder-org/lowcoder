import { BoolCodeControl, StringControl } from "comps/controls/codeControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { ButtonEventHandlerControl } from "comps/controls/eventHandlerControl";
import { IconControl } from "comps/controls/iconControl";
import { CompNameContext, EditorContext, EditorState } from "comps/editorState";
import { withDefault } from "comps/generators";
import { UICompBuilder } from "comps/generators/uiCompBuilder";
import _ from "lodash";
import {
  disabledPropertyView,
  hiddenPropertyView,
  loadingPropertyView,
} from "comps/utils/propertyUtils";
import {
  CommonBlueLabel,
  controlItem,
  Dropdown,
  Section,
  sectionNames,
} from "lowcoder-design";
import { trans } from "i18n";
import styled, { css } from "styled-components";

import {
  CommonNameConfig,
  NameConfig,
  withExposingConfigs,
} from "../../generators/withExposing";
import { IForm } from "../formComp/formDataConstants";
import { SimpleNameComp } from "../simpleNameComp";
import { Button100, ButtonStyleControl } from "./videobuttonCompConstants";
import { RefControl } from "comps/controls/refControl";
import { AutoHeightControl } from "comps/controls/autoHeightControl";
import {
  heightCalculator,
  widthCalculator,
} from "comps/controls/styleControlConstants";
import { useEffect, useRef, useState } from "react";
import { useResizeDetector } from "react-resize-detector";

import { useContext } from "react";
import { Tooltip } from "antd";
import { AssetType, IconscoutControl } from "@lowcoder-ee/comps/controls/iconscoutControl";

const Container = styled.div<{ $style: any }>`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  ${(props) => props.$style && getStyle(props.$style)}
`;

const getStyle = (style: any) => {
  return css`
    button {
      border: ${style.borderWidth} ${style.borderStyle} ${style.border};
      border-radius: ${style.radius};
      margin: ${style.margin};
      rotate: ${style.rotation};
      padding: ${style.padding};
      max-width: ${widthCalculator(style.margin)};
      max-height: ${heightCalculator(style.margin)};
    }
  `;
};

const FormLabel = styled(CommonBlueLabel)`
  font-size: 13px;
  margin-right: 4px;
`;

const IconWrapper = styled.div<{ $style: any }>`
  display: flex;

  ${(props) => props.$style && getStyleIcon(props.$style)}
`;

const IconScoutWrapper = styled.div<{ $style: any }>`
  display: flex;

  ${(props) => props.$style && getStyleIcon(props.$style)}
`;

function getStyleIcon(style: any) {
  return css`
    svg, img {
      width: ${style.size} !important;
      height: ${style.size} !important;
    }
  `;
}

function getFormOptions(editorState: EditorState) {
  return editorState
    .uiCompInfoList()
    .filter((info) => info.type === "form")
    .map((info) => ({
      label: info.name,
      value: info.name,
    }));
}

function getForm(editorState: EditorState, formName: string) {
  const comp = editorState?.getUICompByName(formName);
  if (comp && comp.children.compType.getView() === "form") {
    return comp.children.comp as unknown as IForm;
  }
}

function getFormEventHandlerPropertyView(
  editorState: EditorState,
  formName: string
) {
  const form = getForm(editorState, formName);
  if (!form) {
    return undefined;
  }
  return (
    <CompNameContext.Provider value={formName}>
      {form.onEventPropertyView(
        <>
          <FormLabel
            onClick={() =>
              editorState.setSelectedCompNames(
                new Set([formName]),
                "rightPanel"
              )
            }
          >
            {formName}
          </FormLabel>
          {trans("button.formButtonEvent")}
        </>
      )}
    </CompNameContext.Provider>
  );
}

class SelectFormControl extends SimpleNameComp {
  override getPropertyView() {
    const label = trans("button.formToSubmit");
    return controlItem(
      { filterText: label },
      <EditorContext.Consumer>
        {(editorState) => (
          <>
            <Dropdown
              label={label}
              value={this.value}
              options={getFormOptions(editorState)}
              onChange={(value) => this.dispatchChangeValueAction(value)}
              allowClear={true}
            />
            {getFormEventHandlerPropertyView(editorState, this.value)}
          </>
        )}
      </EditorContext.Consumer>
    );
  }
}

const typeOptions = [
  {
    label: trans("button.default"),
    value: "",
  },
  {
    label: trans("button.submit"),
    value: "submit",
  },
] as const;

const ModeOptions = [
  { label: "Standard", value: "standard" },
  { label: "Asset Library", value: "asset-library" },
] as const;

function isDefault(type?: string) {
  return !type;
}

function submitForm(editorState: EditorState, formName: string) {
  const form = getForm(editorState, formName);
  if (form) {
    form.submit();
  }
}

const childrenMap = {
  iconSize: withDefault(StringControl, "20px"),
  type: dropdownControl(typeOptions, ""),
  autoHeight: withDefault(AutoHeightControl, "fixed"),
  aspectRatio: withDefault(StringControl, "1 / 1"),
  onEvent: ButtonEventHandlerControl,
  disabled: BoolCodeControl,
  loading: BoolCodeControl,
  form: SelectFormControl,
  sourceMode: dropdownControl(ModeOptions, "standard"),
  prefixIcon: IconControl,
  iconScoutAsset: IconscoutControl(AssetType.ICON),
  style: ButtonStyleControl,
  viewRef: RefControl<HTMLElement>,
  restrictPaddingOnRotation:withDefault(StringControl, 'controlButton'),
  tooltip: StringControl
};

let ButtonTmpComp = (function () {
  return new UICompBuilder(childrenMap, (props) => {
    const [width, setWidth] = useState(120);
    const [height, setHeight] = useState(0);

    const imgRef = useRef<HTMLDivElement>(null);
    const conRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      if (height && width) {
        onResize();
      }
    }, [height, width]);

    const setStyle = (height: string, width: string) => {
      const img = imgRef.current;

      const imgDiv = img?.getElementsByTagName("button")[0];
      img!.style.height = height;
      img!.style.width = width;
      imgDiv!.style.height = height;
      imgDiv!.style.width = width;
    };

    const onResize = () => {
      const img = imgRef.current;
      const container = conRef.current;
      if (
        !img?.clientWidth ||
        !img?.clientHeight ||
        props.autoHeight ||
        !width
      ) {
        return;
      }

      setStyle(container?.clientHeight + "px", container?.clientWidth + "px");
    };

    useResizeDetector({
      targetRef: conRef,
      onResize,
    });

    return (
      <EditorContext.Consumer>
        {(editorState) => (
          <Container ref={conRef} $style={props.style}>
            <div
              ref={imgRef}
              style={
                props.autoHeight
                  ? { width: "100%", height: "100%" }
                  : undefined
              }
            >
              <Tooltip title={props.tooltip}>
                <Button100
                  ref={props.viewRef}
                  $buttonStyle={props.style}
                  loading={props.loading}
                  style={
                    props.autoHeight
                      ? { 
                        width: "100%", 
                        height: "100%",
                        aspectRatio: props.aspectRatio,
                        borderRadius: props.style.radius,
                      }
                      : {
                        aspectRatio: props.aspectRatio,
                        borderRadius: props.style.radius,
                      }
                  }
                  disabled={
                    props.disabled ||
                    (!isDefault(props.type) &&
                      getForm(editorState, props.form)?.disableSubmit())
                  }
                  onClick={() =>
                    isDefault(props.type)
                      ? props.onEvent("click")
                      : submitForm(editorState, props.form)
                  }
                >
                  {props.sourceMode === 'standard' && props.prefixIcon && (
                    <IconWrapper
                      $style={{ ...props.style, size: props.iconSize }}
                    >
                      {props.prefixIcon}
                    </IconWrapper>
                  )}
                  {props.sourceMode === 'asset-library' && props.iconScoutAsset && (
                    <IconScoutWrapper
                      $style={{ ...props.style, size: props.iconSize }}
                    >
                      {Boolean(props.iconScoutAsset.value) && <img src={props.iconScoutAsset.value} />}
                    </IconScoutWrapper>
                  )}
                </Button100>
              </Tooltip>
            </div>
          </Container>
        )}
      </EditorContext.Consumer>
    );
  })
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          { children.sourceMode.propertyView({
            label: "",
            radioButton: true
          })}
          {children.sourceMode.getView() === 'standard' && children.prefixIcon.propertyView({
            label: trans("button.icon"),
          })}
          {children.sourceMode.getView() === 'asset-library' &&children.iconScoutAsset.propertyView({
            label: trans("button.icon"),
          })}
          {children.tooltip.propertyView({ 
            label: trans("labelProp.tooltip"), 
          })}
        </Section>

        {(useContext(EditorContext).editorModeStatus === "logic" ||
          useContext(EditorContext).editorModeStatus === "both") && (
          <Section name={sectionNames.interaction}>
            {children.onEvent.getPropertyView()}
            {disabledPropertyView(children)}
            {hiddenPropertyView(children)}
            {loadingPropertyView(children)}
          </Section>
        )}

        {(useContext(EditorContext).editorModeStatus === "layout" ||
          useContext(EditorContext).editorModeStatus === "both") && (
          <>
            <Section name={sectionNames.layout}>
              {children.autoHeight.getPropertyView()}
              {children.iconSize.propertyView({
                label: trans("button.iconSize"),
              })}
              {children.aspectRatio.propertyView({
                label: trans("style.aspectRatio"),
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
ButtonTmpComp = class extends ButtonTmpComp {
  override autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }
};
export const ControlButton = withExposingConfigs(ButtonTmpComp, [
  new NameConfig("loading", trans("button.loadingDesc")),
  ...CommonNameConfig,
]);
