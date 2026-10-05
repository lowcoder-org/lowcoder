import { default as AntUpload } from "antd/es/upload";
import React from "react";
import styled from "styled-components";

const Upload = styled(AntUpload)`
  .ant-upload-wrapper .ant-upload-select {
    display: block;
  }
`;

type ThemeImportProps = {
  children: React.ReactNode;
  disabled?: boolean;
  onImport: (file: File) => void | Promise<void>;
};

export function ThemeImport(props: ThemeImportProps) {
  const { children, disabled, onImport } = props;

  return (
    <Upload
      accept=".json,application/json"
      showUploadList={false}
      disabled={disabled}
      customRequest={async ({ file, onSuccess, onError }) => {
        try {
          await onImport(file as File);
          onSuccess?.("ok");
        } catch (error) {
          onError?.(error as Error);
        }
      }}
      multiple={false}
    >
      {children}
    </Upload>
  );
}
