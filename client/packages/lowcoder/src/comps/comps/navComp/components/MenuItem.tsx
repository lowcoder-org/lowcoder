import { ActiveTextColor, GreyTextColor } from "constants/style";
import { EditPopover, SimplePopover } from "lowcoder-design";
import { PointIcon } from "lowcoder-design";
import React, { useState } from "react";
import styled from "styled-components";
import { NavCompType } from "comps/comps/navComp/components/types";
import { trans } from "i18n";

export interface IMenuItemProps {
  item: NavCompType;
  onDelete?: () => void;
  onAddSubMenu?: () => void;
  showAddSubMenu?: boolean;
}

const MenuItemWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MenuItemContent = styled.div`
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
  flex: 1;
  color: #333;
  font-size: 13px;
`;

const StyledPointIcon = styled(PointIcon)`
  color: ${GreyTextColor};

  &:hover {
    color: ${ActiveTextColor};
  }
`;

const MenuItem: React.FC<IMenuItemProps> = (props) => {
  const {
    item,
    onDelete,
    onAddSubMenu,
    showAddSubMenu = true,
  } = props;

  const [isConfigPopShow, showConfigPop] = useState(false);

  const handleDel = () => {
    onDelete?.();
  };

  const handleAddSubMenu = () => {
    onAddSubMenu?.();
  };

  const content = <MenuItemWrapper>{item.getPropertyView()}</MenuItemWrapper>;

  return (
    <>
      <SimplePopover
        title={trans("edit")}
        content={content}
        visible={isConfigPopShow}
        setVisible={showConfigPop}
      >
        <MenuItemContent>{item.children.label.getView()}</MenuItemContent>
      </SimplePopover>
      <EditPopover
        del={handleDel}
        add={showAddSubMenu && onAddSubMenu ? handleAddSubMenu : undefined}
        addText={trans("navigation.addText")}
      >
        <StyledPointIcon />
      </EditPopover>
    </>
  );
};

export default MenuItem;
