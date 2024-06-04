import { CompAction, RecordConstructorToView, changeChildAction } from "lowcoder-core";
import { styleControl } from "comps/controls/styleControl";
import { AnimationStyle, AnimationStyleType, startButtonStyle, StartButtonStyleType, timerStyle, timerStyleType } from "comps/controls/styleControlConstants";
import { UICompBuilder } from "comps/generators/uiCompBuilder";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import { Section, sectionNames } from "lowcoder-design";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { Button, Space } from "antd";
import { countdownEvent, eventHandlerControl, pauseEvent, resetEvent, resumeEvent, startEvent } from "../controls/eventHandlerControl";
import styled from "styled-components";
import { useContext, useState, useEffect, useMemo } from "react";
import { stateComp } from "../generators";
import { EditorContext } from "comps/editorState";
import { dropdownControl } from "../controls/dropdownControl";
import { stringExposingStateControl } from "comps/controls/codeStateControl";
import { BoolControl } from "comps/controls/boolControl";

const Container = styled.div<{
  $style: timerStyleType | undefined;
  $animationStyle:AnimationStyleType;
}>`
  align-items: center;
  cursor: pointer;
  font-size: 2.9em;
  text-align: center;
  word-wrap: break-word;
  line-height: initial;
  ${props=>props.$animationStyle}
  background-color: ${props => props.$style?.background};
 font-weight: ${props=>props?.$style?.textWeight};
border-radius: ${props=>props?.$style?.radius};
font-size: ${props=>props?.$style?.textSize};
rotate: ${props=>props?.$style?.rotation};
text-transform: ${props=>props?.$style?.textTransform};
color: ${props=>props?.$style?.text};
border: ${props => props?.$style?.border};
border-style: ${props=>props?.$style?.borderStyle};
border-width: ${props=>props?.$style?.borderWidth};
font-family: ${props=>props?.$style?.fontFamily};
font-style: ${props=>props?.$style?.fontStyle};
margin: ${props=>props?.$style?.margin};
padding: ${props=>props?.$style?.padding};
background: ${props=>props?.$style?.background};
text-decoration: ${props=>props?.$style?.textDecoration};
`;

const ButtonWarrper = styled.div`
  width: 100%;
  min-height: 35px;
  display: flex;
  justify-content: center;
  padding-right: 15px;
  padding-bottom: 10px;
  margin-top: 10px;
`;

const StyledButton = styled(Button)<{ $style: StartButtonStyleType }>`
background-color: ${props=>props.$style.background};
font-weight: ${props=>props.$style.textWeight};
border-radius: ${props=>props.$style.radius};
font-size: ${props=>props.$style.textSize};
rotate: ${props=>props.$style.rotation};
text-transform: ${props=>props.$style.textTransform};
color: ${props=>props.$style.text};
border: ${props => props.$style.border};
border-style: ${props=>props.$style.borderStyle};
border-width: ${props=>props.$style.borderWidth};
font-family: ${props=>props.$style.fontFamily};
font-style: ${props=>props.$style.fontStyle};
margin: ${props=>props.$style.margin};
padding: ${props=>props.$style.padding};
background: ${props=>props.$style.background};
text-decoration: ${props=>props.$style.textDecoration};
`;



function formatTimeDifference(timeDifference: number) {
  // 计算时、分、秒、毫秒
  const hours = Math.floor(timeDifference / (1000 * 60 * 60));
  const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);
  const milliseconds = timeDifference % 1000;
  // 格式化时间差为文本
  const formattedTime = `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}:${padZero(milliseconds, 3)}`;
  return formattedTime;
}

// 辅助函数：补零
function padZero(number: number, length = 2) {
  return String(number).padStart(length, '0');
}

const EventOptions = [countdownEvent, startEvent, pauseEvent, resumeEvent, resetEvent] as const;

const timerTypeOptions = [
  { label: trans("timer.timer"), value: "timer" },
  { label: trans("timer.countdown"), value: "countdown" },
] as const;

const childrenMap = {
  style: styleControl(timerStyle),
  animationStyle: styleControl(AnimationStyle),
  startButtonStyle: styleControl(startButtonStyle),
  resetButtonStyle: styleControl(startButtonStyle),
  onEvent: eventHandlerControl(EventOptions),
  defaultValue: stringExposingStateControl("defaultValue", '00:00:00:000'),
  timerType: dropdownControl(timerTypeOptions, 'timer'),
  elapsedTime: stateComp<number>(0),
  timerState: stateComp<string>('stoped'),
  actionHandler: stateComp<string>(''),
  hideButton: BoolControl,
};

const AvatarGroupView = (props: RecordConstructorToView<typeof childrenMap> & { dispatch: (action: CompAction) => void; }) => {
  const [startTime, setStartTime] = useState(0)
  const [timerState, setTimerState] = useState('stoped')
  const [elapsedTime, setElapsedTime] = useState(0)
  const [intervalId, setIntervalId] = useState(0);
  const [buttonState, setButtonState] = useState(true);

  useEffect(() => {
    if (props.actionHandler != '') {
      if (props.actionHandler === 'start') startAction()
      else if (props.actionHandler === 'pause') pauseAction()
      else if (props.actionHandler === 'resume') resumeAction()
      else if (props.actionHandler === 'reset') resetAction()
      props.dispatch(changeChildAction("actionHandler", '', true));
    }
  }, [props.actionHandler])

  useEffect(() => {
    if (timerState === 'stoped') {
      setElapsedTime(getDefaultValueMS)
    }
  }, [props.defaultValue.value])

  useEffect(() => {
    if (timerState === 'started') {
      startTimer()
    }
  }, [startTime])

  useEffect(() => {
    if (timerState === 'stoped' && intervalId) {
      intervalId && clearInterval(intervalId)
    }
    props.dispatch(changeChildAction("timerState", timerState, false));
  }, [timerState])

  const getDefaultValueMS = useMemo(() => {
    const [HH, MM, SS, MS] = (props.defaultValue.value && props.defaultValue.value.split(':')) || [];
    let totleMS = parseInt(HH, 10) * 3600000 + parseInt(MM, 10) * 60000 + parseInt(SS, 10) * 1000 + parseInt(MS, 10)
    return isNaN(totleMS) ? 0 : totleMS;
  }, [props.defaultValue.value])

  const startTimer = () => {
    setIntervalId(
      Number(setInterval(() => {
        let temp = props.timerType === 'timer' ? Date.now() - startTime : getDefaultValueMS - (Date.now() - startTime)
        if (temp <= 0) {
          setTimerState('stoped')
          props.onEvent('countdown')
          setButtonState(false)
          temp = 0
        }
        setElapsedTime(temp)
        props.dispatch(changeChildAction("elapsedTime", temp, false));
      }, 18))
    )
  }
  const startAction = () => {
    setTimerState('started')
    props.onEvent('start')
    setStartTime(props.timerType === 'timer' ? Date.now() - getDefaultValueMS : Date.now())
  }

  const pauseAction = () => {
    intervalId && clearInterval(intervalId)
    setTimerState('paused')
    props.onEvent('pause')
  }

  const resumeAction = () => {
    setStartTime(props.timerType === 'timer' ? Date.now() - elapsedTime : Date.now() - (getDefaultValueMS - elapsedTime))
    setTimerState('started')
    props.onEvent('resume')
  }
  const resetAction = () => {
    intervalId && clearInterval(intervalId)
    setTimerState('stoped')
    setElapsedTime(getDefaultValueMS)
    setButtonState(true)
    props.onEvent('reset')
  }

  return (
    <Container $style={props.style} $animationStyle={props.animationStyle}>
      {formatTimeDifference(elapsedTime)}
      <ButtonWarrper hidden={props.hideButton}>
        <Space>
          <StyledButton
            $style={props.startButtonStyle}
            disabled={!buttonState}
            type={timerState === 'stoped' ? "primary" : 'default'}
            onClick={() => {
              if (timerState === 'stoped') startAction()
              else if (timerState === 'started') pauseAction()
              else if (timerState === 'paused') resumeAction()
            }}
          >{timerState === 'stoped' ? trans('timer.start') : (timerState === 'started' ? trans('timer.pause') : trans('timer.resume'))}</StyledButton>
          <StyledButton
          $style={props.resetButtonStyle}
          onClick={() => resetAction()}
          >{trans('timer.reset')}
          </StyledButton>
        </Space>
      </ButtonWarrper>
    </Container>
  );
};

let AvatarGroupBasicComp = (function () {
  return new UICompBuilder(childrenMap, (props, dispatch) => <AvatarGroupView {...props} dispatch={dispatch} />)
    .setPropertyViewFn((children) => (
      <>
        {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <>
            <Section name={sectionNames.basic}>
              {children.timerType.propertyView({
                label: trans('timer.timerType')
              })}
              {children.defaultValue.propertyView({
                label: trans('timer.defaultValue')
              })}
              {children.hideButton.propertyView({
                label: trans('timer.hideButton')
              })}
            </Section>
            <Section name={sectionNames.interaction}>
              {hiddenPropertyView(children)}
              {children.onEvent.propertyView()}
            </Section>
          </>
        )}

        {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <>
          <Section name={sectionNames.style}>
            {children.style.getPropertyView()}
          </Section>
          <Section name={sectionNames.animationStyle} hasTooltip={true}>
            {children.animationStyle.getPropertyView()}
          </Section>
          <Section name={sectionNames.startButtonStyle}>
            {children.startButtonStyle.getPropertyView()}
          </Section>
          <Section name={sectionNames.resetButtonStyle}>
            {children.resetButtonStyle.getPropertyView()}
          </Section>
          </>
        )}
      </>
    ))
    .setExposeMethodConfigs([
      {
        method: {
          name: "start/pause",
          description: trans("timer.startPause"),
          params: [],
        },
        execute: async (comp, params) => {
          if (comp.children.timerState.value === 'stoped')
            comp.children.actionHandler.dispatch(comp.children.actionHandler.changeValueAction('start'))
          else if (comp.children.timerState.value === 'paused')
            comp.children.actionHandler.dispatch(comp.children.actionHandler.changeValueAction('resume'))
          else if (comp.children.timerState.value === 'started')
            comp.children.actionHandler.dispatch(comp.children.actionHandler.changeValueAction('pause'))
        },
      },
      {
        method: {
          name: "reset",
          description: trans("timer.reset"),
          params: [],
        },
        execute: async (comp, params) => {
          comp.children.actionHandler.dispatch(comp.children.actionHandler.changeValueAction('reset'))
        },
      },
    ])
    .build();
})();

export const TimerComp = withExposingConfigs(AvatarGroupBasicComp, [
  new NameConfig("defaultValue", trans("timer.defaultValue")),
  new NameConfig("elapsedTime", trans("timer.elapsedTime")),
  new NameConfig("timerState", trans("timer.timerState")),
  NameConfigHidden,
]);
