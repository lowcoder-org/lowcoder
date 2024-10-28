import { Section, sectionNames } from "components/Section";
import { trans } from "@lowcoder-ee/i18n";
import React, { useContext } from "react";
import { disabledPropertyView, EditorContext, hiddenPropertyView } from "lowcoder-sdk";

console.log("shape");

const SetPropertyViewFn = ((children: any) => {
    const editorModeStatus = useContext(EditorContext).editorModeStatus;
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.icon.propertyView({
                    label: trans("iconComp.icon"),
                    IconType: "All",
                })}
            </Section>
            {(editorModeStatus === "logic" ||
                editorModeStatus === "both") && (
                <Section name={sectionNames.interaction}>
                    {disabledPropertyView(children)}
                    {hiddenPropertyView(children)}
                </Section>
            )}

            {(editorModeStatus === "layout" ||
                editorModeStatus === "both") && (
                <>
                    <Section name={sectionNames.layout}>
                        {children.container.getPropertyView()}
                    </Section>
                    <Section name={sectionNames.style}>
                        {children.container.stylePropertyView()}
                    </Section>
                    {children.container.children.showBody.getView() && (
                        <Section name={"Body Style"}>
                            {children.container.bodyStylePropertyView()}
                        </Section>
                    )}
                </>
            )}
        </>
    );
});

export default SetPropertyViewFn;