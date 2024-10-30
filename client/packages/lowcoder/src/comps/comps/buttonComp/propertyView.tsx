import { Section, sectionNames } from "components/Section";
import { trans } from "@lowcoder-ee/i18n";
import React, { useContext } from "react";
import { disabledPropertyView, EditorContext, hiddenPropertyView, loadingPropertyView } from "lowcoder-sdk";


function isDefault(type?: string) {
    return !type;
}

const PropertyViewButtonComp = ((children: any) => {
    const editorModeStatus = useContext(EditorContext).editorModeStatus;

    return (
        <>
            <Section name={sectionNames.basic}>
                {children.text.propertyView({ label: trans("text") })}
            </Section>

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <><Section name={sectionNames.interaction}>
                    {children.type.propertyView({ label: trans("prop.type"), radioButton: true })}
                    {isDefault(children.type.getView())
                        ? [
                            children.onEvent.getPropertyView(),
                            disabledPropertyView(children),
                            hiddenPropertyView(children),
                            loadingPropertyView(children),
                        ]
                        : children.form.getPropertyView()}
                </Section>
                </>
            )}

            {(editorModeStatus === "layout" || editorModeStatus === "both") && (
                <>
                    <Section name={sectionNames.layout}>
                        {children.prefixIcon.propertyView({ label: trans("button.prefixIcon") })}
                        {children.suffixIcon.propertyView({ label: trans("button.suffixIcon") })}
                    </Section>
                    <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
                </>
            )}
        </>
    );
});


const PropertyViewDropDownComp = ((children: any) => {
    const editorModeStatus = useContext(EditorContext).editorModeStatus;
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.options.propertyView({})}
            </Section>

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <><Section name={sectionNames.interaction}>
                    {!children.onlyMenu.getView() && children.onEvent.getPropertyView()}
                    {disabledPropertyView(children)}
                    {hiddenPropertyView(children)}
                </Section>
                </>
            )}

            {(editorModeStatus === "layout" || editorModeStatus === "both") && (
                <>
                    <Section name={sectionNames.layout}>
                        {children.text.propertyView({ label: trans("label") })}
                        {children.onlyMenu.propertyView({ label: trans("dropdown.onlyMenu") })}
                    </Section>
                    <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
                </>
            )}
        </>
    );
});


const PropertyViewScannerComp = ((children: any) => {
    const editorModeStatus = useContext(EditorContext).editorModeStatus;
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.text.propertyView({ label: trans("text") })}
            </Section>

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <><Section name={sectionNames.interaction}>
                    {children.onEvent.getPropertyView()}
                    {disabledPropertyView(children)}
                    {hiddenPropertyView(children)}
                </Section>
                    <Section name={sectionNames.advanced}>
                        {children.continuous.propertyView({ label: trans("scanner.continuous") })}
                        {children.continuous.getView() &&
                            children.uniqueData.propertyView({ label: trans("scanner.uniqueData") })}
                        {children.maskClosable.propertyView({ label: trans("scanner.maskClosable") })}
                    </Section>
                </>
            )}

            {(editorModeStatus === "layout" || editorModeStatus === "both") && (
                <><Section name={sectionNames.style}>{children.style.getPropertyView()}</Section></>
            )}
        </>
    );
});

const PropertyViewToggleButton = ((children: any) => {
    const editorModeStatus = useContext(EditorContext).editorModeStatus;
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.value.propertyView({
                    label: trans("prop.defaultValue"),
                    tooltip: trans("toggleButton.valueDesc"),
                })}
            </Section>

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <><Section name={sectionNames.interaction}>
                    {children.onEvent.getPropertyView()}
                    {disabledPropertyView(children)}
                    {hiddenPropertyView(children)}
                    {loadingPropertyView(children)}
                </Section>
                    <Section name={sectionNames.advanced}>
                        {children.showText.propertyView({ label: trans("toggleButton.showText") })}
                        {children.showText.getView() &&
                            children.trueText.propertyView({ label: trans("toggleButton.trueLabel") })}
                        {children.showText.getView() &&
                            children.falseText.propertyView({ label: trans("toggleButton.falseLabel") })}
                        {children.trueIcon.propertyView({ label: trans("toggleButton.trueIconLabel") })}
                        {children.falseIcon.propertyView({ label: trans("toggleButton.falseIconLabel") })}
                        {children.showText.getView() &&
                            children.iconPosition.propertyView({
                                label: trans("toggleButton.iconPosition"),
                                radioButton: true,
                            })}
                        {children.alignment.propertyView({
                            label: trans("toggleButton.alignment"),
                            radioButton: true,
                        })}
                    </Section>
                </>
            )}

            {(editorModeStatus === "layout" ||
                editorModeStatus === "both") && (
                <>
                    <Section name={sectionNames.style}>
                        {children.showBorder.propertyView({
                            label: trans("toggleButton.showBorder"),
                        })}
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

const PropertyViewFloatButton = ((children: any) => {
    const editorModeStatus = useContext(EditorContext).editorModeStatus;
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.buttons.propertyView({})}
                {children.icon.propertyView({ label: trans("icon") })}
                {children.shape.propertyView({ label: trans("floatButton.buttonShape"), radioButton: true })}
                {children.buttonTheme.propertyView({ label: trans("floatButton.buttonTheme"), radioButton: true })}
                {children.dot.propertyView({ label: trans("floatButton.dot") })}
            </Section>
            <Section name={sectionNames.layout}>
                {hiddenPropertyView(children)}
            </Section>
            <Section name={sectionNames.badgeStyle}>{children.badgeStyle.getPropertyView()}</Section>
            <Section name={sectionNames.style}>
                {children.style.getPropertyView()}
            </Section>
            <Section name={sectionNames.animationStyle} hasTooltip={true}>
                {children.animationStyle.getPropertyView()}
            </Section>
        </>
    );
});

const PropertyViewLinkComp = ((children: any) => {
    const editorModeStatus = useContext(EditorContext).editorModeStatus;
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.text.propertyView({ label: trans("text") })}
            </Section>

            {(editorModeStatus === "logic" || editorModeStatus) && (
                <><Section name={sectionNames.interaction}>
                    {children.onEvent.getPropertyView()}
                    {disabledPropertyView(children)}
                    {hiddenPropertyView(children)}
                    {loadingPropertyView(children)}
                </Section>
                    <Section name={sectionNames.advanced}>
                        {children.prefixIcon.propertyView({ label: trans("button.prefixIcon") })}
                        {children.suffixIcon.propertyView({ label: trans("button.suffixIcon") })}
                    </Section></>
            )}

            {(editorModeStatus === "layout" || editorModeStatus === "both") && (
                <>
                    <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
                    <Section name={sectionNames.animationStyle} hasTooltip={true}>{children.animationStyle.getPropertyView()}</Section>
                </>
            )}
        </>
    );
});

export {PropertyViewLinkComp, PropertyViewFloatButton, PropertyViewToggleButton, PropertyViewScannerComp, PropertyViewButtonComp, PropertyViewDropDownComp};