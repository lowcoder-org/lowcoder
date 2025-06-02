import { default as Button } from "antd/es/button";
import { default as Skeleton } from "antd/es/skeleton";
import {
  Button100,
  ButtonCompWrapper,
  buttonRefMethods,
} from "comps/comps/buttonComp/buttonCompConstants";
import { BoolCodeControl, StringControl } from "comps/controls/codeControl";
import { ScannerEventHandlerControl } from "comps/controls/eventHandlerControl";
import { styleControl } from "comps/controls/styleControl";
import { DropdownStyle } from "comps/controls/styleControlConstants";
import { withDefault } from "comps/generators";
import { UICompBuilder } from "comps/generators/uiCompBuilder";
import { CustomModal, Section, sectionNames } from "lowcoder-design";
import styled, { keyframes } from "styled-components";
import {
  CommonNameConfig,
  NameConfig,
  withExposingConfigs,
} from "../../generators/withExposing";
import {
  hiddenPropertyView,
  disabledPropertyView,
  showDataLoadingIndicatorsPropertyView,
} from "comps/utils/propertyUtils";
import { trans } from "i18n";
import React, {
  Suspense,
  useEffect,
  useRef,
  useState,
  useContext,
} from "react";
import { arrayStringExposingStateControl } from "comps/controls/codeStateControl";
import { BoolControl } from "comps/controls/boolControl";
import { RefControl } from "comps/controls/refControl";
import { EditorContext } from "comps/editorState";

const Error = styled.div`
  color: #f5222d;
  height: 100px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Wrapper = styled.div`
  video,
  .ant-skeleton {
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

const dropdownShow = keyframes`
  from {
    opacity: 0;
    transform: translateY(-8px) scaleY(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scaleY(1);
  }
`;

const DropdownContainer = styled.div`
  position: absolute;
  top: 44px;
  right: 0;
  min-width: 150px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.12),
    0 1.5px 3px rgba(0, 0, 0, 0.08);
  z-index: 1000;
  padding: 6px 0;
  animation: ${dropdownShow} 0.22s cubic-bezier(0.22, 1, 0.36, 1);
  transition: box-shadow 0.2s;
`;

const DropdownItem = styled.div`
  padding: 10px 20px;
  cursor: pointer;
  font-size: 14px;
  color: #222;
  background: transparent;
  transition: background 0.15s;
  &:hover {
    background: #f0f5ff;
    color: #1677ff;
  }
  &:active {
    background: #e6f7ff;
  }
`;

const CustomModalStyled = styled(CustomModal)`
  top: 10vh;
  .react-draggable {
    max-width: 100%;
    width: 500px;
  }
`;

const BarcodeScannerComponent = React.lazy(
  () => import("react-qr-barcode-scanner")
);

const ScannerTmpComp = (function () {
  const childrenMap = {
    data: arrayStringExposingStateControl("data"),
    text: withDefault(StringControl, trans("scanner.text")),
    continuous: BoolControl,
    uniqueData: withDefault(BoolControl, true),
    maskClosable: withDefault(BoolControl, true),
    onEvent: ScannerEventHandlerControl,
    disabled: BoolCodeControl,
    style: styleControl(DropdownStyle, "style"),
    viewRef: RefControl<HTMLElement>,
  };
  return new UICompBuilder(childrenMap, (props) => {
    const [showModal, setShowModal] = useState(false);
    const [errMessage, setErrMessage] = useState("");
    const [videoConstraints, setVideoConstraints] =
      useState<MediaTrackConstraints>({
        facingMode: "environment",
      });
    const [modeList, setModeList] = useState<{ label: string; key: string }[]>(
      []
    );
    const [handleDropdown, setHandleDropdown] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
      if (!showModal && success) {
        props.onEvent("success");
      }
    }, [success, showModal]);

    const continuousValue = useRef<string[]>([]);

    const handleUpdate = (err: any, result: any) => {
      if (result) {
        if (props.continuous) {
          continuousValue.current = [...continuousValue.current, result.text];
          const val = props.uniqueData
            ? [...new Set(continuousValue.current)]
            : continuousValue.current;
          props.data.onChange(val);
          props.onEvent("success");
        } else {
          props.data.onChange([result.text]);
          setShowModal(false);
          setSuccess(true);
        }
      } else {
        setSuccess(false);
      }
    };

    const handleErr = (err: any) => {
      if (typeof err === "string") {
        setErrMessage(err);
      } else if (
        err.message === "getUserMedia is not implemented in this browser"
      ) {
        setErrMessage(trans("scanner.errTip"));
      } else {
        setErrMessage(err.message);
      }
      setSuccess(false);
    };

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
      <ButtonCompWrapper $disabled={props.disabled}>
        <Button100
          ref={props.viewRef}
          $buttonStyle={props.style}
          disabled={props.disabled}
          onClick={() => {
            props.onEvent("click");
            setShowModal(true);
            continuousValue.current = [];
          }}
        >
          <span>{props.text}</span>
        </Button100>

        <CustomModalStyled
          showOkButton={false}
          showCancelButton={false}
          open={showModal}
          maskClosable={props.maskClosable}
          destroyOnHidden
          onCancel={() => {
            setShowModal(false);
            props.onEvent("close");
            setVideoConstraints({ facingMode: "environment" });
            setHandleDropdown(false);
          }}
        >
          {!!errMessage ? (
            <Error>{errMessage}</Error>
          ) : (
            showModal && (
              <Wrapper>
                <Suspense fallback={<Skeleton />}>
                  <BarcodeScannerComponent
                    key={JSON.stringify(videoConstraints)}
                    delay={1000}
                    onUpdate={handleUpdate}
                    onError={handleErr}
                    videoConstraints={videoConstraints}
                  />
                </Suspense>

                <div style={{ position: "relative", marginTop: 10 }}>
                  <Button
                    style={{ float: "right" }}
                    onClick={() => {
                      getModeList();
                      setHandleDropdown(!handleDropdown);
                    }}
                  >
                    {trans("scanner.changeCamera")}
                  </Button>

                  {handleDropdown && (
                    <DropdownContainer>
                      {modeList.map(({ key, label }) => (
                        <DropdownItem
                          key={key}
                          onClick={() => {
                            setVideoConstraints({ deviceId: { exact: key } });
                            setHandleDropdown(false);
                          }}
                        >
                          {label}
                        </DropdownItem>
                      ))}
                    </DropdownContainer>
                  )}
                </div>
              </Wrapper>
            )
          )}
        </CustomModalStyled>
      </ButtonCompWrapper>
    );
  })
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.text.propertyView({ label: trans("text") })}
        </Section>

        {(useContext(EditorContext).editorModeStatus === "logic" ||
          useContext(EditorContext).editorModeStatus === "both") && (
          <>
            <Section name={sectionNames.interaction}>
              {children.onEvent.getPropertyView()}
              {disabledPropertyView(children)}
              {hiddenPropertyView(children)}
              {showDataLoadingIndicatorsPropertyView(children)}
            </Section>
            <Section name={sectionNames.advanced}>
              {children.continuous.propertyView({
                label: trans("scanner.continuous"),
              })}
              {children.continuous.getView() &&
                children.uniqueData.propertyView({
                  label: trans("scanner.uniqueData"),
                })}
              {children.maskClosable.propertyView({
                label: trans("scanner.maskClosable"),
              })}
            </Section>
          </>
        )}

        {(useContext(EditorContext).editorModeStatus === "layout" ||
          useContext(EditorContext).editorModeStatus === "both") && (
          <Section name={sectionNames.style}>
            {children.style.getPropertyView()}
          </Section>
        )}
      </>
    ))
    .setExposeMethodConfigs(buttonRefMethods)
    .build();
})();

export const ScannerComp = withExposingConfigs(ScannerTmpComp, [
  new NameConfig("data", trans("data")),
  new NameConfig("text", trans("button.textDesc")),
  ...CommonNameConfig,
]);
