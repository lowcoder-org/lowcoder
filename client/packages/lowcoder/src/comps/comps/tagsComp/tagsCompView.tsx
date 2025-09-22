import styled from "styled-components";
import React, { useContext, useMemo, useRef, useState } from "react";
import { Tag, Input, Button, Space, Tooltip, Typography, App } from "antd";
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
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";

const { Text } = Typography;

type TagOption = {
  label: string;
  colorType?: "default" | "preset" | "custom";
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
  icon?: React.ReactNode | string;
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
  const StyledTag = styled(Tag)<{ $style: any; $customStyle: any }>`
    display: flex;
    justify-content: center;
    align-items: center;
    min-width: fit-content;
    width: ${(props) => props.$customStyle?.width || "auto"};
    max-width: 100%;
    background: ${(props) => props.$customStyle?.backgroundColor || props.$style?.background};
    color: ${(props) => props.$customStyle?.color || props.$style?.text};
    border-radius: ${(props) => props.$customStyle?.borderRadius || props.$style?.borderRadius};
    border: ${(props) => props.$customStyle?.border || props.$style?.border || "1px solid #d9d9d9"};
    padding: ${(props) => props.$customStyle?.padding || props.$style?.padding};
    margin: ${(props) => props.$customStyle?.margin || props.$style?.margin};
    font-size: ${(props) => props.$style?.textSize || "12px"};
    font-weight: ${(props) => props.$style?.fontWeight};
    cursor: pointer;
    user-select: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `;

  const StyledTagWrap = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 6px;
  `;

  const TopBar = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 6px 0;
  `;

  const childrenMap = {
    options: TagsCompOptionsControl, // initial tags (PropertyView)
    style: styleControl(InputLikeStyle, "style"),
    onEvent: ButtonEventHandlerControl,
    allowEdit: BoolCodeControl, // enable runtime CRUD controls
    // extra toggles to fine-tune runtime behavior
    preventDuplicates: BoolCodeControl,
    allowEmptyEdits: BoolCodeControl,
    // local constraints
    maxTags: BoolCodeControl, // you can wire a numeric control if available in your control set; BoolCodeControl is used to keep code simple here (treat truthy as number below)
  };

  // Helper to normalize an optional "maxTags" BoolCodeControl into a number (false => unlimited)
  const toMax = (val: any): number | undefined => {
    if (val === false || val === undefined || val === null) return undefined;
    if (typeof val === "number" && !Number.isNaN(val) && val > 0) return val;
    // if BoolCodeControl returns true, you can set a sensible default cap
    if (val === true) return 50;
    return undefined;
  };

  return new UICompBuilder(childrenMap, (props) => {
    const { message } = App.useApp?.() || { message: { success: () => {}, error: () => {}, warning: () => {} } as any };

    // This hook returns a callable we can also use to fire *custom* events with payloads.
    const handleClickEvent = useCompClickEventHandler({ onEvent: props.onEvent });

    // ---- Local Runtime State ----
    const [runtimeOptions, setRuntimeOptions] = useState<TagOption[]>(() => [...props.options]);
    const [dirty, setDirty] = useState(false);

    // inline editing state
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingValue, setEditingValue] = useState<string>("");

    // adding state
    const [isAdding, setIsAdding] = useState(false);
    const [addingValue, setAddingValue] = useState("");

    const preventDuplicates = !!props.preventDuplicates;
    const allowEmptyEdits = !!props.allowEmptyEdits;
    const maxTags = toMax(props.maxTags);


    // what we display: if allowEdit => runtimeOptions, else static props.options
    const displayOptions = props.allowEdit ? runtimeOptions : props.options;

    // ---------- Event firing helper (so platform users can persist if they want) ----------
    // We’ll try to fire both a specific event (add/edit/delete) and a generic "change".
    const fireEvent = (type: "add" | "edit" | "delete" | "change" | "click", payload: any) => {
      try {
        // specific event
        if (props.onEvent) {
          (props.onEvent as any)(type, payload);
        }
      } catch {}
      try {
        // generic change event (except when it's a click)
        if (type !== "click" && props.onEvent) {
          (props.onEvent as any)("change", { value: payload?.value, meta: payload });
        }
      } catch {}
    };

    // ---------- Validation ----------
    const normalize = (s: string) => s.trim();
    const exists = (label: string, omitIndex?: number) => {
      const L = normalize(label);
      return runtimeOptions.some((t, i) => (omitIndex !== undefined ? i !== omitIndex : true) && normalize(t.label) === L);
    };

    // ---------- CRUD Handlers ----------
    const addTag = (raw: string) => {
      const label = normalize(raw);
      if (!label) {
        message?.warning?.("Please enter a tag name.");
        return;
      }
      if (maxTags && runtimeOptions.length >= maxTags) {
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
        icon: "/icon:solid/tag",
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
      const next = [...runtimeOptions, newTag];
      setRuntimeOptions(next);
      setAddingValue("");
      setIsAdding(false);
      setDirty(true);
      fireEvent("add", { label, value: next });
    };

    const startEdit = (index: number, current: string) => {
      setEditingIndex(index);
      setEditingValue(current);
    };

    const confirmEdit = () => {
      if (editingIndex === null) return;
      const val = normalize(editingValue);
      if (!val && !allowEmptyEdits) {
        // cancel instead of clearing to empty
        setEditingIndex(null);
        setEditingValue("");
        return;
      }
      if (preventDuplicates && exists(val, editingIndex)) {
        message?.warning?.("Duplicate tag.");
        return;
      }
      const prev = runtimeOptions[editingIndex]?.label ?? "";
      const next = [...runtimeOptions];
      next[editingIndex] = { ...next[editingIndex], label: val };
      setRuntimeOptions(next);
      setEditingIndex(null);
      setEditingValue("");
      setDirty(true);
      fireEvent("edit", { from: prev, to: val, index: editingIndex, value: next });
    };

    const cancelEdit = () => {
      setEditingIndex(null);
      setEditingValue("");
    };

    const deleteTag = (index: number) => {
      const removed = runtimeOptions[index]?.label;
      const next = runtimeOptions.filter((_, i) => i !== index);
      setRuntimeOptions(next);
      setDirty(true);
      fireEvent("delete", { removed, index, value: next });
    };



    // When users click a tag (not the edit/delete button), still bubble a "click" event with payload
    const onTagClick = (tag: TagOption, idx: number) => {
      fireEvent("click", { tag, index: idx, value: displayOptions });
      // also preserve your previous click wiring (if someone configured onClick in property view)
      handleClickEvent?.({ tag, index: idx, value: displayOptions });
    };

    return (
      <>
        {props.allowEdit && (
          <TopBar>
            {!isAdding ? (
              <Space size={6}>
                <Tooltip title="Add new tag">
                  <Button
                    type="dashed"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => setIsAdding(true)}
                    style={{ padding: "2px", minWidth: "auto" }}
                  >
                    Add Tag
                  </Button>
                </Tooltip>
              </Space>
            ) : (
              <Space size={6}>
                <Input
                  size="small"
                  placeholder="New tag"
                  value={addingValue}
                  onChange={(e) => setAddingValue(e.target.value)}
                  onPressEnter={() => addTag(addingValue)}
                  autoFocus
                  style={{ minWidth: 120 }}
                />
                <Button
                  type="primary"
                  size="small"
                  onClick={() => addTag(addingValue)}
                  disabled={!normalize(addingValue)}
                >
                  Add
                </Button>
                <Button size="small" onClick={() => { setIsAdding(false); setAddingValue(""); }}>
                  Cancel
                </Button>
                {maxTags && (
                  <Text type="secondary" style={{ marginLeft: 6 }}>
                    {runtimeOptions.length}/{maxTags}
                  </Text>
                )}
              </Space>
            )}
          </TopBar>
        )}

        <StyledTagWrap>
          {displayOptions.map((tag, index) => {
            const tagColor = getTagColor(tag.label, displayOptions);
            const tagStyle = getTagStyle(tag.label, displayOptions, props.style);
            const isEditing = props.allowEdit && editingIndex === index;

            return (
              <Space key={`tag-${index}`} size={4} align="center">
                {isEditing ? (
                  <Input
                    size="small"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onPressEnter={confirmEdit}
                    onBlur={confirmEdit}
                    style={{ minWidth: 80 }}
                    autoFocus
                  />
                ) : (
                  <StyledTag
                    $style={props.style}
                    $customStyle={tagStyle}
                    icon={tag.icon as any}
                    color={tagColor}
                    onClick={() => onTagClick(tag, index)}
                  >
                    {tag.label}
                  </StyledTag>
                )}

                {props.allowEdit && (
                  <Space size={2}>
                    {!isEditing && (
                      <Tooltip title="Edit tag">
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => startEdit(index, tag.label)}
                          style={{ padding: "2px", minWidth: "auto" }}
                        />
                      </Tooltip>
                    )}
                    <Tooltip title="Delete tag">
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => deleteTag(index)}
                        style={{ padding: "2px", minWidth: "auto" }}
                        danger
                      />
                    </Tooltip>
                  </Space>
                )}
              </Space>
            );
          })}
        </StyledTagWrap>
      </>
    );
  })
    .setPropertyViewFn((children: any) => {
      return (
        <>
          <Section name={sectionNames.basic}>
            {children.options.propertyView({ label: "Initial Tags (PropertyView)" })}
            {children.allowEdit.propertyView({ label: "Allow Runtime Editing" })}
            {children.preventDuplicates.propertyView({ label: "Prevent Duplicates (Runtime)" })}
            {children.allowEmptyEdits.propertyView({ label: "Allow Empty Edit (Runtime)" })}
            {children.maxTags.propertyView({ label: "Set Max Tags (Runtime) — true=50" })}
          </Section>

          {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
            <Section name={sectionNames.interaction}>
              {/* Expose onEvent so users can persist however they want */}
              {children.onEvent.getPropertyView({
                // Documented event names that we fire:
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
  // Expose both the design-time options (PropertyView) and the live value (runtime)
  [
    new NameConfig("options", ""), // original
  ]
);
