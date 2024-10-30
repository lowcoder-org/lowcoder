import styled from "styled-components";
import { eventHandlerControl } from "../../controls/eventHandlerControl";
import { StringStateControl } from "../../controls/codeStateControl";
import { UICompBuilder } from "../../generators";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "../../generators/withExposing";
import { RecordConstructorToView } from "lowcoder-core";
import { styleControl } from "comps/controls/styleControl";
import { AnimationStyle, AnimationStyleType, AudioStyle } from "comps/controls/styleControlConstants";
import { TacoAudio } from "lowcoder-design";
import { BoolControl } from "comps/controls/boolControl";
import { withDefault } from "../../generators/simpleGenerators";
import { trans } from "i18n";
import { mediaCommonChildren, mediaMethods } from "./mediaUtils";
import React from "react";
import {viewMode} from "@lowcoder-ee/util/editor";
const PropertyViewAudioComp =  React.lazy( async () => await import("./propertyView").then(module => ({default: module.PropertyViewAudioComp})))

const Container = styled.div<{ $style: any; $animationStyle: AnimationStyleType }>`
${props => props.$style};
rotate:${props => props.$style.rotation};
${props=>props.$animationStyle};
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  div > audio {
    object-fit: contain;
    pointer-events: auto;
    height: 100%;
    width: 100%;
    :focus-visible {
      outline: 0px;
    }
  }
`;

const EventOptions = [
  { label: trans("audio.play"), value: "play", description: trans("audio.playDesc") },
  { label: trans("audio.pause"), value: "pause", description: trans("audio.pauseDesc") },
  { label: trans("audio.ended"), value: "ended", description: trans("audio.endedDesc") },
] as const;

const ContainerAudio = (props: RecordConstructorToView<typeof childrenMap>) => {
  return (
    <Container
      ref={props.containerRef}
      $style={props.style}
      $animationStyle={props.animationStyle}
    >
      <TacoAudio
        audioRef={props.viewRef}
        url={props.src.value}
        onPlay={() => props.onEvent("play")}
        onPause={() => props.onEvent("pause")}
        onEnded={() => props.onEvent("ended")}
        autoPlay={props.autoPlay}
        loop={props.loop}
      />
    </Container>
  );
};

const childrenMap = {
  src: withDefault(StringStateControl, trans("audio.defaultSrcUrl")),
  onEvent: eventHandlerControl(EventOptions),
  style: styleControl(AudioStyle , 'style'),
  animationStyle: styleControl(AnimationStyle , 'animationStyle'),
  autoPlay: BoolControl,
  loop: BoolControl,
  ...mediaCommonChildren,
};

let AudioBasicComp = (function () {
  let builder = new UICompBuilder(childrenMap, (props) => {
    return <ContainerAudio {...props} />;
  })
    if (viewMode() === "edit") {
        builder.setPropertyViewFn((children) => <PropertyViewAudioComp {...children}></PropertyViewAudioComp>);
    }
      return builder
    .setExposeMethodConfigs(mediaMethods())
    .build();
})();

export const AudioComp = withExposingConfigs(AudioBasicComp, [
  new NameConfig("src", trans("audio.srcDesc")),
  NameConfigHidden,
]);
