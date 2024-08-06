import { ReactElement } from "react";
import { DropdownOptionControl } from "comps/controls/optionsControl";
import { StringControl } from "comps/controls/codeControl";
import { trans } from "i18n";
import { ColumnTypeCompBuilder, ColumnTypeViewFn } from "../columnTypeCompBuilder";
import Menu from "antd/es/menu";
import Dropdown from "antd/es/dropdown";
import { dropdownControl } from "comps/controls/dropdownControl";
import { IconControl } from "comps/controls/iconControl";
import { withDefault } from "comps/generators";
import { IconWrapper } from "util/bottomResUtils";
import { ButtonTypeOptions } from "../simpleColumnTypeComps";
import { useStyle } from "comps/controls/styleControl";
import { ButtonStyle } from "comps/controls/styleControlConstants";
import { Button100 } from "comps/comps/buttonComp/buttonCompConstants";

const childrenMap = {
  buttonType: dropdownControl(ButtonTypeOptions, "primary"),
  label: withDefault(StringControl, 'Menu'),
  prefixIcon: IconControl,
  suffixIcon: IconControl,
  options: DropdownOptionControl,
};

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, string, string> = (props) => props.label;

export const ColumnDropdownComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props) => {
      const hasOptionIcon = props.options.findIndex((option) => (option.prefixIcon as ReactElement)?.props.value) > -1;
      const items = props.options
        .filter((option) => !option.hidden)
        .map((option, index) => ({
          title: option.label,
          label: option.label,
          key: option.label + " - " + index,
          disabled: option.disabled,
          icon: hasOptionIcon && <span>{option.prefixIcon}</span>,
          onEvent: option.onEvent,
        }));
      
      const hasPrefixIcon = (props.prefixIcon as ReactElement)?.props.value;
      const hasSuffixIcon = (props.suffixIcon as ReactElement)?.props.value;
      const buttonStyle = useStyle(ButtonStyle);

      const menu = (
        <Menu
          items={items}
          onClick={({ key }) => {
            items.find((o) => o.key === key)?.onEvent?.("click")
          }}
        />
      );

      return (
        <Dropdown
          trigger={["click"]}
          placement="bottomRight"
          menu={{items}}
          dropdownRender={() => menu}
        >
          <Button100
            type={props.buttonType}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0',
              minWidth: '30px',
              width: 'auto',
            }}
            $buttonStyle={
              props.buttonType === "primary"
              ? buttonStyle
              : undefined
            }
          >
            {
              hasPrefixIcon && (
                <IconWrapper style={{
                  margin: '0px',
                  marginRight: props.label || hasSuffixIcon ? '3px' : '0x',
                }}>
                  {props.prefixIcon}
                </IconWrapper>
              ) 
            }
            {
              props.label || (hasPrefixIcon || hasSuffixIcon ? undefined : " ") // Avoid button disappearing
            }
            {
              hasSuffixIcon && (
                <IconWrapper style={{
                  margin: '0px',
                  marginLeft: props.label || hasPrefixIcon ? '3px' : '0x',
                }}>
                  {props.suffixIcon}
                </IconWrapper>
              ) 
            }
          </Button100>
        </Dropdown>
      );
    },
    (nodeValue) => nodeValue.label.value,
    getBaseValue,
  )
    .setPropertyViewFn((children) => {
      return (
        <>
          {children.buttonType.propertyView({
            label: trans("table.type"),
            radioButton: true,
          })}
          {children.label.propertyView({
            label: trans("text"),
          })}
          {children.prefixIcon.propertyView({
            label: trans("button.prefixIcon"),
          })}
          {children.suffixIcon.propertyView({
            label: trans("button.suffixIcon"),
          })}
          {children.options.propertyView({
            title: trans("optionsControl.optionList"),
          })}
        </>
      );
    })
    .build();
})();
