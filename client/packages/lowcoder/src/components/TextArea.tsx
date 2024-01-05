import styled from "styled-components";
import { default as AntdTextArea, TextAreaRef, TextAreaProps as AntdTextAreaProps } from "antd/es/input/TextArea";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import _ from "lodash";
import React from "react";
import { INPUT_DEFAULT_ONCHANGE_DEBOUNCE } from "constants/perf";

const StyledTextArea = styled(AntdTextArea)``;

export interface TextAreaProps extends AntdTextAreaProps {
  debounce?: number;
}

function TacoTextArea(props: TextAreaProps, ref: React.Ref<TextAreaRef>) {
  const { onChange, value, debounce = INPUT_DEFAULT_ONCHANGE_DEBOUNCE, ...inputProps } = props;
  const [internalValue, setIntervalValue] = useState(value);
  const isTypingRef = useRef(0);

  const originOnChangeRef = useRef(onChange);
  originOnChangeRef.current = onChange;

  const debouncedOnChangeRef = useRef(
    debounce > 0
      ? _.debounce((e: ChangeEvent<HTMLTextAreaElement>) => {
          window.clearTimeout(isTypingRef.current);
          isTypingRef.current = window.setTimeout(() => (isTypingRef.current = 0), 100);
          originOnChangeRef.current?.(e);
        }, debounce)
      : (e: ChangeEvent<HTMLTextAreaElement>) => originOnChangeRef.current?.(e)
  );

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setIntervalValue(e.target.value);
    debouncedOnChangeRef.current?.(e);
  };

  useEffect(() => {
    if (!isTypingRef.current) {
      setIntervalValue(value);
    }
  }, [value]);

  return (
    <StyledTextArea
      ref={ref}
      value={internalValue}
      placeholder={props.placeholder}
      onChange={(e) => handleChange(e)}
      {...inputProps}
    />
  );
}

export const TextArea = React.forwardRef(TacoTextArea);
