import { PresetStatusColorType } from "antd/es/_util/colors";
import _ from "lodash";
import { changeChildAction, DispatchType } from "lowcoder-core";
import React, { ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { JSONValue } from "util/jsonTypes";
import ColumnTypeView from "./columnTypeView";
import { TableCellContext } from "comps/comps/tableComp/tableContext";
import Tooltip from "antd/es/tooltip";

type StatusType = PresetStatusColorType | "none";
export const TABLE_EDITABLE_SWITCH_ON = true;
export const TagsContext = React.createContext<string[]>([]);
export const StatusContext = React.createContext<{ text: string; status: StatusType }[]>([]);
export type UpdateChangeSet<T> = (value: T) => void;

// a top-right triangle chip
const EditableChip = styled.div`
  position: absolute;
  top: 2px;
  right: 2px;
  z-index: 2;

  width: 0px;
  height: 0px;
  border: 4.5px solid transparent;
  border-radius: 2px;
  border-top-color: #5589F2;
  border-right-color: #5589F2;
`;

const EditableOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

export interface CellProps {
  editable?: boolean;
  tableSize?: string;
  candidateTags?: string[];
  candidateStatus?: { text: string; status: StatusType }[];
  textOverflow?: boolean;
  cellTooltip?: string;
  editMode?: string;
  onTableEvent?: (eventName: any) => void;
  cellIndex?: string;
}

export type CellViewReturn = (props: CellProps) => ReactNode;
export type EditViewFn<T> = (props: {
  value: T;
  onChange: (value: T) => void;
  onChangeEnd: () => void;
  otherProps?: Record<string, any>;
}) => ReactNode;

const BorderDiv = styled.div`
  position: absolute;
  border: 1.5px solid #315efb;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
`;

const CellWrapper = React.memo(({
  children,
  tooltipTitle,
}: {
  children: ReactNode,
  tooltipTitle?: string,
}) => {
  if (tooltipTitle) {
    return (
      <Tooltip title={tooltipTitle} placement="topLeft">
        {children}
      </Tooltip>
    )
  }
  return (
    <>{children}</>
  )
});

interface EditableCellProps<T> extends CellProps {
  normalView: ReactNode;
  dispatch: DispatchType;

  editViewFn?: EditViewFn<T>;
  baseValue?: T;
  changeValue?: T | null;
}

function EditableCellComp<T extends JSONValue>(props: EditableCellProps<T>) {
  const {
    dispatch,
    normalView,
    editViewFn,
    changeValue,
    baseValue,
    candidateTags,
    // tagColors
    candidateStatus,
    editMode,
    onTableEvent,
    tableSize,
    textOverflow,
    cellTooltip,
    cellIndex,
    ...otherProps
  } = props;

  const status = _.isNil(changeValue) ? "normal" : "toSave";
  const editable = editViewFn ? props.editable : false;
  const { isEditing, setIsEditing } = useContext(TableCellContext);
  const value = changeValue ?? baseValue!;
  const [tmpValue, setTmpValue] = useState<T | null>(value);
  const singleClickEdit = editMode === 'single';
  
  // Use refs to track component mount state and previous values
  const mountedRef = useRef(true);
  const prevValueRef = useRef(value);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      setTmpValue(null);
      setIsEditing(false);
    };
  }, [setIsEditing]);

  // Update tmpValue when value changes
  useEffect(() => {
    if (!mountedRef.current) return;
    
    if (!_.isEqual(value, prevValueRef.current)) {
      setTmpValue(value);
      prevValueRef.current = value;
    }
  }, [value]);

  const onChange = useCallback(
    (value: T) => {
      if (!mountedRef.current) return;
      setTmpValue(value);
    },
    []
  );

  const onChangeEnd = useCallback(() => {
    if (!mountedRef.current) return;
    
    setIsEditing(false);
    const newValue = _.isNil(tmpValue) || _.isEqual(tmpValue, baseValue) ? null : tmpValue;
    dispatch(
      changeChildAction(
        "changeValue",
        newValue,
        false
      )
    );
    if(!_.isEqual(tmpValue, value)) {
      onTableEvent?.('columnEdited');
    }
  }, [dispatch, tmpValue, baseValue, value, onTableEvent, setIsEditing]);

  const editView = useMemo(
    () => editViewFn?.({ value, onChange, onChangeEnd, otherProps }) ?? <></>,
    [editViewFn, value, onChange, onChangeEnd, otherProps]
  );

  const enterEditFn = useCallback(() => {
    if (!mountedRef.current || !editable) return;
    setIsEditing(true);
  }, [editable, setIsEditing]);

  // Memoize context values to prevent unnecessary re-renders
  const tagsContextValue = useMemo(() => candidateTags ?? [], [candidateTags]);
  const statusContextValue = useMemo(() => candidateStatus ?? [], [candidateStatus]);
  
  if (isEditing) {
    return (
      <>
        <BorderDiv className="editing-border" />
        <TagsContext.Provider value={tagsContextValue}>
          <StatusContext.Provider value={statusContextValue}>
            <div className="editing-wrapper">
              {editView}
            </div>
          </StatusContext.Provider>
        </TagsContext.Provider>
      </>
    );
  }
  
  return (
    <ColumnTypeView
      textOverflow={props.textOverflow}
    >
      {status === "toSave" && !isEditing && <EditableChip key={`editable-chip-${cellIndex}`}/>}
      <CellWrapper tooltipTitle={props.cellTooltip}>
        <div
          key={`normal-view-${cellIndex}`}
          tabIndex={editable ? 0 : -1 }
          onFocus={enterEditFn}
        >
          {normalView}
        </div>
      </CellWrapper>
      {/* overlay on normal view to handle double click for editing */}
      {editable && (
        <CellWrapper tooltipTitle={props.cellTooltip}>
          <EditableOverlay
            key={`editable-view-${cellIndex}`}
            onDoubleClick={!singleClickEdit ? enterEditFn : undefined}
            onClick={singleClickEdit ? enterEditFn : undefined}
          />
        </CellWrapper>
      )}
    </ColumnTypeView>
  );
}

export const EditableCell = React.memo(EditableCellComp) as typeof EditableCellComp;