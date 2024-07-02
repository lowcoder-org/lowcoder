import type { EditorState, EditorView } from "base/codeEditor/codeMirror";
import { iconRegexp, iconWidgetClass } from "base/codeEditor/extensions/iconExtension";
import { i18nObjs, trans } from "i18n";
import {
  AbstractComp,
  CompAction,
  CompActionTypes,
  CompParams,
  customAction,
  DispatchType,
  Node,
  SimpleComp,
  ValueAndMsg,
} from "lowcoder-core";
import {
  BlockGrayLabel,
  controlItem,
  ControlPropertyViewWrapper,
  DeleteInputIcon,
  iconPrefix,
  IconSelect,
  IconSelectBase,
  removeQuote,
  SwitchJsIcon,
  SwitchWrapper,
  TacoButton,
  TacoInput,
  useIcon,
  wrapperToControlItem,
} from "lowcoder-design";
import { ReactNode, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { setFieldsNoTypeCheck } from "util/objectUtils";
import { StringControl } from "./codeControl";
import { ControlParams } from "./controlParams";
import Popover from "antd/es/popover";
import { CloseIcon, SearchIcon } from "icons";
import Draggable from "react-draggable";
import IconscoutApi, { SearchParams } from "api/iconscoutApi";
import List, { ListRowProps } from "react-virtualized/dist/es/List";
import { debounce } from "lodash";
import Spin from "antd/es/spin";

const ButtonWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
`;
const ButtonIconWrapper = styled.div`
  display: flex;
  width: 18px;
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
  height: 100%;
  color: currentColor;
`;

const Wrapper = styled.div`
  > div:nth-of-type(1) {
    margin-bottom: 4px;
  }
`;
const PopupContainer = styled.div`
  width: 580px;
  background: #ffffff;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  box-sizing: border-box;
`;

const TitleDiv = styled.div`
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  justify-content: space-between;
  user-select: none;
`;
const TitleText = styled.span`
  font-size: 16px;
  color: #222222;
  line-height: 16px;
`;
const StyledCloseIcon = styled(CloseIcon)`
  width: 16px;
  height: 16px;
  cursor: pointer;
  color: #8b8fa3;

  &:hover g line {
    stroke: #222222;
  }
`;

const SearchDiv = styled.div`
  position: relative;
  margin: 0px 16px;
  padding-bottom: 8px;
  display: flex;
  justify-content: space-between;
`;
const StyledSearchIcon = styled(SearchIcon)`
  position: absolute;
  top: 6px;
  left: 12px;
`;
const IconListWrapper = styled.div`
  padding-left: 10px;
  padding-right: 4px;
`;
const IconList = styled(List)`
  scrollbar-gutter: stable;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-clip: content-box;
    border-radius: 9999px;
    background-color: rgba(139, 143, 163, 0.2);
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: rgba(139, 143, 163, 0.36);
  }
`;

const IconRow = styled.div`
  padding: 0 6px;
  display: flex;
  align-items: flex-start; /* Align items to the start to allow different heights */
  justify-content: space-between;

  &:last-child {
    gap: 8px;
    justify-content: flex-start;
  }
`;

const IconItemContainer = styled.div`
  width: 60px;
  display: flex;
  flex-direction: column;
  align-items: center; 
  justify-content: flex-start; 
  cursor: pointer;
  font-size: 28px;
  margin-bottom: 24px; 

  &:hover {
    border: 1px solid #315efb;
    border-radius: 4px;
  }

  &:focus {
    border: 1px solid #315efb;
    border-radius: 4px;
    box-shadow: 0 0 0 2px #d6e4ff;
  }
`;

const IconWrapper = styled.div`
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const IconKeyDisplay = styled.div`
  font-size: 8px;
  color: #8b8fa3;
  margin-top: 4px; /* Space between the icon and the text */
  text-align: center;
  word-wrap: break-word; /* Ensure text wraps */
  width: 100%; /* Ensure the container can grow */
`;

export enum IconScoutAssetType {
  ICON = "icon",
  ILLUSTRATION = "illustration",
  // '3D' = "3d",
  LOTTIE = "lottie",
}

const IconScoutSearchParams: SearchParams = {
  query: '',
  product_type: 'item',
  asset: 'icon',
  per_page: 50,
  page: 1,
  formats: 'svg',
  sort: 'relevant',
};

const columnNum = 8;

export const IconPicker = (props: {
  assetType: string;
  value: string;
  onChange: (value: string) => void;
  label?: ReactNode;
  IconType?: "OnlyAntd" | "All" | "default" | undefined;
}) => {
  console.log(props.value, props.assetType);
  const icon = useIcon(props.value);
  const [ visible, setVisible ] = useState(false)
  const [ loading, setLoading ] = useState(false)
  const [searchText, setSearchText] = useState("");
  const [ searchResults, setSearchResults ] = useState<Array<any>>([]);
  const onChangeRef = useRef(props.onChange);
  onChangeRef.current = props.onChange;
  const onChangeIcon = useCallback(
    (key: string) => {
      onChangeRef.current(key);
      setVisible(false);
    }, []
  );

  const fetchResults = async (query: string) => {
    console.log('query change', query);
    setLoading(true);
    const result = await IconscoutApi.search({
      ...IconScoutSearchParams,
      asset: props.assetType,
      query,
    });
    setLoading(false);
    setSearchResults(result.data);
  };

  const fetchAsset = async (uuid: string) => {
    try {
      const result = await IconscoutApi.download(uuid, {
        format: props.assetType === IconScoutAssetType.LOTTIE ? 'ai' : 'svg',
      });
      if (props.assetType !== IconScoutAssetType.LOTTIE) {
        onChangeIcon(result.url);
      }
    } catch (error) {
      console.error(error);
    }
  }

  const handleChange = debounce((e) => {
    setSearchText(e.target.value);
    fetchResults(e.target.value);
  }, 500);

  const rowRenderer = useCallback(
    (p: ListRowProps) => (
      <IconRow key={p.key} style={p.style}>
        {searchResults
          .slice(p.index * columnNum, (p.index + 1) * columnNum)
          .map((icon) => (
            <IconItemContainer
              key={icon.uuid}
              tabIndex={0}
              onClick={() => {
                if (props.assetType === IconScoutAssetType.LOTTIE) {
                  onChangeIcon(icon.urls.thumb)
                }
                fetchAsset(icon.uuid);
              }}
            >
              <IconWrapper>
                {props.assetType === IconScoutAssetType.ICON && (
                  <img style={{'width': '100%'}} src={icon.urls.png_64} />
                )}
                {props.assetType === IconScoutAssetType.ILLUSTRATION && (
                  <img style={{'width': '100%'}} src={icon.urls.thumb} />
                )}
                {props.assetType === IconScoutAssetType.LOTTIE && (
                  <video style={{'width': '100%'}} src={icon.urls.thumb} autoPlay />
                )}
              </IconWrapper>
            </IconItemContainer>
          ))}
      </IconRow>
    ),[searchResults]
  );

  return (
    <Popover
      trigger={'click'}
      placement="left"
      // align={{ offset: [props.leftOffset ?? 0, 0, 0, 0] }}
      open={visible}
      onOpenChange={setVisible}
      // getPopupContainer={parent ? () => parent : undefined}
      // hide the original background when dragging the popover is allowed
      overlayInnerStyle={{
        border: "none",
        boxShadow: "none",
        background: "transparent",
      }}
      // when dragging is allowed, always re-location to avoid the popover exceeds the screen
      destroyTooltipOnHide
      content={
        <Draggable handle=".dragHandle">
          <PopupContainer>
            <TitleDiv className="dragHandle">
              <TitleText>{"Select Icon"}</TitleText>
              <StyledCloseIcon onClick={() => setVisible(false)} />
            </TitleDiv>
            <SearchDiv>
              <TacoInput
                style={{ width: "100%", paddingLeft: "40px" }}
                onChange={handleChange}
                placeholder={"Search Icon"}
              />
              <StyledSearchIcon />
            </SearchDiv>
            <IconListWrapper>
              {loading && (
                <Spin />
              )}
              {!loading && (
                <IconList
                  width={550}
                  height={400}
                  rowHeight={80}
                  rowCount={Math.ceil(searchResults.length / columnNum)}
                  rowRenderer={rowRenderer}
                />
              )}
            </IconListWrapper>
          </PopupContainer>
        </Draggable>
      }
    >
      <TacoButton style={{ width: "100%" }}>
        {props.value ? (
          <ButtonWrapper>
            <ButtonIconWrapper>
              {props.assetType === IconScoutAssetType.LOTTIE && (
                <>{props.value}</>
              )}
              {props.assetType !== IconScoutAssetType.LOTTIE && (
                <IconControlView value={props.value} />
              )}
            </ButtonIconWrapper>
            <StyledDeleteInputIcon
              onClick={(e) => {
                props.onChange("");
                e.stopPropagation();
              }}
            />
          </ButtonWrapper>
        ) : (
          <BlockGrayLabel label={trans("iconControl.selectIcon")} />
        )}
      </TacoButton>
    </Popover>
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
  const icon = useIcon(props.value);
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

function IconCodeEditor(props: {
  codeControl: InstanceType<typeof StringControl>;
  params: ControlParams;
}) {
  const [visible, setVisible] = useState(false);
  const [range, setRange] = useState<Range>();
  const widgetPopup = useCallback(
    (v: EditorView) => (
      <IconSelectBase
        onChange={(value) => {
          const r: Range = range ?? v.state.selection.ranges[0] ?? { from: 0, to: 0 };
          const insert = '"' + value + '"';
          setRange({ ...r, to: r.from + insert.length });
          v.dispatch({ changes: { ...r, insert } });
        }}
        visible={visible}
        setVisible={setVisible}
        trigger="contextMenu"
        // parent={document.querySelector<HTMLElement>(`${CodeEditorTooltipContainer}`)}
        searchKeywords={i18nObjs.iconSearchKeywords}
      />
    ),
    [visible, range]
  );
  const onClick = useCallback((e: React.MouseEvent, v: EditorView) => {
    const r = onClickIcon(e, v);
    if (r) {
      setVisible(true);
      setRange(r);
    }
  }, []);
  const extraOnChange = useCallback((state: EditorState) => {
    // popover should hide on change
    setVisible(false);
    setRange(undefined);
  }, []);
  return props.codeControl.codeEditor({
    ...props.params,
    enableIcon: true,
    widgetPopup,
    onClick,
    extraOnChange,
    cardRichContent,
    cardTips: (
      <>
        {trans("iconControl.insertImage")}
        <TacoButton style={{ display: "inline" }} onClick={() => setVisible(true)}>
          {trans("iconControl.insertIcon")}
        </TacoButton>
      </>
    ),
  });
}

function isSelectValue(value: any) {
  return !value || (typeof value === "string" && value.startsWith(iconPrefix));
}

type ChangeModeAction = {
  useCodeEditor: boolean;
};

export function IconControlView(props: { value: string }) {
  const { value } = props;
  const icon = useIcon(value);
  console.log(icon);
  if (icon) {
    return icon.getView();
  }
  return <StyledImage src={value} alt="" />;
}

export function IconscoutControl(
  assetType: string = IconScoutAssetType.ICON,
) {
  return class extends AbstractComp<ReactNode, string, Node<ValueAndMsg<string>>> {
    private readonly useCodeEditor: boolean;
    private readonly codeControl: InstanceType<typeof StringControl>;

    constructor(params: CompParams<string>) {
      super(params);
      this.useCodeEditor = !isSelectValue(params.value);
      this.codeControl = new StringControl(params);
    }

    override getView(): ReactNode {
      const value = this.codeControl.getView();
      return <IconControlView value={value} />;
    }

    override getPropertyView(): ReactNode {
      throw new Error("Method not implemented.");
    }

    changeModeAction() {
      return customAction<ChangeModeAction>({ useCodeEditor: !this.useCodeEditor }, true);
    }

    propertyView(params: ControlParams) {
      return wrapperToControlItem(
        <ControlPropertyViewWrapper {...params}>
          <IconPicker
            assetType={assetType}
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
              codeControl = codeControl.reduce(codeControl.changeValueAction(`{{ "${value}" }}`));
            }
          }
          return setFieldsNoTypeCheck(this, { useCodeEditor, codeControl });
        }
        case CompActionTypes.CHANGE_VALUE: {
          const useCodeEditor = this.useCodeEditor ? true : !isSelectValue(action.value);
          const codeControl = this.codeControl.reduce(action);
          if (useCodeEditor !== this.useCodeEditor || codeControl !== this.codeControl) {
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
}

// export class IconscoutControl extends SimpleComp<string> {
//   readonly IGNORABLE_DEFAULT_VALUE = false;
//   protected getDefaultValue(): string {
//     return '';
//   }

//   override getPropertyView(): ReactNode {
//     throw new Error("Method not implemented.");
//   }

//   propertyView(params: ControlParams & { type?: "switch" | "checkbox" }) {
//     return wrapperToControlItem(
//       <ControlPropertyViewWrapper {...params}>
//         <IconPicker
//           value={this.value}
//           onChange={(x) => this.dispatchChangeValueAction(x)}
//           label={params.label}
//           IconType={params.IconType}
//         />
//       </ControlPropertyViewWrapper>
//     );
//   }
// }
