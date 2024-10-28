import { UICompBuilder, withDefault } from "../generators";
import { StringControl } from "../controls/codeControl";
import { BoolControl } from "../controls/boolControl";
import styled from "styled-components";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "../generators/withExposing";
import { styleControl } from "comps/controls/styleControl";
import { AnimationStyle, AnimationStyleType, IframeStyle, IframeStyleType } from "comps/controls/styleControlConstants";
import { trans } from "i18n";
import log from "loglevel";
import React from "react";
import {viewMode} from "@lowcoder-ee/util/editor";
const SetPropertyViewFn =  React.lazy( async () => await import("./setProperty/iframeComp"));
const Wrapper = styled.div<{$style: IframeStyleType; $animationStyle:AnimationStyleType}>`
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: ${(props) =>
      props.$style.borderWidth ? props.$style.borderWidth : '1px'}
    solid ${(props) => props.$style.border};
  border-radius: calc(min(${(props) => props.$style.radius}, 20px));
rotate:${props => props.$style.rotation};
margin:${props => props.$style.margin};
padding:${props => props.$style.padding};
${props=>props.$animationStyle}
  iframe {
    border: 0;
    width: 100%;
    height: 100%;
    display: block;
    background: ${(props) => props.$style.background};
  }
`;

const regex =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)/g;

let IFrameCompBase = new UICompBuilder(
  {
    url: StringControl,
    allowDownload: BoolControl,
    allowSubmitForm: BoolControl,
    allowMicrophone: BoolControl,
    allowCamera: BoolControl,
    allowPopup: BoolControl,
    style: styleControl(IframeStyle , 'style'),
    animationStyle: styleControl(AnimationStyle , 'animationStyle'),
  },
  (props) => {
    const sandbox = ["allow-scripts", "allow-same-origin"];
    props.allowSubmitForm && sandbox.push("allow-forms");
    props.allowDownload && sandbox.push("allow-downloads");
    props.allowPopup && sandbox.push("allow-popups");

    const allow = [];
    props.allowCamera && allow.push("camera");
    props.allowMicrophone && allow.push("microphone");

    const src = regex.test(props.url) ? props.url : "about:blank";
    log.log(props.url, regex.test(props.url) ? props.url : "about:blank", src);
    return (
      <Wrapper $style={props.style} $animationStyle={props.animationStyle}>
        <iframe src={src} sandbox={sandbox.join(" ")} allow={allow.join(";")} />
      </Wrapper>
    );
  }
)

if (viewMode() === "edit") {
    IFrameCompBase.setPropertyViewFn((children) => <SetPropertyViewFn {...children}></SetPropertyViewFn>);
}

const IFrameCompBaseBuilder =  IFrameCompBase.build();

const IFrameCompBaseTmp = class extends IFrameCompBaseBuilder {
  override autoHeight(): boolean {
    return false;
  }
};

export const IFrameComp = withExposingConfigs(IFrameCompBaseTmp, [
  new NameConfig("url", trans("iframe.URLDesc")),
  NameConfigHidden,
]);
