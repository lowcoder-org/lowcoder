import { styleControl } from "comps/controls/styleControl";
import { AnimationStyle, AnimationStyleType, FileViewerStyle, FileViewerStyleType, heightCalculator, widthCalculator } from "comps/controls/styleControlConstants";
import { isEmpty } from "lodash";
import React, { useEffect, useState } from "react";
import { DocumentViewer } from "react-documents";
import styled, { css } from "styled-components";
import { StringControl } from "../controls/codeControl";
import { UICompBuilder, withDefault } from "../generators";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "../generators/withExposing";
import { trans } from "i18n";
import {viewMode} from "@lowcoder-ee/util/editor";
import { AutoHeightControl } from "../controls/autoHeightControl";
import { BoolControl } from "../controls/boolControl";
const PropertyView =  React.lazy( async () => await import("@lowcoder-ee/comps/comps/propertyView/fileViewerComp"));

const getStyle = (style: FileViewerStyleType) => {
  return css`
    width: ${widthCalculator(style.margin)};	
    height: ${heightCalculator(style.margin)};	
    margin: ${style.margin};	
    padding: ${style.padding};

    overflow: hidden;
    background: ${style.background};
    border: ${(props) => (style.borderWidth ? style.borderWidth : "1px")} solid ${style.border};
    border-radius: calc(min(${style.radius}, 20px));
  `;
};

const ErrorWrapper = styled.div<{$style: FileViewerStyleType, $animationStyle:AnimationStyleType}>`
  display: flex;
  height: 100%;
  justify-content: center;
  align-items: center;
  ${(props) => props.$style && getStyle(props.$style)}
  ${(props) => props.$animationStyle}
`;

const StyledDiv = styled.div<{$style: FileViewerStyleType;}>`
  height: 100%;
  ${(props) => props.$style && getStyle(props.$style)}
`;

const DraggableFileViewer = (props: {
  src: string;
  style: FileViewerStyleType,
  animationStyle:AnimationStyleType,
  showVerticalScrollbar: boolean,
}) => {
  const [isActive, setActive] = useState(false);

  return (
    <StyledDiv
      $style={props.style}
      id="fileViewer"
      onClick={(e) => setActive(true)}
      onMouseLeave={(e) => setActive(false)}
    >
      <DocumentViewer
        style={{
          pointerEvents: isActive ? "auto" : "none",
          width: "100%",
          height: "100%",
        }}
        url={props.src}
        viewer={"url"}
      />
    </StyledDiv>
  );
};

let FileViewerBasicComp = (function () {
  const childrenMap = {
    src: StringControl,
    autoHeight: withDefault(AutoHeightControl,'auto'),
    showVerticalScrollbar: withDefault(BoolControl, false),
    style: styleControl(FileViewerStyle , 'style'),
    animationStyle: styleControl(AnimationStyle , 'animationStyle'),
  };
  let builder = new UICompBuilder(childrenMap, (props) => {
    if (isEmpty(props.src)) {
      return (
        <ErrorWrapper
          $style={props.style}
          $animationStyle={props.animationStyle}
        >
          {trans('fileViewer.invalidURL')}
        </ErrorWrapper>
      );
    }
    return <DraggableFileViewer
      src={props.src}
      style={props.style}
      animationStyle={props.animationStyle}
      showVerticalScrollbar={props.showVerticalScrollbar}
    />;
  })
  if (viewMode() === "edit") {
    builder.setPropertyViewFn((children) => <PropertyView {...children}></PropertyView>);
  }
      return builder
    .build();
})();

FileViewerBasicComp = class extends FileViewerBasicComp {
  override autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }
};

export const FileViewerComp = withExposingConfigs(FileViewerBasicComp, [
  new NameConfig("src", trans("fileViewer.srcDesc")),
  NameConfigHidden,
]);
