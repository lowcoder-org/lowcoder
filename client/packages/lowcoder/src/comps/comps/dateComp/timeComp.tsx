import _ from "lodash";
import dayjs from "dayjs";
import { RecordConstructorToComp, RecordConstructorToView } from "lowcoder-core";
import {
  BoolCodeControl,
  CustomRuleControl,
  RangeControl,
  StringControl,
} from "../../controls/codeControl";
import { BoolControl } from "../../controls/boolControl";
import {
  blurEvent,
  changeEvent,
  eventHandlerControl,
  focusEvent,
} from "../../controls/eventHandlerControl";
import { stringExposingStateControl } from "../../controls/codeStateControl";
import { LabelControl } from "../../controls/labelControl";
import { UICompBuilder, withDefault } from "../../generators";
import {
  CommonNameConfig,
  depsConfig,
  NameConfig,
  withExposingConfigs,
} from "../../generators/withExposing";
import { formDataChildren, FormDataPropertyView } from "../formComp/formDataConstants";
import { styleControl } from "comps/controls/styleControl";
import { AnimationStyle, ChildrenMultiSelectStyle, ChildrenMultiSelectStyleType, DateTimeStyle, DateTimeStyleType, InputFieldStyle, LabelStyle } from "comps/controls/styleControlConstants";
import { withMethodExposing } from "../../generators/withMethodExposing";
import {
  disabledPropertyView,
  formatPropertyView,
  hiddenPropertyView,
  hourStepPropertyView,
  maxTimePropertyView,
  minTimePropertyView,
  minuteStepPropertyView,
  requiredPropertyView,
  SecondStepPropertyView,
  showDataLoadingIndicatorsPropertyView,
} from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { TIME_FORMAT, TimeParser } from "util/dateTimeUtils";
import React, { ReactNode, useContext, useEffect, useState } from "react";
import { IconControl } from "comps/controls/iconControl";
import { hasIcon } from "comps/utils";
import { Section, sectionNames } from "components/Section";
import { CommonPickerMethods, dateRefMethods, disabledTime, handleDateChange } from "comps/comps/dateComp/dateCompUtil";
import { TimeUIView } from "./timeUIView";
import { TimeRangeUIView } from "comps/comps/dateComp/timeRangeUIView";
import { RefControl } from "comps/controls/refControl";
// import { CommonPickerMethods } from "antd/es/date-picker/generatePicker/interface";
import { TimePickerProps } from "antd/es/time-picker";

import { EditorContext } from "comps/editorState";
import { dropdownControl } from "comps/controls/dropdownControl";
import { timeZoneOptions } from "./timeZone";
import { migrateOldData } from "@lowcoder-ee/comps/generators/simpleGenerators";
import { fixOldInputCompData } from "../textInputComp/textInputConstants";
import { fixOldDateOrTimeRangeData } from "./dateComp";

const EventOptions = [changeEvent, focusEvent, blurEvent] as const;

const validationChildren = {
  showValidationWhenEmpty: BoolControl,
  required: BoolControl,
  minTime: StringControl,
  maxTime: StringControl,
  customRule: CustomRuleControl,
};

const commonChildren = {
  label: LabelControl,
  placeholder: withDefault(StringControl, trans("time.placeholder")),
  format: StringControl,
  inputFormat: withDefault(StringControl, TIME_FORMAT),
  disabled: BoolCodeControl,
  onEvent: eventHandlerControl(EventOptions),
  showTime: BoolControl,
  use12Hours: BoolControl,
  hourStep: RangeControl.closed(1, 24, 1),
  minuteStep: RangeControl.closed(1, 60, 1),
  secondStep: RangeControl.closed(1, 60, 1),
  style: styleControl(InputFieldStyle, 'style'),
  animationStyle: styleControl(AnimationStyle, 'animationStyle'),
  labelStyle: styleControl(
    LabelStyle.filter((style) => ['accent', 'validate'].includes(style.name) === false),
    'labelStyle',
  ),
  inputFieldStyle: styleControl(DateTimeStyle, 'inputFieldStyle'),
  childrenInputFieldStyle: styleControl(ChildrenMultiSelectStyle, 'childrenInputFieldStyle'),
  suffixIcon: withDefault(IconControl, "/icon:regular/clock"),
  timeZone: dropdownControl(timeZoneOptions, Intl.DateTimeFormat().resolvedOptions().timeZone),
  viewRef: RefControl<CommonPickerMethods>,
  ...validationChildren,
};

const timePickerComps = (props: RecordConstructorToView<typeof commonChildren>) =>
  _.pick(props, "format", "inputFormat", "use12Hours", "minuteStep", "secondStep", "placeholder");

/* const commonBasicSection = (children: RecordConstructorToComp<typeof commonChildren>) => [
  formatPropertyView({ children }),
  children.use12Hours.propertyView({ label: trans("prop.use12Hours") }),
]; */

const commonAdvanceSection = (children: RecordConstructorToComp<typeof commonChildren>) => [
  hourStepPropertyView(children),
  minuteStepPropertyView(children),
  SecondStepPropertyView(children),
];

function validate(
  props: RecordConstructorToView<typeof validationChildren> & {
    value: { value: string };
  }
): {
  validateStatus: "success" | "warning" | "error";
  help?: string;
} {
  if (props.customRule) {
    return { validateStatus: "error", help: props.customRule };
  }

  const current = dayjs(props.value.value, TimeParser);
  if (props.required && (!Boolean(props.value.value) || !current.isValid())) {
    return { validateStatus: "error", help: trans("prop.required") };
  }
  return { validateStatus: "success" };
}

const childrenMap = {
  defaultValue: stringExposingStateControl("defaultValue"),
  value: stringExposingStateControl("value"),
  userTimeZone: stringExposingStateControl("userTimeZone", Intl.DateTimeFormat().resolvedOptions().timeZone),
  ...commonChildren,
  ...formDataChildren,
};

type hourStepType =  TimePickerProps['hourStep'];
type minuteStepType =  TimePickerProps['minuteStep'];
type secondStepType =  TimePickerProps['secondStep'];

export type TimeCompViewProps = Pick<
  RecordConstructorToView<typeof childrenMap>,
  "disabled" | "use12Hours" | "format" | "inputFormat" | "viewRef"
> & Pick<
  TimePickerProps, "hourStep" | "minuteStep" | "secondStep"
> & {
  onFocus: () => void;
  onBlur: () => void;
  $style: DateTimeStyleType;
  $childrenInputFieldStyle: ChildrenMultiSelectStyleType;
  disabledTime: () => ReturnType<typeof disabledTime>;
  suffixIcon?: ReactNode | false;
  placeholder?: string | [string, string];
  timeZone:string
};

const TimePickerTmpCmp = new UICompBuilder(childrenMap, (props) => {
  const defaultValue = { ...props.defaultValue }.value;
  const value = { ...props.value }.value;

  let time: dayjs.Dayjs | null = null;
  if(value !== '') {
    time = dayjs(value, TimeParser);
  }
  
  const [tempValue, setTempValue] = useState<dayjs.Dayjs | null>(time);

  useEffect(() => {
    props.value.onChange(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const newValue = value ? dayjs(value, TimeParser) : null;
    setTempValue(newValue);
  }, [value])

  const handleTimeZoneChange = (newTimeZone: any) => {
    props.userTimeZone.onChange(newTimeZone)
  }

  return props.label({
    required: props.required,
    style: props.style,
    labelStyle: props.labelStyle,
    inputFieldStyle:props.inputFieldStyle,
    animationStyle:props.animationStyle,
    onMouseDown: (e) => e.stopPropagation(),
    children: (
      <TimeUIView
        handleTimeZoneChange={handleTimeZoneChange}
        timeZone={props?.timeZone} 
        viewRef={props.viewRef}
        $style={props.inputFieldStyle}
        $childrenInputFieldStyle={props.childrenInputFieldStyle}
        disabled={props.disabled}
        value={tempValue?.isValid() ? tempValue : null}
        disabledTime={() => disabledTime(props.minTime, props.maxTime)}
        {...timePickerComps(props)}
        hourStep={props.hourStep as hourStepType}
        minuteStep={props.minuteStep as minuteStepType}
        secondStep={props.secondStep as secondStepType}
        placeholder={props.placeholder}
        onChange={(time) => {
          handleDateChange(
            time && time.isValid() ? time.format(TIME_FORMAT) : "",
            props.value.onChange,
            props.onEvent
          );
        }}
        onFocus={() => props.onEvent("focus")}
        onBlur={() => props.onEvent("blur")}
        suffixIcon={hasIcon(props.suffixIcon) && props.suffixIcon}
      />
    ),
    showValidationWhenEmpty: props.showValidationWhenEmpty,
    ...validate(props),
  });
})
  .setPropertyViewFn((children) => (
    <>
      <Section name={sectionNames.basic}>
        {children.defaultValue.propertyView({
          label: trans("prop.defaultValue"),
          tooltip: trans("time.formatTip"),
        })}
        {children.timeZone.propertyView({
            label: trans("prop.timeZone")
        })}
      </Section>

      <FormDataPropertyView {...children} />

      {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && (
        <><Section name={sectionNames.validation}>
          {requiredPropertyView(children)}
          {children.showValidationWhenEmpty.propertyView({
            label: trans("prop.showEmptyValidation")
          })}
          {minTimePropertyView(children)}
          {maxTimePropertyView(children)}
          {children.customRule.propertyView({})}
        </Section>
        <Section name={sectionNames.interaction}>
          {children.onEvent.getPropertyView()}
          {disabledPropertyView(children)}
          {hiddenPropertyView(children)}
          {showDataLoadingIndicatorsPropertyView(children)}
        </Section></>
      )}

      {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && children.label.getPropertyView()}
      {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && (
        <Section name={sectionNames.layout}>
          {formatPropertyView({ children, placeholder: TIME_FORMAT })}
          {children.placeholder.propertyView({ label: trans("time.placeholderText") })}
        </Section>
      )}

      {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && (
        <Section name={sectionNames.advanced}>
          {commonAdvanceSection(children)}
          {children.use12Hours.propertyView({ label: trans("prop.use12Hours") })}
          {children.suffixIcon.propertyView({ label: trans("button.suffixIcon") })}
        </Section>
      )}

      {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && (
        <>
          <Section name={sectionNames.style}>
            {children.style.getPropertyView()}
          </Section>
          <Section name={sectionNames.labelStyle}>
            {children.labelStyle.getPropertyView()}
          </Section>
          <Section name={sectionNames.inputFieldStyle}>
            {children.inputFieldStyle.getPropertyView()}
          </Section>
          <Section name={sectionNames.childrenInputFieldStyle}>
            {children.childrenInputFieldStyle.getPropertyView()}
          </Section>
          <Section name={sectionNames.animationStyle} hasTooltip={true}>
            {children.animationStyle.getPropertyView()}
          </Section>
        </>
      )}
    </>
  ))
  .setExposeMethodConfigs(dateRefMethods)
  .build();

export const timePickerControl = migrateOldData(TimePickerTmpCmp, fixOldInputCompData);

const TimeRangeTmpCmp = (function () {
  const childrenMap = {
    defaultStart: stringExposingStateControl("defaultStart"),
    start: stringExposingStateControl("start"),
    defaultEnd: stringExposingStateControl("defaultEnd"),
    end: stringExposingStateControl("end"),
    userRangeTimeZone: stringExposingStateControl("userRangeTimeZone" , Intl.DateTimeFormat().resolvedOptions().timeZone),
    ...formDataChildren,
    ...commonChildren,
  };

  return new UICompBuilder(childrenMap, (props) => {
    const defaultStart = { ...props.defaultStart }.value;
    const startValue = { ...props.start }.value;

    const defaultEnd = { ...props.defaultEnd }.value;
    const endValue = { ...props.end }.value;

    let start: dayjs.Dayjs | null = null;
    if(startValue !== '') {
      start = dayjs(startValue, TimeParser);
    }
    let end: dayjs.Dayjs | null = null;
    if(endValue !== '') {
      end = dayjs(endValue, TimeParser);
    }

    const [tempStartValue, setTempStartValue] = useState<dayjs.Dayjs | null>(start);
    const [tempEndValue, setTempEndValue] = useState<dayjs.Dayjs | null>(end);

    useEffect(() => {
      props.start.onChange(defaultStart);
    }, [defaultStart]);

    useEffect(() => {
      props.end.onChange(defaultEnd);
    }, [defaultEnd]);

    useEffect(() => {
      const value = startValue ? dayjs(startValue, TimeParser) : null;
      setTempStartValue(value);
    }, [startValue])

    useEffect(() => {
      const value = endValue ? dayjs(endValue, TimeParser) : null;
      setTempEndValue(value);
    }, [endValue])

    const handleTimeRangeZoneChange = (newTimeZone: any) => {
      props.userRangeTimeZone.onChange(newTimeZone)
    }
    
    const children = (
      <TimeRangeUIView
        handleTimeRangeZoneChange={handleTimeRangeZoneChange}
        timeZone={props?.timeZone} 
        viewRef={props.viewRef}
        $style={props.inputFieldStyle}
        $childrenInputFieldStyle={props.childrenInputFieldStyle}
        disabled={props.disabled}
        start={tempStartValue?.isValid() ? tempStartValue : null}
        end={tempEndValue?.isValid() ? tempEndValue : null}
        disabledTime={() => disabledTime(props.minTime, props.maxTime)}
        {...timePickerComps(props)}
        hourStep={props.hourStep as hourStepType}
        minuteStep={props.minuteStep as minuteStepType}
        secondStep={props.secondStep as secondStepType}
        placeholder={[props.placeholder, props.placeholder]}
        onChange={(start, end) => {
          props.start.onChange(start && start.isValid() ? start.format(TIME_FORMAT) : "");
          props.end.onChange(end && end.isValid() ? end.format(TIME_FORMAT) : "");
          props.onEvent("change");
        }}
        onFocus={() => props.onEvent("focus")}
        onBlur={() => props.onEvent("blur")}
        suffixIcon={hasIcon(props.suffixIcon) && props.suffixIcon}
      />
    );

    const startResult = validate({ ...props, value: props.start });
    const endResult = validate({ ...props, value: props.end });

    return props.label({
      required: props.required,
      style: props.style,
      labelStyle: props.labelStyle,
      inputFieldStyle:props.inputFieldStyle,
      animationStyle:props.animationStyle,
      children: children,
      onMouseDown: (e) => e.stopPropagation(),
      showValidationWhenEmpty: props.showValidationWhenEmpty,
      ...(startResult.validateStatus !== "success"
        ? startResult
        : endResult.validateStatus !== "success"
        ? endResult
        : startResult),
    });
  })
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.defaultStart.propertyView({
            label: trans("time.start"),
            tooltip: trans("time.formatTip"),
          })}
          {children.defaultEnd.propertyView({
            label: trans("time.end"),
            tooltip: trans("time.formatTip"),
          })}
          {children.timeZone.propertyView({
            label: trans("prop.timeZone")
            })}
        </Section>
        
        <FormDataPropertyView {...children} />

        {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && (
          <><Section name={sectionNames.validation}>
            {requiredPropertyView(children)}
            {children.showValidationWhenEmpty.propertyView({
              label: trans("prop.showEmptyValidation")
            })}
            {minTimePropertyView(children)}
            {maxTimePropertyView(children)}
            {children.customRule.propertyView({})}
          </Section>
          <Section name={sectionNames.interaction}>
            {children.onEvent.getPropertyView()}
            {disabledPropertyView(children)}
            {hiddenPropertyView(children)}
            {showDataLoadingIndicatorsPropertyView(children)}
          </Section></>
        )}

        {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && children.label.getPropertyView()}
        {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && (
          <Section name={sectionNames.layout}>
            {formatPropertyView({ children, placeholder: TIME_FORMAT })}
            {children.placeholder.propertyView({ label: trans("time.placeholderText") })}
          </Section>
        )}

        {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && (
          <Section name={sectionNames.advanced}>
            {commonAdvanceSection(children)}
            {children.use12Hours.propertyView({ label: trans("prop.use12Hours") })}
            {children.suffixIcon.propertyView({ label: trans("button.suffixIcon") })}
          </Section>
        )}

        {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && (
          <>
            <Section name={sectionNames.style}>
              {children.style.getPropertyView()}
            </Section>
            <Section name={sectionNames.labelStyle}>
              {children.labelStyle.getPropertyView()}
            </Section>
            <Section name={sectionNames.inputFieldStyle}>
              {children.inputFieldStyle.getPropertyView()}
            </Section>
            <Section name={sectionNames.childrenInputFieldStyle}>
              {children.childrenInputFieldStyle.getPropertyView()}
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

export const timeRangeControl = migrateOldData(TimeRangeTmpCmp, fixOldDateOrTimeRangeData);

const getTimeZoneInfo = (timeZone: any, otherTimeZone: any) => {
  const tz = timeZone === 'UserChoice' ? otherTimeZone : timeZone;
  
  const dateInTz = dayjs().tz(tz);
  const offset = dateInTz.format('Z');
  const timeZoneName = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' })
    .formatToParts().find(part => part.type === 'timeZoneName')?.value;

  return { TimeZone: tz, Offset: offset, Name: timeZoneName };
};

export const TimePickerComp = withExposingConfigs(timePickerControl, [
  new NameConfig("value", trans("export.timePickerValueDesc")),

  depsConfig({
    name: "formattedValue",
    desc: trans("export.timePickerFormattedValueDesc"),
    depKeys: ["value", "format", "timeZone", "userTimeZone"], 
    func: (input) => {
      const mom = Boolean(input.value) ? dayjs(input.value, TimeParser) : null;
      const tz = input.timeZone === 'UserChoice' ? input.userTimeZone : input.timeZone; // Get the selected timezone  
      const timeInTz = mom?.clone().tz(tz, true); // Apply the selected timezone without altering the time itself (do not convert the time)  
      const formattedTimeWithoffset = timeInTz?.format(input?.format);
      return mom?.isValid() ?  (!input.format || input.format.includes('Z') || input.format.includes('z'))  // Check if format is not available or contains 'Z'
      ? formattedTimeWithoffset  // Return formattedDateWithoffset if format includes 'Z' or is not available
      : mom.format(input.format) // Otherwise, return mom.format(input.format)
    : "";   
    },
  }),

  depsConfig({
    name: "timeZone", 
    desc: trans("export.timeZoneDesc"), 
    depKeys: ["timeZone", "userTimeZone"], 
    func: (input: { timeZone: any; userTimeZone: any; }) => getTimeZoneInfo(input.timeZone, input.userTimeZone)
  }),
  depsConfig({
    name: "invalid",
    desc: trans("export.invalidDesc"),
    depKeys: ["value", "required", "minTime", "maxTime", "customRule"],
    func: (input) =>
      validate({
        ...input,
        value: { value: input.value },
      } as any).validateStatus !== "success",
  }),
  ...CommonNameConfig,
]);

export let TimeRangeComp = withExposingConfigs(timeRangeControl, [
  new NameConfig("start", trans("export.timeRangeStartDesc")),
  new NameConfig("end", trans("export.timeRangeEndDesc")),
  depsConfig({
    name: "formattedValue",
    desc: trans("export.timeRangeFormattedValueDesc"),
    depKeys: ["start", "end", "format", "timeZone", "userRangeTimeZone"],
    func: (input) => {
      const start = Boolean(input.start) ? dayjs(input.start, TimeParser) : null;
      const end = Boolean(input.end) ? dayjs(input.end, TimeParser) : null;
      const tz = input.timeZone === 'UserChoice' ? input.userRangeTimeZone : input.timeZone; // Get the selected timezone  
      const startTimeInTz = start?.clone().tz(tz, true); // Apply the selected timezone without altering the time itself (do not convert the time)  
      const endTimeInTz = end?.clone().tz(tz, true); 
      return [
        start?.isValid() && (!input.format || input.format.includes('Z') || input.format.includes('z'))  // Check if format is not available or contains 'Z'
        ? startTimeInTz?.format(input?.format)  // Return formattedTimeWithoffset if format includes 'Z' or is not available
        :  start?.format(input.format),
        end?.isValid() && (!input.format || input.format.includes('Z') || input.format.includes('z')) 
        ? endTimeInTz?.format(input?.format) 
        :  end?.format(input.format) ,
      ]
        .filter((item) => item)
        .join(" - ");
    },
  }),
  depsConfig({
    name: "formattedStartValue",
    desc: trans("export.timeRangeFormattedStartValueDesc"),
    depKeys: ["start", "format" , "timeZone", "userRangeTimeZone"],
    func: (input) => {
      const start = Boolean(input.start) ? dayjs(input.start, TimeParser) : null;
      const tz = input.timeZone === 'UserChoice' ? input.userRangeTimeZone : input.timeZone;
      const startTimeInTz = start?.clone().tz(tz, true);
      const formattedDate = startTimeInTz?.format(input?.format);
      return start?.isValid() && (!input.format || input.format.includes('Z') || input.format.includes('z')) 
      ? formattedDate
      : start?.format(input.format);
    },
  }),
  depsConfig({
    name: "formattedEndValue",
    desc: trans("export.timeRangeFormattedEndValueDesc"),
    depKeys: ["end", "format", "timeZone", "userRangeTimeZone"],
    func: (input) => {
      const end = Boolean(input.end) ? dayjs(input.end, TimeParser) : null;
      const tz = input.timeZone === 'UserChoice' ? input.userRangeTimeZone : input.timeZone; 
      const endTimeInTz = end?.clone().tz(tz, true);
      return end?.isValid() && (!input.format || input.format.includes('Z') || input.format.includes('z'))
      ? endTimeInTz?.format(input?.format)  
      : end?.format(input.format);
    },
  }),
  depsConfig({
    name: "timeZone", 
    desc: trans("export.timeZoneDesc"), 
    depKeys: ["timeZone", "userRangeTimeZone"], 
    func: (input:any) => getTimeZoneInfo(input.timeZone, input.userRangeTimeZone)

  }),
  depsConfig({
    name: "invalid",
    desc: trans("export.invalidDesc"),
    depKeys: ["start", "end", "required", "minTime", "maxTime", "customRule"],
    func: (input) =>
      validate({
        ...input,
        value: { value: input.start },
      }).validateStatus !== "success" ||
      validate({
        ...input,
        value: { value: input.end },
      }).validateStatus !== "success",
  }),
  ...CommonNameConfig,
]);

TimeRangeComp = withMethodExposing(TimeRangeComp, [
  ...dateRefMethods,
  {
    method: {
      name: "clearAll",
      description: trans("date.clearAllDesc"),
      params: [],
    },
    execute: (comp) => {
      comp.children.start.getView().onChange("");
      comp.children.end.getView().onChange("");
    },
  },
  {
    method: {
      name: "resetAll",
      description: trans("date.resetAllDesc"),
      params: [],
    },
    execute: (comp) => {
      comp.children.start.getView().reset();
      comp.children.end.getView().reset();
    },
  },
  {
    method: {
      name: "setRange",
      params: [],
    },
    execute: (comp, values) => {
      if (values.length !== 1) {
        return Promise.reject(trans("formComp.valuesLengthError"));
      }
      const data = values[0] as { start: string, end: string };
      if (typeof data !== "object" || data === null || Array.isArray(data) || !data.hasOwnProperty('start') || !data.hasOwnProperty('end')) {
        return Promise.reject(trans("formComp.valueTypeError"));
      }
      comp.children.start.getView().onChange(data.start);
      comp.children.end.getView().onChange(data.end);
    },
  },
]);