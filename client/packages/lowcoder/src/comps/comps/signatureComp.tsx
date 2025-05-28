import { default as DeleteOutlined } from "@ant-design/icons/DeleteOutlined";
import { default as Skeleton } from "antd/es/skeleton";
import { BoolControl } from "comps/controls/boolControl";
import { StringControl } from "comps/controls/codeControl";
import { ChangeEventHandlerControl } from "comps/controls/eventHandlerControl";
import { LabelControl } from "comps/controls/labelControl";
import { styleControl } from "comps/controls/styleControl";
import {
  contrastColor,
  SignatureStyle,
  LabelStyle,
  SignatureStyleType,
  widthCalculator,
  heightCalculator,
  SignatureContainerStyle
} from "comps/controls/styleControlConstants";
import { stateComp, withDefault } from "comps/generators/simpleGenerators";
import { hiddenPropertyView, showDataLoadingIndicatorsPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { changeValueAction, multiChangeAction } from "lowcoder-core";
import { Section, sectionNames, UndoIcon } from "lowcoder-design";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { ResizePayload, useResizeDetector } from "react-resize-detector";
import type SignatureCanvasType from "react-signature-canvas";
import styled from "styled-components";
import { UICompBuilder } from "../generators";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "../generators/withExposing";
import { formDataChildren, FormDataPropertyView } from "./formComp/formDataConstants";

import { useContext } from "react";
import { EditorContext } from "comps/editorState";

const Wrapper = styled.div<{ $style: SignatureStyleType; $isEmpty: boolean }>`
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  border: ${(props) => (props.$style.borderWidth ? props.$style.borderWidth : "1px")} solid ${(props) => props.$style.border};
  border-radius: ${(props) => props.$style.radius};
  overflow: hidden;
  width: 100%;
  height: 100%;
  width: ${(props) => {
    return widthCalculator(props.$style.margin);
  }};	
  height: ${(props) => {
    return heightCalculator(props.$style.margin);
  }};	
  margin: ${(props) => props.$style.margin};	
  padding: ${(props) => props.$style.padding};
  .signature {
    background-color: ${(props) => props.$style.background};
    opacity: ${(props) => (props.$isEmpty ? 0 : 1)};
    width: 100%;
    height: 100%;
  }

  .sigCanvas {
    flex-grow: 1;
  }
  .footer {
    position: absolute;
    bottom: 0;
    right: 0;
    padding-right: 8px;
    > span {
      margin: 0 8px 16px 8px;
      cursor: pointer;
      svg {
        color: ${(props) => props.$style.footerIcon};
        width: 14px;
        height: 14px;
        path {
          fill: ${(props) => props.$style.footerIcon};
        }
      }
      &:hover svg {
        color: ${(props) => contrastColor(props.$style.footerIcon)};
        path {
          fill: ${(props) => contrastColor(props.$style.footerIcon)};
        }
      }
    }
  }
  .empty {
    position: absolute;
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${(props) => props.$style.background};
    z-index: -1;
    color: ${(props) => props.$style.tips};
  }
`;

const childrenMap = {
  tips: withDefault(StringControl, trans('signature.signHere')),
  onEvent: ChangeEventHandlerControl,
  label: withDefault(LabelControl, {position: 'column', text: ''}),
  style: styleControl(SignatureContainerStyle , 'style'),
  labelStyle: styleControl(LabelStyle , 'labelStyle'),
  showUndo: withDefault(BoolControl, true),
  showClear: withDefault(BoolControl, true),
  value: stateComp(''),
  inputFieldStyle: styleControl(SignatureStyle , 'inputFieldStyle'),
  ...formDataChildren,
};

const SignatureCanvas = React.lazy(() => import("react-signature-canvas"));

let SignatureTmpComp = (function () {
  return new UICompBuilder(childrenMap, (props, dispatch) => {
    const canvasRef = useRef<SignatureCanvasType | null>(null);
    const [isBegin, setIsBegin] = useState(false);
    const [canvasSize, setCanvasSize] = useState([0, 0]);
    const conRef = useRef<HTMLDivElement>(null);

    const updateValue = (isClear: boolean = false) => {
      if (!canvasRef.current) return;
      
      const clear = isClear || canvasRef.current.toData().length === 0;
      if (clear) {
        canvasRef.current.clear();
        setIsBegin(false);
        dispatch(
          multiChangeAction({
            value: changeValueAction("", false),
          })
        );
      } else {
        dispatch(
          multiChangeAction({
            value: changeValueAction(canvasRef.current.toDataURL(), false),
          })
        );
      }
    };

    useResizeDetector({
      targetRef: conRef,
      onResize: ({width, height}: ResizePayload) => {
        if (width && height) {
          setCanvasSize([width, height]);
          // Don't clear on resize as it breaks the drawing functionality
          // updateValue(true);
        }
      },
    });

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (canvasRef.current) {
          canvasRef.current.clear();
        }
      };
    }, []);

    return props.label({
      style: props.style,
      labelStyle: props.labelStyle,
      inputFieldStyle: props.inputFieldStyle,
      children: (
        <Wrapper
          ref={conRef}
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          $style={props.inputFieldStyle}
          $isEmpty={!props.value && !isBegin}
        >
          <div key="signature" className="signature">
            <Suspense fallback={<Skeleton />}>
              <SignatureCanvas
                ref={canvasRef}
                penColor={props.inputFieldStyle.pen}
                clearOnResize={false}
                canvasProps={{
                  className: "sigCanvas",
                  width: canvasSize[0],
                  height: canvasSize[1],
                }}
                onEnd={() => {
                  updateValue();
                  setIsBegin(false);
                  props.onEvent("change");
                }}
                onBegin={() => {
                  setIsBegin(true);
                }}
              />
            </Suspense>
          </div>
          {(props.showClear || props.showUndo) && (
            <div key="footer" className="footer">
              {props.showUndo && (
                <span className="anticon">
                  <UndoIcon
                    onClick={() => {
                      if (!canvasRef.current) return;
                      const data = canvasRef.current.toData();
                      if (data && data.length > 0) {
                        data.pop();
                        canvasRef.current.fromData(data);
                        updateValue();
                        props.onEvent("change");
                      }
                    }}
                  />
                </span>
              )}
              {props.showClear && (
                <DeleteOutlined
                  onClick={() => {
                    updateValue(true);
                    props.onEvent("change");
                  }}
                />
              )}
            </div>
          )}
          {!(isBegin || props.value) && <div key="empty" className="empty">{props.tips}</div>}
        </Wrapper>
      ),
    });
  })
    .setPropertyViewFn((children) => {
      return (
        <>
          <Section name={sectionNames.basic}>
            {children.tips.propertyView({ label: trans("signature.tips") })}
          </Section>

          <FormDataPropertyView {...children} />

          {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
            <Section name={sectionNames.interaction}>
              {children.onEvent.getPropertyView()}
              {hiddenPropertyView(children)}
              {children.showUndo.propertyView({ label: trans("signature.showUndo") })}
              {children.showClear.propertyView({ label: trans("signature.showClear") })}
              {showDataLoadingIndicatorsPropertyView(children)}
            </Section>
          )}

          {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
            children.label.getPropertyView()
          )}

          {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
            <>
              <Section name={sectionNames.style}>
                {children.style.getPropertyView()}
              </Section>
              <Section name={sectionNames.labelStyle}>
                {children.labelStyle.getPropertyView()}
              </Section>
              <Section name={sectionNames.inputFieldStyle}>
                {children.inputFieldStyle.getPropertyView()}
              </Section>
            </>
          )}
        </>
      );
    })
    .build();
})();

SignatureTmpComp = class extends SignatureTmpComp {
  override autoHeight(): boolean {
    return false;
  }
};

export const SignatureComp = withExposingConfigs(SignatureTmpComp, [
  new NameConfig("value", trans("value")),
  NameConfigHidden,
]);
