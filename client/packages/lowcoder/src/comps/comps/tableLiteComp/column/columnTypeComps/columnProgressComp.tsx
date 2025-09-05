import React from "react";
import { NumberControl } from "comps/controls/codeControl";
import { trans } from "i18n";
import { ColumnTypeCompBuilder, ColumnTypeViewFn } from "../columnTypeCompBuilder";
import { ColumnValueTooltip } from "../simpleColumnTypeComps";
import { ProgressStyle } from "comps/controls/styleControlConstants";
import { useStyle } from "comps/controls/styleControl";
import { BoolControl } from "comps/controls/boolControl";
import { ProgressStyled as Progress } from "comps/comps/progressComp";
import styled from "styled-components";

const ProgressStyled = styled(Progress)`
  display: flex;
  align-items: center;
  .ant-progress-outer {
    height: 22px;
    display: flex;
    align-items: center;
  }
  .ant-progress-text {
    margin-left: 6px;
  }
`;

const childrenMap = {
  text: NumberControl,
  showValue: BoolControl,
};

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, number, number> = (props) => props.text;

export const ProgressComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      const value = getBaseValue(props, dispatch);
      const ProgressView = () => {
        const style = useStyle(ProgressStyle);
        return (
          <ProgressStyled percent={Math.round(value)} showInfo={props.showValue} $style={style} />
        );
      };
      return <ProgressView />;
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
          {children.showValue.propertyView({
            label: trans("table.showValue"),
          })}
        </>
      );
    })
    .build();
})();
