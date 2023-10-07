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
  ButtonCompWrapper,
  ButtonStyleControl,
} from "./videobuttonCompConstants";
import { RefControl } from "comps/controls/refControl";
import {
  AutoHeightControl,
  ImageStyleType,
  heightCalculator,
  widthCalculator,
} from "@lowcoder-ee/index.sdk";
import { useEffect, useRef, useState } from "react";
import ReactResizeDetector from "react-resize-detector";

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

// const IconWrapper = styled.div<{ $styled: any }>`
//   display: flex;
//   svg {
//     width: ${styled.width}px !important;
//     height: ${styled.height}30px !important;
//   }
// `;

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
    text: withDefault(StringControl, trans("button.button")),
    iconSize: withDefault(StringControl, "20px"),
    type: dropdownControl(typeOptions, ""),
    autoHeight: withDefault(AutoHeightControl, "fixed"),
    onEvent: ButtonEventHandlerControl,
    disabled: BoolCodeControl,
    loading: BoolCodeControl,
    form: SelectFormControl,
    prefixIcon: IconControl,
    suffixIcon: IconControl,
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
        console.log("props", props, height, width);
      }
    }, [height, width]);

    const setStyle = (height: string, width: string) => {
      console.log(width, height);

      const img = imgRef.current;

      const imgDiv = img?.getElementsByTagName("button")[0];
      console.log("img 1", img);
      const imgCurrent = img?.getElementsByTagName("button")[0];
      console.log("img 2", imgCurrent);
      img!.style.height = height;
      img!.style.width = width;
      imgDiv!.style.height = height;
      imgDiv!.style.width = width;
      // imgCurrent!.style.height = height;
      // imgCurrent!.style.width = width;
    };

    const onResize = () => {
      const img = imgRef.current;
      console.log("img", img);
      const container = conRef.current;
      // console.log("img", container);
      console.log(
        "img",
        !img?.clientWidth,
        !img?.clientHeight,
        props.autoHeight,
        !width
      );
      if (
        !img?.clientWidth ||
        !img?.clientHeight ||
        props.autoHeight ||
        !width
      ) {
        return;
      }
      // fixme border style bug on safari
      // if (
      //   (_.divide(container?.clientWidth!, container?.clientHeight!) || 0) >
      //   (_.divide(Number(width), Number(height)) || 0)
      // ) {
      //   setStyle("100%", "auto");
      // } else {
      console.log(
        container?.clientHeight + "px",
        container?.clientWidth + "px"
      );

      setStyle(container?.clientHeight + "px", container?.clientWidth + "px");
      // }
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
                      ? { width: "100%", height: "100%" }
                      : undefined
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
                  {
                    props.text ||
                      (props.prefixIcon || props.suffixIcon ? undefined : " ") // Avoid button disappearing
                  }
                  {props.suffixIcon && (
                    <IconWrapper
                      $style={{ ...props.style, size: props.iconSize }}
                    >
                      {props.suffixIcon}
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
          {children.text.propertyView({ label: trans("text") })}
          {children.autoHeight.getPropertyView()}
        </Section>
        <Section name={sectionNames.interaction}>
          {children.type.propertyView({
            label: trans("prop.type"),
            radioButton: true,
          })}
          {isDefault(children.type.getView())
            ? [
                children.onEvent.getPropertyView(),
                disabledPropertyView(children),
                loadingPropertyView(children),
              ]
            : children.form.getPropertyView()}
        </Section>

        <Section name={sectionNames.layout}>
          {children.prefixIcon.propertyView({
            label: trans("button.prefixIcon"),
          })}
          {children.suffixIcon.propertyView({
            label: trans("button.suffixIcon"),
          })}
          {children.iconSize.propertyView({
            label: trans("meeting.iconSize"),
          })}
          {hiddenPropertyView(children)}
        </Section>
        <Section name={sectionNames.style}>
          {children.style.getPropertyView()}
        </Section>
      </>
    ))
    .build();
})();
ButtonTmpComp = class extends ButtonTmpComp {
  override autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }
};
export const VideoControlButton = withExposingConfigs(ButtonTmpComp, [
  new NameConfig("text", trans("button.textDesc")),
  new NameConfig("loading", trans("button.loadingDesc")),
  ...CommonNameConfig,
]);
