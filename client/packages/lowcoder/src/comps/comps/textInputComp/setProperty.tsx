import { Section, sectionNames } from "components/Section";
import { trans } from "@lowcoder-ee/i18n";
import React, { useContext } from "react";
import {
    allowClearPropertyView,
    disabledPropertyView,
    EditorContext,
    hiddenPropertyView,
    loadingPropertyView,
    maxLengthPropertyView,
    minLengthPropertyView,
    readOnlyPropertyView,
    regexPropertyView,
    requiredPropertyView
} from "lowcoder-sdk";
import {
    TextInputBasicSection,
    TextInputInteractionSection, TextInputValidationSection
} from "@lowcoder-ee/comps/comps/textInputComp/textInputConstants";
import {FormDataPropertyView} from "@lowcoder-ee/comps/comps/formComp/formDataConstants";


const SetPropertyViewInputComp = ((children: any) => {
    return (
        <>
            <TextInputBasicSection {...children} />
            <FormDataPropertyView {...children} />

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                children.label.getPropertyView()
            )}

            {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <><TextInputInteractionSection {...children} />
                    <Section name={sectionNames.layout}>{hiddenPropertyView(children)}</Section>
                    <Section name={sectionNames.advanced}>
                        {children.prefixIcon.propertyView({ label: trans("button.prefixIcon") })}
                        {children.suffixIcon.propertyView({ label: trans("button.suffixIcon") })}
                        {children.showCount.propertyView({ label: trans("prop.showCount") })}
                        {allowClearPropertyView(children)}
                        {readOnlyPropertyView(children)}
                    </Section>
                    <TextInputValidationSection {...children} />
                </>
            )}
            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <>
                    <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
                    <Section name={sectionNames.labelStyle}>{children.labelStyle.getPropertyView()}</Section>
                    <Section name={sectionNames.inputFieldStyle}>{children.inputFieldStyle.getPropertyView()}</Section>
                    <Section name={sectionNames.animationStyle} hasTooltip={true}>{children.animationStyle.getPropertyView()}</Section>
                </>
            )}
        </>
    );
});

const SetPropertyViewMentionComp = ((children: any) => {
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.value.propertyView({ label: trans("prop.defaultValue") })}
                {children.placeholder.propertyView({
                    label: trans("prop.placeholder"),
                })}
                {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                    children.mentionList.propertyView({
                        label: trans("mention.mentionList"),
                    })
                )}
            </Section>
            <FormDataPropertyView {...children} />

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                children.label.getPropertyView()
            )}

            {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <><Section name={sectionNames.interaction}>
                    {children.onEvent.getPropertyView()}
                    {disabledPropertyView(children)}
                </Section>
                    <Section name={sectionNames.layout}>{hiddenPropertyView(children)}</Section>
                    <Section name={sectionNames.advanced}>
                        {readOnlyPropertyView(children)}
                    </Section><Section name={sectionNames.validation}>
                        {requiredPropertyView(children)}
                        {children.validationType.propertyView({
                            label: trans("prop.textType"),
                        })}
                        {minLengthPropertyView(children)}
                        {maxLengthPropertyView(children)}
                        {children.customRule.propertyView({})}
                    </Section></>
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

const SetPropertyViewPasswordComp = ((children: any) => {
    return (
        <>
            <TextInputBasicSection {...children} />
            <FormDataPropertyView {...children} />

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                children.label.getPropertyView()
            )}

            {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <><TextInputInteractionSection {...children} />
                    <Section name={sectionNames.layout}>{hiddenPropertyView(children)}</Section>
                    <Section name={sectionNames.advanced}>
                        {children.visibilityToggle.propertyView({
                            label: trans("password.visibilityToggle"),
                        })}
                        {readOnlyPropertyView(children)}
                        {children.prefixIcon.propertyView({ label: trans("button.prefixIcon") })}
                    </Section><Section name={sectionNames.validation}>
                        {requiredPropertyView(children)}
                        {children.showValidationWhenEmpty.propertyView({label: trans("prop.showEmptyValidation")})}
                        {regexPropertyView(children)}
                        {minLengthPropertyView(children)}
                        {maxLengthPropertyView(children)}
                        {children.customRule.propertyView({})}
                    </Section></>
            )}

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <>
                    <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
                    <Section name={sectionNames.labelStyle}>{children.labelStyle.getPropertyView()}</Section>
                    <Section name={sectionNames.inputFieldStyle}>{children.inputFieldStyle.getPropertyView()}</Section>
                    <Section name={sectionNames.animationStyle} hasTooltip={true}>{children.animationStyle.getPropertyView()}</Section>
                </>
            )}
        </>
    );
});

const SetPropertyViewTextAreaComp = ((children: any) => {
    return (
        <>
            <TextInputBasicSection {...children} />
            <FormDataPropertyView {...children} />

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                children.label.getPropertyView()
            )}

            {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <><TextInputInteractionSection {...children} />
                    <Section name={sectionNames.layout}>
                        {children.autoHeight.getPropertyView()}
                        {!children.autoHeight.getView() &&
                            children.textAreaScrollBar.propertyView({
                                label: trans("prop.textAreaScrollBar"),
                            })}
                        {hiddenPropertyView(children)}
                    </Section>
                    <Section name={sectionNames.advanced}>
                        {allowClearPropertyView(children)}
                        {readOnlyPropertyView(children)}
                    </Section>
                    <TextInputValidationSection {...children} /></>
            )}

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <>
                    <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
                    <Section name={sectionNames.labelStyle}>{children.labelStyle.getPropertyView()}</Section>
                    <Section name={sectionNames.inputFieldStyle}>{children.inputFieldStyle.getPropertyView()}</Section>
                    <Section name={sectionNames.animationStyle} hasTooltip={true}>{children.animationStyle.getPropertyView()}</Section>
                </>
            )}
        </>
    );
});


export { SetPropertyViewInputComp, SetPropertyViewMentionComp, SetPropertyViewPasswordComp, SetPropertyViewTextAreaComp }
