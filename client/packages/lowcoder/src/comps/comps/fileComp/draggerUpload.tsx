import { default as AntdUpload } from "antd/es/upload";
import { default as Button } from "antd/es/button";
import { UploadFile, UploadChangeParam, UploadFileStatus, RcFile } from "antd/es/upload/interface";
import { useState, useMemo } from "react";
import styled, { css } from "styled-components";
import { trans } from "i18n";
import _ from "lodash";
import {
  changeValueAction,
  CompAction,
  multiChangeAction,
} from "lowcoder-core";
import { hasIcon } from "comps/utils";
import { resolveValue, resolveParsedValue, commonProps, validateFile } from "./fileComp";
import { FileStyleType, AnimationStyleType, heightCalculator, widthCalculator } from "comps/controls/styleControlConstants";
import { ImageCaptureModal } from "./ImageCaptureModal";
import { v4 as uuidv4 } from "uuid";
import { checkIsMobile } from "@lowcoder-ee/util/commonUtils";
import { darkenColor } from "components/colorSelect/colorUtils";

const IconWrapper = styled.span`
  display: flex;
`;

const getDraggerStyle = (style: FileStyleType) => {
  return css`
    .ant-upload-drag {
      border-radius: ${style.radius};
      rotate: ${style.rotation};
      margin: ${style.margin};
      padding: ${style.padding};
      width: ${widthCalculator(style.margin)};
      height: ${heightCalculator(style.margin)};
      border-width: ${style.borderWidth};
      border-style: ${style.borderStyle};
      border-color: ${style.border};
      background: ${style.background};
      transition: all 0.3s;
      .ant-upload-drag-container {
        .ant-upload-text {
          color: ${style.text};
          font-family: ${style.fontFamily};
          font-size: ${style.textSize};
          font-weight: ${style.textWeight};
          font-style: ${style.fontStyle};
          text-decoration: ${style.textDecoration};
          text-transform: ${style.textTransform};
        }

        .ant-upload-hint {
          color: ${darkenColor(style.text, 0.3)};
          font-family: ${style.fontFamily};
          font-size: calc(${style.textSize} * 0.9);
        }

        .ant-upload-drag-icon {
          span {
            color: ${style.accent};
          }
        }
      }
    }

    .ant-upload-list {
      .ant-upload-list-item {
        border-color: ${style.border};
        
        .ant-upload-list-item-name {
          color: ${style.text};
        }
      }
    }
  `;
};

const DragAreaOverlay = styled.div`
 // make it position fixed, transparent and match the parent
 position: fixed;
 background-color: transparent;
 width: 100%;
 height: 100%;
 z-index: 1;
 top: 0;
 left: 0;
`;

const StyledDraggerUpload = styled(AntdUpload.Dragger)<{ 
  $auto: boolean;
  $style: FileStyleType;
  $animationStyle: AnimationStyleType;
}>`
  height: ${(p) => (p.$auto ? "auto" : "100%")};
  position: relative;

  /* AntD wraps dragger + list in this */
  &.ant-upload-wrapper {
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
    position: relative;
    ${(props) => props.$animationStyle}
    
    .ant-upload-drag-container {
      .ant-upload-drag-icon {
        display: flex;
        justify-content: center;
      }
    }
  }

  /* The list sits below the dragger */
  .ant-upload-list {
    ${(p) =>
      !p.$auto &&
      `
      flex: 0 0 auto;
    `}
    position: relative;
    z-index: 2;
  }

  /* Apply custom styling */
  ${(props) => props.$style && getDraggerStyle(props.$style)}
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
  fileNamePattern: string;
  uploadType: "single" | "multiple" | "directory";
  text: string;
  dragHintText?: string;
  dispatch: (action: CompAction) => void;
  autoHeight: boolean;
  tabIndex?: number;
}

export const DraggerUpload = (props: DraggerUploadProps) => {
  const { dispatch, files, style, autoHeight, animationStyle } = props;
  // Track only files currently being uploaded (not yet in props.files)
  const [uploadingFiles, setUploadingFiles] = useState<UploadFile[]>([]);
  const [showModal, setShowModal] = useState(false);
  const isMobile = checkIsMobile(window.innerWidth);

  // Derive fileList from props.files (source of truth) + currently uploading files
  const fileList = useMemo<UploadFile[]>(() => [
    ...(files.map((f) => ({ ...f, status: "done" as const })) as UploadFile[]),
    ...uploadingFiles,
  ], [files, uploadingFiles]);

  const handleOnChange = (param: UploadChangeParam) => {
    const currentlyUploading = param.fileList.filter((f) => f.status === "uploading");
    if (currentlyUploading.length !== 0) {
      setUploadingFiles(currentlyUploading);
      return;
    }

    // Clear uploading state when all uploads complete
    setUploadingFiles([]);

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
  };

  return (
      <>
      <StyledDraggerUpload
        {...commonProps(props)}
        fileList={fileList}
        $style={style}
        $animationStyle={animationStyle}
        $auto={autoHeight}
        capture={props.forceCapture}
        openFileDialogOnClick={!(props.forceCapture && !isMobile)}
        beforeUpload={(file) => validateFile(file, {
          minSize: props.minSize,
          maxSize: props.maxSize,
          fileNamePattern: props.fileNamePattern,
        })}
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
         {/* we need a custom overlay to add the onClick handler */}
          {props.forceCapture && !isMobile && (
            <DragAreaOverlay
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowModal(true);
              }}
            />
          )}
        
      </StyledDraggerUpload>

      <ImageCaptureModal
        showModal={showModal}
        onModalClose={() => setShowModal(false)}
        onImageCapture={async (image) => {
          setShowModal(false);
          const res: Response = await fetch(image);
          const blob: Blob = await res.blob();
          const file = new File([blob], "image.jpg", { type: "image/jpeg" });
          const fileUid = uuidv4();
          const uploadFile = {
            uid: fileUid,
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified,
            lastModifiedDate: (file as any).lastModifiedDate,
            status: "done" as UploadFileStatus,
            originFileObj: file as RcFile,
          };
          handleOnChange({ file: uploadFile, fileList: [...fileList, uploadFile] });
        }}
      />
      </>
  );
};
