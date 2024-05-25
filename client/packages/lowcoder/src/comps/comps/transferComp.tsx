import { CompAction, RecordConstructorToView, changeChildAction } from "lowcoder-core";
import { BoolControl } from "comps/controls/boolControl";
import { arrayObjectExposingStateControl, arrayStringExposingStateControl } from "comps/controls/codeStateControl";
import { styleControl } from "comps/controls/styleControl";
import { TransferStyle, TransferStyleType, heightCalculator, widthCalculator } from "comps/controls/styleControlConstants";
import { UICompBuilder } from "comps/generators/uiCompBuilder";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import { Section, sectionNames } from "lowcoder-design";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { NumberControl, StringControl } from "comps/controls/codeControl";
import { Transfer } from "antd";
import ReactResizeDetector from "react-resize-detector";
import { changeEvent, eventHandlerControl, searchEvent, selectedChangeEvent } from "../controls/eventHandlerControl";
import styled, { css } from "styled-components";
import { useEffect, useRef, useState } from "react";
import { valueComp, withDefault } from "../generators";
import type { TransferDirection } from 'antd/es/transfer';
import { _ } from "core-js";


const Container = styled.div<{ $style: TransferStyleType }>`
  height: 100%;
  width: 100%;
  ${(props) => props.$style && getStyle(props.$style)}
`;

const getStyle = (style: TransferStyleType) => {
  return css`
    margin: ${style.margin};
    padding: ${style.padding};
    border-style: ${style.borderStyle};
    border-width: ${style.borderWidth};
    border-color: ${style.border};
    background: ${style.background};
    border-radius: ${style.radius};
    max-width: ${widthCalculator(style.margin)};
    max-height: ${heightCalculator(style.margin)};
  `;
};

interface RecordType {
  key: string;
  title: string;
  description?: string;
}
const defaultItems = [
  { key: '1', title: trans('transfer.content', { i: 1 }) },
  { key: '2', title: trans('transfer.content', { i: 2 }) },
  { key: '3', title: trans('transfer.content', { i: 3 }) },
  { key: '4', title: trans('transfer.content', { i: 4 }) },
  { key: '5', title: trans('transfer.content', { i: 5 }) },
  { key: '6', title: trans('transfer.content', { i: 6 }) },
  { key: '7', title: trans('transfer.content', { i: 7 }) },
] as const

const EventOptions = [changeEvent, searchEvent, selectedChangeEvent] as const;

const childrenMap = {
  style: styleControl(TransferStyle),
  onEvent: eventHandlerControl(EventOptions),
  sourceTitle: withDefault(StringControl, trans('transfer.sourceTitle')),
  targetTitle: withDefault(StringControl, trans('transfer.targetTitle')),
  oneWay: BoolControl,
  pagination: BoolControl,
  showSearch: BoolControl.DEFAULT_TRUE,
  pageSize: withDefault(NumberControl, 10),
  items: arrayObjectExposingStateControl('items', defaultItems as any),
  targetKeys: arrayStringExposingStateControl('targetKeys', []),
  selectedKeys: valueComp<any>([[], []]),
  targerObject: valueComp<any>([]),
  searchInfo: valueComp<string[]>(['', '']),
};

const TransferView = (props: RecordConstructorToView<typeof childrenMap> & {
  dispatch: (action: CompAction) => void;
}) => {
  const conRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  useEffect(() => {
    if (height && width) {
      onResize();
    }
  }, [height, width]);

  const handleChange = (newTargetKeys: string[]) => {
    props.targetKeys.onChange(newTargetKeys);
    props.dispatch(changeChildAction("targerObject", Array.isArray(props.items.value) ? props.items.value.filter(item => newTargetKeys.includes(item.key as string)) : [], false));
    props.onEvent('change')
  };

  const onSelectChange = (sourceSelectedKeys: string[], targetSelectedKeys: string[]) => {
    setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys]);
    props.dispatch(changeChildAction("selectedKeys", [sourceSelectedKeys, targetSelectedKeys], false));
    props.onEvent('selectedChange')
  };

  const handleSearch = (dir: TransferDirection, value: string) => {
    props.dispatch(changeChildAction("searchInfo", [dir, value], false));
    props.onEvent('search')
  };

  const onResize = () => {
    const container = conRef.current;
    setWidth(container?.clientWidth ?? 0);
    setHeight(container?.clientHeight ?? 0);
  };
  
  return (
    <ReactResizeDetector onResize={onResize}>
      <Container
        ref={conRef}
        $style={props.style}
      >
        <Transfer
          listStyle={{
            width: width,
            height: height,
          }}
          showSearch={props.showSearch}
          dataSource={props.items.value as any}
          titles={[props.targetTitle, props.sourceTitle]}
          targetKeys={props.targetKeys.value}
          selectedKeys={selectedKeys}
          onChange={handleChange}
          onSelectChange={onSelectChange}
          render={(item: RecordType) => item.title}
          oneWay={props.oneWay}
          onSearch={handleSearch}
          pagination={props.pagination ? {
            pageSize: props.pageSize || 10,
          } : false}
        />
      </Container>
    </ReactResizeDetector>
  );
};

let TransferBasicComp = (function () {
  return new UICompBuilder(childrenMap, (props, dispatch) => <TransferView {...props} dispatch={dispatch} />)
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.items.propertyView({
            label: trans("transfer.items"),
          })}
          {children.targetKeys.propertyView({
            label: trans("transfer.targetKeys"),
          })}
          {children.sourceTitle.propertyView({
            label: trans("transfer.sourceTitle"),
          })}
          {children.targetTitle.propertyView({
            label: trans("transfer.targetTitle"),
          })}
          {children.showSearch.propertyView({
            label: trans("transfer.allowSearch"),
          })}
          {children.oneWay.propertyView({
            label: trans("transfer.oneWay"),
          })}
          {children.pagination.propertyView({
            label: trans("transfer.pagination"),
          })}
          {children.pagination.getView() && children.pageSize.propertyView({
            label: trans("transfer.pageSize"),
          })}
        </Section>
        <Section name={sectionNames.layout}>
          {children.onEvent.propertyView()}
          {hiddenPropertyView(children)}
        </Section>
        <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
      </>
    ))
    .build();
})();

TransferBasicComp = class extends TransferBasicComp {
  override autoHeight(): boolean {
    return false;
  }
};

export const transferComp = withExposingConfigs(TransferBasicComp, [
  new NameConfig("items", trans("transfer.items")),
  new NameConfig("targetKeys", trans("transfer.targetKeys")),
  new NameConfig("targerObject", trans("transfer.targerObject")),
  new NameConfig("selectedKeys", trans("transfer.selectedKeys")),
  new NameConfig("searchInfo", trans("transfer.searchInfo")),
  NameConfigHidden,
]);
