import { Section, sectionNames } from "components/Section";
import { trans } from "@lowcoder-ee/i18n";
import React, { useContext } from "react";
import {
    allowClearPropertyView,
    disabledPropertyView,
    EditorContext,
    hiddenPropertyView,
    loadingPropertyView,
    placeholderPropertyView, showSearchPropertyView
} from "lowcoder-sdk";
import {formSection, treeDataPropertyView, valuePropertyView} from "@lowcoder-ee/comps/comps/treeComp/treeUtils";
import {SelectInputValidationSection} from "@lowcoder-ee/comps/comps/selectInputComp/selectInputConstants";

console.log("tree");

const SetPropertyViewTreeComp = ((children: any) => {
    return (
        <>
            <Section name={sectionNames.basic}>
                {treeDataPropertyView(children)}
            </Section>

            {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <><SelectInputValidationSection {...children} />
                    {formSection(children)}
                    <Section name={sectionNames.interaction}>
                        {children.onEvent.getPropertyView()}
                        {children.hidden.propertyView({ label: trans("prop.hide") })}
                        {children.disabled.propertyView({ label: trans("prop.disabled") })}
                        {children.selectType.propertyView({ label: trans("tree.selectType") })}
                        {children.selectType.getView() !== "none" && valuePropertyView(children)}
                        {children.selectType.getView() === "check" &&
                            children.checkStrictly.propertyView({
                                label: trans("tree.checkStrictly"),
                                tooltip: trans("tree.checkStrictlyTooltip"),
                            })}
                    </Section>
                </>
            )}

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <Section name={sectionNames.layout}>
                    {children.autoHeight.getPropertyView()}
                    {!children.autoHeight.getView() &&
                        children.verticalScrollbar.propertyView({
                            label: trans("prop.showVerticalScrollbar")
                        })}
                    {children.expanded.propertyView({ label: trans("tree.expanded") })}
                    {children.defaultExpandAll.propertyView({ label: trans("tree.defaultExpandAll") })}
                    {children.showLine.propertyView({ label: trans("tree.showLine") })}
                    {children.showLine.getView() && children.showLeafIcon.propertyView({ label: trans("tree.showLeafIcon") })}
                </Section>
            )}

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (children.label.getPropertyView())}

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <>
                    <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
                    <Section name={sectionNames.labelStyle}>{children.labelStyle.getPropertyView()}</Section>
                    <Section name={sectionNames.inputFieldStyle}>{children.inputFieldStyle.getPropertyView()}</Section>
                </>
            )}
        </>
    );
});

const SetPropertyViewTreeSelectComp = ((children: any) => {
    return (
        <>
            <Section name={sectionNames.basic}>
                {treeDataPropertyView(children)}
                {placeholderPropertyView(children)}
            </Section>

            {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <><SelectInputValidationSection {...children} />
                    {formSection(children)}
                    <Section name={sectionNames.interaction}>
                        {children.onEvent.getPropertyView()}
                        {children.hidden.propertyView({ label: trans("prop.hide") })}
                        {children.disabled.propertyView({ label: trans("prop.disabled") })}
                        {children.selectType.propertyView({ label: trans("tree.selectType") })}
                        {valuePropertyView(children)}
                        {children.selectType.getView() === "check" &&
                            children.checkedStrategy.propertyView({ label: trans("tree.checkedStrategy") })}
                        {allowClearPropertyView(children)}
                        {showSearchPropertyView(children)}
                    </Section>
                </>
            )}

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <Section name={sectionNames.layout}>
                    {children.expanded.propertyView({ label: trans("tree.expanded") })}
                    {children.defaultExpandAll.propertyView({ label: trans("tree.defaultExpandAll") })}
                    {children.showLine.propertyView({ label: trans("tree.showLine") })}
                    {children.showLine.getView() && children.showLeafIcon.propertyView({ label: trans("tree.showLeafIcon") })}
                </Section>
            )}

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && ( children.label.getPropertyView() )}

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <>
                    <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
                    <Section name={sectionNames.labelStyle}>{children.labelStyle.getPropertyView()}</Section>
                    <Section name={sectionNames.inputFieldStyle}>{children.inputFieldStyle.getPropertyView()}</Section>
                </>
            )}
        </>
    );
});

export { SetPropertyViewTreeComp, SetPropertyViewTreeSelectComp }




