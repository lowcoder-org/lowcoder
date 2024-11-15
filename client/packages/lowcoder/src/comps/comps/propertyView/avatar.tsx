import { Section, sectionNames } from "components/Section";
import { trans } from "@lowcoder-ee/i18n";
import React from "react";
import { hiddenPropertyView } from "lowcoder-sdk";
import {BadgeBasicSection} from "@lowcoder-ee/comps/comps/badgeComp/badgeConstants";
const PropertyView = ((children: any) => {
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.src.propertyView({
                    label: trans("avatarComp.src"),
                    placeholder: "http://xxxx/xx.jpg",
                    tooltip: trans("avatarComp.avatarCompTooltip"),
                })}
                {children.title.propertyView({
                    label: trans("avatarComp.title"),
                    tooltip: trans("avatarComp.avatarCompTooltip"),
                })}
                {children.icon.propertyView({
                    label: trans("avatarComp.icon"),
                    IconType: "All",
                    tooltip: trans("avatarComp.avatarCompTooltip"),
                })}
                {children.shape.propertyView({
                    label: trans("avatarComp.shape"),
                    radioButton: true,
                })}
                {
                    children.iconSize.propertyView({
                        label: trans("avatarComp.iconSize"),
                    })}
                {
                    children.enableDropdownMenu.propertyView({
                        label: trans("avatarComp.enableDropDown")
                    })}
                {children.enableDropdownMenu.getView() && children.options.propertyView({})}
            </Section>
            <Section name={trans('avatarComp.label')}>
                {
                    children.avatarLabel.propertyView({
                        label: trans("avatarComp.label"),
                    })}
                {
                    children.avatarCatption.propertyView({
                        label: trans("avatarComp.caption"),
                    })}
                {
                    children.labelPosition.propertyView({
                        label: trans("avatarComp.labelPosition"),
                        radioButton: true,
                    })}
                {
                    children.alignmentPosition.propertyView({
                        label: trans("avatarComp.alignmentPosition"),
                        radioButton: true,
                    })}
            </Section>
            {<BadgeBasicSection {...children} />}
            <Section name={sectionNames.interaction}>
                {children.onEvent.getPropertyView()}
            </Section>
            <Section name={sectionNames.layout}>
                {hiddenPropertyView(children)}
            </Section>
            <Section name={sectionNames.style}>
                {children.style.getPropertyView()}
            </Section>
            <Section name={sectionNames.avatarStyle}>
                {children.avatarStyle.getPropertyView()}
            </Section>
            <Section name={sectionNames.labelStyle}>
                {children.labelStyle.getPropertyView()}
            </Section>
            <Section name={sectionNames.captionStyle}>
                {children.captionStyle.getPropertyView()}
            </Section>
        </>
    );
});

export default PropertyView;