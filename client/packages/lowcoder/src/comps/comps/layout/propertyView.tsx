import {Section, sectionNames} from "components/Section";
import {trans} from "@lowcoder-ee/i18n";
import {DataOption, menuItemStyleOptions} from "@lowcoder-ee/comps/comps/layout/navLayoutConstants";
import {controlItem} from "components/control";
import Segmented from "antd/es/segmented";
import React, {useState} from "react";
import {menuPropertyView} from "@lowcoder-ee/comps/comps/navComp/components/MenuItemList";


type MenuItemStyleOptionValue = "normal" | "hover" | "active";

const PropertyViewMobileTabLayout = ((children: any) => {
    const [styleSegment, setStyleSegment] = useState('normal')
    return (
        <div style={{overflowY: 'auto'}}>
            <Section name={trans("aggregation.tabBar")}>
                {children.dataOptionType.propertyView({
                    radioButton: true,
                    type: "oneline",
                })}
                {
                    children.dataOptionType.getView() === DataOption.Manual
                        ? children.tabs.propertyView({})
                        : children.jsonItems.propertyView({
                            label: "Json Data",
                        })
                }
            </Section>
            <Section name={trans("eventHandler.eventHandlers")}>
                {children.onEvent.getPropertyView()}
            </Section>
            <Section name={sectionNames.layout}>
                {children.backgroundImage.propertyView({
                    label: `Background Image`,
                    placeholder: 'https://temp.im/350x400',
                })}
                {children.showSeparator.propertyView({label: trans("navLayout.mobileNavVerticalShowSeparator")})}
                {children.tabBarHeight.propertyView({label: trans("navLayout.mobileNavBarHeight")})}
                {children.navIconSize.propertyView({label: trans("navLayout.mobileNavIconSize")})}
                {children.maxWidth.propertyView({label: trans("navLayout.mobileNavVerticalMaxWidth")})}
                {children.verticalAlignment.propertyView(
                    {label: trans("navLayout.mobileNavVerticalOrientation"), radioButton: true}
                )}
            </Section>
            <Section name={trans("navLayout.navStyle")}>
                {children.navStyle.getPropertyView()}
            </Section>
            <Section name={trans("navLayout.navItemStyle")}>
                {controlItem({}, (
                    <Segmented
                        block
                        options={menuItemStyleOptions}
                        value={styleSegment}
                        onChange={(k) => setStyleSegment(k as MenuItemStyleOptionValue)}
                    />
                ))}
                {styleSegment === 'normal' && (
                    children.navItemStyle.getPropertyView()
                )}
                {styleSegment === 'hover' && (
                    children.navItemHoverStyle.getPropertyView()
                )}
                {styleSegment === 'active' && (
                    children.navItemActiveStyle.getPropertyView()
                )}
            </Section>
        </div>

    );
});

const PropertyViewNavLayout = ((children: any) => {
    const DEFAULT_WIDTH = 240;
    const [styleSegment, setStyleSegment] = useState('normal')
    return (
        <div style={{overflowY: 'auto'}}>
            <Section name={trans("menu")}>
                {children.dataOptionType.propertyView({
                    radioButton: true,
                    type: "oneline",
                })}
                {
                    children.dataOptionType.getView() === DataOption.Manual
                        ? menuPropertyView(children.items)
                        : children.jsonItems.propertyView({
                            label: "Json Data",
                        })
                }
            </Section>
            <Section name={trans("eventHandler.eventHandlers")}>
                { children.onEvent.getPropertyView() }
            </Section>
            <Section name={sectionNames.layout}>
                { children.width.propertyView({
                    label: trans("navLayout.width"),
                    tooltip: trans("navLayout.widthTooltip"),
                    placeholder: DEFAULT_WIDTH + "",
                })}
                { children.mode.propertyView({
                    label: trans("labelProp.position"),
                    radioButton: true
                })}
                { children.collapse.propertyView({
                    label: trans("labelProp.collapse"),
                })}
                {children.backgroundImage.propertyView({
                    label: `Background Image`,
                    placeholder: 'https://temp.im/350x400',
                })}
            </Section>
            <Section name={trans("navLayout.navStyle")}>
                { children.navStyle.getPropertyView() }
            </Section>
            <Section name={trans("navLayout.navItemStyle")}>
                {controlItem({}, (
                    <Segmented
                        block
                        options={menuItemStyleOptions}
                        value={styleSegment}
                        onChange={(k) => setStyleSegment(k as MenuItemStyleOptionValue)}
                    />
                ))}
                {styleSegment === 'normal' && (
                    children.navItemStyle.getPropertyView()
                )}
                {styleSegment === 'hover' && (
                    children.navItemHoverStyle.getPropertyView()
                )}
                {styleSegment === 'active' && (
                    children.navItemActiveStyle.getPropertyView()
                )}
            </Section>
        </div>
    );
});

export { PropertyViewNavLayout, PropertyViewMobileTabLayout }

