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
import { DateTimeStyle, DateTimeStyleType } from "comps/controls/styleControlConstants";
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
} from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { DATE_FORMAT, DATE_TIME_FORMAT, DateParser, PickerMode } from "util/dateTimeUtils";
import React, { ReactNode } from "react";
import { IconControl } from "comps/controls/iconControl";
import { hasIcon } from "comps/utils";
import { Section, sectionNames } from "components/Section";
import { dateRefMethods, disabledTime, handleDateChange } from "comps/comps/dateComp/dateCompUtil";
import { DateUIView } from "./dateUIView";
import { useIsMobile } from "util/hooks";
import { RefControl } from "comps/controls/refControl";
import { CommonPickerMethods } from "antd/es/date-picker/generatePicker/interface";
import { DateRangeUIView } from "comps/comps/dateComp/dateRangeUIView";

const EventOptions = [changeEvent, focusEvent, blurEvent] as const;

const validationChildren = {
  required: BoolControl,
  minDate: StringControl,
  maxDate: StringControl,
  minTime: StringControl,
  maxTime: StringControl,
  customRule: CustomRuleControl,
};
const commonChildren = {
  label: LabelControl,
  format: StringControl,
  disabled: BoolCodeControl,
  onEvent: eventHandlerControl(EventOptions),
  showTime: BoolControl,
  use12Hours: BoolControl,
  hourStep: RangeControl.closed(1, 24, 1),
  minuteStep: RangeControl.closed(1, 60, 1),
  secondStep: RangeControl.closed(1, 60, 1),
  style: styleControl(DateTimeStyle),
  suffixIcon: withDefault(IconControl, "/icon:regular/calendar"),
  ...validationChildren,
  viewRef: RefControl<CommonPickerMethods>,
};
type CommonChildrenType = RecordConstructorToComp<typeof commonChildren>;

const datePickerProps = (props: RecordConstructorToView<typeof commonChildren>) =>
  _.pick(props, "format", "showTime", "use12Hours", "hourStep", "minuteStep", "secondStep");

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
  }
): {
  validateStatus: "success" | "warning" | "error";
  help?: string;
} {
  if (props.customRule) {
    return { validateStatus: "error", help: props.customRule };
  }
  // 修复必填验证失效bug
  const currentDateTime = dayjs(props.value.value, DATE_FORMAT);

  if (props.required && !currentDateTime.isValid()) {
    return { validateStatus: "error", help: trans("prop.required") };
  }

  return { validateStatus: "success" };
}

const childrenMap = {
  value: stringExposingStateControl("value"),
  ...commonChildren,
  ...formDataChildren,
};
export type DateCompViewProps = Pick<
  RecordConstructorToView<typeof childrenMap>,
  | "disabled"
  | "format"
  | "minDate"
  | "maxDate"
  | "suffixIcon"
  | "showTime"
  | "use12Hours"
  | "hourStep"
  | "minuteStep"
  | "secondStep"
  | "viewRef"
> & {
  onFocus: () => void;
  onBlur: () => void;
  $style: DateTimeStyleType;
  disabledTime: () => ReturnType<typeof disabledTime>;
  suffixIcon: ReactNode;
};

export const datePickerControl = new UICompBuilder(childrenMap, (props) => {
  let time = dayjs(null);
  if(props.value.value !== '') {
    time = dayjs(props.value.value, DateParser);
  }
  return props.label({
    required: props.required,
    style: props.style,
    children: (
      <DateUIView
        picker={'date'}
        viewRef={props.viewRef}
        disabledTime={() => disabledTime(props.minTime, props.maxTime)}
        $style={props.style}
        disabled={props.disabled}
        {...datePickerProps(props)}
        minDate={props.minDate}
        maxDate={props.maxDate}
        value={time.isValid() ? time : null}
        onChange={(time) => {
          handleDateChange(
            time && time.isValid()
              ? time.format(props.showTime ? DATE_TIME_FORMAT : DATE_FORMAT)
              : "",
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
    ...validate(props),
  });
})
  .setPropertyViewFn((children) => {
    const isMobile = useIsMobile();
    return (
      <>
        <Section name={sectionNames.basic}>
          {children.value.propertyView({
            label: trans("prop.defaultValue"),
            placeholder: "2022-04-07 21:39:59",
            tooltip: trans("date.formatTip"),
          })}
          {formatPropertyView({ children })}
          {timeFields(children, isMobile)}
        </Section>

        <FormDataPropertyView {...children} />

        {children.label.getPropertyView()}

        <Section name={sectionNames.interaction}>
          {children.onEvent.getPropertyView()}
          {disabledPropertyView(children)}
        </Section>

        <Section name={sectionNames.validation}>
          {requiredPropertyView(children)}
          {dateValidationFields(children)}
          {timeValidationFields(children)}
          {children.customRule.propertyView({})}
        </Section>

        {/*{commonAdvanceSection(children, children.dateType.value === "date")}*/}
        {!isMobile && commonAdvanceSection(children)}

        <Section name={sectionNames.layout}>
          {children.suffixIcon.propertyView({ label: trans("button.suffixIcon") })}
          {hiddenPropertyView(children)}
        </Section>

        <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
      </>
    );
  })
  .setExposeMethodConfigs(dateRefMethods)
  .build();

export const dateRangeControl = (function () {
  const childrenMap = {
    start: stringExposingStateControl("start"),
    end: stringExposingStateControl("end"),
    ...commonChildren,
  };

  return new UICompBuilder(childrenMap, (props) => {
    let start = dayjs(null);
    let end = dayjs(null);
    if(props.start.value !== '') {
      start = dayjs(props.start.value, DateParser);
    }
    if(props.end.value !== '') {
      end = dayjs(props.end.value, DateParser);
    }

    const children = (
      <DateRangeUIView
        viewRef={props.viewRef}
        $style={props.style}
        disabled={props.disabled}
        {...datePickerProps(props)}
        start={start.isValid() ? start : null}
        end={end.isValid() ? end : null}
        minDate={props.minDate}
        maxDate={props.maxDate}
        disabledTime={() => disabledTime(props.minTime, props.maxTime)}
        onChange={(start, end) => {
          props.start.onChange(
            start && start.isValid()
              ? start.format(props.showTime ? DATE_TIME_FORMAT : DATE_FORMAT)
              : ""
          );
          props.end.onChange(
            end && end.isValid() ? end.format(props.showTime ? DATE_TIME_FORMAT : DATE_FORMAT) : ""
          );
          props.onEvent("change");
        }}
        onPanelChange={(_, mode) => {
          mode[0] !== "date" && handleDateChange("", props.start.onChange, noop);
          mode[1] !== "date" && handleDateChange("", props.end.onChange, noop);
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
      children: children,
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
            {children.start.propertyView({
              label: trans("date.start"),
              placeholder: "2022-04-07 21:39:59",
              tooltip: trans("date.formatTip"),
            })}
            {children.end.propertyView({
              label: trans("date.end"),
              placeholder: "2022-04-07 21:39:59",
              tooltip: trans("date.formatTip"),
            })}
            {formatPropertyView({ children })}
            {timeFields(children, isMobile)}
          </Section>

          {children.label.getPropertyView()}

          <Section name={sectionNames.interaction}>
            {children.onEvent.getPropertyView()}
            {disabledPropertyView(children)}
          </Section>

          <Section name={sectionNames.validation}>
            {requiredPropertyView(children)}
            {dateValidationFields(children)}
            {timeValidationFields(children)}
            {children.customRule.propertyView({})}
          </Section>

          {commonAdvanceSection(children)}

          <Section name={sectionNames.layout}>
            {children.suffixIcon.propertyView({ label: trans("button.suffixIcon") })}
            {hiddenPropertyView(children)}
          </Section>

          <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
        </>
      );
    })
    .build();
})();

export const weekPickerControl = new UICompBuilder(
  {...childrenMap,...{format: withDefault(StringControl,'gggg-wo')}}
  , (props) => {
  let time = dayjs(null);
  if(props.value.value !== '') {
    time = dayjs(props.value.value, DateParser);
  }
  return props.label({
    required: props.required,
    style: props.style,
    children: (
      <DateUIView
        picker={'week'}
        viewRef={props.viewRef}
        disabledTime={() => disabledTime(props.minTime, props.maxTime)}
        $style={props.style}
        disabled={props.disabled}
        {...datePickerProps(props)}
        minDate={props.minDate}
        maxDate={props.maxDate}
        value={time.isValid() ? time : null}
        onChange={(time) => {
          handleDateChange(
            time && time.isValid()
              ? time.format(DATE_FORMAT)
              : "",
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
    ...validate(props),
  });
})
  .setPropertyViewFn((children) => {
    const isMobile = useIsMobile();
    return (
      <>
        <Section name={sectionNames.basic}>
          {children.value.propertyView({
            label: trans("prop.defaultValue"),
            placeholder: "2022-04-07",
            tooltip: trans("date.formatTip"),
          })}
          {formatPropertyView({ children })}
        </Section>

        <FormDataPropertyView {...children} />

        {children.label.getPropertyView()}

        <Section name={sectionNames.interaction}>
          {children.onEvent.getPropertyView()}
          {disabledPropertyView(children)}
        </Section>

        <Section name={sectionNames.validation}>
          {requiredPropertyView(children)}
          {dateValidationFields(children)}
          {timeValidationFields(children)}
          {children.customRule.propertyView({})}
        </Section>

        {!isMobile && commonAdvanceSection(children)}

        <Section name={sectionNames.layout}>
          {children.suffixIcon.propertyView({ label: trans("button.suffixIcon") })}
          {hiddenPropertyView(children)}
        </Section>

        <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
      </>
    );
  })
  .setExposeMethodConfigs(dateRefMethods)
  .build();

export const WeekPickerComp = withExposingConfigs(weekPickerControl, [
  depsConfig({
    name: "value",
    desc: trans("export.weekPickerValueDesc"),
    depKeys: ["value"],
    func: (input) => {
      const mom = dayjs(input.value, DateParser);
      return mom.isValid() ? parseInt(mom.format('w')) : "";
    },
  }),
  depsConfig({
    name: "startOf",
    desc: trans("export.dateRangeStartDesc"),
    depKeys: ["value"],
    func: (input) => {
      const mom = dayjs(input.value, DateParser).startOf('week');
      return mom.isValid() ? mom : "";
    },
  }),
  depsConfig({
    name: "endOf",
    desc: trans("export.dateRangeEndDesc"),
    depKeys: ["value"],
    func: (input) => {
      const mom = dayjs(input.value, DateParser).endOf('week');
      return mom.isValid() ? mom : "";
    },
  }),
  depsConfig({
    name: "formattedValue",
    desc: trans("export.datePickerFormattedValueDesc"),
    depKeys: ["value", "format"],
    func: (input) => {
      const mom = dayjs(input.value, DateParser);
      return mom.isValid() ? mom.format(input.format) : "";
    },
  }),
  depsConfig({
    name: "invalid",
    desc: trans("export.invalidDesc"),
    depKeys: ["value", "required", "minTime", "maxTime", "minDate", "maxDate", "customRule"],
    func: (input) =>
      {
        let x= validate({
        ...input,
        value: { value: input.value },
      } as any).validateStatus !== "success"
      return x
    }
  }),
  ...CommonNameConfig,
]);

export const monthPickerControl = new UICompBuilder(
  {...childrenMap,...{format: withDefault(StringControl,'YYYY-MMM')}}
  , (props) => {
  let time = dayjs(null);
  if(props.value.value !== '') {
    time = dayjs(props.value.value, DateParser);
  }
  return props.label({
    required: props.required,
    style: props.style,
    children: (
      <DateUIView
        picker={'month'}
        viewRef={props.viewRef}
        disabledTime={() => disabledTime(props.minTime, props.maxTime)}
        $style={props.style}
        disabled={props.disabled}
        {...datePickerProps(props)}
        minDate={props.minDate}
        maxDate={props.maxDate}
        value={time.isValid() ? time : null}
        onChange={(time) => {
          handleDateChange(
            time && time.isValid()
              ? time.format(DATE_FORMAT)
              : "",
            props.value.onChange,
            props.onEvent
          );
        }}
        onPanelChange={() => {
        }}
        onFocus={() => props.onEvent("focus")}
        onBlur={() => props.onEvent("blur")}
        suffixIcon={hasIcon(props.suffixIcon) && props.suffixIcon}
      />
    ),
    ...validate(props),
  });
})
  .setPropertyViewFn((children) => {
    const isMobile = useIsMobile();
    return (
      <>
        <Section name={sectionNames.basic}>
          {children.value.propertyView({
            label: trans("prop.defaultValue"),
            placeholder: "2022-04-07",
            tooltip: trans("date.formatTip"),
          })}
          {formatPropertyView({ children })}
        </Section>

        <FormDataPropertyView {...children} />

        {children.label.getPropertyView()}

        <Section name={sectionNames.interaction}>
          {children.onEvent.getPropertyView()}
          {disabledPropertyView(children)}
        </Section>

        <Section name={sectionNames.validation}>
          {requiredPropertyView(children)}
          {dateValidationFields(children)}
          {timeValidationFields(children)}
          {children.customRule.propertyView({})}
        </Section>

        {!isMobile && commonAdvanceSection(children)}

        <Section name={sectionNames.layout}>
          {children.suffixIcon.propertyView({ label: trans("button.suffixIcon") })}
          {hiddenPropertyView(children)}
        </Section>

        <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
      </>
    );
  })
  .setExposeMethodConfigs(dateRefMethods)
  .build();

export const MonthPickerComp = withExposingConfigs(monthPickerControl, [
  depsConfig({
    name: "value",
    desc: trans("export.monthPickerValueDesc"),
    depKeys: ["value"],
    func: (input) => {
      const mom = dayjs(input.value, DateParser);
      return mom.isValid() ? mom.month()+1 : "";
    },
  }),
  depsConfig({
    name: "daysInMonth",
    desc: trans("export.monthPickerDaysInMonthDesc"),
    depKeys: ["value"],
    func: (input) => {
      const mom = dayjs(input.value, DateParser);
      return mom.isValid() ? mom.daysInMonth() : "";
    },
  }),
  depsConfig({
    name: "startOf",
    desc: trans("export.dateRangeStartDesc"),
    depKeys: ["value"],
    func: (input) => {
      const mom = dayjs(input.value, DateParser).startOf('month');
      return mom.isValid() ? mom : "";
    },
  }),
  depsConfig({
    name: "endOf",
    desc: trans("export.dateRangeEndDesc"),
    depKeys: ["value"],
    func: (input) => {
      const mom = dayjs(input.value, DateParser).endOf('month');
      return mom.isValid() ? mom : "";
    },
  }),
  depsConfig({
    name: "formattedValue",
    desc: trans("export.datePickerFormattedValueDesc"),
    depKeys: ["value", "format"],
    func: (input) => {
      const mom = dayjs(input.value, DateParser);
      return mom.isValid() ? mom.format(input.format) : "";
    },
  }),
  depsConfig({
    name: "invalid",
    desc: trans("export.invalidDesc"),
    depKeys: ["value", "required", "minTime", "maxTime", "minDate", "maxDate", "customRule"],
    func: (input) =>
      {
        let x= validate({
        ...input,
        value: { value: input.value },
      } as any).validateStatus !== "success"
      return x
    }
  }),
  ...CommonNameConfig,
]);

export const quarterPickerControl = new UICompBuilder(
  {...childrenMap,...{format: withDefault(StringControl,'gggg-[Q]Q')}}
  , (props) => {
  let time = dayjs(null);
  if(props.value.value !== '') {
    time = dayjs(props.value.value, DateParser);
  }
  return props.label({
    required: props.required,
    style: props.style,
    children: (
      <DateUIView
        picker={'quarter'}
        viewRef={props.viewRef}
        disabledTime={() => disabledTime(props.minTime, props.maxTime)}
        $style={props.style}
        disabled={props.disabled}
        {...datePickerProps(props)}
        minDate={props.minDate}
        maxDate={props.maxDate}
        value={time.isValid() ? time : null}
        onChange={(time) => {
          handleDateChange(
            time && time.isValid()
              ? time.format(DATE_FORMAT)
              : "",
            props.value.onChange,
            props.onEvent
          );
        }}
        onPanelChange={() => {
        }}
        onFocus={() => props.onEvent("focus")}
        onBlur={() => props.onEvent("blur")}
        suffixIcon={hasIcon(props.suffixIcon) && props.suffixIcon}
      />
    ),
    ...validate(props),
  });
})
  .setPropertyViewFn((children) => {
    const isMobile = useIsMobile();
    return (
      <>
        <Section name={sectionNames.basic}>
          {children.value.propertyView({
            label: trans("prop.defaultValue"),
            placeholder: "2022-04-07",
            tooltip: trans("date.formatTip"),
          })}
          {formatPropertyView({ children })}
        </Section>

        <FormDataPropertyView {...children} />

        {children.label.getPropertyView()}

        <Section name={sectionNames.interaction}>
          {children.onEvent.getPropertyView()}
          {disabledPropertyView(children)}
        </Section>

        <Section name={sectionNames.validation}>
          {requiredPropertyView(children)}
          {dateValidationFields(children)}
          {timeValidationFields(children)}
          {children.customRule.propertyView({})}
        </Section>

        {!isMobile && commonAdvanceSection(children)}

        <Section name={sectionNames.layout}>
          {children.suffixIcon.propertyView({ label: trans("button.suffixIcon") })}
          {hiddenPropertyView(children)}
        </Section>

        <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
      </>
    );
  })
  .setExposeMethodConfigs(dateRefMethods)
  .build();

export const QuarterPickerComp = withExposingConfigs(quarterPickerControl, [
  depsConfig({
    name: "value",
    desc: trans("export.quarterPickerDaysInMonthDesc"),
    depKeys: ["value"],
    func: (input) => {
      const mom = dayjs(input.value, DateParser);
      return mom.isValid() ? parseInt(mom.format('Q')) : "";
    },
  }),
  depsConfig({
    name: "daysInQuarter",
    desc: trans("export.quarterPickerDaysInMonthDesc"),
    depKeys: ["value"],
    func: (input) => {
      const mom = dayjs(input.value, DateParser);
      return mom.isValid() ? mom.add(2,"month").endOf('month').diff(mom.startOf('month'),"day")+1 : "";
    },
  }),
  depsConfig({
    name: "startOf",
    desc: trans("export.dateRangeStartDesc"),
    depKeys: ["value"],
    func: (input) => {
      const mom = dayjs(input.value, DateParser).startOf('month');
      return mom.isValid() ? mom : "";
    },
  }),
  depsConfig({
    name: "endOf",
    desc: trans("export.dateRangeEndDesc"),
    depKeys: ["value"],
    func: (input) => {
      const mom = dayjs(input.value, DateParser).endOf('month');
      return mom.isValid() ? mom.add(2,"month") : "";
    },
  }),
  depsConfig({
    name: "formattedValue",
    desc: trans("export.datePickerFormattedValueDesc"),
    depKeys: ["value", "format"],
    func: (input) => {
      const mom = dayjs(input.value, DateParser);
      return mom.isValid() ? mom.format(input.format) : "";
    },
  }),
  depsConfig({
    name: "invalid",
    desc: trans("export.invalidDesc"),
    depKeys: ["value", "required", "minTime", "maxTime", "minDate", "maxDate", "customRule"],
    func: (input) =>
      {
        let x= validate({
        ...input,
        value: { value: input.value },
      } as any).validateStatus !== "success"
      return x
    }
  }),
  ...CommonNameConfig,
]);

export const yearPickerControl = new UICompBuilder(
  {...childrenMap,...{format: withDefault(StringControl,'YYYY')}}
  , (props) => {
  let time = dayjs(null);
  if(props.value.value !== '') {
    time = dayjs(props.value.value, DateParser);
  }
  return props.label({
    required: props.required,
    style: props.style,
    children: (
      <DateUIView
        picker={'year'}
        viewRef={props.viewRef}
        disabledTime={() => disabledTime(props.minTime, props.maxTime)}
        $style={props.style}
        disabled={props.disabled}
        {...datePickerProps(props)}
        minDate={props.minDate}
        maxDate={props.maxDate}
        value={time.isValid() ? time : null}
        onChange={(time) => {
          handleDateChange(
            time && time.isValid()
              ? time.format(DATE_FORMAT)
              : "",
            props.value.onChange,
            props.onEvent
          );
        }}
        onPanelChange={() => {
        }}
        onFocus={() => props.onEvent("focus")}
        onBlur={() => props.onEvent("blur")}
        suffixIcon={hasIcon(props.suffixIcon) && props.suffixIcon}
      />
    ),
    ...validate(props),
  });
})
  .setPropertyViewFn((children) => {
    const isMobile = useIsMobile();
    return (
      <>
        <Section name={sectionNames.basic}>
          {children.value.propertyView({
            label: trans("prop.defaultValue"),
            placeholder: "2023",
            tooltip: trans("date.formatTip"),
          })}
          {formatPropertyView({ children })}
        </Section>

        <FormDataPropertyView {...children} />

        {children.label.getPropertyView()}

        <Section name={sectionNames.interaction}>
          {children.onEvent.getPropertyView()}
          {disabledPropertyView(children)}
        </Section>

        <Section name={sectionNames.validation}>
          {requiredPropertyView(children)}
          {dateValidationFields(children)}
          {timeValidationFields(children)}
          {children.customRule.propertyView({})}
        </Section>

        {!isMobile && commonAdvanceSection(children)}

        <Section name={sectionNames.layout}>
          {children.suffixIcon.propertyView({ label: trans("button.suffixIcon") })}
          {hiddenPropertyView(children)}
        </Section>

        <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
      </>
    );
  })
  .setExposeMethodConfigs(dateRefMethods)
  .build();

export const YearPickerComp = withExposingConfigs(yearPickerControl, [
  depsConfig({
    name: "value",
    desc: trans("export.yearPickerDaysInMonthDesc"),
    depKeys: ["value"],
    func: (input) => {
      const mom = dayjs(input.value, DateParser);
      return mom.isValid() ? mom.year() : "";
    },
  }),
  depsConfig({
    name: "daysInYear",
    desc: trans("export.yearPickerDaysInMonthDesc"),
    depKeys: ["value"],
    func: (input) => {
      const mom = dayjs(input.value, DateParser);
      return mom.isValid() ? mom.endOf('year').diff(mom.startOf("year"),"day")+1 : "";
    },
  }),
  depsConfig({
    name: "startOf",
    desc: trans("export.dateRangeStartDesc"),
    depKeys: ["value"],
    func: (input) => {
      const mom = dayjs(input.value, DateParser).startOf('year');
      return mom.isValid() ? mom: "";
    },
  }),
  depsConfig({
    name: "endOf",
    desc: trans("export.dateRangeEndDesc"),
    depKeys: ["value"],
    func: (input) => {
      const mom = dayjs(input.value, DateParser).endOf('year');
      return mom.isValid() ? mom: "";
    },
  }),
  depsConfig({
    name: "formattedValue",
    desc: trans("export.datePickerFormattedValueDesc"),
    depKeys: ["value", "format"],
    func: (input) => {
      const mom = dayjs(input.value, DateParser);
      return mom.isValid() ? mom.format(input.format) : "";
    },
  }),
  depsConfig({
    name: "invalid",
    desc: trans("export.invalidDesc"),
    depKeys: ["value", "required", "minTime", "maxTime", "minDate", "maxDate", "customRule"],
    func: (input) =>
      {
        let x= validate({
        ...input,
        value: { value: input.value },
      } as any).validateStatus !== "success"
      return x
    }
  }),
  ...CommonNameConfig,
]);

export const DatePickerComp = withExposingConfigs(datePickerControl, [
  depsConfig({
    name: "value",
    desc: trans("export.datePickerValueDesc"),
    depKeys: ["value", "showTime"],
    func: (input) => {
      const mom = dayjs(input.value, DateParser);
      return mom.isValid() ? mom.format(input.showTime ? DATE_TIME_FORMAT : DATE_FORMAT) : "";
    },
  }),
  depsConfig({
    name: "formattedValue",
    desc: trans("export.datePickerFormattedValueDesc"),
    depKeys: ["value", "format"],
    func: (input) => {
      const mom = dayjs(input.value, DateParser);
      return mom.isValid() ? mom.format(input.format) : "";
    },
  }),
  depsConfig({
    name: "timestamp",
    desc: trans("export.datePickerTimestampDesc"),
    depKeys: ["value"],
    func: (input) => {
      const mom = dayjs(input.value, DateParser);
      return mom.isValid() ? mom.unix() : "";
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
  ...CommonNameConfig,
]);

export let DateRangeComp = withExposingConfigs(dateRangeControl, [
  depsConfig({
    name: "start",
    desc: trans("export.dateRangeStartDesc"),
    depKeys: ["start", "showTime"],
    func: (input) => {
      const mom = dayjs(input.start, DateParser);
      return mom.isValid() ? mom.format(input.showTime ? DATE_TIME_FORMAT : DATE_FORMAT) : "";
    },
  }),
  depsConfig({
    name: "end",
    desc: trans("export.dateRangeEndDesc"),
    depKeys: ["end", "showTime"],
    func: (input) => {
      const mom = dayjs(input.end, DateParser);
      return mom.isValid() ? mom.format(input.showTime ? DATE_TIME_FORMAT : DATE_FORMAT) : "";
    },
  }),
  depsConfig({
    name: "startTimestamp",
    desc: trans("export.dateRangeStartTimestampDesc"),
    depKeys: ["start"],
    func: (input) => {
      const mom = dayjs(input.start, DateParser);
      return mom.isValid() ? mom.unix() : "";
    },
  }),
  depsConfig({
    name: "endTimestamp",
    desc: trans("export.dateRangeEndTimestampDesc"),
    depKeys: ["end"],
    func: (input) => {
      const mom = dayjs(input.end, DateParser);
      return mom.isValid() ? mom.unix() : "";
    },
  }),
  depsConfig({
    name: "formattedValue",
    desc: trans("export.dateRangeFormattedValueDesc"),
    depKeys: ["start", "end", "format"],
    func: (input) => {
      const start = dayjs(input.start, DateParser);
      const end = dayjs(input.end, DateParser);
      return [
        start.isValid() && start.format(input.format),
        end.isValid() && end.format(input.format),
      ]
        .filter((item) => item)
        .join(" - ");
    },
  }),
  depsConfig({
    name: "formattedStartValue",
    desc: trans("export.dateRangeFormattedStartValueDesc"),
    depKeys: ["start", "format"],
    func: (input) => {
      const start = dayjs(input.start, DateParser);
      return start.isValid() && start.format(input.format);
    },
  }),
  depsConfig({
    name: "formattedEndValue",
    desc: trans("export.dateRangeFormattedEndValueDesc"),
    depKeys: ["end", "format"],
    func: (input) => {
      const end = dayjs(input.end, DateParser);
      return end.isValid() && end.format(input.format);
    },
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
]);
