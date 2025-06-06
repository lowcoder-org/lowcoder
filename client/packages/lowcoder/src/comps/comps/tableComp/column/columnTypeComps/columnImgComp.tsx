import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { default as Input } from "antd/es/input";
import {
  ColumnTypeCompBuilder,
  ColumnTypeViewFn,
} from "comps/comps/tableComp/column/columnTypeCompBuilder";
import { StringControl, NumberControl } from "comps/controls/codeControl";
import { trans } from "i18n";
import { withDefault } from "comps/generators";
import { TacoImage } from "lowcoder-design";
import styled from "styled-components";
import { DEFAULT_IMG_URL } from "@lowcoder-ee/util/stringUtils";
import { clickEvent, eventHandlerControl } from "comps/controls/eventHandlerControl";

export const ColumnValueTooltip = trans("table.columnValueTooltip");

const childrenMap = {
  src: withDefault(StringControl, "{{currentCell}}"),
  size: withDefault(NumberControl, "50"),
  onEvent: eventHandlerControl([clickEvent]),
};

const StyledTacoImage = styled(TacoImage)`
  pointer-events: auto !important;
  cursor: pointer !important;
  
  &:hover {
    opacity: 0.8;
    transition: opacity 0.2s ease;
  }
`;

// Memoized image component
const ImageView = React.memo(({ src, size, onEvent }: { src: string; size: number; onEvent?: (eventName: string) => void }) => {
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleClick = useCallback(() => {
    console.log("Image clicked!", { src, onEvent: !!onEvent }); // Debug log
    if (mountedRef.current && onEvent) {
      onEvent("click");
    }
  }, [onEvent, src]);

  return (
    <StyledTacoImage 
      src={src || DEFAULT_IMG_URL} 
      width={size}
      onClick={handleClick}
      style={{ cursor: 'pointer' }} // Inline style as backup
    />
  );
});

ImageView.displayName = 'ImageView';

// Memoized edit component
const ImageEdit = React.memo(({ value, onChange, onChangeEnd }: { value: string; onChange: (value: string) => void; onChangeEnd: () => void }) => {
  const mountedRef = useRef(true);
  const [currentValue, setCurrentValue] = useState(value);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (mountedRef.current) {
      const newValue = e.target.value;
      setCurrentValue(newValue);
      onChange(newValue);
    }
  }, [onChange]);

  const handleBlur = useCallback(() => {
    if (mountedRef.current) {
      onChangeEnd();
    }
  }, [onChangeEnd]);

  const handlePressEnter = useCallback(() => {
    if (mountedRef.current) {
      onChangeEnd();
    }
  }, [onChangeEnd]);

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

ImageEdit.displayName = 'ImageEdit';

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, string, string> = (props) => props.src;

export const ImageComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      const value = props.changeValue ?? getBaseValue(props, dispatch);
      return <ImageView src={value} size={props.size} onEvent={props.onEvent} />;
    },
    (nodeValue) => nodeValue.src.value,
    getBaseValue
  )
    .setEditViewFn((props) => (
      <ImageEdit
        value={props.value}
        onChange={props.onChange}
        onChangeEnd={props.onChangeEnd}
      />
    ))
    .setPropertyViewFn((children) => {
      return (
        <>
          {children.src.propertyView({
            label: trans("table.imageSrc"),
            tooltip: ColumnValueTooltip,
          })}
          {children.size.propertyView({
            label: trans("table.imageSize"),
          })}
          {children.onEvent.propertyView()}
        </>
      );
    })
    .build();
})();
