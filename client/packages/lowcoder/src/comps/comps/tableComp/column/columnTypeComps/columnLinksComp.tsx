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

const OptionItem = new MultiCompBuilder(
  {
    label: StringControl,
    onClick: ActionSelectorControlInContext,
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
        {children.onClick.propertyView({
          label: trans("table.action"),
          placement: "table",
        })}
        {hiddenPropertyView(children)}
        {disabledPropertyView(children)}
      </>
    );
  })
  .build();

export const ColumnLinksComp = (function () {
  const childrenMap = {
    options: manualOptionsControl(OptionItem, {
      initOptions: [{ label: trans("table.option1") }],
    }),
  };
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props) => {
      const menuItems = props.options
        .filter((o) => !o.hidden)
        .map((option, index) => (
          {
            key: index,
            label: (
              <MenuLinkWrapper>
                <ColumnLink
                  disabled={option.disabled}
                  label={option.label}
                  onClick={option.onClick}
                />
              </MenuLinkWrapper>
            )
          }
        ));

      return (
        <MenuWrapper>
          <Menu mode="horizontal" items={menuItems}  />
        </MenuWrapper>
      )
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
