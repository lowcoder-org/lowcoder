import { Section, sectionNames } from "components/Section";
import { trans } from "@lowcoder-ee/i18n";
import React, {useContext} from "react";
import {EditorContext, hiddenPropertyView} from "lowcoder-sdk";
import {FormDataPropertyView} from "@lowcoder-ee/comps/comps/formComp/formDataConstants";

const SetPropertyViewFn = ((children: any) => {
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.data.propertyView({ label: trans("data") })}
            </Section>

            {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <><FormDataPropertyView {...children} />
                    <Section name={sectionNames.interaction}>
                        {children.onEvent.getPropertyView()}
                        {hiddenPropertyView(children)}
                        {children.autoPlay.propertyView({ label: trans("carousel.autoPlay") })}
                    </Section></>
            )}
            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <><Section name={sectionNames.layout}>
                    {children.showDots.propertyView({ label: trans("carousel.showDots") })}
                    {children.dotPosition.propertyView({
                        label: trans("carousel.dotPosition"),
                        radioButton: true,
                    })}
                </Section>
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
});

export default SetPropertyViewFn;