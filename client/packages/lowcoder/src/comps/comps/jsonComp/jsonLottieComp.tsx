import { Player } from "@lottiefiles/react-lottie-player";
import { hiddenPropertyView } from "@lowcoder-ee/index.sdk";
import {
  ArrayOrJSONObjectControl,
  NumberControl,
} from "comps/controls/codeControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { BoolControl } from "comps/controls/boolControl";
import { styleControl } from "comps/controls/styleControl";
import { LottieStyle } from "comps/controls/styleControlConstants";
import { trans } from "i18n";
import { Section, sectionNames } from "lowcoder-design";
import { useEffect, useState, useContext } from "react";  
import { UICompBuilder, withDefault } from "../../generators";
import {
  NameConfig,
  NameConfigHidden,
  withExposingConfigs,
} from "../../generators/withExposing";
import { defaultLottie } from "./jsonConstants";
import { EditorContext } from "comps/editorState";

/**
 * JsonLottie Comp
 */
const animationStartOptions = [
  {
    label: trans("jsonLottie.auto"),
    value: "auto",
  },
  {
    label: trans("jsonLottie.onHover"),
    value: "on hover",
  },
] as const;

const loopOptions = [
  {
    label: trans("jsonLottie.singlePlay"),
    value: "single",
  },
  {
    label: trans("jsonLottie.endlessLoop"),
    value: "endless",
  },
] as const;

const speedOptions = [
  {
    label: "0.5x",
    value: "0.5",
  },
  {
    label: "0.75x",
    value: "0.75",
  },
  {
    label: "1x",
    value: "1",
  },
  {
    label: "1.5x",
    value: "1.5",
  },
  {
    label: "2x",
    value: "2",
  },
  {
    label: "2.5x",
    value: "2.5",
  },
  {
    label: "5x",
    value: "5",
  },
  {
    label: "10x",
    value: "10",
  },
] as const;

let JsonLottieTmpComp = (function () {
  const childrenMap = {
    value: withDefault(
      ArrayOrJSONObjectControl,
      JSON.stringify(defaultLottie, null, 2)
    ),
    speed: dropdownControl(speedOptions, "1"),
    width: withDefault(NumberControl, 100),
    height: withDefault(NumberControl, 100),
    container: styleControl(LottieStyle),
    animationStart: dropdownControl(animationStartOptions, "auto"),
    loop: dropdownControl(loopOptions, "single"),
    keepLastFrame: BoolControl.DEFAULT_TRUE,
  };
  return new UICompBuilder(childrenMap, (props) => {
    return (
      <div style={{
        padding: `${props.container.margin}`,
      }}>
        <div
          style={{
            height: "100%",
            display: "flex",
            justifyContent: "center",
            backgroundColor: `${props.container.background}`,
            padding: `${props.container.padding}`
          }}
        >
          <Player
            key={
              [props.speed, props.animationStart, props.loop, props.value, props.keepLastFrame] as any
            }
            keepLastFrame={props.keepLastFrame}
            autoplay={props.animationStart === "auto" && true}
            hover={props.animationStart === "on hover" && true}
            loop={props.loop === "single" ? false : true}
            speed={Number(props.speed)}
            src={props.value}
            style={{
              height: "100%",
              width: "100%",
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          />
        </div>
      </div>
    );
  })
    .setPropertyViewFn((children) => {
      return (
        <>
          <Section name={sectionNames.basic}>
            {children.value.propertyView({
              label: trans("jsonLottie.lottieJson"),
            })}
          </Section>

          {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && (
            <><Section name={sectionNames.interaction}>
                {children.speed.propertyView({ label: trans("jsonLottie.speed")})}
                {children.loop.propertyView({ label: trans("jsonLottie.loop")})}
                {children.animationStart.propertyView({ label: trans("jsonLottie.animationStart")})}
                {children.keepLastFrame.propertyView({ label: trans("jsonLottie.keepLastFrame")})}
                {hiddenPropertyView(children)}
              </Section>
            </>
          )}

          {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && (
            <>
              <Section name={sectionNames.style}>
                {children.container.getPropertyView()}
              </Section>
            </>
          )}

        </>
      );
    })
    .build();
})();
JsonLottieTmpComp = class extends JsonLottieTmpComp {
  override autoHeight(): boolean {
    return false;
  }
};
export const JsonLottieComp = withExposingConfigs(JsonLottieTmpComp, [
  new NameConfig("value", trans("jsonLottie.valueDesc")),
  NameConfigHidden,
]);
