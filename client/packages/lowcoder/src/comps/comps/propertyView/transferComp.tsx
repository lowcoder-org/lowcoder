import {Section, sectionNames} from "components/Section";
import {trans} from "@lowcoder-ee/i18n";
import {hiddenPropertyView} from "lowcoder-sdk";

const PropertyView = ((children: any) => {
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.items.propertyView({
                    label: trans("transfer.items"),
                })}
                {children.targetKeys.propertyView({
                    label: trans("transfer.targetKeys"),
                })}
                {children.sourceTitle.propertyView({
                    label: trans("transfer.sourceTitle"),
                })}
                {children.targetTitle.propertyView({
                    label: trans("transfer.targetTitle"),
                })}
                {children.showSearch.propertyView({
                    label: trans("transfer.allowSearch"),
                })}
                {children.oneWay.propertyView({
                    label: trans("transfer.oneWay"),
                })}
                {children.pagination.propertyView({
                    label: trans("transfer.pagination"),
                })}
                {children.pagination.getView() && children.pageSize.propertyView({
                    label: trans("transfer.pageSize"),
                })}
            </Section>
            <Section name={sectionNames.layout}>
                {children.onEvent.propertyView()}
                {hiddenPropertyView(children)}
            </Section>
            <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
        </>
    );
})

export default PropertyView;
