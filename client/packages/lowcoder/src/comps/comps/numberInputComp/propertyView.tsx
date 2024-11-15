import { Section, sectionNames } from "components/Section";
import { trans } from "@lowcoder-ee/i18n";
import React, { useContext } from "react";
import {
    disabledPropertyView,
    EditorContext,
    hiddenPropertyView,
    loadingPropertyView,
    placeholderPropertyView, readOnlyPropertyView, requiredPropertyView
} from "lowcoder-sdk";
import {FormDataPropertyView} from "@lowcoder-ee/comps/comps/formComp/formDataConstants";
import {SliderPropertyView} from "@lowcoder-ee/comps/comps/numberInputComp/sliderCompConstants";

console.log("proper")

const PropertyViewNumberInputComp = ((children: any) => {
    const editorModeStatus = useContext(EditorContext).editorModeStatus;
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.defaultValue.propertyView({ label: trans("prop.defaultValue") })}
                {placeholderPropertyView(children)}
                {children.formatter.propertyView({ label: trans("numberInput.formatter") })}
            </Section>

            <FormDataPropertyView {...children} />

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <><Section name={sectionNames.validation}>
                    {requiredPropertyView(children)}
                    {children.showValidationWhenEmpty.propertyView({label: trans("prop.showEmptyValidation")})}
                    {children.min.propertyView({ label: trans("prop.minimum") })}
                    {children.max.propertyView({ label: trans("prop.maximum") })}
                    {children.customRule.propertyView({})}
                </Section>
                    <Section name={sectionNames.interaction}>
                        {children.onEvent.getPropertyView()}
                        {disabledPropertyView(children)}
                        {hiddenPropertyView(children)}
                    </Section>
                </>
            )}

            {(editorModeStatus === "layout" || editorModeStatus === "both") && (
                children.label.getPropertyView()
            )}

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <Section name={sectionNames.advanced}>
                    {children.step.propertyView({ label: trans("numberInput.step") })}
                    {children.precision.propertyView({ label: trans("numberInput.precision") })}
                    {children.prefixIcon.propertyView({ label: trans("button.prefixIcon") })}
                    {children.prefixText.propertyView({ label: trans("button.prefixText") })}
                    {children.allowNull.propertyView({ label: trans("numberInput.allowNull") })}
                    {children.thousandsSeparator.propertyView({
                        label: trans("numberInput.thousandsSeparator"),
                    })}
                    {children.controls.propertyView({ label: trans("numberInput.controls") })}
                    {readOnlyPropertyView(children)}
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

const PropertyViewRangeSliderComp = ((children: any) => {
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.start.propertyView({ label: trans("rangeSlider.start") })}
                {children.end.propertyView({ label: trans("rangeSlider.end") })}
                {children.max.propertyView({ label: trans("prop.maximum") })}
                {children.min.propertyView({ label: trans("prop.minimum") })}
                {children.step.propertyView({
                    label: trans("rangeSlider.step"),
                    tooltip: trans("rangeSlider.stepTooltip"),
                })}
                {children.vertical.propertyView({ label: trans("slider.vertical") })}
            </Section>

            <SliderPropertyView {...children} />
        </>
    );
});

const PropertyViewSliderComp = ((children: any) => {
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.value.propertyView({ label: trans("prop.defaultValue") })}
                {children.max.propertyView({ label: trans("prop.maximum") })}
                {children.min.propertyView({ label: trans("prop.minimum") })}
                {children.step.propertyView({
                    label: trans("slider.step"),
                    tooltip: trans("slider.stepTooltip"),
                })}
                {children.vertical.propertyView({ label: trans("slider.vertical") })}
            </Section>
            <FormDataPropertyView {...children} />
            <SliderPropertyView {...children} />
        </>
    );
});

export {PropertyViewNumberInputComp, PropertyViewRangeSliderComp, PropertyViewSliderComp}