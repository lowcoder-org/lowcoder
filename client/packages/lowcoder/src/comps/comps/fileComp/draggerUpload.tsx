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
} from "lowcoder-core";
import { hasIcon } from "comps/utils";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import { resolveValue, resolveParsedValue, commonProps } from "./fileComp";
import { FileStyleType, AnimationStyleType } from "comps/controls/styleControlConstants";

const IconWrapper = styled.span`
  display: flex;
`;

const DraggerShell = styled.div<{ $auto: boolean }>`
  height: ${(p) => (p.$auto ? "auto" : "100%")};

  /* AntD wraps dragger + list in this */
  .ant-upload-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: auto; /* allows list to be visible if it grows */
  }

  /* The drag area itself */
  .ant-upload-drag {
    ${(p) =>
      !p.$auto &&
      `
      flex: 1 1 auto;
      min-height: 120px;
      min-width: 0;
    `}
  }

  /* The list sits below the dragger */
  .ant-upload-list {
    ${(p) =>
      !p.$auto &&
      `
      flex: 0 0 auto;
    `}
  }
`;


const StyledDragger = styled(AntdUpload.Dragger)<{
  $style: FileStyleType;
  $auto: boolean;
}>`
  &.ant-upload-drag {
    border-color: ${(p) => p.$style.border};
    border-width: ${(p) => p.$style.borderWidth};
    border-style: ${(p) => p.$style.borderStyle};
    border-radius: ${(p) => p.$style.radius};
    background: ${(p) => p.$style.background};

    ${(p) =>
      !p.$auto &&
      `
      display: flex;
      align-items: center;
    `}

    ${(p) =>
      p.$auto &&
      `
      min-height: 200px;
    `}

    .ant-upload-drag-container {
      ${(p) =>
        !p.$auto &&
        `
        display: flex;
        flex-direction: column;
        justify-content: center;
        height: 100%;
      `}
    }

    &:hover {
      border-color: ${(p) => p.$style.accent};
    }
  }
`;


interface DraggerUploadProps {
  value: Array<string | null>;
  files: any[];
  fileType: string[];
  showUploadList: boolean;
  disabled: boolean;
  onEvent: (eventName: string) => Promise<unknown[]>;
  style: FileStyleType;
  animationStyle: AnimationStyleType;
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
  dragHintText?: string;
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
    <DraggerShell $auto={autoHeight}>
      <StyledDragger
        {...commonProps(props)}
        fileList={fileList}
        $style={style}
        $auto={autoHeight}
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
          {props.dragHintText}
        </p>
      </StyledDragger>
    </DraggerShell>
  );
};
