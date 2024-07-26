import React, { useState } from 'react';
import { Modal, Button, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { trans } from 'i18n'; // Adjust this import according to your project's structure

interface SupaDemoDisplayProps {
  url: string;
  modalWidth?: string;
  modalTop?: string;
  showText?: boolean;
}

const SupaDemoDisplay = ({ url, modalWidth = '75%', modalTop = '6%', showText = true }: SupaDemoDisplayProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div>
      <Tooltip title={trans("editorTutorials.interactiveDemoToolTip")}>
        <Button type="primary" shape="circle" icon={<InfoCircleOutlined />} style={{ paddingTop: "5px" }} onClick={handleOpen} />
        { showText && <span style={{ marginLeft: 8 }} onClick={handleOpen}>{trans("editorTutorials.interactiveDemo")}</span> }
      </Tooltip>
      <Modal
        title={trans("editorTutorials.interactiveDemo")}
        open={isOpen}
        onCancel={handleClose}
        width={modalWidth}
        style={{ top: modalTop }}
        okButtonProps={{ style: { display: 'none' } }}
        cancelButtonProps={{ style: { display: 'none' } }}
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ position: 'relative', boxSizing: 'content-box', maxHeight: '80vh', width: '100%', aspectRatio: '1.7712177121771218', padding: '40px 0' }}>
          <iframe
            src={url}
            loading="lazy"
            title="Temporary State Usage"
            allow="clipboard-write"
            frameBorder="0"
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          ></iframe>
        </div>
      </Modal>
    </div>
  );
};

export default SupaDemoDisplay;
