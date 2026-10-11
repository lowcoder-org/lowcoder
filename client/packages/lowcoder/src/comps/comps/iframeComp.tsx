import { UICompBuilder, withDefault } from "../generators";
import { Section, sectionNames } from "lowcoder-design";
import { StringControl } from "../controls/codeControl";
import { BoolControl } from "../controls/boolControl";
import styled from "styled-components";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "../generators/withExposing";
import { styleControl } from "comps/controls/styleControl";
import { AnimationStyle, AnimationStyleType, IframeStyle, IframeStyleType } from "comps/controls/styleControlConstants";
import { hiddenPropertyView, showDataLoadingIndicatorsPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";

import { useEditorStore } from "comps/editorStore";

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

export function getIframeSrc(url: string): string {
  const value = url.trim();
  if (!value) {
    return "about:blank";
  }

  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(value);
  const isRelativeUrl =
    value.startsWith("/") || value.startsWith("./") || value.startsWith("../");
  if (!hasScheme && !isRelativeUrl) {
    return "about:blank";
  }

  try {
    const parsedUrl = new URL(value, "https://lowcoder.local");
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:"
      ? value
      : "about:blank";
  } catch {
    return "about:blank";
  }
}

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

    const src = getIframeSrc(props.url);
    return (
      <Wrapper $style={props.style} $animationStyle={props.animationStyle}>
        <iframe src={src} sandbox={sandbox.join(" ")} allow={allow.join(";")} />
      </Wrapper>
    );
  }
)
  .setPropertyViewFn((children) => {
    const editorModeStatus = useEditorStore((state) => state.editorModeStatus);
    return (
    <>
      <Section name={sectionNames.basic}>
        {children.url.propertyView({ label: "Source URL", placeholder: "https://example.com", tooltip: trans("iframe.URLDesc") })}
      </Section>

      {["logic", "both"].includes(editorModeStatus) && (
        <Section name={sectionNames.interaction}>
          {hiddenPropertyView(children)}
          {children.allowDownload.propertyView({ label: trans("iframe.allowDownload") })}
          {children.allowSubmitForm.propertyView({ label: trans("iframe.allowSubmitForm") })}
          {children.allowMicrophone.propertyView({ label: trans("iframe.allowMicrophone") })}
          {children.allowCamera.propertyView({ label: trans("iframe.allowCamera") })}
          {children.allowPopup.propertyView({ label: trans("iframe.allowPopup") })}
          {showDataLoadingIndicatorsPropertyView(children)}
        </Section>
      )}

      {["layout", "both"].includes(editorModeStatus) && (
        <>
        <Section name={sectionNames.style}>
          {children.style.getPropertyView()}
        </Section>
        <Section name={sectionNames.animationStyle} hasTooltip={true}>
          {children.animationStyle.getPropertyView()}
          </Section>
        </>
      )}
    </>
  );
  })
  .build();

IFrameCompBase = class extends IFrameCompBase {
  override autoHeight(): boolean {
    return false;
  }
};

export const IFrameComp = withExposingConfigs(IFrameCompBase, [
  new NameConfig("url", trans("iframe.URLDesc")),
  NameConfigHidden,
]);
