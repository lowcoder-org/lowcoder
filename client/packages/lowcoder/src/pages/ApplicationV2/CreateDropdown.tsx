import { HomeResTypeEnum, NavigationType, NavigationTypes } from "../../types/homeRes";
import { AppImport } from "./components/AppImport";
import {
  CommonGrayLabel,
  CommonTextLabel,
  CustomModal,
  ImportIconV2,
  MobileNavIcon,
  PackUpIcon,
  PcNavIcon,
  TacoButton,
} from "lowcoder-design";
import React, { FunctionComponent, useEffect, useState } from "react";
import type { ItemType } from "antd/es/menu/interface";
import { HomeResInfo } from "../../util/homeResUtils";
import { createAppItemClass } from "../tutorials/HomeTutorialsV2";
import styled from "styled-components";
import { default as AntdDropdown } from "antd/es/dropdown";
import type { HomeLayoutMode } from "./HomeLayout";
import { useSelector } from "react-redux";
import { getUser } from "../../redux/selectors/usersSelectors";
import { useCreateHomeRes } from "./useCreateHomeRes";
import { trans } from "../../i18n";
import { ActiveTextColor } from "constants/style";

const Dropdown = styled(AntdDropdown)`
  &:not(.ant-dropdown-open) > svg {
    transform: rotate(-180deg);
  }
`;

const CreateMenuItem = styled.div`
  display: flex;
  align-items: center;
  font-size: 13px;
  line-height: 13px;
  height: 16px;
`;

const CreateBtn = styled(TacoButton)`
  width: auto;
  min-width: 100px;
  height: 36px;
  padding: 0 16px;
  margin-left: 0;
  border-radius: 10px;

  & > svg {
    width: 16px;
    height: 16px;

    path {
      fill: currentColor;
    }
  }
`;

const LayoutPickWrapper = styled.div`
  display: flex;
  align-items: center;

  > div:not(:last-child) {
    margin-right: 8px;
  }
`;

const LayoutItemWrapper = styled.div`
  background: #f9fafb;
  cursor: pointer;
  width: 184px;
  border: 1px solid #eeeeee;
  border-radius: 4px;
  display: flex;
  align-items: center;
  flex-direction: column;

  &:hover {
    border: 1px solid ${ActiveTextColor};

    ${CommonTextLabel} {
      color: ${ActiveTextColor};
    }
  }

  .icon-div {
    border-radius: 3px 3px 0 0;
    background: #f2f5f7;
    height: 87px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      height: 48px;
      width: 48px;
    }
  }

  .label-div {
    width: 100%;
    padding: 12px 12px 8px 12px;

    ${CommonTextLabel} {
      margin-bottom: 5px;
    }

    ${CommonGrayLabel} {
      line-height: 19px;
    }
  }
`;

const NavigationTypeInfo: Record<NavigationType, FunctionComponent<any>> = {
  [HomeResTypeEnum.MobileTabLayout]: MobileNavIcon,
  [HomeResTypeEnum.NavLayout]: PcNavIcon,
};

function NavLayoutPickModal(props: {
  onCreate: (type: NavigationType) => void;
  visible: boolean;
  setVisible: (v: boolean) => void;
}) {
  const { visible, setVisible, onCreate } = props;
  return (
    <CustomModal
      open={visible}
      footer={null}
      onCancel={() => setVisible(false)}
      title={trans("home.createNavigation")}
      width={360}
    >
      <CommonGrayLabel style={{ fontSize: "14px", lineHeight: "14px", margin: "4px 0 8px 0" }}>
        {trans("home.chooseNavType")}
      </CommonGrayLabel>
      <LayoutPickWrapper>
        {NavigationTypes.map((type) => {
          const Icon = NavigationTypeInfo[type];
          return (
            <LayoutItemWrapper
              key={type}
              onClick={() => {
                setVisible(false);
                onCreate(type);
              }}
            >
              <div className="icon-div">{<Icon />}</div>
              <div className="label-div">
                <CommonTextLabel>{HomeResInfo[type].name}</CommonTextLabel>
                <CommonGrayLabel>{HomeResInfo[type].desc}</CommonGrayLabel>
              </div>
            </LayoutItemWrapper>
          );
        })}
      </LayoutPickWrapper>
    </CustomModal>
  );
}

export const CreateDropdown = (props: { defaultVisible?: boolean; mode: HomeLayoutMode; setModify: any; modify: boolean }) => {
  const { defaultVisible, mode, setModify, modify} = props;
  const [createDropdownVisible, setCreateDropdownVisible] = useState(Boolean(defaultVisible));
  const [layoutPickerVisible, setLayoutPickerVisible] = useState(false);

  // The tutorial opens this menu initially and dismisses it when the guide ends.
  useEffect(() => setCreateDropdownVisible(Boolean(defaultVisible)), [defaultVisible]);

  const user = useSelector(getUser);

  const [handleCreate, isCreating] = useCreateHomeRes(setModify, modify);

  const getCreateMenuItem = (type: HomeResTypeEnum, mode?: HomeLayoutMode): ItemType => {
    if (
      (type === HomeResTypeEnum.Application ||
        type === HomeResTypeEnum.Navigation ||
        type === HomeResTypeEnum.Module) &&
      !(mode === "view" || mode === "module" || mode === "folder")
    ) {
      return null;
    }

    if (
      type === HomeResTypeEnum.Folder &&
      !(mode === "view" || mode === "module" || mode === "folder" || mode === "folders")
    ) {
      return null;
    }

    const Icon = HomeResInfo[type].icon;
    return {
      label: (
        <CreateMenuItem
          className={type === HomeResTypeEnum.Application ? createAppItemClass : undefined}
        >
          {Icon && <Icon aria-hidden="true" style={{ width: "16px", height: "16px", marginRight: "4px" }} />}
          {HomeResInfo[type].name}
        </CreateMenuItem>
      ),
      key: type,
      onClick: () => {
        if (type === HomeResTypeEnum.Navigation) {
          setLayoutPickerVisible(true);
        } else {
          handleCreate(type);
        }
      },
    };
  };

  return (
    <>
      <NavLayoutPickModal
        onCreate={(type) => handleCreate(type)}
        visible={layoutPickerVisible}
        setVisible={setLayoutPickerVisible}
      />
      <Dropdown
        open={createDropdownVisible}
        trigger={["click"]}
        placement="bottomRight"
        autoFocus
        // Portaling into the button traps the menu underneath the resource cards.
        getPopupContainer={(node) => node.ownerDocument.body}
        onOpenChange={setCreateDropdownVisible}
        overlayStyle={{ minWidth: 180 }}
        menu={{
          items: [
            getCreateMenuItem(HomeResTypeEnum.Application, mode),
            getCreateMenuItem(HomeResTypeEnum.Module, mode),
            getCreateMenuItem(HomeResTypeEnum.Navigation, mode),
            getCreateMenuItem(HomeResTypeEnum.Folder, mode),
            mode === "view" || mode === "module" || mode === "folder"
              ? {
                  label: (
                    <AppImport orgId={user.currentOrgId}>
                      <CreateMenuItem>
                        <ImportIconV2 aria-hidden="true" width="16px" height="16px" style={{ marginRight: "4px" }} />
                        {trans("home.import")}
                      </CreateMenuItem>
                    </AppImport>
                  ),
                  key: "import",
                  style: { height: "32px" },
                }
              : null,
          ],
        }}
      >
        <CreateBtn buttonType="primary" aria-haspopup="menu" aria-expanded={createDropdownVisible}>
          {isCreating ? trans("home.creating") : trans("newItem")}
          <PackUpIcon aria-hidden="true" />
        </CreateBtn>
      </Dropdown>
    </>
  );
};
