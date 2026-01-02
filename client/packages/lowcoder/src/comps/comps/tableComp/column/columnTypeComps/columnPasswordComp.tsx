import React, { useCallback, useMemo, useState } from "react";
import styled from "styled-components";
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import { default as Input } from "antd/es/input";
import { StringOrNumberControl } from "comps/controls/codeControl";
import { ColumnTypeCompBuilder, ColumnTypeViewFn } from "../columnTypeCompBuilder";
import { ColumnValueTooltip } from "../simpleColumnTypeComps";

const Wrapper = styled.div`
  display: inline-flex;
  align-items: center;
  min-width: 0;
  gap: 6px;
`;

const ValueText = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-ligatures: none;
`;

const ToggleButton = styled.button`
  all: unset;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  opacity: 0.6;

  &:hover {
    opacity: 1;
  }

  svg {
    font-size: 14px;
  }
`;

const childrenMap = {
  text: StringOrNumberControl,
};

function normalizeToString(value: unknown) {
  if (value === null || value === undefined) return "";
  return typeof value === "string" ? value : String(value);
}

function maskPassword(raw: string, maskChar = "•", maxMaskLen = 12) {
  if (!raw) return "";
  const len = raw.length;
  const maskLen = Math.min(len, maxMaskLen);
  const masked = maskChar.repeat(maskLen);
  return len > maxMaskLen ? `${masked}…` : masked;
}

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, string | number, string> = (props) =>
  normalizeToString(props.text);

const PasswordCell = React.memo(
  ({
    value,
    cellIndex,
  }: {
    value: string;
    cellIndex?: string;
  }) => {
    const [visible, setVisible] = useState(false);

    const masked = useMemo(() => maskPassword(value), [value]);

    const onToggle = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setVisible((v) => !v);
    }, []);

    React.useEffect(() => {
      setVisible(false);
    }, [cellIndex, value]);

    if (!value) {
      return <span />;
    }

    return (
      <Wrapper>
        <ValueText>{visible ? value : masked}</ValueText>
        <ToggleButton onClick={onToggle} aria-label={visible ? "Hide password" : "Show password"}>
          {visible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
        </ToggleButton>
      </Wrapper>
    );
  }
);

PasswordCell.displayName = "PasswordCell";

const PasswordEditView = React.memo(
  ({
    value,
    onChange,
    onChangeEnd,
  }: {
    value: string;
    onChange: (value: string) => void;
    onChangeEnd: () => void;
  }) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
      },
      [onChange]
    );

    return (
      <Input.Password
        defaultValue={value}
        autoFocus
        variant="borderless"
        onChange={handleChange}
        onBlur={onChangeEnd}
        onPressEnter={onChangeEnd}
        visibilityToggle={true}
      />
    );
  }
);

PasswordEditView.displayName = "PasswordEditView";

export const ColumnPasswordComp = new ColumnTypeCompBuilder(
  childrenMap,
  (props, dispatch) => {
    const value = props.changeValue ?? getBaseValue(props, dispatch);
    return <PasswordCell value={normalizeToString(value)} cellIndex={(props as any).cellIndex} />;
  },
  (nodeValue) => maskPassword(normalizeToString(nodeValue.text.value)),
  getBaseValue
)
  .setEditViewFn((props) => {
    return (
      <PasswordEditView
        value={normalizeToString(props.value)}
        onChange={(v) => props.onChange(v)}
        onChangeEnd={props.onChangeEnd}
      />
    );
  })
  .setPropertyViewFn((children) => (
    <>
      {children.text.propertyView({
        label: "Value",
        tooltip: ColumnValueTooltip,
      })}
    </>
  ))
  .build();


