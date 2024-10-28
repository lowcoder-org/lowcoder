import {Section, sectionNames} from "components/Section";
import {trans} from "@lowcoder-ee/i18n";
import {allowClearPropertyView, hiddenPropertyView} from "lowcoder-sdk";
import {itemsDataTooltip} from "@lowcoder-ee/comps/comps/autoCompleteComp/autoCompleteConstants";
import {getDayJSLocale} from "@lowcoder-ee/i18n/dayjsLocale";
import {
    TextInputBasicSection,
    TextInputInteractionSection, TextInputValidationSection
} from "@lowcoder-ee/comps/comps/textInputComp/textInputConstants";
import {FormDataPropertyView} from "@lowcoder-ee/comps/comps/formComp/formDataConstants";
import React from "react";

const  SetPropertyViewFn = ((children: any) => {
    return (
        <>
            <Section>
                {children.autoCompleteType.getView() === 'normal' &&
                    children.prefixIcon.propertyView({
                        label: trans('button.prefixIcon'),
                    })}
                {children.autoCompleteType.getView() === 'normal' &&
                    children.suffixIcon.propertyView({
                        label: trans('button.suffixIcon'),
                    })}
                {allowClearPropertyView(children)}
            </Section>
            <Section name={trans('autoComplete.SectionDataName')}>
                {children.items.propertyView({
                    label: trans('autoComplete.value'),
                    tooltip: itemsDataTooltip,
                    placeholder: '[]',
                })}
                {getDayJSLocale() === 'zh-cn' &&
                    children.searchFirstPY.propertyView({
                        label: trans('autoComplete.searchFirstPY'),
                    })}
                {getDayJSLocale() === 'zh-cn' &&
                    children.searchCompletePY.propertyView({
                        label: trans('autoComplete.searchCompletePY'),
                    })}
                {children.searchLabelOnly.propertyView({
                    label: trans('autoComplete.searchLabelOnly'),
                })}
                {children.ignoreCase.propertyView({
                    label: trans('autoComplete.ignoreCase'),
                })}
                {children.valueOrLabel.propertyView({
                    label: trans('autoComplete.checkedValueFrom'),
                    radioButton: true,
                })}
            </Section>
            <TextInputBasicSection {...children} />

            <FormDataPropertyView {...children} />
            {children.label.getPropertyView()}

            <TextInputInteractionSection {...children} />

            {<TextInputValidationSection {...children} />}

            <Section name={sectionNames.layout}>
                {hiddenPropertyView(children)}
            </Section>

            <Section name={sectionNames.style}>
                {children.style.getPropertyView()}
            </Section>
            <Section name={sectionNames.labelStyle}>
                {children.labelStyle.getPropertyView()}
            </Section>
            <Section name={sectionNames.inputFieldStyle}>
                {children.inputFieldStyle.getPropertyView()}
            </Section>
            <Section
                name={sectionNames.animationStyle}
                hasTooltip={true}
            >
                {children.animationStyle.getPropertyView()}
            </Section>
        </>
    );
})


export default SetPropertyViewFn