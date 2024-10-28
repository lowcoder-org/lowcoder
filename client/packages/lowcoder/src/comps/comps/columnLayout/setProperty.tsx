import { Section, sectionNames } from "components/Section";
import { trans } from "@lowcoder-ee/i18n";
import React, { useContext } from "react";
import {controlItem, disabledPropertyView, EditorContext, hiddenPropertyView, loadingPropertyView} from "lowcoder-sdk";

function isDefault(type?: string) {
    return !type;
}

const SetPropertyViewFn = ((children: any) => {
    const editorModeStatus = useContext(EditorContext).editorModeStatus;
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.columns.propertyView({
                    title: trans("responsiveLayout.column"),
                    newOptionLabel: trans("responsiveLayout.addColumn"),
                })}
            </Section>

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <Section name={sectionNames.interaction}>
                    {disabledPropertyView(children)}
                    {hiddenPropertyView(children)}
                </Section>
            )}

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <>
                    <Section name={sectionNames.layout}>
                        {children.autoHeight.getPropertyView()}
                        {(!children.autoHeight.getView()) && children.mainScrollbar.propertyView({
                            label: trans("prop.mainScrollbar")
                        })}
                        {children.horizontalGridCells.propertyView({
                            label: trans('prop.horizontalGridCells'),
                        })}
                    </Section>
                    <Section name={trans("responsiveLayout.columnsLayout")}>
                        {children.matchColumnsHeight.propertyView({ label: trans("responsiveLayout.matchColumnsHeight")
                        })}
                        {controlItem({}, (
                            <div style={{ marginTop: '8px' }}>{trans("responsiveLayout.columnsSpacing")}</div>
                        ))}
                        {children.templateColumns.propertyView({label: trans("responsiveLayout.columnDefinition"), tooltip: trans("responsiveLayout.columnsDefinitionTooltip")})}
                        {children.templateRows.propertyView({label: trans("responsiveLayout.rowDefinition"), tooltip: trans("responsiveLayout.rowsDefinitionTooltip")})}
                        {children.columnGap.propertyView({label: trans("responsiveLayout.columnGap")})}
                        {children.rowGap.propertyView({label: trans("responsiveLayout.rowGap")})}
                    </Section>
                </>
            )}

            {(editorModeStatus === "layout" || editorModeStatus === "both") && (
                <>
                    <Section name={sectionNames.style}>
                        {children.style.getPropertyView()}
                    </Section>
                    <Section name={sectionNames.columnStyle}>
                        {children.columnStyle.getPropertyView()}
                    </Section>
                </>
            )}
        </>
    );
});

export default SetPropertyViewFn;