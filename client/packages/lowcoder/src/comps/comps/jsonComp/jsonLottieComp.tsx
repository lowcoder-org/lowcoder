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
import { stateComp, UICompBuilder, withDefault } from "../../generators";
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
import { useResizeDetector } from "react-resize-detector";
import { eventHandlerControl } from "@lowcoder-ee/comps/controls/eventHandlerControl";
import { withMethodExposing } from "@lowcoder-ee/comps/generators/withMethodExposing";
import { changeChildAction } from "lowcoder-core";

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
  {
    label: trans("jsonLottie.onTrigger"),
    value: "trigger",
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

const alignOptions = [
  { label: "None", value: "none" },
  { label: "Fill", value: "fill" },
  { label: "Cover", value: "cover" },
  { label: "Contain", value: "contain" },
  { label: "Fit Width", value: "fit-width" },
  { label: "Fit Height", value: "fit-height" },
] as const;

const fitOptions = [
  { label: "Top Left", value: "0,0" },
  { label: "Top Center", value: "0.5,0" },
  { label: "Top Right", value: "1,0" },
  { label: "Center Left", value: "0,0.5" },
  { label: "Center", value: "0.5,0.5" },
  { label: "Center Right", value: "1,0.5" },
  { label: "Bottom Left", value: "0,1" },
  { label: "Bottom Center", value: "0.5,1" },
  { label: "Bottom Right", value: "1,1" },
] as const;

const ModeOptions = [
  { label: "Lottie JSON", value: "standard" },
  { label: "Asset Library", value: "asset-library" }
] as const;

const EventOptions = [
  { label: trans("jsonLottie.load"), value: "load", description: trans("jsonLottie.load") },
  { label: trans("jsonLottie.play"), value: "play", description: trans("jsonLottie.play") },
  { label: trans("jsonLottie.pause"), value: "pause", description: trans("jsonLottie.pause") },
  { label: trans("jsonLottie.stop"), value: "stop", description: trans("jsonLottie.stop") },
  { label: trans("jsonLottie.complete"), value: "complete", description: trans("jsonLottie.complete") },
] as const;;

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
    autoHeight: withDefault(AutoHeightControl, "auto"),
    aspectRatio: withDefault(StringControl, "1/1"),
    fit: dropdownControl(alignOptions, "contain"),
    align: dropdownControl(fitOptions, "0.5,0.5"),
    onEvent: eventHandlerControl(EventOptions),
    dotLottieRef: stateComp<any | null>(null),
  };
  return new UICompBuilder(childrenMap, (props, dispatch) => {
    const [dotLottie, setDotLottie] = useState<DotLottie | null>(null);

    const setLayoutAndResize = () => {
      const align = props.align.split(',');
      dotLottie?.setLayout({fit: props.fit, align: [Number(align[0]), Number(align[1])]})
      dotLottie?.resize();
    }

    const { ref: wrapperRef } = useResizeDetector({
      onResize: () => {
        if (dotLottie) {
          setLayoutAndResize();
        }
      }
    });

    useEffect(() => {
      const onComplete = () => {
        props.keepLastFrame && dotLottie?.setFrame(100);
        props.onEvent('complete');
      }

      const onLoad = () => {
        setLayoutAndResize();
        props.onEvent('load');
      }

      const onPlay = () => {
        props.onEvent('play');
      }

      const onPause = () => {
        props.onEvent('pause');
      }

      const onStop = () => {
        props.onEvent('stop');
      }

      if (dotLottie) {
        dotLottie.addEventListener('complete', onComplete);
        dotLottie.addEventListener('load', onLoad);
        dotLottie.addEventListener('play', onPlay);
        dotLottie.addEventListener('pause', onPause);
        dotLottie.addEventListener('stop', onStop);
      }
  
      return () => {
        if (dotLottie) {
          dotLottie.removeEventListener('complete', onComplete);
          dotLottie.removeEventListener('load', onLoad);
          dotLottie.removeEventListener('play', onPlay);
          dotLottie.removeEventListener('pause', onPause);
          dotLottie.removeEventListener('stop', onStop);
        }
      };
    }, [dotLottie, props.keepLastFrame]);

    useEffect(() => {
      if (dotLottie) {
        setLayoutAndResize();
      }
    }, [dotLottie, props.fit, props.align, props.autoHeight]);

    return (
      <div
        ref={wrapperRef}
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
          }}
        >
          <DotLottiePlayer
            key={
              [props.speed, props.animationStart, props.loop, props.value, props.keepLastFrame] as any
            }
            dotLottieRefCallback={(lottieRef) => {
              setDotLottie(lottieRef);
              dispatch(
                changeChildAction("dotLottieRef", lottieRef as any, false)
              )
            }}
            autoplay={props.animationStart === "auto"}
            loop={props.loop === "single" ? false : true}
            speed={Number(props.speed)}
            data={props.sourceMode === 'standard' ? props.value as Record<string, undefined> : undefined}
            src={props.sourceMode === 'asset-library' ? props.iconScoutAsset?.value : undefined}
            style={{
              aspectRatio: props.aspectRatio,
            }}
            onMouseEnter={() => props.animationStart === "hover" && dotLottie?.play()}
            onMouseLeave={() => props.animationStart === "hover" && dotLottie?.pause()}
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
            {children.sourceMode.getView() === 'asset-library' && children.iconScoutAsset.propertyView({})}
          </Section>

          {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && (
            <><Section name={sectionNames.interaction}>
                {children.onEvent.getPropertyView()}
                {children.speed.propertyView({ label: trans("jsonLottie.speed")})}
                {children.loop.propertyView({ label: trans("jsonLottie.loop")})}
                {children.animationStart.propertyView({ label: trans("jsonLottie.animationStart")})}
                {hiddenPropertyView(children)}
                {children.keepLastFrame.propertyView({ label: trans("jsonLottie.keepLastFrame")})}
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
              {children.align.propertyView({ label: trans("jsonLottie.align")})}
              {children.fit.propertyView({ label: trans("jsonLottie.fit")})}
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

JsonLottieTmpComp = withMethodExposing(JsonLottieTmpComp, [
  {
    method: {
      name: "play",
      description: trans("jsonLottie.play"),
      params: [],
    },
    execute: (comp) => {
      (comp.children.dotLottieRef.value as unknown as DotLottie)?.play();
    },
  },
  {
    method: {
      name: "pause",
      description: trans("jsonLottie.pause"),
      params: [],
    },
    execute: (comp) => {
      (comp.children.dotLottieRef.value as unknown as DotLottie)?.pause();
    },
  },
  {
    method: {
      name: "stop",
      description: trans("jsonLottie.stop"),
      params: [],
    },
    execute: (comp) => {
      (comp.children.dotLottieRef.value as unknown as DotLottie)?.stop();
    },
  },
]);

export const JsonLottieComp = withExposingConfigs(JsonLottieTmpComp, [
  new NameConfig("value", trans("jsonLottie.valueDesc")),
  NameConfigHidden,
]);
