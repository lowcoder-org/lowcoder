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
    appId: withDefault(StringControl, trans("prop.appid")), ///
    videokey: withDefault(StringControl, trans("prop.videokey")),
    participants: arrayStringExposingStateControl("participants"),
    userId: stringExposingStateControl(
      "text",
      trans("meeting.userId", { name: "{{currentUser.name}}" })
    ),
  };
  // const { client, videoHeight, videoWidth, setHeight, setWidth } = useAgora();

  return new UICompBuilder(childrenMap, (props) => {
    console.log("userId", props.userId.value);
    //   "afd10eabe68a4de68a76461be92c693c"
    const videoRef = useRef<HTMLVideoElement>(null);
    const conRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      onResize();
    }, []);

    useEffect(() => {
      if (props.participants.value.length > 0) {
        console.log("bbb", props.participants.value);
      }
    }, [props.participants.value]);

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
                id={props.videokey}
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
        {/* <Section name={sectionNames.settings}>
          {children.userId.propertyView({
            label: trans("meeting.userId"),
          })}
          {children.autoHeight.getPropertyView()}
          {children.videokey.propertyView({
            label: trans("prop.videokey"),
          })}
        </Section> */}
        {/* <Section name={sectionNames.layout}>
          {/* {hiddenPropertyView(children)} 
        </Section> */}

        {/* <Section name={sectionNames.interaction}>
          {children.type.propertyView({
            label: trans("prop.type"),
            radioButton: true,
          })} */}
        {/* {isDefault(children.type.getView())
            ? [
                children.onEvent.getPropertyView(),
                disabledPropertyView(children),
                loadingPropertyView(children),
              ]  
            : children.form.getPropertyView()} */}
        {/* </Section> */}

        {/* <Section name={sectionNames.layout}>
          {children.prefixIcon.propertyView({
            label: trans("button.prefixIcon"),
          })}
          {children.suffixIcon.propertyView({
            label: trans("button.suffixIcon"),
          })}
          {hiddenPropertyView(children)}
        </Section>

        <Section name={sectionNames.style}>
          {children.style.getPropertyView()}
        </Section> */}
      </>
    ))
    .build();
})();

VideoCompBuilder = class extends VideoCompBuilder {
  override autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }
};

VideoCompBuilder = withMethodExposing(VideoCompBuilder, [
  {
    method: {
      name: "audioControl",
      description: trans("meeting.actionBtnDesc"),
      params: [],
    },
    execute: (comp, values) => {
      // let value = !comp.children.audioControl.getView().value;
      // turnOnMicrophone(value);
      // comp.children.audioControl.change(value);
    },
  },
  // {
  //   method: {
  //     name: "videoControl",
  //     description: trans("meeting.actionBtnDesc"),
  //     params: [],
  //   },
  //   execute: (comp, values) => {
  //     let value = !comp.children.videoControl.getView().value;
  //     turnOnCamera(value);
  //     comp.children.videoControl.change(value);
  //   },
  // },
  // {
  //   method: {
  //     name: "startMeeting",
  //     description: trans("meeting.actionBtnDesc"),
  //     params: [],
  //   },
  //   execute: (comp, values) => {
  //     publishVideo(comp.children.appId.getView(), "testsdaadasdsa");
  //   },
  // },
  // {
  //   method: {
  //     name: "endCall",
  //     description: trans("meeting.actionBtnDesc"),
  //     params: [],
  //   },
  //   execute: (comp, values) => {
  //     let value = !comp.children.endCall.getView().value;
  //     leaveChannel();
  //     comp.children.endCall.change(value);
  //   },
  // },
]);

export const VideoMeetingComp = withExposingConfigs(VideoCompBuilder, [
  // new NameConfig("appId", trans("button.textDesc")),
  new NameConfig("loading", trans("button.loadingDesc")),
  ...CommonNameConfig,
]);
