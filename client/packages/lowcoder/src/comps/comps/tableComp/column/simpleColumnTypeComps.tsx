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
import React, { useCallback, useEffect, useMemo } from "react";
import { CSSProperties } from "react";
import { RecordConstructorToComp } from "lowcoder-core";
import { ToViewReturn } from "@lowcoder-ee/comps/generators/multi";
import { clickEvent, eventHandlerControl } from "comps/controls/eventHandlerControl";

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

const ButtonEventOptions = [clickEvent] as const;

const childrenMap = {
  text: StringControl,
  buttonType: dropdownControl(ButtonTypeOptions, "primary"),
  onClick: ActionSelectorControlInContext,
  onEvent: eventHandlerControl(ButtonEventOptions),
  loading: BoolCodeControl,
  disabled: BoolCodeControl,
  prefixIcon: IconControl,
  suffixIcon: IconControl,
};

const ButtonStyled = React.memo(({ props }: { props: ToViewReturn<RecordConstructorToComp<typeof childrenMap>>}) => {
  const style = useStyle(ButtonStyle);
  const hasText = !!props.text;
  const hasPrefixIcon = hasIcon(props.prefixIcon);
  const hasSuffixIcon = hasIcon(props.suffixIcon);
  const iconOnly = !hasText && (hasPrefixIcon || hasSuffixIcon);

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Trigger legacy onClick action for backward compatibility
    props.onClick?.();
    // Trigger new event handlers
    props.onEvent?.("click");
  }, [props.onClick, props.onEvent]);

  const buttonStyle = useMemo(() => ({
    margin: 0,
    width: iconOnly ? 'auto' : undefined,
    minWidth: iconOnly ? 'auto' : undefined,
    padding: iconOnly ? '0 8px' : undefined
  } as CSSProperties), [iconOnly]);

  return (
    <Button100
      type={props.buttonType}
      onClick={handleClick}
      loading={props.loading}
      disabled={props.disabled}
      $buttonStyle={props.buttonType === "primary" ? style : undefined}
      style={buttonStyle}
      icon={hasPrefixIcon ? props.prefixIcon : undefined}
    >
      {/* prevent the button from disappearing */}
      {hasText ? props.text : (iconOnly ? null : " ")}
      {hasSuffixIcon && !props.loading && <span style={{ marginLeft: hasText ? '8px' : 0 }}>{props.suffixIcon}</span>}
    </Button100>
  );
});

export const ButtonComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props) => <ButtonStyled props={props} />,
    (nodeValue) => nodeValue.text.value
  )
    .setPropertyViewFn((children) => {
      // Check if there's a legacy action configured
      const hasLegacyAction = children.onClick.getView() && 
        typeof children.onClick.getView() === 'function' &&
        children.onClick.displayName() !== trans("eventHandler.incomplete");

      return (
        <>
          {children.text.propertyView({
            label: trans("table.columnValue"),
            tooltip: ColumnValueTooltip,
          })}
          {children.prefixIcon.propertyView({
            label: trans("button.prefixIcon"),
          })}
          {children.suffixIcon.propertyView({
            label: trans("button.suffixIcon"),
          })}
          {children.buttonType.propertyView({
            label: trans("table.type"),
            radioButton: true,
          })}
          {loadingPropertyView(children)}
          {disabledPropertyView(children)}
          {children.onEvent.propertyView()}
          {hasLegacyAction && children.onClick.propertyView({
            label: trans("table.action"),
            placement: "table",
          })}
        </>
      );
    })
    .build();
})();
