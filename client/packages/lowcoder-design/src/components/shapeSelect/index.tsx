import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/free-regular-svg-icons";
import { default as Popover } from "antd/lib/popover";
import type { ActionType } from "@rc-component/trigger/lib/interface";
import { TacoInput } from "components/tacoInput";
import { Tooltip } from "components/toolTip";
import { trans } from "i18n/design";
import { upperFirst, sortBy } from "lodash";
import { shapes } from "coolshapes-react";
import { Coolshape } from "coolshapes-react";

import {
  ReactNode,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
  Suspense,
} from "react";
import Draggable from "react-draggable";
import {
  default as List,
  type ListRowProps,
} from "react-virtualized/dist/es/List";
import styled from "styled-components";
import { CloseIcon, SearchIcon } from "icons";
import { ANTDICON } from "icons/antIcon";
import { JSX } from "react/jsx-runtime";

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
  .gtujLP {
    overflow: hidden;
  }
  .iconsDiv div {
    float: left;
  }
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

class Icon {
  readonly title: string;
  constructor(
    readonly def: IconDefinition | any,
    readonly names: string[]
  ) {
    if (def?.iconName) {
      this.title = def.iconName.split("-").map(upperFirst).join(" ");
    } else {
      this.title = names[0].slice(5);
      this.def = def;
    }
  }
  getView() {
    if (this.names[0]?.startsWith("antd/")) return this.def;
    else
      return (
        <FontAwesomeIcon
          icon={this.def}
          style={{ width: "1em", height: "1em" }}
        />
      );
  }
}

let allIcons: Record<string, Icon> | undefined = undefined;

function getAllIcons() {
  if (allIcons !== undefined) {
    return allIcons;
  }
  // console.log(shapes);
  // const [{ far }, { fas }] = await Promise.all([
  //   import("@fortawesome/free-regular-svg-icons"),
  //   import("@fortawesome/free-solid-svg-icons"),
  //   // import("@fontawesome/free-brands-svg-icons"),
  // ]);

  const ret: Record<string, Icon> = {};
  // for (const [type, pack] of Object.entries({ solid: fas, regular: far })) {
  //   const list = Object.entries(pack);
  //   // console.log("list of icons ", list);

  //   for (const [k, def] of list) {
  //     ret[type + "/" + def.iconName] = new Icon(def, [def.iconName]);
  //   }
  //   for (const [k, def] of list) {
  //     const name = k.startsWith("fa") ? k.slice(2) : k;
  //     ret[type + "/" + def.iconName].names.push(name);
  //     // for compatibility of old data
  //     const key = type + "/" + name;
  //     if (ret[key] === undefined) {
  //       ret[key] = new Icon(def, []);
  //     }
  //   }
  // }
  //append ant icon
  // for (let key of Object.keys(shapes: any)) {
  //   // ret["antd/" + key] = new Icon(
  //   //   ANTDICON[key.toLowerCase() as keyof typeof ANTDICON],
  //   //   ["antd/" + key]
  //   // );
  //   // ret[key + "/"].names.push("test");
  //   ret[key] = shapes[key].map((Shape: JSX.IntrinsicAttributes, index: any) => {
  //     return <Shape size={48} />;
  //   });
  // }
  allIcons = ret;
  console.log(ret);

  return ret;

  // {
  //   let all = Object.keys(shapes).map((shapeType: any, _) => {
  //     return shapes[shapeType].map((Shape: JSX.IntrinsicAttributes, index: any) => {
  //       return <Shape size={48} />;
  //     });
  //   });
  //   console.log(all);

  // }

  // const [{ far }, { fas }] = await Promise.all([
  //   import("@fortawesome/free-regular-svg-icons"),
  //   import("@fortawesome/free-solid-svg-icons"),
  //   // import("@fontawesome/free-brands-svg-icons"),
  // ]);

  // const ret: Record<string, Icon> = {};
  // for (const [type, pack] of Object.entries({ solid: fas, regular: far })) {
  //   const list = Object.entries(pack);
  //   // console.log("list of icons ", list);

  //   for (const [k, def] of list) {
  //     ret[type + "/" + def.iconName] = new Icon(def, [def.iconName]);
  //   }
  //   for (const [k, def] of list) {
  //     const name = k.startsWith("fa") ? k.slice(2) : k;
  //     ret[type + "/" + def.iconName].names.push(name);
  //     // for compatibility of old data
  //     const key = type + "/" + name;
  //     if (ret[key] === undefined) {
  //       ret[key] = new Icon(def, []);
  //     }
  //   }
  // }
  // //append ant icon
  // for (let key of Object.keys(ANTDICON)) {
  //   ret["antd/" + key] = new Icon(
  //     ANTDICON[key.toLowerCase() as keyof typeof ANTDICON],
  //     ["antd/" + key]
  //   );
  // }
  // allIcons = ret;
  // console.log(ret);

  // return ret;
}

export const sharePrefix = "/icon:";

export function removeShapeQuote(value?: string) {
  return value
    ? value.startsWith('"') && value.endsWith('"')
      ? value.slice(1, -1)
      : value
    : "";
}

function getIconKey(value?: string) {
  const v = removeShapeQuote(value);
  return v.startsWith(sharePrefix) ? v.slice(sharePrefix.length) : "";
}

export function useShape(value?: string) {
  const key = getIconKey(value);
  const [icon, setIcon] = useState<Icon | undefined>(undefined);
  useEffect(() => {
    let allshapes = getAllIcons();
    setIcon(allshapes[key]);
  }, [key]);
  return icon;
}

function search(
  allIcons: Record<string, Icon>,
  searchText: string,
  searchKeywords?: Record<string, string>,
  IconType?: "OnlyAntd" | "All" | "default" | undefined
) {
  const tokens = searchText
    .toLowerCase()
    .split(/\s+/g)
    .filter((t) => t);
  return sortBy(
    Object.entries(allIcons).filter(([key, icon]) => {
      if (icon.names.length === 0) {
        return false;
      }
      if (IconType === "OnlyAntd" && !key.startsWith("antd/")) return false;
      if (IconType === "default" && key.startsWith("antd/")) return false;
      let text = icon.names
        .flatMap((name) => [name, searchKeywords?.[name]])
        .filter((t) => t)
        .join(" ");
      text = (icon.title + " " + text).toLowerCase();
      return tokens.every((t) => text.includes(t));
    }),
    ([key, icon]) => icon.title
  );
}

const IconPopup = (props: {
  onChange: (value: string) => void;
  label?: ReactNode;
  onClose: () => void;
  searchKeywords?: Record<string, string>;
  IconType?: "OnlyAntd" | "All" | "default" | undefined;
}) => {
  const [allIcons, setAllIcons] = useState<Record<string, Icon>>({});
  const onChangeRef = useRef(props.onChange);
  onChangeRef.current = props.onChange;
  const onChangeIcon = useCallback(
    (key: string) => onChangeRef.current(key),
    []
  );

  useEffect(() => {
    let shapes = getAllIcons();
    console.log("shapes ", shapes);

    setAllIcons(shapes);
  }, []);

  // const rowRenderer = useCallback(
  //   (p: ListRowProps) => (
  //     <IconRow key={p.key} style={p.style}>
  //       {searchResults
  //         .slice(p.index * columnNum, (p.index + 1) * columnNum)
  //         .map(([key, icon]) => (
  //           <Tooltip
  //             key={key}
  //             title={icon.title + ", Key: " + key}
  //             placement="bottom"
  //             align={{ offset: [0, -7, 0, 0] }}
  //             destroyTooltipOnHide
  //           >
  //             <IconItemContainer
  //               tabIndex={0}
  //               onClick={() => {
  //                 onChangeIcon(key);
  //               }}
  //             >
  //               <IconWrapper>
  //                 <Suspense fallback={null}>{icon.getView()}</Suspense>
  //               </IconWrapper>
  //               <IconKeyDisplay>{key}</IconKeyDisplay>
  //             </IconItemContainer>
  //           </Tooltip>
  //         ))}
  //     </IconRow>
  //   ),
  //   [searchResults, allIcons, onChangeIcon]
  // );
  return (
    <Draggable handle=".dragHandle">
      <PopupContainer>
        <TitleDiv className="dragHandle">
          <TitleText>{trans("shapeSelect.title")}</TitleText>
          <StyledCloseIcon onClick={props.onClose} />
        </TitleDiv>
        {/* <SearchDiv>
          <TacoInput 
            style={{ width: "100%", paddingLeft: "40px" }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder={trans("shapeSelect.searchPlaceholder")}
          />
          <StyledSearchIcon />
        </SearchDiv> */}
        <IconListWrapper style={{ display: "flex", flexWrap: "wrap" }}>
          <>
            {Object.keys(shapes).map((shapeType: string, _i: number) => {
              return shapes[shapeType as keyof typeof shapes].map(
                (Shape: any, index: any) => {
                  return (
                    <div
                      style={{ paddingLeft: "10px" }}
                      key={index}
                      onClick={() => {
                        onChangeIcon(index + "_" + shapeType);
                      }}
                    >
                      <Shape
                        size={24} 
                        key={index}
                        onClick={() => {
                          onChangeIcon(index + "_" + shapeType);
                        }}
                      />
                      <p>{shapeType}</p>
                    </div>
                  );
                }
              );
            })}
          </>
        </IconListWrapper>
      </PopupContainer>
    </Draggable>
  );
};

export const ShapeSelectBase = (props: {
  onChange: (value: string) => void;
  label?: ReactNode;
  children?: ReactNode;
  visible?: boolean;
  setVisible?: (v: boolean) => void;
  trigger?: ActionType;
  leftOffset?: number;
  parent?: HTMLElement | null;
  searchKeywords?: Record<string, string>;
  IconType?: "OnlyAntd" | "All" | "default" | undefined;
}) => {
  const { setVisible, parent } = props;
  return (
    <Popover
      trigger={props.trigger}
      placement="left"
      align={{ offset: [props.leftOffset ?? 0, 0, 0, 0] }}
      open={props.visible}
      onOpenChange={setVisible}
      getPopupContainer={parent ? () => parent : undefined}
      // hide the original background when dragging the popover is allowed
      overlayInnerStyle={{
        border: "none",
        boxShadow: "none",
        background: "transparent",
      }}
      // when dragging is allowed, always re-location to avoid the popover exceeds the screen
      destroyTooltipOnHide
      content={
        <IconPopup
          onChange={props.onChange}
          label={props.label}
          onClose={() => setVisible?.(false)}
          searchKeywords={props.searchKeywords}
          IconType={props.IconType}
        />
      }
    >
      {props.children}
    </Popover>
  );
};

export const ShapeSelect = (props: {
  onChange: (value: string) => void;
  label?: ReactNode;
  children?: ReactNode;
  searchKeywords?: Record<string, string>;
  IconType?: "OnlyAntd" | "All" | "default" | undefined;
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <ShapeSelectBase
      {...props}
      visible={visible}
      setVisible={setVisible}
      trigger="click"
      leftOffset={-96}
      searchKeywords={props.searchKeywords}
    />
  );
};
