import { hiddenPropertyView, showDataLoadingIndicatorsPropertyView } from "comps/utils/propertyUtils";
import {
  ArrayOrJSONObjectControl,
  NumberControl,
  StringControl,
} from "comps/controls/codeControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { BoolControl } from "comps/controls/boolControl";
import { styleControl } from "comps/controls/styleControl";
import { AnimationStyle, LottieStyle } from "comps/controls/styleControlConstants";
import { trans } from "i18n";
import { Section, sectionNames } from "lowcoder-design";
import { useContext, lazy, useEffect, useState } from "react";  
import { UICompBuilder, withDefault } from "../../generators";
import {
  NameConfig,
  NameConfigHidden,
  withExposingConfigs,
} from "../../generators/withExposing";
import { defaultLottie } from "./jsonConstants";
import { EditorContext } from "comps/editorState";
import { AssetType, IconscoutControl } from "@lowcoder-ee/comps/controls/iconscoutControl";
import { DotLottie } from "@lottiefiles/dotlottie-react";
import { AutoHeightControl } from "@lowcoder-ee/comps/controls/autoHeightControl";

// const Player = lazy(
//   () => import('@lottiefiles/react-lottie-player')
//     .then(module => ({default: module.Player}))
// );

const DotLottiePlayer = lazy(
  () => import('@lottiefiles/dotlottie-react')
    .then(module => ({default: module.DotLottieReact}))
);

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
    value: "hover",
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

const ModeOptions = [
  { label: "Lottie JSON", value: "standard" },
  { label: "Asset Library", value: "asset-library" }
] as const;

let JsonLottieTmpComp = (function () {
  const childrenMap = {
    sourceMode: dropdownControl(ModeOptions, "standard"),
    value: withDefault(
      ArrayOrJSONObjectControl,
      JSON.stringify(defaultLottie, null, 2)
    ),
    iconScoutAsset: IconscoutControl(AssetType.LOTTIE),
    speed: dropdownControl(speedOptions, "1"),
    width: withDefault(NumberControl, 100),
    height: withDefault(NumberControl, 100),
    container: styleControl(LottieStyle , 'container'),
    animationStyle: styleControl(AnimationStyle , 'animationStyle'),
    animationStart: dropdownControl(animationStartOptions, "auto"),
    loop: dropdownControl(loopOptions, "single"),
    keepLastFrame: BoolControl.DEFAULT_TRUE,
    autoHeight: withDefault(AutoHeightControl, "fixed"),
    aspectRatio: withDefault(StringControl, "16 / 9"),
  };
  return new UICompBuilder(childrenMap, (props, dispatch) => {
    const [dotLottie, setDotLottie] = useState<DotLottie | null>(null);
    
    useEffect(() => {
      const onComplete = () => {
        props.keepLastFrame && dotLottie?.setFrame(100);
      }

      if (dotLottie) {
        dotLottie.addEventListener('complete', onComplete);
      }
  
      return () => {
        if (dotLottie) {
          dotLottie.removeEventListener('complete', onComplete);
        }
      };
    }, [dotLottie, props.keepLastFrame]);

    return (
      <div
        style={{
          height: '100%',
          padding: `${props.container.margin}`,
          animation: props.animationStyle.animation,
          animationDelay: props.animationStyle.animationDelay,
          animationDuration: props.animationStyle.animationDuration,
          animationIterationCount: props.animationStyle.animationIterationCount,
        }}
      >
        <div
          style={{
            height: "100%",
            display: "flex",
            justifyContent: "center",
            background: `${props.container.background}`,
            padding: `${props.container.padding}`,
            rotate: props.container.rotation,
            aspectRatio: props.aspectRatio,
          }}
        >
          <DotLottiePlayer
            key={
              [props.speed, props.animationStart, props.loop, props.value, props.keepLastFrame] as any
            }
            dotLottieRefCallback={setDotLottie}
            autoplay={props.animationStart === "auto"}
            loop={props.loop === "single" ? false : true}
            speed={Number(props.speed)}
            data={props.sourceMode === 'standard' ? props.value as Record<string, undefined> : undefined}
            src={props.sourceMode === 'asset-library' ? props.iconScoutAsset?.value : undefined}
            style={{
              height: "100%",
              width: "100%",
              maxWidth: "100%",
              maxHeight: "100%",
            }}
            onMouseEnter={() => props.animationStart === "hover" && dotLottie?.play()}
            onMouseLeave={() => props.animationStart === "hover" && dotLottie?.pause()}
            renderConfig={{
              autoResize: props.autoHeight,
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
            { children.sourceMode.propertyView({
              label: "",
              radioButton: true
            })}
            {children.sourceMode.getView() === 'standard' && children.value.propertyView({
              label: trans("jsonLottie.lottieJson"),
            })}
            {children.sourceMode.getView() === 'asset-library' && children.iconScoutAsset.propertyView({
              label: "Lottie Source",
            })}
          </Section>

          {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && (
            <><Section name={sectionNames.interaction}>
                {children.speed.propertyView({ label: trans("jsonLottie.speed")})}
                {children.loop.propertyView({ label: trans("jsonLottie.loop")})}
                {children.animationStart.propertyView({ label: trans("jsonLottie.animationStart")})}
                 {children.keepLastFrame.propertyView({ label: trans("jsonLottie.keepLastFrame")})}
                {hiddenPropertyView(children)}
                {showDataLoadingIndicatorsPropertyView(children)}
              </Section>
            </>
          )}

          {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
            <Section name={sectionNames.layout}>
              {children.autoHeight.getPropertyView()}
              {children.aspectRatio.propertyView({
                label: trans("style.aspectRatio"),
              })}
            </Section>
          )}

          {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && (
            <>
              <Section name={sectionNames.style}>
                {children.container.getPropertyView()}
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
})();
JsonLottieTmpComp = class extends JsonLottieTmpComp {
  override autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }
};
export const JsonLottieComp = withExposingConfigs(JsonLottieTmpComp, [
  new NameConfig("value", trans("jsonLottie.valueDesc")),
  NameConfigHidden,
]);
