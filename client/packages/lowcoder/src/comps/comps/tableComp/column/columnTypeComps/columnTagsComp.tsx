import { default as Tag } from "antd/es/tag";
import { PresetStatusColorTypes } from "antd/es/_util/colors";
import { TagsContext } from "components/table/EditableCell";
import {
  ColumnTypeCompBuilder,
  ColumnTypeViewFn,
} from "comps/comps/tableComp/column/columnTypeCompBuilder";
import { ColumnValueTooltip } from "comps/comps/tableComp/column/simpleColumnTypeComps";
import { codeControl } from "comps/controls/codeControl";
import { trans } from "i18n";
import styled from "styled-components";
import _ from "lodash";
import React, { ReactNode, useContext, useState, useRef, useEffect, useCallback, useMemo } from "react";
import { toJson } from "really-relaxed-json";
import { hashToNum } from "util/stringUtils";
import { CustomSelect, PackUpIcon } from "lowcoder-design";
import { ScrollBar } from "lowcoder-design";
import { ColoredTagOptionControl } from "comps/controls/optionsControl";
import { clickEvent, eventHandlerControl } from "comps/controls/eventHandlerControl";

const colors = PresetStatusColorTypes;

const isStringArray = (value: any) => {
  return (
    _.isArray(value) &&
    value.every((v) => {
      const type = typeof v;
      return type === "string" || type === "number" || type === "boolean";
    })
  );
};

// accept string, number, boolean and array input
const TagsControl = codeControl<Array<string> | string>(
  (value) => {
    if (isStringArray(value)) {
      return value;
    }
    const valueType = typeof value;
    if (valueType === "string") {
      try {
        const result = JSON.parse(toJson(value));
        if (isStringArray(result)) {
          return result;
        }
        return value;
      } catch (e) {
        return value;
      }
    } else if (valueType === "number" || valueType === "boolean") {
      return value;
    }
    throw new TypeError(
      `Type "Array<string> | string" is required, but find value: ${JSON.stringify(value)}`
    );
  },
  { expectedType: "string | Array<string>", codeType: "JSON" }
);

function getTagColor(tagText : any, tagOptions: any[]) {
  const foundOption = tagOptions.find((option: { label: any; }) => option.label === tagText);
  if (foundOption) {
    if (foundOption.colorType === "preset") {
      return foundOption.presetColor;
    } else if (foundOption.colorType === "custom") {
      return undefined; // For custom colors, we'll use style instead
    }
    // Backward compatibility - if no colorType specified, assume it's the old color field
    return foundOption.color;
  }
  // Default fallback
  const index = Math.abs(hashToNum(tagText)) % colors.length;
  return colors[index];
}

function getTagStyle(tagText: any, tagOptions: any[]) {
  const foundOption = tagOptions.find((option: { label: any; }) => option.label === tagText);
  if (foundOption) {
    const style: any = {};
    
    // Handle color styling
    if (foundOption.colorType === "custom") {
      style.backgroundColor = foundOption.color;
      style.color = foundOption.textColor;
      style.border = `1px solid ${foundOption.color}`;
    }
    
    // Add border styling if specified
    if (foundOption.border) {
      style.borderColor = foundOption.border;
      if (!foundOption.colorType || foundOption.colorType !== "custom") {
        style.border = `1px solid ${foundOption.border}`;
      }
    }
    
    // Add border radius if specified
    if (foundOption.radius) {
      style.borderRadius = foundOption.radius;
    }
    
    // Add margin if specified
    if (foundOption.margin) {
      style.margin = foundOption.margin;
    }
    
    // Add padding if specified
    if (foundOption.padding) {
      style.padding = foundOption.padding;
    }
    
    return style;
  }
  return {};
}

function getTagIcon(tagText: any, tagOptions: any[]) {
  const foundOption = tagOptions.find(option => option.label === tagText);
  return foundOption ? foundOption.icon : undefined;
}

const childrenMap = {
  text: TagsControl,
  tagColors: ColoredTagOptionControl,
  onEvent: eventHandlerControl([clickEvent]),
};

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, string | string[], string | string[]> = (
  props
) => props.text;

type TagEditPropsType = {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  onChangeEnd: () => void;
  tagOptions: any[];
};

export const Wrapper = styled.div`
  display: inline-flex;
  align-items: center;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  background: transparent !important;
  padding: 8px;

  > div {
    width: 100%;
    height: 100%;
  }

  .ant-select {
    height: 100%;
    .ant-select-selector {
      padding: 0 7px;
      height: 100%;
      overflow: hidden;
      .ant-select-selection-item {
        display: inline-flex;
        align-items: center;
        padding-right: 24px;
      }
    }
    .ant-select-arrow {
      height: calc(100% - 3px);
      width: fit-content;
      top: 1.5px;
      margin-top: 0;
      background-color: white;
      right: 1.5px;
      border-right: 1px solid #d7d9e0;
      cursor: pointer;
      pointer-events: auto;
      svg {
        min-width: 18px;
        min-height: 18px;
      }
      &:hover svg path {
        fill: #315efb;
      }
    }
    .ant-select-selector .ant-select-selection-search {
      left: 7px;
      input {
        height: 100%;
      }
    }
    &.ant-select-open {
      .ant-select-arrow {
        border-right: none;
        border-left: 1px solid #d7d9e0;
        svg g path {
          fill: #315efb;
        }
      }
      .ant-select-selection-item {
        opacity: 0.4;
      }
    }
  }
  .ant-tag {
    margin-left: 5px;
  }
  .ant-tag svg {
    margin-right: 4px;
  }
`;

export const DropdownStyled = styled.div`
  .ant-select-item {
    padding: 3px 8px;
    margin: 0 0 2px 8px;
    border-radius: 4px;

    &.ant-select-item-option-active {
      background-color: #f2f7fc;
    }
  }
  .ant-select-item-option-content {
    display: flex;
    align-items: center;
  }
  .ant-tag {
    margin-right: 0;
  }
  .ant-tag svg {
    margin-right: 4px;
  }
`;

export const TagStyled = styled(Tag)`
  margin-right: 8px;
  cursor: pointer;
  svg {
    margin-right: 4px;
  }
`;

const TagEdit = React.memo((props: TagEditPropsType) => {
  const defaultTags = useContext(TagsContext);
  const [tags, setTags] = useState(() => {
    const result: string[] = [];
    defaultTags.forEach((item) => {
      if (item.split(",")[1]) {
        item.split(",").forEach((tag) => result.push(tag));
      }
      result.push(item);
    });
    return result;
  });
  const [open, setOpen] = useState(false);
  const mountedRef = useRef(true);

  // Memoize tag options to prevent unnecessary re-renders
  const memoizedTagOptions = useMemo(() => props.tagOptions || [], [props.tagOptions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      setTags([]);
      setOpen(false);
    };
  }, []);

  // Update tags when defaultTags changes
  useEffect(() => {
    if (!mountedRef.current) return;
    
    const result: string[] = [];
    defaultTags.forEach((item) => {
      if (item.split(",")[1]) {
        item.split(",").forEach((tag) => result.push(tag));
      }
      result.push(item);
    });
    setTags(result);
  }, [defaultTags]);

  const handleSearch = useCallback((value: string) => {
    if (!mountedRef.current) return;
    
    if (defaultTags.findIndex((item) => item.includes(value)) < 0) {
      setTags([...defaultTags, value]);
    } else {
      setTags(defaultTags);
    }
    props.onChange(value);
  }, [defaultTags, props.onChange]);

  const handleChange = useCallback((value: string | string[]) => {
    if (!mountedRef.current) return;
    props.onChange(value);
    setOpen(false);
  }, [props.onChange]);

  const handleBlur = useCallback(() => {
    if (!mountedRef.current) return;
    props.onChangeEnd();
    setOpen(false);
  }, [props.onChangeEnd]);

  const handleTagClick = useCallback((tagText: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const foundOption = memoizedTagOptions.find(option => option.label === tagText);
    if (foundOption && foundOption.onEvent) {
      foundOption.onEvent("click");
    }
  }, [memoizedTagOptions]);

  return (
    <Wrapper>
      <CustomSelect
        autoFocus
        defaultOpen
        variant="borderless"
        optionLabelProp="children"
        showSearch
        defaultValue={props.value}
        style={{ width: "100%" }}
        open={open}
        allowClear={true}
        suffixIcon={<PackUpIcon />}
        onSearch={handleSearch}
        onChange={handleChange}
        popupRender={(originNode: ReactNode) => (
          <DropdownStyled>
            <ScrollBar style={{ maxHeight: "256px" }}>{originNode}</ScrollBar>
          </DropdownStyled>
        )}
        styles={{ popup: { root: { marginTop: "7px", padding: "8px 0 6px 0" }}}}
        onFocus={() => {
          if (mountedRef.current) {
            setOpen(true);
          }
        }}
        onBlur={handleBlur}
        onClick={() => {
          if (mountedRef.current) {
            setOpen(!open);
          }
        }}
      >
        {tags.map((value, index) => (
          <CustomSelect.Option value={value} key={index}>
            {value.split(",")[1] ? (
              value.split(",").map((item, i) => {
                const tagColor = getTagColor(item, memoizedTagOptions);
                const tagIcon = getTagIcon(item, memoizedTagOptions);
                const tagStyle = getTagStyle(item, memoizedTagOptions);
                
                return (
                  <Tag 
                    color={tagColor}
                    icon={tagIcon} 
                    key={i} 
                    style={{ 
                      marginRight: tagStyle.margin ? undefined : "8px", 
                      cursor: "pointer",
                      ...tagStyle 
                    }}
                    onClick={(e) => handleTagClick(item, e)}
                  >
                    {item}
                  </Tag>
                );
              })
            ) : (
              <Tag 
                color={getTagColor(value, memoizedTagOptions)} 
                icon={getTagIcon(value, memoizedTagOptions)} 
                key={index}
                style={{
                  cursor: "pointer",
                  ...getTagStyle(value, memoizedTagOptions)
                }}
                onClick={(e) => handleTagClick(value, e)}
              >
                {value}
              </Tag>
            )}
          </CustomSelect.Option>
        ))}
      </CustomSelect>
    </Wrapper>
  );
});

TagEdit.displayName = 'TagEdit';

export const ColumnTagsComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      const tagOptions = props.tagColors;
      let value = props.changeValue ?? getBaseValue(props, dispatch);
      value = typeof value === "string" && value.split(",")[1] ? value.split(",") : value;
      const tags = _.isArray(value) ? value : (value.length ? [value] : []);
      
      const handleTagClick = (tagText: string) => {
        const foundOption = tagOptions.find(option => option.label === tagText);
        if (foundOption && foundOption.onEvent) {
          foundOption.onEvent("click");
        }
        // Also trigger the main component's event handler
        if (props.onEvent) {
          props.onEvent("click");
        }
      };
      
      const view = tags.map((tag, index) => {
        // The actual eval value is of type number or boolean
        const tagText = String(tag);
        const tagColor = getTagColor(tagText, tagOptions);
        const tagIcon = getTagIcon(tagText, tagOptions);
        const tagStyle = getTagStyle(tagText, tagOptions);
        
        return (
          <div key={`${tag.split(' ').join('_')}-${index}`}>
            <TagStyled 
              color={tagColor} 
              icon={tagIcon} 
              key={index}
              style={tagStyle}
              onClick={() => handleTagClick(tagText)}
            >
              {tagText}
            </TagStyled>
          </div>
        );
      });
      return view;
    },
    (nodeValue) => {
      const text = nodeValue.text.value;
      return _.isArray(text) ? text.join(",") : text;
    },
    getBaseValue
  )
    .setEditViewFn((props) => {
      const text = props.value;
      const value = _.isArray(text) ? text.join(",") : text;
      return <TagEdit 
        value={value} 
        onChange={props.onChange} 
        onChangeEnd={props.onChangeEnd} 
        tagOptions={props.otherProps?.tagColors || []} 
      />;
    })
    .setPropertyViewFn((children) => (
      <>
        {children.text.propertyView({
          label: trans("table.columnValue"),
          tooltip: ColumnValueTooltip,
        })}
        {children.tagColors.propertyView({
          title: "Tag Options",
        })}
        {children.onEvent.propertyView()}
      </>
    ))
    .build();
})();
