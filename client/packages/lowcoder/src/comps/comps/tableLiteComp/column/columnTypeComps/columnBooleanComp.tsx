import React, { useMemo } from "react";
import { BoolCodeControl } from "comps/controls/codeControl";
import { trans } from "i18n";
import { ColumnTypeCompBuilder, ColumnTypeViewFn } from "../columnTypeCompBuilder";
import { ColumnValueTooltip } from "../simpleColumnTypeComps";
import { getStyle } from "comps/comps/selectInputComp/checkboxComp";
import styled from "styled-components";
import { CheckboxStyle, CheckboxStyleType } from "comps/controls/styleControlConstants";
import { useStyle } from "comps/controls/styleControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { TableCheckedIcon, TableUnCheckedIcon } from "lowcoder-design";
import { IconControl } from "comps/controls/iconControl";
import { hasIcon } from "comps/utils";

const Wrapper = styled.div`
  background: transparent !important;
  padding: 0 8px;
`;

const IconWrapper = styled.span<{ $style: CheckboxStyleType; $ifChecked: boolean }>`
  // pointer-events: none;
  height: 22px;
  display: inline-block;
  svg {
    width: 14px;
    height: 22px;
    g {
      stroke: ${(props) => props.$ifChecked && props.$style.checkedBackground} !important;
    }
  }
`;

const falseValuesOptions = [
  {
    label: trans("table.empty"),
    value: "",
  },
  {
    label: "-",
    value: "-",
  },
  {
    label: <TableUnCheckedIcon width={10} height={10} />,
    value: "x",
  },
] as const;

const childrenMap = {
  text: BoolCodeControl,
  falseValues: dropdownControl(falseValuesOptions, ""),
  iconTrue: IconControl,
  iconFalse: IconControl,
  iconNull: IconControl,
};

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, boolean, boolean> = (props) => props.text;

// Memoized checkbox view component
const CheckBoxView = React.memo(({ 
  value, 
  iconTrue, 
  iconFalse, 
  iconNull, 
  falseValues 
}: { 
  value: boolean;
  iconTrue: React.ReactNode;
  iconFalse: React.ReactNode;
  iconNull: React.ReactNode;
  falseValues: string;
}) => {
  const style = useStyle(CheckboxStyle);

  const content = useMemo(() => {
    if (value === true) {
      return hasIcon(iconTrue) ? iconTrue : <TableCheckedIcon />;
    } else if (value === false) {
      return hasIcon(iconFalse) ? iconFalse : (falseValues === "x" ? <TableUnCheckedIcon /> : falseValues);
    } else {
      return hasIcon(iconNull) ? iconNull : "No Value";
    }
  }, [value, iconTrue, iconFalse, iconNull, falseValues]);

  return (
    <IconWrapper $style={style} $ifChecked={value}>
      {content}
    </IconWrapper>
  );
});

CheckBoxView.displayName = 'CheckBoxView';

export const BooleanComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      const value = getBaseValue(props, dispatch);
      return (
        <CheckBoxView
          value={value}
          iconTrue={props.iconTrue}
          iconFalse={props.iconFalse}
          iconNull={props.iconNull}
          falseValues={props.falseValues}
        />
      );
    },
    (nodeValue) => nodeValue.text.value,
    getBaseValue
  )
    .setPropertyViewFn((children) => {
      return (
        <>
          {children.text.propertyView({
            label: trans("table.columnValue"),
            tooltip: ColumnValueTooltip,
          })}
          {children.falseValues.propertyView({
            label: trans("table.falseValues"),
            radioButton: true,
          })}
          {children.iconTrue.propertyView({
            label: trans("table.iconTrue"),
          })}
          {children.iconFalse.propertyView({
            label: trans("table.iconFalse"),
          })}
          {children.iconNull.propertyView({
            label: trans("table.iconNull"),
          })}
        </>
      );
    })
    .build();
})();
