import {Section, sectionNames} from "components/Section";
import {trans} from "@lowcoder-ee/i18n";
import {useContext} from "react";
import {EditorContext, hiddenPropertyView} from "lowcoder-sdk";

const SetPropertyViewFn = ((children: any) => {
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.value.propertyView({
                    label: trans("QRCode.value"),
                    tooltip: trans("QRCode.valueTooltip"),
                    placeholder: "https://example.com",
                })}
            </Section>

            {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <><Section name={sectionNames.interaction}>
                    {hiddenPropertyView(children)}
                </Section>
                    <Section name={sectionNames.advanced}>
                        {children.level.propertyView({
                            label: trans("QRCode.level"),
                            tooltip: trans("QRCode.levelTooltip"),
                        })}
                        {children.image.propertyView({
                            label: trans("QRCode.image"),
                            placeholder: "http://logo.jpg",
                        })}
                    </Section>
                </>
            )}

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <>
                    <Section name={sectionNames.style}>
                        {children.style.getPropertyView()}
                        {children.includeMargin.propertyView({ label: trans("QRCode.includeMargin") })}
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