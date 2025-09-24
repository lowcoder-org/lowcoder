import styled from "styled-components";
import React, { useContext, useState, useRef, useEffect } from "react";
import { Tag, App } from "antd";
import { EditorContext } from "comps/editorState";
import { PresetStatusColorTypes } from "antd/es/_util/colors";
import { hashToNum } from "util/stringUtils";
import { TagsCompOptionsControl } from "comps/controls/optionsControl";
import { useCompClickEventHandler } from "@lowcoder-ee/comps/utils/useCompClickEventHandler";
import { styleControl } from "@lowcoder-ee/comps/controls/styleControl";
import { ButtonEventHandlerControl } from "@lowcoder-ee/comps/controls/eventHandlerControl";
import { InputLikeStyle } from "@lowcoder-ee/comps/controls/styleControlConstants";
import { BoolCodeControl } from "@lowcoder-ee/comps/controls/codeControl";
import { BoolControl } from "comps/controls/boolControl";
import { UICompBuilder } from "@lowcoder-ee/comps/generators/uiCompBuilder";
import { Section, sectionNames } from "lowcoder-design";
import { NameConfig } from "@lowcoder-ee/comps/generators/withExposing";
import { hiddenPropertyView, showDataLoadingIndicatorsPropertyView } from "@lowcoder-ee/comps/utils/propertyUtils";
import { withExposingConfigs, depsConfig } from "@lowcoder-ee/comps/generators/withExposing";
import { stateComp } from "@lowcoder-ee/comps/generators";
import { changeChildAction } from "lowcoder-core";
import { JSONValue } from "util/jsonTypes";
import { JSONObject } from "util/jsonTypes";

type TagOption = {
  label: string;
  colorType?: string; // "default" | "preset" | "custom" from control
  presetColor?: any;
  color?: string;
  textColor?: string;
  border?: string;
  borderWidth?: string;
  borderStyle?: string;
  radius?: string;
  margin?: string;
  padding?: string;
  width?: string;
  icon?: any;
};

const colors = PresetStatusColorTypes;

/** ---------- Styling Helpers ---------- */
function getTagColor(tagText: string, tagOptions: TagOption[]) {
  const foundOption = tagOptions.find((option) => option.label === tagText);
  if (foundOption) {
    if (foundOption.colorType === "default") return undefined;
    if (foundOption.colorType === "preset") return foundOption.presetColor;
    if (foundOption.colorType === "custom") return undefined;
    return foundOption.color;
  }
  const index = Math.abs(hashToNum(tagText)) % colors.length;
  return colors[index];
}

const getTagStyle = (tagText: string, tagOptions: TagOption[], baseStyle: any = {}) => {
  const foundOption = tagOptions.find((option) => option.label === tagText);

  const applyBorderFromBase = (style: any) => {
    if (baseStyle.borderWidth && baseStyle.border && baseStyle.borderStyle) {
      style.border = `${baseStyle.borderWidth} ${baseStyle.borderStyle} ${baseStyle.border}`;
    }
  };

  if (foundOption) {
    if (foundOption.colorType === "default") {
      const style: any = { ...baseStyle };
      applyBorderFromBase(style);
      return style;
    }

    const style: any = { ...baseStyle };

    if (foundOption.colorType === "custom") {
      style.backgroundColor = foundOption.color;
      style.color = foundOption.textColor;
    }

    const borderStyle = foundOption.borderStyle || "none";
    const borderWidth = foundOption.borderWidth || "0px";
    const borderColor = foundOption.border || "none";
    style.border = borderStyle !== "none" ? `${borderWidth} ${borderStyle} ${borderColor}` : "none";

    if (foundOption.radius) style.borderRadius = foundOption.radius;
    if (foundOption.margin) style.margin = foundOption.margin;
    if (foundOption.padding) style.padding = foundOption.padding;
    if (foundOption.width) style.width = foundOption.width;

    return style;
  }

  const style: any = { ...baseStyle };
  applyBorderFromBase(style);
  return style;
};

/** ---------- Component ---------- */
const multiTags = (function () {
  const StyledWrap = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 6px;
    outline: none;
    cursor: text; /* indicates you can type here */
  `;

  const StyledTag = styled(Tag)<{ $style: any; $customStyle: any }>`
    display: inline-flex;
    align-items: center;
    min-width: fit-content;
    
    background: ${(props) => props.$customStyle?.backgroundColor || props.$style?.background};
    color: ${(props) => props.$customStyle?.color || props.$style?.text};
    border-radius: ${(props) => props.$customStyle?.borderRadius || props.$style?.borderRadius};
    border: ${(props) => props.$customStyle?.border || props.$style?.border || "1px solid #d9d9d9"};
    padding: ${(props) => props.$customStyle?.padding || props.$style?.padding};
    margin: ${(props) => props.$customStyle?.margin || props.$style?.margin};
    font-size: ${(props) => props.$style?.textSize || "12px"};
    font-weight: ${(props) => props.$style?.fontWeight};
    user-select: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `;

  const DraftTag = styled(StyledTag)`
    border-style: dashed !important;
    opacity: 0.9;
  `;

  const EditInput = styled.input`
    border: none;
    outline: none;
    background: transparent;
    font-size: inherit;
    font-weight: inherit;
    color: inherit;
  `;

  const TagIcon = styled.span`
    display: inline-flex;
    align-items: center;
    margin-right: 4px;
    
    &.icon-right {
      margin-right: 0;
      margin-left: 4px;
    }
  `;

  const TagContent = styled.span`
    display: inline-flex;
    align-items: center;
  `;



  const childrenMap = {
    options: TagsCompOptionsControl, // initial tags (PropertyView)
    style: styleControl(InputLikeStyle, "style"),
    onEvent: ButtonEventHandlerControl,
    editable: BoolControl,               // editable switch field
    preventDuplicates: BoolCodeControl,  // runtime de-dupe
    allowEmptyEdits: BoolCodeControl,    // allow blank labels on edit
    maxTags: BoolCodeControl,            // truthy => 50 (or provide number if your control supports)
    selectedTagIndex: stateComp<number>(-1), // tracks which tag was clicked (-1 = none)
    runtimeOptions: stateComp<JSONValue>([]), // runtime tags array for CRUD and saving
  };

  const toMax = (val: any): number | undefined => {
    if (val === false || val === undefined || val === null) return undefined;
    if (typeof val === "number" && !Number.isNaN(val) && val > 0) return val;
    if (val === true) return 50;
    return undefined;
  };

  return new UICompBuilder(childrenMap, (props, dispatch) => {
    const { message } = App.useApp?.() || { message: { warning: () => {} } as any };
    const handleClickEvent = useCompClickEventHandler({ onEvent: props.onEvent });

    // State
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editValue, setEditValue] = useState<string>("");
    const [draft, setDraft] = useState<string>(""); // typing buffer for creating a new tag
    const containerRef = useRef<HTMLDivElement>(null);

    const preventDuplicates = !!props.preventDuplicates;
    const allowEmptyEdits = !!props.allowEmptyEdits;
    const maxTags = toMax(props.maxTags);
    
    
    const displayOptions = (props as any).runtimeOptions?.length && props.editable
      ? ((props as any).runtimeOptions as TagOption[])
      : props.options;

      useEffect(() => {
        // every time the editable prop changes, we need to update the runtimeOptions
        dispatch(changeChildAction("runtimeOptions", [...props.options] as TagOption[], false));
      }, [props.editable]);

    // Events helper
    const fireEvent = (type: "add" | "edit" | "delete" | "change" | "click", payload: any) => {
      try { if (props.onEvent) (props.onEvent as any)(type, payload); } catch {}
      try { if (type !== "click" && props.onEvent) (props.onEvent as any)("change", { value: payload?.value, meta: payload }); } catch {}
    };

    // Utils
    const normalize = (s: string) => s.trim();
    const exists = (label: string, omitIndex?: number) => {
      const L = normalize(label);
      return displayOptions.some((t, i) => (omitIndex !== undefined ? i !== omitIndex : true) && normalize(t.label) === L);
    };

    // CRUD
    const addTag = (raw: string) => {
      const label = normalize(raw);
      if (!label) return;
      if (maxTags && displayOptions.length >= maxTags) {
        message?.warning?.(`Maximum ${maxTags} tags allowed.`);
        return;
      }
      if (preventDuplicates && exists(label)) {
        message?.warning?.("Duplicate tag.");
        return;
      }
      const newTag: TagOption = {
        label,
        colorType: "default",
        presetColor: "blue",
        color: "#1890ff",
        textColor: "#ffffff",
        border: "",
        borderWidth: "",
        borderStyle: "solid",
        radius: "",
        margin: "",
        padding: "",
        width: "",
      };
      const next = [...displayOptions, newTag];
      dispatch(changeChildAction("runtimeOptions", next, false));
      setDraft("");
      fireEvent("add", { label, value: next });
    };

    const startEdit = (index: number) => {
      setEditingIndex(index);
      setEditValue(displayOptions[index]?.label || "");
    };

    const confirmEdit = (index: number) => {
      const val = normalize(editValue);
      if (!val && !allowEmptyEdits) {
        cancelEdit();
        return;
      }
      if (preventDuplicates && exists(val, index)) {
        message?.warning?.("Duplicate tag.");
        return;
      }
      const prev = displayOptions[index]?.label ?? "";
      const next = displayOptions.map((t, i) => (i === index ? { ...t, label: val } : t));
      dispatch(changeChildAction("runtimeOptions", next, false));
      setEditingIndex(null);
      setEditValue("");
      fireEvent("edit", { from: prev, to: val, index, value: next });
    };

    const cancelEdit = () => {
      setEditingIndex(null);
      setEditValue("");
    };

    const deleteTag = (index: number) => {
      const removed = displayOptions[index]?.label;
      const next = displayOptions.filter((_, i) => i !== index);
      dispatch(changeChildAction("runtimeOptions", next, false));
      fireEvent("delete", { removed, index, value: next });
    };

    // Container keyboard handling for *adding* without inputs
    const onContainerKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
      if (!props.editable) return;

      const { key, ctrlKey, metaKey, altKey } = e;

      // Commit draft
      if (key === "Enter") {
        if (draft) {
          e.preventDefault();
          addTag(draft);
        }
        return;
      }

      // Cancel draft
      if (key === "Escape") {
        if (draft) {
          e.preventDefault();
          setDraft("");
        }
        return;
      }

      // Handle typing into draft (ignore modifiers)
      if (!ctrlKey && !metaKey && !altKey) {
        if (key.length === 1) {
          setDraft((d) => d + key);
          e.preventDefault();
        } else if (key === "Backspace") {
          if (draft) {
            setDraft((d) => d.slice(0, -1));
            e.preventDefault();
          }
        } else if (key === "Spacebar" || key === " ") {
          setDraft((d) => d + " ");
          e.preventDefault();
        }
      }
    };

    // Tag click passthrough
    const onTagClick = (tag: TagOption, idx: number) => {
      // Update selected tag index state
      dispatch(changeChildAction("selectedTagIndex", idx, false));
      
      // Fire events
      fireEvent("click", { tag, index: idx, value: displayOptions });
      handleClickEvent?.();
    };

    return (
      <StyledWrap
        ref={containerRef}
        tabIndex={0}
        onKeyDown={onContainerKeyDown}
        onMouseDown={() => containerRef.current?.focus()}
      >
        {displayOptions.map((tag, index) => {
          const tagColor = getTagColor(tag.label, displayOptions);
          const tagStyle = getTagStyle(tag.label, displayOptions, props.style);
          const isEditing = props.editable && editingIndex === index;

          return (
            <StyledTag
              key={`tag-${index}`}
              $style={props.style}
              $customStyle={tagStyle}
              icon={tag.icon}
              color={tagColor}
              closable={props.editable}
              onClose={(e) => { e.preventDefault(); deleteTag(index); }}
              onDoubleClick={() => startEdit(index)}      // double-click to edit
              onClick={() => onTagClick(tag, index)}      // normal click event
            >
              {isEditing ? (
                <EditInput
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => confirmEdit(index)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); confirmEdit(index); }
                    if (e.key === "Escape") { e.preventDefault(); cancelEdit(); }
                    e.stopPropagation();
                  }}
                />
              ) : (
                tag.label
              )}
            </StyledTag>
          );
        })}

        {/* Draft chip appears only while typing; press Enter to commit, Esc to cancel */}
        {props.editable && draft && (
          <DraftTag $style={props.style} $customStyle={{}} color="default">
            {draft}
          </DraftTag>
        )}
      </StyledWrap>
    );
  })
    .setPropertyViewFn((children: any) => {
      return (
        <>
          <Section name={sectionNames.basic}>
            {children.options.propertyView({ label: "Initial Tags (PropertyView)" })}
            {children.editable.propertyView({ label: "Editable" })}
            {children.preventDuplicates.propertyView({ label: "Prevent Duplicates (Runtime)" })}
            {children.allowEmptyEdits.propertyView({ label: "Allow Empty Edit (Runtime)" })}
            {children.maxTags.propertyView({ label: "Set Max Tags (Runtime) — true=50" })}
          </Section>

          {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
            <Section name={sectionNames.interaction}>
              {children.onEvent.getPropertyView({
                // Events:
                // "change" (payload.value = TagOption[]),
                // "add"    (label, value),
                // "edit"   (from, to, index, value),
                // "delete" (removed, index, value),
                // "click"  (tag, index, value)
              })}
              {hiddenPropertyView(children)}
              {showDataLoadingIndicatorsPropertyView(children)}
            </Section>
          )}

          {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
            <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
          )}
        </>
      );
    })
    .build();
})();

export const MultiTagsComp = withExposingConfigs(
  multiTags,
  [
    depsConfig({
      name: "selectedTag", 
      desc: "Currently selected tag data",
      depKeys: ["selectedTagIndex", "runtimeOptions"],
      func: (input) => {
        const index = input.selectedTagIndex;
        const options = Array.isArray(input.runtimeOptions) ? (input.runtimeOptions as any[]) : [];
        if (index >= 0 && index < options.length) {
          return options[index];
        }
        return null;
      }
    }),
    depsConfig({
      name: "selectedTagIndex", 
      desc: "Index of currently selected tag (-1 if none)",
      depKeys: ["selectedTagIndex"],
      func: (input) => input.selectedTagIndex
    }),
    depsConfig({
      name: "selectedTagLabel",
      desc: "Label of currently selected tag",
      depKeys: ["selectedTagIndex", "runtimeOptions"],
      func: (input) => {
        const index = input.selectedTagIndex;
        const options = Array.isArray(input.runtimeOptions) ? (input.runtimeOptions as any[]) : [];
        if (index >= 0 && index < options.length) {
          return options[index]?.label || "";
        }
        return "";
      }
    }),
    depsConfig({
      name: "options",
      desc: "Current tags array (updates based on editable prop)",
      depKeys: ["options", "runtimeOptions", "editable"],
      func: (input) => {
        const { editable, options, runtimeOptions } = input;

        // If not editable, always use the original props.options
        if (!editable) {
          return Array.isArray(options) ? options : [];
        }

        // If editable, use runtimeOptions (user modifications)
        return Array.isArray(runtimeOptions) ? runtimeOptions : [];
      }
    })
  ]
);
