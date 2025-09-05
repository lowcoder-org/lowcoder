import React, { useCallback } from "react";
import {
  ColumnTypeCompBuilder,
  ColumnTypeViewFn,
} from "comps/comps/tableComp/column/columnTypeCompBuilder";
import { BoolCodeControl, StringControl } from "comps/controls/codeControl";
import { trans } from "i18n";
import { disabledPropertyView } from "comps/utils/propertyUtils";
import styled, { css } from "styled-components";
import { styleControl } from "comps/controls/styleControl";
import { TableColumnLinkStyle } from "comps/controls/styleControlConstants";
import { clickEvent, eventHandlerControl, doubleClickEvent } from "comps/controls/eventHandlerControl";
import { useCompClickEventHandler } from "@lowcoder-ee/comps/utils/useCompClickEventHandler";
import { migrateOldData } from "@lowcoder-ee/comps/generators/simpleGenerators";
import { fixOldActionData } from "comps/comps/tableComp/column/simpleColumnTypeComps";

export const ColumnValueTooltip = trans("table.columnValueTooltip");

const LinkEventOptions = [clickEvent, doubleClickEvent] as const;

const childrenMap = {
  text: StringControl,
  onClick: eventHandlerControl(LinkEventOptions),
  disabled: BoolCodeControl,
  style: styleControl(TableColumnLinkStyle),
};

const disableCss = css`
  &,
  &:hover {
    cursor: not-allowed;
    color: rgba(0, 0, 0, 0.25) !important;
  }
`;

const StyledLink = styled.a<{ $disabled: boolean }>`
  ${(props) => props.$disabled && disableCss};
`;

// Memoized link component
export const ColumnLink = React.memo(({ disabled, label, onClick }: { disabled: boolean; label: string; onClick: (eventName: string) => void }) => {
  const handleClickEvent = useCompClickEventHandler({onEvent: onClick})
  const handleClick = useCallback(() => {
    if (!disabled) {
      handleClickEvent();
    }
  }, [disabled, onClick]);

  return (
    <StyledLink
      $disabled={disabled}
      onClick={handleClick}
    >
      {label}
    </StyledLink>
  );
});

ColumnLink.displayName = 'ColumnLink';

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, string, string> = (props) => props.text;

const LinkCompTmp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      const value = getBaseValue(props, dispatch);
      return <ColumnLink disabled={props.disabled} label={value} onClick={props.onClick} />;
    },
    (nodeValue) => nodeValue.text.value,
    getBaseValue
  )
    .setPropertyViewFn((children) => (
      <>
        {children.text.propertyView({
          label: trans("table.columnValue"),
          tooltip: ColumnValueTooltip,
        })}
        {disabledPropertyView(children)}
        {children.onClick.propertyView()}
      </>
    ))
    .setStylePropertyViewFn((children) => (
      <>
        {children.style.getPropertyView()}
      </>
    ))
    .build();
})();

export const LinkComp = migrateOldData(LinkCompTmp, fixOldActionData);
