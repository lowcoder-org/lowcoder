import { BoolCodeControl } from "comps/controls/codeControl";
import { trans } from "i18n";
import { default as Checkbox } from "antd/es/checkbox";
import { ColumnTypeCompBuilder, ColumnTypeViewFn } from "../columnTypeCompBuilder";
import { ColumnValueTooltip } from "../simpleColumnTypeComps";
import { getStyle } from "comps/comps/selectInputComp/checkboxComp";
import styled from "styled-components";
import { CheckboxStyle, CheckboxStyleType } from "comps/controls/styleControlConstants";
import { useStyle } from "comps/controls/styleControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { TableCheckedIcon, TableUnCheckedIcon } from "lowcoder-design";
import { IconControl } from "comps/controls/iconControl";
import { hasIcon } from "comps/utils";

const CheckboxStyled = styled(Checkbox)<{ $style: CheckboxStyleType }>`
  ${(props) => props.$style && getStyle(props.$style)}
`;

const Wrapper = styled.div`
  background: transparent !important;
  padding: 0 8px;
`;

const IconWrapper = styled.div<{ $style: CheckboxStyleType; $ifChecked: boolean }>`
  pointer-events: none;
  height: 22px;
  svg {
    width: 14px;
    height: 22px;
    g {
      stroke: ${(props) => props.$ifChecked && props.$style.checkedBackground} !important;
    }
  }
`;

const falseValuesOptions = [
  {
    label: trans("table.empty"),
    value: "",
  },
  {
    label: "-",
    value: "-",
  },
  {
    label: <TableUnCheckedIcon width={10} height={10} />,
    value: "x",
  },
] as const;

const childrenMap = {
  text: BoolCodeControl,
  falseValues: dropdownControl(falseValuesOptions, ""),
  iconTrue: IconControl,
  iconFalse: IconControl,
  iconNull: IconControl,
};

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, boolean, boolean> = (props) => props.text;

type CheckBoxEditPropsType = {
  value: boolean;
  onChange: (value: boolean) => void;
  onChangeEnd: () => void;
};

const CheckBoxEdit = (props: CheckBoxEditPropsType) => {
  const style = useStyle(CheckboxStyle);
  return (
    <Wrapper
      onBlur={() => props.onChangeEnd()}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          props.onChangeEnd();
        }
      }}
    >
      <CheckboxStyled
        autoFocus
        $style={style}
        defaultChecked={props.value}
        onChange={(e) => props.onChange(e.target.checked)}
      />
    </Wrapper>
  );
};

export const BooleanComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      const value = props.changeValue ?? getBaseValue(props, dispatch);
      const CheckBoxComp = () => {
        const style = useStyle(CheckboxStyle);
        return (
          <IconWrapper $style={style} $ifChecked={value}>
            {value === true ? ( hasIcon(props.iconTrue) ? props.iconTrue : <TableCheckedIcon /> ) 
            : value === false ? ( hasIcon(props.iconFalse) ? props.iconFalse  : ( props.falseValues === "x" ? <TableUnCheckedIcon /> : props.falseValues )
            ) : ( hasIcon(props.iconNull) ? props.iconNull : "No Value"
            )}
          </IconWrapper>
        );
      };
      return <CheckBoxComp />;
    },
    (nodeValue) => nodeValue.text.value,
    getBaseValue
  )
    .setEditViewFn((props) => {
      return (
        <CheckBoxEdit
          value={props.value}
          onChange={props.onChange}
          onChangeEnd={props.onChangeEnd}
        />
      );
    })
    .setPropertyViewFn((children) => {
      return (
        <>
          {children.text.propertyView({
            label: trans("table.columnValue"),
            tooltip: ColumnValueTooltip,
          })}
          {children.falseValues.propertyView({
            label: trans("table.falseValues"),
            radioButton: true,
          })}
          {children.iconTrue.propertyView({
            label: trans("table.iconTrue"),
          })}
          {children.iconFalse.propertyView({
            label: trans("table.iconFalse"),
          })}
          {children.iconNull.propertyView({
            label: trans("table.iconNull"),
          })}
        </>
      );
    })
    .build();
})();
