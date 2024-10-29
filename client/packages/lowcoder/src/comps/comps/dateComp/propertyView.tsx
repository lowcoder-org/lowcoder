import {Section, sectionNames} from "components/Section";
import {trans} from "@lowcoder-ee/i18n";
import {FormDataPropertyView} from "@lowcoder-ee/comps/comps/formComp/formDataConstants";
import React, {useContext} from "react";
import {
    AnimationStyle, blurEvent,
    BoolCodeControl, BoolControl, changeEvent, CustomRuleControl, DateTimeStyle,
    disabledPropertyView, dropdownControl,
    EditorContext, eventHandlerControl, focusEvent,
    formatPropertyView,
    hiddenPropertyView, hourStepPropertyView, IconControl, InputFieldStyle, LabelControl, LabelStyle,
    maxDatePropertyView,
    maxTimePropertyView,
    minDatePropertyView,
    minTimePropertyView, minuteStepPropertyView,
    PickerMode, RangeControl,
    RecordConstructorToComp, RefControl,
    requiredPropertyView, SecondStepPropertyView, StringControl, styleControl, useIsMobile, withDefault
} from "lowcoder-sdk";
import {CommonPickerMethods} from "@lowcoder-ee/comps/comps/dateComp/dateCompUtil";
import {timeZoneOptions} from "@lowcoder-ee/comps/comps/dateComp/timeZone";



const SetPropertyViewDateComp2 = ((children: any) => {
    const isMobile = useIsMobile();

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

    const timeFields = (children: CommonChildrenType, isMobile?: boolean) => [
        children.showTime.propertyView({ label: trans("date.showTime") }),
        !isMobile && children.use12Hours.propertyView({ label: trans("prop.use12Hours") }),
    ];

    const EventOptions = [changeEvent, focusEvent, blurEvent] as const;

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
        timeZone: dropdownControl(timeZoneOptions, Intl.DateTimeFormat().resolvedOptions().timeZone),
    };

    type CommonChildrenType = RecordConstructorToComp<typeof commonChildren>;

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

    const editorModeStatus = useContext(EditorContext).editorModeStatus;
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
                {children.timeZone.propertyView({
                    label: trans("prop.timeZone")
                })}
            </Section>

            <FormDataPropertyView {...children} />

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
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
                    </Section>
                </>
            )}

            {(editorModeStatus === "layout" || editorModeStatus === "both") && children.label.getPropertyView()}

            {(editorModeStatus === "layout" || editorModeStatus === "both") && (
                <Section name={sectionNames.layout}>
                    {formatPropertyView({ children })}
                    {children.placeholder.propertyView({ label: trans("date.placeholderText") })}
                </Section>
            )}

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <><Section name={sectionNames.advanced}>
                    {timeFields(children, isMobile)}
                    {children.suffixIcon.propertyView({ label: trans("button.suffixIcon") })}
                </Section></>
            )}
            {(editorModeStatus === "logic" || editorModeStatus === "both") && commonAdvanceSection(children)}

            {(editorModeStatus === "layout" || editorModeStatus === "both") && (
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
                </>
            )}

        </>
    );
});

const SetPropertyViewDateComp1 = ((children: any) => {



    const isMobile = useIsMobile();
    const editorModeStatus = useContext(EditorContext).editorModeStatus;



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

    const timeFields = (children: CommonChildrenType, isMobile?: boolean) => [
        children.showTime.propertyView({ label: trans("date.showTime") }),
        !isMobile && children.use12Hours.propertyView({ label: trans("prop.use12Hours") }),
    ];

    const EventOptions = [changeEvent, focusEvent, blurEvent] as const;

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
        timeZone: dropdownControl(timeZoneOptions, Intl.DateTimeFormat().resolvedOptions().timeZone),
    };

    type CommonChildrenType = RecordConstructorToComp<typeof commonChildren>;

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

    return (
        <>
            <Section name={sectionNames.basic}>
                {children.value.propertyView({
                    label: trans("prop.defaultValue"),
                    placeholder: "2022-04-07 21:39:59",
                    tooltip: trans("date.formatTip")
                })}
                {children.timeZone.propertyView({
                    label: trans("prop.timeZone")
                })}
            </Section>

            <FormDataPropertyView {...children} />

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
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
                    </Section>
                </>
            )}

            {/*{commonAdvanceSection(children, children.dateType.value === "date")}*/}
            {(editorModeStatus === "layout" || editorModeStatus === "both") && children.label.getPropertyView()}

            {(editorModeStatus === "layout" || editorModeStatus === "both") && (
                <Section name={sectionNames.layout}>
                    {formatPropertyView({children})}
                    {children.placeholder.propertyView({label: trans("date.placeholderText")})}
                </Section>
            )}

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <><Section name={sectionNames.advanced}>
                    {timeFields(children, isMobile)}
                    {children.suffixIcon.propertyView({label: trans("button.suffixIcon")})}
                </Section></>
            )}
            {(editorModeStatus === "logic" || editorModeStatus === "both") && !isMobile && commonAdvanceSection(children)}

            {(editorModeStatus === "layout" || editorModeStatus === "both") && (
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
                    <Section name={sectionNames.animationStyle} hasTooltip={true}>
                        {children.animationStyle.getPropertyView()}
                    </Section>
                </>
            )}
        </>
    );
});
const SetPropertyViewTimeComp2 = ((children: any) => {
    const editorModeStatus = useContext(EditorContext).editorModeStatus;

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
        suffixIcon: withDefault(IconControl, "/icon:regular/clock"),
        timeZone: dropdownControl(timeZoneOptions, Intl.DateTimeFormat().resolvedOptions().timeZone),
        viewRef: RefControl<CommonPickerMethods>,
        ...validationChildren,
    };

    const commonAdvanceSection = (children: RecordConstructorToComp<typeof commonChildren>) => [
        hourStepPropertyView(children),
        minuteStepPropertyView(children),
        SecondStepPropertyView(children),
    ];

    return (
        <>
            <Section name={sectionNames.basic}>
                {children.start.propertyView({
                    label: trans("time.start"),
                    tooltip: trans("time.formatTip"),
                })}
                {children.end.propertyView({
                    label: trans("time.end"),
                    tooltip: trans("time.formatTip"),
                })}
                {children.timeZone.propertyView({
                    label: trans("prop.timeZone")
                })}
            </Section>

            <FormDataPropertyView {...children} />

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
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
                    </Section></>
            )}

            {(editorModeStatus === "layout" || editorModeStatus === "both") && children.label.getPropertyView()}
            {(editorModeStatus === "layout" || editorModeStatus === "both") && (
                <Section name={sectionNames.layout}>
                    {children.format.propertyView({ label: trans("time.format") })}
                    {children.placeholder.propertyView({ label: trans("time.placeholderText") })}
                </Section>
            )}

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <Section name={sectionNames.advanced}>
                    {commonAdvanceSection(children)}
                    {children.use12Hours.propertyView({ label: trans("prop.use12Hours") })}
                    {children.suffixIcon.propertyView({ label: trans("button.suffixIcon") })}
                </Section>
            )}

            {(editorModeStatus === "layout" || editorModeStatus === "both") && (
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
                    <Section name={sectionNames.animationStyle} hasTooltip={true}>
                        {children.animationStyle.getPropertyView()}
                    </Section>
                </>
            )}
        </>
    );
});

const SetPropertyViewTimeComp1 = ((children: any) => {
    const editorModeStatus = useContext(EditorContext).editorModeStatus;

    const validationChildren = {
        showValidationWhenEmpty: BoolControl,
        required: BoolControl,
        minTime: StringControl,
        maxTime: StringControl,
        customRule: CustomRuleControl,
    };
    
    const EventOptions = [changeEvent, focusEvent, blurEvent] as const;

    const commonChildren = {
        label: LabelControl,
        placeholder: withDefault(StringControl, trans("time.placeholder")),
        format: StringControl,
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
        suffixIcon: withDefault(IconControl, "/icon:regular/clock"),
        timeZone: dropdownControl(timeZoneOptions, Intl.DateTimeFormat().resolvedOptions().timeZone),
        viewRef: RefControl<CommonPickerMethods>,
        ...validationChildren,
    };

    const commonAdvanceSection = (children: RecordConstructorToComp<typeof commonChildren>) => [
        hourStepPropertyView(children),
        minuteStepPropertyView(children),
        SecondStepPropertyView(children),
    ];

    return (
        <>
            <Section name={sectionNames.basic}>
                {children.value.propertyView({
                    label: trans("prop.defaultValue"),
                    tooltip: trans("time.formatTip"),
                })}
                {children.timeZone.propertyView({
                    label: trans("prop.timeZone")
                })}
            </Section>

            <FormDataPropertyView {...children} />

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
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
                    </Section></>
            )}

            {(editorModeStatus === "layout" || editorModeStatus === "both") && children.label.getPropertyView()}
            {(editorModeStatus === "layout" || editorModeStatus === "both") && (
                <Section name={sectionNames.layout}>
                    {children.format.propertyView({ label: trans("time.format") })}
                    {children.placeholder.propertyView({ label: trans("time.placeholderText") })}
                </Section>
            )}

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <Section name={sectionNames.advanced}>
                    {commonAdvanceSection(children)}
                    {children.use12Hours.propertyView({ label: trans("prop.use12Hours") })}
                    {children.suffixIcon.propertyView({ label: trans("button.suffixIcon") })}
                </Section>
            )}

            {(editorModeStatus === "layout" || editorModeStatus === "both") && (
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
                    <Section name={sectionNames.animationStyle} hasTooltip={true}>
                        {children.animationStyle.getPropertyView()}
                    </Section>
                </>
            )}
        </>
    );
});



export {SetPropertyViewDateComp1, SetPropertyViewDateComp2, SetPropertyViewTimeComp1, SetPropertyViewTimeComp2};