import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { default as Menu } from "antd/es/menu";
import { ColumnTypeCompBuilder } from "comps/comps/tableComp/column/columnTypeCompBuilder";
import { BoolCodeControl, StringControl } from "comps/controls/codeControl";
import { manualOptionsControl } from "comps/controls/optionsControl";
import { MultiCompBuilder } from "comps/generators";
import { disabledPropertyView, hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import styled from "styled-components";
import { ColumnLink } from "comps/comps/tableComp/column/columnTypeComps/columnLinkComp";
import { LightActiveTextColor, PrimaryColor } from "constants/style";
import { clickEvent, eventHandlerControl } from "comps/controls/eventHandlerControl";
import { migrateOldData } from "@lowcoder-ee/comps/generators/simpleGenerators";
import { fixOldActionData } from "comps/comps/tableComp/column/simpleColumnTypeComps";

const MenuLinkWrapper = styled.div`
  > a {
    color: ${PrimaryColor} !important;

    &:hover {
      color: ${LightActiveTextColor} !important;
    }
  }
`;

const MenuWrapper = styled.div`
  ul {
    background: transparent !important;
    border-bottom: 0;

    li {
      padding: 0 10px 0 0 !important;
      line-height: normal !important;

      &::after {
        content: none !important;
      }
    }
  }  
`;

const LinkEventOptions = [clickEvent] as const;

// Memoized menu item component
const MenuItem = React.memo(({ option, index }: { option: any; index: number }) => {
  const handleClick = useCallback(() => {
    if (!option.disabled && option.onClick) {
      option.onClick("click");
    }
  }, [option.disabled, option.onClick]);

  return (
    <MenuLinkWrapper>
      <ColumnLink
        disabled={option.disabled}
        label={option.label}
        onClick={handleClick}
      />
    </MenuLinkWrapper>
  );
});

MenuItem.displayName = 'MenuItem';

const OptionItemTmp = new MultiCompBuilder(
  {
    label: StringControl,
    onClick: eventHandlerControl(LinkEventOptions),
    hidden: BoolCodeControl,
    disabled: BoolCodeControl,
  },
  (props) => {
    return props;
  }
)
  .setPropertyViewFn((children) => {
    return (
      <>
        {children.label.propertyView({ label: trans("label") })}
        {hiddenPropertyView(children)}
        {disabledPropertyView(children)}
        {children.onClick.propertyView()}
      </>
    );
  })
  .build();

const OptionItem = migrateOldData(OptionItemTmp, fixOldActionData);

// Memoized menu component
const LinksMenu = React.memo(({ options }: { options: any[] }) => {
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const menuItems = useMemo(() => 
    options
      .filter((o) => !o.hidden)
      .map((option, index) => ({
        key: index,
        label: <MenuItem option={option} index={index} />
      })),
    [options]
  );

  return (
    <MenuWrapper>
      <Menu mode="horizontal" items={menuItems} />
    </MenuWrapper>
  );
});

LinksMenu.displayName = 'LinksMenu';

const ColumnLinksCompTmp = (function () {
  const childrenMap = {
    options: manualOptionsControl(OptionItem, {
      initOptions: [{ label: trans("table.option1") }],
    }),
  };
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props) => {
      return <LinksMenu options={props.options} />;
    },
    () => ""
  )
    .setPropertyViewFn((children) => (
      <>
        {children.options.propertyView({
          newOptionLabel: trans("table.option"),
          title: trans("table.optionList"),
        })}
      </>
    ))
    .build();
})();

export const ColumnLinksComp = migrateOldData(ColumnLinksCompTmp, fixOldActionData);
