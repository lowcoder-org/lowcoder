import { BoolCodeControl, StringControl } from "comps/controls/codeControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { ButtonEventHandlerControl } from "comps/controls/eventHandlerControl";
import { IconControl } from "comps/controls/iconControl";
import { CompNameContext, EditorContext, EditorState } from "comps/editorState";
import { withDefault } from "comps/generators";
import { NewChildren, UICompBuilder } from "comps/generators/uiCompBuilder";
import {
  disabledPropertyView,
  hiddenPropertyView,
  loadingPropertyView,
} from "comps/utils/propertyUtils";
import { CommonBlueLabel, controlItem, Dropdown, Section, sectionNames } from "lowcoder-design";
import { trans } from "i18n";
import styled from "styled-components";
import { CommonNameConfig, NameConfig, withExposingConfigs } from "../../generators/withExposing";
import { IForm } from "../formComp/formDataConstants";
import { SimpleNameComp } from "../simpleNameComp";
import {
  Button100,
  ButtonCompWrapper,
  buttonRefMethods,
  ButtonStyleControl,
} from "./buttonCompConstants";
import { RefControl } from "comps/controls/refControl";
import { Tooltip } from "antd";
import React, { useContext, useEffect, useCallback, useRef } from "react";
import { AnimationStyle } from "@lowcoder-ee/comps/controls/styleControlConstants";
import { styleControl } from "@lowcoder-ee/comps/controls/styleControl";
import { RecordConstructorToComp } from "lowcoder-core";
import { ToViewReturn } from "@lowcoder-ee/comps/generators/multi";
import { useCompClickEventHandler } from "@lowcoder-ee/comps/utils/useCompClickEventHandler";

const FormLabel = styled(CommonBlueLabel)`
  font-size: 13px;
  margin-right: 4px;
`;

const IconWrapper = styled.div`
  display: flex;
`;

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

function getFormEventHandlerPropertyView(editorState: EditorState, formName: string) {
  const form = getForm(editorState, formName);
  if (!form) {
    return undefined;
  }
  return (
    <CompNameContext.Provider value={formName}>
      {form.onEventPropertyView(
        <>
          <FormLabel
            onClick={() => editorState.setSelectedCompNames(new Set([formName]), "rightPanel")}
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

const childrenMap = {
  text: withDefault(StringControl, trans("button.button")),
  type: dropdownControl(typeOptions, ""),
  onEvent: ButtonEventHandlerControl,
  disabled: BoolCodeControl,
  loading: BoolCodeControl,
  form: SelectFormControl,
  prefixIcon: IconControl,
  suffixIcon: IconControl,
  style: ButtonStyleControl,
  animationStyle: styleControl(AnimationStyle, 'animationStyle'),
  viewRef: RefControl<HTMLElement>,
  tooltip: StringControl
};

type ChildrenType = NewChildren<RecordConstructorToComp<typeof childrenMap>>;

const ButtonPropertyView = React.memo((props: {
  children: ChildrenType
}) => {
  const { editorModeStatus } = useContext(EditorContext);
  return (
    <>
      <Section name={sectionNames.basic}>
        {props.children.text.propertyView({ label: trans("text") })}
        {props.children.tooltip.propertyView({ label: trans("labelProp.tooltip")})}
      </Section>

      {(editorModeStatus === "logic" || editorModeStatus === "both") && (
        <><Section name={sectionNames.interaction}>
          {props.children.type.propertyView({ label: trans("prop.type"), radioButton: true })}
          {isDefault(props.children.type.getView())
            ? [
              props.children.onEvent.getPropertyView(),
              disabledPropertyView(props.children),
              hiddenPropertyView(props.children),
              loadingPropertyView(props.children),
            ]
            : props.children.form.getPropertyView()}
          </Section>
        </>
      )}

      {(editorModeStatus === "layout" || editorModeStatus === "both") && (
        <>
          <Section name={sectionNames.layout}>
            {props.children.prefixIcon.propertyView({ label: trans("button.prefixIcon") })}
            {props.children.suffixIcon.propertyView({ label: trans("button.suffixIcon") })}
          </Section>
          <Section name={sectionNames.style}>{props.children.style.getPropertyView()}</Section>
        </>
      )}
    </>
  );
});

const ButtonView = React.memo((props: ToViewReturn<ChildrenType>) => {
  const editorState = useContext(EditorContext);
  const mountedRef = useRef<boolean>(true);
  const handleClickEvent = useCompClickEventHandler({onEvent: props.onEvent});

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleClick = useCallback(() => {
    if (!mountedRef.current) return;
    
    try {
      if (isDefault(props.type)) {
        handleClickEvent();
      } else {
        submitForm(editorState, props.form);
      }
    } catch (error) {
      console.error("Error in button click handler:", error);
    }
  }, [props.type, props.onEvent, props.form, editorState]);

  return (
    <ButtonCompWrapper $disabled={props.disabled}>
      <EditorContext.Consumer>
        {(editorState) => (
          <Tooltip title={props.tooltip}>
            <Button100
              ref={props.viewRef}
              $buttonStyle={props.style}
              loading={props.loading}
              disabled={
                props.disabled ||
                (!isDefault(props.type) && getForm(editorState, props.form)?.disableSubmit())
              }
              onClick={handleClick}
            >
              {props.prefixIcon && <IconWrapper>{props.prefixIcon}</IconWrapper>}
              {
                props.text || (props.prefixIcon || props.suffixIcon ? undefined : " ") // Avoid button disappearing
              }
              {props.suffixIcon && <IconWrapper>{props.suffixIcon}</IconWrapper>}
            </Button100>
          </Tooltip>
        )}
      </EditorContext.Consumer>
    </ButtonCompWrapper>
  );
});

const buttonViewFn = (props: ToViewReturn<ChildrenType>) => <ButtonView {...props} />
const buttonPropertyViewFn = (children: ChildrenType) => <ButtonPropertyView children={children} />

const ButtonTmpComp = new UICompBuilder(childrenMap, buttonViewFn)
  .setPropertyViewFn(buttonPropertyViewFn)
  .setExposeMethodConfigs(buttonRefMethods)
  .build();

export const ButtonComp = withExposingConfigs(ButtonTmpComp, [
  new NameConfig("text", trans("button.textDesc")),
  new NameConfig("loading", trans("button.loadingDesc")),
  ...CommonNameConfig,
]);
