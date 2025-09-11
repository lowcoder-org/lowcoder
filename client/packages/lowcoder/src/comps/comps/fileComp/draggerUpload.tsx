import { default as AntdUpload } from "antd/es/upload";
import { default as Button } from "antd/es/button";
import { UploadFile, UploadChangeParam } from "antd/es/upload/interface";
import { useState, useEffect } from "react";
import styled from "styled-components";
import { trans } from "i18n";
import _ from "lodash";
import {
  changeValueAction,
  CompAction,
  multiChangeAction,
  RecordConstructorToView,
} from "lowcoder-core";
import { hasIcon } from "comps/utils";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import { resolveValue, resolveParsedValue, commonProps } from "./fileComp";
import { FileStyleType } from "comps/controls/styleControlConstants";

const IconWrapper = styled.span`
  display: flex;
`;

const StyledDragger = styled(AntdUpload.Dragger)<{
  $style: FileStyleType;
  $autoHeight: boolean;
}>`
  &.ant-upload-drag {
    border-color: ${(props) => props.$style.border};
    border-width: ${(props) => props.$style.borderWidth};
    border-style: ${(props) => props.$style.borderStyle};
    border-radius: ${(props) => props.$style.radius};
    background: ${(props) => props.$style.background};
    ${(props) => !props.$autoHeight && `height: 200px; display: flex; align-items: center;`}
    
    .ant-upload-drag-container {
      ${(props) => !props.$autoHeight && `display: flex; flex-direction: column; justify-content: center; height: 100%;`}
    }
    
    &:hover {
      border-color: ${(props) => props.$style.accent};
      background: ${(props) => props.$style.background};
    }
    
    .ant-upload-text {
      color: ${(props) => props.$style.text};
      font-size: ${(props) => props.$style.textSize};
      font-weight: ${(props) => props.$style.textWeight};
      font-family: ${(props) => props.$style.fontFamily};
      font-style: ${(props) => props.$style.fontStyle};
    }
    
    .ant-upload-hint {
      color: ${(props) => props.$style.text};
      opacity: 0.7;
    }
    
    .ant-upload-drag-icon {
      margin-bottom: 16px;
      
      .anticon {
        color: ${(props) => props.$style.accent};
        font-size: 48px;
      }
    }
  }
`;

interface DraggerUploadProps {
  value: Array<string | null>;
  files: any[];
  fileType: string[];
  showUploadList: boolean;
  disabled: boolean;
  onEvent: (eventName: string) => void;
  style: FileStyleType;
  parseFiles: boolean;
  parsedValue: Array<any>;
  prefixIcon: any;
  suffixIcon: any;
  forceCapture: boolean;
  minSize: number;
  maxSize: number;
  maxFiles: number;
  uploadType: "single" | "multiple" | "directory";
  text: string;
  dispatch: (action: CompAction) => void;
  autoHeight: boolean;
  tabIndex?: number;
}

export const DraggerUpload = (props: DraggerUploadProps) => {
  const { dispatch, files, style, autoHeight } = props;
  const [fileList, setFileList] = useState<UploadFile[]>(
    files.map((f) => ({ ...f, status: "done" })) as UploadFile[]
  );

  useEffect(() => {
    if (files.length === 0 && fileList.length !== 0) {
      setFileList([]);
    }
  }, [files]);

  const handleOnChange = (param: UploadChangeParam) => {
    const uploadingFiles = param.fileList.filter((f) => f.status === "uploading");
    if (uploadingFiles.length !== 0) {
      setFileList(param.fileList);
      return;
    }

    let maxFiles = props.maxFiles;
    if (props.uploadType === "single") {
      maxFiles = 1;
    } else if (props.maxFiles <= 0) {
      maxFiles = 100;
    }

    const uploadedFiles = param.fileList.filter((f) => f.status === "done");

    if (param.file.status === "removed") {
      const index = props.files.findIndex((f) => f.uid === param.file.uid);
      dispatch(
        multiChangeAction({
          value: changeValueAction(
            [...props.value.slice(0, index), ...props.value.slice(index + 1)],
            false
          ),
          files: changeValueAction(
            [...props.files.slice(0, index), ...props.files.slice(index + 1)],
            false
          ),
          parsedValue: changeValueAction(
            [...props.parsedValue.slice(0, index), ...props.parsedValue.slice(index + 1)],
            false
          ),
        })
      );
      props.onEvent("change");
    } else {
      const unresolvedValueIdx = Math.min(props.value.length, uploadedFiles.length);
      const unresolvedParsedValueIdx = Math.min(props.parsedValue.length, uploadedFiles.length);

      Promise.all([
        resolveValue(uploadedFiles.slice(unresolvedValueIdx)),
        resolveParsedValue(uploadedFiles.slice(unresolvedParsedValueIdx)),
      ]).then(([value, parsedValue]) => {
        dispatch(
          multiChangeAction({
            value: changeValueAction([...props.value, ...value].slice(-maxFiles), false),
            files: changeValueAction(
              uploadedFiles
                .map((file) => _.pick(file, ["uid", "name", "type", "size", "lastModified"]))
                .slice(-maxFiles),
              false
            ),
            ...(props.parseFiles
              ? {
                  parsedValue: changeValueAction(
                    [...props.parsedValue, ...parsedValue].slice(-maxFiles),
                    false
                  ),
                }
              : {}),
          })
        );
        props.onEvent("change");
        props.onEvent("parse");
      });
    }

    setFileList(uploadedFiles.slice(-maxFiles));
  };

  return (
    <StyledDragger
      {...commonProps(props)}
      fileList={fileList}
      $style={style}
      $autoHeight={autoHeight}
      beforeUpload={(file) => {
        if (!file.size || file.size <= 0) {
          messageInstance.error(`${file.name} ` + trans("file.fileEmptyErrorMsg"));
          return AntdUpload.LIST_IGNORE;
        }

        if (
          (!!props.minSize && file.size < props.minSize) ||
          (!!props.maxSize && file.size > props.maxSize)
        ) {
          messageInstance.error(`${file.name} ` + trans("file.fileSizeExceedErrorMsg"));
          return AntdUpload.LIST_IGNORE;
        }
        return true;
      }}
      onChange={handleOnChange}
    >
      <p className="ant-upload-drag-icon">
        {hasIcon(props.prefixIcon) ? (
          <IconWrapper>{props.prefixIcon}</IconWrapper>
        ) : (
          <Button type="text" style={{ fontSize: '48px', color: style.accent, border: 'none' }}>
            📁
          </Button>
        )}
      </p>
      <p className="ant-upload-text">
        {props.text || trans("file.dragAreaText")}
      </p>
      <p className="ant-upload-hint">
        {trans("file.dragAreaHint")}
      </p>
    </StyledDragger>
  );
};
