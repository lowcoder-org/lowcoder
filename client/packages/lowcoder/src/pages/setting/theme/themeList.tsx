import { default as Button } from "antd/es/button";
import { default as Dropdown } from "antd/es/dropdown";
import { default as Empty } from "antd/es/empty";
import { default as Menu } from "antd/es/menu";
import { default as Table } from "antd/es/table";
import { default as Typography } from "antd/es/typography";
import { timestampToHumanReadable } from "util/dateTimeUtils";
import { MENU_TYPE } from "./themeConstant";
import React, { useState } from "react";
import {
  ColumnName,
  ControlCol,
  EditButton,
  EllipsisSpan,
  EmptySpan,
  ListDropdown,
  MoreIconDiv,
  StyledMoreActionIcon,
  TableStyled,
  TagDesc,
} from "./styledComponents";
import { ThemeType } from "api/commonSettingApi";
import { trans } from "i18n";
import { messageInstance } from "lowcoder-design";

const { Column } = Table;

type ThemeListProp = {
  themeList: ThemeType[] | undefined | null;
  defaultTheme: string | undefined | null;
  isAdmin: boolean;
  clickMenu: (params: { themeId: string; key: string; name?: string }) => void;
  createTheme: () => void;
};

function ThemeList(props: ThemeListProp) {
  const { themeList, defaultTheme, clickMenu, isAdmin, createTheme } = props;
  const tableRef = React.useRef(null);
  const [activeRow, setActiveRow] = useState("0");
  const [needRenameId, setNeedRenameId] = useState<string | undefined>(undefined);

  function editTheme(id: string) {
    clickMenu({ key: MENU_TYPE.EDIT, themeId: id });
  }
  return (
    <TableStyled
      id="theme-list-table"
      ref={tableRef}
      rowKey="id"
      pagination={false}
      dataSource={themeList || []}
      rowClassName={(record) => ((record as ThemeType).id === activeRow ? "row-hover" : "")}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <EmptySpan>
                <span>{trans("theme.emptyTheme")}</span>
                <span>
                  {trans("theme.click")}
                  <Button type="link" disabled={!isAdmin} onClick={() => createTheme()}>
                    {trans("theme.createTheme")}
                  </Button>
                  {trans("theme.toCreate")}
                </span>
              </EmptySpan>
            }
          />
        ),
      }}
      onRow={(theme) => ({
        onClick: (event) => {
          if (needRenameId === (theme as ThemeType).id) {
            return;
          }
          editTheme((theme as ThemeType).id);
        },
        onMouseEnter: () => {
          setActiveRow((theme as ThemeType).id);
        },
        onMouseLeave: () => {
          setActiveRow("0");
        },
      })}
    >
      <Column
        title={trans("theme.nameColumn")}
        dataIndex="name"
        key="name"
        ellipsis
        render={(value, theme: ThemeType) => {
          return (
            <ColumnName>
              <TagDesc $theme={theme.theme}>
                <div className="left" />
                <div className="right" />
              </TagDesc>
              <Typography.Text
                title={theme.name}
                editable={{
                  enterIcon: null,
                  tooltip: false,
                  editing: theme.id === needRenameId,
                  icon: null,
                  maxLength: 25,
                  triggerType: ["text"],
                  onChange: (value) => {
                    if (!value.trim()) {
                      messageInstance.warning(trans("home.nameCheckMessage"));
                      return;
                    }
                    // check duplicate names
                    const isExist = themeList?.find((theme) => theme.name === value);
                    if (isExist && value !== theme.name) {
                      messageInstance.error(trans("theme.checkDuplicateNames"));
                      return;
                    }
                    clickMenu({ key: MENU_TYPE.RENAME, themeId: theme.id, name: value });
                    setNeedRenameId(undefined);
                  },
                }}
              >
                {needRenameId === theme.id ? (
                  theme.name
                ) : (
                  <EllipsisSpan>{value}</EllipsisSpan>
                )}
              </Typography.Text>
              {theme.id === defaultTheme && (
                <span className="default">{trans("theme.defaultTip")}</span>
              )}
            </ColumnName>
          );
        }}
      />
      <Column
        title={trans("theme.updateTimeColumn")}
        dataIndex="updateTime"
        key="updateTime"
        ellipsis
        render={(value) => (
          <span style={{ color: "#8B8FA3" }}>{timestampToHumanReadable(value)}</span>
        )}
      />
      <Column
        key="id"
        dataIndex="id"
        render={(value, theme) =>
          isAdmin && (
            <ControlCol>
              <EditButton
                className="edit-button"
                buttonType="primary"
                onClick={() => editTheme(value)}
              >
                {trans("theme.edit")}{" "}
              </EditButton>
              <ListDropdown onClick={(e) => e.stopPropagation()}>
                <Dropdown
                  trigger={["click"]}
                  getPopupContainer={() => document.getElementById("theme-list-table")!}
                  dropdownRender={() => (
                    <Menu
                      onClick={(params) => {
                        if (params.key !== MENU_TYPE.RENAME) {
                          clickMenu({ key: params.key, themeId: value });
                        } else {
                          setNeedRenameId(value);
                        }
                      }}
                      items={[
                        (theme as ThemeType).id === defaultTheme
                          ? {
                              label: trans("theme.cancelDefaultTheme"),
                              key: MENU_TYPE.CANCEL_DEFAULT,
                            }
                          : {
                              label: trans("theme.setDefaultTheme"),
                              key: MENU_TYPE.SET_DEFAULT,
                            },
                        {
                          label: trans("rename"),
                          key: MENU_TYPE.RENAME,
                        },
                        {
                          label: trans("theme.copyTheme"),
                          key: MENU_TYPE.COPY,
                        },
                        {
                          label: trans("delete"),
                          key: MENU_TYPE.DELETE,
                        },
                      ]}
                    />
                  )}
                >
                  <MoreIconDiv>
                    <StyledMoreActionIcon />
                  </MoreIconDiv>
                </Dropdown>
              </ListDropdown>
            </ControlCol>
          )
        }
      />
    </TableStyled>
  );
}

export default ThemeList;
