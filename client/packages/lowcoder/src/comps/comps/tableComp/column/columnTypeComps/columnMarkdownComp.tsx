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
import { clickEvent, eventHandlerControl } from "comps/controls/eventHandlerControl";

const Wrapper = styled.div`
  ${markdownCompCss};
  max-height: 32px;
  cursor: pointer;

  > .markdown-body {
    margin: 0;
    p {
      line-height: 21px;
    }
  }
`;

const MarkdownEventOptions = [clickEvent] as const;

const childrenMap = {
  text: StringControl,
  onEvent: eventHandlerControl(MarkdownEventOptions),
};

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, string, string> = (props) => props.text;

// Memoized markdown view component
const MarkdownView = React.memo(({ value, onEvent }: { value: string; onEvent?: (eventName: string) => void }) => {
  const handleClick = useCallback(() => {
    if (onEvent) {
      onEvent("click");
    }
  }, [onEvent]);

  return (
    <Wrapper onClick={handleClick}>
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
      return <MarkdownView value={value} onEvent={props.onEvent} />;
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
        {children.onEvent.propertyView()}
      </>
    ))
    .build();
})();
