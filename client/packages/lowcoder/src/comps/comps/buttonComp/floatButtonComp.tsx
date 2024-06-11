import { RecordConstructorToView } from "lowcoder-core";
import { BoolControl } from "comps/controls/boolControl";
import { stringExposingStateControl } from "comps/controls/codeStateControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { styleControl } from "comps/controls/styleControl";
import { AnimationStyle, AnimationStyleType, BadgeStyle, BadgeStyleType, FloatButtonStyle, FloatButtonStyleType } from "comps/controls/styleControlConstants";
import { UICompBuilder } from "comps/generators/uiCompBuilder";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import { Section, sectionNames } from "lowcoder-design";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { StringControl, NumberControl } from "comps/controls/codeControl";
import { FloatButton } from 'antd';
import { withDefault, MultiCompBuilder, valueComp } from "../../generators";
import { IconControl } from "comps/controls/iconControl";
import styled from "styled-components";
import { ButtonEventHandlerControl } from "comps/controls/eventHandlerControl";
import { manualOptionsControl } from "comps/controls/optionsControl";

const StyledFloatButton = styled(FloatButton)<{
  $animationStyle: AnimationStyleType;
}>`
  ${(props) => props.$animationStyle}
`;

const Wrapper = styled.div<{ $badgeStyle: BadgeStyleType, $style: FloatButtonStyleType}>`
    width: 0px;
    height: 0px;
    overflow: hidden;
    .ant-float-btn-group {
        inset-block-end: 0px;
        right: -40px;
    }
    .ant-float-btn {
        right: 0px;
        inset-block-end: -8px;
    }
    .ant-float-btn-primary .ant-float-btn-body {
    background-color: ${(props) => props.$style.background};
    border: ${(props) => props.$style.border};
    border-style: ${(props) => props.$style.borderStyle};
    border-width: ${(props) => props.$style.borderWidth};
    }
`

const buttonShapeOption = [
    { label: trans('floatButton.square'), value: 'square' },
    { label: trans('floatButton.circle'), value: 'circle' },
] as const;

const buttonThemeOption = [
    { label: trans('floatButton.primary'), value: 'primary' },
    { label: trans('floatButton.default'), value: 'default' },
] as const;

const buttonGroupOption = new MultiCompBuilder(
    {
        id: valueComp<number>(-1),
        label: StringControl,
        badge: withDefault(NumberControl, 0),
        description: withDefault(StringControl, ''),
        icon: withDefault(IconControl, '/icon:antd/questioncircleoutlined'),
        onEvent: ButtonEventHandlerControl,
        hidden: BoolControl,
    },
    (props) => props
)
    .setPropertyViewFn((children) => (
        <>
            {children.label.propertyView({ label: trans("label") })}
            {children.description.propertyView({ label: trans("floatButton.description") })}
            {children.badge.propertyView({ label: trans("floatButton.badge") })}
            {children.hidden.propertyView({ label: trans("floatButton.hidden") })}
            {children.icon.propertyView({ label: trans("icon") })}
            {children.onEvent.getPropertyView()}
        </>
    ))
    .build();

const childrenMap = {
    value: stringExposingStateControl("value"),
    includeMargin: BoolControl.DEFAULT_TRUE,
    image: StringControl,
    icon: withDefault(IconControl, '/icon:antd/questioncircleoutlined'),
    badgeStyle: styleControl(BadgeStyle),
    style: styleControl(FloatButtonStyle),
    animationStyle: styleControl(AnimationStyle),
    buttons: manualOptionsControl(buttonGroupOption, {
        initOptions: [
            { id: 0, label: trans("optionsControl.optionI", { i: '1' }), icon: "/icon:antd/filetextoutlined", badge: '1' },
            { id: 1, label: trans("optionsControl.optionI", { i: '2' }), icon: "/icon:antd/filetextoutlined" },
        ],
        autoIncField: "id",
    }),
    shape: dropdownControl(buttonShapeOption, 'circle'),
    buttonTheme: dropdownControl(buttonThemeOption, 'primary'),
    dot: BoolControl,
};

const FloatButtonView = (props: RecordConstructorToView<typeof childrenMap>) => {
    const renderButton = (button: any, onlyOne?: boolean) => {
        return !button?.hidden ? (
            <StyledFloatButton
                $animationStyle={props.animationStyle}
                key={button?.id}
                icon={button?.icon}
                onClick={() => button.onEvent("click")}
                tooltip={button?.label}
                description={button?.description}
                badge={{ count: button?.badge, color: props.badgeStyle.badgeColor, dot: props?.dot }}
                type={onlyOne ? props.buttonTheme : 'default'}
                shape={props.shape}
            />)
            : ''
    }
    return (
        <Wrapper $badgeStyle={props.badgeStyle} $style={props.style}>
            {props.buttons.length === 1 ? (renderButton(props.buttons[0], true)) :
                (<StyledFloatButton.Group
                    trigger="hover"
                    icon={props.icon}
                    shape={props.shape}
                    badge={{ count: props.buttons.reduce((sum, i) => sum + (i.buttonType === 'custom' && !i.hidden ? i.badge : 0), 0), color: props.badgeStyle.badgeColor, dot: props.dot }}
                    type={props.buttonTheme}
                >
                    {props.buttons.map((button: any) => renderButton(button))}
                </StyledFloatButton.Group>)
            }
        </Wrapper>
    );
};

let FloatButtonBasicComp = (function () {
    return new UICompBuilder(childrenMap, (props) => (
      <FloatButtonView {...props} />
    ))
      .setPropertyViewFn((children) => (
        <>
          <Section name={sectionNames.basic}>
            {children.buttons.propertyView({})}
            {children.icon.propertyView({ label: trans("icon") })}
            {children.shape.propertyView({ label: trans("floatButton.buttonShape"), radioButton: true })}
            {children.buttonTheme.propertyView({ label: trans("floatButton.buttonTheme"), radioButton: true })}
            {children.dot.propertyView({ label: trans("floatButton.dot") })}
          </Section>
          <Section name={sectionNames.layout}>
            {hiddenPropertyView(children)}
          </Section>
          <Section name={sectionNames.badgeStyle}>{children.badgeStyle.getPropertyView()}</Section>
          <Section name={sectionNames.style}>
            {children.style.getPropertyView()}
          </Section>
          <Section name={sectionNames.animationStyle} hasTooltip={true}>
            {children.animationStyle.getPropertyView()}
          </Section>
        </>
      ))
      .build();
})();

FloatButtonBasicComp = class extends FloatButtonBasicComp {
    override autoHeight(): boolean {
        return true;
    }
};

export const FloatButtonComp = withExposingConfigs(FloatButtonBasicComp, [
    new NameConfig("value", trans("QRCode.valueDesc")),
    NameConfigHidden,
]);
