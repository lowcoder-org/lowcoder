import type { EditorState, EditorView } from "base/codeEditor/codeMirror";
import {
  iconRegexp,
  iconWidgetClass,
} from "base/codeEditor/extensions/iconExtension";
import { i18nObjs, trans } from "i18n";
import { Coolshape } from "coolshapes-react";
import {
  AbstractComp,
  CompAction,
  CompActionTypes,
  CompParams,
  customAction,
  DispatchType,
  Node,
  ValueAndMsg,
} from "lowcoder-core";
import {
  BlockGrayLabel,
  controlItem,
  ControlPropertyViewWrapper,
  DeleteInputIcon,
  iconPrefix,
  ShapeSelect,
  IconSelectBase,
  removeQuote,
  SwitchJsIcon,
  SwitchWrapper,
  TacoButton,
  wrapperToControlItem,
  useShape,
} from "lowcoder-design";
import { ReactNode, useCallback, useState } from "react";
import styled from "styled-components";
import { setFieldsNoTypeCheck } from "util/objectUtils";
import { StringControl } from "./codeControl";
import { ControlParams } from "./controlParams";

const ButtonWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
`;
const ButtonIconWrapper = styled.div`
  display: flex;
  font-size: 16px;
`;
const ButtonText = styled.div`
  margin: 0 4px;
  flex: 1;
  width: 0px;
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
`;
const StyledDeleteInputIcon = styled(DeleteInputIcon)`
  margin-left: auto;
  cursor: pointer;

  &:hover circle {
    fill: #8b8fa3;
  }
`;

const StyledImage = styled.img`
  height: 1em;
  color: currentColor;
`;

const Wrapper = styled.div`
  > div:nth-of-type(1) {
    margin-bottom: 4px;
  }
`;

const IconPicker = (props: {
  value: string;
  onChange: (value: string) => void;
  label?: ReactNode;
  IconType?: "OnlyAntd" | "All" | "default" | undefined;
}) => {
  const icon = useShape(props.value);
  // console.log(props);
  let shapeDetails = props.value;
  // console.log("shapeDetails ", shapeDetails);

  return (
    <ShapeSelect
      onChange={props.onChange}
      label={props.label}
      searchKeywords={i18nObjs.iconSearchKeywords}
      IconType={props.IconType}
    >
      <TacoButton style={{ width: "100%" }}>
        {props.value ? (
          <ButtonWrapper>
            <ButtonIconWrapper>
              <Coolshape
                type={(shapeDetails?.split("_")[1] as any) ?? "star"}
                index={parseInt(shapeDetails?.split("_")[0]) ?? 0}
                size={28}
                noise={true}
              />
            </ButtonIconWrapper>

            <StyledDeleteInputIcon
              onClick={(e) => {
                props.onChange("");
                e.stopPropagation();
              }}
            />
          </ButtonWrapper>
        ) : (
          <BlockGrayLabel label={trans("shapeControl.selectShape")} />
        )}
      </TacoButton>
    </ShapeSelect>
  );
};

function onClickIcon(e: React.MouseEvent, v: EditorView) {
  for (let t = e.target as HTMLElement | null; t; t = t.parentElement) {
    if (t.classList.contains(iconWidgetClass)) {
      const pos = v.posAtDOM(t);
      const result = iconRegexp.exec(v.state.doc.sliceString(pos));
      if (result) {
        const from = pos + result.index;
        return { from, to: from + result[0].length };
      }
    }
  }
}

function IconSpan(props: { value: string }) {
  const icon = useShape(props.value);
  return <span>{icon?.getView() ?? props.value}</span>;
}

function cardRichContent(s: string) {
  let result = s.match(iconRegexp);
  if (result) {
    const nodes: React.ReactNode[] = [];
    let pos = 0;
    for (const iconStr of result) {
      const i = s.indexOf(iconStr, pos);
      if (i >= 0) {
        nodes.push(s.slice(pos, i));
        nodes.push(<IconSpan key={i} value={iconStr} />);
        pos = i + iconStr.length;
      }
    }
    nodes.push(s.slice(pos));
    return nodes;
  }
  return s;
}

type Range = {
  from: number;
  to: number;
};



function isSelectValue(value: any) {
  return !value || (typeof value === "string" && value.startsWith(iconPrefix));
}

type ChangeModeAction = {
  useCodeEditor: boolean;
};

function ShapeControlView(props: { value: any }) {
  const { value } = props;
  // console.log("ShapeControlView ", value);
  const icon = useShape(value);
  if (icon) {
    return icon.getView();
  }
  return <StyledImage src={value} alt="" />;
}

export class ShapeControl extends AbstractComp<
  ReactNode,
  string,
  Node<ValueAndMsg<string>>
> {
  private readonly useCodeEditor: boolean;
  private readonly codeControl: InstanceType<typeof StringControl>;

  constructor(params: CompParams<string>) {
    super(params);
    this.useCodeEditor = !isSelectValue(params.value);
    this.codeControl = new StringControl(params);
  }

  override getView(): ReactNode {
    const value = this.codeControl.getView();
    return <ShapeControlView value={value} />;
  }

  override getPropertyView(): ReactNode {
    const value = this.codeControl.getView();
    return <ShapeControlView value={value} />;
  }

  changeModeAction() {
    return customAction<ChangeModeAction>(
      { useCodeEditor: !this.useCodeEditor },
      true
    );
  }

  propertyView(params: ControlParams) {
    const jsContent = (
      <SwitchJsIcon
        checked={this.useCodeEditor}
        onChange={() => this.dispatch(this.changeModeAction())}
      />
    );
    return wrapperToControlItem(
      <ControlPropertyViewWrapper {...params} lastNode={jsContent}>
        <IconPicker
          value={this.codeControl.getView()}
          onChange={(x) => this.dispatchChangeValueAction(x)}
          label={params.label}
          IconType={params.IconType}
        />
      </ControlPropertyViewWrapper>
    );
  }

  readonly IGNORABLE_DEFAULT_VALUE = "";
  override toJsonValue(): string {
    if (this.useCodeEditor) {
      return this.codeControl.toJsonValue();
    }
    // in select mode, don't save editor's original value when saving
    const v = removeQuote(this.codeControl.getView());
    return isSelectValue(v) ? v : "";
  }

  override reduce(action: CompAction): this {
    switch (action.type) {
      case CompActionTypes.CUSTOM: {
        const useCodeEditor = (action.value as ChangeModeAction).useCodeEditor;
        let codeControl = this.codeControl;
        if (!this.useCodeEditor && useCodeEditor) {
          // value should be transformed when switching to editor from select mode
          const value = this.codeControl.toJsonValue();
          if (value && isSelectValue(value)) {
            codeControl = codeControl.reduce(
              codeControl.changeValueAction(`{{ "${value}" }}`)
            );
          }
        }
        return setFieldsNoTypeCheck(this, { useCodeEditor, codeControl });
      }
      case CompActionTypes.CHANGE_VALUE: {
        const useCodeEditor = this.useCodeEditor
          ? true
          : !isSelectValue(action.value);
        const codeControl = this.codeControl.reduce(action);
        if (
          useCodeEditor !== this.useCodeEditor ||
          codeControl !== this.codeControl
        ) {
          return setFieldsNoTypeCheck(this, { useCodeEditor, codeControl });
        }
        return this;
      }
    }
    const codeControl = this.codeControl.reduce(action);
    if (codeControl !== this.codeControl) {
      return setFieldsNoTypeCheck(this, { codeControl });
    }
    return this;
  }

  override nodeWithoutCache() {
    return this.codeControl.nodeWithoutCache();
  }

  exposingNode() {
    return this.codeControl.exposingNode();
  }

  override changeDispatch(dispatch: DispatchType): this {
    const result = setFieldsNoTypeCheck(
      super.changeDispatch(dispatch),
      { codeControl: this.codeControl.changeDispatch(dispatch) },
      { keepCacheKeys: ["node"] }
    );
    return result;
  }
}
