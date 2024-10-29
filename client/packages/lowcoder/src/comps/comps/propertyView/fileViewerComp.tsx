import {Section, sectionNames} from "components/Section";
import {trans} from "@lowcoder-ee/i18n";
import {useContext} from "react";
import {EditorContext, hiddenPropertyView} from "lowcoder-sdk";

const SetPropertyViewFn = ((children: any) => {
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.src.propertyView({
                    label: trans("fileViewer.src"),
                    tooltip: (
                        <span>{trans("fileViewer.srcTooltip")}</span>
                    ),
                })}
            </Section>

            {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <Section name={sectionNames.interaction}>
                    {hiddenPropertyView(children)}
                </Section>
            )}
            <Section name={sectionNames.layout}>
                {children.autoHeight.getPropertyView()}
                {!children.autoHeight.getView() && (
                    children.showVerticalScrollbar.propertyView({
                        label: trans("prop.showVerticalScrollbar"),
                    })
                )}
            </Section>

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
})

export default SetPropertyViewFn;
