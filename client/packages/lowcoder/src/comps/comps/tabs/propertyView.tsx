import { Section, sectionNames } from "components/Section";
import { trans } from "@lowcoder-ee/i18n";
import React, { useContext } from "react";
import { disabledPropertyView, EditorContext, hiddenPropertyView, loadingPropertyView } from "lowcoder-sdk";

const SetPropertyViewFn = ((children: any) => {
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.tabs.propertyView({
                    title: trans("tabbedContainer.tab"),
                    newOptionLabel: "Tab",
                })}
                {children.selectedTabKey.propertyView({ label: trans("prop.defaultValue") })}
            </Section>

            {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <Section name={sectionNames.interaction}>
                    {children.onEvent.getPropertyView()}
                    {disabledPropertyView(children)}
                    {hiddenPropertyView(children)}
                    {children.showHeader.propertyView({ label: trans("tabbedContainer.showTabs") })}
                    {children.destroyInactiveTab.propertyView({ label: trans("tabbedContainer.destroyInactiveTab") })}
                </Section>
            )}

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <>
                    <Section name={sectionNames.layout}>
                        {children.placement.propertyView({ label: trans("tabbedContainer.placement"), radioButton: true })}
                        {children.tabsCentered.propertyView({ label: trans("tabbedContainer.tabsCentered")})}
                        { children.tabsGutter.propertyView({ label: trans("tabbedContainer.gutter"), tooltip : trans("tabbedContainer.gutterTooltip") })}
                        {children.horizontalGridCells.propertyView({
                            label: trans('prop.horizontalGridCells'),
                        })}
                        {children.autoHeight.getPropertyView()}
                        {!children.autoHeight.getView() && (
                            children.showVerticalScrollbar.propertyView({
                                label: trans("prop.showVerticalScrollbar"),
                            })
                        )}
                    </Section>
                    <Section name={sectionNames.style}>
                        {children.style.getPropertyView()}
                    </Section>
                    {children.showHeader.getView() && (
                        <Section name={"Header Style"}>
                            { children.headerStyle.getPropertyView() }
                        </Section>
                    )}
                    <Section name={"Body Style"}>
                        { children.bodyStyle.getPropertyView() }
                    </Section>
                    <Section name={sectionNames.animationStyle} hasTooltip={true}>
                        { children.animationStyle.getPropertyView() }
                    </Section>
                </>
            )}
        </>
    );
});

export default SetPropertyViewFn;
