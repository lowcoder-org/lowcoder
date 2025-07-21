import styled from "styled-components";
import React, { useContext } from "react";
import { trans } from "i18n";
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
    if (foundOption.colorType === "preset") {
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
    const style: any = { ...baseStyle };
    
    if (foundOption.colorType === "custom") {
      style.backgroundColor = foundOption.color;
      style.color = foundOption.textColor;
      style.border = `1px solid ${foundOption.color}`;
    }
    
    if (foundOption.border) {
      style.borderColor = foundOption.border;
      if (!foundOption.colorType || foundOption.colorType !== "custom") {
        style.border = `1px solid ${foundOption.border}`;
      }
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
    
    return style;
  }
  return baseStyle;
};

function getTagIcon(tagText: any, tagOptions: any[]) {
  const foundOption = tagOptions.find(option => option.label === tagText);
  return foundOption ? foundOption.icon : undefined;
}

const multiTags = (function () {

  const StyledTag = styled(Tag)<{ $style: any, $bordered: boolean, $customStyle: any }>`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    background: ${(props) => props.$customStyle?.backgroundColor || props.$style?.background};
    color: ${(props) => props.$customStyle?.color || props.$style?.text};
    border-radius: ${(props) => props.$customStyle?.borderRadius || props.$style?.borderRadius};
    border: ${(props) => {
      if (props.$customStyle?.border) return props.$customStyle.border;
      return props.$bordered ? `${props.$style?.borderStyle} ${props.$style?.borderWidth} ${props.$style?.border}` : 'none';
    }};
    padding: ${(props) => props.$customStyle?.padding || props.$style?.padding};
    margin: ${(props) => props.$customStyle?.margin || props.$style?.margin};
    font-size: ${(props) => props.$style?.textSize};
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
    borderless: BoolCodeControl,
    enableIndividualStyling: BoolCodeControl,
  };

  return new UICompBuilder(childrenMap, (props) => {
    const handleClickEvent = useCompClickEventHandler({onEvent: props.onEvent});

    return (
      <StyledTagContainer>
        {props.options.map((tag, index) => {

          // Use individual styling only if enableIndividualStyling is true
          const tagColor = props.enableIndividualStyling ? getTagColor(tag.label, props.options) : undefined;
          const tagIcon = props.enableIndividualStyling ? getTagIcon(tag.label, props.options) : tag.icon;
          const tagStyle = props.enableIndividualStyling ? getTagStyle(tag.label, props.options, props.style) : {};
          
          return (
            <StyledTag 
              key={`tag-${index}`}
              $style={props.style}
              $bordered={!props.borderless}
              $customStyle={tagStyle}
              icon={tagIcon}
              color={tagColor}
              onClick={() => handleClickEvent()}
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
                {children.enableIndividualStyling.propertyView({ 
                  label: trans("style.individualStyling"),
                  tooltip: trans("style.individualStylingTooltip")
                })}
                {children.borderless.propertyView({ label: trans("style.borderless") })}
                {children.style.getPropertyView()}
              </Section>
            )}
        </>
      )
    })
    .build();
})()

export const MultiTagsComp = withExposingConfigs(multiTags, [new NameConfig("options", "")]);

