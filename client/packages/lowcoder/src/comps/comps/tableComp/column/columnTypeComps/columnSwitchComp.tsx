import { BoolCodeControl } from "comps/controls/codeControl";
import { trans } from "i18n";
import { default as Checkbox } from "antd/es/checkbox";
import { ColumnTypeCompBuilder, ColumnTypeViewFn } from "../columnTypeCompBuilder";
import { ColumnValueTooltip } from "../simpleColumnTypeComps";
import { SwitchStyle, SwitchStyleType, LabelStyle,  InputFieldStyle } from "comps/controls/styleControlConstants";
import styled, { css } from "styled-components";
import { CheckboxStyle } from "comps/controls/styleControlConstants";
import { useStyle } from "comps/controls/styleControl";
import { default as Switch } from "antd/es/switch";
import { styleControl } from "comps/controls/styleControl";
import { RefControl } from "comps/controls/refControl";
import { booleanExposingStateControl } from "comps/controls/codeStateControl";
import { changeEvent, eventHandlerControl } from "comps/controls/eventHandlerControl";
import { disabledPropertyView } from "comps/utils/propertyUtils";

interface SwitchWrapperProps {
  disabled: boolean;
  $style?: SwitchStyleType; 
}

const EventOptions = [
  changeEvent,
  {
    label: trans("switchComp.open"),
    value: "true",
    description: trans("switchComp.openDesc"),
  },
  {
    label: trans("switchComp.close"),
    value: "false",
    description: trans("switchComp.closeDesc"),
  },
] as const;

const getStyle = (style: SwitchStyleType) => {
  return css`
    .ant-switch-handle::before {
      background-color: ${style.handle};
    }
    button {
      background-image: none;
      background-color: ${style.unchecked};
      &.ant-switch-checked {
        background-color: ${style.checked};
      }
    }
  `;
};

const SwitchWrapper = styled.div<{ disabled: boolean }>`
  display: flex;
  align-items: center;
`;

const Wrapper = styled.div`
  background: transparent !important;
  padding: 0 8px;
`

const childrenMap = {
  value: booleanExposingStateControl("value"),
  switchState: BoolCodeControl,
  onEvent: eventHandlerControl(EventOptions),
  disabled: BoolCodeControl,
  style: styleControl(InputFieldStyle),
  viewRef: RefControl<HTMLElement>,
};

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, boolean, boolean> = (props) => props.switchState;

export const SwitchComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      const value = props.changeValue ?? getBaseValue(props, dispatch);
      const CheckBoxComp = () => {
        return (
          <Switch 
            checked={value}
            disabled={props.disabled || true}
            ref={props.viewRef}
            onChange={(checked) => {
              props.value.onChange(checked);
              props.onEvent("change");
              props.onEvent(checked ? "true" : "false");
            }}
          />
        );
      };
      return <CheckBoxComp />;
    },
    (nodeValue) => nodeValue.switchState.value,
    getBaseValue
  )
    .setEditViewFn((props) => {
      return (
        <Wrapper
          onBlur={() => {
            props.onChangeEnd()
          }}
        >
          <Switch
            autoFocus
            defaultChecked={props.value}
            disabled={false}
            onChange={(checked, e) => {
              props.onChange(checked);
            }}
          />
        </Wrapper>
      );
    })
    .setPropertyViewFn((children) => {
      return (
        <>
          {children.switchState.propertyView({
            label: trans("table.columnValue"),
            tooltip: ColumnValueTooltip,
          })}
          {children.onEvent.propertyView()}
          {disabledPropertyView(children)}
          
        </>
      );
    })
    .build();
})();
