import styled from "styled-components";
import { default as AntdButton } from "antd/es/button";
import { useSelector } from "react-redux";
import { getDataSourceTypes } from "../../redux/selectors/datasourceSelectors";
import { getBottomResIcon } from "@lowcoder-ee/util/bottomResUtils";
import { DataSourceTypeInfo } from "../../api/datasourceApi";
import { useCurrentPage } from "../../util/hooks";
import { trans } from "i18n";
import {
  apiPlugins,
  apiPluginsForQueryLibrary,
  databasePlugins,
} from "@lowcoder-ee/constants/datasourceConstants";
import { Search } from "components/Search";
import { CreateDropdown } from "@lowcoder-ee/pages/ApplicationV2/CreateDropdown";
import React, { useState } from "react";

export const DataSourceButton = styled(AntdButton)`
  &&& {
    width: 208px;
    height: ${(props) => (props.size === "small" ? "36px" : "44px")};
    border: 1px solid #d7d9e0;
    border-radius: 4px;
    font-weight: 500;
    font-size: 13px;
    color: #333333;
    padding: 12px 10px;
    display: flex;
    align-items: center;
  
    & > span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  
    &:hover {
      color: #333333;
      border-color: #d7d9e0;
      background-color: #f5f5f6;
    }
  
    &:focus {
      color: #333333;
      border-color: #d7d9e0;
      background-color: #f5f5f6;
    }
  }
`;

const PanelWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
const SectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
const SectionLabel = styled.div`
  font-size: 13px;
  color: #8b8fa3;
  line-height: 13px;
`;
const SectionBody = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const OperationRightWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
  @media screen and (max-width: 500px) {
    > Button {
      display: none;
    }
  }
`;

/**
 * Function source: https://stackoverflow.com/a/69623589/1394698, thanks to Jan Turoň
 * 
 * Stripping diacritics and natively comparing the strings is much faster than using localeCompare.
 * localeCompare also fails to search partials, it only searches the full string match, so is quite
 * useless for a filter box. 
 * 
 * This method sacrifices some of the benefits of localeCompare, such as κόσμε == kosme and instead
 * focuses solely on diacritics, which should be fine for the general use case. 
 * 
 * @param str the full string to search against (for this panel, it's always the Data Source #name)
 * @param sub the filter string to search with
 */
export const localeContains = (str: string, sub: string): boolean => {
  if (sub === "") return true;
  if (!sub || !str.length) return false;
  sub = "" + sub;
  if (sub.length > str.length) return false;
  let ascii = (s: string) => s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return ascii(str).includes(ascii(sub));
}

export const PluginPanel = (props: { onSelect: (t: DataSourceTypeInfo) => void }) => {
  const datasourceTypes = useSelector(getDataSourceTypes);
  const currentPage = useCurrentPage();
  const [searchValue, setSearchValue] = useState("");
  const apiList = currentPage === "queryLibrary" ? apiPluginsForQueryLibrary : apiPlugins;
  
  return (
    <PanelWrapper>
      <OperationRightWrapper>
        <Search
          placeholder={trans("search")}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          style={{ width: "192px", height: "32px", margin: "0" }}
        />
      </OperationRightWrapper>
      <SectionWrapper>
        <SectionLabel>{trans("query.database")}</SectionLabel>
        <SectionBody>
          {datasourceTypes
            .filter((t) => databasePlugins.includes(t.id) || t.definition?.category === "database")
            .filter((t) => localeContains(t.name, searchValue))
            .map((t) => {
              return (
                <DataSourceButton key={t.id} onClick={() => props.onSelect(t)}>
                  {t.id && getBottomResIcon(t.id, "large", t.definition?.icon)}
                  {t.name}
                </DataSourceButton>
              );
            })}
        </SectionBody>
      </SectionWrapper>
      <SectionWrapper>
        <SectionLabel>APIs</SectionLabel>
        <SectionBody>
          {datasourceTypes
            .filter((t) => apiList.includes(t.id) || t.definition?.category === "api")
            .filter((t) => localeContains(t.name, searchValue))
            .map((t) => (
              <DataSourceButton key={t.id} onClick={() => props.onSelect(t)}>
                {t.id && getBottomResIcon(t.id, "large", t.definition?.icon)}
                {t.name}
              </DataSourceButton>
            ))}
        </SectionBody>
      </SectionWrapper>
    </PanelWrapper>
  );
};
