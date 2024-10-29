import { Section, sectionNames } from "components/Section";
import { trans } from "@lowcoder-ee/i18n";
import React, { useContext } from "react";
import { disabledPropertyView, EditorContext, hiddenPropertyView, loadingPropertyView } from "lowcoder-sdk";
import {SelectInputValidationSection} from "@lowcoder-ee/comps/comps/selectInputComp/selectInputConstants";
import {FormDataPropertyView} from "@lowcoder-ee/comps/comps/formComp/formDataConstants";



const SetPropertyViewStepControl = ((children: any) => {
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.options.propertyView({})}
                {children.initialValue.propertyView({ label: trans("step.initialValue"), tooltip : trans("step.initialValueTooltip")})}
            </Section>

            {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <>
                    <Section name={sectionNames.interaction}>
                        {children.onEvent.getPropertyView()}
                        {disabledPropertyView(children)}
                        {hiddenPropertyView(children)}
                        {children.stepStatus.propertyView({label: trans("step.status")})}
                        {children.stepPercent.propertyView({label: trans("step.percent")})}
                        {children.selectable.propertyView({label: trans("step.selectable")})}
                    </Section></>
            )}

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <Section name={sectionNames.layout}>
                    {children.autoHeight.getPropertyView()}
                    {children.size.propertyView({
                        label: trans("step.size"),
                        radioButton: true,
                    })}
                    {children.displayType.propertyView({
                        label: trans("step.type"),
                        radioButton: false,
                    })}
                    {children.direction.propertyView({
                        label: trans("step.direction"),
                        radioButton: true,
                    })}
                    { children.direction.getView() == "horizontal" &&
                        children.labelPlacement.propertyView({
                            label: trans("step.labelPlacement"),
                            radioButton: true,
                        })
                    }
                    {children.direction.getView() == "horizontal" && (
                        children.minHorizontalWidth.propertyView({
                            label: trans("prop.minHorizontalWidth"),
                            placeholder: '100px',
                        })
                    )}
                    {!children.autoHeight.getView() && (
                        children.showScrollBars.propertyView({
                            label: trans("prop.scrollbar"),
                        })
                    )}
                    { children.displayType.getView() != "inline" && !children.showIcons.getView() && (
                        children.showDots.propertyView({label: trans("step.showDots")}
                        ))}
                    { children.displayType.getView() != "inline" && !children.showDots.getView() && (
                        children.showIcons.propertyView({label: trans("step.showIcons")}
                        ))}
                </Section>
            )}

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <>
                    <Section name={sectionNames.style}>
                        {children.style.getPropertyView()}
                    </Section>
                    <Section name={sectionNames.animationStyle} hasTooltip={true}>
                        {children.animationStyle.getPropertyView()}
                    </Section>
                </>
            )}
        </>
    );
});

const SetPropertyViewSegmentedControl = ((children: any) => {
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.options.propertyView({})}
                {children.defaultValue.propertyView({ label: trans("prop.defaultValue") })}
            </Section>

            {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <><SelectInputValidationSection {...children} />
                    <FormDataPropertyView {...children} />
                    <Section name={sectionNames.interaction}>
                        {children.onEvent.getPropertyView()}
                        {disabledPropertyView(children)}
                        {hiddenPropertyView(children)}
                    </Section></>
            )}

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                children.label.getPropertyView()
            )}

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <>
                    <Section name={sectionNames.style}>
                        {children.style.getPropertyView()}
                    </Section>
                    <Section name={sectionNames.labelStyle}>
                        {children.labelStyle.getPropertyView()}
                    </Section>
                    <Section name={sectionNames.animationStyle} hasTooltip={true}>
                        {children.animationStyle.getPropertyView()}
                    </Section>
                </>
            )}
        </>
    );
});

export { SetPropertyViewStepControl,  SetPropertyViewSegmentedControl }