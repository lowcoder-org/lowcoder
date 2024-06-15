import { RecordConstructorToView } from "lowcoder-core";
import { BoolControl } from "comps/controls/boolControl";
import { stringExposingStateControl } from "comps/controls/codeStateControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { styleControl } from "comps/controls/styleControl";
import { AnimationStyle, QRCodeStyle, heightCalculator,	widthCalculator } from "comps/controls/styleControlConstants";
import { UICompBuilder } from "comps/generators/uiCompBuilder";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import { Section, sectionNames } from "lowcoder-design";
import { QRCodeSVG } from "qrcode.react";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { StringControl } from "comps/controls/codeControl";

import { useContext } from "react";
import { EditorContext } from "comps/editorState";
import { withDefault } from "../generators";

// TODO: add styling for image (size)
// TODO: add styling for bouding box (individual backround)

const levelOptions = [
  { label: trans("QRCode.L"), value: "L" },
  { label: trans("QRCode.M"), value: "M" },
  { label: trans("QRCode.Q"), value: "Q" },
  { label: trans("QRCode.H"), value: "H" },
] as const;

const childrenMap = {
  value: stringExposingStateControl('value'),
  level: dropdownControl(levelOptions, 'L'),
  includeMargin: BoolControl.DEFAULT_TRUE,
  image: StringControl,
  style: withDefault(styleControl(QRCodeStyle),{background:'transparent'}),
  animationStyle: styleControl(AnimationStyle),
  restrictPaddingOnRotation: withDefault(StringControl, 'qrCode'),
};

const QRCodeView = (props: RecordConstructorToView<typeof childrenMap>) => {
  const value = props.value.value;
  // https://github.com/zpao/qrcode.react/issues/69
  if (value.length > 2953) {
    return <>{trans("QRCode.maxLength")}</>;
  }
  return (
    <div
      style={{
        margin: props.style.margin,
        padding: props.includeMargin ? props.style.padding : 0,
        width: widthCalculator(props.style.margin),
        height: heightCalculator(props.style.margin),
        background: props.style.background,
        borderRadius: props.style.radius,
        border: `${props.style.borderWidth ? props.style.borderWidth : "1px"} solid ${
          props.style.border
          }`,
        rotate: props.style.rotation,
        animation: props.animationStyle.animation,
        animationDelay: props.animationStyle.animationDelay,
        animationDuration: props.animationStyle.animationDuration,
        animationIterationCount:props.animationStyle.animationIterationCount
      }}
    >
      <QRCodeSVG
        value={value}
        level={props.level}
        width="100%"
        height="100%"
        bgColor={props.style.background}
        fgColor={props.style.color}
        includeMargin={false}
        imageSettings={
          props.image ? { src: props.image, width: 0, height: 0, excavate: true } : undefined
        }
      />
    </div>
  );
};

let QRCodeBasicComp = (function () {
  return new UICompBuilder(childrenMap, (props) => <QRCodeView {...props} />)
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.value.propertyView({
            label: trans("QRCode.value"),
            tooltip: trans("QRCode.valueTooltip"),
            placeholder: "https://example.com",
          })}
        </Section>

        {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <><Section name={sectionNames.interaction}>
              {hiddenPropertyView(children)}
            </Section>
            <Section name={sectionNames.advanced}>
              {children.level.propertyView({
                label: trans("QRCode.level"),
                tooltip: trans("QRCode.levelTooltip"),
              })}
              {children.image.propertyView({
                label: trans("QRCode.image"),
                placeholder: "http://logo.jpg",
              })}
            </Section>
          </>
        )}

        {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <>
            <Section name={sectionNames.style}>
            {children.style.getPropertyView()}
            {children.includeMargin.propertyView({ label: trans("QRCode.includeMargin") })}
            </Section>
            <Section name={sectionNames.animationStyle} hasTooltip={true}>
            {children.animationStyle.getPropertyView()}
            </Section>
          </>
        )}
      </>
    ))
    .build();
})();

QRCodeBasicComp = class extends QRCodeBasicComp {
  override autoHeight(): boolean {
    return false;
  }
};

export const QRCodeComp = withExposingConfigs(QRCodeBasicComp, [
  new NameConfig("value", trans("QRCode.valueDesc")),
  NameConfigHidden,
]);
