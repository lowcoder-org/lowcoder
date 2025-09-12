import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { default as Button } from "antd/es/button";
import Dropdown from "antd/es/dropdown";
import type { ItemType } from "antd/es/menu/interface";
import Skeleton from "antd/es/skeleton";
import Menu from "antd/es/menu";
import Flex from "antd/es/flex";
import styled from "styled-components";
import { trans } from "i18n";
import { CustomModal } from "lowcoder-design";

const CustomModalStyled = styled(CustomModal)`
  top: 10vh;
  .react-draggable {
    max-width: 100%;
    width: 500px;

    video {
      width: 100%;
    }
  }
`;

const Error = styled.div`
  color: #f5222d;
  height: 100px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Wrapper = styled.div`
  img,
  video,
  .ant-skeleton {
    width: 100%;
    height: 400px;
    max-height: 70vh;
    position: relative;
    object-fit: cover;
    background-color: #000;
  }
  .ant-skeleton {
    h3,
    li {
      background-color: transparent;
    }
  }
`;

const ReactWebcam = React.lazy(() => import("react-webcam"));

export const ImageCaptureModal = (props: {
  showModal: boolean;
  onModalClose: () => void;
  onImageCapture: (image: string) => void;
}) => {
  const [errMessage, setErrMessage] = useState("");
  const [videoConstraints, setVideoConstraints] = useState<MediaTrackConstraints>({
    facingMode: "environment",
  });
  const [modeList, setModeList] = useState<ItemType[]>([]);
  const [dropdownShow, setDropdownShow] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>();
  const webcamRef = useRef<any>(null);

  useEffect(() => {
    if (props.showModal) {
      setImgSrc("");
      setErrMessage("");
    }
  }, [props.showModal]);

  const handleMediaErr = (err: any) => {
    if (typeof err === "string") {
      setErrMessage(err);
    } else {
      if (err.message === "getUserMedia is not implemented in this browser") {
        setErrMessage(trans("scanner.errTip"));
      } else {
        setErrMessage(err.message);
      }
    }
  };

  const handleCapture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot?.();
    setImgSrc(imageSrc);
  }, [webcamRef]);

  const getModeList = () => {
    navigator.mediaDevices.enumerateDevices().then((data) => {
      const videoData = data.filter((item) => item.kind === "videoinput");
      const faceModeList = videoData.map((item, index) => ({
        label: item.label || trans("scanner.camera", { index: index + 1 }),
        key: item.deviceId,
      }));
      setModeList(faceModeList);
    });
  };

  return (
    <CustomModalStyled
      showOkButton={false}
      showCancelButton={false}
      open={props.showModal}
      maskClosable={true}
      destroyOnHidden
      onCancel={props.onModalClose}
    >
      {!!errMessage ? (
        <Error>{errMessage}</Error>
      ) : (
        props.showModal && (
          <Wrapper>
            {imgSrc ? (
              <img src={imgSrc} alt="webcam" />
            ) : (
              <Suspense fallback={<Skeleton />}>
                <ReactWebcam
                  ref={webcamRef}
                  onUserMediaError={handleMediaErr}
                  screenshotFormat="image/jpeg"
                />
              </Suspense>
            )}
            {imgSrc ? (
              <Flex justify="center" gap={10}>
                <Button
                  type="primary"
                  style={{ float: "right", marginTop: "10px" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (imgSrc) props.onImageCapture(imgSrc);
                  }}
                >
                  {trans("file.usePhoto")}
                </Button>
                <Button
                  style={{ float: "right", marginTop: "10px" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setImgSrc("");
                  }}
                >
                  {trans("file.retakePhoto")}
                </Button>
              </Flex>
            ) : (
              <Flex justify="center" gap={10}>
                <Button
                  type="primary"
                  style={{ float: "right", marginTop: "10px" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCapture();
                  }}
                >
                  {trans("file.capture")}
                </Button>
                <Dropdown
                  placement="bottomRight"
                  trigger={["click"]}
                  open={dropdownShow}
                  onOpenChange={(value) => setDropdownShow(value)}
                  popupRender={() => (
                    <Menu
                      items={modeList}
                      onClick={(value) =>
                        setVideoConstraints({ ...videoConstraints, deviceId: value.key })
                      }
                    />
                  )}
                >
                  <Button
                    style={{ float: "right", marginTop: "10px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      getModeList();
                    }}
                  >
                    {trans("scanner.changeCamera")}
                  </Button>
                </Dropdown>
              </Flex>
            )}
          </Wrapper>
        )
      )}
    </CustomModalStyled>
  );
};

export default ImageCaptureModal;


