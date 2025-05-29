import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { default as Input } from "antd/es/input";
import {
  ColumnTypeCompBuilder,
  ColumnTypeViewFn,
} from "comps/comps/tableComp/column/columnTypeCompBuilder";
import { ColumnValueTooltip } from "comps/comps/tableComp/column/simpleColumnTypeComps";
import { StringControl } from "comps/controls/codeControl";
import { trans } from "i18n";
import { markdownCompCss, TacoMarkDown } from "lowcoder-design";
import styled from "styled-components";

const Wrapper = styled.div`
  ${markdownCompCss as any};
  max-height: 32px;

  > .markdown-body {
    margin: 0;
    p {
      line-height: 21px;
    }
  }
`;

const childrenMap = {
  text: StringControl,
};

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, string, string> = (props) => props.text;

// Memoized markdown view component
const MarkdownView = React.memo(({ value }: { value: string }) => {
  return (
    <Wrapper>
      <TacoMarkDown>{value}</TacoMarkDown>
    </Wrapper>
  );
});

MarkdownView.displayName = 'MarkdownView';

// Memoized edit component with proper cleanup
const MarkdownEdit = React.memo((props: {
  value: string;
  onChange: (value: string) => void;
  onChangeEnd: () => void;
}) => {
  const [currentValue, setCurrentValue] = useState(props.value);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      setCurrentValue('');
    };
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!mountedRef.current) return;
    const value = e.target.value;
    props.onChange(value);
    setCurrentValue(value);
  }, [props.onChange]);

  const handleBlur = useCallback(() => {
    if (!mountedRef.current) return;
    props.onChangeEnd();
  }, [props.onChangeEnd]);

  const handlePressEnter = useCallback(() => {
    if (!mountedRef.current) return;
    props.onChangeEnd();
  }, [props.onChangeEnd]);

  return (
    <Input
      value={currentValue}
      autoFocus
      variant="borderless"
      onChange={handleChange}
      onBlur={handleBlur}
      onPressEnter={handlePressEnter}
    />
  );
});

MarkdownEdit.displayName = 'MarkdownEdit';

export const ColumnMarkdownComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      const value = props.changeValue ?? getBaseValue(props, dispatch);
      return <MarkdownView value={value} />;
    },
    (nodeValue) => nodeValue.text.value,
    getBaseValue
  )
    .setEditViewFn((props) => (
      <MarkdownEdit
        value={props.value}
        onChange={props.onChange}
        onChangeEnd={props.onChangeEnd}
      />
    ))
    .setPropertyViewFn((children) => (
      <>
        {children.text.propertyView({
          label: trans("table.columnValue"),
          tooltip: ColumnValueTooltip,
        })}
      </>
    ))
    .build();
})();
