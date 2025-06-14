import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { default as Menu } from "antd/es/menu";
import { ColumnTypeCompBuilder } from "comps/comps/tableComp/column/columnTypeCompBuilder";
import { ActionSelectorControlInContext } from "comps/controls/actionSelector/actionSelectorControl";
import { BoolCodeControl, StringControl } from "comps/controls/codeControl";
import { manualOptionsControl } from "comps/controls/optionsControl";
import { MultiCompBuilder } from "comps/generators";
import { disabledPropertyView, hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import styled from "styled-components";
import { ColumnLink } from "comps/comps/tableComp/column/columnTypeComps/columnLinkComp";
import { LightActiveTextColor, PrimaryColor } from "constants/style";
import { clickEvent, eventHandlerControl } from "comps/controls/eventHandlerControl";

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

const LinksEventOptions = [clickEvent] as const;

// Update OptionItem to include event handlers
const OptionItem = new MultiCompBuilder(
  {
    label: StringControl,
    onClick: ActionSelectorControlInContext,
    hidden: BoolCodeControl,
    disabled: BoolCodeControl,
    onEvent: eventHandlerControl(LinksEventOptions),
  },
  (props) => {
    return props;
  }
)
  .setPropertyViewFn((children) => {
    return (
      <>
        {children.label.propertyView({ label: trans("label") })}
        {children.onClick.propertyView({
          label: trans("table.action"),
          placement: "table",
        })}
        {hiddenPropertyView(children)}
        {disabledPropertyView(children)}
        {/* {children.onEvent.propertyView()} */}
      </>
    );
  })
  .build();

// Memoized menu item component
const MenuItem = React.memo(({ option, index, onMainEvent }: { option: any; index: number; onMainEvent?: (eventName: string) => void }) => {
  const handleClick = useCallback(() => {
    if (!option.disabled) {
      if (option.onClick) {
        option.onClick();
      }
      // if (option.onEvent) {
      //   option.onEvent("click");
      // }
      // Trigger the main component's event handler
      if (onMainEvent) {
        onMainEvent("click");
      }
    }
  }, [option.disabled, option.onClick, option.onEvent, onMainEvent]);

  return (
    <MenuLinkWrapper>
      <ColumnLink
        disabled={option.disabled}
        label={option.label}
        onEvent={handleClick}
      />
    </MenuLinkWrapper>
  );
});

MenuItem.displayName = 'MenuItem';

// Memoized menu component
const LinksMenu = React.memo(({ options, onEvent }: { options: any[]; onEvent?: (eventName: string) => void }) => {
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
        label: <MenuItem option={option} index={index} onMainEvent={onEvent} />
      })),
    [options, onEvent]
  );

  return (
    <MenuWrapper>
      <Menu mode="horizontal" items={menuItems} />
    </MenuWrapper>
  );
});

LinksMenu.displayName = 'LinksMenu';

export const ColumnLinksComp = (function () {
  const childrenMap = {
    options: manualOptionsControl(OptionItem, {
      initOptions: [{ label: trans("table.option1") }],
    }),
    onEvent: eventHandlerControl(LinksEventOptions),
  };
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props) => {
      return <LinksMenu options={props.options} onEvent={props.onEvent} />;
    },
    () => ""
  )
    .setPropertyViewFn((children) => (
      <>
        {children.options.propertyView({
          newOptionLabel: trans("table.option"),
          title: trans("table.optionList"),
        })}
        {children.onEvent.propertyView()}
      </>
    ))
    .build();
})();
