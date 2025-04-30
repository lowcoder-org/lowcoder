import { ColumnTypeCompBuilder } from "comps/comps/tableComp/column/columnTypeCompBuilder";
import { ActionSelectorControlInContext } from "comps/controls/actionSelector/actionSelectorControl";
import { BoolCodeControl, StringControl } from "comps/controls/codeControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { disabledPropertyView, loadingPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { useStyle } from "comps/controls/styleControl";
import { ButtonStyle } from "comps/controls/styleControlConstants";
import { Button100 } from "comps/comps/buttonComp/buttonCompConstants";
import { IconControl } from "comps/controls/iconControl";
import { hasIcon } from "comps/utils";

export const ColumnValueTooltip = trans("table.columnValueTooltip");

export const ButtonTypeOptions = [
  {
    label: trans("table.primaryButton"),
    value: "primary",
  },
  {
    label: trans("table.defaultButton"),
    value: "default",
  },
  {
    label: trans("table.text"),
    value: "text",
  },
] as const;

export const ButtonDisplayOptions = [
  {
    label: trans("table.text"),
    value: "text",
  },
  {
    label: trans("table.icon"),
    value: "icon",
  },
  {
    label: trans("table.textAndIcon"),
    value: "textAndIcon",
  },
] as const;

export const ButtonComp = (function () {
  const childrenMap = {
    text: StringControl,
    buttonType: dropdownControl(ButtonTypeOptions, "primary"),
    onClick: ActionSelectorControlInContext,
    loading: BoolCodeControl,
    disabled: BoolCodeControl,
    displayMode: dropdownControl(ButtonDisplayOptions, "text"),
    icon: IconControl,
  };
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props) => {
      const ButtonStyled = () => {
        const style = useStyle(ButtonStyle);
        const showIcon = props.displayMode === "icon" || props.displayMode === "textAndIcon";
        const showText = props.displayMode === "text" || props.displayMode === "textAndIcon";
        
        return (
          <Button100
            type={props.buttonType}
            onClick={props.onClick}
            loading={props.loading}
            disabled={props.disabled}
            $buttonStyle={props.buttonType === "primary" ? style : undefined}
            style={{margin: 0}}
            icon={showIcon && hasIcon(props.icon) ? props.icon : undefined}
          >
            {/* prevent the button from disappearing */}
            {showText ? (!props.text ? " " : props.text) : null}
          </Button100>
        );
      };
      return <ButtonStyled />;
    },
    (nodeValue) => nodeValue.text.value
  )
    .setPropertyViewFn((children) => (
      <>
        {children.displayMode.propertyView({
          label: trans("table.displayMode"),
          radioButton: true,
        })}
        {(children.displayMode.getView() === "text" || children.displayMode.getView() === "textAndIcon") && 
          children.text.propertyView({
            label: trans("table.columnValue"),
            tooltip: ColumnValueTooltip,
          })
        }
        {(children.displayMode.getView() === "icon" || children.displayMode.getView() === "textAndIcon") && 
          children.icon.propertyView({
            label: trans("table.icon"),
          })
        }
        {children.buttonType.propertyView({
          label: trans("table.type"),
          radioButton: true,
        })}
        {loadingPropertyView(children)}
        {disabledPropertyView(children)}
        {children.onClick.propertyView({
          label: trans("table.action"),
          placement: "table",
        })}
      </>
    ))
    .build();
})();
