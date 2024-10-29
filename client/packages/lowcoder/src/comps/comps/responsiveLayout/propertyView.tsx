import { Section, sectionNames } from "components/Section";
import { trans } from "@lowcoder-ee/i18n";
import React, { useContext } from "react";
import {controlItem, disabledPropertyView, EditorContext, hiddenPropertyView } from "lowcoder-sdk";

const SetPropertyViewFn = ((children: any) => {
    const editorModeStatus = useContext(EditorContext).editorModeStatus;
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.columns.propertyView({
                    title: trans("responsiveLayout.column"),
                    newOptionLabel: "Column",
                })}
            </Section>

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <Section name={sectionNames.interaction}>
                    {disabledPropertyView(children)}
                    {hiddenPropertyView(children)}
                </Section>
            )}

            {["layout", "both"].includes(editorModeStatus) && (
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
                    <Section name={trans("responsiveLayout.rowLayout")}>
                        {children.rowBreak.propertyView({
                            label: trans("responsiveLayout.rowBreak")
                        })}
                        {controlItem({}, (
                            <div style={{ marginTop: '8px' }}>
                                {trans("responsiveLayout.columnsPerRow")}
                            </div>
                        ))}
                        {children.columnPerRowLG.propertyView({
                            label: trans("responsiveLayout.desktop")
                        })}
                        {children.columnPerRowMD.propertyView({
                            label: trans("responsiveLayout.tablet")
                        })}
                        {children.columnPerRowSM.propertyView({
                            label: trans("responsiveLayout.mobile")
                        })}
                    </Section>
                    <Section name={trans("responsiveLayout.columnsLayout")}>
                        {children.matchColumnsHeight.propertyView({
                            label: trans("responsiveLayout.matchColumnsHeight")
                        })}
                        {controlItem({}, (
                            <div style={{ marginTop: '8px' }}>
                                {trans("responsiveLayout.columnsSpacing")}
                            </div>
                        ))}
                        {children.horizontalSpacing.propertyView({
                            label: trans("responsiveLayout.horizontal")
                        })}
                        {children.verticalSpacing.propertyView({
                            label: trans("responsiveLayout.vertical")
                        })}
                    </Section>
                    <Section name={trans("responsiveLayout.rowStyle")}>
                        {children.style.getPropertyView()}
                    </Section>
                    <Section name={trans("responsiveLayout.columnStyle")}>
                        {children.columnStyle.getPropertyView()}
                    </Section>
                    <Section name={sectionNames.animationStyle} hasTooltip={true}>
                        {children.animationStyle.getPropertyView()}
                    </Section>
                </>
            )}
        </>
    );
});

export default SetPropertyViewFn;