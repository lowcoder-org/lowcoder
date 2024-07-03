import { trans } from "i18n";
import {
  SimpleComp,
} from "lowcoder-core";
import {
  BlockGrayLabel,
  ControlPropertyViewWrapper,
  DeleteInputIcon,
  TacoButton,
  TacoInput,
  useIcon,
  wrapperToControlItem,
} from "lowcoder-design";
import { ReactNode, useCallback, useRef, useState } from "react";
import styled from "styled-components";
import Popover from "antd/es/popover";
import { CloseIcon, SearchIcon } from "icons";
import Draggable from "react-draggable";
import IconscoutApi, { SearchParams } from "api/iconscoutApi";
import List, { ListRowProps } from "react-virtualized/dist/es/List";
import { debounce } from "lodash";
import Spin from "antd/es/spin";
import { ControlParams } from "./controlParams";

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
  uuid: string;
  value: string;
  onChange: (key: string, value: string) => void;
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
    (key: string, value: string) => {
      onChangeRef.current(key, value);
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
        format: 'svg',
      });
      onChangeIcon(result.uuid, result.url);
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
                  onChangeIcon(icon.uuid, icon.urls.thumb )
                } else {
                  fetchAsset(icon.uuid);
                }
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
                <video style={{'width': '100%'}} src={props.value} autoPlay />
              )}
              {props.assetType !== IconScoutAssetType.LOTTIE && (
                <IconControlView value={props.value} uuid={props.uuid}/>
              )}
            </ButtonIconWrapper>
            <StyledDeleteInputIcon
              onClick={(e) => {
                props.onChange("", "");
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

export function IconControlView(props: { value: string, uuid: string }) {
  const { value } = props;
  const icon = useIcon(value);

  if (icon) {
    return icon.getView();
  }
  return <StyledImage src={value} alt="" />;
}

type DataType = {
  uuid: string;
  value: string;
}
export function IconscoutControl(
  assetType: string = IconScoutAssetType.ICON,
) {
  return class IconscoutControl extends SimpleComp<DataType> {
    readonly IGNORABLE_DEFAULT_VALUE = false;
    protected getDefaultValue(): DataType {
      return {
        uuid: '',
        value: '',
      };
    }

    override getPropertyView(): ReactNode {
      throw new Error("Method not implemented.");
    }

    propertyView(params: ControlParams & { type?: "switch" | "checkbox" }) {
      return wrapperToControlItem(
        <ControlPropertyViewWrapper {...params}>
          <IconPicker
            assetType={assetType}
            uuid={this.value.uuid}
            value={this.value.value}
            onChange={(uuid, value) => {
              this.dispatchChangeValueAction({uuid, value})
            }}
            label={params.label}
            IconType={params.IconType}
          />
        </ControlPropertyViewWrapper>
      );
    }
  }
}
