import React, { useCallback, useEffect, useRef, useState } from "react";
import { default as AntdModal } from "antd/es/modal";
import { default as Input } from "antd/es/input";
import { StringOrNumberControl } from "comps/controls/codeControl";
import { trans } from "i18n";
import { ColumnTypeCompBuilder, ColumnTypeViewFn } from "../columnTypeCompBuilder";
import { ColumnValueTooltip } from "../simpleColumnTypeComps";
import { RecordConstructorToComp } from "lowcoder-core";
import styled from "styled-components";

const { TextArea } = Input;

const TextView = styled.div`
  white-space: pre-wrap;
  word-break: break-word;
  cursor: pointer;
`;

const childrenMap = {
  text: StringOrNumberControl,
};

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, string, string> = (props) =>
  typeof props.text === "string" ? props.text : String(props.text);

const MultilineContent = React.memo(({ value }: { value: string }) => <TextView>{value}</TextView>);

const MultilineEditModal = React.memo((props: {
  value: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}) => {
  const { value, onCommit, onCancel } = props;
  const [localValue, setLocalValue] = useState(value);
  const textAreaRef = useRef<any>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timeout = setTimeout(() => textAreaRef.current?.focus({ cursor: "end" }), 0);
    return () => clearTimeout(timeout);
  }, []);

  const handleSave = useCallback(() => {
    onCommit(localValue);
  }, [localValue, onCommit]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  return (
    <AntdModal
      open={true}
      title={trans("table.multilineEditorTitle")}
      onOk={handleSave}
      onCancel={handleCancel}
      okText={trans("table.multilineEditorSave")}
      cancelText={trans("table.multilineEditorCancel")}
      width={560}
      maskClosable={false}
      destroyOnHidden
    >
      <TextArea
        ref={textAreaRef}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        autoSize={{ minRows: 4, maxRows: 16 }}
        placeholder={trans("table.multilineEditorPlaceholder")}
      />
    </AntdModal>
  );
});

const MultilinePropertyView = React.memo(
  ({ children }: { children: RecordConstructorToComp<typeof childrenMap> }) => (
    <>
      {children.text.propertyView({
        label: trans("table.columnValue"),
        tooltip: ColumnValueTooltip,
      })}
    </>
  )
);

export const ColumnMultilineTextComp = new ColumnTypeCompBuilder(
  childrenMap,
  (props, dispatch) => {
    const value = props.changeValue ?? getBaseValue(props, dispatch);
    return <MultilineContent value={String(value)} />;
  },
  (nodeValue) => nodeValue.text.value,
  getBaseValue
)
  .setEditViewFn((props) => (
    <MultilineEditModal
      value={String(props.value)}
      onCommit={(value) => props.onCommit!(value as any)}
      onCancel={props.onCancel!}
    />
  ))
  .setPropertyViewFn((children) => <MultilinePropertyView children={children} />)
  .build();
