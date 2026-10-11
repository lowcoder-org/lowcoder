import React from "react";
import { NumberControl } from "comps/controls/codeControl";
import { trans } from "i18n";
import { ColumnTypeCompBuilder, ColumnTypeViewFn } from "../columnTypeCompBuilder";
import { ColumnValueTooltip } from "../simpleColumnTypeComps";
import styled from "styled-components";
import { default as Rate } from "antd/es/rate";

const RateStyled = styled(Rate)<{ isEdit?: boolean }>`
  display: inline-flex;
  align-items: center;
  width: 100%;
  overflow-x: auto;
  overflow-x: overlay;
  color: #ffd400;
  display: block;
  .ant-rate-star > div {
    height: 18px;
    width: 18px;
  }
  .ant-rate-star-half .ant-rate-star-first,
  .ant-rate-star-full .ant-rate-star-second {
    color: #ffd400;
    position: absolute;
  }
  .ant-rate-star-first {
    width: 100%;
  }
  .ant-rate-star-first,
  .ant-rate-star-second {
    display: inline-flex;
    align-items: center;
    color: #d7d9e0;
    max-height: 20px;
    bottom: 0;
  }
  svg {
    height: 18px;
    width: 18px;
  }
`;

const childrenMap = {
  text: NumberControl,
};

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, number, number> = (props) => props.text;

export const RatingComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      const value = getBaseValue(props, dispatch);
      return <RateStyled disabled value={value} />;
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
        </>
      );
    })
    .build();
})();
