import {useContext} from "react";
import {EditorContext, hiddenPropertyView, Section, sectionNames} from "lowcoder-sdk";
import {trans} from "@lowcoder-ee/i18n";

const PropertyView = ((children: any) => {
    return (
        <>
            {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <>
                    <Section name={sectionNames.basic}>
                        {children.timerType.propertyView({
                            label: trans('timer.timerType')
                        })}
                        {children.defaultValue.propertyView({
                            label: trans('timer.defaultValue')
                        })}
                        {children.hideButton.propertyView({
                            label: trans('timer.hideButton')
                        })}
                    </Section>
                    <Section name={sectionNames.interaction}>
                        {hiddenPropertyView(children)}
                        {children.onEvent.propertyView()}
                    </Section>
                </>
            )}

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <>
                    <Section name={sectionNames.style}>
                        {children.style.getPropertyView()}
                    </Section>
                    <Section name={sectionNames.animationStyle} hasTooltip={true}>
                        {children.animationStyle.getPropertyView()}
                    </Section>
                    <Section name={sectionNames.startButtonStyle}>
                        {children.startButtonStyle.getPropertyView()}
                    </Section>
                    <Section name={sectionNames.resetButtonStyle}>
                        {children.resetButtonStyle.getPropertyView()}
                    </Section>
                </>
            )}
        </>
    );
})

export default PropertyView;