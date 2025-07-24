import styled from "styled-components";
import React, { useContext } from "react";
import { Tag } from "antd";
import { EditorContext } from "comps/editorState";
import { PresetStatusColorTypes } from "antd/es/_util/colors";
import { hashToNum } from "util/stringUtils";
import { TagsCompOptionsControl } from "comps/controls/optionsControl";
import { useCompClickEventHandler } from "@lowcoder-ee/comps/utils/useCompClickEventHandler";
import { styleControl } from "@lowcoder-ee/comps/controls/styleControl";
import { ButtonEventHandlerControl } from "@lowcoder-ee/comps/controls/eventHandlerControl";
import { InputLikeStyle } from "@lowcoder-ee/comps/controls/styleControlConstants";
import { BoolCodeControl } from "@lowcoder-ee/comps/controls/codeControl";
import { UICompBuilder } from "@lowcoder-ee/comps/generators/uiCompBuilder";
import { Section, sectionNames } from "lowcoder-design";
import { NameConfig } from "@lowcoder-ee/comps/generators/withExposing";
import { hiddenPropertyView, showDataLoadingIndicatorsPropertyView } from "@lowcoder-ee/comps/utils/propertyUtils";
import { withExposingConfigs } from "@lowcoder-ee/comps/generators/withExposing";

const colors = PresetStatusColorTypes;

// These functions are used for individual tag styling
function getTagColor(tagText : any, tagOptions: any[]) {
  const foundOption = tagOptions.find((option: { label: any; }) => option.label === tagText);
  if (foundOption) {
    if (foundOption.colorType === "default") {
      return undefined; 
    } else if (foundOption.colorType === "preset") {
      return foundOption.presetColor;
    } else if (foundOption.colorType === "custom") {
      return undefined;
    }
    return foundOption.color;
  }
  const index = Math.abs(hashToNum(tagText)) % colors.length;
  return colors[index];
}

const getTagStyle = (tagText: any, tagOptions: any[], baseStyle: any = {}) => {
  const foundOption = tagOptions.find((option: { label: any; }) => option.label === tagText);
  
  if (foundOption) {
    // If colorType is "default", use ONLY component styles
    if (foundOption.colorType === "default") {
      const style: any = { ...baseStyle };
      if (baseStyle.borderWidth && baseStyle.border && baseStyle.borderStyle) {
        style.border = `${baseStyle.borderWidth} ${baseStyle.borderStyle} ${baseStyle.border}`;
      }
      return style;
    }
    
    const style: any = { ...baseStyle };
    
    if (foundOption.colorType === "custom") {
      style.backgroundColor = foundOption.color;
      style.color = foundOption.textColor;
    }
    
    let borderStyle = foundOption.borderStyle || "none";
    let borderWidth = foundOption.borderWidth || "0px";
    let borderColor = foundOption.border || "none";
    
    if (borderStyle !== "none") {
      style.border = `${borderWidth} ${borderStyle} ${borderColor}`;
    } else {
      style.border = "none";
    }
    
    if (foundOption.radius) {
      style.borderRadius = foundOption.radius;
    }
    
    if (foundOption.margin) {
      style.margin = foundOption.margin;
    }
    
    if (foundOption.padding) {
      style.padding = foundOption.padding;
    }
    
    if (foundOption.width) {
      style.width = foundOption.width;
    }
    
    return style;
  }

  const style: any = { ...baseStyle };
  if (baseStyle.borderWidth && baseStyle.border && baseStyle.borderStyle) {
    style.border = `${baseStyle.borderWidth} ${baseStyle.borderStyle} ${baseStyle.border}`;
  }
  return style;
};

const multiTags = (function () {

  const StyledTag = styled(Tag)<{ $style: any, $customStyle: any }>`
    display: flex;
    justify-content: center;
    align-items: center;
    min-width: fit-content;
    width: ${(props) => props.$customStyle?.width || 'auto'};
    max-width: 100px;
    background: ${(props) => props.$customStyle?.backgroundColor || props.$style?.background};
    color: ${(props) => props.$customStyle?.color || props.$style?.text};
    border-radius: ${(props) => props.$customStyle?.borderRadius || props.$style?.borderRadius};
    border: ${(props) => props.$customStyle?.border || props.$style?.border || '1px solid #d9d9d9'};
    padding: ${(props) => props.$customStyle?.padding || props.$style?.padding};
    margin: ${(props) => props.$customStyle?.margin || props.$style?.margin};
    font-size: ${(props) => props.$style?.textSize || '8px'};
    font-weight: ${(props) => props.$style?.fontWeight};
    cursor: pointer;
  `;

  const StyledTagContainer = styled.div`
    display: flex;
    gap: 5px;
    padding: 5px;
  `;

  const childrenMap = {
    options: TagsCompOptionsControl,
    style: styleControl(InputLikeStyle, 'style'),
    onEvent: ButtonEventHandlerControl,
  };

  return new UICompBuilder(childrenMap, (props) => {
    const handleClickEvent = useCompClickEventHandler({onEvent: props.onEvent});

    return (
      <StyledTagContainer>
        {props.options.map((tag, index) => {

          const tagColor = getTagColor(tag.label, props.options);
          const tagIcon = tag.icon;
          const tagStyle = getTagStyle(tag.label, props.options, props.style);
          
          return (
            <StyledTag 
              key={`tag-${index}`}
              $style={props.style}
              $customStyle={tagStyle}
              icon={tagIcon}
              color={tagColor}
              onClick={handleClickEvent}
            >
              {tag.label}
            </StyledTag>
          );
        })}
      </StyledTagContainer>
    ); 
  })
    .setPropertyViewFn((children: any) => {
      return (
        <>
          <Section name={sectionNames.basic}>
            {children.options.propertyView({})} 
          </Section>

          {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
            <Section name={sectionNames.interaction}>
              {children.onEvent.getPropertyView()}
              {hiddenPropertyView(children)}
              {showDataLoadingIndicatorsPropertyView(children)}
            </Section>
          )}

          {["layout", "both"].includes(
            useContext(EditorContext).editorModeStatus
          ) && (
              <Section name={sectionNames.style}>
                {children.style.getPropertyView()}
              </Section>
            )}
        </>
      )
    })
    .build();
})()

export const MultiTagsComp = withExposingConfigs(multiTags, [new NameConfig("options", "")]);

