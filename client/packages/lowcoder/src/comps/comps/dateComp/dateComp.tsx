import _, { noop } from "lodash";
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
import { LabelControl } from "../../controls/labelControl";
import { stringExposingStateControl } from "../../controls/codeStateControl";
import { UICompBuilder, withDefault } from "../../generators";
import { CommonNameConfig, depsConfig, withExposingConfigs } from "../../generators/withExposing";
import { formDataChildren, FormDataPropertyView } from "../formComp/formDataConstants";
import { styleControl } from "comps/controls/styleControl";
import {  AnimationStyle, ChildrenMultiSelectStyle, ChildrenMultiSelectStyleType, DateTimeStyle, DateTimeStyleType, InputFieldStyle, LabelStyle } from "comps/controls/styleControlConstants";
import { withMethodExposing } from "../../generators/withMethodExposing";
import {
  disabledPropertyView,
  formatPropertyView,
  hiddenPropertyView,
  hourStepPropertyView,
  maxDatePropertyView,
  maxTimePropertyView,
  minDatePropertyView,
  minTimePropertyView,
  minuteStepPropertyView,
  requiredPropertyView,
  SecondStepPropertyView,
  showDataLoadingIndicatorsPropertyView,
} from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { DATE_FORMAT, DATE_TIME_FORMAT, DateParser, PickerMode } from "util/dateTimeUtils";
import React, { ReactNode, useContext, useEffect, useState } from "react";
import { IconControl } from "comps/controls/iconControl";
import { hasIcon } from "comps/utils";
import { Section, sectionNames } from "components/Section";
import { CommonPickerMethods, dateRefMethods, disabledTime, handleDateChange } from "comps/comps/dateComp/dateCompUtil";
import { DateUIView } from "./dateUIView";
import { useIsMobile } from "util/hooks";
import { RefControl } from "comps/controls/refControl";
// import { CommonPickerMethods } from "antd/es/date-picker/generatePicker/interface";
import { DateRangeUIView } from "comps/comps/dateComp/dateRangeUIView";
import { EditorContext } from "comps/editorState";
import { dropdownControl } from "comps/controls/dropdownControl";
import { timeZoneOptions } from "./timeZone";
import { migrateOldData } from "@lowcoder-ee/comps/generators/simpleGenerators";
import { fixOldInputCompData } from "../textInputComp/textInputConstants";



const EventOptions = [changeEvent, focusEvent, blurEvent] as const;
const PickerModeOptions = [
  { label: "Date", value: "date" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Quarter", value: "quarter" },
  { label: "Year", value: "year" },
]

const validationChildren = {
  showValidationWhenEmpty: BoolControl,
  required: BoolControl,
  minDate: StringControl,
  maxDate: StringControl,
  minTime: StringControl,
  maxTime: StringControl,
  customRule: CustomRuleControl,
};
const commonChildren = {
  label: LabelControl,
  placeholder: withDefault(StringControl, trans("date.placeholder")),
  format: StringControl,
  inputFormat: withDefault(StringControl, DATE_FORMAT),
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
  suffixIcon: withDefault(IconControl, "/icon:regular/calendar"),
  ...validationChildren,
  viewRef: RefControl<CommonPickerMethods>,
  inputFieldStyle: styleControl(DateTimeStyle, 'inputFieldStyle'),
  childrenInputFieldStyle: styleControl(ChildrenMultiSelectStyle, 'childrenInputFieldStyle'),
  timeZone: dropdownControl(timeZoneOptions, Intl.DateTimeFormat().resolvedOptions().timeZone),
  pickerMode: dropdownControl(PickerModeOptions, 'date'), 
};
type CommonChildrenType = RecordConstructorToComp<typeof commonChildren>;

const datePickerProps = (props: RecordConstructorToView<typeof commonChildren>) =>
  _.pick(props, "format", "inputFormat", "showTime", "use12Hours", "hourStep", "minuteStep", "secondStep", "placeholder", "pickerMode");

const timeFields = (children: CommonChildrenType, isMobile?: boolean) => [
  children.showTime.propertyView({ label: trans("date.showTime") }),
  !isMobile && children.use12Hours.propertyView({ label: trans("prop.use12Hours") }),
];
const commonAdvanceSection = (children: CommonChildrenType, isDate: boolean = true) => {
  if (isDate && children.showTime.getView()) {
    return (
      <Section name={sectionNames.advanced}>
        {hourStepPropertyView(children)}
        {minuteStepPropertyView(children)}
        {SecondStepPropertyView(children)}
      </Section>
    );
  }
};

const dateValidationFields = (children: CommonChildrenType, dateType: PickerMode = "date") => {
  if (dateType === "date") {
    return [minDatePropertyView(children), maxDatePropertyView(children)];
  }
};

const timeValidationFields = (children: CommonChildrenType, dateType: PickerMode = "date") => {
  if (dateType === "date" && children.showTime.getView()) {
    return [minTimePropertyView(children), maxTimePropertyView(children)];
  }
};

function validate(
  props: RecordConstructorToView<typeof validationChildren> & {
    value: { value: string };
    showTime: boolean;
  }
): {
  validateStatus: "success" | "warning" | "error";
  help?: string;
} {
  if (props.customRule) {
    return { validateStatus: "error", help: props.customRule };
  }
  const currentDateTime = dayjs(props.value.value, DateParser);

  if (props.required && (props.value.value === '' || !currentDateTime.isValid())) {
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
export type DateCompViewProps = Pick<
  RecordConstructorToView<typeof childrenMap>,
  | "disabled"
  | "format"
  | "inputFormat"
  | "minDate"
  | "maxDate"
  | "suffixIcon"
  | "showTime"
  | "use12Hours"
  | "hourStep"
  | "minuteStep"
  | "secondStep"
  | "viewRef"
  | "timeZone"
  | "pickerMode"
> & {
  onFocus: () => void;
  onBlur: () => void;
  $style: DateTimeStyleType;
  $childrenInputFieldStyle: ChildrenMultiSelectStyleType;
  disabledTime: () => ReturnType<typeof disabledTime>;
  suffixIcon: ReactNode;
  placeholder?: string | [string, string];
};

const getFormattedDate = (
  time: dayjs.Dayjs | null | undefined,
  showTime: boolean,
  pickerMode: string,
) => {
  let updatedTime = undefined;
  if (time?.isValid()) {
    switch(pickerMode) {
      case 'week': {
        updatedTime = dayjs(time).day(0);
        break;
      }
      case 'month': {
        updatedTime = dayjs(time).set('date', 1);
        break;
      }
      case 'quarter': {
        updatedTime = dayjs(time).set('date', 1);
        break;
      }
      case 'year': {
        updatedTime = dayjs(time).set('date', 1).set('month', 1);
        break;
      }
      default: {
        updatedTime = time;
        break;
      }
    }
  }
  return updatedTime
    ? updatedTime.format(showTime ? DATE_TIME_FORMAT : DATE_FORMAT)
    : "";
}

const DatePickerTmpCmp = new UICompBuilder(childrenMap, (props) => {
  const defaultValue = { ...props.defaultValue }.value;
  const value = { ...props.value }.value;
    
  let time: dayjs.Dayjs | null = null;
  if (value !== '') {
    time = dayjs(value, DateParser);
  }
  
  const [tempValue, setTempValue] = useState<dayjs.Dayjs | null>(time);

  useEffect(() => {
    props.value.onChange(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const newValue = value ? dayjs(value, DateParser) : null;
    setTempValue(newValue);
  }, [value])

  const handleDateZoneChange = (newTimeZone: any) => {
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
      <DateUIView
        onClickDateTimeZone={handleDateZoneChange}
        timeZone={props.timeZone}
        viewRef={props.viewRef}
        disabledTime={() => disabledTime(props.minTime, props.maxTime)}
        $style={props.inputFieldStyle}
        $childrenInputFieldStyle={props.childrenInputFieldStyle}
        disabled={props.disabled}
        {...datePickerProps(props)}
        hourStep={props.hourStep}
        minDate={props.minDate}
        maxDate={props.maxDate}
        placeholder={props.placeholder}
        value={tempValue?.isValid() ? tempValue : null}
        onChange={(time) => {
          handleDateChange(
            getFormattedDate(time, props.showTime, props.pickerMode),
            props.value.onChange,
            props.onEvent
          );
        }}
        onPanelChange={() => {
          handleDateChange("", props.value.onChange, noop);
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
  .setPropertyViewFn((children) => {
    const isMobile = useIsMobile();
    return (
      <>
        <Section name={sectionNames.basic}>
          {children.defaultValue.propertyView({
            label: trans("prop.defaultValue"),
            placeholder: "2022-04-07 21:39:59",
            tooltip: trans("date.formatTip")
          })}
          {children.pickerMode.propertyView({
            label: trans("prop.pickerMode")
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
            {dateValidationFields(children)}
            {timeValidationFields(children)}
            {children.customRule.propertyView({})}
          </Section>
            <Section name={sectionNames.interaction}>
              {children.onEvent.getPropertyView()}
              {disabledPropertyView(children)}
              {hiddenPropertyView(children)}
              {showDataLoadingIndicatorsPropertyView(children)}
            </Section>
          </>
        )}

        {/*{commonAdvanceSection(children, children.dateType.value === "date")}*/}
        {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && children.label.getPropertyView()}

        {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && (
          <Section name={sectionNames.layout}>
            {formatPropertyView({ children, placeholder: DATE_FORMAT })}
            {children.placeholder.propertyView({ label: trans("date.placeholderText") })}
          </Section>
        )}

        {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && (
          <><Section name={sectionNames.advanced}>
            {timeFields(children, isMobile)}
            {children.suffixIcon.propertyView({ label: trans("button.suffixIcon") })}
          </Section></>
        )}
        {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && !isMobile && commonAdvanceSection(children)}

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
    );
  })
  .setExposeMethodConfigs(dateRefMethods)
  .build();

export const datePickerControl = migrateOldData(DatePickerTmpCmp, fixOldInputCompData);

export function fixOldDateOrTimeRangeData(oldData: any) {
  if (!oldData) return oldData;

  let {defaultStart, defaultEnd} = oldData
  if (Boolean(oldData.start) && !Boolean(oldData.defaultStart)) {
    defaultStart = oldData.start;
  }
  if (Boolean(oldData.end) && !Boolean(oldData.defaultEnd)) {
    defaultEnd = oldData.end;
  }
  return {
    ...oldData,
    defaultStart,
    defaultEnd,
    start: '',
    end: '',
  };
  // return oldData;
}

let DateRangeTmpCmp = (function () {
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
    if (startValue !== '') {
      start = dayjs(startValue, DateParser);
    }
    
    let end: dayjs.Dayjs | null = null;
    if (endValue !== '') {
      end = dayjs(endValue, DateParser);
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
      const value = startValue ? dayjs(startValue, DateParser) : null;
      setTempStartValue(value);
    }, [startValue])

    useEffect(() => {
      const value = endValue ? dayjs(endValue, DateParser) : null;
      setTempEndValue(value);
    }, [endValue])


    const handleDateRangeZoneChange = (newTimeZone: any) => {
      props.userRangeTimeZone.onChange(newTimeZone)
    }

    const children = (
      <DateRangeUIView
        onClickDateRangeTimeZone={handleDateRangeZoneChange}
        timeZone={props?.timeZone}
        viewRef={props.viewRef}
        $style={props.inputFieldStyle}
        $childrenInputFieldStyle={props.childrenInputFieldStyle}
        disabled={props.disabled}
        {...datePickerProps(props)}
        start={tempStartValue?.isValid() ? tempStartValue : null}
        end={tempEndValue?.isValid() ? tempEndValue : null}
        minDate={props.minDate}
        maxDate={props.maxDate}
        placeholder={[props.placeholder, props.placeholder]}
        disabledTime={() => disabledTime(props.minTime, props.maxTime)}
        onChange={(start, end) => {
          props.start.onChange(
            getFormattedDate(start, props.showTime, props.pickerMode)
          );
          props.end.onChange(
            getFormattedDate(end, props.showTime, props.pickerMode)
          );
          props.onEvent("change");
        }}
        onPanelChange={(_, mode) => {
          mode[0] !== "date" && handleDateChange("", props.start.onChange, noop);
          mode[1] !== "date" && handleDateChange("", props.end.onChange, noop);
        }}
        onFocus={() => props.onEvent("focus")}
        onBlur={() => props.onEvent("blur")}
        suffixIcon={hasIcon(props.suffixIcon) && props.suffixIcon}      />
    );

    const startResult = validate({ ...props, value: props.start });
    const endResult = validate({ ...props, value: props.end });

    return props.label({
      required: props.required,
      style: props.style,
      labelStyle:props.labelStyle,
      children: children,
      inputFieldStyle:props.inputFieldStyle,
      onMouseDown: (e) => e.stopPropagation(),
      showValidationWhenEmpty: props.showValidationWhenEmpty,
      ...(startResult.validateStatus !== "success"
        ? startResult
        : endResult.validateStatus !== "success"
          ? endResult
          : startResult),
    });
  })
    .setPropertyViewFn((children) => {
      const isMobile = useIsMobile();
      return (
        <>
          <Section name={sectionNames.basic}>
            {children.defaultStart.propertyView({
              label: trans("date.start"),
              placeholder: "2022-04-07 21:39:59",
              tooltip: trans("date.formatTip"),
            })}
            {children.defaultEnd.propertyView({
              label: trans("date.end"),
              placeholder: "2022-04-07 21:39:59",
              tooltip: trans("date.formatTip"),
            })}
            {children.pickerMode.propertyView({
              label: trans("prop.pickerMode")
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
              {dateValidationFields(children)}
              {timeValidationFields(children)}
              {children.customRule.propertyView({})}
            </Section>
              <Section name={sectionNames.interaction}>
                {children.onEvent.getPropertyView()}
                {disabledPropertyView(children)}
                {hiddenPropertyView(children)}
                {showDataLoadingIndicatorsPropertyView(children)}
              </Section>
            </>
          )}

          {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && children.label.getPropertyView()}

          {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && (
            <Section name={sectionNames.layout}>
              {formatPropertyView({ children })}
              {children.placeholder.propertyView({ label: trans("date.placeholderText") })}
            </Section>
          )}

          {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && (
            <><Section name={sectionNames.advanced}>
              {timeFields(children, isMobile)}
              {children.suffixIcon.propertyView({ label: trans("button.suffixIcon") })}
            </Section></>
          )}
          {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && commonAdvanceSection(children)}

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
            </>
          )}

        </>
      );
    })
    .build();
})();

export const dateRangeControl = migrateOldData(DateRangeTmpCmp, fixOldDateOrTimeRangeData);

const getTimeZoneInfo = (timeZone: any, otherTimeZone: any) => {
  const tz = timeZone === 'UserChoice' ? otherTimeZone : timeZone;
  
  const dateInTz = dayjs().tz(tz);
  const offset = dateInTz.format('Z');
  const timeZoneName = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' })
    .formatToParts().find(part => part.type === 'timeZoneName')?.value;

  return { TimeZone: tz, Offset: offset, Name: timeZoneName };
};

export const DatePickerComp = withExposingConfigs(datePickerControl, [
  depsConfig({
    name: "value",
    desc: trans("export.datePickerValueDesc"),
    depKeys: ["value", "showTime"],
    func: (input) => {
      const mom = Boolean(input.value) ? dayjs(input.value, DateParser) : null;
      return mom?.isValid() ? mom.format(input.showTime ? DATE_TIME_FORMAT : DATE_FORMAT) : null;
    },
  }),
  depsConfig({
    name: "formattedValue",
    desc: trans("export.datePickerFormattedValueDesc"),
    depKeys: ["value", "format", "timeZone", "userTimeZone"], 
    func: (input) => {
      const mom = Boolean(input.value) ? dayjs(input.value, DateParser) : null;
      const tz = input.timeZone === 'UserChoice' ? input.userTimeZone : input.timeZone; // Get the selected timezone  
      const timeInTz = mom?.clone().tz(tz, true); // Apply the selected timezone without altering the time itself (do not convert the time)  
      return mom?.isValid() 
      ? (!input.format || input.format.includes('Z') || input.format.includes('z'))  // Check if format is not available or contains 'Z'
        ? timeInTz?.format(input?.format)  // Return formattedDateWithoffset if format includes 'Z' or is not available
        : mom.format(input.format) // Otherwise, return mom.format(input.format)
      : "";    
    },
  }),
  depsConfig({
    name: "timestamp",
    desc: trans("export.datePickerTimestampDesc"),
    depKeys: ["value"],
    func: (input) => {
      const mom = Boolean(input.value) ? dayjs(input.value, DateParser) : null;
      return mom?.isValid() ? mom.unix() : "";
    },
  }),
  depsConfig({
    name: "invalid",
    desc: trans("export.invalidDesc"),
    depKeys: ["value", "required", "minTime", "maxTime", "minDate", "maxDate", "customRule"],
    func: (input) =>
      validate({
        ...input,
        value: { value: input.value },
      } as any).validateStatus !== "success",
  }),
  depsConfig({
    name: "timeZone",
    desc: trans("export.timeZoneDesc"), 
    depKeys: ["timeZone", "userTimeZone"],
    func: (input: { timeZone: any; userTimeZone: any; }) => getTimeZoneInfo(input.timeZone, input.userTimeZone)

  }),
  ...CommonNameConfig,
]);

export let DateRangeComp = withExposingConfigs(dateRangeControl, [
  depsConfig({
    name: "start",
    desc: trans("export.dateRangeStartDesc"),
    depKeys: ["start", "showTime"],
    func: (input) => {
      const mom = Boolean(input.start) ? dayjs(input.start, DateParser): null;
      return mom?.isValid() ? mom.format(input.showTime ? DATE_TIME_FORMAT : DATE_FORMAT) : null;
    },
  }),
  depsConfig({
    name: "end",
    desc: trans("export.dateRangeEndDesc"),
    depKeys: ["end", "showTime"],
    func: (input) => {
      const mom = Boolean(input.end) ? dayjs(input.end, DateParser): null;
      return mom?.isValid() ? mom.format(input.showTime ? DATE_TIME_FORMAT : DATE_FORMAT) : null;
    },
  }),
  depsConfig({
    name: "startTimestamp",
    desc: trans("export.dateRangeStartTimestampDesc"),
    depKeys: ["start"],
    func: (input) => {
      const mom = Boolean(input.start) ? dayjs(input.start, DateParser) : null;
      return mom?.isValid() ? mom.unix() : "";
    },
  }),
  depsConfig({
    name: "endTimestamp",
    desc: trans("export.dateRangeEndTimestampDesc"),
    depKeys: ["end"],
    func: (input) => {
      const mom = Boolean(input.end) ? dayjs(input.end, DateParser) : null;
      return mom?.isValid() ? mom.unix() : "";
    },
  }),
  depsConfig({
    name: "formattedValue",
    desc: trans("export.dateRangeFormattedValueDesc"),
    depKeys: ["start", "end", "format" , "timeZone", "userRangeTimeZone"],
    func: (input) => {
      const start = Boolean(input.start) ? dayjs(input.start, DateParser): null;
      const end = Boolean(input.end) ? dayjs(input.end, DateParser): null;
      const tz = input.timeZone === 'UserChoice' ? input.userRangeTimeZone : input.timeZone; // Get the selected timezone  
      const startTimeInTz = start?.clone().tz(tz, true); // Apply the selected timezone without altering the time itself (do not convert the time)  
      const endTimeInTz = end?.clone().tz(tz, true); // Apply the selected timezone without altering the time itself (do not convert the time)  

      return [
        start?.isValid() && (!input.format || input.format.includes('Z') || input.format.includes('z'))  // Check if format is not available or contains 'Z'
        ? startTimeInTz?.format(input?.format)  // Return formattedDateWithoffset if format includes 'Z' or is not available
        :  start?.format(input.format),
        end?.isValid() && (!input.format || input.format.includes('Z') || input.format.includes('z'))  // Check if format is not available or contains 'Z'
        ? endTimeInTz?.format(input?.format)  // Return formattedDateWithoffset if format includes 'Z' or is not available
        :  end?.format(input.format) ,
      ]
        .filter((item) => item)
        .join(" - ");
    },
  }),
  depsConfig({
  name: "formattedStartValue",
  desc: trans("export.dateRangeFormattedStartValueDesc"),
  depKeys: ["start", "format", "timeZone", "userRangeTimeZone"],
  func: (input) => {
    const start = Boolean(input.start) ? dayjs(input.start, DateParser): null;
    const tz = input.timeZone === 'UserChoice' ? input.userRangeTimeZone : input.timeZone;
    const startTimeInTz = start?.clone().tz(tz, true);
    return start?.isValid() && (!input.format || input.format.includes('Z') || input.format.includes('z')) 
      ? startTimeInTz?.format(input?.format)
      : start?.format(input.format);
  },
}),
  depsConfig({
    name: "formattedEndValue",
    desc: trans("export.dateRangeFormattedEndValueDesc"),
    depKeys: ["end", "format" , "timeZone", "userRangeTimeZone"],
    func: (input) => {
      const end = Boolean(input.end) ? dayjs(input.end, DateParser): null;
      const tz = input.timeZone === 'UserChoice' ? input.userRangeTimeZone : input.timeZone; 
      const endTimeInTz = end?.clone().tz(tz, true);
      return end?.isValid() && (!input.format || input.format.includes('Z') || input.format.includes('z'))
      ? endTimeInTz?.format(input?.format) 
      :  end?.format(input.format);
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
    depKeys: ["start", "end", "required", "minTime", "maxTime", "minDate", "maxDate", "customRule"],
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

DateRangeComp = withMethodExposing(DateRangeComp, [
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