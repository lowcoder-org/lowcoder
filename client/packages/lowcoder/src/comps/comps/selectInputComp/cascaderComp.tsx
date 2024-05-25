import { default as Cascader } from "antd/es/cascader";
import { CascaderStyleType, ChildrenMultiSelectStyleType } from "comps/controls/styleControlConstants";
import { blurMethod, focusMethod } from "comps/utils/methodUtils";
import { trans } from "i18n";
import styled from "styled-components";
import { UICompBuilder, withDefault } from "../../generators";
import { CommonNameConfig, NameConfig, withExposingConfigs } from "../../generators/withExposing";
import { CascaderChildren, CascaderPropertyView, defaultDataSource } from "./cascaderContants";
import { refMethods } from "comps/generators/withMethodExposing";

const CascaderStyle = styled(Cascader)<{ $style: CascaderStyleType,$childrenInputFieldStyle:ChildrenMultiSelectStyleType }>`
  width: 100%;
  font-family:"Montserrat";
  ${(props) => { return props.$style && { ...props.$style, 'border-radius': props.$style.radius } }}
`;

const DropdownRenderStyle = styled.div<{ $childrenInputFieldStyle: ChildrenMultiSelectStyleType }>`
 background-color: ${props => props.$childrenInputFieldStyle?.background};
    border: ${props => props.$childrenInputFieldStyle?.border};
    border-style: ${props => props.$childrenInputFieldStyle?.borderStyle};
    border-width: ${props => props.$childrenInputFieldStyle?.borderWidth};
    border-radius: ${props => props.$childrenInputFieldStyle?.radius};
    rotate: ${props => props.$childrenInputFieldStyle?.rotation};
    margin: ${props => props.$childrenInputFieldStyle?.margin};
    padding: ${props => props.$childrenInputFieldStyle?.padding};
    .ant-cascader-menu-item-content{
    font-size: ${props => props.$childrenInputFieldStyle?.textSize};
    font-style: ${props => props.$childrenInputFieldStyle?.fontStyle};
    font-family: ${props => props.$childrenInputFieldStyle?.fontFamily};
    font-weight: ${props => props.$childrenInputFieldStyle?.textWeight};
    text-transform: ${props => props.$childrenInputFieldStyle?.textTransform};
    text-decoration: ${props => props.$childrenInputFieldStyle?.textDecoration};
    color: ${props => props.$childrenInputFieldStyle?.text};
    }
`

let CascaderBasicComp = (function () {
  const childrenMap = CascaderChildren;

  return new UICompBuilder(childrenMap, (props) => {
    return props.label({
      style: props.style,
      labelStyle: props.labelStyle,
      inputFieldStyle:props.inputFieldStyle,
      childrenInputFieldStyle:props.childrenInputFieldStyle,
      animationStyle:props.animationStyle,
      children: (
        <CascaderStyle
          ref={props.viewRef}
          value={props.value.value}
          disabled={props.disabled}
          defaultValue={props.value.value}
          options={props.options}
          allowClear={props.allowClear}
          placeholder={props.placeholder}
          showSearch={props.showSearch}
          $style={props.inputFieldStyle}
          $childrenInputFieldStyle={props.childrenInputFieldStyle}
          onFocus={() => props.onEvent("focus")}
          onBlur={() => props.onEvent("blur")}
          dropdownRender={(menus: React.ReactNode) => (
  <DropdownRenderStyle $childrenInputFieldStyle={props.childrenInputFieldStyle}>
    {menus}
            </DropdownRenderStyle>
          )}
          onChange={(value: (string | number)[]) => {
            props.value.onChange(value as string[]);
            props.onEvent("change");
          }}
        />
      ),
    });
  })
    .setPropertyViewFn((children) => (
      <>
        <CascaderPropertyView {...children} />
      </>
    ))
    .setExposeMethodConfigs(refMethods([focusMethod, blurMethod]))
    .build();
})();

const CascaderComp = withExposingConfigs(CascaderBasicComp, [
  new NameConfig("value", trans("selectInput.valueDesc")),
  ...CommonNameConfig,
]);

export const CascaderWithDefault = withDefault(CascaderComp, {
  options: defaultDataSource,
});
