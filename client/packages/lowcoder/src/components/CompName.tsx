import React, { useContext, useEffect, useState, useCallback, useMemo } from "react";
import styled from "styled-components";
import { PointIcon, SearchOutlinedIcon } from "lowcoder-design/src/icons";
import type { EditPopoverItemType } from 'lowcoder-design/src/components/popover';
import { Search } from 'lowcoder-design/src/components/Search';
import { EditPopover } from "lowcoder-design";
import { EditorContext } from "comps/editorState";
import { GridCompOperator } from "comps/utils/gridCompOperator";
import { PopupCard } from "lowcoder-design/src/components/popupCard";
import { EditText } from "lowcoder-design/src/components/edit";
import { values } from "lodash";
import { GreyTextColor } from "constants/style";
import { UICompType } from "comps/uiCompRegistry";
import { trans } from "i18n";
import { getComponentDocUrl } from "comps/utils/compDocUtil";
import { getComponentPlaygroundUrl } from "comps/utils/compDocUtil";
import { parseCompType } from "comps/utils/remote";

const CompDiv = styled.div<{ $width?: number; $hasSearch?: boolean; $showSearch?: boolean }>`
  width: ${(props) => (props.$width ? props.$width : 312)}px;
  height: ${(props) => (props.$showSearch ? 45 : 46)}px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: ${(props) => (props.$showSearch ? 0 : 1)}px solid #e1e3eb;

  .taco-edit-text-wrapper {
    width: ${(props) => (props.$hasSearch ? 226 : 252)}px;
    color: #222222;
    font-size: 16px;
    margin-left: 8px;

    &:hover {
      background-color: #f5f5f6;
    }
  }

  .taco-edit-text-input {
    width: ${(props) => (props.$hasSearch ? 226 : 252)}px;
    color: #222222;
    font-size: 16px;
    background-color: #f5f5f6;
    border: 1px solid #3377ff;
    margin-left: 8px;

    :focus {
      border-color: #3377ff;
      box-shadow: 0 0 0 2px #d6e4ff;
    }
  }
`;
const Icon = styled(PointIcon)`
  margin-right: 16px;
  cursor: pointer;
  color: ${GreyTextColor};

  &:hover {
    color: #222222;
  }
`;

const SearchIcon = styled(SearchOutlinedIcon)`
  font-size: 20px;
  margin-left: 6px;
  margin-right: 16px;
  cursor: pointer;
`;

interface Iprops {
  name: string;
  width?: number;
  search?: { searchText: string; setSearchText: (t: string) => void };
}

export const CompName = React.memo((props: Iprops) => {
  const [error, setError] = useState<string | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  
  const editorState = useContext(EditorContext);
  const selectedComp = useMemo(() => values(editorState.selectedComps())[0], [editorState]);
  const compType = useMemo(() => selectedComp.children.compType.getView() as UICompType, [selectedComp]);
  const compInfo = useMemo(() => parseCompType(compType), [compType]);
  const docUrl = useMemo(() => getComponentDocUrl(compType), [compType]);
  const playgroundUrl = useMemo(() => getComponentPlaygroundUrl(compType), [compType]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setError(undefined);
      setEditing(false);
      setUpgrading(false);
      setShowSearch(false);
    };
  }, []);

  // Reset search when name changes
  useEffect(() => {
    setShowSearch(false);
  }, [props.name]);

  const handleUpgrade = useCallback(async () => {
    if (upgrading) return;
    setUpgrading(true);
    try {
      await GridCompOperator.upgradeCurrentComp(editorState);
    } finally {
      setUpgrading(false);
    }
  }, [upgrading, editorState]);

  const handleRename = useCallback((value: string) => {
    if (editorState.rename(props.name, value)) {
      editorState.setSelectedCompNames(new Set([value]));
      setError(undefined);
    }
  }, [editorState, props.name]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    props.search?.setSearchText(e.target.value);
  }, [props.search]);

  const handleSearchToggle = useCallback(() => {
    setShowSearch(prev => !prev);
    props.search?.setSearchText("");
  }, [props.search]);

  const items = useMemo<EditPopoverItemType[]>(() => {
    const menuItems: EditPopoverItemType[] = [];

    if (docUrl) {
      menuItems.push({
        text: trans("comp.menuViewDocs"),
        onClick: () => window.open(docUrl, "_blank"),
      });
    }

    if (playgroundUrl) {
      menuItems.push({
        text: trans("comp.menuViewPlayground"),
        onClick: () => window.open(playgroundUrl, "_blank"),
      });
    }

    if (compInfo.isRemote) {
      menuItems.push({
        text: trans("history.currentVersion") + ": " + compInfo.packageVersion,
        onClick: () => {},
      });

      menuItems.push({
        text: trans("comp.menuUpgradeToLatest"),
        onClick: handleUpgrade,
      });
    }

    return menuItems;
  }, [docUrl, playgroundUrl, compInfo, handleUpgrade]);

  const compName = useMemo(() => (
    <CompDiv $width={props.width} $hasSearch={!!props.search} $showSearch={showSearch}>
      <div>
        <EditText
          text={props.name}
          onFinish={handleRename}
          onChange={(value) => setError(editorState.checkRename(props.name, value))}
          onEditStateChange={setEditing}
        />
        <PopupCard
          editorFocus={!!error && editing}
          title={error ? trans("error") : ""}
          content={error}
          hasError={!!error}
        />
      </div>
      {!!props.search && (
        <SearchIcon
          onClick={handleSearchToggle}
          style={{ color: showSearch ? "#315EFB" : "#8B8FA3" }}
        />
      )}
      {compType === "module" ? (
        <EditPopover
          items={items}
          edit={() => GridCompOperator.editComp(editorState)}
          del={() => GridCompOperator.deleteComp(editorState, editorState.selectedComps())}
        >
          <Icon tabIndex={-1} />
        </EditPopover>
      ) : (
        <EditPopover
          items={items}
          del={() => GridCompOperator.deleteComp(editorState, editorState.selectedComps())}
        >
          <Icon tabIndex={-1} />
        </EditPopover>
      )}
    </CompDiv>
  ), [
    props.width,
    props.search,
    props.name,
    showSearch,
    error,
    editing,
    compType,
    items,
    editorState,
    handleRename,
    handleSearchToggle
  ]);

  return (
    <div>
      {compName}
      {props.search && showSearch && (
        <Search
          placeholder={trans("comp.searchProp")}
          value={props.search.searchText}
          onChange={handleSearchChange}
          allowClear={true}
          style={{ padding: "0 16px", margin: "0 0 4px 0" }}
        />
      )}
    </div>
  );
});
