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
import { useContext, lazy, useEffect } from "react";  
import { UICompBuilder, withDefault } from "../../generators";
import {
  NameConfig,
  NameConfigHidden,
  withExposingConfigs,
} from "../../generators/withExposing";
import { defaultLottie } from "./jsonConstants";
import { EditorContext } from "comps/editorState";
import { IconScoutAssetType, IconscoutControl } from "@lowcoder-ee/comps/controls/iconscoutControl";
import { isEmpty } from "lodash";
import IconscoutApi from "@lowcoder-ee/api/iconscoutApi";
import { changeValueAction, multiChangeAction } from "lowcoder-core";

const Player = lazy(
  () => import('@lottiefiles/react-lottie-player')
    .then(module => ({default: module.Player}))
);

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

const ModeOptions = [
  { label: "Lottie JSON", value: "standard" },
  { label: "DotLottie", value: "dotLottie" },
  { label: "IconScout", value: "advanced" },
] as const;

let JsonLottieTmpComp = (function () {
  const childrenMap = {
    sourceMode: dropdownControl(ModeOptions, "standard"),
    value: withDefault(
      ArrayOrJSONObjectControl,
      JSON.stringify(defaultLottie, null, 2)
    ),
    srcIconScout: IconscoutControl(IconScoutAssetType.LOTTIE),
    srcDotLottie: withDefault(StringControl, 'https://assets-v2.lottiefiles.com/a/9e7d8a50-1180-11ee-89a6-3b0ab1ca8a0e/hUfEwc6xNt.lottie'),
    uuidIconScout: StringControl,
    valueIconScout: withDefault(ArrayOrJSONObjectControl, JSON.stringify({})),
    speed: dropdownControl(speedOptions, "1"),
    width: withDefault(NumberControl, 100),
    height: withDefault(NumberControl, 100),
    container: styleControl(LottieStyle , 'container'),
    animationStyle: styleControl(AnimationStyle , 'animationStyle'),
    animationStart: dropdownControl(animationStartOptions, "auto"),
    loop: dropdownControl(loopOptions, "single"),
    keepLastFrame: BoolControl.DEFAULT_TRUE,
  };
  return new UICompBuilder(childrenMap, (props, dispatch) => {

    const downloadAsset = async (uuid: string) => {
      try {
        const result = await IconscoutApi.download(uuid, {
          format: 'ai',
        });
        if (result && result.download_url) {
          const json = await IconscoutApi.downloadJSON(result.download_url);
          dispatch(
            multiChangeAction({
              uuidIconScout: changeValueAction(uuid, true),
              valueIconScout: changeValueAction(JSON.stringify(json, null, 2), true)
            })
          ) 
        }
      } catch(error) {
        console.error(error);
      }

    }
    useEffect(() => {
      if(props.srcIconScout?.uuid && props.srcIconScout?.uuid !== props.uuidIconScout) {
        // get asset download link
        downloadAsset(props.srcIconScout?.uuid);
      }
    }, [props.srcIconScout]);

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
          }}
        >
          {props.sourceMode === 'dotLottie'
            ? (
              <DotLottiePlayer
                key={
                  [props.speed, props.animationStart, props.loop, props.value, props.keepLastFrame] as any
                }
                // keepLastFrame={props.keepLastFrame}
                autoplay={props.animationStart === "auto" && true}
                playOnHover={props.animationStart === "on hover" && true}
                loop={props.loop === "single" ? false : true}
                speed={Number(props.speed)}
                src={props.srcDotLottie}
                style={{
                  height: "100%",
                  width: "100%",
                  maxWidth: "100%",
                  maxHeight: "100%",
                }}
              />
            )
            : (
              <Player
                key={
                  [props.speed, props.animationStart, props.loop, props.value, props.keepLastFrame] as any
                }
                keepLastFrame={props.keepLastFrame}
                autoplay={props.animationStart === "auto" && true}
                hover={props.animationStart === "on hover" && true}
                loop={props.loop === "single" ? false : true}
                speed={Number(props.speed)}
                src={
                  props.sourceMode === 'advanced'
                  ? (isEmpty(props.valueIconScout) ? '' : props.valueIconScout)
                  : props.value
                }
                style={{
                  height: "100%",
                  width: "100%",
                  maxWidth: "100%",
                  maxHeight: "100%",
                }}
              />
            )
          }
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
            {children.sourceMode.getView() === 'dotLottie' && children.srcDotLottie.propertyView({
              label: "Source",
            })}
            {children.sourceMode.getView() === 'advanced' && children.srcIconScout.propertyView({
              label: "Lottie Source",
            })}
            {children.sourceMode.getView() === 'advanced' && children.valueIconScout.propertyView({
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
                {showDataLoadingIndicatorsPropertyView(children)}
              </Section>
            </>
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
    return false;
  }
};
export const JsonLottieComp = withExposingConfigs(JsonLottieTmpComp, [
  new NameConfig("value", trans("jsonLottie.valueDesc")),
  NameConfigHidden,
]);
