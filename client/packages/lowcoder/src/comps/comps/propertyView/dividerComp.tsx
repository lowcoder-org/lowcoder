import {Section, sectionNames} from "components/Section";
import {trans} from "@lowcoder-ee/i18n";
import {useContext} from "react";
import {EditorContext, hiddenPropertyView} from "lowcoder-sdk";
import _ from "lodash";
const PropertyView = ((children: any) => {
    return (
        <>
            {!children?.type?.getView() &&
                <Section name={sectionNames.basic}>
                    {children.title.propertyView({ label: trans("divider.title") })}
                </Section>}

            {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <Section name={sectionNames.interaction}>
                    {hiddenPropertyView(children)}
                </Section>
            )}

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <>
                    <Section name={sectionNames.layout}>
                        {!_.isEmpty(children.title.getView()) &&
                            children.align.propertyView({
                                label: trans("divider.align"),
                                radioButton: true,
                            })}
                        {children.autoHeight.getPropertyView()}
                    </Section>
                    <Section name={sectionNames.style}>
                        {children.type.propertyView({ label: trans("divider.type")})}
                        {children.style.getPropertyView()}
                    </Section>
                    <Section name={sectionNames.animationStyle}hasTooltip={true}>
                        {children.animationStyle.getPropertyView()}
                    </Section>
                </>
            )}
        </>
    );
})

export default PropertyView;