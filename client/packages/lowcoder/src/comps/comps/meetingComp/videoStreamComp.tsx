import {
  ArrayControl,
  ArrayOrJSONObjectControl,
  BoolCodeControl,
  JSONObjectArrayControl,
  NumberControl,
  StringControl,
} from "comps/controls/codeControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { ButtonEventHandlerControl } from "comps/controls/eventHandlerControl";
import { IconControl } from "comps/controls/iconControl";
import { CompNameContext, EditorContext, EditorState } from "comps/editorState";
import { withDefault } from "comps/generators";
import { UICompBuilder } from "comps/generators/uiCompBuilder";
import ReactResizeDetector from "react-resize-detector";
import _ from "lodash";
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
import { ButtonStyleControl } from "./videobuttonCompConstants";
import { RefControl } from "comps/controls/refControl";
import { useEffect, useRef, useState } from "react";

import { AutoHeightControl } from "comps/controls/autoHeightControl";
import {
  arrayStringExposingStateControl,
  booleanExposingStateControl,
  jsonObjectExposingStateControl,
  stringExposingStateControl,
  withMethodExposing,
} from "@lowcoder-ee/index.sdk";
// import useAgora from "@lowcoder-ee/comps/hooks/agoraFunctions";

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
    }
  `;
};
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

let VideoCompBuilder = (function (props) {
  const childrenMap = {
    autoHeight: withDefault(AutoHeightControl, "fixed"),
    type: dropdownControl(typeOptions, ""),
    onEvent: ButtonEventHandlerControl,
    disabled: BoolCodeControl,
    loading: BoolCodeControl,
    form: SelectFormControl,
    prefixIcon: IconControl,
    suffixIcon: IconControl,
    style: ButtonStyleControl,
    viewRef: RefControl<HTMLElement>,
    userId: stringExposingStateControl(
      "text",
      trans("meeting.userId", { name: "{{currentUser.name}}" })
    ),
  };
  return new UICompBuilder(childrenMap, (props) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const conRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      onResize();
    }, []);


    const onResize = async () => {
      const container = conRef.current;
      let videoCo = videoRef.current;
      videoCo!.style.height = container?.clientHeight + "px";
      videoCo!.style.width = container?.clientWidth + "px";
    };

    return (
      <EditorContext.Consumer>
        {(editorState) => (
          <ReactResizeDetector onResize={onResize}>
            <Container ref={conRef} $style={props.style}>
              <video
                ref={videoRef}
                style={{ width: 300, height: 300 }}
              ></video>
            </Container>
          </ReactResizeDetector>
        )}
      </EditorContext.Consumer>
    );
  })
    .setPropertyViewFn((children) => (
      <>
      </>
    ))
    .build();
})();

VideoCompBuilder = class extends VideoCompBuilder {
  override autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }
};


export const VideoMeetingComp = withExposingConfigs(VideoCompBuilder, [
  new NameConfig("loading", trans("button.loadingDesc")),
  ...CommonNameConfig,
]);
