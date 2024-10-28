import {Section, sectionNames} from "components/Section";
import {trans} from "@lowcoder-ee/i18n";
import {useContext} from "react";
import {EditorContext, hiddenPropertyView} from "lowcoder-sdk";

const SetPropertyViewFn = ((children: any) => {
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.value.propertyView({
                    label: trans("progress.value"),
                    tooltip: trans("progress.valueTooltip"),
                })}
            </Section>

            {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <Section name={sectionNames.interaction}>
                    {hiddenPropertyView(children)}
                    {children.showInfo.propertyView({
                        label: trans("progress.showInfo"),
                    })}
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
})

export default SetPropertyViewFn;