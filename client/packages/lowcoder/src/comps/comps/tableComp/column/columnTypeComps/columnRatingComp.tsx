import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
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

const Wrapper = styled.div`
  background: transparent !important;
  padding: 0 8px;
`;

const childrenMap = {
  text: NumberControl,
};

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, number, number> = (props) => props.text;

type RatingEditProps = {
  value: number;
  onChange: (value: number) => void;
  onChangeEnd: () => void;
};

const RatingEdit = React.memo((props: RatingEditProps) => {
  const [currentValue, setCurrentValue] = useState(props.value);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      setCurrentValue(0);
    };
  }, []);

  const handleChange = useCallback((value: number) => {
    if (!mountedRef.current) return;
    props.onChange(value);
    setCurrentValue(value);
  }, [props.onChange]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    if (!mountedRef.current) return;
    if (!e.currentTarget?.contains(e.relatedTarget)) {
      props.onChangeEnd();
    }
  }, [props.onChangeEnd]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLUListElement>) => {
    if (!mountedRef.current) return;
    if (e.key === "Enter") {
      props.onChangeEnd();
    }
  }, [props.onChangeEnd]);

  return (
    <Wrapper
      onBlur={handleBlur}
    >
      <RateStyled
        autoFocus
        isEdit={true}
        value={currentValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    </Wrapper>
  );
});

RatingEdit.displayName = 'RatingEdit';

export const RatingComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      const value = props.changeValue ?? getBaseValue(props, dispatch);
      return <RateStyled disabled value={value} />;
    },
    (nodeValue) => nodeValue.text.value,
    getBaseValue
  )
    .setEditViewFn((props) => {
      return (
        <RatingEdit
          value={props.value}
          onChange={props.onChange}
          onChangeEnd={props.onChangeEnd}
        />
      );
    })
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
