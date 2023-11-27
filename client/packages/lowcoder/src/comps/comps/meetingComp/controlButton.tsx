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
import {
  Button100,
  ButtonStyleControl,
} from "./videobuttonCompConstants";
import { RefControl } from "comps/controls/refControl";
import {
  AutoHeightControl,
  heightCalculator,
  widthCalculator,
} from "@lowcoder-ee/index.sdk";
import { useEffect, useRef, useState } from "react";
import ReactResizeDetector from "react-resize-detector";

import { useContext } from "react";

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
      border: 1px solid ${style.border};
      border-radius: ${style.radius};
      margin: ${style.margin};
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

function getStyleIcon(style: any) {
  return css`
    svg {
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

function isDefault(type?: string) {
  return !type;
}

function submitForm(editorState: EditorState, formName: string) {
  const form = getForm(editorState, formName);
  if (form) {
    form.submit();
  }
}

let ButtonTmpComp = (function () {
  const childrenMap = {
    iconSize: withDefault(StringControl, "20px"),
    type: dropdownControl(typeOptions, ""),
    autoHeight: withDefault(AutoHeightControl, "fixed"),
    aspectRatio: withDefault(StringControl, "1 / 1"),
    onEvent: ButtonEventHandlerControl,
    disabled: BoolCodeControl,
    loading: BoolCodeControl,
    form: SelectFormControl,
    prefixIcon: IconControl,
    style: ButtonStyleControl,
    viewRef: RefControl<HTMLElement>,
  };

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

    return (
      <EditorContext.Consumer>
        {(editorState) => (
          <ReactResizeDetector onResize={onResize}>
            <Container ref={conRef} $style={props.style}>
              <div
                ref={imgRef}
                style={
                  props.autoHeight
                    ? { width: "100%", height: "100%" }
                    : undefined
                }
              >
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
                  {props.prefixIcon && (
                    <IconWrapper
                      $style={{ ...props.style, size: props.iconSize }}
                    >
                      {props.prefixIcon}
                    </IconWrapper>
                  )}
                  
                </Button100>
              </div>
            </Container>
          </ReactResizeDetector>
        )}
      </EditorContext.Consumer>
    );
  })
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.prefixIcon.propertyView({
            label: trans("button.icon"),
          })}
        </Section>


        {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && (
          <Section name={sectionNames.interaction}>
            {children.onEvent.getPropertyView()}
            {disabledPropertyView(children)}
            {hiddenPropertyView(children)}
            {loadingPropertyView(children)}
          </Section>
        )}

        {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && (
          <><Section name={sectionNames.layout}>
              {children.autoHeight.getPropertyView()}
              {children.iconSize.propertyView({
                label: trans("button.iconSize"),
              })}
            </Section>
            <Section name={sectionNames.style}>
                {children.style.getPropertyView()}
                {children.aspectRatio.propertyView({
                  label: trans("style.aspectRatio"),
                })}
            </Section></>
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
