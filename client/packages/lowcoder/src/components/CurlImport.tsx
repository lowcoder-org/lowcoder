import React, { useState } from "react";
import { Modal, Input, Button, message } from "antd";
import { trans } from "i18n";
import parseCurl from "@bany/curl-to-json";
const { TextArea } = Input;
interface CurlImportModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: (parsedData: any) => void;
}

export function CurlImportModal(props: CurlImportModalProps) {
  const { open, onCancel, onSuccess } = props;
  const [curlCommand, setCurlCommand] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!curlCommand.trim()) {
      message.error("Please enter a cURL command");
      return;
    }

    setLoading(true);
    try {
      // Parse the cURL command using the correct import
      const parsedData = parseCurl(curlCommand);

      
      
      // Log the result for now as requested
    //   console.log("Parsed cURL data:", parsedData);
      
      // Call success callback with parsed data
      onSuccess(parsedData);
      
      // Reset form and close modal
      setCurlCommand("");
      onCancel();
      
      message.success("cURL command imported successfully!");
    } catch (error: any) {
      console.error("Error parsing cURL command:", error);
      message.error(`Failed to parse cURL command: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setCurlCommand("");
    onCancel();
  };

  return (
    <Modal
      title="Import from cURL"
      open={open}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button key="import" type="primary" loading={loading} onClick={handleImport}>
          Import
        </Button>,
      ]}
      width={600}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontWeight: 500 }}>
          Paste cURL Command Here
        </div>
        <div style={{ marginBottom: 12, color: "#666", fontSize: "12px" }}>
          <div style={{ marginBottom: 4 }}>
            <strong>Examples:</strong>
          </div>
          <div style={{ marginBottom: 2 }}>
            GET: <code>curl -X GET https://jsonplaceholder.typicode.com/posts/1</code>
          </div>
          <div style={{ marginBottom: 2 }}>
            POST: <code>curl -X POST https://jsonplaceholder.typicode.com/posts -H "Content-Type: application/json" -d '&#123;"title":"foo","body":"bar","userId":1&#125;'</code>
          </div>
          <div>
            Users: <code>curl -X GET https://jsonplaceholder.typicode.com/users</code>
          </div>
        </div>
        <TextArea
          value={curlCommand}
          onChange={(e) => setCurlCommand(e.target.value)}
          placeholder="curl -X GET https://jsonplaceholder.typicode.com/posts/1"
          rows={8}
          style={{ fontFamily: "monospace" }}
        />
      </div>
    </Modal>
  );
} 